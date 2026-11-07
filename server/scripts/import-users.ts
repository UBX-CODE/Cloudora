import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../src/lib/prisma';

interface JsonUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

async function importUsers() {
  try {
    const filePath = path.resolve(process.cwd(), 'data/users.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');

    const users: JsonUser[] = JSON.parse(fileContent);

    if (!Array.isArray(users)) {
      throw new Error('Invalid users.json format.');
    }

    const result = await prisma.user.createMany({
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email.trim().toLowerCase(),
        passwordHash: user.passwordHash,
        role: user.role,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.createdAt),
      })),
      skipDuplicates: true,
    });

    const importedIds = await prisma.user.findMany({
      where: {
        id: { in: users.map((user) => user.id) },
      },
      select: { id: true },
    });

    const verifiedIds = new Set(importedIds.map((user) => user.id));
    const missingIds = users
      .filter((user) => !verifiedIds.has(user.id))
      .map((user) => user.id);

    console.log('Total JSON users:', users.length);
    console.log('New records inserted:', result.count);
    console.log('Existing records skipped:', users.length - result.count);
    console.log('Verified records:', importedIds.length);

    if (missingIds.length > 0) {
      throw new Error(`Import verification failed. Missing records: ${missingIds.length}`);
    }

    console.log('User import verification successful.');
  } catch (error) {
    console.error('User import failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

importUsers();