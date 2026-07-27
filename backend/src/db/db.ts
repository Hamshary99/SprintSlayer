import { drizzle } from 'drizzle-orm/node-postgres';
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const db = drizzle({ client: pool });

// Function to test the database connection
export const checkDbConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    client.release();
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
};
