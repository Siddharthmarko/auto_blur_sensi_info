import cv2
import easyocr
import os

# ---------- CONFIG ----------
THRESHOLD = 0.25
IMAGE_FOLDER = "Images"
OUTPUT_FOLDER = "output"

BLUR_KERNEL = (35, 35)

# Words / substrings to blur
TARGET_WORDS = ["OCR", "Requirement", "multithreading"]  # <-- edit 

# ---------- SETUP ----------
def blur_text_in_frame(img, reader, target_words=TARGET_WORDS, threshold=THRESHOLD, blur_kernel=BLUR_KERNEL, verbose=False):
    results = reader.readtext(img)

    for (bbox, text, score) in results:
        if score < threshold:
            continue

        text_lower = text.lower()

        for target in target_words:
            target_lower = target.lower()

            if target_lower in text_lower:

                (tl, tr, br, bl) = bbox

                x1, y1 = int(tl[0]), int(tl[1])
                x2, y2 = int(br[0]), int(br[1])

                # Clamp
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(img.shape[1], x2)
                y2 = min(img.shape[0], y2)

                box_width = x2 - x1

                if box_width <= 0:
                    continue

                # ---- FIND substring position ----
                start_idx = text_lower.find(target_lower)
                end_idx = start_idx + len(target_lower)

                total_len = len(text)
                if total_len == 0:
                    continue

                # ---- MAP to pixel coordinates ----
                sub_x1 = int(x1 + (start_idx / total_len) * box_width)
                sub_x2 = int(x1 + (end_idx / total_len) * box_width)

                roi = img[y1:y2, sub_x1:sub_x2]

                if roi.size == 0:
                    continue

                # ---- BLUR ONLY SUBSTRING REGION ----
                blurred_roi = cv2.GaussianBlur(roi, blur_kernel, 0)
                img[y1:y2, sub_x1:sub_x2] = blurred_roi

                if verbose:
                    print(f"Blurred '{target}' inside '{text}'")

    return img


if __name__ == "__main__":
    base_dir = os.path.dirname(__file__)
    image_dir = os.path.join(base_dir, IMAGE_FOLDER)
    output_dir = os.path.join(base_dir, OUTPUT_FOLDER)

    os.makedirs(output_dir, exist_ok=True)

    print("[INFO] Working directory:", base_dir)

    # ---------- LOAD IMAGES ----------
    if not os.path.exists(image_dir):
        print(f"[ERROR] Folder not found: {image_dir}")
        exit()

    img_paths = os.listdir(image_dir)

    if not img_paths:
        print("[ERROR] No images found in Images folder")
        exit()

    # ---------- INIT OCR ----------
    reader = easyocr.Reader(['en'], gpu=False)

    # ---------- PROCESS ----------
    for img_name in img_paths:

        img_path = os.path.join(image_dir, img_name)
        print(f"\n[INFO] Processing: {img_name}")

        img = cv2.imread(img_path)

        if img is None:
            print("[ERROR] Failed to read:", img_name)
            continue

        img = blur_text_in_frame(img, reader, TARGET_WORDS, THRESHOLD, BLUR_KERNEL, verbose=True)

        # ---------- SAVE ----------
        output_path = os.path.join(output_dir, f"result_{img_name}")

        if cv2.imwrite(output_path, img):
            print(f"[SUCCESS] Saved: {output_path}")
        else:
            print(f"[ERROR] Failed to save: {output_path}")

    print("\n[DONE] Substring-level blur applied.")