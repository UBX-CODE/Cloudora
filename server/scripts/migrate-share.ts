import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Migrating Share table and ShareRole enum...');
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShareRole') THEN 
          CREATE TYPE "ShareRole" AS ENUM ('VIEW', 'EDIT'); 
        END IF; 
      END $$;
    `);
    console.log('✅ ShareRole enum verified/created.');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Share" (
        "id" TEXT PRIMARY KEY,
        "token" TEXT UNIQUE NOT NULL,
        "fileId" TEXT REFERENCES "File"("id") ON DELETE CASCADE,
        "folderId" TEXT REFERENCES "Folder"("id") ON DELETE CASCADE,
        "ownerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "sharedWithId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
        "role" "ShareRole" NOT NULL DEFAULT 'VIEW',
        "passwordHash" TEXT,
        "expiresAt" TIMESTAMP(3),
        "viewsCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Share table verified/created.');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Share_token_idx" ON "Share"("token");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Share_ownerId_idx" ON "Share"("ownerId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Share_sharedWithId_idx" ON "Share"("sharedWithId");
    `);
    console.log('✅ Indexes on Share created.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
