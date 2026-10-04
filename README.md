# SmartAttend AI

SmartAttend AI is a university attendance management system with role-based access control and real webcam face recognition. It manages departments, academic sections, subjects, faculty assignments, student enrollment, lecture-wise attendance sessions, reports, correction requests, and audit activity.

Attendance is recorded against a specific class section and lecture subject. A section has one student roster shared across its subjects, while each attendance session represents one lecture. Face recognition uses real YuNet and SFace ONNX models; the system never fabricates recognition results or attendance records.

## Features

- Role-specific dashboards and navigation for Admin, HOD, and Teacher users.
- Department-scoped HOD access and class/subject-scoped Teacher access.
- Four seeded BCA sections with separate student rosters and timetable lecture ordering.
- Subject-specific faculty assignments.
- Lecture-wise attendance sessions with face or manual marking.
- Duplicate attendance prevention through application checks and a MongoDB unique index.
- Student face enrollment using OpenCV YuNet and SFace embeddings.
- Student transfers with enrollment history; existing attendance records are preserved.
- Attendance reports, CSV export, low-attendance metrics, correction requests, and audit logs.
- Responsive desktop and mobile React interface.

## Technology

| Layer       | Technology                                                   |
| ----------- | ------------------------------------------------------------ |
| Frontend    | React 18, Vite, Tailwind CSS, Axios, Lucide React            |
| Backend     | Node.js, Express, Mongoose, JWT, bcryptjs                    |
| Database    | MongoDB                                                      |
| AI service  | Python, FastAPI, Uvicorn, OpenCV, NumPy                      |
| Face models | YuNet face detector and SFace face recognizer in ONNX format |

## Project Structure

```text
ai-service/     FastAPI face detection, enrollment, quality, and matching service
backend/        Express REST API, MongoDB models, authorization, and reports
frontend/       React/Vite web application
docs/           SRS, architecture, database, API, testing, and viva documentation
```

## Requirements

- Node.js 18 or newer
- Python 3.10 or newer
- MongoDB running on port `27017`
- A webcam for enrollment and live face attendance
- Modern browser with camera permission support

## Configuration

Copy the example files before starting the services.

### Backend

```powershell
Copy-Item backend\.env.example backend\.env
```

Important backend settings:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartattend
JWT_SECRET=replace-with-a-private-secret
JWT_EXPIRE=7d
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_SECRET=replace-with-the-same-ai-secret
ATTENDANCE_THRESHOLD=75
```

Use a private `JWT_SECRET` and `AI_SERVICE_SECRET` outside local development. Real `.env` files are ignored by Git; only `.env.example` files should be committed.

### Frontend

```powershell
Copy-Item frontend\.env.example frontend\.env
```

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### AI service

```powershell
Copy-Item ai-service\.env.example ai-service\.env
```

The AI service settings control the recognition threshold and image-quality checks. The YuNet and SFace model files are stored in `ai-service/app/models/weights/`.

## Installation and Running

Start MongoDB first, then use four terminals.

### 1. Install backend dependencies

```powershell
Set-Location backend
npm install
```

### 2. Install AI dependencies

Create a virtual environment if desired, then install the requirements:

```powershell
Set-Location ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

On macOS/Linux, activate with `source .venv/bin/activate` instead.

### 3. Seed demo data

The seed command clears the SmartAttend database and creates demo data. Run it only when a reset is intended:

```powershell
Set-Location backend
npm run seed
```

The seed creates:

- 1 Computer Applications department
- 4 BCA 3rd Year sections: A, B, C, and D
- 7 timetable subjects
- 5 teachers with rotated subject assignments
- 40 students, 10 per section
- Historical lecture-wise attendance sessions and records

### 4. Start the AI service

```powershell
Set-Location ai-service
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

Health endpoint: `http://localhost:8000/health`

### 5. Start the backend

```powershell
Set-Location backend
npm run dev
```

API base URL: `http://localhost:5000/api/v1`  
Health endpoint: `http://localhost:5000/health`

For a single non-watching process, use `npm start` instead.

### 6. Start the frontend

```powershell
Set-Location frontend
npm install
npm run dev
```

Open `http://localhost:5173` in a browser.

## Demo Accounts

All seeded demo accounts use the password `password123`.

| Role    | Email                     | Scope                                                       |
| ------- | ------------------------- | ----------------------------------------------------------- |
| Admin   | `admin@university.edu`    | System-wide users, departments, audit, and reports          |
| HOD     | `hod@university.edu`      | Assigned department classes, faculty, students, and reports |
| Teacher | `vaishali@university.edu` | Assigned sections and lecture subjects                      |
| Teacher | `shreya@university.edu`   | Assigned sections and lecture subjects                      |
| Teacher | `rehan@university.edu`    | Assigned sections and lecture subjects                      |
| Teacher | `priyanka@university.edu` | Assigned sections and lecture subjects                      |
| Teacher | `arij@university.edu`     | Assigned sections and lecture subjects                      |

Teachers can start attendance only for a lecture assigned to them. The backend enforces this even if a URL or request body is modified.

## Attendance Workflow

1. Log in with an authorized teacher or HOD account.
2. Open **Take Attendance**.
3. Select an assigned section and lecture subject.
4. Start the session and allow camera access.
5. Present one enrolled face at a time. The AI service returns a match only when recognition passes its configured threshold.
6. Duplicate records in the same session are ignored.
7. Finalize the session to close it and optionally mark remaining active students absent.
8. Review the persisted session records and export reports.

Raw webcam images are not stored. Face embeddings are kept server-side and excluded from normal student queries.

## Testing

### Backend tests

```powershell
Set-Location backend
npm test
```

The suite checks password hashing, student creation, duplicate roll numbers, face-enrollment fields, attendance record creation, duplicate attendance protection, and session finalization.

### Frontend build and lint

```powershell
Set-Location frontend
npm run build
npm run lint
```

### AI tests

```powershell
Set-Location ai-service
pytest tests/
```

## API Areas

- `/api/v1/auth` - login, current user, and logout
- `/api/v1/classes` - role-scoped class and section management
- `/api/v1/students` - student records, transfers, and face enrollment
- `/api/v1/attendance` - sessions, recognition, manual marking, finalization, and records
- `/api/v1/reports` - dashboards, attendance reports, and CSV export
- `/api/v1/admin` - admin user, department, and audit management
- `/api/v1/corrections` - attendance correction requests and review

See the detailed API reference in [docs/04-API-Documentation.md](docs/04-API-Documentation.md).

## Documentation

- [System Requirements](docs/01-SRS.md)
- [System Architecture](docs/02-System-Architecture.md)
- [Database Design](docs/03-Database-Design.md)
- [API Documentation](docs/04-API-Documentation.md)
- [Test Cases](docs/05-Test-Cases.md)
- [Future Scope](docs/06-Future-Scope.md)
- [Viva Questions](docs/07-Viva-Questions.md)

## Troubleshooting

### Dashboard or API request fails

Confirm MongoDB and the Express backend are running, then check `http://localhost:5000/health`. Also verify that `VITE_API_URL` points to the backend API.

### Face recognition is unavailable

Confirm the FastAPI service is running on port `8000`, the model files exist under `ai-service/app/models/weights/`, and the backend `AI_SERVICE_URL` and `AI_SERVICE_SECRET` match the AI service configuration.

### Camera does not start

Use `http://localhost:5173`, grant camera permission in the browser, and ensure no other application is using the webcam.

### Port already in use

Stop the existing process or change `PORT`, the Vite port, or the Uvicorn port and update the corresponding service URL.
