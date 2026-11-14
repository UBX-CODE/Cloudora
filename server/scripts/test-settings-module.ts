import { prisma } from '../src/lib/prisma';
import { redisClient } from '../src/lib/redis';
import * as authService from '../src/services/auth.service';
import bcrypt from 'bcrypt';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log(' Cloudora Account Settings & Password Change Test');
  console.log('======================================================\n');

  const testEmail = 'settings_test_user@cloudora.dev';

  try {
    // 1. Cleanup
    console.log('[Setup] Cleaning up test data...');
    const oldUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (oldUser) {
      await prisma.file.deleteMany({ where: { ownerId: oldUser.id } });
      await prisma.user.delete({ where: { id: oldUser.id } });
    }

    // 2. Create User
    const initialPassword = 'InitialPassword123!';
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: hashedPassword,
        name: 'Original Name',
      },
    });
    console.log(`[Setup] Created user: ${user.email} (Name: "${user.name}")`);

    // 3. Test Profile Update
    console.log('\n--- 1. Testing Profile Name Update ---');
    const updated = await authService.updateProfile(user.id, { name: 'Elena New Name' });
    assert(updated.name === 'Elena New Name', 'Name should be updated');
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    assert(dbUser?.name === 'Elena New Name', 'Database name should match updated name');
    console.log(`• Profile name updated to: "${updated.name}"`);

    // 4. Test Password Change with Wrong Current Password -> Must Fail
    console.log('\n--- 2. Testing Password Change with WRONG Current Password -> Must Fail ---');
    let failedAsExpected = false;
    try {
      await authService.changePassword(user.id, {
        currentPassword: 'WrongPassword!',
        newPassword: 'BrandNewPassword123!',
      });
    } catch (err: any) {
      failedAsExpected = true;
      console.log(`• Correctly rejected with HTTP ${err.statusCode}: "${err.message}"`);
      assert(err.statusCode === 400, 'Must return HTTP 400');
    }
    assert(failedAsExpected, 'Password change with wrong current password must be rejected');

    // 5. Test Password Change with Correct Password -> Must Succeed
    console.log('\n--- 3. Testing Password Change with CORRECT Password -> Must Succeed ---');
    const changeResult = await authService.changePassword(user.id, {
      currentPassword: initialPassword,
      newPassword: 'BrandNewPassword123!',
    });
    assert(changeResult.success === true, 'Password change must succeed');
    console.log(`• Password change succeeded: "${changeResult.message}"`);

    // 6. Verify Old Password is now Rejected
    console.log('\n--- 4. Verify Old Password is REJECTED on Login ---');
    let oldPasswordRejected = false;
    try {
      await authService.login({
        email: testEmail,
        password: initialPassword,
      });
    } catch (err: any) {
      oldPasswordRejected = true;
      console.log(`• Old password rejected with HTTP ${err.statusCode}: "${err.message}"`);
      assert(err.statusCode === 401, 'Must return HTTP 401');
    }
    assert(oldPasswordRejected, 'Old password must no longer be valid');

    // 7. Verify New Password SUCCEEDS on Login
    console.log('\n--- 5. Verify New Password SUCCEEDS on Login ---');
    const loginResult = await authService.login({
      email: testEmail,
      password: 'BrandNewPassword123!',
    });
    assert(loginResult.token.length > 0, 'Token must be issued');
    assert(loginResult.user.name === 'Elena New Name', 'User name should match updated profile');
    console.log(`• Login with new password succeeded! Issued token for: ${loginResult.user.email}`);

    console.log('\n======================================================');
    console.log(' ALL SETTINGS & PROFILE TESTS PASSED! ✅');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n❌ Settings test failed:', err);
    process.exit(1);
  } finally {
    try {
      const u = await prisma.user.findUnique({ where: { email: testEmail } });
      if (u) {
        await prisma.file.deleteMany({ where: { ownerId: u.id } });
        await prisma.user.delete({ where: { id: u.id } });
      }
    } catch {}
    await redisClient.quit();
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
