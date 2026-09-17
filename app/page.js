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
  const [animKey, setAnimKey] = useState(0);
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
          <div className="brand-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="brand-info">
            <h1>6DoF WebAR</h1>
            <p>Spatial Three.js Engine</p>
          </div>
        </div>

        {/* Desktop Mode Switcher */}
        <div className="desktop-mode-pills">
          <button
            type="button"
            className={`mode-btn ${mode === "studio" ? "active" : ""}`}
            onClick={() => setMode("studio")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Studio 3D
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === "ar" ? "active" : ""}`}
            onClick={() => setMode("ar")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Live AR
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="nav-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsTargetModalOpen(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span className="hide-on-mobile">Target Marker</span>
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
            animKey={animKey}
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
            animKey={animKey}
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
            <span className="slider-label">Scale</span>
            <input
              type="range"
              min="0.4"
              max="2.2"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="custom-range"
            />
            <span className="scale-val">
              {scale.toFixed(1)}x
            </span>
          </div>

          <div className="control-separator" />

          {/* Action Buttons */}
          <div className="dock-actions">
            {/* Replay Animation Button (Shown for animated models) */}
            {selectedModel === "Drone_base_Explode" && (
              <button
                type="button"
                className="btn-replay-anim"
                onClick={() => setAnimKey((prev) => prev + 1)}
                title="Replay Animation"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Replay</span>
              </button>
            )}

            {/* Auto-rotate Toggle */}
            <button
              type="button"
              className={`icon-btn ${autoRotate ? "active" : ""}`}
              onClick={() => setAutoRotate(!autoRotate)}
              title="Auto Rotation"
              aria-label="Auto Rotation"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>

            {/* Wireframe Toggle in Studio Mode */}
            {mode === "studio" && (
              <button
                type="button"
                className={`icon-btn ${showWireframe ? "active" : ""}`}
                onClick={() => setShowWireframe(!showWireframe)}
                title="Toggle Wireframe"
                aria-label="Toggle Wireframe"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={`mobile-tab-btn ${mode === "studio" ? "active" : ""}`}
          onClick={() => setMode("studio")}
        >
          <svg className="tab-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span className="tab-label">Studio 3D</span>
        </button>

        <button
          type="button"
          className={`mobile-tab-btn ${mode === "ar" ? "active" : ""}`}
          onClick={() => setMode("ar")}
        >
          <svg className="tab-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="tab-label">Live AR</span>
        </button>

        <button
          type="button"
          className="mobile-tab-btn"
          onClick={() => setIsTargetModalOpen(true)}
        >
          <svg className="tab-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
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
