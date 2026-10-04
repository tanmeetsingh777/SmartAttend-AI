import os
import cv2
import numpy as np
import pytest
from app.services.quality import check_image_quality
from app.services.face_matcher import match_face

def test_image_quality_dark():
    dark_img = np.zeros((200, 200, 3), dtype=np.uint8)
    valid, msg = check_image_quality(dark_img)
    assert valid is False
    assert "dark" in msg.lower()

def test_image_quality_blurry():
    # Synthetic flat image will fail laplacian blur test
    flat_img = np.full((200, 200, 3), 128, dtype=np.uint8)
    valid, msg = check_image_quality(flat_img)
    assert valid is False
    assert "blurry" in msg.lower()

def test_face_matcher_same_embedding():
    # Test identical embedding match
    dummy_embedding = [0.1] * 128
    candidates = [{"studentId": "s1", "embedding": dummy_embedding}]
    matched, confidence, status = match_face(dummy_embedding, candidates)
    assert matched is not None
    assert matched["studentId"] == "s1"
    assert status == "matched"
    assert confidence > 0.8

def test_face_matcher_orthogonal_embedding():
    # Test orthogonal embedding (should return unknown)
    embed1 = [1.0] + [0.0] * 127
    embed2 = [0.0] + [1.0] + [0.0] * 126
    candidates = [{"studentId": "s1", "embedding": embed2}]
    matched, confidence, status = match_face(embed1, candidates)
    assert matched is None
    assert status == "unknown"
