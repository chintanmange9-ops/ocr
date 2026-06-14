import React from "react";

export default function ProgressIndicator({ fileName, step }) {
  const steps = [
    { id: "upload", label: "Uploading file..." },
    { id: "ocr", label: "Running OCR recognition..." },
    { id: "pdf", label: "Generating searchable PDF..." },
  ];

  const currentStepId = step?.includes("Upload") ? "upload"
    : step?.includes("OCR") ? "ocr"
    : step?.includes("PDF") || step?.includes("Generating") ? "pdf"
    : "ocr";

  return (
    <div className="progress-section">
      <p style={{ marginBottom: 16, fontSize: "0.9375rem", color: "var(--color-gray-700)" }}>
        Processing <strong>{fileName}</strong>
      </p>
      <div className="progress-steps">
        {steps.map((s, i) => {
          const isActive = s.id === currentStepId;
          const isDone = steps.indexOf(s) < steps.findIndex(x => x.id === currentStepId);
          return (
            <div
              key={s.id}
              className={`progress-step ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
            >
              <span className="step-icon">
                {isDone ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isActive ? (
                  <div className="spinner-small" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
