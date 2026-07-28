/**
 * Seed Script — Users
 * Generates 20 users (5 admins + 15 members) with hashed passwords from .env
 *
 * Run with:
 *   npx tsx src/seeds/seed.users.ts
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from '../modules/users/schemas/user.schema.js';

// ─── DB Connection ────────────────────────────────────────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const db = drizzle({ client: pool });

// ─── Seed Password (from .env, fallback to 'Password123!') ───────────────────
const SEED_PASSWORD = process.env.DB_PASSWORD ?? 'Password123!';

// ─── Random User Data ─────────────────────────────────────────────────────────
const firstNames = [
  'Liam', 'Emma', 'Noah', 'Olivia', 'Aiden', 'Sophia', 'Lucas', 'Ava',
  'Mason', 'Isabella', 'Ethan', 'Mia', 'Logan', 'Charlotte', 'Elijah',
  'Amelia', 'James', 'Harper', 'Oliver', 'Evelyn',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildEmail(first: string, last: string, index: number): string {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'dev.io', 'sprint.app'];
  return `${first.toLowerCase()}.${last.toLowerCase()}${index}@${randomItem(domains)}`;
}

// ─── Build User Records ───────────────────────────────────────────────────────
async function buildUsers(count: number) {
  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);

  return Array.from({ length: count }, (_, i) => {
    const first = firstNames[i % firstNames.length];
    const last  = randomItem(lastNames);
    const role  = i < 5 ? 'admin' : 'member'; // first 5 are admins
    return {
      name:         `${first} ${last}`,
      email:        buildEmail(first, last, i + 1),
      passwordHash: hashedPassword,
      role:         role as 'admin' | 'member',
      active:       true,
    };
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding users…');
  console.log(`   DB: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  console.log(`   Seed password taken from DB_PASSWORD in .env\n`);

  const records = await buildUsers(20);

  // Insert one by one so we skip duplicates gracefully
  let inserted = 0;
  let skipped  = 0;

  for (const record of records) {
    try {
      await db.insert(users).values(record);
      console.log(`   ✅  [${record.role.padEnd(6)}] ${record.name} <${record.email}>`);
      inserted++;
    } catch (err: any) {
      if (err?.code === '23505') {          // unique_violation
        console.log(`   ⚠️  Skipped (duplicate): ${record.email}`);
        skipped++;
      } else {
        throw err;
      }
    }
  }

  console.log(`\n✔  Done — ${inserted} inserted, ${skipped} skipped.`);
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  pool.end().finally(() => process.exit(1));
});
