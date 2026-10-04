import os
import urllib.request
import cv2
import logging

logger = logging.getLogger("smartattend_ai")

YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
SFACE_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "weights")

def ensure_model_files():
    os.makedirs(MODELS_DIR, exist_ok=True)
    yunet_path = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
    sface_path = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")

    if not os.path.exists(yunet_path) or os.path.getsize(yunet_path) < 100000:
        logger.info(f"Downloading YuNet model to {yunet_path}...")
        try:
            urllib.request.urlretrieve(YUNET_URL, yunet_path)
            logger.info("YuNet model downloaded successfully.")
        except Exception as e:
            logger.error(f"Failed downloading YuNet model: {e}")
            raise e

    if not os.path.exists(sface_path) or os.path.getsize(sface_path) < 100000:
        logger.info(f"Downloading SFace model to {sface_path}...")
        try:
            urllib.request.urlretrieve(SFACE_URL, sface_path)
            logger.info("SFace model downloaded successfully.")
        except Exception as e:
            logger.error(f"Failed downloading SFace model: {e}")
            raise e

    return yunet_path, sface_path

class FaceModels:
    _instance = None

    def __init__(self):
        yunet_path, sface_path = ensure_model_files()
        # Initialize YuNet face detector with default image size, will resize per input image
        self.detector = cv2.FaceDetectorYN.create(
            model=yunet_path,
            config="",
            input_size=(320, 320),
            score_threshold=0.6,
            nms_threshold=0.3,
            top_k=5000
        )
        # Initialize SFace face recognizer
        self.recognizer = cv2.FaceRecognizerSF.create(
            model=sface_path,
            config=""
        )

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = FaceModels()
        return cls._instance
