import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config();

// DATABASE_URLの検証
if (!process.env.DATABASE_URL) {
  console.error('⚠️ DATABASE_URL is not defined');
  console.error('⚠️ Please set DATABASE_URL environment variable');
  process.exit(1);
}

// PostgreSQLアダプターの設定
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// 接続エラーのハンドリング
pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});
