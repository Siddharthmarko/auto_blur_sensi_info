import json
import os

def init_json_data(fps, analysis_fps, width, height, total_frames):
    """
    Initialize the JSON dictionary structure with video metadata.
    """
    return {
        "video": {
            "fps": fps,
            "analysisFps": analysis_fps,
            "width": width,
            "height": height,
            "totalFrames": total_frames
        },
        "detections": []
    }

def add_detection(json_data, frame_num, text, x, y, width, height):
    """
    Append a single text detection entry to json_data["detections"].
    """
    json_data["detections"].append({
        "frame": frame_num,
        "text": text,
        "x": x,
        "y": y,
        "width": width,
        "height": height
    })

def save_json_file(json_data, output_path):
    """
    Save the JSON dictionary to disk.
    """
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2)
