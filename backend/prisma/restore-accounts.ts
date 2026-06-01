import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔑 Restoring login accounts only (no data changes)...');

  const adminHash   = await bcrypt.hash('Admin@123', 12);
  const headHash    = await bcrypt.hash('Head@123', 12);
  const facultyHash = await bcrypt.hash('Faculty@123', 12);

  // Get any department to satisfy FK (just need one to exist)
  const anyDept = await prisma.department.findFirst();
  if (!anyDept) {
    // Create a minimal department if none exists
    await prisma.department.create({ data: { name: 'General', code: 'GEN', avgWeeklyLoad: 30 } });
  }
  const dept = (await prisma.department.findFirst())!;

  const accounts = [
    { employeeId: 'EMP001', email: 'admin@university.edu',           passwordHash: adminHash,   firstName: 'System',  lastName: 'Admin',    role: Role.ADMIN,            maxWeeklyHours: 40, minWeeklyHours: 0  },
    { employeeId: 'EMP002', email: 'cs.head@university.edu',         passwordHash: headHash,    firstName: 'Alisher', lastName: 'Karimov',  role: Role.DEPARTMENT_HEAD,  maxWeeklyHours: 36, minWeeklyHours: 10 },
    { employeeId: 'EMP006', email: 'math.head@university.edu',       passwordHash: headHash,    firstName: 'Nodira',  lastName: 'Umarova',  role: Role.DEPARTMENT_HEAD,  maxWeeklyHours: 36, minWeeklyHours: 10 },
    { employeeId: 'EMP003', email: 'prof.yusupov@university.edu',    passwordHash: facultyHash, firstName: 'Bobur',   lastName: 'Yusupov',  role: Role.FACULTY,          maxWeeklyHours: 36, minWeeklyHours: 18 },
    { employeeId: 'EMP004', email: 'prof.nazarova@university.edu',   passwordHash: facultyHash, firstName: 'Dilnoza', lastName: 'Nazarova', role: Role.FACULTY,          maxWeeklyHours: 36, minWeeklyHours: 18 },
    { employeeId: 'EMP007', email: 'prof.rashidova@university.edu',  passwordHash: facultyHash, firstName: 'Kamola',  lastName: 'Rashidova',role: Role.FACULTY,          maxWeeklyHours: 36, minWeeklyHours: 18 },
    { employeeId: 'EMP005', email: 'prof.toshmatov@university.edu',  passwordHash: facultyHash, firstName: 'Sherzod', lastName: 'Toshmatov',role: Role.FACULTY,          maxWeeklyHours: 36, minWeeklyHours: 18 },
    { employeeId: 'EMP008', email: 'prof.karimova@university.edu',   passwordHash: facultyHash, firstName: 'Malika',  lastName: 'Karimova', role: Role.FACULTY,          maxWeeklyHours: 36, minWeeklyHours: 18 },
  ];

  for (const acc of accounts) {
    await prisma.user.upsert({
      where:  { email: acc.email },
      update: { passwordHash: acc.passwordHash }, // only reset password, nothing else
      create: { ...acc, departmentId: dept.id },
    });
    console.log('✓', acc.role, acc.email);
  }

  console.log('\n✅ Accounts restored — all other data untouched.\n');
  console.log('  Admin:   admin@university.edu / Admin@123');
  console.log('  Head:    cs.head@university.edu / Head@123');
  console.log('  Faculty: prof.yusupov@university.edu / Faculty@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
