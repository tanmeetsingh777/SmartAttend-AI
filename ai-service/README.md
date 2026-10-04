# SmartAttend AI - Python FastAPI Microservice

SmartAttend AI microservice responsible for real-time face detection, image quality verification, 128-dimensional facial embedding generation, and cosine similarity matching.

## Architecture & Pretrained Model
- **Face Detection Model**: YuNet (`FaceDetectorYN`), high-speed ONNX face detector.
- **Face Recognition Model**: SFace (`FaceRecognizerSF`), deep neural network for feature extraction yielding a 128-dim L2 normalized feature vector.
- **Matching Metric**: Cosine Similarity with calibrated threshold of `0.363`.

## Installation & Setup

1. Create Python virtual environment:
```bash
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run FastAPI microservice:
```bash
uvicorn app.main:app --reload --port 8000
```

## Endpoints
- `GET /health` : Health check & model status
- `POST /v1/enroll` : Validates quality & returns 128-dim face embedding
- `POST /v1/recognize` : Compares live frame against candidate embeddings and returns match result with confidence score

## Run Tests
```bash
pytest tests/
```
