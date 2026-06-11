import 'dotenv/config';
import app from './app';
import { prisma } from './config/database';
import { resyncAllFlags } from './modules/workloads/workloads.service';
import { expireEndedSemesters } from './modules/semesters/semesters.service';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function main() {
  await prisma.$connect();
  console.log('✅ Database connected');

  await resyncAllFlags();

  await expireEndedSemesters();
  setInterval(() => {
    expireEndedSemesters().catch((err) => console.error('Semester expiry check failed:', err));
  }, 60 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
