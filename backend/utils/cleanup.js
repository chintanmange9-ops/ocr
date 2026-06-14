const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const GENERATED_DIR = process.env.GENERATED_DIR || "generated";

async function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch {
    // ignore cleanup errors
  }
}

function scheduleCleanup(filePath, delayMs = 60000) {
  setTimeout(() => safeUnlink(filePath), delayMs);
}

async function cleanupOldFiles(maxAgeMs = 30 * 60 * 1000) {
  const dirs = [UPLOAD_DIR, GENERATED_DIR];
  for (const dir of dirs) {
    try {
      const absDir = path.resolve(dir);
      if (!fs.existsSync(absDir)) continue;
      const files = await fs.promises.readdir(absDir);
      const now = Date.now();
      for (const file of files) {
        if (file === ".gitkeep") continue;
        const filePath = path.join(absDir, file);
        try {
          const stat = await fs.promises.stat(filePath);
          if (now - stat.mtimeMs > maxAgeMs) {
            await fs.promises.unlink(filePath);
          }
        } catch {
          // skip individual file errors
        }
      }
    } catch {
      // skip directory errors
    }
  }
}

module.exports = { safeUnlink, scheduleCleanup, cleanupOldFiles };
