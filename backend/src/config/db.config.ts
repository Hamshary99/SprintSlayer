import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from './env.config.js';

const isProduction = env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';
const requiresSsl = isProduction || env.DATABASE_URL.includes('sslmode=require');

const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: requiresSsl ? { rejectUnauthorized: false } : false,
});

export const db = drizzle({ client: pool });

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
        console.log(`Database connected successfully (${elapsed}ms)`);
        client.release();
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    }
};
