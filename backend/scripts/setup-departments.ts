import { PrismaClient, Role, AcademicPosition, EmploymentType, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── CONFIGURATION ──────────────────────────────────────────────

const SCHOOLS = [
  { name: 'Mathematics', code: 'MATH' },
  { name: 'Information Technologies', code: 'IT' },
  { name: 'Artificial Intelligence & Robotics', code: 'AIR' },
  { name: 'Pre-primary', code: 'PREPRI' },
  { name: 'Primary', code: 'PRI' },
  { name: 'Chemistry', code: 'CHEM' },
  { name: 'Biology', code: 'BIO' },
  { name: 'Physics', code: 'PHYS' },
  { name: 'Geography', code: 'GEO' },
];

const PROGRAMS = [
  { name: 'Mathematics', code: 'MATH', degreeLevel: 'BACHELOR' },
  { name: 'Information Technologies', code: 'IT', degreeLevel: 'BACHELOR' },
  { name: 'Artificial Intelligence & Robotics', code: 'AIR', degreeLevel: 'BACHELOR' },
  { name: 'Pre-primary', code: 'PREPRI', degreeLevel: 'BACHELOR' },
  { name: 'Primary', code: 'PRI', degreeLevel: 'BACHELOR' },
  { name: 'Chemistry', code: 'CHEM', degreeLevel: 'BACHELOR' },
  { name: 'Biology', code: 'BIO', degreeLevel: 'BACHELOR' },
  { name: 'Physics', code: 'PHYS', degreeLevel: 'BACHELOR' },
  { name: 'Geography', code: 'GEO', degreeLevel: 'BACHELOR' },
];

// These are the Responsible Departments that appear in Course Catalog
const RESPONSIBLE_DEPARTMENTS = [
  'General Education',
  'English',
  'Mathematics',
  'Computer Science',
  'Education',
  'Pre-primary education',
  'Primary education',
  'Chemistry',
  'Biology',
  'Physics',
  'Geography',
];

const TEST_ACCOUNTS = [
  { email: 'admin@university.edu', password: 'Admin@123', role: Role.ADMIN, firstName: 'System', lastName: 'Admin', deptCode: 'MATH' },
  { email: 'cs.head@university.edu', password: 'Head@123', role: Role.DEPARTMENT_HEAD, firstName: 'Alisher', lastName: 'Karimov', deptCode: 'IT' },
  { email: 'prof.yusupov@university.edu', password: 'Faculty@123', role: Role.FACULTY, firstName: 'Bobur', lastName: 'Yusupov', deptCode: 'IT' },
];

async function main() {
  console.log('🚀 Setting up database...\n');

  // ── 1. Clean existing data (except test users) ──
  console.log('1. Cleaning existing data...');
  await prisma.workloadEditHistory.deleteMany({});
  await prisma.workloadAssignment.deleteMany({});
  await prisma.workloadRecord.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.planningRow.deleteMany({});
  await prisma.studentCohort.deleteMany({});
  await prisma.curriculumItem.deleteMany({});
  await prisma.curriculum.deleteMany({});
  await prisma.courseObjective.deleteMany({});
  await prisma.cQIReport.deleteMany({});
  await prisma.request.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.vacancyRecord.deleteMany({});
  await prisma.staffUnit.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.program.deleteMany({});
  await prisma.semester.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  // ── 2. Create ALL Responsible Departments (includes schools + extra) ──
  console.log('2. Creating departments (Responsible Departments)...');
  const allDeptNames = Array.from(new Set([
    ...SCHOOLS.map(s => s.name),
    ...RESPONSIBLE_DEPARTMENTS,
  ]));

  const deptMap = new Map<string, string>();
  for (const name of allDeptNames) {
    const code = SCHOOLS.find(s => s.name === name)?.code || name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10);
    const dept = await prisma.department.create({
      data: { name, code, avgWeeklyLoad: 30 },
    });
    deptMap.set(name, dept.id);
    console.log(`   ✓ ${name} (${code})`);
  }

  // ── 3. Create Programs ──
  console.log('\n3. Creating programs...');
  const progMap = new Map<string, string>();
  for (const p of PROGRAMS) {
    const deptId = deptMap.get(p.name);
    const prog = await prisma.program.create({
      data: {
        name: p.name,
        code: p.code,
        degreeLevel: p.degreeLevel as any,
        departmentId: deptId!,
      },
    });
    progMap.set(p.name, prog.id);
    console.log(`   ✓ ${p.name}`);
  }

  // ── 4. Create Semester ──
  console.log('\n4. Creating semester...');
  const semester = await prisma.semester.create({
    data: {
      name: 'Fall 2026',
      academicYear: '2026-2027',
      term: 1,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-01-15'),
      isActive: true,
      isCurrent: true,
      weekCount: 16,
    },
  });
  console.log(`   ✓ ${semester.name}`);

  // ── 5. Create test accounts ──
  console.log('\n5. Creating test accounts...');
  for (const acc of TEST_ACCOUNTS) {
    const deptId = deptMap.get(
      SCHOOLS.find(s => s.code === acc.deptCode)?.name || acc.deptCode
    );
    const hashedPassword = await bcrypt.hash(acc.password, 10);
    const user = await prisma.user.create({
      data: {
        email: acc.email,
        employeeId: acc.email.split('@')[0],
        firstName: acc.firstName,
        lastName: acc.lastName,
        passwordHash: hashedPassword,
        role: acc.role,
        departmentId: deptId!,
        maxWeeklyHours: 40,
        minWeeklyHours: 12,
        isActive: true,
        academicPosition: acc.role === Role.FACULTY ? AcademicPosition.PROFESSOR : undefined,
        employmentType: EmploymentType.FULL_TIME,
      },
    });
    console.log(`   ✓ ${acc.email} (${acc.role}) → ${acc.deptCode}`);
  }

  // ── 6. Summary ──
  console.log('\n✅ Setup complete!');
  console.log('\n📋 Test accounts:');
  console.log('   Admin:     admin@university.edu / Admin@123');
  console.log('   CS Head:   cs.head@university.edu / Head@123');
  console.log('   Faculty:   prof.yusupov@university.edu / Faculty@123');

  const finalDepts = await prisma.department.findMany({ orderBy: { name: 'asc' } });
  console.log(`\n📚 Departments created: ${finalDepts.length}`);
  finalDepts.forEach(d => console.log(`   - ${d.name} (${d.code})`));

  const finalProgs = await prisma.program.findMany({ orderBy: { name: 'asc' } });
  console.log(`\n🎓 Programs created: ${finalProgs.length}`);
  finalProgs.forEach(p => console.log(`   - ${p.name}`));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
