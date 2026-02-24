import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

export default {
  schema: './database/schema.ts',
  out: './database/migrations',
  driver: 'mysql2',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tikfactory',
    port: parseInt(process.env.DB_PORT || '3306'),
  },
} satisfies Config;
