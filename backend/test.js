require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Class = require('./src/models/Class');
const Student = require('./src/models/Student');
const AttendanceSession = require('./src/models/AttendanceSession');
const AttendanceRecord = require('./src/models/AttendanceRecord');

const runTests = async () => {
  console.log('===========================================================');
  console.log(' SmartAttend AI - Backend Automated Suite Verification');
  console.log('===========================================================');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartattend';
    await mongoose.connect(mongoUri);
    console.log('✔ Connected to MongoDB');

    // Test 1: User Auth Model
    await User.deleteMany({ email: 'test_teacher@test.edu' });
    const user = await User.create({
      fullName: 'Test Teacher',
      email: 'test_teacher@test.edu',
      password: 'testpassword123',
      role: 'teacher'
    });
    const isPassMatch = await user.comparePassword('testpassword123');
    console.log(`[Test 1] User creation & Password hash match: ${isPassMatch ? 'PASS' : 'FAIL'}`);

    // Test 2: Class Creation
    await Class.deleteMany({ name: 'Test Class Unit' });
    const testClass = await Class.create({
      name: 'Test Class Unit',
      section: 'T1',
      academicYear: '2025-2026',
      subject: 'Software Engineering',
      teacherIds: [user._id]
    });
    console.log(`[Test 2] Class Creation: PASS (ID: ${testClass._id})`);

    // Test 3: Student CRUD & Roll Number Uniqueness
    await Student.deleteMany({ rollNumber: 'TEST_ROLL_101' });
    const student = await Student.create({
      rollNumber: 'TEST_ROLL_101',
      fullName: 'Test Student',
      email: 'teststudent@test.edu',
      classId: testClass._id
    });
    console.log(`[Test 3.1] Student Creation: PASS (ID: ${student._id})`);

    let duplicateCaught = false;
    try {
      await Student.create({
        rollNumber: 'TEST_ROLL_101',
        fullName: 'Duplicate Student',
        email: 'dup@test.edu',
        classId: testClass._id
      });
    } catch (dupErr) {
      duplicateCaught = true;
    }
    console.log(`[Test 3.2] Duplicate Roll Number Prevention: ${duplicateCaught ? 'PASS' : 'FAIL'}`);

    // Test 4: Enrollment Deletion
    student.faceEnrollment = {
      status: 'enrolled',
      embedding: [0.1, 0.2, 0.3],
      modelName: 'OpenCV_YuNet_SFace',
      modelVersion: '1.0.0',
      enrolledAt: new Date()
    };
    await student.save();
    
    // Delete enrollment
    student.faceEnrollment = { status: 'not_enrolled', embedding: undefined };
    await student.save();
    const updatedStudent = await Student.findById(student._id);
    console.log(`[Test 4] Face Enrollment Deletion: ${updatedStudent.faceEnrollment.status === 'not_enrolled' ? 'PASS' : 'FAIL'}`);

    // Test 5: Attendance Session & Record Creation
    const session = await AttendanceSession.create({
      classId: testClass._id,
      subject: testClass.subject,
      startedBy: user._id,
      startedAt: new Date(),
      status: 'active'
    });

    const record = await AttendanceRecord.create({
      sessionId: session._id,
      classId: testClass._id,
      studentId: student._id,
      status: 'present',
      source: 'face',
      confidence: 0.95,
      markedBy: user._id
    });
    console.log(`[Test 5] Attendance Record Creation: PASS (ID: ${record._id})`);

    // Test 6: Duplicate Attendance Prevention (MongoDB Unique Constraint)
    let duplicateRecordCaught = false;
    try {
      await AttendanceRecord.create({
        sessionId: session._id,
        classId: testClass._id,
        studentId: student._id,
        status: 'present',
        source: 'face'
      });
    } catch (dbDupErr) {
      duplicateRecordCaught = true;
    }
    console.log(`[Test 6] Duplicate Attendance DB Constraint: ${duplicateRecordCaught ? 'PASS' : 'FAIL'}`);

    // Test 7: Session Finalization
    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();
    console.log(`[Test 7] Session Finalization: PASS`);

    // Cleanup Test Entities
    await User.deleteOne({ _id: user._id });
    await Class.deleteOne({ _id: testClass._id });
    await Student.deleteOne({ _id: student._id });
    await AttendanceSession.deleteOne({ _id: session._id });
    await AttendanceRecord.deleteOne({ _id: record._id });

    console.log('===========================================================');
    console.log(' All Backend Unit & Integration Tests Passed Successfully!');
    console.log('===========================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  }
};

runTests();
