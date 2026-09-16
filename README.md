# 🎬 Remotion AI Blur & Redact Video Editor

An end-to-end, full-stack video redaction studio built with **React**, **Remotion**, **Vite**, **Express**, and **Python (EasyOCR + OpenCV)**. Automatically detect and blur sensitive on-screen text (passwords, API tokens, emails, PII) or manually draw, resize, and fine-tune blur boxes across a frame-accurate timeline. Export pixel-perfect MP4 videos directly from headless Chromium via Remotion Renderer.

---

## 🌟 Key Highlights

- **Dual Redaction Modes**:
  - 🤖 **Automated AI Blur**: Frame-by-frame OCR text detection with EasyOCR, keyword filtering, and multi-frame span consolidation.
  - ✍️ **Manual Canvas Editor**: Draw, drag, resize, and customize blur bounding boxes directly over the video player.
- **Frame-Accurate Video Player**: Powered by `@remotion/player` with sub-frame scrubbing, playhead dragging, and keyboard controls.
- **Multi-Track Timeline**: Visual timeline layers displaying the active frame span of each blur effect, with trimming and quick selection.
- **Headless Server-Side Rendering**: Headless Chromium + FFmpeg via `@remotion/renderer` renders high-definition MP4 files in the background with live progress tracking.
- **Built-in Synthetic Demo Generator**: Generates an instant HTML5 test video with animated credentials so you can test all features with zero video uploads.

---

## 🧠 How It Works (Architecture & Data Flow)

```mermaid
flowchart TD
    subgraph Ingestion["1. Video Ingestion"]
        A[Input Video: MP4 / WebM] -->|Upload / Stream| B[Express Server /uploads]
        C[Built-in Demo Generator] -->|Synthetic Canvas Video| B
    end

    subgraph AIDetection["2. AI Text Detection (Optional)"]
        A -->|video_ocr.py| D[OpenCV Frame Extraction]
        D -->|EasyOCR Engine| E[Text Recognition & Bounding Boxes]
        E -->|json_writer.py| F[blur_data.json]
    end

    subgraph WebEditor["3. Remotion Web Studio"]
        B -->|Byte-Range Video Stream| G[Remotion Player]
        F -->|Import JSON Modal| H[Search & Keyword Filter]
        H -->|Consolidate Spans| I[Timeline Blur Layers]
        G <-->|Interactive Drag/Resize Canvas| I
        I -->|Undo / Redo History| J[Project State Context]
    end

    subgraph RenderingEngine["4. Server-Side Rendering"]
        J -->|POST /api/render| K[Express Render Queue]
        K -->|@remotion/bundler| L[Webpack Composition Bundle]
        L -->|@remotion/renderer| M[Headless Chromium + FFmpeg]
        M -->|Progress Stream| N[Rendered MP4 /renders]
        N -->|Direct Download| O[Final Redacted Video]
    end
```

---

### Step 1: Video Ingestion & Streaming
1. You can upload any standard MP4 or WebM video via drag-and-drop or the file picker.
2. The video is uploaded to `/api/upload` via `multer` and saved into `public/uploads/`.
3. The Express backend serves videos using **HTTP 206 Partial Content (Byte-Ranges)** (`Accept-Ranges: bytes`). This is critical: standard static file servers cause video seeking to buffer or stutter, whereas byte-range streaming enables instant, zero-lag scrubbing across the timeline.
4. If you don't have a video handy, click **Generate Demo Video** in the header to synthesize a video containing mock emails, passwords, and API keys.

---

### Step 2: Automated AI OCR Detection (`auto-blur`)
1. The `auto-blur/` directory contains a standalone Python pipeline utilizing **OpenCV** and **EasyOCR**.
2. Run `python video_ocr.py`:
   - It iterates through each frame of the target video at the specified analysis frame rate.
   - EasyOCR detects text bounding boxes `[x, y, width, height]` and recognizes the textual content.
   - Detections are exported to `auto-blur/output/blur_data.json` with frame indices and normalized coordinates.
3. Inside the web editor, open the **Import JSON** modal:
   - **Filter by keyword**: Type substrings (e.g. `password`, `@domain.com`, `Bearer`) to only blur matching text, or blur all detected text.
   - **Consolidation**: The importer merges detections across consecutive frames into a single, cohesive blur layer spanning the entire duration that the text appears on-screen.
   - **Custom Blur Radius**: Set the desired blur strength (default `20px`) before importing.

---

### Step 3: Interactive Canvas & Timeline Studio
1. **Interactive Overlay (`TransformBox.tsx` & `InteractiveOverlay.tsx`)**:
   - Every active blur effect for the current frame is rendered as a draggable, resizable element overlaying the video.
   - Handles on all 4 corners and 4 edges allow instant resizing.
2. **Remotion Composition (`MainComposition.tsx` & `BlurEffectLayer.tsx`)**:
   - Remotion renders the base `<OffthreadVideo />` component.
   - On top, each active effect is rendered with CSS `backdrop-filter: blur(Npx)`. When a frame is outside an effect's `[startFrame, endFrame]`, it cleanly unmounts.
   - Supports rectangular and elliptical/rounded blur shapes.
3. **Properties Panel & State Management**:
   - Inspect and edit exact coordinate numbers (`x`, `y`, `width`, `height`), blur strength, start frame, and end frame.
   - History stack with full **Undo (`Ctrl+Z`)** and **Redo (`Ctrl+Y`)** support.

---

### Step 4: Server-Side Remotion Rendering
1. When you click **Export Video**, the editor opens the Render Modal where you choose:
   - Output resolution scale (`100%`, `75%`, `50%`).
   - Frame rate (`30 fps`, `60 fps`).
2. The client submits the project payload to `POST /api/render`.
3. The Express server executes a background rendering job:
   - **Bundling**: Calls `@remotion/bundler.bundle()` on `src/remotion/Root.tsx` to create a Webpack bundle (cached in memory for instant subsequent renders).
   - **Rendering**: Calls `@remotion/renderer.renderMedia()`. Remotion launches a headless Chromium instance, loads each frame, applies the exact DOM blur filters over the video, captures canvas frames, and encodes them into an MP4 container with FFmpeg.
4. The client polls `GET /api/render/:id` to receive real-time rendering percentage and progress metrics.
5. Once complete, you get a direct download link to the final redacted MP4 file!

---

## 💻 Tech Stack & Dependencies

| Area | Technologies |
|---|---|
| **Frontend UI** | React 18, TypeScript, Vite, Lucide React |
| **Video Engine** | Remotion (`remotion`, `@remotion/player`, `@remotion/bundler`, `@remotion/renderer`) |
| **Backend** | Express 4, TypeScript (`tsx`), Multer, CORS |
| **Computer Vision / OCR** | Python 3, OpenCV (`cv2`), EasyOCR, PyTorch |

---

## 📁 Repository Structure

```text
Remotion-editor/
├── auto-blur/                   # Python OCR auto-detection pipeline
│   ├── json_writer.py           # Formats OCR coordinates into JSON schema
│   ├── ocr_text_detection.py    # OpenCV & EasyOCR detection routines
│   ├── ocr_text_blur.py         # Standalone OpenCV video blurring script
│   ├── video_ocr.py             # Main CLI to process video -> blur_data.json
│   └── requirements.txt         # Python dependencies
├── public/                      # Static assets & public media storage
│   ├── Json/                    # Bundled sample detection JSON
│   │   └── blur_data.json
│   ├── renders/                 # Exported MP4 videos (git-ignored)
│   └── uploads/                 # Uploaded video assets (git-ignored)
├── server/                      # Express backend & Remotion renderer
│   ├── renderJob.ts             # Remotion renderer worker & queue
│   └── server.ts                # REST API routes (upload, stream, render)
├── src/                         # Frontend application
│   ├── editor/                  # Studio UI components & panels
│   │   ├── components/          # Canvas, Header, Timeline, Properties, Modals
│   │   │   ├── ImportJsonModal.tsx   # AI OCR JSON importer dialog
│   │   │   ├── InteractiveOverlay.tsx# Drag-and-drop bounding box overlay
│   │   │   ├── PreviewPlayer.tsx     # Remotion Player wrapper
│   │   │   ├── PropertiesPanel.tsx   # Layer inspector & coordinate editor
│   │   │   ├── RenderModal.tsx       # Export modal & live progress bar
│   │   │   ├── ShortcutsModal.tsx    # Keyboard shortcuts guide
│   │   │   └── Timeline/             # Multi-layer timeline tracks & scrubber
│   │   └── utils/               # Coordinate math, timecode, json importer
│   ├── remotion/                # Remotion composition & blur components
│   │   ├── composition/         # Main composition root (<OffthreadVideo />)
│   │   ├── components/          # BlurEffectLayer (backdrop-filter)
│   │   └── Root.tsx             # Remotion entrypoint for bundler
│   ├── state/                   # React Context state & undo/redo reducer
│   ├── types/                   # TypeScript project & effect interfaces
│   ├── App.tsx                  # Root layout
│   └── main.tsx                 # Vite DOM entrypoint
├── .env.example                 # Port configuration template
├── .gitignore                   # Ignores videos, builds, logs & Python caches
├── package.json                 # Scripts and dependencies
├── tsconfig.json                # TypeScript compiler config
└── vite.config.ts               # Vite bundler & backend proxy config
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** (or `pnpm` / `yarn`)
- *(Optional)* **Python 3.9+** for running the OCR detection pipeline

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Siddharthmarko/auto_blur_sensi_info.git
cd auto_blur_sensi_info
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

*(Default port is `3001` for the backend and `3000` for Vite)*

### 3. Start Development Server

Run both frontend and backend concurrently with a single command:

```bash
npm run dev
```

- 🌐 **Web Studio**: [http://localhost:3000](http://localhost:3000)
- ⚡ **Backend API**: [http://localhost:3001](http://localhost:3001)

---

## 🤖 Running the Python OCR Text Detection Pipeline

To scan a video for sensitive text and automatically generate coordinates for the editor:

1. Open a terminal and navigate to `auto-blur/`:
   ```bash
   cd auto-blur
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows:
   python -m venv venv
   .\venv\Scripts\activate

   # macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy your target video as `input_video.mp4` into the `auto-blur/` directory.
5. Run the detection script:
   ```bash
   python video_ocr.py
   ```
6. The script analyzes frames, detects text bounding boxes, and generates:
   ```text
   auto-blur/output/blur_data.json
   ```
7. Open the Web Editor, click **Import JSON** in the top navigation bar or sidebar, and import your `blur_data.json` file. Filter by keywords or import all detected areas as editable blur layers!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Play / Pause video playback |
| `←` / `→` | Step 1 frame backward / forward |
| `Shift + ←` / `Shift + →` | Jump 10 frames backward / forward |
| `J` / `K` / `L` | Shuttle playback (Rewind / Pause / Fast Forward) |
| `B` | Activate Blur creation tool (click & drag on video) |
| `V` | Activate Selection & transform tool |
| `Delete` / `Backspace` | Remove selected blur effect |
| `Ctrl + Z` / `Cmd + Z` | Undo last action |
| `Ctrl + Y` / `Cmd + Shift + Z` | Redo action |
| `Home` / `End` | Jump to start / end of video |

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload video file (`multipart/form-data`, field: `video`) |
| `POST` | `/api/render` | Trigger headless Remotion render job (`{ project, settings }`) |
| `GET` | `/api/render/:id` | Poll progress, status, and download link for a job |
| `GET` | `/api/renders` | Retrieve all historical render jobs |
| `GET` | `/uploads/:filename` | Stream uploaded video with HTTP 206 byte-range support |
| `GET` | `/renders/:filename` | Download or preview rendered MP4 video |

---

## 🛠️ Build & Production Commands

- `npm run build`: Type-checks with `tsc` and compiles the client with `vite build`.
- `npm run preview`: Previews the production build locally.
- `npm run server`: Runs the Express backend server with `tsx`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
