import base64
import cv2
import numpy as np
import logging
from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import AI_SERVICE_SECRET, MODEL_NAME, MODEL_VERSION
from app.schemas.face_schemas import EnrollResponse, RecognizeRequest, RecognizeResponse
from app.services.face_detector import detect_faces
from app.services.face_embedding import generate_embedding
from app.services.face_matcher import match_face
from app.services.quality import check_image_quality

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smartattend_ai")

app = FastAPI(
    title="SmartAttend AI Face Recognition Service",
    description="Microservice for face detection, quality check, real face embedding extraction & similarity matching",
    version=MODEL_VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_secret(x_ai_secret: str = Header(None, alias="X-AI-Secret")):
    if AI_SERVICE_SECRET and x_ai_secret != AI_SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized AI service access")
    return True

def decode_base64_image(base64_str: str) -> np.ndarray:
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        logger.error(f"Image decode error: {e}")
        return None

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SmartAttend AI Service",
        "modelName": MODEL_NAME,
        "modelVersion": MODEL_VERSION
    }

@app.post("/v1/enroll", response_model=EnrollResponse)
async def enroll_face(
    image: str = Form(None),
    file: UploadFile = File(None),
    authenticated: bool = Depends(verify_secret)
):
    img = None
    if file:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif image:
        img = decode_base64_image(image)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image payload")

    faces, count = detect_faces(img)

    if count == 0:
        return EnrollResponse(
            success=False,
            message="No face detected. Please position your face inside the camera.",
            modelName=MODEL_NAME,
            modelVersion=MODEL_VERSION
        )

    if count > 1:
        return EnrollResponse(
            success=False,
            message=f"Multiple faces detected ({count}). Only one person should be visible during enrollment.",
            modelName=MODEL_NAME,
            modelVersion=MODEL_VERSION
        )

    face_box = faces[0][:4]
    is_valid, quality_msg = check_image_quality(img, face_box)
    if not is_valid:
        return EnrollResponse(
            success=False,
            message=quality_msg,
            modelName=MODEL_NAME,
            modelVersion=MODEL_VERSION
        )

    embedding = generate_embedding(img, faces[0])

    return EnrollResponse(
        success=True,
        embedding=embedding,
        modelName=MODEL_NAME,
        modelVersion=MODEL_VERSION,
        message="Face enrollment successful."
    )

@app.post("/v1/recognize", response_model=RecognizeResponse)
async def recognize_face(
    req: RecognizeRequest,
    authenticated: bool = Depends(verify_secret)
):
    img = decode_base64_image(req.image)
    if img is None:
        return RecognizeResponse(
            success=False,
            matchedStudentId=None,
            confidence=0.0,
            status="error",
            message="Invalid camera frame"
        )

    faces, count = detect_faces(img)

    if count == 0:
        return RecognizeResponse(
            success=True,
            matchedStudentId=None,
            confidence=0.0,
            status="no_face",
            message="No face detected"
        )

    if count > 1:
        return RecognizeResponse(
            success=True,
            matchedStudentId=None,
            confidence=0.0,
            status="multiple_faces",
            message=f"Multiple faces detected ({count}). Please present one face."
        )

    face_box = faces[0][:4]
    is_valid, quality_msg = check_image_quality(img, face_box)
    if not is_valid:
        return RecognizeResponse(
            success=True,
            matchedStudentId=None,
            confidence=0.0,
            status="quality_error",
            message=quality_msg
        )

    embedding = generate_embedding(img, faces[0])
    
    # Compare against candidate student embeddings sent securely from Express backend
    candidates_data = [cand.model_dump() for cand in req.candidates]
    matched_cand, confidence, status = match_face(embedding, candidates_data)

    matched_id = matched_cand["studentId"] if matched_cand else None

    return RecognizeResponse(
        success=True,
        matchedStudentId=matched_id,
        confidence=confidence,
        status=status,
        message="Student recognized" if status == "matched" else "Unknown face"
    )
