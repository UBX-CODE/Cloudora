import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../src/lib/prisma';
import { storageClient } from '../src/lib/storage';
import { config } from '../src/config/env';
import * as shareService from '../src/services/share.service';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🚀 Starting Secure File & Folder Sharing Module Test Suite...\n');

  const testOwnerEmail = `share_owner_${Date.now()}@cloudora.internal`;
  const testRecipientEmail = `share_recipient_${Date.now()}@cloudora.internal`;
  const testPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(testPassword, 10);

  let owner: any = null;
  let recipient: any = null;
  let file: any = null;
  let folder: any = null;
  const storageKey = `test-shares/doc-${Date.now()}.pdf`;

  try {
    // 1. Setup Users
    owner = await prisma.user.create({
      data: {
        name: 'Share Owner',
        email: testOwnerEmail,
        passwordHash,
      },
    });

    recipient = await prisma.user.create({
      data: {
        name: 'Share Recipient',
        email: testRecipientEmail,
        passwordHash,
      },
    });
    console.log('✅ Created test owner and recipient users.');

    // 2. Put a mock file in MinIO & DB
    await storageClient.send(
      new PutObjectCommand({
        Bucket: config.MINIO_BUCKET,
        Key: storageKey,
        Body: Buffer.from('%PDF-1.4 Mock confidential report data for Cloudora sharing test.'),
        ContentType: 'application/pdf',
      })
    );

    file = await prisma.file.create({
      data: {
        name: 'Confidential_Report.pdf',
        mimeType: 'application/pdf',
        size: BigInt(512),
        storageKey,
        status: 'UPLOADED',
        ownerId: owner.id,
      },
    });

    folder = await prisma.folder.create({
      data: {
        name: 'Project_Alpha',
        ownerId: owner.id,
      },
    });
    console.log('✅ Created test file in MinIO + DB and test folder.');

    // 3. Test Public Unprotected Share Link
    console.log('\n--- Test 1: Public Unprotected Share Link ---');
    const publicShare = await shareService.createShareLink(owner.id, {
      fileId: file.id,
      role: 'VIEW',
    });
    console.log(`Generated public share token: ${publicShare.token}`);
    console.log(`Share URL: ${publicShare.shareUrl}`);

    const publicAccess = await shareService.getPublicShare(publicShare.token);
    if (publicAccess.requiresPassword) throw new Error('Public share unexpectedly asked for password!');
    if (!publicAccess.file?.downloadUrl) throw new Error('Missing presigned download URL!');
    if (publicAccess.viewsCount !== 1) throw new Error(`Expected viewsCount=1, got ${publicAccess.viewsCount}`);
    console.log('✅ Public access verified: Correct metadata, presigned URL generated, viewsCount=1.');

    // 4. Test Password-Protected Share Link
    console.log('\n--- Test 2: Password-Protected Share Link ---');
    const secretPassword = 'CloudoraSecret2026';
    const protectedShare = await shareService.createShareLink(owner.id, {
      fileId: file.id,
      password: secretPassword,
      role: 'VIEW',
    });

    // 4a. Attempt access without password
    const lockedAccess = await shareService.getPublicShare(protectedShare.token);
    if (!lockedAccess.requiresPassword) throw new Error('Protected share did not trigger password gate!');
    if (lockedAccess.file) throw new Error('Protected share leaked file payload before password!');
    console.log('✅ Gate verified: Access without password returned requiresPassword: true.');

    // 4b. Attempt access with incorrect password
    try {
      await shareService.getPublicShare(protectedShare.token, 'wrong_pass');
      throw new Error('Access with wrong password should have thrown 401!');
    } catch (err: any) {
      if (err.statusCode === 401) {
        console.log('✅ Gate verified: Wrong password rejected with 401.');
      } else {
        throw err;
      }
    }

    // 4c. Access with correct password
    const unlockedAccess = await shareService.getPublicShare(protectedShare.token, secretPassword);
    if (unlockedAccess.requiresPassword) throw new Error('Access failed with correct password!');
    if (!unlockedAccess.file?.downloadUrl) throw new Error('Unlocked access missing download URL!');
    console.log('✅ Gate verified: Correct password unlocked asset with presigned URLs.');

    // 5. Test Expired Share Link
    console.log('\n--- Test 3: Expired Share Link ---');
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    // Direct DB creation to simulate past expiration
    const expiredRecord = await prisma.share.create({
      data: {
        token: `expired_${Date.now()}`,
        fileId: file.id,
        ownerId: owner.id,
        expiresAt: new Date(Date.now() - 60000), // 1 minute ago
      },
    });

    try {
      await shareService.getPublicShare(expiredRecord.token);
      throw new Error('Expired share access should have thrown 410!');
    } catch (err: any) {
      if (err.statusCode === 410) {
        console.log('✅ Expiration verified: Expired share rejected with 410 Gone.');
      } else {
        throw err;
      }
    }

    // 6. Test Direct User-to-User Sharing ("Shared With Me")
    console.log('\n--- Test 4: Direct User Sharing ("Shared With Me") ---');
    const directShare = await shareService.createShareLink(owner.id, {
      fileId: file.id,
      sharedWithEmail: recipient.email,
      role: 'EDIT',
    });

    const recipientShared = await shareService.getSharedWithMe(recipient.id);
    const foundShare = recipientShared.find((s) => s.id === directShare.id);
    if (!foundShare) throw new Error('Recipient did not find the directly shared file in Shared With Me!');
    if (foundShare.role !== 'EDIT') throw new Error(`Expected role EDIT, got ${foundShare.role}`);
    console.log(`✅ Direct sharing verified: Recipient sees "${foundShare.targetName}" with role EDIT.`);

    // 7. Test Revocation
    console.log('\n--- Test 5: Revocation / Link Invalidation ---');
    await shareService.revokeShare(owner.id, publicShare.id);
    try {
      await shareService.getPublicShare(publicShare.token);
      throw new Error('Access to revoked share should have thrown 404!');
    } catch (err: any) {
      if (err.statusCode === 404) {
        console.log('✅ Revocation verified: Revoked share rejected with 404 Not Found.');
      } else {
        throw err;
      }
    }

    console.log('\n🎉 ALL 5 SHARING ENGINE TEST PHASES PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      await storageClient.send(
        new DeleteObjectCommand({
          Bucket: config.MINIO_BUCKET,
          Key: storageKey,
        })
      );
      if (file) await prisma.file.deleteMany({ where: { id: file.id } });
      if (folder) await prisma.folder.deleteMany({ where: { id: folder.id } });
      if (owner) await prisma.user.deleteMany({ where: { id: owner.id } });
      if (recipient) await prisma.user.deleteMany({ where: { id: recipient.id } });
      console.log('🧹 Cleanup complete.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr);
    }
    await prisma.$disconnect();
  }
}

main();
