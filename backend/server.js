const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const searchableDocRoutes = require("./routes/searchableDoc");
const { cleanupOldFiles } = require("./utils/cleanup");

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const GENERATED_DIR = process.env.GENERATED_DIR || "generated";

for (const dir of [UPLOAD_DIR, GENERATED_DIR]) {
  const absDir = path.resolve(dir);
  if (!fs.existsSync(absDir)) {
    fs.mkdirSync(absDir, { recursive: true });
  }
}

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ocr-beta-mauve.vercel.app"
  ]
}));
app.use(express.json());

app.use("/api", searchableDocRoutes);

app.get("/api/download/:filename", (req, res) => {
  const filename = req.params.filename;

  const safePath = path.resolve(GENERATED_DIR, path.basename(filename));

  if (!safePath.startsWith(path.resolve(GENERATED_DIR))) {
    return res.status(403).json({ error: "Invalid path" });
  }

  if (!fs.existsSync(safePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(safePath, filename, (err) => {
    if (err) {
      console.error("Download error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Download failed" });
      }
    }
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

setInterval(() => {
  cleanupOldFiles().catch((err) => {
    console.error("Cleanup error:", err.message);
  });
}, 5 * 60 * 1000);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
