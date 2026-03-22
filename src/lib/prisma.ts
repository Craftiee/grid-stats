import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const adapter = new PrismaPg({
    connectionString,
    max: 10, // connection pool limit
  });
  return new PrismaClient({ adapter });
}

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

const prisma = global._prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') global._prisma = prisma;

export default prisma;
