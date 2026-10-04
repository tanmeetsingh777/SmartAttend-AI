# Test Cases & Results - SmartAttend AI

| Test ID | Module | Scenario | Expected Result | Result |
|---|---|---|---|---|
| TC-01 | Auth | Valid Login | Returns JWT token and redirects to Dashboard | PASS |
| TC-02 | Auth | Invalid Credentials | Returns 401 Unauthorized error | PASS |
| TC-03 | Student | Duplicate Roll Number | Rejects duplicate roll insertion with 400 error | PASS |
| TC-04 | AI Service | Quality Check (Dark Image) | Rejects enrollment: "Image is too dark" | PASS |
| TC-05 | AI Service | Quality Check (Blurry Image) | Rejects enrollment: "Image is too blurry" | PASS |
| TC-06 | AI Service | Multiple Faces Detected | Rejects enrollment: "Multiple faces detected" | PASS |
| TC-07 | Enrollment | Valid Face Enrollment | Extracts 128-dim embedding & saves to MongoDB | PASS |
| TC-08 | Enrollment | Enrollment Deletion | Removes embedding, sets status to `not_enrolled` | PASS |
| TC-09 | Attendance | Enrolled Face Recognition | Identifies correct student ID & logs present | PASS |
| TC-10 | Attendance | Duplicate Face Recognition | Returns `already_marked`, prevents DB duplication | PASS |
| TC-11 | Attendance | Unknown Face Recognition | Returns `unknown`, does not mark anyone present | PASS |
| TC-12 | Attendance | Manual Override | Updates status to present/absent/late with notes | PASS |
| TC-13 | Reports | CSV Export | Generates formatted CSV file download | PASS |
