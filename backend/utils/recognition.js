const ort = require('onnxruntime-node');
const preproc = require('./preprocess');
const fs = require('fs');

class TextRecognizer {
  constructor(modelPath, charDictPath) {
    this.modelPath = modelPath;
    this.charDictPath = charDictPath;
    this.session = null;
    this.charList = null;
  }

  async initialize() {
    this.session = await ort.InferenceSession.create(this.modelPath);
    const content = fs.readFileSync(this.charDictPath, 'utf-8');
    const raw = content.split(/\r?\n/);
    // Match RapidOCR: strip trailing empty line, then insert space at end, blank at 0
    if (raw[raw.length - 1] === '') raw.pop();
    raw.push(' ');                // space at index 95 (last)
    raw.unshift('blank');         // blank at index 0
    this.charList = raw;          // 97 entries: [blank,0,1,...,~, ]
  }

  async recognize(imagePath, bbox) {
    const crop = await preproc.cropRegion(imagePath, bbox);
    const chw = preproc.hwcToChw(crop.data, crop.width, crop.height);
    const normalized = preproc.normalizeRecognition(chw, crop.width, crop.height);

    const inputName = this.session.inputNames[0];
    const feeds = {};
    feeds[inputName] = new ort.Tensor('float32', normalized, [1, 3, crop.height, crop.width]);

    const output = await this.session.run(feeds);
    const outputName = this.session.outputNames[0];
    const probs = output[outputName].data;

    const numSteps = output[outputName].dims[1];
    const numClasses = output[outputName].dims[2];
    const text = this._ctcDecode(probs, numSteps, numClasses);

    return text;
  }

  _ctcDecode(probs, numSteps, numClasses) {
    const chars = [];
    let prevIdx = -1;

    for (let t = 0; t < numSteps; t++) {
      let maxIdx = 0;
      let maxVal = probs[t * numClasses];
      for (let c = 1; c < numClasses; c++) {
        const val = probs[t * numClasses + c];
        if (val > maxVal) {
          maxVal = val;
          maxIdx = c;
        }
      }
      if (maxIdx !== 0 && maxIdx !== prevIdx) {
        if (maxIdx < this.charList.length) {
          chars.push(this.charList[maxIdx]);
        }
      }
      prevIdx = maxIdx;
    }

    return chars.join('').replace(/ +/g, ' ').trim();
  }
}

module.exports = { TextRecognizer };
