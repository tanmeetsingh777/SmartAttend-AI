import cv2
import numpy as np
from app.config import MIN_FACE_SIZE, BLUR_THRESHOLD

def check_image_quality(image: np.ndarray, face_box: tuple = None) -> tuple[bool, str]:
    """
    Validates image quality:
    - Checks blur using Laplacian variance
    - Checks brightness/darkness
    - Checks minimum face dimensions
    Returns (is_valid, reason_if_invalid)
    """
    if image is None or image.size == 0:
        return False, "Invalid image data"

    # Convert to grayscale for quality assessment
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    # 1. Darkness / Brightness check
    mean_brightness = np.mean(gray)
    if mean_brightness < 30:
        return False, "Image is too dark. Please ensure good lighting."
    if mean_brightness > 230:
        return False, "Image is overexposed/too bright."

    # 2. Blur check using Laplacian variance
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < BLUR_THRESHOLD:
        return False, f"Image is too blurry (quality score: {laplacian_var:.1f}). Hold camera steady."

    # 3. Face size check if face_box (w, h) is provided
    if face_box is not None:
        w, h = face_box[2], face_box[3]
        if w < MIN_FACE_SIZE or h < MIN_FACE_SIZE:
            return False, f"Face is too small ({int(w)}x{int(h)}px). Move closer to camera."

    return True, "OK"
