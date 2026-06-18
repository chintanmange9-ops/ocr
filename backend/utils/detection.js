const ort = require('onnxruntime-node');
const preproc = require('./preprocess');
const fs = require('fs');

class TextDetector {
  constructor(modelPath) {
    this.modelPath = modelPath;
    this.session = null;
  }

  async initialize() {
    this.session = await ort.InferenceSession.create(this.modelPath);
  }

  async detect(input) {
    const fileBuffer = Buffer.isBuffer(input) ? input : fs.readFileSync(input);
    const img = await preproc.loadImageAsRGB(fileBuffer);
    const target = preproc.resizeToMulti32(img.width, img.height);
    const resized = await preproc.resizeImage(fileBuffer, target.width, target.height);

    const scaleX = img.width / target.width;
    const scaleY = img.height / target.height;

    let chw = preproc.hwcToChw(resized.data, resized.width, resized.height);
    chw = preproc.normalizeDetection(chw, resized.width, resized.height);

    const inputName = this.session.inputNames[0];
    const feeds = {};
    feeds[inputName] = new ort.Tensor('float32', chw, [1, 3, resized.height, resized.width]);

    const output = await this.session.run(feeds);
    const outputName = this.session.outputNames[0];
    const heatmap = output[outputName].data;

    const rawBoxes = this._postProcess(heatmap, resized.width, resized.height);
    const unclipped = rawBoxes
      .map(b => this._unclip(b, 1.6))
      .filter(b => {
        const bw = b[2] - b[0];
        const bh = b[3] - b[1];
        return Math.min(bw, bh) >= 3 && Math.min(bw, bh) > 0 &&
               Math.max(bw, bh) / Math.min(bw, bh) <= 50;
      });

    const boxes = unclipped.map(b => [
      Math.round(b[0] * scaleX),
      Math.round(b[1] * scaleY),
      Math.round(b[2] * scaleX),
      Math.round(b[3] * scaleY),
    ]);

    const merged = this._nms(boxes, 0.5);
    return { boxes: merged, imageBuffer: fileBuffer, width: img.width, height: img.height };
  }

  _postProcess(heatmap, w, h) {
    const threshold = 0.3;
    const binary = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      binary[i] = heatmap[i] > threshold ? 1 : 0;
    }

    const components = this._connectedComponents(binary, w, h);
    return components.map(c => c.bbox);
  }

  _connectedComponents(binary, w, h) {
    const visited = new Uint8Array(w * h);
    const components = [];

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (binary[idx] === 0 || visited[idx]) continue;

        const stack = [[x, y]];
        visited[idx] = 1;
        let minX = x, maxX = x, minY = y, maxY = y;
        let count = 0;

        while (stack.length > 0) {
          const [cx, cy] = stack.pop();
          count++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const nidx = ny * w + nx;
            if (binary[nidx] === 0 || visited[nidx]) continue;
            visited[nidx] = 1;
            stack.push([nx, ny]);
          }
        }

        if (count >= 5) {
          components.push({ bbox: [minX, minY, maxX, maxY] });
        }
      }
    }

    return components;
  }

  _nms(boxes, iouThreshold) {
    if (boxes.length <= 1) return boxes;

    const sorted = boxes
      .map((b, i) => ({ box: b, idx: i, area: (b[2] - b[0]) * (b[3] - b[1]) }))
      .sort((a, b) => b.area - a.area);

    const keep = [];

    for (const item of sorted) {
      let overlaps = false;
      for (const kept of keep) {
        const iou = this._iou(item.box, kept);
        if (iou > iouThreshold) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        keep.push(item.box);
      }
    }

    return keep;
  }

  _iou(a, b) {
    const ax1 = a[0], ay1 = a[1], ax2 = a[2], ay2 = a[3];
    const bx1 = b[0], by1 = b[1], bx2 = b[2], by2 = b[3];

    const ix1 = Math.max(ax1, bx1);
    const iy1 = Math.max(ay1, by1);
    const ix2 = Math.min(ax2, bx2);
    const iy2 = Math.min(ay2, by2);

    const iw = Math.max(0, ix2 - ix1 + 1);
    const ih = Math.max(0, iy2 - iy1 + 1);
    const inter = iw * ih;

    const aa = (ax2 - ax1 + 1) * (ay2 - ay1 + 1);
    const ab = (bx2 - bx1 + 1) * (by2 - by1 + 1);

    return inter / (aa + ab - inter);
  }

  _unclip(box, ratio) {
    const [x1, y1, x2, y2] = box;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const w = (x2 - x1) * ratio;
    const h = (y2 - y1) * ratio;
    return [
      Math.round(cx - w / 2),
      Math.round(cy - h / 2),
      Math.round(cx + w / 2),
      Math.round(cy + h / 2),
    ];
  }
}

module.exports = { TextDetector };
