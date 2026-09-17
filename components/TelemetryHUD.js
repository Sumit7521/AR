"use client";

import { useState } from "react";

export default function TelemetryHUD({
  mode = "ar",
  isTracking = false,
  position = { x: 0, y: 0, z: 0 },
  rotation = { pitch: 0, yaw: 0, roll: 0 },
  distance = 0,
  activeModel = "Drone_base_Explode",
  fps = 60,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const isLocked = mode === "studio" || isTracking;

  return (
    <div className={`telemetry-overlay ${collapsed ? "collapsed" : ""}`}>
      <div className="telemetry-card">
        {/* Header */}
        <div className="telemetry-header">
          <div className="telemetry-brand">
            <span className="telemetry-indicator" />
            <span className="telemetry-title">6DoF Metrics</span>
          </div>

          <div className="telemetry-header-right">
            <span
              className={`status-badge ${
                mode === "studio"
                  ? "studio"
                  : isTracking
                  ? "tracking"
                  : "searching"
              }`}
            >
              <span className="status-dot" />
              {mode === "studio"
                ? "STUDIO"
                : isTracking
                ? "LOCKED"
                : "SEARCHING"}
            </span>

            <button
              type="button"
              className="hud-toggle-btn"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand Telemetry" : "Collapse Telemetry"}
              aria-label="Toggle Telemetry"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded Metrics View */}
        {!collapsed && (
          <div className="telemetry-body">
            {/* Translation Vector */}
            <div className="vector-section">
              <div className="vector-meta">
                <span>POSITION</span>
                <span className="unit-label">meters</span>
              </div>
              <div className="vector-grid">
                <div className="vector-box">
                  <span className="axis-label x">X</span>
                  <span className="axis-val">{position.x.toFixed(2)}</span>
                </div>
                <div className="vector-box">
                  <span className="axis-label y">Y</span>
                  <span className="axis-val">{position.y.toFixed(2)}</span>
                </div>
                <div className="vector-box">
                  <span className="axis-label z">Z</span>
                  <span className="axis-val">{position.z.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Orientation Vector */}
            <div className="vector-section">
              <div className="vector-meta">
                <span>ROTATION</span>
                <span className="unit-label">deg</span>
              </div>
              <div className="vector-grid">
                <div className="vector-box">
                  <span className="axis-label x">P</span>
                  <span className="axis-val">{rotation.pitch.toFixed(0)}°</span>
                </div>
                <div className="vector-box">
                  <span className="axis-label y">Y</span>
                  <span className="axis-val">{rotation.yaw.toFixed(0)}°</span>
                </div>
                <div className="vector-box">
                  <span className="axis-label z">R</span>
                  <span className="axis-val">{rotation.roll.toFixed(0)}°</span>
                </div>
              </div>
            </div>

            {/* Footer Metrics */}
            <div className="telemetry-footer">
              <div className="footer-metric">
                <span className="footer-label">Distance</span>
                <span className="footer-val">{distance.toFixed(2)}m</span>
              </div>
              <div className="footer-metric">
                <span className="footer-label">Rate</span>
                <span className={`footer-val ${fps < 30 ? "low-fps" : "good-fps"}`}>
                  {fps} FPS
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
