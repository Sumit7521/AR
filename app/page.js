"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import TelemetryHUD from "../components/TelemetryHUD";
import TargetModal from "../components/TargetModal";

// Dynamic imports with SSR disabled for 3D/AR canvases
const ARViewer = dynamic(() => import("../components/ARViewer"), { ssr: false });
const StudioViewer = dynamic(() => import("../components/StudioViewer"), { ssr: false });

const MODELS = [
  { id: "Drone_base_Explode", label: "Drone Explode", badge: "Anim" },
  { id: "damaged-helmet", label: "Helmet", badge: "PBR" },
  { id: "avocado", label: "Avocado", badge: "Organic" },
  { id: "duck", label: "Duck", badge: "Mesh" },
];

export default function Home() {
  const [mode, setMode] = useState("studio"); // 'studio' or 'ar'
  const [selectedModel, setSelectedModel] = useState("Drone_base_Explode");
  const [scale, setScale] = useState(1.0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showWireframe, setShowWireframe] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // 6DoF Telemetry State
  const [telemetry, setTelemetry] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { pitch: 0, yaw: 0, roll: 0 },
    distance: 0,
    fps: 60,
  });

  const handleTelemetryUpdate = useCallback((data) => {
    setTelemetry(data);
  }, []);

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <header className="navbar">
        <div className="brand-section">
          <div className="brand-logo">AR</div>
          <div className="brand-info">
            <h1>6DoF WebAR</h1>
            <p>Three.js & MindAR</p>
          </div>
        </div>

        {/* Desktop Mode Switcher */}
        <div className="desktop-mode-pills">
          <button
            type="button"
            className={`mode-btn ${mode === "studio" ? "active" : ""}`}
            onClick={() => setMode("studio")}
          >
            <span>🎮</span> Studio 3D
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === "ar" ? "active" : ""}`}
            onClick={() => setMode("ar")}
          >
            <span>📷</span> Live AR
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="nav-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsTargetModalOpen(true)}
          >
            <span>🎯</span> <span className="hide-on-mobile">Target Marker</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Area */}
      <main className="viewport-area">
        {/* Real-time 6DoF Telemetry HUD */}
        <TelemetryHUD
          mode={mode}
          isTracking={isTracking}
          position={telemetry.position}
          rotation={telemetry.rotation}
          distance={telemetry.distance}
          activeModel={selectedModel}
          fps={telemetry.fps}
        />

        {/* Viewport Canvas (AR or Studio Mode) */}
        {mode === "ar" ? (
          <ARViewer
            key="ar-mode"
            modelName={selectedModel}
            scale={scale}
            autoRotate={autoRotate}
            onTrackingChange={setIsTracking}
            onTelemetryUpdate={handleTelemetryUpdate}
          />
        ) : (
          <StudioViewer
            key="studio-mode"
            modelName={selectedModel}
            scale={scale}
            autoRotate={autoRotate}
            showWireframe={showWireframe}
            showAxes={true}
            onTelemetryUpdate={handleTelemetryUpdate}
          />
        )}

        {/* Floating Quick Controls Dock */}
        <div className="controls-dock">
          {/* Model Selection */}
          <div className="model-pill-selector">
            {MODELS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`model-pill ${selectedModel === item.id ? "active" : ""}`}
                onClick={() => setSelectedModel(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="control-separator" />

          {/* Scale Slider */}
          <div className="slider-group">
            <span>Scale:</span>
            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
            />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", minWidth: "26px" }}>
              {scale.toFixed(1)}x
            </span>
          </div>

          <div className="control-separator" />

          {/* Auto-rotate Toggle */}
          <button
            type="button"
            className={`icon-btn ${autoRotate ? "active" : ""}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Auto Rotation"
          >
            🔄
          </button>

          {/* Wireframe Toggle in Studio Mode */}
          {mode === "studio" && (
            <button
              type="button"
              className={`icon-btn ${showWireframe ? "active" : ""}`}
              onClick={() => setShowWireframe(!showWireframe)}
              title="Toggle Wireframe"
            >
              🕸️
            </button>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={`mobile-tab-btn ${mode === "studio" ? "active" : ""}`}
          onClick={() => setMode("studio")}
        >
          <span className="tab-icon">🎮</span>
          <span className="tab-label">Studio 3D</span>
        </button>

        <button
          type="button"
          className={`mobile-tab-btn ${mode === "ar" ? "active" : ""}`}
          onClick={() => setMode("ar")}
        >
          <span className="tab-icon">📷</span>
          <span className="tab-label">Live AR</span>
        </button>

        <button
          type="button"
          className="mobile-tab-btn"
          onClick={() => setIsTargetModalOpen(true)}
        >
          <span className="tab-icon">🎯</span>
          <span className="tab-label">Marker Card</span>
        </button>
      </nav>

      {/* Target Marker Modal */}
      <TargetModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
      />
    </div>
  );
}
