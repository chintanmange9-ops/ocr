const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { safeUnlink, scheduleCleanup } = require("../utils/cleanup");
const { runOcr, ensureModels } = require("../utils/ocr");
const { generateSearchableDoc, generateMultiPageSearchableDoc } = require("../utils/pdfGen");
const { pdfToImages } = require("../utils/pdfToImages");

const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const GENERATED_DIR = process.env.GENERATED_DIR || "generated";
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".pdf"];
const MAX_SIZE = 20 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTS.includes(ext)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${ext}`));
  },
  limits: { fileSize: MAX_SIZE },
});

router.post("/searchable-doc", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      const message = err instanceof multer.MulterError
        ? `Upload error: ${err.message}`
        : err.message;
      return res.status(400).json({ error: message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const isPdf = ext === ".pdf";

    try {
      await ensureModels();

      const outputFileName = `searchable-${uuidv4()}.pdf`;
      const pdfOutputPath = path.resolve(GENERATED_DIR, outputFileName);

      if (isPdf) {
        const pageImages = await pdfToImages(filePath);
        const allPageResults = [];
        let fullText = "";

        for (const page of pageImages) {
          const { results, fullText: pageText } = await runOcr(page.imageBuffer);
          allPageResults.push({ imageBuffer: page.imageBuffer, results });
          if (pageText) fullText += (fullText ? "\n\n" : "") + pageText;
        }

        await generateMultiPageSearchableDoc(allPageResults, pdfOutputPath);

        const downloadUrl = `/api/download/${outputFileName}`;
        scheduleCleanup(pdfOutputPath, 120000);

        res.json({
          success: true,
          filename: req.file.originalname,
          downloadUrl,
          text: fullText || "",
          pageCount: pageImages.length,
        });
      } else {
        const { results, fullText } = await runOcr(filePath);

        await generateSearchableDoc(filePath, results, pdfOutputPath);

        const downloadUrl = `/api/download/${outputFileName}`;
        scheduleCleanup(pdfOutputPath, 120000);

        res.json({
          success: true,
          filename: req.file.originalname,
          downloadUrl,
          text: fullText || "",
          pageCount: 1,
        });
      }
    } catch (ocrErr) {
      console.error("Searchable DOC generation error:", ocrErr.message);
      res.status(500).json({ error: ocrErr.message });
    } finally {
      await safeUnlink(filePath);
    }
  });
});

module.exports = router;
