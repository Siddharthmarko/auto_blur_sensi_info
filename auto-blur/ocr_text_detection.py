import cv2

def detect_text_in_frame(img, reader, target_words=None, threshold=0.25, canvas_size=960):
    """
    Detect text in a single frame using EasyOCR.

    Args:
        img: numpy ndarray image frame (BGR).
        reader: easyocr.Reader instance.
        target_words (list[str], optional): List of target words to filter detections.
            If None, returns all detected text exceeding confidence threshold.
        threshold (float): Minimum confidence threshold (0.0 to 1.0).
        canvas_size (int): Max image dimension for CRAFT text detector (default 960 for speed).

    Returns:
        list[dict]: List of detection dicts formatted as:
            [
                {
                    "text": str,
                    "x": int,
                    "y": int,
                    "width": int,
                    "height": int
                }
            ]
    """
    if img is None:
        return []

    results = reader.readtext(img, canvas_size=canvas_size)
    detections = []
    img_h, img_w = img.shape[:2]

    for (bbox, text, score) in results:
        if score < threshold:
            continue

        text_str = str(text).strip()
        if not text_str:
            continue

        # Optional target word filtering
        if target_words:
            text_lower = text_str.lower()
            match_found = any(target.lower() in text_lower for target in target_words)
            if not match_found:
                continue

        # Convert quad bbox (tl, tr, br, bl) to bounding rectangle x, y, width, height
        xs = [pt[0] for pt in bbox]
        ys = [pt[1] for pt in bbox]

        x1 = int(min(xs))
        y1 = int(min(ys))
        x2 = int(max(xs))
        y2 = int(max(ys))

        # Clamp to frame boundaries
        x1 = max(0, min(img_w, x1))
        y1 = max(0, min(img_h, y1))
        x2 = max(0, min(img_w, x2))
        y2 = max(0, min(img_h, y2))

        width = x2 - x1
        height = y2 - y1

        if width <= 0 or height <= 0:
            continue

        detections.append({
            "text": text_str,
            "x": x1,
            "y": y1,
            "width": width,
            "height": height
        })

    return detections