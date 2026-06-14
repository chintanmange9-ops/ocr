# Searchable DOC

A pure Node.js web app that converts scanned documents into **searchable PDFs** (branded as "Searchable DOC"). The original visual appearance is preserved exactly; an invisible selectable text layer is overlaid at the exact OCR-detected coordinates.

## How It Works

```
Upload Scan → ONNX PaddleOCR (detection + recognition) → pdf-lib invisible text layer (Tr=3) → Searchable PDF
```

The output looks identical to the original, but users can **select**, **copy**, and **Ctrl+F** search all text.

## Tech Stack

| Layer      | Technology                                 |
| ---------- | ------------------------------------------ |
| Frontend   | React 18, Vite                             |
| Backend    | Node.js, Express                           |
| OCR Engine | PaddleOCR v4 ONNX models via onnxruntime-node |
| PDF Engine | pdf-lib (`TextRenderingMode.Invisible = 3`) |
| Image      | sharp                                      |

Zero Python. Everything runs in Node.js.

## Features

- **Searchable DOC** — OCR text overlaid as invisible layer at exact coordinates
- **Multi-format Input** — JPG, JPEG, PNG (up to 20MB)
- **Image Preprocessing** — Denoise + contrast enhancement before OCR
- **Column-aware Sorting** — Detects sidebars/columns, outputs text in correct reading order
- **Responsive Design** — Desktop + mobile

## Project Structure

```
ocr/
├── frontend/               # React + Vite SPA
│   └── src/
│       ├── components/     # Header, FileUploader, ResultViewer
│       ├── hooks/          # useOcr custom hook
│       └── services/       # API client
├── backend/
│   ├── routes/             # searchableDoc.js
│   ├── utils/              # ocr.js, preprocess.js, detection.js, recognition.js, pdfGen.js, cleanup.js
│   ├── scripts/            # downloadModels.js
│   ├── models/             # det.onnx, rec.onnx, dict.txt (downloaded via npm run setup-models)
│   ├── uploads/            # Temporary upload storage
│   └── generated/          # Generated searchable PDFs
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js 18+
- npm

## Installation

### 1. Backend

```bash
cd backend
npm install

# Windows: copy .env.example .env
# macOS/Linux: cp .env.example .env

# Download ONNX models (detection + recognition)
npm run setup-models

# Start dev server (with --watch)
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install

# Windows: copy .env.example .env
# macOS/Linux: cp .env.example .env

npm run dev
```

Open **http://localhost:5173** in your browser.

## API Endpoints

### POST /api/searchable-doc — Generate Searchable DOC

```
Content-Type: multipart/form-data
Body:
  file: (binary) — JPG, JPEG, PNG
```

Response:
```json
{
  "success": true,
  "filename": "scan.jpg",
  "downloadUrl": "/api/download/searchable-uuid.pdf",
  "text": "extracted text content...",
  "pageCount": 1
}
```

### GET /api/download/:filename — Download Generated PDF

Downloads the searchable PDF file.

### GET /api/health — Health Check

## How the Invisible Text Layer Works

1. **Image Loading** — sharp loads the uploaded image
2. **Text Detection** — ONNX detection model (PaddleOCR v4) finds text regions, outputs heatmap; post-processing (threshold + connected components + NMS) converts to bounding boxes
3. **Text Recognition** — For each bounding box, sharp crops the region; ONNX recognition model reads the text; CTC decoding converts to string
4. **Column Sorting** — Results are split by median x-position into left/right columns, each sorted top-to-bottom, then concatenated left to right
5. **PDF Assembly** — pdf-lib embeds the original image and overlays invisible text (`TextRenderingMode.Invisible = 3`) at exact pixel positions
6. **Result** — The PDF looks identical but has a searchable/selectable/copyable text layer

## Model Setup

The detection and recognition ONNX models are downloaded from HuggingFace:

- **det.onnx** — `ch_PP-OCRv4_det_infer` (4.5 MB, text region detection)
- **rec.onnx** — `en_PP-OCRv3_rec_infer` (8.6 MB, English text recognition)
- **dict.txt** — PaddleOCR `en_dict.txt` character dictionary (95 chars + blank + space)

Run `npm run setup-models` to download them automatically into `backend/models/`.

If downloads fail, download the models manually from https://huggingface.co/SWHL/RapidOCR.

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Default                    | Description              |
| -------------- | -------------------------- | ------------------------ |
| `PORT`         | `5000`                     | Server port              |
| `CORS_ORIGIN`  | `http://localhost:5173`    | Allowed CORS origin      |
| `UPLOAD_DIR`   | `uploads`                  | Temp upload directory    |
| `GENERATED_DIR`| `generated`                | Output PDF directory     |

## Deployment

### Frontend (Vercel)

```bash
cd frontend
npm install && npm run build
npx vercel --prod
```

Set `VITE_API_URL` to your backend URL.

### Backend

1. Create a Node.js web service
2. Build command: `npm install && npm run setup-models`
3. Start command: `node server.js`

## Performance Notes

- First request is slower as ONNX Runtime loads model files (~12 MB total) into memory
- Generated PDFs are auto-cleaned after 2 minutes
- Uploaded files are deleted immediately after processing

## License

MIT
