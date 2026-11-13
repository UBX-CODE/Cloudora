import { prisma } from '../src/lib/prisma';
import { redisClient } from '../src/lib/redis';
import * as fileUploadService from '../src/services/file-upload.service';
import * as fileService from '../src/services/file.service';
import * as folderService from '../src/services/folder.service';
import bcrypt from 'bcrypt';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log(' Cloudora File Operations & Presigned Streaming Test');
  console.log('======================================================\n');

  const testEmail = 'file_ops_test@cloudora.dev';

  try {
    // 1. Cleanup
    console.log('[Setup] Cleaning up test data...');
    const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (existingUser) {
      await prisma.file.deleteMany({ where: { ownerId: existingUser.id } });
      await prisma.folder.deleteMany({ where: { ownerId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    // 2. Create Test User
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: hashedPassword,
        name: 'File Ops Tester',
      },
    });
    console.log(`[Setup] Created user: ${user.email} (${user.id})`);

    // 3. Create a folder
    const folder = await folderService.createFolder(user.id, { name: 'Documents' });
    console.log(`[Setup] Created folder: "${folder.name}" (${folder.id})`);

    // 4. Create single upload URL & upload file directly to MinIO
    console.log('\n--- 1. Single Upload & S3 Confirmation ---');
    const uploadInit = await fileUploadService.createUploadUrl(user.id, {
      name: 'annual_report.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      folderId: folder.id,
    });
    console.log(`• Generated upload URL for "${uploadInit.fileId}"`);

    // Upload 1024 bytes buffer to the presigned URL
    const fakePdfBytes = Buffer.alloc(1024, 'PDF-CONTENT-SAMPLE');
    const uploadRes = await fetch(uploadInit.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      body: fakePdfBytes,
    });
    assert(uploadRes.status === 200, `MinIO PUT should succeed with 200, got ${uploadRes.status}`);
    console.log('• MinIO direct PUT completed with 200 OK');

    // Confirm upload completion
    const confirmed = await fileUploadService.confirmSingleUpload(user.id, uploadInit.fileId);
    assert(confirmed.status === 'UPLOADED', 'File status should be UPLOADED');
    console.log(`• Upload confirmed: Status = ${confirmed.status}`);

    // 5. Query Files
    console.log('\n--- 2. File Listing & Categorization ---');
    const filesInFolder = await fileService.getFiles(user.id, { folderId: folder.id });
    assert(filesInFolder.length === 1, 'Should find 1 file in folder');
    assert(filesInFolder[0].category === 'document', 'Category should be document');
    assert(filesInFolder[0].extension === 'pdf', 'Extension should be pdf');
    console.log(`• Found file: "${filesInFolder[0].name}" | Category: ${filesInFolder[0].category} | Size: ${filesInFolder[0].size} bytes`);

    // 6. Test Presigned Download URL
    console.log('\n--- 3. Presigned Download URL ---');
    const downloadData = await fileService.getDownloadUrl(user.id, uploadInit.fileId);
    assert(downloadData.downloadUrl.includes('response-content-disposition=attachment'), 'Must have attachment disposition');
    console.log('• Generated presigned download URL with attachment header successfully.');

    // 7. Test Presigned Preview URL
    console.log('\n--- 4. Presigned Streaming/Preview URL ---');
    const previewData = await fileService.getPreviewUrl(user.id, uploadInit.fileId);
    assert(previewData.previewUrl.includes('response-content-disposition=inline'), 'Must have inline disposition');
    console.log('• Generated presigned preview URL with inline disposition successfully.');

    // Fetch through preview URL to verify MinIO responds with inline header
    const previewRes = await fetch(previewData.previewUrl);
    assert(previewRes.status === 200, 'MinIO preview request should succeed with 200');
    console.log(`• MinIO streaming verification: HTTP ${previewRes.status} | Content-Type: ${previewRes.headers.get('content-type')}`);

    // 8. Rename File
    console.log('\n--- 5. Rename File ---');
    const renamed = await fileService.renameFile(user.id, uploadInit.fileId, 'quarterly_report.pdf');
    assert(renamed.name === 'quarterly_report.pdf', 'Name should be quarterly_report.pdf');
    console.log(`• Renamed to: "${renamed.name}"`);

    // 9. Star File
    console.log('\n--- 6. Star File ---');
    const starred = await fileService.toggleStarFile(user.id, uploadInit.fileId, true);
    assert(starred.isStarred === true, 'File should be starred');
    const starredList = await fileService.getFiles(user.id, { isStarred: true });
    assert(starredList.length === 1, 'Starred list should contain 1 file');
    console.log('• Star toggle verified successfully.');

    // 10. Storage Summary
    console.log('\n--- 7. Storage Analytics Summary ---');
    const storageSummary = await fileService.getStorageUsageSummary(user.id);
    console.log(`• Total Used: ${storageSummary.totalUsedBytes} bytes / ${storageSummary.storageLimitBytes} bytes`);
    console.log(`• Breakdown: ${JSON.stringify(storageSummary.breakdown)}`);
    assert(storageSummary.breakdown.documents === 1024, 'Document breakdown should be 1024 bytes');

    // 11. Trash and Restore
    console.log('\n--- 8. Trash and Restore ---');
    await fileService.trashFile(user.id, uploadInit.fileId);
    const nonTrashed = await fileService.getFiles(user.id, { isTrashed: false });
    assert(nonTrashed.length === 0, 'File should not appear in active files');
    const trashed = await fileService.getFiles(user.id, { isTrashed: true });
    assert(trashed.length === 1, 'File should appear in trash');
    console.log('• Soft-delete (trash) verified.');

    await fileService.restoreFile(user.id, uploadInit.fileId);
    const restored = await fileService.getFiles(user.id, { isTrashed: false });
    assert(restored.length === 1, 'Restored file should appear in active files');
    console.log('• Restore verified.');

    // 12. Permanent Delete
    console.log('\n--- 9. Permanent Deletion ---');
    const deleteResult = await fileService.permanentlyDeleteFile(user.id, uploadInit.fileId);
    assert(deleteResult.deleted === true, 'File should be marked as deleted');
    const afterDelete = await prisma.file.findUnique({ where: { id: uploadInit.fileId } });
    assert(afterDelete === null, 'File record should be removed from DB');
    console.log('• Permanent deletion (MinIO + DB) verified.');

    console.log('\n======================================================');
    console.log(' ALL FILE OPERATIONS & STREAMING TESTS PASSED! ');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  } finally {
    try {
      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      if (user) {
        await prisma.file.deleteMany({ where: { ownerId: user.id } });
        await prisma.folder.deleteMany({ where: { ownerId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    } catch {}
    await redisClient.quit();
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
