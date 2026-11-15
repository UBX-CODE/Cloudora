import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Migrating User table to add avatar column...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "avatar" TEXT;
    `);
    console.log('✅ Column "avatar" added to User table.');
  } catch (err) {
    console.error('❌ Avatar migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
