# System Requirements Specification (SRS) - SmartAttend AI

## 1. Project Title & Overview
**SmartAttend AI** is an automated university attendance management system utilizing deep learning-based facial recognition. It enables teachers to take attendance seamlessly using webcam feeds, eliminates proxy attendance, and provides comprehensive attendance reporting.

## 2. System Scope
- **User Roles**: Admin (Department Head), Teacher (Faculty Member).
- **Core Modules**: Authentication, Student Management, Class Section Management, Live Face Attendance, Manual Correction Audit, Reports & CSV Export.
- **Biometric Processing**: Pretrained OpenCV YuNet ONNX face detection + SFace ONNX 128-dimensional feature embedding extraction.

## 3. Functional Requirements
1. **User Authentication**: JWT-based login with role authorization.
2. **Student & Class CRUD**: Full registration, roll number uniqueness validation, section assignments.
3. **Facial Enrollment**: Live webcam capture, quality validation (blurriness, darkness, face size), AI embedding extraction, persistent MongoDB storage.
4. **Live Facial Attendance**: Real-time webcam frame streaming, AI candidate comparison, automated present logging, duplicate prevention via MongoDB unique compound indexes.
5. **Manual Override**: Faculty ability to edit student status (present/absent/late) with audit notes.
6. **Analytics & Export**: Filterable attendance metrics with CSV downloading capability.

## 4. Non-Functional Requirements
- **Performance**: Frame recognition response under 500ms.
- **Security**: Raw images are not stored; only non-reversible 128-dim float arrays are saved. Internal AI endpoints authenticated via `X-AI-Secret`.
- **Usability**: Responsive glassmorphic SaaS interface optimized for desktop and mobile tablets.
