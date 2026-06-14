export default function SettingsSidebar({ fileCount, onApply }) {
  return (
    <aside className="settings-sidebar">
      <div className="settings-sidebar-inner">
        <div className="language-section">
          <div className="language-section-header">
            <label>Document language</label>
          </div>
          <div className="language-tags">
            <span className="language-tag">
              English
            </span>
          </div>
        </div>

        <button
          className="btn-apply-ocr"
          onClick={() => onApply(["English"])}
          disabled={fileCount === 0}
          type="button"
        >
          Apply OCR
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
