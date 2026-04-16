import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// DATABASE_URLの検証（モックモード時は警告のみ）
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL is not defined - Running in MOCK mode');
  console.warn('⚠️ All API endpoints will use in-memory mock data');
} else {
  // 接続情報のログ出力（パスワードをマスク）
  const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@');
  console.log('📊 Database connection string:', maskedUrl);
}

// PostgreSQLアダプターの設定
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/dummy',
});

// 接続エラーのハンドリング
pool.on('error', (err: Error) => {
  console.error('❌ PostgreSQL pool error:', err.message);
  console.error('Error details:', {
    name: err.name,
    code: 'code' in err ? (err as Error & { code?: string }).code : undefined,
    stack: err.stack,
  });
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
