import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export default defineConfig({
  schema: './src/modules/**/schemas/*.schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: databaseUrl
    ? { url: databaseUrl }
    : {
        host: process.env.DB_HOST!,
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      },
});
