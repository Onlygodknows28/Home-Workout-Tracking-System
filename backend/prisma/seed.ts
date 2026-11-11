import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/prisma/seed-data';

const prisma = new PrismaClient();

seedDatabase(prisma)
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
