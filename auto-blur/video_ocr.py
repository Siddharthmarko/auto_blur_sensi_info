import cv2
import easyocr
import os
import time

from ocr_text_detection import detect_text_in_frame
from json_writer import init_json_data, add_detection, save_json_file

# ---------- CONFIG ----------
INPUT_VIDEO = "input_video.mp4"
OUTPUT_FOLDER = "output"
OUTPUT_JSON = "blur_data.json"
TARGET_ANALYSIS_FPS = 30.0
LOG_INTERVAL = 10

def main():
    base_dir = os.path.dirname(__file__)
    video_path = os.path.join(base_dir, INPUT_VIDEO)
    output_dir = os.path.join(base_dir, OUTPUT_FOLDER)
    output_json_path = os.path.join(output_dir, OUTPUT_JSON)

    os.makedirs(output_dir, exist_ok=True)

    # ---------- CHECK VIDEO FILE ----------
    if not os.path.exists(video_path):
        print(f"[ERROR] Video file not found: {video_path}")
        return

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"[ERROR] Failed to open video file: {video_path}")
        return

    # ---------- VIDEO METADATA ----------
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if fps <= 0 or width <= 0 or height <= 0:
        print("[ERROR] Invalid video metadata.")
        cap.release()
        return

    frame_sample_step = max(1, int(round(fps / TARGET_ANALYSIS_FPS)))
    analysis_fps = round(fps / frame_sample_step, 2)
    total_analyzed_frames = (total_frames + frame_sample_step - 1) // frame_sample_step

    print(f"[INFO] Video loaded: {INPUT_VIDEO}", flush=True)
    print(f"[INFO] Resolution: {width}x{height} | Source FPS: {fps:.2f} | Target 30 FPS Sampling: {analysis_fps:.2f} FPS (Step: {frame_sample_step}) | Frames to analyze: {total_analyzed_frames} of {total_frames}", flush=True)

    json_data = init_json_data(
        fps=round(fps, 2),
        analysis_fps=analysis_fps,
        width=width,
        height=height,
        total_frames=total_frames
    )

    # ---------- INIT OCR ----------
    print("[INFO] Initializing EasyOCR reader...", flush=True)
    reader = easyocr.Reader(['en'], gpu=False)

    # ---------- PROCESS FRAMES ----------
    frame_idx = 0
    analyzed_count = 0
    start_time = time.time()

    print("[INFO] Starting frame-by-frame text detection...", flush=True)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_sample_step == 0:
            analyzed_count += 1
            frame_start = time.time()

            detections = detect_text_in_frame(frame, reader)

            for det in detections:
                add_detection(
                    json_data,
                    frame_num=frame_idx,
                    text=det["text"],
                    x=det["x"],
                    y=det["y"],
                    width=det["width"],
                    height=det["height"]
                )

            frame_time = time.time() - frame_start
            percent = (analyzed_count / total_analyzed_frames) * 100 if total_analyzed_frames > 0 else 0

            if analyzed_count % LOG_INTERVAL == 0 or analyzed_count == 1:
                print(f"[PROGRESS] Analyzed frame {analyzed_count}/{total_analyzed_frames} (Original Frame {frame_idx}/{total_frames}, {percent:.1f}%) in {frame_time:.2f}s | Detections: {len(detections)}", flush=True)

        frame_idx += 1

    cap.release()

    # ---------- SAVE JSON ----------
    save_json_file(json_data, output_json_path)

    total_time = time.time() - start_time
    print(f"\n[DONE] Analyzed {analyzed_count} frames (total video frames: {frame_idx}) in {total_time:.1f}s.", flush=True)
    print(f"[SUCCESS] Saved detection JSON: {output_json_path}", flush=True)

if __name__ == "__main__":
    main()
