import React from "react";

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="20" fill="currentColor" />
            <text x="50" y="68" fontSize="50" fontFamily="Arial" fontWeight="bold" fill="white" textAnchor="middle">OCR</text>
          </svg>
          <div>
            <h1>Searchable DOC</h1>
            <p className="subtitle">Convert scanned documents to searchable documents</p>
          </div>
        </div>
      </div>
    </header>
  );
}
