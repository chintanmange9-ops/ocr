import { useState } from "react";
import DocumentCard from "./DocumentCard";
import SettingsSidebar from "./SettingsSidebar";

export default function ConfigScreen({ files, onAddFile, onRemoveFile, onBack, onApplyOcr }) {
  const handleClickAdd = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = (e) => {
      const f = e.target.files?.[0];
      if (f) onAddFile(f);
    };
    input.click();
  };

  return (
    <div className="config-screen">
      <div className="config-workspace">
        <div className="config-workspace-header">
          <button className="btn-back" onClick={onBack} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h2>Uploaded documents</h2>
        </div>

        <div className="documents-grid">
          {files.map((file, i) => (
            <DocumentCard key={i} file={file} index={i} onRemove={onRemoveFile} />
          ))}

          <button className="btn-add-doc" onClick={handleClickAdd} type="button">
            <span>+</span>
            {files.length > 0 && <span className="badge">{files.length}</span>}
          </button>
        </div>
      </div>

      <SettingsSidebar fileCount={files.length} onApply={(langs) => onApplyOcr(langs)} />
    </div>
  );
}
