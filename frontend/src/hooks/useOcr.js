import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { uploadForSearchableDoc } from "../services/api";

const API_BASE = import.meta.env.VITE_API_URL || "";

async function mergePdfs(downloadUrls) {
  if (downloadUrls.length === 1) {
    const url = downloadUrls[0].startsWith("http") ? downloadUrls[0] : `${API_BASE}${downloadUrls[0]}`;
    return url;
  }

  const merged = await PDFDocument.create();

  for (const dlUrl of downloadUrls) {
    const fullUrl = dlUrl.startsWith("http") ? dlUrl : `${API_BASE}${dlUrl}`;
    const resp = await fetch(fullUrl);
    const pdfBytes = await resp.arrayBuffer();
    const doc = await PDFDocument.load(pdfBytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const mergedBytes = await merged.save();
  const blob = new Blob([mergedBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export function useOcr() {
  const [step, setStep] = useState("upload");
  const [files, setFiles] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);

  const addFile = useCallback((file) => {
    setFiles((prev) => [...prev, file]);
  }, []);

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFileSelected = useCallback((file) => {
    setFiles([file]);
    setStep("config");
  }, []);

  const handleBack = useCallback(() => {
    if (downloadUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(downloadUrl);
    }
    setStep("upload");
    setFiles([]);
    setDownloadUrl(null);
    setError(null);
  }, [downloadUrl]);

  const handleApplyOcr = useCallback(async () => {
    if (files.length === 0) return;
    setStep("processing");
    setError(null);
    setDownloadUrl(null);

    try {
      const downloadUrls = [];

      for (const file of files) {
        const data = await uploadForSearchableDoc(file);
        if (data.downloadUrl) {
          downloadUrls.push(data.downloadUrl);
        }
      }

      if (downloadUrls.length === 0) {
        throw new Error("No output generated");
      }

      const merged = await mergePdfs(downloadUrls);
      setDownloadUrl(merged);
      setStep("success");
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.message ||
        "OCR processing failed";
      setError(message);
      setStep("upload");
    }
  }, [files]);

  return {
    step, files, downloadUrl, error,
    addFile, removeFile, handleFileSelected, handleBack, handleApplyOcr,
  };
}
