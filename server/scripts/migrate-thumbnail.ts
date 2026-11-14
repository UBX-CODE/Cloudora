import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Adding thumbnailKey column to File table...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "File" 
      ADD COLUMN IF NOT EXISTS "thumbnailKey" TEXT;
    `);
    console.log('✅ Column thumbnailKey added to File table.');
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

