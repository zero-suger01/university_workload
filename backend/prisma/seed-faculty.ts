import { PrismaClient, Role, AcademicPosition, EmploymentType, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(10);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('');
}

function detectGender(lastName: string): Gender {
  return lastName.trimEnd().toLowerCase().endsWith('a') ? Gender.FEMALE : Gender.MALE;
}

async function upsertDept(name: string, code: string) {
  return prisma.department.upsert({
    where: { code },
    update: {},
    create: { name, code, avgWeeklyLoad: 20 },
  });
}

async function main() {
  console.log('🌱 Seeding faculty members...');

  // ── Departments ───────────────────────────────────────────────────────────
  const engDept   = await upsertDept('English Department',                               'ENG-DEPT');
  const genEduDept = await upsertDept('Department of General Education',                 'GEN-EDU');
  const eduDept   = await upsertDept('Department of Education',                          'EDU');
  const mathDept  = await upsertDept('Department of Mathematics',                        'MATH-DEPT');
  const itDept    = await upsertDept('Department of Information Systems and Technologies','IST');

  // ── Faculty list ──────────────────────────────────────────────────────────
  type FacultyEntry = {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    adminPosition?: string;
    academicPosition?: AcademicPosition;
    employmentType: EmploymentType;
    departmentId: string;
    maxWeeklyHours: number;
    minWeeklyHours: number;
  };

  const faculty: FacultyEntry[] = [
    // ── English Department ────────────────────────────────────────────────
    {
      employeeId: 'F250002', firstName: 'Azamat',      lastName: 'Akhmedjanov',
      email: 'a.akhmedjanov@npuu.uz',
      role: Role.DEPARTMENT_HEAD, adminPosition: 'Head of Department',
      academicPosition: AcademicPosition.SENIOR_LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: engDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250003', firstName: 'Azizabonu',   lastName: 'Ziyodullaeva',
      email: 'a.ziyodullaeva@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: engDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250004', firstName: 'Rano',        lastName: 'Khikmatova',
      email: 'r.khikmatova@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.SENIOR_LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: engDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250005', firstName: 'Zukhra',      lastName: 'Khakimova',
      email: 'z.khakimova@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.SENIOR_LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: engDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250006', firstName: 'Dilnozakhon', lastName: 'Boymirzayeva',
      email: 'd.boymirzayeva@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: engDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },

    // ── Department of General Education ──────────────────────────────────
    {
      employeeId: 'F250010', firstName: 'Faculty',     lastName: 'GE001',
      email: 'f250010@npuu.uz',
      role: Role.FACULTY,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: genEduDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250011', firstName: 'Faculty',     lastName: 'GE002',
      email: 'f250011@npuu.uz',
      role: Role.FACULTY,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: genEduDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250012', firstName: 'Faculty',     lastName: 'GE003',
      email: 'f250012@npuu.uz',
      role: Role.FACULTY,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: genEduDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250013', firstName: 'Faculty',     lastName: 'GE004',
      email: 'f250013@npuu.uz',
      role: Role.FACULTY,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: genEduDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },

    // ── Department of Education ───────────────────────────────────────────
    {
      employeeId: 'F250014', firstName: 'Nilufar',     lastName: 'Tillayeva',
      email: 'n.tillayeva@npuu.uz',
      role: Role.DEPARTMENT_HEAD, adminPosition: 'Head of Department',
      academicPosition: AcademicPosition.SENIOR_LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: eduDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250015', firstName: 'Albina',      lastName: 'Suleymanova',
      email: 'a.suleymanova@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.SENIOR_LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: eduDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250016', firstName: 'Ozodakhon',   lastName: 'Shukurillaeva',
      email: 'o.shukurillaeva@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.SENIOR_LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: eduDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250017', firstName: 'Mirjon',      lastName: 'Khidoyatov',
      email: 'm.khidoyatov@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.SENIOR_LECTURER,
      employmentType: EmploymentType.PART_TIME,
      departmentId: eduDept.id, maxWeeklyHours: 20, minWeeklyHours: 6,
    },
    {
      employeeId: 'F250018', firstName: 'Mirsaid',     lastName: 'Abduraxmanov',
      email: 'm.abdurakhmonov@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.LECTURER,
      employmentType: EmploymentType.PART_TIME,
      departmentId: eduDept.id, maxWeeklyHours: 20, minWeeklyHours: 6,
    },

    // ── Department of Mathematics ─────────────────────────────────────────
    {
      employeeId: 'F250021', firstName: 'Marks',       lastName: 'Ruziboev',
      email: 'm.ruziboev@npuu.uz',
      role: Role.DEPARTMENT_HEAD, adminPosition: 'Head of Department',
      academicPosition: AcademicPosition.PROFESSOR,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: mathDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250022', firstName: 'Shakhzod',    lastName: 'Suvanov',
      email: 'sh.suvanov@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.SENIOR_LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: mathDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250023', firstName: 'Allambergen', lastName: 'Qudaybergenov',
      email: 'a.qudaybergenov@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.ASSOCIATE_PROFESSOR,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: mathDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250024', firstName: 'Zarif',       lastName: 'Ibragimov',
      email: 'z.ibragimov@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.ASSOCIATE_PROFESSOR,
      employmentType: EmploymentType.PART_TIME,
      departmentId: mathDept.id, maxWeeklyHours: 20, minWeeklyHours: 6,
    },
    {
      employeeId: 'F250025', firstName: 'Baxtinur',    lastName: 'Juraev',
      email: 'b.juraev@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: mathDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250026', firstName: 'Anvar',       lastName: "Sa'dullayev",
      email: 'a.sadullayev@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.SENIOR_LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: mathDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250027', firstName: 'Farxod',      lastName: 'Muxammadiyev',
      email: 'f.muxamadiyev@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.ASSOCIATE_PROFESSOR,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: mathDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250028', firstName: 'Azamat',      lastName: 'Holboev',
      email: 'a.xolboyev@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.ASSOCIATE_PROFESSOR,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: mathDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },

    // ── Department of Information Systems and Technologies ────────────────
    {
      employeeId: 'F250032', firstName: 'Asadullo',    lastName: 'Ashurov',
      email: 'a.ashurov@npuu.uz',
      role: Role.DEPARTMENT_HEAD, adminPosition: 'Head of Department',
      academicPosition: AcademicPosition.ASSOCIATE_PROFESSOR,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: itDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250033', firstName: 'Bakhromjon',  lastName: 'Tulkinov',
      email: 'b.tulkinov@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: itDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250034', firstName: "Ulug'bek",    lastName: 'Tursunboyev',
      email: 'u.tursunaliev@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.LECTURER,
      employmentType: EmploymentType.FULL_TIME,
      departmentId: itDept.id, maxWeeklyHours: 40, minWeeklyHours: 12,
    },
    {
      employeeId: 'F250035', firstName: 'Mirraxmon',   lastName: 'Haydarov',
      email: 'm.khaydarov@npuu.uz',
      role: Role.FACULTY,
      academicPosition: AcademicPosition.LECTURER,
      employmentType: EmploymentType.PART_TIME,
      departmentId: itDept.id, maxWeeklyHours: 20, minWeeklyHours: 6,
    },
  ];

  // Pre-fetch department names once
  const allDepts = await prisma.department.findMany({ select: { id: true, name: true } });
  const deptNameById = Object.fromEntries(allDepts.map((d) => [d.id, d.name]));

  let created = 0;
  let skipped = 0;

  for (const f of faculty) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ employeeId: f.employeeId }, { email: f.email }] },
    });

    if (existing) {
      console.log(`  ⏭  Skipped (already exists): ${f.employeeId} ${f.email}`);
      skipped++;
      continue;
    }

    const plainPassword = generatePassword();
    const passwordHash  = await bcrypt.hash(plainPassword, 12);
    const gender        = detectGender(f.lastName);

    await prisma.user.create({
      data: {
        employeeId:       f.employeeId,
        firstName:        f.firstName,
        lastName:         f.lastName,
        email:            f.email,
        passwordHash,
        role:             f.role,
        adminPosition:    f.adminPosition,
        academicPosition: f.academicPosition,
        employmentType:   f.employmentType,
        gender,
        departmentId:     f.departmentId,
        facultyDepartment: deptNameById[f.departmentId],
        maxWeeklyHours:   f.maxWeeklyHours,
        minWeeklyHours:   f.minWeeklyHours,
        isActive:         true,
      },
    });

    console.log(`  ✅ Created: ${f.employeeId} ${f.firstName} ${f.lastName} | gender: ${gender} | password: ${plainPassword}`);
    created++;
  }

  console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
