# REST API Documentation - SmartAttend AI

## Base URL: `http://localhost:5000/api/v1`

### Authentication Endpoints
- `POST /auth/login` - Authenticates user and returns JWT token
- `GET /auth/me` - Retrieves authenticated user profile
- `POST /auth/logout` - Logs out user

### Class Endpoints
- `GET /classes` - Retrieves assigned classes
- `POST /classes` - Creates new class section
- `GET /classes/:id` - Retrieves class details
- `PUT /classes/:id` - Updates class details
- `DELETE /classes/:id` - Deactivates class

### Student & Facial Enrollment Endpoints
- `GET /students` - Lists students (supports `search`, `classId`, `status`)
- `POST /students` - Registers new student
- `GET /students/:id` - Retrieves student profile & attendance history
- `PUT /students/:id` - Updates student info
- `DELETE /students/:id` - Deactivates student
- `POST /students/:studentId/enrollment` - Validates face image & stores 128-dim embedding
- `GET /students/:studentId/enrollment` - Retrieves facial enrollment metadata
- `DELETE /students/:studentId/enrollment` - Removes facial enrollment data

### Attendance Endpoints
- `POST /attendance/sessions` - Starts new live attendance session
- `GET /attendance/sessions` - Lists attendance sessions
- `GET /attendance/sessions/:id` - Retrieves session summary & student logs
- `POST /attendance/sessions/:id/recognize` - Receives frame, runs AI recognition, logs present status
- `POST /attendance/sessions/:id/manual` - Manual override (present/absent/late)
- `PUT /attendance/records/:id` - Updates specific record
- `POST /attendance/sessions/:id/finalize` - Concludes session & auto-marks absentees

### Reports Endpoints
- `GET /reports/dashboard` - Retrieves dashboard metrics & weekly trend
- `GET /reports/attendance` - Filtered attendance log reports
- `GET /reports/attendance/export` - Downloads CSV file
