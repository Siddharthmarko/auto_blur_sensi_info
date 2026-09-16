# Remotion Blur & Redact Video Editor

A modern, full-stack video editing web application built with **React**, **Remotion**, **Vite**, and **Express**. It provides precision frame-by-frame video scrubbing, interactive blur and redaction bounding boxes, an automated AI OCR text detection importer, and headless server-side video rendering to MP4.

---

## Features

- **Interactive Canvas Overlays**:
  - Draw, drag, resize, and delete blur bounding boxes directly over the video player.
  - Configure individual blur intensity (pixels), opacity, and timeline durations.
- **Precision Video Timeline**:
  - Frame-accurate video scrubbing powered by `@remotion/player`.
  - Timeline tracks showing blur layer spans, keyframes, and real-time playback control.
  - Support for Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`).
- **AI OCR Auto-Blur Importer**:
  - Companion Python OCR tool (`auto-blur`) detects text, names, emails, credentials, and sensitive terms using EasyOCR & OpenCV.
  - Interactive **Import JSON** modal inside the editor to search/filter detected words, consolidate detection spans, and batch-create blur layers.
- **Server-Side Video Rendering**:
  - Export project compositions directly to high-quality MP4 using `@remotion/renderer` and `@remotion/bundler`.
  - Configurable resolution scaling (100%, 75%, 50%) and render FPS.
  - Real-time render progress bar and one-click MP4 download.
- **Built-in Demo Generator**:
  - Quickly test the editor without uploading a video using the built-in demo canvas video generator.
- **Keyboard Shortcuts**:
  - Spacebar to Play/Pause, arrow keys for frame stepping (`J`, `K`, `L`), `Delete`/`Backspace` to remove layers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Lucide React |
| **Video Engine** | Remotion (`remotion`, `@remotion/player`, `@remotion/bundler`, `@remotion/renderer`) |
| **Backend** | Express.js, TypeScript (`tsx`), Multer, CORS |
| **AI OCR Tool** | Python 3, OpenCV (`cv2`), EasyOCR, PyTorch |

---

## Project Structure

```text
Remotion-editor/
├── auto-blur/                   # Optional Python OCR text detection module
│   ├── json_writer.py           # Helper to export detections to JSON format
│   ├── ocr_text_detection.py    # OpenCV & EasyOCR detection routines
│   ├── ocr_text_blur.py         # Standalone OpenCV video blurring script
│   ├── video_ocr.py             # Main pipeline converting video -> blur_data.json
│   └── requirements.txt         # Python dependencies
├── public/                      # Static assets & public media storage
│   ├── Json/                    # Sample detection JSON files
│   │   └── blur_data.json
│   ├── renders/                 # Exported MP4 renders (git ignored)
│   └── uploads/                 # Uploaded video files (git ignored)
├── server/                      # Express backend & Remotion rendering service
│   ├── renderJob.ts             # Remotion renderer worker & queue
│   └── server.ts                # REST API for uploads, static streaming & jobs
├── src/                         # React frontend source
│   ├── editor/                  # Editor UI components & panels
│   │   ├── components/          # Canvas, Header, Timeline, Properties, Modals
│   │   └── utils/               # Timecode formatters, JSON importer, demo video
│   ├── remotion/                # Remotion composition & blur overlay components
│   │   ├── Composition.tsx      # Video composition root
│   │   └── Root.tsx             # Remotion bundle entrypoint
│   ├── state/                   # React Context state management
│   │   └── ProjectContext.tsx   # Global editor state, effects & history
│   ├── types/                   # TypeScript interfaces & definitions
│   ├── App.tsx                  # Main application component
│   └── main.tsx                 # Vite app entrypoint
├── .env.example                 # Example environment variables
├── .gitignore                   # Git ignore configurations
├── package.json                 # Scripts and dependencies
├── tsconfig.json                # TypeScript compiler configuration
└── vite.config.ts               # Vite bundler & backend proxy configuration
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **yarn** / **pnpm**
- *(Optional)* **Python 3.9+** if using the `auto-blur` OCR pipeline

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/remotion-blur-editor.git
cd remotion-blur-editor
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

*(Default port for the backend server is `3001`)*

### 3. Run in Development Mode

Run both the Vite frontend client and Express backend server concurrently:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend Server**: [http://localhost:3001](http://localhost:3001)

---

## Additional NPM Scripts

- **`npm run client:dev`**: Runs only the Vite development server.
- **`npm run server:dev`**: Runs only the backend server with live reload via `tsx watch`.
- **`npm run build`**: Type-checks TypeScript files and builds the frontend production bundle into `dist/`.
- **`npm run preview`**: Locally previews the production build.
- **`npm run server`**: Runs the backend server in production mode.

---

## Using the Auto-Blur OCR Pipeline (Python)

If you want to automatically scan a video for sensitive text and generate a `blur_data.json` file:

1. Navigate to the `auto-blur` directory:
   ```bash
   cd auto-blur
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Place your input video named `input_video.mp4` in `auto-blur/` and run:
   ```bash
   python video_ocr.py
   ```
5. The detected text coordinates will be output to `auto-blur/output/blur_data.json`.
6. In the Remotion Blur Editor web app, click **Import JSON** in the header or toolbar to import and convert the detections into editable blur boxes.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload a video file (`multipart/form-data`) |
| `POST` | `/api/render` | Trigger a headless Remotion MP4 render job |
| `GET` | `/api/render/:id` | Poll render job progress and status |
| `GET` | `/api/renders` | List all historical render jobs |
| `GET` | `/uploads/*` | Stream uploaded videos with HTTP byte-range support |
| `GET` | `/renders/*` | Serve rendered MP4 files for inline viewing or download |

---

## License

This project is licensed under the [MIT License](LICENSE).
