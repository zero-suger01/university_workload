import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_EMAILS = [
  'admin@university.edu',
  'cs.head@university.edu',
  'prof.yusupov@university.edu',
];

async function main() {
  console.log('=== Current Departments ===');
  const departments = await prisma.department.findMany();
  departments.forEach(d => console.log(`  ${d.id} | ${d.name} | ${d.code}`));

  console.log('\n=== Current Users ===');
  const users = await prisma.user.findMany();
  users.forEach(u => console.log(`  ${u.id} | ${u.email} | ${u.firstName} ${u.lastName} | ${u.role}`));

  const keepUsers = await prisma.user.findMany({
    where: { email: { in: KEEP_EMAILS } },
  });
  const keepIds = keepUsers.map(u => u.id);
  console.log('\n=== Users to KEEP ===');
  keepUsers.forEach(u => console.log(`  ${u.id} | ${u.email}`));

  if (keepIds.length !== KEEP_EMAILS.length) {
    console.error('WARNING: Some keep emails not found!');
    const foundEmails = keepUsers.map(u => u.email);
    const missing = KEEP_EMAILS.filter(e => !foundEmails.includes(e));
    missing.forEach(e => console.error(`  MISSING: ${e}`));
  }

  console.log('\n=== Starting cleanup ===');

  // Delete in order respecting foreign keys
  console.log('1. Deleting WorkloadEditHistory...');
  await prisma.workloadEditHistory.deleteMany({});

  console.log('2. Deleting WorkloadAssignment...');
  await prisma.workloadAssignment.deleteMany({});

  console.log('3. Deleting WorkloadRecord...');
  await prisma.workloadRecord.deleteMany({});

  console.log('4. Deleting Group...');
  await prisma.group.deleteMany({});

  console.log('5. Deleting PlanningRow...');
  await prisma.planningRow.deleteMany({});

  console.log('6. Deleting StudentCohort...');
  await prisma.studentCohort.deleteMany({});

  console.log('7. Deleting CurriculumItem...');
  await prisma.curriculumItem.deleteMany({});

  console.log('8. Deleting Curriculum...');
  await prisma.curriculum.deleteMany({});

  console.log('9. Deleting CourseObjective...');
  await prisma.courseObjective.deleteMany({});

  console.log('10. Deleting CQIReport...');
  await prisma.cQIReport.deleteMany({});

  console.log('11. Deleting Request...');
  await prisma.request.deleteMany({});

  console.log('12. Deleting Notification...');
  await prisma.notification.deleteMany({});

  console.log('13. Deleting AuditLog...');
  await prisma.auditLog.deleteMany({});

  console.log('14. Deleting Report...');
  await prisma.report.deleteMany({});

  console.log('15. Deleting VacancyRecord...');
  await prisma.vacancyRecord.deleteMany({});

  console.log('16. Deleting StaffUnit...');
  await prisma.staffUnit.deleteMany({});

  console.log('17. Deleting Room...');
  await prisma.room.deleteMany({});

  console.log('18. Deleting Course...');
  await prisma.course.deleteMany({});

  console.log('19. Deleting Program...');
  await prisma.program.deleteMany({});

  console.log('20. Deleting Semester...');
  await prisma.semester.deleteMany({});

  console.log('21. Deleting Department (except those used by keep users)...');
  const keepDeptIds = keepUsers.map(u => u.departmentId).filter(Boolean);
  await prisma.department.deleteMany({
    where: { id: { notIn: keepDeptIds } },
  });

  console.log('22. Deleting Users (except test accounts)...');
  await prisma.user.deleteMany({
    where: { id: { notIn: keepIds } },
  });

  console.log('\n=== Remaining Users ===');
  const remaining = await prisma.user.findMany();
  remaining.forEach(u => console.log(`  ${u.id} | ${u.email} | ${u.firstName} ${u.lastName} | ${u.role}`));

  console.log('\n=== Remaining Departments ===');
  const remainingDepts = await prisma.department.findMany();
  remainingDepts.forEach(d => console.log(`  ${d.id} | ${d.name} | ${d.code}`));

  console.log('\n✅ Cleanup complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
