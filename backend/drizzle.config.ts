import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

export default defineConfig({
  schema: './src/modules/**/schemas/*.schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: DB_HOST!,
    port: Number(DB_PORT) || 5432,
    user: DB_USER!,
    password: DB_PASSWORD!,
    database: DB_NAME!,
    ssl: false,
  },
});
