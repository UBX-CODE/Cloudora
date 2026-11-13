import { prisma } from '../src/lib/prisma';
import { redisClient } from '../src/lib/redis';
import * as folderService from '../src/services/folder.service';
import bcrypt from 'bcrypt';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log(' Cloudora Distributed Caching (Cache-Aside) Test');
  console.log('======================================================\n');

  const testEmail = 'cache_test_user@cloudora.dev';

  try {
    // 1. Setup & Cleanup
    console.log('[Setup] Cleaning up any previous test artifacts...');
    const oldUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (oldUser) {
      await prisma.file.deleteMany({ where: { ownerId: oldUser.id } });
      await prisma.folder.deleteMany({ where: { ownerId: oldUser.id } });
      await prisma.user.delete({ where: { id: oldUser.id } });
    }

    const testKeys = await redisClient.keys('cache:folder:*');
    if (testKeys.length > 0) {
      await redisClient.del(...testKeys);
      console.log(`[Setup] Flushed ${testKeys.length} folder cache keys from Redis.`);
    }

    // 2. Create Test User
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: hashedPassword,
        name: 'Cache Test User',
      },
    });
    console.log(`[Setup] Created test user: ${user.email} (ID: ${user.id})`);

    // 3. Create initial folders in DB
    const rootFolderA = await folderService.createFolder(user.id, { name: 'Projects' });
    const rootFolderB = await folderService.createFolder(user.id, { name: 'Photos' });
    console.log(`[Setup] Created initial folders: "${rootFolderA.name}" and "${rootFolderB.name}"`);

    // Clear cache keys created during setup
    await redisClient.del(...(await redisClient.keys(`cache:folder:*:${user.id}*`)).concat('dummy_non_empty'));

    console.log('\n------------------------------------------------------');
    console.log(' TEST 1: Cache MISS (First Read)');
    console.log('------------------------------------------------------');

    const cacheKey = `cache:folder:root:${user.id}`;
    const beforeMissKeys = await redisClient.get(cacheKey);
    assert(beforeMissKeys === null, 'Cache key should NOT exist before first read');

    const startMiss = performance.now();
    const missResult = await folderService.getRootFolders(user.id);
    const durationMiss = performance.now() - startMiss;

    console.log(`• Cache MISS Latency (Neon DB): ${durationMiss.toFixed(2)} ms`);
    console.log(`• Folders returned: ${missResult.length}`);
    assert(missResult.length === 2, 'Should return 2 folders');

    // Verify key was saved to Redis
    const cachedRaw = await redisClient.get(cacheKey);
    assert(cachedRaw !== null, 'Data MUST now be populated in Redis');
    const ttl = await redisClient.ttl(cacheKey);
    console.log(`• Key populated in Redis: "${cacheKey}" (TTL: ${ttl}s)`);
    assert(ttl > 0 && ttl <= 300, 'TTL should be <= 300 seconds');

    console.log('\n------------------------------------------------------');
    console.log(' TEST 2: Cache HIT (Immediate Second Read)');
    console.log('------------------------------------------------------');

    const startHit = performance.now();
    const hitResult = await folderService.getRootFolders(user.id);
    const durationHit = performance.now() - startHit;

    console.log(`• Cache HIT Latency (Redis In-Memory): ${durationHit.toFixed(2)} ms`);
    console.log(`• Folders returned: ${hitResult.length}`);
    console.log(`• Performance Gain: ${(durationMiss / Math.max(durationHit, 0.1)).toFixed(1)}x faster!`);
    assert(hitResult.length === 2, 'Cached response must return 2 folders');
    assert(hitResult[0].name === missResult[0].name, 'Cached data must match DB data');

    console.log('\n------------------------------------------------------');
    console.log(' TEST 3: Subfolder Caching & Breadcrumb Details');
    console.log('------------------------------------------------------');

    const subfolder = await folderService.createFolder(user.id, {
      name: 'Cloudora-Docs',
      parentId: rootFolderA.id,
    });
    console.log(`• Created child folder: "${subfolder.name}" inside "${rootFolderA.name}"`);

    // Verify root cache was invalidated by createFolder
    const rootAfterSub = await redisClient.get(cacheKey);
    console.log(`• Root cache key after createFolder: ${rootAfterSub ? 'STALE (Error)' : 'EVICTED (Correct)'}`);
    assert(rootAfterSub === null, 'Cache key must be evicted after folder mutation');

    // Fetch subfolder details (Miss -> Hit)
    const subDetailsMiss = await folderService.getFolderDetails(user.id, subfolder.id);
    console.log(`• Folder Details MISS: Loaded "${subDetailsMiss.folder.name}" with ${subDetailsMiss.ancestors.length} breadcrumb(s)`);
    assert(subDetailsMiss.ancestors[0].name === 'Projects', 'Breadcrumb ancestor should be Projects');

    const detailsKey = `cache:folder:details:${user.id}:${subfolder.id}`;
    const subDetailsCached = await redisClient.get(detailsKey);
    assert(subDetailsCached !== null, 'Folder details should be cached in Redis');
    console.log(`• Folder Details cached under: "${detailsKey}"`);

    console.log('\n------------------------------------------------------');
    console.log(' TEST 4: Write-Invalidate on Rename');
    console.log('------------------------------------------------------');

    await folderService.renameFolder(user.id, rootFolderA.id, { name: 'Engineering-Projects' });
    console.log(`• Renamed folder "${rootFolderA.id}" to "Engineering-Projects"`);

    const detailsAfterRename = await redisClient.get(detailsKey);
    console.log(`• Details cache key after rename: ${detailsAfterRename ? 'STALE' : 'EVICTED (Correct)'}`);
    assert(detailsAfterRename === null, 'Details cache must be evicted on rename');

    // Fresh read
    const freshRoot = await folderService.getRootFolders(user.id);
    const renamedFolder = freshRoot.find((f) => f.id === rootFolderA.id);
    assert(renamedFolder?.name === 'Engineering-Projects', 'Fresh read must show updated name');
    console.log(`• Fresh read Cache MISS confirmed updated folder name: "${renamedFolder?.name}"`);

    console.log('\n------------------------------------------------------');
    console.log(' TEST 5: Write-Invalidate on Soft Delete (Trash)');
    console.log('------------------------------------------------------');

    await folderService.trashFolder(user.id, rootFolderB.id);
    console.log(`• Trashed folder "${rootFolderB.name}"`);

    const rootAfterTrash = await redisClient.get(cacheKey);
    assert(rootAfterTrash === null, 'Root cache must be evicted after trash');
    console.log('• Root cache evicted successfully.');

    const freshRootAfterTrash = await folderService.getRootFolders(user.id);
    assert(freshRootAfterTrash.length === 1, 'Trashed folder should not appear in root folders');
    console.log(`• Fresh root folders count: ${freshRootAfterTrash.length} (Trashed folder excluded)`);

    console.log('\n======================================================');
    console.log(' ALL DISTRIBUTED CACHING TESTS PASSED SUCCESSFULLY! ');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n❌ Test suite failed with error:', err);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      if (user) {
        await prisma.file.deleteMany({ where: { ownerId: user.id } });
        await prisma.folder.deleteMany({ where: { ownerId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        const keys = await redisClient.keys(`cache:folder:*:${user.id}*`);
        if (keys.length > 0) await redisClient.del(...keys);
      }
    } catch {}
    await redisClient.quit();
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
