import React, { useEffect, useState } from "react";

export default function Preview({ file }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }

    if (file.type === "application/pdf") {
      setPreviewUrl("/pdf-placeholder.svg");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file || !previewUrl) return null;

  return (
    <div className="preview-section">
      <h3>Preview</h3>
      <div className="preview-container">
        {file.type === "application/pdf" ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--color-gray-500)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p style={{ marginTop: 8, fontSize: "0.875rem" }}>PDF document uploaded</p>
            <p style={{ fontSize: "0.75rem", marginTop: 4 }}>{file.name} ({Math.round(file.size / 1024)} KB)</p>
          </div>
        ) : (
          <img src={previewUrl} alt={file.name} />
        )}
      </div>
    </div>
  );
}
