const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const RENDER_SCALE = 2.0;

async function pdfToImages(pdfPath) {
  const mupdf = await import("mupdf");
  const doc = mupdf.Document.openDocument(pdfPath);
  const totalPages = doc.countPages();
  const pages = [];

  for (let i = 0; i < totalPages; i++) {
    const mpage = doc.loadPage(i);
    const bbox = mpage.getBounds();

    const pixmap = mpage.toPixmap(
      mupdf.Matrix.scale(RENDER_SCALE, RENDER_SCALE),
      mupdf.ColorSpace.DeviceRGB,
      false,
      true
    );

    const w = pixmap.getWidth();
    const h = pixmap.getHeight();

    const pixelCopy = Buffer.from(pixmap.getPixels());

    const jpegBuffer = await sharp(pixelCopy, {
      raw: { width: w, height: h, channels: 3 },
    })
      .jpeg({ quality: 85 })
      .toBuffer();

    const origW = Math.round(bbox[2] - bbox[0]);
    const origH = Math.round(bbox[3] - bbox[1]);

    pages.push({
      imageBuffer: jpegBuffer,
      width: origW > 0 ? origW : 0,
      height: origH > 0 ? origH : 0,
      pageNumber: i + 1,
    });
  }

  return pages;
}

module.exports = { pdfToImages };
