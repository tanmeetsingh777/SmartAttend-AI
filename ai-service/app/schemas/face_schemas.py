from pydantic import BaseModel, Field
from typing import List, Optional

class CandidateItem(BaseModel):
    studentId: str
    embedding: List[float]

class RecognizeRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image string or data URL")
    candidates: List[CandidateItem]

class RecognizeResponse(BaseModel):
    success: bool
    matchedStudentId: Optional[str] = None
    confidence: float
    status: str # "matched", "unknown", "no_face", "multiple_faces", "quality_error"
    message: Optional[str] = None

class EnrollResponse(BaseModel):
    success: bool
    embedding: Optional[List[float]] = None
    modelName: str
    modelVersion: str
    message: Optional[str] = None
