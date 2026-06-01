import 'dotenv/config';
import app from './app';
import { prisma } from './config/database';
import { resyncAllFlags } from './modules/workloads/workloads.service';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function main() {
  await prisma.$connect();
  console.log('✅ Database connected');

  await resyncAllFlags();

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
