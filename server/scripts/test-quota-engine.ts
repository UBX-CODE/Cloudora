import { prisma } from '../src/lib/prisma';
import { redisClient } from '../src/lib/redis';
import * as fileUploadService from '../src/services/file-upload.service';
import * as fileService from '../src/services/file.service';
import * as quotaService from '../src/services/quota.service';
import bcrypt from 'bcrypt';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log(' Cloudora User Storage Quota Engine Integration Test');
  console.log('======================================================\n');

  const testEmail = 'quota_test_user@cloudora.dev';

  try {
    // 1. Cleanup
    console.log('[Setup] Cleaning up test data...');
    const oldUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (oldUser) {
      await prisma.file.deleteMany({ where: { ownerId: oldUser.id } });
      await prisma.folder.deleteMany({ where: { ownerId: oldUser.id } });
      await prisma.user.delete({ where: { id: oldUser.id } });
    }

    // 2. Create User with custom small quota (5,000 bytes)
    const TEST_QUOTA_BYTES = 5000;
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: hashedPassword,
        name: 'Quota Test User',
        storageLimit: BigInt(TEST_QUOTA_BYTES),
        storageUsed: BigInt(0),
      },
    });
    console.log(`[Setup] Created user: ${user.email} (Quota limit: ${user.storageLimit} bytes, Used: ${user.storageUsed} bytes)`);

    // 3. Upload 1: 2,000 bytes
    console.log('\n--- TEST 1: First Upload (2,000 bytes) -> Must Pass ---');
    const upload1 = await fileUploadService.createUploadUrl(user.id, {
      name: 'file1.txt',
      mimeType: 'text/plain',
      size: 2000,
    });
    console.log('• Pre-flight quota check passed. Presigned URL issued.');

    // Upload to MinIO
    await fetch(upload1.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: Buffer.alloc(2000, 'A'),
    });
    await fileUploadService.confirmSingleUpload(user.id, upload1.fileId);

    const userAfterUp1 = await prisma.user.findUnique({ where: { id: user.id } });
    console.log(`• Upload 1 verified. Updated storageUsed: ${userAfterUp1?.storageUsed} bytes / ${userAfterUp1?.storageLimit} bytes`);
    assert(Number(userAfterUp1?.storageUsed) === 2000, 'storageUsed must be 2000 bytes');

    // 4. Upload 2: 2,000 bytes (Total will be 4,000 bytes <= 5,000 bytes)
    console.log('\n--- TEST 2: Second Upload (2,000 bytes) -> Must Pass ---');
    const upload2 = await fileUploadService.createUploadUrl(user.id, {
      name: 'file2.txt',
      mimeType: 'text/plain',
      size: 2000,
    });
    await fetch(upload2.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: Buffer.alloc(2000, 'B'),
    });
    await fileUploadService.confirmSingleUpload(user.id, upload2.fileId);

    const userAfterUp2 = await prisma.user.findUnique({ where: { id: user.id } });
    console.log(`• Upload 2 verified. Updated storageUsed: ${userAfterUp2?.storageUsed} bytes / ${userAfterUp2?.storageLimit} bytes`);
    assert(Number(userAfterUp2?.storageUsed) === 4000, 'storageUsed must be 4000 bytes');

    // 5. Upload 3: 2,000 bytes (Total would be 6,000 bytes > 5,000 bytes limit)
    console.log('\n--- TEST 3: Third Upload (2,000 bytes) -> MUST BE BLOCKED WITH 403 ---');
    let blocked = false;
    try {
      await fileUploadService.createUploadUrl(user.id, {
        name: 'file3_overflow.txt',
        mimeType: 'text/plain',
        size: 2000,
      });
    } catch (err: any) {
      blocked = true;
      console.log(`• Correctly rejected with HTTP ${err.statusCode}: "${err.message}" (Code: ${err.code})`);
      assert(err.statusCode === 403, 'Must return HTTP 403');
      assert(err.code === 'STORAGE_QUOTA_EXCEEDED', 'Must have STORAGE_QUOTA_EXCEEDED code');
    }
    assert(blocked, 'Upload 3 must be blocked by quota check');

    // Verify storageUsed did not change
    const userAfterBlocked = await prisma.user.findUnique({ where: { id: user.id } });
    assert(Number(userAfterBlocked?.storageUsed) === 4000, 'storageUsed must remain 4000 bytes');

    // 6. Delete File 1 (2,000 bytes) -> storageUsed should decrement to 2,000 bytes
    console.log('\n--- TEST 4: Delete File 1 -> Must Decrement storageUsed to 2,000 bytes ---');
    await fileService.permanentlyDeleteFile(user.id, upload1.fileId);

    const userAfterDel = await prisma.user.findUnique({ where: { id: user.id } });
    console.log(`• Deleted file 1. Decremented storageUsed: ${userAfterDel?.storageUsed} bytes`);
    assert(Number(userAfterDel?.storageUsed) === 2000, 'storageUsed must be 2000 bytes after delete');

    // 7. Upload 4: 2,000 bytes (Now 2,000 + 2,000 = 4,000 <= 5,000) -> Must succeed!
    console.log('\n--- TEST 5: Upload 4 After Space Reclaimed -> Must Pass ---');
    const upload4 = await fileUploadService.createUploadUrl(user.id, {
      name: 'file4_reclaimed.txt',
      mimeType: 'text/plain',
      size: 2000,
    });
    await fetch(upload4.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: Buffer.alloc(2000, 'C'),
    });
    await fileUploadService.confirmSingleUpload(user.id, upload4.fileId);

    const userAfterUp4 = await prisma.user.findUnique({ where: { id: user.id } });
    console.log(`• Upload 4 verified. Updated storageUsed: ${userAfterUp4?.storageUsed} bytes / ${userAfterUp4?.storageLimit} bytes`);
    assert(Number(userAfterUp4?.storageUsed) === 4000, 'storageUsed must be 4000 bytes');

    // 8. Self-Healing Reconciliation Test
    console.log('\n--- TEST 6: Self-Healing Reconciliation Sync ---');
    const reconciledUsed = await quotaService.reconcileUserStorage(user.id);
    console.log(`• Reconciliation computed actual uploaded bytes: ${reconciledUsed} bytes`);
    assert(reconciledUsed === 4000, 'Reconciled usage must match exactly 4000 bytes');

    console.log('\n======================================================');
    console.log(' ALL USER STORAGE QUOTA ENGINE TESTS PASSED! 🛡️');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n❌ Quota test suite failed:', err);
    process.exit(1);
  } finally {
    try {
      const u = await prisma.user.findUnique({ where: { email: testEmail } });
      if (u) {
        await prisma.file.deleteMany({ where: { ownerId: u.id } });
        await prisma.folder.deleteMany({ where: { ownerId: u.id } });
        await prisma.user.delete({ where: { id: u.id } });
      }
    } catch {}
    await redisClient.quit();
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();

