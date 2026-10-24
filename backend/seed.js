require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const User = require("./src/models/User");
const Class = require("./src/models/Class");
const Student = require("./src/models/Student");
const Subject = require("./src/models/Subject");
const AttendanceSession = require("./src/models/AttendanceSession");
const AttendanceRecord = require("./src/models/AttendanceRecord");
const AttendanceCorrectionRequest = require("./src/models/AttendanceCorrectionRequest");
const AuditLog = require("./src/models/AuditLog");
const Department = require("./src/models/Department");

const seedData = async () => {
  try {
    await connectDB();
    await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      Student.deleteMany({}),
      Subject.deleteMany({}),
      AttendanceSession.deleteMany({}),
      AttendanceRecord.deleteMany({}),
      AttendanceCorrectionRequest.deleteMany({}),
      AuditLog.deleteMany({}),
      Department.deleteMany({}),
    ]);

    const department = await Department.create({
      name: "Computer Applications",
      code: "CA",
    });
    await User.create({
      fullName: "System Administrator",
      email: "admin@university.edu",
      password: "password123",
      role: "admin",
    });
    await User.create({
      fullName: "Head of Department",
      email: "hod@university.edu",
      password: "password123",
      role: "hod",
      departmentIds: [department._id],
    });
    const teachers = await User.create([
      {
        fullName: "Prof. Anita Verma",
        email: "teacher@university.edu",
        password: "password123",
        role: "teacher",
      },
      {
        fullName: "Teacher 2",
        email: "teacher2@university.edu",
        password: "password123",
        role: "teacher",
      },
      {
        fullName: "Teacher 3",
        email: "teacher3@university.edu",
        password: "password123",
        role: "teacher",
      },
      {
        fullName: "Teacher 4",
        email: "teacher4@university.edu",
        password: "password123",
        role: "teacher",
      },
      {
        fullName: "Teacher 5",
        email: "teacher5@university.edu",
        password: "password123",
        role: "teacher",
      },
    ]);

    const subjectData = [
      ["BCA-501", "Introduction to DBMS", teachers[0]],
      ["BCA-502", "Java Programming and Dynamic Web", teachers[1]],
      ["BCA-503", "Computer Networks", teachers[2]],
      ["BCA-504", "Numerical Methods", teachers[3]],
      ["BCA-505", "DBMS Laboratory", teachers[0]],
      ["BCA-506", "Java Laboratory", teachers[1]],
      ["VAM", "Cyber Security", teachers[4]],
    ];
    const subjects = await Subject.create(
      subjectData.map(([code, name]) => ({
        code,
        name,
        departmentId: department._id,
      })),
    );

    const classes = [];
    for (const section of ["A", "B", "C", "D"]) {
      const offset = section.charCodeAt(0) - 65;
      const orderedSubjects = subjects.map(
        (_, index) => subjects[(index + offset) % subjects.length],
      );
      const assignments = subjects.map((subject, index) => ({
        subjectId: subject._id,
        teacherId: teachers[(index + offset) % teachers.length]._id,
      }));
      classes.push(
        await Class.create({
          name: "BCA 3rd Year",
          section,
          academicYear: "2026-2027",
          semester: "Odd Semester",
          course: "BCA",
          classCode: `BCA-3${section}`,
          capacity: 60,
          departmentId: department._id,
          subject: orderedSubjects[0].name,
          subjectIds: subjects.map((subject) => subject._id),
          lectureOrder: orderedSubjects.map((subject) => subject._id),
          teacherIds: [
            ...new Set(assignments.map((item) => item.teacherId.toString())),
          ],
          facultyAssignments: assignments,
        }),
      );
    }

    console.log(
      `[Seed] Created admin, HOD, ${teachers.length} teachers, 4 sections, and ${subjects.length} subjects. (No dummy students or attendance records created).`,
    );
    console.log("[Seed] Password for demo accounts: password123");
    process.exit(0);
  } catch (error) {
    console.error("[Seed Error]:", error);
    process.exit(1);
  }
};

seedData();
