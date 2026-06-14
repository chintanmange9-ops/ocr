import Header from "./components/Header";
import UploadScreen from "./components/UploadScreen";
import ConfigScreen from "./components/ConfigScreen";
import ProgressIndicator from "./components/ProgressIndicator";
import SuccessScreen from "./components/SuccessScreen";
import Notification from "./components/Notification";
import { useOcr } from "./hooks/useOcr";
import "./index.css";

export default function App() {
  const {
    step, files, downloadUrl, error,
    addFile, removeFile, handleFileSelected, handleBack, handleApplyOcr,
  } = useOcr();

  return (
    <div className="app">
      <Header />

      {error && (
        <Notification type="error" message={error} onClose={() => {}} />
      )}

      {step === "upload" && (
        <UploadScreen onFileSelected={handleFileSelected} />
      )}

      {step === "config" && (
        <ConfigScreen
          files={files}
          onAddFile={addFile}
          onRemoveFile={removeFile}
          onBack={handleBack}
          onApplyOcr={handleApplyOcr}
        />
      )}

      {step === "processing" && <ProgressIndicator />}

      {step === "success" && (
        <SuccessScreen
          downloadUrl={downloadUrl || null}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
