import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './database/schema.ts',
  out: './database/migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rpmon_dashboard',
    port: parseInt(process.env.DB_PORT || '3306'),
  },
});
