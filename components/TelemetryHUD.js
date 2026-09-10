"use client";

import { useState } from "react";

export default function TelemetryHUD({
  mode = "ar",
  isTracking = false,
  position = { x: 0, y: 0, z: 0 },
  rotation = { pitch: 0, yaw: 0, roll: 0 },
  distance = 0,
  activeModel = "damaged-helmet",
  fps = 60,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`telemetry-overlay ${collapsed ? "collapsed" : ""}`}>
      <div className="telemetry-card">
        <div className="telemetry-header">
          <span className="telemetry-title">6DoF Telemetry</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              className={`status-badge ${
                mode === "studio"
                  ? "tracking"
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
            >
              {collapsed ? "▾" : "▴"}
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            {/* Translation: X, Y, Z */}
            <div style={{ marginTop: "4px" }}>
              <div className="vector-meta">
                <span>POSITION (X, Y, Z)</span>
                <span>meters</span>
              </div>
              <div className="vector-grid">
                <div className="vector-box">
                  <div className="vector-label">X</div>
                  <div className="vector-val x">{position.x.toFixed(2)}</div>
                </div>
                <div className="vector-box">
                  <div className="vector-label">Y</div>
                  <div className="vector-val y">{position.y.toFixed(2)}</div>
                </div>
                <div className="vector-box">
                  <div className="vector-label">Z</div>
                  <div className="vector-val z">{position.z.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Orientation: Pitch, Yaw, Roll */}
            <div style={{ marginTop: "6px" }}>
              <div className="vector-meta">
                <span>ROTATION (Euler)</span>
                <span>deg</span>
              </div>
              <div className="vector-grid">
                <div className="vector-box">
                  <div className="vector-label">PITCH</div>
                  <div className="vector-val x">{rotation.pitch.toFixed(0)}°</div>
                </div>
                <div className="vector-box">
                  <div className="vector-label">YAW</div>
                  <div className="vector-val y">{rotation.yaw.toFixed(0)}°</div>
                </div>
                <div className="vector-box">
                  <div className="vector-label">ROLL</div>
                  <div className="vector-val z">{rotation.roll.toFixed(0)}°</div>
                </div>
              </div>
            </div>

            {/* Distance & Info */}
            <div className="telemetry-footer">
              <div>
                Dist: <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{distance.toFixed(2)}m</span>
              </div>
              <div>
                FPS: <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>{fps}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
