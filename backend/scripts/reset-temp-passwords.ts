// One-off: generate a fresh temp password for every non-admin user missing one.
// Run: npx tsx scripts/reset-temp-passwords.ts [--all]
//   default: only users whose tempPassword is NULL
//   --all:   regenerate for every non-admin user
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../src/config/database';

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(length))
    .map((b) => chars[b % chars.length])
    .join('');
}

async function main() {
  const all = process.argv.includes('--all');
  const users = await prisma.user.findMany({
    where: {
      role: { not: 'ADMIN' },
      ...(all ? {} : { tempPassword: null }),
    },
    select: { id: true, employeeId: true, email: true, firstName: true, lastName: true },
    orderBy: { employeeId: 'asc' },
  });

  if (users.length === 0) {
    console.log('Nothing to do — all non-admin users already have a temp password.');
    return;
  }

  console.log(`Resetting passwords for ${users.length} user(s)...\n`);
  console.log('EmployeeID  | Email                      | New password');
  console.log('------------|----------------------------|-------------');
  for (const u of users) {
    const plain = generatePassword();
    await prisma.user.update({
      where: { id: u.id },
      data: { passwordHash: await bcrypt.hash(plain, 12), tempPassword: plain },
    });
    console.log(`${u.employeeId.padEnd(11)} | ${u.email.padEnd(26)} | ${plain}`);
  }
  console.log('\nDone. The same passwords are now in the admin Password Directory report.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
