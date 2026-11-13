import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Running user storage quota migration...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "storageUsed" BIGINT NOT NULL DEFAULT 0;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "storageLimit" BIGINT NOT NULL DEFAULT 5368709120;
    `);

    console.log('✅ Columns "storageUsed" and "storageLimit" verified on "User" table.');

    // Now populate existing storageUsed for existing users by summing their uploaded files
    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    for (const u of users) {
      const aggregate = await prisma.file.aggregate({
        where: {
          ownerId: u.id,
          status: 'UPLOADED',
        },
        _sum: {
          size: true,
        },
      });

      const currentBytes = aggregate._sum.size || BigInt(0);
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "storageUsed" = $1 WHERE id = $2`,
        currentBytes,
        u.id
      );
      console.log(`• User ${u.email}: Initialized storageUsed to ${currentBytes} bytes.`);
    }

    console.log('✅ User storage quota migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

