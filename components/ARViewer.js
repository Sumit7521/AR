"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default function ARViewer({
  modelName = "damaged-helmet",
  scale = 1.0,
  autoRotate = false,
  onTrackingChange,
  onTelemetryUpdate,
}) {
  const containerRef = useRef(null);
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isFound, setIsFound] = useState(false);
  const [isHttpsOk, setIsHttpsOk] = useState(true);
  
  const mindarRef = useRef(null);
  const currentModelRef = useRef(null);
  const mixerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Check secure context on mount
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== "undefined") {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const isSecure = window.isSecureContext || isLocalhost;
      setIsHttpsOk(isSecure);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const stopAR = () => {
    if (mindarRef.current) {
      try {
        const { renderer } = mindarRef.current;
        if (renderer) renderer.setAnimationLoop(null);
        mindarRef.current.stop();
      } catch (e) {
        console.warn("Error stopping MindAR:", e);
      }
      mindarRef.current = null;
    }

    if (containerRef.current) {
      const videos = containerRef.current.querySelectorAll("video");
      videos.forEach((v) => {
        if (v.srcObject) {
          v.srcObject.getTracks().forEach((track) => track.stop());
        }
      });
      containerRef.current.innerHTML = "";
    }
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }
    setIsStarted(false);
    setIsFound(false);
    if (onTrackingChange) onTrackingChange(false);
  };

  const startAR = async () => {
    try {
      setLoading(true);
      setCameraError(null);
      stopAR();

      if (!containerRef.current) return;

      // Dynamically import MindAR (browser only)
      const { MindARThree } = await import("mind-ar/dist/mindar-image-three.prod.js");

      if (!isMountedRef.current || !containerRef.current) return;

      const mindarThree = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: "/targets/card.mind",
        filterMinCF: 0.001,
        filterBeta: 10,
        missTolerance: 5,
        warmupTolerance: 5,
        uiScanning: "no",
        uiLoading: "no",
      });

      mindarRef.current = mindarThree;

      const { renderer, scene, camera } = mindarThree;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;

      // Lights
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 1.4);
      scene.add(hemiLight);

      const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.2);
      dirLight1.position.set(2, 3, 2);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x9d4edd, 1.6);
      dirLight2.position.set(-2, -1, -2);
      scene.add(dirLight2);

      // Anchor 0
      const anchor = mindarThree.addAnchor(0);

      // Initial Hologram Mesh on Anchor (guaranteed 3D visibility immediately upon tracking)
      const group = new THREE.Group();
      const geom = new THREE.TorusKnotGeometry(0.2, 0.06, 80, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x003344,
      });
      const anchorMesh = new THREE.Mesh(geom, mat);
      anchorMesh.position.y = 0.2;
      group.add(anchorMesh);
      anchor.group.add(group);
      currentModelRef.current = group;

      // Load GLTF Model with ngrok header & animation support
      const loader = new GLTFLoader();
      loader.setRequestHeader({ "ngrok-skip-browser-warning": "true" });
      const modelPath = `/models/${modelName}.glb`;

      loader.load(
        modelPath,
        (gltf) => {
          if (!isMountedRef.current) return;
          
          while (group.children.length > 0) {
            group.remove(group.children[0]);
          }

          const model = gltf.scene;

          // Set up AnimationMixer if the model contains animations (e.g. Drone Explode)
          if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
              const action = mixer.clipAction(clip);
              action.setLoop(THREE.LoopOnce, 1);
              action.clampWhenFinished = true;
              action.play();
            });
            mixerRef.current = mixer;
          } else {
            mixerRef.current = null;
          }

          // Rotate 90 degrees on X-axis so drone lies flat facing upwards
          model.rotation.x = Math.PI / 2;
          model.updateMatrixWorld(true);

          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          // Scale proportionally so it fits directly on top of the card
          const normScale = maxDim > 0 ? (1.05 / maxDim) * scale : 1.0;
          model.scale.setScalar(normScale);

          // Center precisely on card (X and Y centered, Z resting on card surface)
          model.position.x = -center.x * normScale;
          model.position.y = -center.y * normScale;
          model.position.z = (-box.min.z) * normScale + 0.02;

          group.add(model);
        },
        undefined,
        (err) => {
          console.warn("GLTF load error in AR (fallback active):", err);
        }
      );

      let trackingActive = false;

      anchor.onTargetFound = () => {
        if (!isMountedRef.current) return;
        trackingActive = true;
        setIsFound(true);
        if (onTrackingChange) onTrackingChange(true);
      };

      anchor.onTargetLost = () => {
        if (!isMountedRef.current) return;
        trackingActive = false;
        setIsFound(false);
        if (onTrackingChange) onTrackingChange(false);
      };

      // Start Camera Stream & Tracker
      await mindarThree.start();

      // Ensure playsinline for iOS Safari
      if (containerRef.current) {
        const video = containerRef.current.querySelector("video");
        if (video) {
          video.setAttribute("playsinline", "true");
          video.setAttribute("webkit-playsinline", "true");
          video.setAttribute("autoplay", "true");
          video.setAttribute("muted", "true");
          video.play().catch((e) => console.warn("Video play error:", e));
        }
      }

      setIsStarted(true);
      setLoading(false);

      // 6DoF Telemetry & Animation Clock Variables
      const clock = new THREE.Clock();
      const targetWorldPos = new THREE.Vector3();
      const targetWorldQuat = new THREE.Quaternion();
      const euler = new THREE.Euler();
      let lastTime = performance.now();
      let frames = 0;
      let currentFps = 60;

      renderer.setAnimationLoop(() => {
        if (!isMountedRef.current) return;

        const delta = clock.getDelta();

        // Update GLTF Animation if active
        if (mixerRef.current) {
          mixerRef.current.update(delta);
        }

        if (currentModelRef.current && autoRotate) {
          currentModelRef.current.rotation.y += 0.01;
        }

        if (trackingActive && onTelemetryUpdate && anchor.group) {
          anchor.group.getWorldPosition(targetWorldPos);
          anchor.group.getWorldQuaternion(targetWorldQuat);
          euler.setFromQuaternion(targetWorldQuat, "YXZ");

          const distance = camera.position.distanceTo(targetWorldPos);

          frames++;
          const now = performance.now();
          if (now >= lastTime + 1000) {
            currentFps = Math.round((frames * 1000) / (now - lastTime));
            frames = 0;
            lastTime = now;
          }

          onTelemetryUpdate({
            position: {
              x: targetWorldPos.x,
              y: targetWorldPos.y,
              z: targetWorldPos.z,
            },
            rotation: {
              pitch: THREE.MathUtils.radToDeg(euler.x),
              yaw: THREE.MathUtils.radToDeg(euler.y),
              roll: THREE.MathUtils.radToDeg(euler.z),
            },
            distance: distance,
            fps: currentFps,
          });
        }

        renderer.render(scene, camera);
      });
    } catch (err) {
      console.error("MindAR initialization failed:", err);
      if (isMountedRef.current) {
        setCameraError(
          err.name === "NotAllowedError"
            ? "Camera permission was denied. Please allow camera permissions in your browser settings."
            : `AR Camera Error: ${err.message || "Failed to access camera"}`
        );
        setLoading(false);
      }
    }
  };

  // Cleanup when unmounting
  useEffect(() => {
    return () => {
      stopAR();
    };
  }, []);

  // Reload model when modelName changes while running
  useEffect(() => {
    if (isStarted) {
      startAR();
    }
  }, [modelName]);

  // Adjust model scale smoothly
  useEffect(() => {
    if (currentModelRef.current) {
      const box = new THREE.Box3().setFromObject(currentModelRef.current);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const normScale = (0.75 / maxDim) * scale;
        currentModelRef.current.scale.setScalar(normScale);
      }
    }
  }, [scale]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Three.js / MindAR Video & WebGL Canvas Container */}
      <div ref={containerRef} className="ar-canvas-container" />

      {/* Start Camera Gate */}
      {!isStarted && !loading && (
        <div className="ar-start-overlay">
          <div className="ar-start-card">
            <div className="ar-start-icon">📷✨</div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px", color: "var(--accent-cyan)" }}>
              6DoF AR Camera
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: "1.4" }}>
              Anchor 3D models with 6 Degrees of Freedom tracking onto the target marker card.
            </p>

            {!isHttpsOk && (
              <div className="https-warning">
                ⚠️ <b>Insecure HTTP Detected</b>: Mobile browsers require <b>HTTPS</b> (e.g. your ngrok URL) to enable the camera.
              </div>
            )}

            {cameraError && (
              <div className="camera-err-msg">
                {cameraError}
              </div>
            )}

            <button
              type="button"
              className="btn-start-ar"
              onClick={startAR}
            >
              <span>📸</span> Launch AR Camera
            </button>
          </div>
        </div>
      )}

      {/* Scanning Reticle when running and looking for marker */}
      {isStarted && !isFound && !loading && (
        <div className="reticle-overlay">
          <div className="reticle-box">
            <div className="reticle-corner tl" />
            <div className="reticle-corner tr" />
            <div className="reticle-corner bl" />
            <div className="reticle-corner br" />
          </div>
          <div className="reticle-text">SCANNING FOR TARGET CARD</div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="ar-loader" style={{ pointerEvents: "none" }}>
          <div className="spinner" />
          <div style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
            Starting AR Camera & Neural Tracker...
          </div>
        </div>
      )}

      {/* Floating Stop Button when AR is active */}
      {isStarted && (
        <button
          type="button"
          className="ar-stop-btn"
          onClick={stopAR}
          title="Stop Camera"
        >
          ⏹ Stop Camera
        </button>
      )}
    </div>
  );
}
