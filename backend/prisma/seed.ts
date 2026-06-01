import { PrismaClient, Role, CourseType, RequestType, RequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Departments ──────────────────────────────────────────────────────────────
  const csDept = await prisma.department.upsert({
    where: { code: 'CS' },
    update: { avgWeeklyLoad: 30 },
    create: { name: 'Computer Science', code: 'CS', description: 'Computer Science Department', avgWeeklyLoad: 30 },
  });

  const mathDept = await prisma.department.upsert({
    where: { code: 'MATH' },
    update: { avgWeeklyLoad: 28 },
    create: { name: 'Mathematics', code: 'MATH', description: 'Mathematics Department', avgWeeklyLoad: 28 },
  });

  const engDept = await prisma.department.upsert({
    where: { code: 'ENG' },
    update: { avgWeeklyLoad: 25 },
    create: { name: 'English', code: 'ENG', description: 'English Language Department', avgWeeklyLoad: 25 },
  });

  // ── Programs ─────────────────────────────────────────────────────────────────
  const csProg = await prisma.program.upsert({
    where: { code: 'CS-BSC' },
    update: {},
    create: { name: 'Bachelor of Computer Science', code: 'CS-BSC', degreeLevel: 'BACHELOR', departmentId: csDept.id },
  });

  const mathProg = await prisma.program.upsert({
    where: { code: 'MATH-BSC' },
    update: {},
    create: { name: 'Bachelor of Mathematics', code: 'MATH-BSC', degreeLevel: 'BACHELOR', departmentId: mathDept.id },
  });

  // ── Semester ─────────────────────────────────────────────────────────────────
  const semester = await prisma.semester.upsert({
    where: { academicYear_term: { academicYear: '2025-2026', term: 1 } },
    update: { isCurrent: true, isActive: true, weekCount: 16 },
    create: {
      name: 'AY 2025-2026 Semester 1',
      academicYear: '2025-2026',
      term: 1,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-15'),
      isActive: true,
      isCurrent: true,
      weekCount: 16,
    },
  });

  // ── Users ────────────────────────────────────────────────────────────────────
  const adminHash  = await bcrypt.hash('Admin@123', 12);
  const headHash   = await bcrypt.hash('Head@123', 12);
  const facultyHash = await bcrypt.hash('Faculty@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@university.edu' },
    update: {},
    create: {
      employeeId: 'EMP001', email: 'admin@university.edu', passwordHash: adminHash,
      firstName: 'System', lastName: 'Admin', role: Role.ADMIN,
      departmentId: csDept.id, maxWeeklyHours: 40, minWeeklyHours: 0,
    },
  });

  // CS Head
  const csHead = await prisma.user.upsert({
    where: { email: 'cs.head@university.edu' },
    update: {},
    create: {
      employeeId: 'EMP002', email: 'cs.head@university.edu', passwordHash: headHash,
      firstName: 'Alisher', lastName: 'Karimov', role: Role.DEPARTMENT_HEAD,
      departmentId: csDept.id, maxWeeklyHours: 36, minWeeklyHours: 10,
    },
  });

  // MATH Head
  const mathHead = await prisma.user.upsert({
    where: { email: 'math.head@university.edu' },
    update: {},
    create: {
      employeeId: 'EMP006', email: 'math.head@university.edu', passwordHash: headHash,
      firstName: 'Nodira', lastName: 'Umarova', role: Role.DEPARTMENT_HEAD,
      departmentId: mathDept.id, maxWeeklyHours: 36, minWeeklyHours: 10,
    },
  });

  // CS Faculty
  const bobur = await prisma.user.upsert({
    where: { email: 'prof.yusupov@university.edu' },
    update: {},
    create: {
      employeeId: 'EMP003', email: 'prof.yusupov@university.edu', passwordHash: facultyHash,
      firstName: 'Bobur', lastName: 'Yusupov', role: Role.FACULTY,
      departmentId: csDept.id, maxWeeklyHours: 36, minWeeklyHours: 18,
      academicPosition: 'SENIOR_LECTURER',
    },
  });

  const dilnoza = await prisma.user.upsert({
    where: { email: 'prof.nazarova@university.edu' },
    update: {},
    create: {
      employeeId: 'EMP004', email: 'prof.nazarova@university.edu', passwordHash: facultyHash,
      firstName: 'Dilnoza', lastName: 'Nazarova', role: Role.FACULTY,
      departmentId: csDept.id, maxWeeklyHours: 36, minWeeklyHours: 18,
      academicPosition: 'ASSOCIATE_PROFESSOR',
    },
  });

  // Underloaded CS faculty — used to demo vacancy/underload logic
  const kamola = await prisma.user.upsert({
    where: { email: 'prof.rashidova@university.edu' },
    update: {},
    create: {
      employeeId: 'EMP007', email: 'prof.rashidova@university.edu', passwordHash: facultyHash,
      firstName: 'Kamola', lastName: 'Rashidova', role: Role.FACULTY,
      departmentId: csDept.id, maxWeeklyHours: 36, minWeeklyHours: 18,
      academicPosition: 'LECTURER',
    },
  });

  // MATH Faculty
  const sherzod = await prisma.user.upsert({
    where: { email: 'prof.toshmatov@university.edu' },
    update: {},
    create: {
      employeeId: 'EMP005', email: 'prof.toshmatov@university.edu', passwordHash: facultyHash,
      firstName: 'Sherzod', lastName: 'Toshmatov', role: Role.FACULTY,
      departmentId: mathDept.id, maxWeeklyHours: 36, minWeeklyHours: 18,
      academicPosition: 'ASSISTANT_PROFESSOR',
    },
  });

  const malika = await prisma.user.upsert({
    where: { email: 'prof.karimova@university.edu' },
    update: {},
    create: {
      employeeId: 'EMP008', email: 'prof.karimova@university.edu', passwordHash: facultyHash,
      firstName: 'Malika', lastName: 'Karimova', role: Role.FACULTY,
      departmentId: mathDept.id, maxWeeklyHours: 36, minWeeklyHours: 18,
      academicPosition: 'LECTURER',
    },
  });

  // ── Courses ───────────────────────────────────────────────────────────────────
  // weeklyLectureHours + weeklyTutorialHours + weeklyLabHours = weeklyHours
  const cs101 = await prisma.course.upsert({
    where: { courseCode: 'CS101' },
    update: { weeklyLectureHours: 2, weeklyTutorialHours: 1, weeklyLabHours: 0 },
    create: {
      courseCode: 'CS101', title: 'Introduction to Programming',
      type: CourseType.LECTURE, creditUnits: 3, weeklyHours: 3,
      weeklyLectureHours: 2, weeklyTutorialHours: 1, weeklyLabHours: 0,
      departmentId: csDept.id,
    },
  });

  const cs102 = await prisma.course.upsert({
    where: { courseCode: 'CS102' },
    update: { weeklyLectureHours: 2, weeklyTutorialHours: 1, weeklyLabHours: 0 },
    create: {
      courseCode: 'CS102', title: 'Data Structures',
      type: CourseType.LECTURE, creditUnits: 3, weeklyHours: 3,
      weeklyLectureHours: 2, weeklyTutorialHours: 1, weeklyLabHours: 0,
      departmentId: csDept.id,
    },
  });

  const cs103 = await prisma.course.upsert({
    where: { courseCode: 'CS103' },
    update: { weeklyLectureHours: 2, weeklyTutorialHours: 1, weeklyLabHours: 0 },
    create: {
      courseCode: 'CS103', title: 'Algorithms & Complexity',
      type: CourseType.LECTURE, creditUnits: 3, weeklyHours: 3,
      weeklyLectureHours: 2, weeklyTutorialHours: 1, weeklyLabHours: 0,
      departmentId: csDept.id,
    },
  });

  const cs201 = await prisma.course.upsert({
    where: { courseCode: 'CS201' },
    update: { weeklyLectureHours: 2, weeklyTutorialHours: 0, weeklyLabHours: 2 },
    create: {
      courseCode: 'CS201', title: 'Database Systems',
      type: CourseType.BOTH, creditUnits: 4, weeklyHours: 4,
      weeklyLectureHours: 2, weeklyTutorialHours: 0, weeklyLabHours: 2,
      departmentId: csDept.id,
    },
  });

  const cs101L = await prisma.course.upsert({
    where: { courseCode: 'CS101L' },
    update: { weeklyLectureHours: 0, weeklyTutorialHours: 0, weeklyLabHours: 2 },
    create: {
      courseCode: 'CS101L', title: 'Programming Lab',
      type: CourseType.LAB, creditUnits: 1, weeklyHours: 2,
      weeklyLectureHours: 0, weeklyTutorialHours: 0, weeklyLabHours: 2,
      departmentId: csDept.id,
    },
  });

  const math201 = await prisma.course.upsert({
    where: { courseCode: 'MATH201' },
    update: { weeklyLectureHours: 3, weeklyTutorialHours: 1, weeklyLabHours: 0 },
    create: {
      courseCode: 'MATH201', title: 'Calculus I',
      type: CourseType.LECTURE, creditUnits: 4, weeklyHours: 4,
      weeklyLectureHours: 3, weeklyTutorialHours: 1, weeklyLabHours: 0,
      departmentId: mathDept.id,
    },
  });

  const math202 = await prisma.course.upsert({
    where: { courseCode: 'MATH202' },
    update: { weeklyLectureHours: 3, weeklyTutorialHours: 1, weeklyLabHours: 0 },
    create: {
      courseCode: 'MATH202', title: 'Linear Algebra',
      type: CourseType.LECTURE, creditUnits: 4, weeklyHours: 4,
      weeklyLectureHours: 3, weeklyTutorialHours: 1, weeklyLabHours: 0,
      departmentId: mathDept.id,
    },
  });

  // ── WorkloadRecords (legacy admin assignments) ────────────────────────────────
  // Using upsert so re-running seed never creates duplicates.
  // totalHours = sum of all hour fields (weekly total in this system).
  // maxWeeklyHours for CS faculty = 36, minWeeklyHours = 18.

  // Bobur: CS101 (20h) + CS101L (14h) = 34h total → NORMAL
  await upsertWorkload({
    facultyId: bobur.id, courseId: cs101.id, semesterId: semester.id,
    lectureHours: 8, seminarHours: 4, labHours: 0,
    advisingHours: 2, researchHours: 4, adminHours: 2, otherHours: 0,
    totalHours: 20, isOverloaded: false, isUnderloaded: false,
    assignedById: admin.id,
  });

  await upsertWorkload({
    facultyId: bobur.id, courseId: cs101L.id, semesterId: semester.id,
    lectureHours: 0, seminarHours: 0, labHours: 8,
    advisingHours: 2, researchHours: 2, adminHours: 2, otherHours: 0,
    totalHours: 14, isOverloaded: false, isUnderloaded: false,
    assignedById: admin.id,
  });

  // Dilnoza: CS102 (40h) → OVERLOADED (40 > 36)
  await upsertWorkload({
    facultyId: dilnoza.id, courseId: cs102.id, semesterId: semester.id,
    lectureHours: 10, seminarHours: 4, labHours: 0,
    advisingHours: 4, researchHours: 12, adminHours: 6, otherHours: 4,
    totalHours: 40, isOverloaded: true, isUnderloaded: false,
    assignedById: admin.id,
  });

  // Kamola: CS103 (12h) → UNDERLOADED (12 < 18)
  await upsertWorkload({
    facultyId: kamola.id, courseId: cs103.id, semesterId: semester.id,
    lectureHours: 4, seminarHours: 2, labHours: 0,
    advisingHours: 2, researchHours: 2, adminHours: 2, otherHours: 0,
    totalHours: 12, isOverloaded: false, isUnderloaded: true,
    assignedById: admin.id,
  });

  // Sherzod (MATH): MATH201 (30h) → NORMAL
  await upsertWorkload({
    facultyId: sherzod.id, courseId: math201.id, semesterId: semester.id,
    lectureHours: 12, seminarHours: 4, labHours: 0,
    advisingHours: 4, researchHours: 6, adminHours: 4, otherHours: 0,
    totalHours: 30, isOverloaded: false, isUnderloaded: false,
    assignedById: admin.id,
  });

  // Malika (MATH): MATH202 (12h) → UNDERLOADED (12 < 18)
  await upsertWorkload({
    facultyId: malika.id, courseId: math202.id, semesterId: semester.id,
    lectureHours: 4, seminarHours: 2, labHours: 0,
    advisingHours: 2, researchHours: 2, adminHours: 2, otherHours: 0,
    totalHours: 12, isOverloaded: false, isUnderloaded: true,
    assignedById: admin.id,
  });

  // ── Sample Requests (from faculty → pending for Heads to review) ──────────────
  const existingReqs = await prisma.request.count();
  if (existingReqs === 0) {
    await prisma.request.createMany({
      data: [
        {
          type: RequestType.OVERLOAD_REQUEST,
          status: RequestStatus.PENDING,
          subject: 'Request for Additional Teaching Assignment',
          description:
            'I currently have only 12 teaching hours per week, which is below the minimum. ' +
            'I would like to take on an additional course (CS201 Database Systems) next semester ' +
            'to reach a more suitable workload.',
          submittedById: kamola.id,
        },
        {
          type: RequestType.ADJUST_HOURS,
          status: RequestStatus.PENDING,
          subject: 'Research Hours Adjustment for Project Grant',
          description:
            'I have been awarded a national research grant that requires 6 additional hours of ' +
            'research per week. I request that my research hours be officially updated from 4h to 10h ' +
            'and my seminar hours reduced accordingly.',
          submittedById: bobur.id,
        },
        {
          type: RequestType.EXTRA_ACTIVITY,
          status: RequestStatus.UNDER_REVIEW,
          subject: 'Academic Olympiad Preparation Committee',
          description:
            'I am volunteering to lead the CS Academic Olympiad preparation committee this semester. ' +
            'This involves 3 additional hours per week of student coaching. ' +
            'Requesting formal recognition of this extra activity in my workload.',
          submittedById: dilnoza.id,
        },
      ],
    });

    // MATH department requests
    await prisma.request.createMany({
      data: [
        {
          type: RequestType.ADD_COURSE,
          status: RequestStatus.PENDING,
          subject: 'Request to Teach Calculus II Next Semester',
          description:
            'I have completed teaching Calculus I this semester and would like to continue with ' +
            'Calculus II in the upcoming semester. I am qualified and available to take this course.',
          submittedById: sherzod.id,
        },
      ],
    });
  }

  console.log('\n✅ Seed completed!\n');
  console.log('📋 Test accounts:');
  console.log('  Admin:            admin@university.edu        / Admin@123');
  console.log('  CS Head:          cs.head@university.edu      / Head@123');
  console.log('  MATH Head:        math.head@university.edu    / Head@123');
  console.log('  CS Faculty 1:     prof.yusupov@university.edu / Faculty@123  (34h — NORMAL)');
  console.log('  CS Faculty 2:     prof.nazarova@university.edu/ Faculty@123  (40h — OVERLOADED)');
  console.log('  CS Faculty 3:     prof.rashidova@university.edu/Faculty@123  (12h — UNDERLOADED)');
  console.log('  MATH Faculty 1:   prof.toshmatov@university.edu/Faculty@123  (30h — NORMAL)');
  console.log('  MATH Faculty 2:   prof.karimova@university.edu/ Faculty@123  (12h — UNDERLOADED)');
  console.log('\n📊 What the CS Head sees:');
  console.log('  Dashboard: 3 faculty, 1 overloaded (Dilnoza), 1 underloaded (Kamola), 3 pending requests');
  console.log('  Workloads: Bobur 34h NORMAL, Dilnoza 40h OVERLOADED, Kamola 12h UNDERLOADED');
  console.log('\n📊 What the MATH Head sees:');
  console.log('  Dashboard: 2 faculty, 0 overloaded, 1 underloaded (Malika), 1 pending request');
  console.log('  Workloads: Sherzod 30h NORMAL, Malika 12h UNDERLOADED');
}

// ── Helper: idempotent WorkloadRecord upsert ──────────────────────────────────
async function upsertWorkload(data: {
  facultyId: string; courseId: string; semesterId: string;
  lectureHours: number; seminarHours: number; labHours: number;
  advisingHours: number; researchHours: number; adminHours: number; otherHours: number;
  totalHours: number; isOverloaded: boolean; isUnderloaded: boolean;
  assignedById: string;
}) {
  const existing = await prisma.workloadRecord.findFirst({
    where: { facultyId: data.facultyId, courseId: data.courseId, semesterId: data.semesterId },
  });
  if (existing) {
    return prisma.workloadRecord.update({
      where: { id: existing.id },
      data: {
        lectureHours: data.lectureHours, seminarHours: data.seminarHours, labHours: data.labHours,
        advisingHours: data.advisingHours, researchHours: data.researchHours, adminHours: data.adminHours,
        otherHours: data.otherHours, totalHours: data.totalHours,
        isOverloaded: data.isOverloaded, isUnderloaded: data.isUnderloaded,
        status: 'ACTIVE',
      },
    });
  }
  return prisma.workloadRecord.create({
    data: { ...data, status: 'ACTIVE' },
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
