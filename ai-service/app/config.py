import os

AI_SERVICE_SECRET = os.getenv("AI_SERVICE_SECRET", "smartattend_ai_secret_key_2026")
MODEL_NAME = "OpenCV_YuNet_SFace"
MODEL_VERSION = "1.0.0"
COSINE_THRESHOLD = float(os.getenv("COSINE_THRESHOLD", "0.363"))
L2_THRESHOLD = float(os.getenv("L2_THRESHOLD", "1.128"))
MIN_FACE_SIZE = int(os.getenv("MIN_FACE_SIZE", "40")) # pixels
BLUR_THRESHOLD = float(os.getenv("BLUR_THRESHOLD", "30.0")) # Laplacian variance threshold
