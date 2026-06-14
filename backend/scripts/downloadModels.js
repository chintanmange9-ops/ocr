const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, '..', 'models');

const FILES = [
  {
    name: 'det.onnx',
    sources: [
      'https://huggingface.co/SWHL/RapidOCR/resolve/main/PP-OCRv4/ch_PP-OCRv4_det_infer.onnx',
    ],
    size: '~4.5 MB',
  },
  {
    name: 'rec.onnx',
    sources: [
      'https://huggingface.co/SWHL/RapidOCR/resolve/main/PP-OCRv3/en_PP-OCRv3_rec_infer.onnx',
    ],
    size: '~8.6 MB',
  },
  {
    name: 'dict.txt',
    sources: [
      'https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/refs/heads/main/ppocr/utils/en_dict.txt',
    ],
    size: '~1 KB',
  },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', (err) => {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function main() {
  fs.mkdirSync(MODELS_DIR, { recursive: true });

  let anyFailed = false;
  for (const f of FILES) {
    const dest = path.join(MODELS_DIR, f.name);
    if (fs.existsSync(dest)) {
      console.log(`  ✓ ${f.name}  (already exists)`);
      continue;
    }
    console.log(`  ↓ ${f.name}  (${f.size}) …`);
    let ok = false;
    for (const url of f.sources) {
      try {
        await download(url, dest);
        const size = fs.statSync(dest).size;
        if (size > 1000) {
          console.log(`  ✓ ${f.name}  (${(size / 1024 / 1024).toFixed(1)} MB)`);
          ok = true;
          break;
        }
        fs.unlinkSync(dest);
      } catch {}
    }
    if (!ok) {
      console.error(`  ✗ ${f.name}  — download failed`);
      anyFailed = true;
    }
  }

  if (anyFailed) console.log('\nSome downloads failed. See above.');
  else console.log('\nDone. Models are in:', MODELS_DIR);
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
