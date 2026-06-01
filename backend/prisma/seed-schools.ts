import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCHOOLS = [
  {
    name: 'School of Exact Sciences',
    code: 'SES',
    avgWeeklyLoad: 30,
    programs: [
      { name: 'Mathematics',                        code: 'MATH-SES', degreeLevel: 'BACHELOR' },
      { name: 'Information Technology',             code: 'IT',        degreeLevel: 'BACHELOR' },
      { name: 'Artificial Intelligence & Robotics', code: 'AIR',       degreeLevel: 'BACHELOR' },
    ],
  },
  {
    name: 'School of Primary & Preschool Education',
    code: 'SPPE',
    avgWeeklyLoad: 30,
    programs: [
      { name: 'Primary Education',   code: 'PE',  degreeLevel: 'BACHELOR' },
      { name: 'Preschool Education', code: 'PSE', degreeLevel: 'BACHELOR' },
    ],
  },
  {
    name: 'School of Natural Sciences',
    code: 'SNS',
    avgWeeklyLoad: 30,
    programs: [
      { name: 'Biology',   code: 'BIO',  degreeLevel: 'BACHELOR' },
      { name: 'Chemistry', code: 'CHEM', degreeLevel: 'BACHELOR' },
      { name: 'Physics',   code: 'PHYS', degreeLevel: 'BACHELOR' },
      { name: 'Geography', code: 'GEO',  degreeLevel: 'BACHELOR' },
    ],
  },
  {
    name: 'School of Philological Sciences',
    code: 'SPS',
    avgWeeklyLoad: 30,
    programs: [
      { name: 'Foreign Language and Literature', code: 'FLL',  degreeLevel: 'BACHELOR' },
      { name: 'English Language',                code: 'EL',   degreeLevel: 'BACHELOR' },
      { name: 'German Language',                 code: 'GL',   degreeLevel: 'BACHELOR' },
      { name: 'Korean Language',                 code: 'KL',   degreeLevel: 'BACHELOR' },
      { name: 'Chinese Language',                code: 'CL',   degreeLevel: 'BACHELOR' },
      { name: 'Native Language and Literature',  code: 'NLL',  degreeLevel: 'BACHELOR' },
    ],
  },
  {
    name: 'School of Social Sciences',
    code: 'SSS',
    avgWeeklyLoad: 30,
    programs: [
      { name: 'History',                          code: 'HIST', degreeLevel: 'BACHELOR' },
      { name: 'Psychology',                       code: 'PSY',  degreeLevel: 'BACHELOR' },
      { name: 'Special Education',                code: 'SE',   degreeLevel: 'BACHELOR' },
      { name: 'Pedagogy',                         code: 'PED',  degreeLevel: 'BACHELOR' },
      { name: 'National Ideology & Law',          code: 'NIL',  degreeLevel: 'BACHELOR' },
    ],
  },
  {
    name: 'School of Applied Sciences',
    code: 'SAS',
    avgWeeklyLoad: 30,
    programs: [
      { name: 'Technology',              code: 'TECH', degreeLevel: 'BACHELOR' },
      { name: 'Music',                   code: 'MUS',  degreeLevel: 'BACHELOR' },
      { name: 'Art',                     code: 'ART',  degreeLevel: 'BACHELOR' },
      { name: 'Sports',                  code: 'SPT',  degreeLevel: 'BACHELOR' },
      { name: 'Professional Education',  code: 'PROF', degreeLevel: 'BACHELOR' },
      { name: 'Pre-Induction Training',  code: 'PIT',  degreeLevel: 'BACHELOR' },
    ],
  },
];

async function main() {
  console.log('Seeding schools and programs...');

  for (const school of SCHOOLS) {
    // Upsert department
    const dept = await prisma.department.upsert({
      where: { code: school.code },
      update: { name: school.name, avgWeeklyLoad: school.avgWeeklyLoad },
      create: { name: school.name, code: school.code, avgWeeklyLoad: school.avgWeeklyLoad },
    });
    console.log(`  ✓ School: ${dept.name}`);

    for (const prog of school.programs) {
      await prisma.program.upsert({
        where: { code: prog.code },
        update: { name: prog.name, departmentId: dept.id },
        create: {
          name: prog.name,
          code: prog.code,
          degreeLevel: prog.degreeLevel as any,
          departmentId: dept.id,
          isActive: true,
        },
      });
      console.log(`      • Program: ${prog.name}`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
