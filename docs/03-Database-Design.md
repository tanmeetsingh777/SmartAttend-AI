# Database Design & Schemas - SmartAttend AI

## MongoDB Collections & Schema Definitions

### 1. `users`
- `_id`: ObjectId
- `fullName`: String (Required)
- `email`: String (Unique Index)
- `password`: String (Bcrypt Hash)
- `role`: String ("admin" | "teacher")
- `isActive`: Boolean

### 2. `classes`
- `_id`: ObjectId
- `name`: String (e.g., "BCA 3rd Year")
- `section`: String (e.g., "A")
- `academicYear`: String (e.g., "2025-2026")
- `subject`: String (e.g., "Computer Networks")
- `teacherIds`: Array of Ref User ObjectIds
- `isActive`: Boolean

### 3. `students`
- `_id`: ObjectId
- `rollNumber`: String (Unique Index)
- `fullName`: String
- `email`: String
- `classId`: Ref Class ObjectId (Index)
- `isActive`: Boolean
- `faceEnrollment`:
  - `status`: String ("not_enrolled" | "enrolled")
  - `embedding`: Array of 128 Floats (`select: false` for security)
  - `modelName`: String ("OpenCV_YuNet_SFace")
  - `modelVersion`: String ("1.0.0")
  - `enrolledAt`: Date

### 4. `attendanceSessions`
- `_id`: ObjectId
- `classId`: Ref Class ObjectId
- `subject`: String
- `startedBy`: Ref User ObjectId
- `startedAt`: Date (Index)
- `endedAt`: Date
- `status`: String ("active" | "completed" | "cancelled")

### 5. `attendanceRecords`
- `_id`: ObjectId
- `sessionId`: Ref AttendanceSession ObjectId
- `classId`: Ref Class ObjectId
- `studentId`: Ref Student ObjectId
- `status`: String ("present" | "absent" | "late")
- `source`: String ("face" | "manual")
- `markedAt`: Date
- `confidence`: Number
- `markedBy`: Ref User ObjectId
- **Unique Constraint Index**: `{ sessionId: 1, studentId: 1 }` (Prevents duplicate attendance insertion at database level)
