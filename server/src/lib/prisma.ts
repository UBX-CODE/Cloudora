import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { config } from '../config/env';

const adapter = new PrismaPg({
  connectionString: config.DATABASE_URL,
});

export const prisma = new PrismaClient({
  adapter,
});