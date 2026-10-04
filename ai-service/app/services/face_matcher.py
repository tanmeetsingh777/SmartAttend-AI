import numpy as np
import cv2
from app.models.pretrained import FaceModels
from app.config import COSINE_THRESHOLD

def match_face(target_embedding: list[float], candidates: list[dict]) -> tuple[dict | None, float, str]:
    """
    Compares target_embedding against list of candidates:
    candidates: [{"studentId": "...", "embedding": [128 floats]}]
    Returns (matched_candidate_dict_or_None, max_confidence_score, status)
    """
    if not candidates or not target_embedding:
        return None, 0.0, "unknown"

    models = FaceModels.get_instance()
    target_feat = np.array(target_embedding, dtype=np.float32).reshape(1, -1)

    best_match = None
    max_score = -1.0

    for candidate in candidates:
        cand_embed = candidate.get("embedding")
        if not cand_embed or len(cand_embed) != 128:
            continue
        cand_feat = np.array(cand_embed, dtype=np.float32).reshape(1, -1)
        
        # Calculate Cosine similarity using OpenCV SFace match
        score = models.recognizer.match(target_feat, cand_feat, cv2.FaceRecognizerSF_FR_COSINE)
        
        if score > max_score:
            max_score = score
            best_match = candidate

    # Convert score to float
    max_score = float(max_score)

    if max_score >= COSINE_THRESHOLD and best_match:
        # Calibrate confidence percentage for UX display
        # SFace cosine similarity ranges from ~0.363 (threshold) up to 1.0 (identical)
        norm_confidence = round(min(1.0, max(0.0, (max_score - COSINE_THRESHOLD) / (1.0 - COSINE_THRESHOLD) * 0.5 + 0.5)), 4)
        return best_match, norm_confidence, "matched"
    else:
        norm_confidence = round(max(0.0, max_score), 4) if max_score > 0 else 0.0
        return None, norm_confidence, "unknown"
