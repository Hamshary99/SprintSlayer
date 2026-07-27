import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from './env.config.js';

export const db = drizzle(env.DATABASE_URL);

// Get the underlying Pool for raw connection checks
const pool = (db as any).$client;

/**
 * Verifies the database is reachable before the server starts.
 * Logs the round-trip time and exits the process on failure so
 * a misconfigured environment is caught immediately.
 */
export const checkDbConnection = async (): Promise<void> => {
    console.log('🔌 Checking database connection...');
    const start = Date.now();
    try {
        const client = await pool.connect();
        const elapsed = Date.now() - start;
        console.log(`Database connected (${elapsed}ms) — ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME} as ${env.DB_USER}`);
        client.release();
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    }
};
