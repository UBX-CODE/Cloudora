import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import http from 'http';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const results: { title: string; passed: boolean; error?: string }[] = [];

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
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}/api` });
    });
  });
}

async function main() {
  console.log('\n======================================================');
  console.log(' Starting Cloudora Multipart File Upload Test Suite');
  console.log('======================================================\n');

  const { server, baseUrl } = await startTestServer();

  try {
    const testEmails = ['mp_tester_1@cloudora.dev', 'mp_tester_2@cloudora.dev'];
    await prisma.uploadSession.deleteMany({ where: { owner: { email: { in: testEmails } } } });
    await prisma.file.deleteMany({ where: { owner: { email: { in: testEmails } } } });
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

    let token1 = '';
    let user1Id = '';
    let token2 = '';
    let user2Id = '';

    // TEST 1: Register two users
    await runTest('User Registration & Authentication', async () => {
      const reg1 = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'MP User 1', email: testEmails[0], password: 'Password123!' }),
      });
      const data1 = await reg1.json();
      assert(reg1.status === 201, `Register user 1 returned ${reg1.status}`);
      token1 = data1.data.token;
      user1Id = data1.data.user.id;

      const reg2 = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'MP User 2', email: testEmails[1], password: 'Password123!' }),
      });
      const data2 = await reg2.json();
      assert(reg2.status === 201, `Register user 2 returned ${reg2.status}`);
      token2 = data2.data.token;
      user2Id = data2.data.user.id;
    });

    // TEST 2: Reject Unauthenticated
    await runTest('Reject Unauthenticated Requests with 401', async () => {
      const res1 = await fetch(`${baseUrl}/files/multipart/initiate`, { method: 'POST' });
      assert(res1.status === 401, `Expected 401, got ${res1.status}`);

      const res2 = await fetch(`${baseUrl}/files/fake-id/part-urls`, { method: 'POST' });
      assert(res2.status === 401, `Expected 401, got ${res2.status}`);

      const res3 = await fetch(`${baseUrl}/files/fake-id/complete`, { method: 'POST' });
      assert(res3.status === 401, `Expected 401, got ${res3.status}`);

      const res4 = await fetch(`${baseUrl}/files/fake-id/abort`, { method: 'POST' });
      assert(res4.status === 401, `Expected 401, got ${res4.status}`);

      const res5 = await fetch(`${baseUrl}/files/fake-id/session`, { method: 'GET' });
      assert(res5.status === 401, `Expected 401, got ${res5.status}`);
    });

    // TEST 3: Validation checks
    await runTest('Input Validation (MIME type, thresholds, sizes)', async () => {
      // Size > 100 MB
      const res1 = await fetch(`${baseUrl}/files/multipart/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
        body: JSON.stringify({ name: 'huge.mp4', mimeType: 'video/mp4', size: 105 * 1024 * 1024 }),
      });
      assert(res1.status === 400, `Size > 100MB expected 400, got ${res1.status}`);

      // Size <= 16 MB rejected for multipart
      const res2 = await fetch(`${baseUrl}/files/multipart/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
        body: JSON.stringify({ name: 'small.mp4', mimeType: 'video/mp4', size: 10 * 1024 * 1024 }),
      });
      assert(res2.status === 400, `Size <= 16MB expected 400, got ${res2.status}`);

      // Invalid MIME type
      const res3 = await fetch(`${baseUrl}/files/multipart/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
        body: JSON.stringify({ name: 'bad.exe', mimeType: 'application/x-msdownload', size: 20 * 1024 * 1024 }),
      });
      assert(res3.status === 400, `Bad MIME expected 400, got ${res3.status}`);
    });

    // TEST 4: Single-file upload flow (<= 16 MB)
    let singleFileId = '';
    await runTest('Single-file Upload Flow (Presigned PUT and HeadObject confirmation)', async () => {
      const fileSize = 1024 * 1024; // 1 MB
      const initRes = await fetch(`${baseUrl}/files/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
        body: JSON.stringify({ name: 'document.pdf', mimeType: 'application/pdf', size: fileSize }),
      });
      const initData = await initRes.json();
      assert(initRes.status === 201, `Single upload init expected 201, got ${initRes.status}`);
      singleFileId = initData.data.fileId;
      const uploadUrl = initData.data.uploadUrl;

      // Direct PUT to MinIO
      const dummyBuffer = Buffer.alloc(fileSize, 'A');
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        body: dummyBuffer,
      });
      assert(putRes.ok, `Direct PUT to MinIO returned status ${putRes.status}`);

      // Complete single upload
      const compRes = await fetch(`${baseUrl}/files/${singleFileId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
      });
      const compData = await compRes.json();
      assert(compRes.status === 200, `Complete expected 200, got ${compRes.status}`);
      assert(compData.data.status === 'UPLOADED', 'File status is UPLOADED');
    });

    // TEST 5: Initialize Multipart Upload (> 16 MB)
    let mpFileId = '';
    let mpSessionId = '';
    const mpSize = 20 * 1024 * 1024; // 20 MB -> 8 MB, 8 MB, 4 MB = 3 parts
    await runTest('Initialize Multipart Upload (20 MB file -> 3 parts)', async () => {
      const initRes = await fetch(`${baseUrl}/files/multipart/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
        body: JSON.stringify({ name: 'recording.flac', mimeType: 'audio/flac', size: mpSize }),
      });
      const initData = await initRes.json();
      assert(initRes.status === 201, `Init multipart expected 201, got ${initRes.status}`);
      assert(initData.data.totalParts === 3, `Expected 3 parts, got ${initData.data.totalParts}`);
      assert(initData.data.partSize === 8 * 1024 * 1024, `Expected partSize 8MB`);
      mpFileId = initData.data.fileId;
      mpSessionId = initData.data.sessionId;
    });

    // TEST 6: Generate Part URLs & selective regeneration
    let partUrls: { partNumber: number; uploadUrl: string }[] = [];
    await runTest('Generate Part URLs & Specific Part Regeneration', async () => {
      // All parts
      const res = await fetch(`${baseUrl}/files/${mpFileId}/part-urls`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
      });
      const data = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(data.data.urls.length === 3, `Expected 3 URLs, got ${data.data.urls.length}`);
      partUrls = data.data.urls;

      // Regenerate single part 2
      const resSingle = await fetch(`${baseUrl}/files/${mpFileId}/part-urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
        body: JSON.stringify({ partNumbers: [2] }),
      });
      const dataSingle = await resSingle.json();
      assert(resSingle.status === 200, `Expected 200, got ${resSingle.status}`);
      assert(dataSingle.data.urls.length === 1 && dataSingle.data.urls[0].partNumber === 2, 'Regenerated part 2');
    });

    // TEST 7: Upload Chunks Directly to MinIO & Check Session Resume
    const uploadedParts: { PartNumber: number; ETag: string }[] = [];
    await runTest('Upload Chunks Directly to MinIO & MinIO ListParts Verification', async () => {
      const part1Size = 8 * 1024 * 1024;
      const part2Size = 8 * 1024 * 1024;
      const part3Size = 4 * 1024 * 1024;

      // Part 1
      const buf1 = Buffer.alloc(part1Size, '1');
      const put1 = await fetch(partUrls[0].uploadUrl, { method: 'PUT', body: buf1 });
      assert(put1.ok, `Part 1 PUT failed: ${put1.status}`);
      const etag1 = put1.headers.get('ETag') || put1.headers.get('etag');
      assert(!!etag1, 'ETag 1 present');
      uploadedParts.push({ PartNumber: 1, ETag: etag1!.replace(/"/g, '') });

      // Part 2
      const buf2 = Buffer.alloc(part2Size, '2');
      const put2 = await fetch(partUrls[1].uploadUrl, { method: 'PUT', body: buf2 });
      assert(put2.ok, `Part 2 PUT failed: ${put2.status}`);
      const etag2 = put2.headers.get('ETag') || put2.headers.get('etag');
      assert(!!etag2, 'ETag 2 present');
      uploadedParts.push({ PartNumber: 2, ETag: etag2!.replace(/"/g, '') });

      // Check Session Status via MinIO ListParts
      const statusRes = await fetch(`${baseUrl}/files/${mpFileId}/session`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      const statusData = await statusRes.json();
      assert(statusRes.status === 200, `Status expected 200, got ${statusRes.status}`);
      assert(statusData.data.status === 'IN_PROGRESS', 'Session is IN_PROGRESS');
      assert(statusData.data.uploadedParts.length === 2, `MinIO verified 2 uploaded parts, got ${statusData.data.uploadedParts.length}`);
      assert(statusData.data.missingPartNumbers.includes(3), 'Missing parts correctly identifies part 3');

      // Upload Part 3
      const buf3 = Buffer.alloc(part3Size, '3');
      const put3 = await fetch(partUrls[2].uploadUrl, { method: 'PUT', body: buf3 });
      assert(put3.ok, `Part 3 PUT failed: ${put3.status}`);
      const etag3 = put3.headers.get('ETag') || put3.headers.get('etag');
      assert(!!etag3, 'ETag 3 present');
      uploadedParts.push({ PartNumber: 3, ETag: etag3!.replace(/"/g, '') });
    });

    // TEST 8: Rejection on missing parts
    await runTest('Reject Multipart Completion When Parts Missing', async () => {
      const res = await fetch(`${baseUrl}/files/${mpFileId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
        body: JSON.stringify({ parts: [uploadedParts[0], uploadedParts[1]] }), // Missing part 3
      });
      assert(res.status === 400, `Expected 400 on incomplete parts, got ${res.status}`);
    });

    // TEST 9: Complete Multipart Upload
    await runTest('Complete Multipart Upload & HeadObject Verification', async () => {
      const res = await fetch(`${baseUrl}/files/${mpFileId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
        body: JSON.stringify({ parts: uploadedParts }),
      });
      const data = await res.json();
      assert(res.status === 200, `Complete expected 200, got ${res.status}`);
      assert(data.data.status === 'UPLOADED', 'File status is UPLOADED');
      assert(data.data.size === mpSize, 'File size matches exactly');
    });

    // TEST 10: Idempotent Completion
    await runTest('Idempotent Multipart Completion (Repeated requests return 200)', async () => {
      const res = await fetch(`${baseUrl}/files/${mpFileId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
        body: JSON.stringify({ parts: uploadedParts }),
      });
      assert(res.status === 200, `Idempotent complete expected 200, got ${res.status}`);
    });

    // TEST 11: Abort Multipart Upload
    await runTest('Abort Multipart Upload Flow (Cleans up storage and updates DB)', async () => {
      const initRes = await fetch(`${baseUrl}/files/multipart/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
        body: JSON.stringify({ name: 'aborted_audio.flac', mimeType: 'audio/flac', size: 20 * 1024 * 1024 }),
      });
      const initData = await initRes.json();
      const abortFileId = initData.data.fileId;

      // Abort
      const abortRes = await fetch(`${baseUrl}/files/${abortFileId}/abort`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
      });
      const abortData = await abortRes.json();
      assert(abortRes.status === 200, `Abort expected 200, got ${abortRes.status}`);
      assert(abortData.data.status === 'ABORTED', 'Session status is ABORTED');

      // Idempotent abort
      const repeatAbort = await fetch(`${baseUrl}/files/${abortFileId}/abort`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token1}` },
      });
      assert(repeatAbort.status === 200, `Repeat abort expected 200`);
    });

    // TEST 12: Ownership Isolation
    await runTest('Strict Ownership Isolation (User 2 blocked from User 1)', async () => {
      // User 2 cannot get part URLs for User 1's file
      const u2Parts = await fetch(`${baseUrl}/files/${mpFileId}/part-urls`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token2}` },
      });
      assert(u2Parts.status === 404, `User 2 part-urls expected 404, got ${u2Parts.status}`);

      // User 2 cannot complete User 1's file
      const u2Complete = await fetch(`${baseUrl}/files/${mpFileId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
        body: JSON.stringify({ parts: uploadedParts }),
      });
      assert(u2Complete.status === 404, `User 2 complete expected 404, got ${u2Complete.status}`);

      // User 2 cannot get session status
      const u2Session = await fetch(`${baseUrl}/files/${mpFileId}/session`, {
        headers: { Authorization: `Bearer ${token2}` },
      });
      assert(u2Session.status === 404, `User 2 session expected 404, got ${u2Session.status}`);

      // User 2 cannot abort User 1's file
      const u2Abort = await fetch(`${baseUrl}/files/${mpFileId}/abort`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token2}` },
      });
      assert(u2Abort.status === 404, `User 2 abort expected 404, got ${u2Abort.status}`);
    });

    // Cleanup
    await prisma.uploadSession.deleteMany({ where: { owner: { email: { in: testEmails } } } });
    await prisma.file.deleteMany({ where: { owner: { email: { in: testEmails } } } });
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
    process.exit(1);
  } else {
    console.log('\nAll backend multipart tests passed successfully!\n');
  }
}

main().catch((err) => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});

