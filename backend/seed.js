require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const Class = require("./src/models/Class");
const Student = require("./src/models/Student");
const Subject = require("./src/models/Subject");
const AttendanceSession = require("./src/models/AttendanceSession");
const AttendanceRecord = require("./src/models/AttendanceRecord");
const Department = require("./src/models/Department");

const seedData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/smartattend",
    );
    await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      Student.deleteMany({}),
      Subject.deleteMany({}),
      AttendanceSession.deleteMany({}),
      AttendanceRecord.deleteMany({}),
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
      fullName: "Dr. Ramesh Sharma",
      email: "hod@university.edu",
      password: "password123",
      role: "hod",
      departmentIds: [department._id],
    });
    const teachers = await User.create([
      {
        fullName: "Ms. Vaishali",
        email: "vaishali@university.edu",
        password: "password123",
        role: "teacher",
      },
      {
        fullName: "Ms. Shreya",
        email: "shreya@university.edu",
        password: "password123",
        role: "teacher",
      },
      {
        fullName: "Mr. Rehan",
        email: "rehan@university.edu",
        password: "password123",
        role: "teacher",
      },
      {
        fullName: "Ms. Priyanka Rai",
        email: "priyanka@university.edu",
        password: "password123",
        role: "teacher",
      },
      {
        fullName: "Mr. Arij",
        email: "arij@university.edu",
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

    const studentRows = [];
    const names = [
      "Rahul Sharma",
      "Priya Singh",
      "Aman Verma",
      "Sneha Patel",
      "Vikram Gupta",
      "Simran Kaur",
      "Rohan Mehta",
      "Ananya Roy",
      "Deepak Kumar",
      "Meera Joshi",
    ];
    for (
      let sectionIndex = 0;
      sectionIndex < classes.length;
      sectionIndex += 1
    ) {
      for (
        let studentIndex = 0;
        studentIndex < names.length;
        studentIndex += 1
      ) {
        const section = classes[sectionIndex].section;
        studentRows.push({
          rollNumber: `BCA2026${section}${String(studentIndex + 1).padStart(2, "0")}`,
          fullName: `${names[studentIndex]} (${section})`,
          email: `${section.toLowerCase()}${studentIndex + 1}@student.edu`,
          classId: classes[sectionIndex]._id,
          enrollmentHistory: [{ classId: classes[sectionIndex]._id }],
        });
      }
    }
    const students = await Student.insertMany(studentRows);

    const now = new Date();
    for (let day = 3; day >= 1; day -= 1) {
      for (
        let sectionIndex = 0;
        sectionIndex < classes.length;
        sectionIndex += 1
      ) {
        const classObj = classes[sectionIndex];
        const subjectIndex = (day + sectionIndex) % subjects.length;
        const subject = subjects[subjectIndex];
        const teacher = subjectData[subjectIndex][2];
        const startedAt = new Date(now);
        startedAt.setDate(now.getDate() - day);
        startedAt.setHours(9 + subjectIndex, 10, 0, 0);
        const session = await AttendanceSession.create({
          classId: classObj._id,
          subjectId: subject._id,
          subject: subject.name,
          startedBy: teacher._id,
          startedAt,
          endedAt: new Date(startedAt.getTime() + 50 * 60000),
          status: "completed",
        });
        const sectionStudents = students.filter(
          (student) => String(student.classId) === String(classObj._id),
        );
        await AttendanceRecord.insertMany(
          sectionStudents.map((student, index) => ({
            sessionId: session._id,
            classId: classObj._id,
            studentId: student._id,
            status:
              index % 5 === 2 ? "absent" : index % 7 === 0 ? "late" : "present",
            source: "manual",
            markedAt: startedAt,
            markedBy: teacher._id,
            notes: "Seeded lecture-wise record",
          })),
        );
      }
    }

    console.log(
      `[Seed] Created admin, HOD, ${teachers.length} teachers, 4 sections, ${subjects.length} subjects and ${students.length} section-specific students.`,
    );
    console.log("[Seed] Password for demo accounts: password123");
    process.exit(0);
  } catch (error) {
    console.error("[Seed Error]:", error);
    process.exit(1);
  }
};

seedData();
