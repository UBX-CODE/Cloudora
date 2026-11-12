import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import http from 'http';

const BASE_TEST_PORT = 5055;

interface TestResult {
  title: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(title: string, testFn: () => Promise<void>) {
  try {
    process.stdout.write(`• Testing: ${title}... `);
    await testFn();
    console.log('PASSED');
    results.push({ title, passed: true });
  } catch (err: any) {
    console.log('FAILED');
    console.error(`  Error: ${err.message}`);
    results.push({ title, passed: false, error: err.message });
  }
}

async function startTestServer(): Promise<{ server: http.Server; baseUrl: string }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address() as any;
      const port = addr.port;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}/api` });
    });
  });
}

async function main() {
  console.log('\n======================================================');
  console.log(' Starting Cloudora Folder Management Test Suite');
  console.log('======================================================\n');

  const { server, baseUrl } = await startTestServer();

  try {
    // Clean up test data if left over
    const testEmails = ['test_user1_folder@cloudora.dev', 'test_user2_folder@cloudora.dev'];
    await prisma.file.deleteMany({ where: { owner: { email: { in: testEmails } } } });
    await prisma.folder.deleteMany({ where: { owner: { email: { in: testEmails } } } });
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

    let token1 = '';
    let user1Id = '';
    let token2 = '';
    let user2Id = '';

    // --- TEST 1: Register and login two test users ---
    await runTest('User Registration & Authentication (Existing APIs)', async () => {
      const reg1 = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Folder User 1',
          email: testEmails[0],
          password: 'Password123!',
        }),
      });
      const data1 = await reg1.json();
      assert(reg1.status === 201, `Register user 1 returned status ${reg1.status}`);
      token1 = data1.data.token;
      user1Id = data1.data.user.id;

      const reg2 = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Folder User 2',
          email: testEmails[1],
          password: 'Password123!',
        }),
      });
      const data2 = await reg2.json();
      assert(reg2.status === 201, `Register user 2 returned status ${reg2.status}`);
      token2 = data2.data.token;
      user2Id = data2.data.user.id;

      // Verify GET /auth/me
      const meRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      const meData = await meRes.json();
      assert(meRes.status === 200 && meData.data.user.id === user1Id, 'GET /auth/me works');
    });

    // --- TEST 2: Unauthenticated requests ---
    await runTest('Reject Unauthenticated Requests with 401', async () => {
      const res1 = await fetch(`${baseUrl}/folders`);
      assert(res1.status === 401, `GET /folders expected 401, got ${res1.status}`);

      const res2 = await fetch(`${baseUrl}/folders/root`);
      assert(res2.status === 401, `GET /folders/root expected 401, got ${res2.status}`);

      const res3 = await fetch(`${baseUrl}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Secret' }),
      });
      assert(res3.status === 401, `POST /folders expected 401, got ${res3.status}`);
    });

    // --- TEST 3: Validation checks ---
    await runTest('Folder Input Validation (empty, invalid chars, bad parent)', async () => {
      // Empty name
      const res1 = await fetch(`${baseUrl}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ name: '   ' }),
      });
      assert(res1.status === 400, `Empty name expected 400, got ${res1.status}`);

      // Invalid characters
      const res2 = await fetch(`${baseUrl}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ name: 'Bad/Folder/Name' }),
      });
      assert(res2.status === 400, `Slashes expected 400, got ${res2.status}`);

      // Non-existent parent ID
      const res3 = await fetch(`${baseUrl}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ name: 'Child', parentId: '00000000-0000-0000-0000-000000000000' }),
      });
      assert(res3.status === 404, `Bad parent expected 404, got ${res3.status}`);
    });

    let docFolderId = '';
    let mediaFolderId = '';

    // --- TEST 4: Create Root Folders ---
    await runTest('Create Root Folders & Prevent Duplicate Sibling Names', async () => {
      const res1 = await fetch(`${baseUrl}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ name: 'Documents' }),
      });
      const data1 = await res1.json();
      assert(res1.status === 201, `Created Documents expected 201, got ${res1.status}`);
      assert(data1.data.folder.name === 'Documents', 'Folder name matches');
      assert(data1.data.folder.parentId === null, 'Folder is at root');
      docFolderId = data1.data.folder.id;

      const res2 = await fetch(`${baseUrl}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ name: 'Media' }),
      });
      const data2 = await res2.json();
      assert(res2.status === 201, `Created Media expected 201, got ${res2.status}`);
      mediaFolderId = data2.data.folder.id;

      // Duplicate name at root
      const resDup = await fetch(`${baseUrl}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ name: 'documents' }), // case-insensitive check
      });
      assert(resDup.status === 409, `Duplicate name expected 409, got ${resDup.status}`);
    });

    // --- TEST 5: Get Root Folders ---
    await runTest('Get Root Folders (GET /folders/root and GET /folders)', async () => {
      const res1 = await fetch(`${baseUrl}/folders/root`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      const data1 = await res1.json();
      assert(res1.status === 200, `GET /folders/root status 200`);
      assert(data1.data.folders.length === 2, `Expected 2 root folders, got ${data1.data.folders.length}`);

      const res2 = await fetch(`${baseUrl}/folders`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      const data2 = await res2.json();
      assert(res2.status === 200, `GET /folders status 200`);
      assert(data2.data.folders.length === 2, `Expected 2 root folders`);
    });

    let projectsFolderId = '';
    let yearFolderId = '';

    // --- TEST 6: Create Nested Subfolders ---
    await runTest('Create Multi-Level Nested Subfolders', async () => {
      // Level 2: Documents -> Projects
      const res1 = await fetch(`${baseUrl}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ name: 'Projects', parentId: docFolderId }),
      });
      const data1 = await res1.json();
      assert(res1.status === 201, `Created Projects expected 201`);
      projectsFolderId = data1.data.folder.id;

      // Level 3: Projects -> 2026
      const res2 = await fetch(`${baseUrl}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ name: '2026', parentId: projectsFolderId }),
      });
      const data2 = await res2.json();
      assert(res2.status === 201, `Created 2026 expected 201`);
      yearFolderId = data2.data.folder.id;

      // Get subfolders of Documents
      const sub1 = await fetch(`${baseUrl}/folders/${docFolderId}/subfolders`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      const subData1 = await sub1.json();
      assert(sub1.status === 200, `Subfolders status 200`);
      assert(subData1.data.folders.length === 1 && subData1.data.folders[0].name === 'Projects', 'Subfolder is Projects');

      // Get subfolders using query param ?parentId=...
      const subQuery = await fetch(`${baseUrl}/folders?parentId=${projectsFolderId}`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      const subQueryData = await subQuery.json();
      assert(subQuery.status === 200 && subQueryData.data.folders[0].name === '2026', 'Query parentId works');
    });

    // --- TEST 7: Breadcrumb Ancestors & Folder Details ---
    await runTest('Get Folder Details with Breadcrumb Ancestors (Root to Leaf)', async () => {
      const res = await fetch(`${baseUrl}/folders/${yearFolderId}`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      const data = await res.json();
      assert(res.status === 200, `Status 200`);
      assert(data.data.folder.name === '2026', 'Folder name 2026');
      assert(data.data.ancestors.length === 2, `Expected 2 ancestors, got ${data.data.ancestors.length}`);
      assert(data.data.ancestors[0].name === 'Documents', 'Ancestor 0 is Documents (root)');
      assert(data.data.ancestors[1].name === 'Projects', 'Ancestor 1 is Projects (parent)');
    });

    // --- TEST 8: Strict Ownership Isolation between Users ---
    await runTest('Enforce Strict Ownership Isolation (User 2 blocked from User 1)', async () => {
      // User 2 cannot see User 1's root folders
      const u2Root = await fetch(`${baseUrl}/folders/root`, {
        headers: { Authorization: `Bearer ${token2}` },
      });
      const u2RootData = await u2Root.json();
      assert(u2RootData.data.folders.length === 0, 'User 2 has 0 folders initially');

      // User 2 cannot access User 1's folder details (404)
      const u2Get = await fetch(`${baseUrl}/folders/${docFolderId}`, {
        headers: { Authorization: `Bearer ${token2}` },
      });
      assert(u2Get.status === 404, `User 2 GET expected 404, got ${u2Get.status}`);

      // User 2 cannot create a folder inside User 1's parent (404)
      const u2Create = await fetch(`${baseUrl}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token2}`,
        },
        body: JSON.stringify({ name: 'Sneaky', parentId: docFolderId }),
      });
      assert(u2Create.status === 404, `User 2 create inside User 1 parent expected 404, got ${u2Create.status}`);

      // User 2 cannot rename User 1's folder (404)
      const u2Rename = await fetch(`${baseUrl}/folders/${docFolderId}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token2}`,
        },
        body: JSON.stringify({ name: 'Hacked' }),
      });
      assert(u2Rename.status === 404, `User 2 rename expected 404, got ${u2Rename.status}`);

      // User 2 cannot trash User 1's folder (404)
      const u2Trash = await fetch(`${baseUrl}/folders/${docFolderId}/trash`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token2}` },
      });
      assert(u2Trash.status === 404, `User 2 trash expected 404, got ${u2Trash.status}`);

      // User 2 cannot delete User 1's folder (404)
      const u2Del = await fetch(`${baseUrl}/folders/${docFolderId}/permanent`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token2}` },
      });
      assert(u2Del.status === 404, `User 2 delete expected 404, got ${u2Del.status}`);
    });

    // --- TEST 9: Rename Folder ---
    await runTest('Rename Folder with Sibling Collision Prevention', async () => {
      // Create sibling "Reports" under Projects
      await fetch(`${baseUrl}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ name: 'Reports', parentId: projectsFolderId }),
      });

      // Try renaming "2026" to "Reports" -> 409
      const resDup = await fetch(`${baseUrl}/folders/${yearFolderId}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ name: 'Reports' }),
      });
      assert(resDup.status === 409, `Rename duplicate expected 409, got ${resDup.status}`);

      // Rename to "Archive 2026" -> 200
      const resOk = await fetch(`${baseUrl}/folders/${yearFolderId}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ name: 'Archive 2026' }),
      });
      const dataOk = await resOk.json();
      assert(resOk.status === 200 && dataOk.data.folder.name === 'Archive 2026', 'Renamed successfully');
    });

    // --- TEST 10: Circular Movement Prevention ---
    await runTest('Prevent Circular Hierarchy (Cannot move folder into itself or descendant)', async () => {
      // 1. Move Documents into itself -> 400
      const resSelf = await fetch(`${baseUrl}/folders/${docFolderId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ targetParentId: docFolderId }),
      });
      assert(resSelf.status === 400, `Move to self expected 400, got ${resSelf.status}`);

      // 2. Move Documents into Projects (its child) -> 400
      const resChild = await fetch(`${baseUrl}/folders/${docFolderId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ targetParentId: projectsFolderId }),
      });
      assert(resChild.status === 400, `Move to child expected 400, got ${resChild.status}`);

      // 3. Move Documents into Archive 2026 (its grandchild) -> 400
      const resGrandchild = await fetch(`${baseUrl}/folders/${docFolderId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ targetParentId: yearFolderId }),
      });
      assert(resGrandchild.status === 400, `Move to grandchild expected 400, got ${resGrandchild.status}`);
    });

    // --- TEST 11: Valid Move & Move to Root ---
    await runTest('Move Folder to Another Parent and Move to Root', async () => {
      // Move Archive 2026 under Media folder
      const moveRes = await fetch(`${baseUrl}/folders/${yearFolderId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ targetParentId: mediaFolderId }),
      });
      const moveData = await moveRes.json();
      assert(moveRes.status === 200, `Move expected 200, got ${moveRes.status}`);
      assert(moveData.data.folder.parentId === mediaFolderId, 'Parent is now Media');

      // Move Archive 2026 to Root via /move-to-root
      const rootRes = await fetch(`${baseUrl}/folders/${yearFolderId}/move-to-root`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token1}` },
      });
      const rootData = await rootRes.json();
      assert(rootRes.status === 200, `Move to root expected 200`);
      assert(rootData.data.folder.parentId === null, 'Parent is now root (null)');

      // Put Archive 2026 back under Projects for subsequent cascade test
      await fetch(`${baseUrl}/folders/${yearFolderId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ targetParentId: projectsFolderId }),
      });
    });

    // --- TEST 12: Star / Unstar Folder ---
    await runTest('Star and Unstar Folders', async () => {
      const starRes = await fetch(`${baseUrl}/folders/${docFolderId}/star`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ isStarred: true }),
      });
      const starData = await starRes.json();
      assert(starRes.status === 200 && starData.data.folder.isStarred === true, 'Folder is starred');

      // Toggle star off
      const unstarRes = await fetch(`${baseUrl}/folders/${docFolderId}/star`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token1}` },
      });
      const unstarData = await unstarRes.json();
      assert(unstarRes.status === 200 && unstarData.data.folder.isStarred === false, 'Folder unstarred');
    });

    // --- TEST 13: Trash and Cascade to Files & Subfolders ---
    await runTest('Trash Folder (Cascades to nested subfolders and files)', async () => {
      // Create a test file in Projects folder
      await prisma.file.create({
        data: {
          name: 'project_notes.txt',
          mimeType: 'text/plain',
          size: BigInt(1024),
          ownerId: user1Id,
          folderId: projectsFolderId,
        },
      });

      // Trash Documents
      const trashRes = await fetch(`${baseUrl}/folders/${docFolderId}/trash`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token1}` },
      });
      const trashData = await trashRes.json();
      assert(trashRes.status === 200, `Trash expected 200, got ${trashRes.status}`);
      assert(trashData.data.isTrashed === true, 'Documents is trashed');

      // Check root folders: Documents should no longer appear
      const rootRes = await fetch(`${baseUrl}/folders/root`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      const rootData = await rootRes.json();
      const hasDoc = rootData.data.folders.some((f: any) => f.id === docFolderId);
      assert(!hasDoc, 'Documents is excluded from root');

      // Check trash endpoint
      const trashListRes = await fetch(`${baseUrl}/folders/trash`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      const trashListData = await trashListRes.json();
      assert(trashListData.data.folders.length >= 1, 'Trash list contains folders');

      // Verify nested folders and files in DB are marked isTrashed
      const childFolder = await prisma.folder.findUnique({ where: { id: projectsFolderId } });
      assert(childFolder?.isTrashed === true, 'Child folder Projects is also marked isTrashed');

      const fileRecord = await prisma.file.findFirst({ where: { folderId: projectsFolderId } });
      assert(fileRecord?.isTrashed === true, 'File in Projects is marked isTrashed');
    });

    // --- TEST 14: Restore Folder ---
    await runTest('Restore Folder (Restores nested hierarchy and files)', async () => {
      const res = await fetch(`${baseUrl}/folders/${docFolderId}/restore`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token1}` },
      });
      const data = await res.json();
      assert(res.status === 200, `Restore expected 200, got ${res.status}`);
      assert(data.data.folder.isTrashed === false, 'Folder is restored');

      // Verify child is restored
      const child = await prisma.folder.findUnique({ where: { id: projectsFolderId } });
      assert(child?.isTrashed === false, 'Child is restored');

      // Verify file is restored
      const fileRecord = await prisma.file.findFirst({ where: { folderId: projectsFolderId } });
      assert(fileRecord?.isTrashed === false, 'File is restored');

      // Verify back in root
      const rootRes = await fetch(`${baseUrl}/folders/root`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      const rootData = await rootRes.json();
      const hasDoc = rootData.data.folders.some((f: any) => f.id === docFolderId);
      assert(hasDoc, 'Documents is back in root folders');
    });

    // --- TEST 15: Permanently Delete Folder (Hard Delete with Foreign Key Handling) ---
    await runTest('Permanently Delete Folder Hierarchy (Clean cascade without FK violations)', async () => {
      const delRes = await fetch(`${baseUrl}/folders/${docFolderId}/permanent`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token1}` },
      });
      const delData = await delRes.json();
      assert(delRes.status === 200, `Delete expected 200, got ${delRes.status}`);
      assert(delData.data.deletedFolderId === docFolderId, 'Deleted folder ID matches');

      // Verify records are gone from DB
      const docInDb = await prisma.folder.findUnique({ where: { id: docFolderId } });
      assert(docInDb === null, 'Documents folder completely deleted from DB');

      const projInDb = await prisma.folder.findUnique({ where: { id: projectsFolderId } });
      assert(projInDb === null, 'Projects folder completely deleted from DB');

      const fileInDb = await prisma.file.findFirst({ where: { folderId: projectsFolderId } });
      assert(fileInDb === null, 'Files inside folder completely deleted from DB');
    });

    // Cleanup remaining test user 2 and remaining folder
    await prisma.file.deleteMany({ where: { owner: { email: { in: testEmails } } } });
    await prisma.folder.deleteMany({ where: { owner: { email: { in: testEmails } } } });
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
  } finally {
    server.close();
    await prisma.$disconnect();
  }

  console.log('\n======================================================');
  console.log(' Test Results Summary:');
  console.log('======================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error('\nSome tests failed:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.error(` - ${r.title}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('\nAll tests passed successfully!\n');
  }
}

main().catch((err) => {
  console.error('Fatal error during testing:', err);
  process.exit(1);
});

