import { useState, useCallback } from "react";
import { uploadForSearchableDoc } from "../services/api";

export function useOcr() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [processingStep, setProcessingStep] = useState("");

  const processSearchableDoc = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setDownloadUrl(null);
    setFileName(file.name);
    setProcessingStep("Uploading...");

    try {
      setProcessingStep("Running OCR...");
      const data = await uploadForSearchableDoc(file);
      setProcessingStep("Generating searchable DOC...");

      setResult(data.text || "");
      setDownloadUrl(data.downloadUrl);
      setPageCount(data.pageCount || 0);

      return { success: true, downloadUrl: data.downloadUrl, text: data.text };
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.message ||
        "OCR processing failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
      setProcessingStep("");
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
    setFileName(null);
    setDownloadUrl(null);
    setPageCount(0);
    setProcessingStep("");
  }, []);

  return {
    result, loading, error, fileName, downloadUrl, pageCount, processingStep,
    processSearchableDoc, reset,
  };
}
