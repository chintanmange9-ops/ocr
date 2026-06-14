const sharp = require('sharp');

async function loadImageAsRGB(imagePath) {
  const sharpImg = sharp(imagePath);
  const metadata = await sharpImg.metadata();
  const { data } = await sharpImg
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = metadata.width;
  const h = metadata.height;
  const bgr = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    bgr[i * 3] = data[i * 4 + 2];
    bgr[i * 3 + 1] = data[i * 4 + 1];
    bgr[i * 3 + 2] = data[i * 4];
  }
  return { data: bgr, width: w, height: h };
}

function hwcToChw(data, w, h) {
  const chw = new Float32Array(3 * w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = (y * w + x) * 3;
      chw[0 * w * h + y * w + x] = data[srcIdx];
      chw[1 * w * h + y * w + x] = data[srcIdx + 1];
      chw[2 * w * h + y * w + x] = data[srcIdx + 2];
    }
  }
  return chw;
}

function normalizeDetection(chw, w, h) {
  const mean = [0.406, 0.456, 0.485];
  const std = [0.225, 0.224, 0.229];
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < w * h; i++) {
      chw[c * w * h + i] = (chw[c * w * h + i] / 255 - mean[c]) / std[c];
    }
  }
  return chw;
}

function normalizeRecognition(chw, w, h) {
  const mean = [0.5, 0.5, 0.5];
  const std = [0.5, 0.5, 0.5];
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < w * h; i++) {
      chw[c * w * h + i] = (chw[c * w * h + i] / 255 - mean[c]) / std[c];
    }
  }
  return chw;
}

function resizeToMulti32(w, h) {
  const maxLongSide = 1024;
  let newW, newH;
  if (Math.max(w, h) > maxLongSide) {
    const ratio = maxLongSide / Math.max(w, h);
    newW = Math.round(w * ratio);
    newH = Math.round(h * ratio);
  } else {
    newW = w;
    newH = h;
  }
  newW = Math.max(32, Math.round(newW / 32) * 32);
  newH = Math.max(32, Math.round(newH / 32) * 32);
  return { width: newW, height: newH };
}

async function resizeImage(imagePath, targetW, targetH) {
  const { data } = await sharp(imagePath)
    .resize(targetW, targetH, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bgr = Buffer.alloc(targetW * targetH * 3);
  for (let i = 0; i < targetW * targetH; i++) {
    bgr[i * 3] = data[i * 4 + 2];
    bgr[i * 3 + 1] = data[i * 4 + 1];
    bgr[i * 3 + 2] = data[i * 4];
  }
  return { data: bgr, width: targetW, height: targetH };
}

async function cropRegion(imagePath, bbox, targetH = 48) {
  const [x1, y1, x2, y2] = bbox;
  const bw = Math.max(x2 - x1, 2);
  const bh = Math.max(y2 - y1, 2);

  const pad = 5;
  let cropLeft = Math.max(0, Math.round(x1 - pad));
  let cropTop = Math.max(0, Math.round(y1 - pad));
  let cropW = Math.round(bw + pad * 2);
  let cropH = Math.round(bh + pad * 2);

  const meta = await sharp(imagePath).metadata();
  if (cropLeft + cropW > meta.width) cropW = meta.width - cropLeft;
  if (cropTop + cropH > meta.height) cropH = meta.height - cropTop;
  if (cropW < 2 || cropH < 2) return { data: Buffer.alloc(targetH * 8 * 3), width: 8, height: targetH };

  const aspect = cropW / cropH;
  let targetW = Math.max(8, Math.round(targetH * aspect));
  targetW = Math.max(8, Math.round(targetW / 8) * 8);

  const { data } = await sharp(imagePath)
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .resize(targetW, targetH, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bgr = Buffer.alloc(targetW * targetH * 3);
  for (let i = 0; i < targetW * targetH; i++) {
    bgr[i * 3] = data[i * 4 + 2];
    bgr[i * 3 + 1] = data[i * 4 + 1];
    bgr[i * 3 + 2] = data[i * 4];
  }
  return { data: bgr, width: targetW, height: targetH };
}

module.exports = {
  loadImageAsRGB,
  hwcToChw,
  normalizeDetection,
  normalizeRecognition,
  resizeToMulti32,
  resizeImage,
  cropRegion,
};
