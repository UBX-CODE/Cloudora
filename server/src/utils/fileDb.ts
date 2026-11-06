import fs from 'fs/promises';
import path from 'path';
import { IUser } from '../types/user.types';

const DATA_DIR = path.resolve(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

/**
 * Ensures the data directory and users.json file exist.
 */
async function ensureFileExists(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error initializing data storage:', error);
    throw error;
  }
}

/**
 * Reads all users from users.json.
 */
export async function readUsers(): Promise<IUser[]> {
  await ensureFileExists();
  try {
    const rawData = await fs.readFile(USERS_FILE, 'utf-8');
    if (!rawData.trim()) {
      return [];
    }
    return JSON.parse(rawData) as IUser[];
  } catch (error) {
    console.error('Error reading users.json:', error);
    return [];
  }
}

/**
 * Overwrites users.json with the provided users array.
 */
export async function writeUsers(users: IUser[]): Promise<void> {
  await ensureFileExists();
  try {
    const tempFile = `${USERS_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(users, null, 2), 'utf-8');
    await fs.rename(tempFile, USERS_FILE);
  } catch (error) {
    console.error('Error writing users.json:', error);
    throw error;
  }
}

