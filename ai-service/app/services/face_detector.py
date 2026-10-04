import cv2
import numpy as np
from app.models.pretrained import FaceModels

def detect_faces(image: np.ndarray):
    """
    Detect faces using OpenCV YuNet.
    Returns:
    faces: np.ndarray where each row is [x, y, w, h, x_re, y_re, x_le, y_le, x_n, y_n, x_rm, y_rm, x_lm, y_lm, score]
    count: integer number of detected faces
    """
    if image is None or image.size == 0:
        return None, 0

    h, w, _ = image.shape
    models = FaceModels.get_instance()
    models.detector.setInputSize((w, h))

    _, faces = models.detector.detect(image)
    if faces is None:
        return None, 0

    return faces, len(faces)
