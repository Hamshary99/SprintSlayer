/**
 * Seed Script — Projects, Members & Tasks
 * Requires at least one admin user already in the DB (run seed.users.ts first).
 *
 * What this does:
 *  1. Fetches all admin users from the DB.
 *  2. Fetches a pool of regular member users from the DB.
 *  3. Creates 5 projects — each owned by a (cycling) admin.
 *  4. Adds 3–5 random member users to each project.
 *  5. Creates 4 tasks per project with varied statuses, priorities and assignees.
 *
 * Run with:
 *   npx tsx src/seeds/seed.projects.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { users }          from '../modules/users/schemas/user.schema.js';
import { project }        from '../modules/projects/schemas/project.schema.js';
import { projectMembers } from '../modules/projects/schemas/project.members.schema.js';
import { tasks }          from '../modules/tasks/schemas/task.schema.js';

// ─── DB Connection ────────────────────────────────────────────────────────────
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isProduction = process.env.NODE_ENV === 'production';

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: isProduction || connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host:     process.env.DB_HOST,
      port:     Number(process.env.DB_PORT) || 5432,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

const db = drizzle({ client: pool });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count  = min + Math.floor(Math.random() * (max - min + 1));
  const copy   = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, Math.min(count, copy.length));
}

function futureDate(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const PROJECT_TEMPLATES = [
  {
    title:       'SprintSlayer Core API',
    description: 'Backend REST API development for SprintSlayer project management platform.',
  },
  {
    title:       'Mobile Client — React Native',
    description: 'Cross-platform mobile app for iOS and Android using React Native.',
  },
  {
    title:       'Data Analytics Dashboard',
    description: 'Real-time analytics and reporting dashboard for sprint metrics.',
  },
  {
    title:       'Authentication & Security Hardening',
    description: 'Improve auth flows, implement 2FA, and perform security audits.',
  },
  {
    title:       'DevOps & CI/CD Pipeline',
    description: 'Set up automated testing, Docker deployments, and CI/CD with GitHub Actions.',
  },
];

const TASK_TEMPLATES = [
  { title: 'Set up project structure',          status: 'done'        as const, priority: 'high'   as const, dueDays: -5 },
  { title: 'Write unit tests for core modules', status: 'in_progress' as const, priority: 'high'   as const, dueDays: 3  },
  { title: 'Design database schema',            status: 'done'        as const, priority: 'medium' as const, dueDays: -10 },
  { title: 'Implement REST endpoints',          status: 'in_progress' as const, priority: 'high'   as const, dueDays: 7  },
  { title: 'Code review and refactoring',       status: 'to_do'       as const, priority: 'medium' as const, dueDays: 14 },
  { title: 'Update API documentation',          status: 'to_do'       as const, priority: 'low'    as const, dueDays: 21 },
  { title: 'Integrate third-party services',    status: 'to_do'       as const, priority: 'medium' as const, dueDays: 10 },
  { title: 'Performance benchmarking',          status: 'to_do'       as const, priority: 'low'    as const, dueDays: 28 },
  { title: 'Fix critical bug in auth flow',     status: 'in_progress' as const, priority: 'high'   as const, dueDays: 2  },
  { title: 'Deploy to staging environment',     status: 'to_do'       as const, priority: 'medium' as const, dueDays: 5  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding projects, members & tasks…');
  console.log(`   DB: ${process.env.DB_NAME}@${process.env.DB_HOST}\n`);

  // 1. Fetch admins
  const admins = await db.select().from(users).where(eq(users.role, 'admin'));
  if (admins.length === 0) {
    console.error('❌  No admin users found. Run seed.users.ts first.');
    await pool.end();
    process.exit(1);
  }
  console.log(`   Found ${admins.length} admin(s): ${admins.map(a => a.name).join(', ')}\n`);

  // 2. Fetch members (non-admin)
  const members = await db.select().from(users).where(eq(users.role, 'member'));
  console.log(`   Found ${members.length} member(s) to distribute across projects.\n`);

  // 3. Seed projects
  for (let i = 0; i < PROJECT_TEMPLATES.length; i++) {
    const template = PROJECT_TEMPLATES[i];
    const owner    = admins[i % admins.length];

    console.log(`📁  Creating project: "${template.title}" (owner: ${owner.name})`);

    // Insert project
    const newProjects = await db.insert(project).values({
      title:       template.title,
      description: template.description,
      ownerId:     owner.id,
    }).returning();

    const proj = newProjects[0];
    console.log(`    ↳ Project ID: ${proj.id}`);

    // Add owner as a member automatically
    await db.insert(projectMembers).values({ projectId: proj.id, userId: owner.id })
      .onConflictDoNothing();
    console.log(`    ✅ Owner added as member: ${owner.name}`);

    // 4. Add random subset of members (3–5) to this project
    if (members.length > 0) {
      const selectedMembers = randomSubset(members, 3, 5);
      for (const member of selectedMembers) {
        try {
          await db.insert(projectMembers).values({ projectId: proj.id, userId: member.id })
            .onConflictDoNothing();
          console.log(`    ✅ Member added: ${member.name}`);
        } catch {
          // silently skip duplicates
        }
      }
    }

    // 5. Create 4 tasks for this project
    const taskPool    = [...TASK_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 4);
    const allMembers  = [...admins, ...members];

    console.log(`    🗂  Adding ${taskPool.length} tasks…`);

    for (const tmpl of taskPool) {
      const assignee = randomItem(allMembers);
      const dueDate  = futureDate(tmpl.dueDays);

      const newTasks = await db.insert(tasks).values({
        title:      tmpl.title,
        status:     tmpl.status,
        priority:   tmpl.priority,
        dueDate,
        creatorId:  owner.id,
        assigneeId: assignee.id,
        projectId:  proj.id,
      }).returning();

      const task = newTasks[0];
      console.log(`       • [${tmpl.priority.padEnd(6)}][${tmpl.status.padEnd(11)}] "${task.title}" → assigned to ${assignee.name}`);
    }

    console.log();
  }

  console.log('✔  Done — projects, members and tasks seeded successfully!');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  pool.end().finally(() => process.exit(1));
});
