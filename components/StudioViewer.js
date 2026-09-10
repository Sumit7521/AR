"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default function StudioViewer({
  modelName = "damaged-helmet",
  scale = 1.0,
  autoRotate = true,
  showWireframe = false,
  showAxes = true,
  onTelemetryUpdate,
}) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const sceneRef = useRef(null);
  const currentMeshRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    const container = containerRef.current;
    
    const getDims = () => {
      const w = container.clientWidth || window.innerWidth || 360;
      const h = container.clientHeight || window.innerHeight || 500;
      return { w, h };
    };

    const { w: width, h: height } = getDims();

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c14);
    sceneRef.current = scene;

    // Camera (6DoF)
    const camera = new THREE.PerspectiveCamera(45, Math.max(0.1, width / height), 0.1, 100);
    camera.position.set(0, 1.2, 2.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 8;
    controls.minDistance = 0.3;
    controls.target.set(0, 0.35, 0);

    // Grid Floor
    const grid = new THREE.GridHelper(8, 16, 0x00f0ff, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    // Axes Helper
    const axesHelper = new THREE.AxesHelper(1.0);
    axesHelper.visible = showAxes;
    scene.add(axesHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.2);
    dirLight1.position.set(3, 4, 2);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x9d4edd, 1.8);
    dirLight2.position.set(-3, -1, -2);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.8, 10);
    pointLight.position.set(0, 2.5, 0);
    scene.add(pointLight);

    // Fallback 3D Geometric Mesh (Always visible until GLB arrives)
    const group = new THREE.Group();
    const geom = new THREE.TorusKnotGeometry(0.25, 0.08, 100, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: showWireframe,
      emissive: 0x002233,
    });
    const fallbackMesh = new THREE.Mesh(geom, mat);
    fallbackMesh.position.set(0, 0.4, 0);
    fallbackMesh.castShadow = true;
    group.add(fallbackMesh);
    scene.add(group);
    currentMeshRef.current = group;

    // Load GLTF Model with ngrok header
    const loader = new GLTFLoader();
    loader.setRequestHeader({ "ngrok-skip-browser-warning": "true" });
    const modelPath = `/models/${modelName}.glb`;

    setLoading(true);
    setLoadProgress(0);

    let mixer = null;
    const clock = new THREE.Clock();

    loader.load(
      modelPath,
      (gltf) => {
        if (!isMounted) return;
        
        while (group.children.length > 0) {
          group.remove(group.children[0]);
        }

        const model = gltf.scene;

        // Animation mixer for animated models
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.play();
          });
        }

        // Rotate 90 degrees on X-axis so model renders flat
        model.rotation.x = Math.PI / 2;
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const normScale = maxDim > 0 ? (1.35 / maxDim) * scale : 1.0;
        model.scale.setScalar(normScale);

        model.position.x = -center.x * normScale;
        model.position.y = (-box.min.y) * normScale + 0.1;
        model.position.z = -center.z * normScale;

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (showWireframe && child.material) {
              child.material.wireframe = true;
            }
          }
        });

        group.add(model);
        setLoading(false);
      },
      (xhr) => {
        if (xhr.lengthComputable && isMounted) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadProgress(percent);
        }
      },
      (err) => {
        if (!isMounted) return;
        console.warn("GLTF load issue (using fallback mesh):", err);
        setLoading(false);
      }
    );

    // Animation Loop
    let animationFrameId;
    let lastTime = performance.now();
    let frames = 0;
    let currentFps = 60;
    const euler = new THREE.Euler();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (mixer) {
        mixer.update(delta);
      }

      if (currentMeshRef.current && autoRotate) {
        currentMeshRef.current.rotation.y += 0.01;
      }

      controls.update();

      if (onTelemetryUpdate) {
        euler.setFromQuaternion(camera.quaternion, "YXZ");
        const distance = camera.position.distanceTo(controls.target);

        frames++;
        const now = performance.now();
        if (now >= lastTime + 1000) {
          currentFps = Math.round((frames * 1000) / (now - lastTime));
          frames = 0;
          lastTime = now;
        }

        onTelemetryUpdate({
          position: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
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
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const { w, h } = getDims();
      camera.aspect = Math.max(0.1, w / h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.innerHTML = "";
      }
    };
  }, [modelName, scale, autoRotate, showWireframe, showAxes]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={containerRef} className="ar-canvas-container" />
      
      {loading && (
        <div className="ar-loader" style={{ pointerEvents: "none", background: "rgba(10, 12, 20, 0.4)" }}>
          <div className="spinner" />
          <div style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
            Loading 3D Asset {loadProgress > 0 ? `(${loadProgress}%)` : "..."}
          </div>
        </div>
      )}
    </div>
  );
}
