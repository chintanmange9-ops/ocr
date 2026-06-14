import { useRef } from "react";

export default function UploadScreen({ onFileSelected }) {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div
      className="upload-screen"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="upload-container">
        <h1>OCR</h1>
        <p className="subtitle">
          Convert non-selectable JPG, JPEG, PDF and PNG files into selectable
          and searchable PDF with high accuracy.
        </p>

        <div className="upload-actions">
          <button className="btn-select-pdf" onClick={handleClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Select file
          </button>
        </div>

        <p className="drag-hint">or drop file here</p>

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleChange}
          hidden
        />
      </div>
    </div>
  );
}
