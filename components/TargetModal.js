"use client";

export default function TargetModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: "4px" }}>
          AR Target Marker (Card)
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          Point your camera at this image to anchor the 3D model with 6DoF tracking.
        </p>

        <div className="target-img-wrap">
          <img src="/targets/card.png" alt="AR Target Card" />
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "12px" }}>
          <a
            href="/targets/card.png"
            download="ar-target-card.png"
            className="btn-secondary"
            style={{ textDecoration: "none" }}
          >
            📥 Download Target
          </a>
          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
