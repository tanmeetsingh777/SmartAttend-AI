import cv2
import numpy as np
from app.models.pretrained import FaceModels

def generate_embedding(image: np.ndarray, face_detection: np.ndarray) -> list[float]:
    """
    Align face and compute 128-dim feature embedding using OpenCV SFace.
    """
    models = FaceModels.get_instance()
    # Align and crop face using 5 facial landmarks
    aligned_face = models.recognizer.alignCrop(image, face_detection)
    # Extract 128-dim feature vector
    feature = models.recognizer.feature(aligned_face)
    # Flatten array and convert to standard python list of floats
    embedding = feature.flatten().tolist()
    return embedding
