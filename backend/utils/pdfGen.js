const {
  PDFDocument, StandardFonts, TextRenderingMode, PDFOperator,
  beginText, endText, showText,
  setTextRenderingMode, setFontAndSize, setTextMatrix,
} = require('pdf-lib');
const sharp = require('sharp');
const fs = require('fs');

function resolveInput(input) {
  if (Buffer.isBuffer(input)) return input;
  return fs.readFileSync(input);
}

function optimalFontSize(words, visualW, visualH, font) {
  const hSize = visualH * 0.85;
  const totalW = words.reduce((s, t) => s + font.widthOfTextAtSize(t, hSize), 0);
  const wSize = totalW > 0 && visualW > 0 ? hSize * visualW / totalW : hSize;
  return Math.max(4, Math.min(Math.min(hSize, wSize), 500));
}

async function embedBackgroundImage(doc, page, input, metadata) {
  const imageBytes = resolveInput(input);
  let image;
  if (metadata.format === 'png') {
    image = await doc.embedPng(imageBytes);
  } else {
    image = await doc.embedJpg(imageBytes);
  }

  const pageW = metadata.width;
  const pageH = metadata.height;

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: pageW,
    height: pageH,
  });

  return { pageW, pageH };
}

function addOcrTextLayer(page, ocrResults, pageH, font, fontKey, contentStream) {
  const pushGs = PDFOperator.of('q');
  const popGs = PDFOperator.of('Q');

  for (const { bbox, text } of ocrResults) {
    const [x1, y1, x2, y2] = bbox;
    const w = x2 - x1;
    const h = y2 - y1;
    if (w <= 0 || h <= 0) continue;

    const tokens = text.match(/(\S+|\s+)/g) || [text];
    const tightX = x1 + Math.round(w * 0.188);
    const tightW = Math.max(1, Math.round(w * 0.624));
    const fontSz = optimalFontSize(tokens, tightW, h, font);
    const pdfY = pageH - y2;

    let xOff = tightX > 0 ? tightX : 0;
    contentStream.push(pushGs);
    for (const token of tokens) {
      contentStream.push(
        beginText(),
        setTextRenderingMode(TextRenderingMode.Invisible),
        setFontAndSize(fontKey, fontSz),
        setTextMatrix(1, 0, 0, 1, xOff, pdfY),
        showText(font.encodeText(token)),
        endText(),
      );
      xOff += font.widthOfTextAtSize(token, fontSz);
    }
    contentStream.push(popGs);
  }
}

async function generateSearchableDoc(input, ocrResults, outputPath) {
  const buf = resolveInput(input);
  const metadata = await sharp(buf).metadata();
  const pageW = metadata.width;
  const pageH = metadata.height;

  const doc = await PDFDocument.create();
  const page = doc.addPage([pageW, pageH]);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontKey = 'F_inv';
  page.node.newFontDictionary(fontKey, font.ref);
  const contentStream = page.getContentStream();

  await embedBackgroundImage(doc, page, buf, metadata);
  addOcrTextLayer(page, ocrResults, pageH, font, fontKey, contentStream);

  const pdfBytes = await doc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

async function generateMultiPageSearchableDoc(pages, outputPath) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontKey = 'F_inv';

  for (const { imageBuffer, results } of pages) {
    const metadata = await sharp(imageBuffer).metadata();
    const pageW = metadata.width;
    const pageH = metadata.height;

    const page = doc.addPage([pageW, pageH]);
    page.node.newFontDictionary(fontKey, font.ref);
    const contentStream = page.getContentStream();

    await embedBackgroundImage(doc, page, imageBuffer, metadata);
    addOcrTextLayer(page, results, pageH, font, fontKey, contentStream);
  }

  const pdfBytes = await doc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

module.exports = { generateSearchableDoc, generateMultiPageSearchableDoc };
