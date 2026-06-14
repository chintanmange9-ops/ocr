import React, { useState } from "react";

export default function ResultViewer({ text, downloadUrl, pageCount, fileName, onReset }) {
  const [copied, setCopied] = useState(false);
  const [showText, setShowText] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!downloadUrl && !text) return null;

  const baseUrl = import.meta.env.VITE_API_URL || "";
  const fullDownloadUrl = downloadUrl ? `${baseUrl}${downloadUrl}` : null;

  return (
    <div className="result-section">
      {downloadUrl && (
        <div className="success-banner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>
            Searchable DOC generated successfully
            {pageCount > 0 && ` — ${pageCount} page${pageCount > 1 ? "s" : ""}`}
          </span>
        </div>
      )}

      <div className="result-actions">
        {fullDownloadUrl && (
          <a href={fullDownloadUrl} className="btn btn-success" download>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Searchable DOC
          </a>
        )}

        {text && (
          <>
            <button className="btn btn-secondary" onClick={handleCopy}>
              {copied ? (
                <>Copied!</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy Text
                </>
              )}
            </button>

            <button className="btn btn-outline" onClick={() => setShowText(!showText)}>
              {showText ? "Hide Text" : "Show Extracted Text"}
            </button>
          </>
        )}

        <button className="btn btn-outline" onClick={onReset}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          New OCR
        </button>
      </div>

      {text && showText && (
        <div className="result-textarea-wrapper">
          <textarea className="result-textarea" value={text} readOnly spellCheck={false} />
        </div>
      )}
    </div>
  );
}
