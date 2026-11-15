import { prisma } from '../src/lib/prisma';
import * as authService from '../src/services/auth.service';
import sharp from 'sharp';

async function main() {
  console.log('Testing Avatar Upload, MinIO Processing & Streaming...\n');

  // Create a 100x100 test PNG image buffer using sharp
  const testImageBuffer = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 120, g: 60, b: 220, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const base64DataUrl = `data:image/png;base64,${testImageBuffer.toString('base64')}`;

  // Find any test user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found in DB to test.');
    return;
  }

  console.log(`Using user "${user.name}" (${user.id})`);

  // 1. Upload avatar
  const updatedUser = await authService.updateProfile(user.id, {
    avatar: base64DataUrl,
  });

  console.log('✅ Avatar updated. New avatar URL:', updatedUser.avatar);

  // 2. Fetch avatar stream
  const { stream, contentType } = await authService.getAvatarStream(user.id);
  console.log('✅ Avatar stream fetched successfully. Content-Type:', contentType);

  // 3. Remove avatar
  const removedUser = await authService.updateProfile(user.id, {
    avatar: null,
  });
  console.log('✅ Avatar removed. Avatar is now:', removedUser.avatar);

  console.log('\n🎉 ALL AVATAR ENGINE TESTS PASSED!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Avatar test failed:', err);
  process.exit(1);
});
