import React, { useState, useCallback } from "react";
import Header from "./components/Header";
import FileUploader from "./components/FileUploader";
import Preview from "./components/Preview";
import ResultViewer from "./components/ResultViewer";
import ProgressIndicator from "./components/ProgressIndicator";
import Notification from "./components/Notification";
import { useOcr } from "./hooks/useOcr";
import "./index.css";

export default function App() {
  const {
    result, loading, error, fileName, downloadUrl, pageCount, processingStep,
    processSearchableDoc, reset,
  } = useOcr();

  const [notification, setNotification] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
  }, []);

  const handleFileSelect = useCallback(async (file) => {
    setCurrentFile(file);

    const outcome = await processSearchableDoc(file);

    if (outcome.success) {
      showNotification("success", "Searchable DOC ready for download!");
    } else {
      showNotification("error", outcome.error);
    }
  }, [processSearchableDoc, showNotification]);

  const handleReset = useCallback(() => {
    reset();
    setCurrentFile(null);
    setNotification(null);
  }, [reset]);

  const hasResult = downloadUrl || result;

  return (
    <div className="app">
      <Header />

      <Notification
        type={notification?.type}
        message={notification?.message}
        onClose={() => setNotification(null)}
      />

      <main className="main-content">
        <div className="container">
          <div className="card">
            <FileUploader onFileSelect={handleFileSelect} loading={loading} />

            {currentFile && !loading && !hasResult && (
              <Preview file={currentFile} />
            )}

            {loading && (
              <ProgressIndicator fileName={fileName} step={processingStep} />
            )}

            {hasResult && (
              <ResultViewer
                text={result}
                downloadUrl={downloadUrl}
                pageCount={pageCount}
                fileName={fileName}
                onReset={handleReset}
              />
            )}
          </div>

          <div className="info-bar">
            <p>
              Files are processed in memory and never stored permanently
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
