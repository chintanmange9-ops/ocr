const { TextDetector } = require('./detection');
const { TextRecognizer } = require('./recognition');
const path = require('path');
const fs = require('fs');

const MODELS_DIR = path.join(__dirname, '..', 'models');

let detector = null;
let recognizer = null;

async function ensureModels() {
  for (const f of ['det.onnx', 'rec.onnx', 'dict.txt']) {
    if (!fs.existsSync(path.join(MODELS_DIR, f))) {
      throw new Error(
        `Missing model file: ${f}\n` +
        `Run: npm run setup-models\n` +
        `Or manually place ONNX models in: ${MODELS_DIR}`
      );
    }
  }

  if (!detector) {
    detector = new TextDetector(path.join(MODELS_DIR, 'det.onnx'));
    await detector.initialize();
  }
  if (!recognizer) {
    recognizer = new TextRecognizer(
      path.join(MODELS_DIR, 'rec.onnx'),
      path.join(MODELS_DIR, 'dict.txt')
    );
    await recognizer.initialize();
  }
}

function sortReadingOrder(results) {
  if (results.length <= 1) return results;

  const centers = results.map((r, i) => ({
    cx: (r.bbox[0] + r.bbox[2]) / 2,
    cy: (r.bbox[1] + r.bbox[3]) / 2,
    idx: i,
  }));

  const xs = centers.map(c => c.cx).sort((a, b) => a - b);
  const medianX = xs.length > 0 ? xs[Math.floor(xs.length / 2)] : 0;

  const left = results.filter((_, i) => centers[i].cx < medianX);
  const right = results.filter((_, i) => centers[i].cx >= medianX);

  const sortFn = (a, b) => {
    const ay = (a.bbox[1] + a.bbox[3]) / 2;
    const by = (b.bbox[1] + b.bbox[3]) / 2;
    if (Math.abs(ay - by) > 5) return ay - by;
    const ax = (a.bbox[0] + a.bbox[2]) / 2;
    const bx = (b.bbox[0] + b.bbox[2]) / 2;
    return ax - bx;
  };

  left.sort(sortFn);
  right.sort(sortFn);

  return left.concat(right);
}

async function runOcr(input) {
  await ensureModels();

  const imageBuffer = Buffer.isBuffer(input) ? input : fs.readFileSync(input);

  const { boxes, imageBuffer: bufFromDetect } = await detector.detect(imageBuffer);

  const results = [];
  for (const bbox of boxes) {
    const text = await recognizer.recognize(bufFromDetect, bbox);
    if (text.length > 0) {
      results.push({ bbox, text, confidence: 1.0 });
    }
  }

  const sorted = sortReadingOrder(results);
  const fullText = sorted.map(r => r.text).join('\n');

  return { results: sorted, fullText, pages: 1 };
}

module.exports = { runOcr, ensureModels };
