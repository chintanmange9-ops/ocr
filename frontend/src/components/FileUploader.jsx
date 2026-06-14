import React, { useState, useRef, useCallback } from "react";

const ACCEPTED_TYPES = [".jpg", ".jpeg", ".png", ".pdf"];
const ACCEPTED_MIME = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE = 20 * 1024 * 1024;

export default function FileUploader({ onFileSelect, loading }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const validateFile = useCallback((f) => {
    if (!f) return "No file selected";
    if (!ACCEPTED_MIME.includes(f.type) && !ACCEPTED_TYPES.some(t => f.name.toLowerCase().endsWith(t))) {
      return `Unsupported file type. Please upload ${ACCEPTED_TYPES.join(", ")}`;
    }
    if (f.size > MAX_SIZE) {
      return "File is too large. Maximum size is 20MB.";
    }
    return null;
  }, []);

  const handleFile = useCallback((f) => {
    const err = validateFile(f);
    if (err) { alert(err); return; }
    setFile(f);
    onFileSelect(f);
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const handleReset = () => setFile(null);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="upload-section">
      {file && !loading && (
        <div className="file-info">
          <div className="file-info-details">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div>
              <p className="file-name">{file.name}</p>
              <p className="file-size">{formatSize(file.size)} &middot; {file.type.includes("pdf") ? "PDF" : "Image"}</p>
            </div>
          </div>
          <div className="file-info-actions">
            <button className="btn btn-outline" onClick={handleReset}>Change</button>
          </div>
        </div>
      )}

      <div
        className={`drop-zone ${dragOver ? "drag-over" : ""} ${file || loading ? "drop-zone-compact" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !loading && inputRef.current?.click()}
        style={{ pointerEvents: loading ? "none" : "auto" }}
      >
        <div className="drop-zone-icon">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <h3>Drag & drop your file here</h3>
        <p>or click to browse</p>
        <p className="drop-zone-hint">JPG, JPEG, PNG, PDF &middot; Max 20MB</p>
        <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} onChange={handleInputChange} hidden />
      </div>
    </div>
  );
}
