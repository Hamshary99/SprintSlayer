# SprintSlayer

> A full-stack project & sprint management application.
> **Stack:** Node.js · Express 5 · TypeScript · PostgreSQL · Drizzle ORM · Socket.IO · React (Vite) · TailwindCSS

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Getting Started](#2-getting-started)
3. [Backend Architecture](#3-backend-architecture)
   - [Design Philosophy](#31-design-philosophy)
   - [Database Schema & Drizzle Models](#32-database-schema--drizzle-models)
   - [Security & Auth Flow](#33-security--auth-flow)
   - [Middleware Pipeline](#34-middleware-pipeline)
   - [Module Breakdown](#35-module-breakdown)
   - [Error Handling Strategy](#36-error-handling-strategy)
4. [API Reference](#4-api-reference)
   - [Auth Endpoints](#41-auth-endpoints)
   - [User Endpoints](#42-user-endpoints)
   - [Project Endpoints](#43-project-endpoints)
   - [Task Endpoints](#44-task-endpoints)
5. [Frontend Development Guide](#5-frontend-development-guide)
   - [Pages & Routes](#51-pages--routes)
   - [Auth State Management](#52-auth-state-management)
   - [API Integration Contract](#53-api-integration-contract)
   - [Real-Time (Socket.IO)](#54-real-time-socketio)
6. [Testing](#6-testing)
7. [Environment Variables](#7-environment-variables)

---

## 1. Project Structure

```
SprintSlayer/
├── backend/
│   └── src/
│       ├── server.ts               # Entry point — bootstraps DB check then starts Express
│       ├── app.ts                  # AppRoutes — wires middlewares, health check, error handler
│       ├── route.ts                # Root router — mounts /auth, /user, /project, /task
│       ├── config/
│       │   ├── env.config.ts       # Typed env loader with required() guard
│       │   └── db.config.ts        # Drizzle instance + pre-flight DB health check
│       ├── db/
│       │   ├── db.ts               # Pool-based Drizzle client (used by repositories)
│       │   └── migrations/         # Drizzle-Kit generated SQL migration snapshots
│       ├── common/
│       │   ├── error/
│       │   │   └── AppError.ts     # Operational error class (statusCode + isOperational)
│       │   ├── middlewares/
│       │   │   ├── requireAuth.ts  # JWT verification (header Bearer OR cookie fallback)
│       │   │   ├── requireRole.ts  # Role-based access guard factory
│       │   │   └── errorHandler.ts # Global 4-arg Express error handler
│       │   └── utils/
│       │       ├── jwt.util.ts     # Token generate/verify + HttpOnly cookie helpers
│       │       └── validator.ts    # class-validator DTO validation with whitelist
│       └── modules/
│           ├── auth/               # Login, register, refresh, logout
│           ├── users/              # CRUD, password update, soft-delete
│           ├── projects/           # Project CRUD + member management
│           └── tasks/              # Task CRUD, filtering, sorting
├── frontend/
│   └── src/
│       ├── pages/                  # Route-level page components
│       ├── components/             # Shared UI components
│       ├── features/               # Feature-scoped components/logic
│       ├── services/               # Axios API call wrappers (one per resource)
│       ├── hooks/                  # Custom React hooks
│       ├── context/                # React Context providers (AuthContext, etc.)
│       ├── routes/                 # React Router route definitions
│       ├── types/                  # TypeScript interfaces matching API shapes
│       └── utils/                  # Helpers (formatDate, formatStatus, etc.)
└── plans/
    └── BACKEND_BLUEPRINT.md        # Original architecture spec
```

---

## 2. Getting Started

### Prerequisites
- Node.js >= 20
- PostgreSQL (local or Docker)

### Backend

```bash
cd backend
npm install

# copy and fill in your env file (see §7 for all variables)
cp .env.example .env

# push schema to DB (dev shortcut — skips migration files)
npm run db:push

# start dev server with hot-reload
npm run dev
```

The server starts on `http://localhost:5000`.
Health check: `GET http://localhost:5000/health`

### Database Scripts

| Script | Command | Description |
|---|---|---|
| Generate migration | `npm run db:generate` | Creates a new SQL migration from schema changes |
| Apply migrations | `npm run db:migrate` | Runs all pending migrations |
| Push schema (no migration) | `npm run db:push` | Direct schema sync — dev only |
| Rollback | `npm run db:rollback` | Undoes the last migration |
| Studio | `npm run db:studio` | Opens Drizzle Studio GUI |

> **Note:** Run all `npm run db:*` commands from the `backend/` directory, not the project root.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 3. Backend Architecture

### 3.1 Design Philosophy

The backend follows a **layered, module-based architecture** — each domain (auth, users, projects, tasks) is a self-contained module with its own `route -> controller -> service -> repository` stack. This keeps concerns cleanly separated:

| Layer | Responsibility |
|---|---|
| **Route** | Declares HTTP verbs, paths, and which middlewares guard the endpoint |
| **Controller** | Parses `req`, calls the service, sends `res`. No business logic. |
| **Service** | All business rules: authorization checks, data transformation, orchestration |
| **Repository** | Pure DB access via Drizzle ORM. No logic beyond query construction. |
| **DTO** | `class-validator` decorated classes — the single source of truth for input shape |
| **Schema** | Drizzle `pgTable` definitions — the single source of truth for DB shape |

### 3.2 Database Schema & Drizzle Models

```
USERS --< PROJECT_MEMBERS >-- PROJECTS --< TASKS
  |                                           |
  +-------------- (creator) -----------------+
  +-------------- (assignee) ----------------+
```

#### `users` table

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | Auto-increment |
| `email` | `varchar(255)` | Unique, not null |
| `password_hash` | `varchar(255)` | bcrypt hash, never returned to client |
| `name` | `varchar(255)` | Not null |
| `role` | `pgEnum('role')` | `admin | member` — DB-enforced |
| `active` | `boolean` | Soft-delete flag, default `true` |
| `refresh_token` | `varchar(255)` | Current valid refresh token (single-session design) |
| `created_at` | `timestamp` | Auto-set |
| `updated_at` | `timestamp` | Auto-set |

> **Index:** `idx_users_active` on `active` — all `findAll` queries filter `active = true`.

#### `project` table

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `title` | `varchar(255)` | Not null |
| `description` | `varchar(1024)` | Optional |
| `owner_id` | `integer` FK -> `users.id` | Cascade delete |
| `created_at` / `updated_at` | `timestamp` | |

> **Index:** `idx_project_owner_id` on `owner_id`.

#### `project_members` table

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `project_id` | `integer` FK -> `project.id` | Cascade delete |
| `user_id` | `integer` FK -> `users.id` | Cascade delete |

> **Index:** `idx_project_members_active` on `(project_id, user_id)` — used by membership lookups.
> **Design note:** When a project is created, the owner is automatically inserted as a project member.

#### `tasks` table

| Column | Type | Notes |
|---|---|---|
| `id` | `integer` PK | |
| `title` | `text` | Not null |
| `description` | `text` | Optional |
| `status` | `pgEnum('status')` | `to_do | in_progress | done`, default `to_do` |
| `priority` | `pgEnum('priority')` | `high | medium | low`, default `medium` |
| `due_date` | `timestamp` | Optional |
| `creator_id` | `integer` FK -> `users.id` | Cascade delete |
| `assignee_id` | `integer` FK -> `users.id` | `SET NULL` on delete |
| `project_id` | `integer` FK -> `project.id` | Cascade delete |
| `created_at` / `updated_at` | `timestamp` | |

### 3.3 Security & Auth Flow

The app uses a **dual-token, single-session JWT strategy** with `HttpOnly` cookies.

```
Register / Login
   |
   +-> Hash password (bcrypt, 10 rounds)
   +-> Generate accessToken  (signed, 1h TTL)
   +-> Generate refreshToken (signed, 7d TTL)
   +-> Store refreshToken in DB (users.refresh_token)
   +-> Set access_token  -> HttpOnly cookie (SameSite: lax)
   +-> Set refresh_token -> HttpOnly cookie (SameSite: strict)
       Response body: { user: { id, email, name, role, ... } }  <- no tokens in body

Authenticated Request
   |
   +-> requireAuth middleware:
         1. Reads Authorization: Bearer <token> header
         2. Falls back to req.cookies.access_token
         3. Verifies signature with ACCESS_SECRET
         4. Attaches decoded payload -> req.user = { id, email, role }

Token Refresh (POST /api/auth/refresh)
   |
   +-> AuthService.refreshAccessToken():
         1. Verify refresh token signature
         2. Look up token in DB (ensures logout/revocation is respected)
         3. Strip exp/iat -> generate new access + refresh tokens
         4. Persist new refresh token to DB
         5. Set new cookies, return user data

Logout (POST /api/auth/logout)
   |
   +-> requireAuth -> set refreshToken = null in DB -> clearCookie both tokens
```

**Security decisions:**
- Tokens are **never** returned in the response body — only in cookies. `httpOnly` is set to `true` in `prod` / `staging`, but evaluates to `false` in `dev` mode so frontend developers can inspect cookies directly.
- `secure: true` is only set in `prod` / `staging` environments so local dev doesn't require HTTPS.
- On logout, the DB token is nulled so the old refresh token can never be replayed.
- `creatorId` for tasks is **always** injected server-side from `req.user.id` — the client cannot spoof it.

### 3.4 Middleware Pipeline

```
Request
  |
  +-- express.json()           <- body parsing
  +-- cookieParser()           <- cookie parsing
  |
  +-- [route handler]
  |     +-- requireAuth        <- verifies JWT, populates req.user
  |     +-- requireRole(...)   <- role whitelist check (factory, variadic)
  |
  +-- errorHandler             <- 4-arg global error handler (must be last)
       +-- AppError -> { status: "error", message: "..." }  (HTTP statusCode)
       +-- Unknown  -> { status: "error", message: "An internal server error occurred" } (500)
```

**`requireAuth`** reads the token from `Authorization: Bearer <token>` header first, then falls back to `req.cookies.access_token`. This means the frontend can use either approach — the backend supports both.

**`requireRole(...roles)`** is a factory that returns a middleware. Usage: `requireRole('admin')` or `requireRole('admin', 'member')`.

### 3.5 Module Breakdown

#### Auth Module (`/api/auth`)

- **`AuthController`** handles 4 endpoints. Methods are explicitly `.bind(this)` in the constructor so they can be passed directly as Express handlers without losing `this` context.
- **`AuthService`** is only responsible for the refresh flow. Register/Login logic lives in `UserService` because user creation/lookup is inherently a user concern.
- **Design note on refresh tokens:** The current design stores one refresh token per user (single-session). A comment in `jwt.util.ts` acknowledges this trade-off — a separate `refresh_tokens` table would support multi-device login. For this scope (single-user app), the simpler approach is intentional.

#### Users Module (`/api/user`)

- `UserService` strips `passwordHash` and `refreshToken` from **every** returned object using destructuring before sending to the client.
- Soft-delete: `deleteUser` sets `active = false` — the row is never deleted. All `findAll` queries filter by `active = true`.
- `updateUser` in the controller enforces a self-or-admin rule: a user can only update themselves unless they're an admin.
- Passwords are updated via a separate `updatePassword` service method that re-hashes before persisting.

#### Projects Module (`/api/project`)

`ProjectService` uses three private helper methods to keep authorization logic DRY:

| Helper | Purpose |
|---|---|
| `checkAdminAndOwnership(userId, projectId?)` | Verifies user is `admin`. If `projectId` given, also verifies they own that project. |
| `isAdmin(userId)` | Boolean check — admins bypass all membership gates. |
| `checkMembership(userId, projectId)` | Verifies user is in `project_members` for that project. Admins bypass. |

**Auto-membership on create:** When an admin creates a project, they are automatically inserted into `project_members` as a member (so they pass membership checks on subsequent reads).

**Repository pattern:** The `ProjectRepository` uses Drizzle's `innerJoin` for the member and project-by-member queries, returning only the needed columns (no `SELECT *` on joins).

#### Tasks Module (`/api/task`)

- Route-level: `requireRole('admin')` blocks all mutating routes (create, update, delete) before the controller is even reached.
- Service-level: `checkProjectOwnership` re-verifies the admin is specifically the *owner* of the project the task belongs to — a project-scoped authorization check on top of the global role check.
- Read routes are open to any authenticated user. The service uses the `isAdmin` flag (derived from `req.user.role`) to skip or enforce the membership check accordingly.
- The `TaskRepository` exposes a type-safe `TaskSortField` union and `getOrderClause` helper that maps field names to Drizzle column references — avoids raw SQL strings in sort logic.

### 3.6 Error Handling Strategy

All operational errors are thrown as `AppError` instances:

```typescript
throw new AppError("User not found", 404);
throw new AppError("Invalid credentials", 401);
throw new AppError("Access denied", 403);
```

The global `errorHandler` middleware distinguishes `AppError` (operational — return the actual message) from unknown errors (programmer errors — log and return a generic 500). Controllers always delegate errors to `next(error)` — they never catch-and-swallow.

**Anti-enumeration:** The login flow returns `"Invalid credentials"` for both "user not found" and "wrong password" — preventing email enumeration attacks.

**DTO validation:** The `validateBody()` utility uses `class-validator` with `{ whitelist: true }` — any property not decorated on the DTO class is silently stripped. This prevents clients from injecting unexpected fields.

---

## 4. API Reference

> Base URL: `http://localhost:5000/api`
> Interactive Swagger UI: `http://localhost:5000/api-docs`
> All protected routes require either `Authorization: Bearer <accessToken>` header **or** the `access_token` cookie.
> All request/response bodies are JSON (`Content-Type: application/json`).

### 4.1 Auth Endpoints

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/auth/register` | — | `{ email, passwordHash, name, role? }` | `201 { user }` |
| `POST` | `/auth/login` | — | `{ email, passwordHash }` | `200 { user }` |
| `POST` | `/auth/refresh` | — (cookie) | — | `200 { user }` |
| `POST` | `/auth/logout` | required | — | `200 { message }` |
| `POST` | `/auth/forgot-password` | — | `{ email }` | `200 { message }` |
| `POST` | `/auth/reset-password` | — | `{ token, newPassword }` | `200 { message }` |
| `GET`  | `/auth/reset-password` | — | — (Query: `?token=...`) | `200 HTML Form` (Dev Form) |

**Register body:**
```json
{
  "email": "john@example.com",
  "passwordHash": "Password1",
  "name": "John Doe",
  "role": "member"
}
```

**Login body:**
```json
{
  "email": "john@example.com",
  "passwordHash": "Password1"
}
```

**Forgot password body:**
```json
{
  "email": "john@example.com"
}
```

**Reset password body:**
```json
{
  "token": "raw-reset-token-from-email",
  "newPassword": "newSecretPassword123"
}
```

> The field is named `passwordHash` in DTOs because it maps to the schema column name. Send the plain-text password from the client — the server hashes it.

**Success response (register/login/refresh):**
```json
{
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "member",
    "active": true,
    "createdAt": "2026-07-28T...",
    "updatedAt": "2026-07-28T..."
  }
}
```
Tokens are set as HttpOnly cookies automatically — no token field in the body.

**Error response shape (all endpoints):**
```json
{
  "status": "error",
  "message": "Descriptive error message"
}
```

### 4.2 User Endpoints

| Method | Path | Auth | Role | Notes |
|---|---|---|---|---|
| `GET` | `/user` | required | any | Query: `?page=1&limit=10&role=admin` |
| `GET` | `/user/:id` | required | any | |
| `PATCH` | `/user/:id` | required | self or admin | Updates name, email, or role |
| `DELETE` | `/user/:id` | required | self or admin | Soft-delete (sets `active=false`) |

**GET /user query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Pagination page |
| `limit` | number | 10 | Results per page |
| `role` | string | — | Filter by role (`admin`/`member`) |

**PATCH /user/:id body** (all fields optional):
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "admin"
}
```

### 4.3 Project Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/project` | admin | Creates project. Owner auto-added as member. |
| `PUT` | `/project/:id` | admin owner | Updates title/description |
| `DELETE` | `/project/:id` | admin owner | Hard deletes project (cascade) |
| `POST` | `/project/:projectId/members` | admin owner | Adds a user to project_members |
| `DELETE` | `/project/:projectId/members` | admin owner | Removes a user from project_members |
| `GET` | `/project/my-projects` | any | Admin: all projects. Member: their projects. Paginated. |
| `GET` | `/project/:id` | member | Returns project if requester is a member |
| `GET` | `/project/members/:projectId` | member | Lists project members. Paginated. |

**POST /project body:**
```json
{
  "title": "Q3 Sprint",
  "description": "Optional description"
}
```
> `ownerId` is injected server-side from `req.user.id` — do not send from client.

**POST /project/:projectId/members body:**
```json
{
  "userId": 5
}
```

**GET /project/my-projects query params:**

| Param | Default | Description |
|---|---|---|
| `page` | 1 | |
| `limit` | 10 | Max 100 |

### 4.4 Task Endpoints

| Method | Path | Auth | Role | Notes |
|---|---|---|---|---|
| `POST` | `/task` | required | admin | Creates task. `creatorId` set server-side. |
| `PATCH` | `/task/:id` | required | admin | Updates any task field |
| `DELETE` | `/task/:id` | required | admin | Hard deletes task |
| `GET` | `/task/:id` | required | any | Admin: bypass. Member: must be in project. |
| `GET` | `/task/project/:projectId` | required | any | Paginated + sortable. Member: must be in project. |
| `GET` | `/task/assignee/:assigneeId` | required | any | Member: can only query own assigneeId. |

**POST /task body:**
```json
{
  "title": "Fix login bug",
  "description": "Optional",
  "status": "to_do",
  "priority": "high",
  "dueDate": "2026-08-01T00:00:00.000Z",
  "assigneeId": 3,
  "projectId": 1
}
```

> `status` defaults to `"to_do"`, `priority` defaults to `"medium"` — these fields are optional on create.

**GET /task/project/:projectId query params:**

| Param | Type | Default | Options |
|---|---|---|---|
| `page` | number | 1 | |
| `limit` | number | 10 | Max 100 |
| `sortBy` | string | `createdAt` | `id`, `createdAt`, `updatedAt`, `priority`, `status`, `dueDate` |
| `sortOrder` | string | `desc` | `asc`, `desc` |

---

## 5. Frontend Development Guide

> The frontend is a **React + Vite + TypeScript + TailwindCSS** app. The structure follows a feature-first organization inside `frontend/src/`.

### 5.1 Pages & Routes

| Route | Page Component | Auth Required | Notes |
|---|---|---|---|
| `/` | `LandingPage` | — | Marketing/splash page |
| `/login` | `LoginPage` | — | Redirect to `/dashboard` if already authed |
| `/register` | `RegisterPage` | — | |
| `/dashboard` | `DashboardPage` | required | My projects list |
| `/projects/:id` | `ProjectPage` | required member | Project detail + tasks |
| `/projects/:id/tasks` | `TaskListPage` | required member | Full task board |
| `/tasks/:id` | `TaskDetailPage` | required member | Single task view/edit |
| `/profile` | `ProfilePage` | required | View/edit own profile |
| `/admin/users` | `AdminUsersPage` | required admin | User management (admin only) |

### 5.2 Auth State Management

Tokens are stored in **HttpOnly cookies** — JavaScript has no access to them. The frontend manages auth state via a **React Context** (`AuthContext`) that holds:

```typescript
interface AuthState {
  user: User | null;      // populated after login/register/refresh
  isLoading: boolean;     // true during initial session restore
  isAuthenticated: boolean;
}
```

**Session restore on app load:**
On mount, call `POST /api/auth/refresh` — if the `refresh_token` cookie is valid, it returns the user and rotates the tokens. If it fails (no session / expired), the user is treated as unauthenticated.

**Auth flow for API calls:**
The Axios instance should send cookies automatically (`withCredentials: true`). If a request returns `401`, attempt one refresh and retry. If the refresh also fails, redirect to `/login` and clear local auth state.

```typescript
// Recommended Axios instance setup
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,  // CRITICAL — sends cookies cross-origin
});
```

> **CORS Note:** The backend will need `cors()` middleware configured with `credentials: true` and the frontend origin whitelisted. Check the backend `app.ts` if you run into cookie issues.

### 5.3 API Integration Contract

#### TypeScript Types (match backend response shapes)

```typescript
// User — safe shape (no passwordHash/refreshToken)
interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Project
interface Project {
  id: number;
  title: string;
  description?: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

// Project Member (returned by GET /project/members/:projectId)
interface ProjectMember {
  userId: number;
  email: string;
  role: 'admin' | 'member';
  membershipId: number;
}

// Task
interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'to_do' | 'in_progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  creatorId: number;
  assigneeId?: number;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

// API error response
interface ApiError {
  status: 'error';
  message: string;
}
```

#### Service Layer Pattern

Each resource should have its own service file in `frontend/src/services/`:

```typescript
// services/auth.service.ts
export const authService = {
  register: (data: RegisterPayload) => api.post('/auth/register', data),
  login: (data: LoginPayload) => api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
};

// services/project.service.ts
export const projectService = {
  getMyProjects: (page = 1, limit = 10) =>
    api.get('/project/my-projects', { params: { page, limit } }),
  getById: (id: number) => api.get(`/project/${id}`),
  create: (data: { title: string; description?: string }) =>
    api.post('/project', data),
  addMember: (data: { projectId: number; userId: number }) =>
    api.post('/project/add-member', data),
  removeMember: (data: { projectId: number; userId: number }) =>
    api.delete('/project/remove-member', { data }),
  getMembers: (projectId: number, page = 1, limit = 10) =>
    api.get(`/project/members/${projectId}`, { params: { page, limit } }),
};

// services/task.service.ts
export const taskService = {
  create: (data: CreateTaskPayload) => api.post('/task', data),
  update: (id: number, data: UpdateTaskPayload) => api.patch(`/task/${id}`, data),
  delete: (id: number) => api.delete(`/task/${id}`),
  getById: (id: number) => api.get(`/task/${id}`),
  getByProject: (projectId: number, params: TaskQueryParams) =>
    api.get(`/task/project/${projectId}`, { params }),
  getByAssignee: (assigneeId: number, params: TaskQueryParams) =>
    api.get(`/task/assignee/${assigneeId}`, { params }),
};
```

#### Field Naming: `passwordHash`

When sending login/register requests, the field the backend DTO expects is named `passwordHash`:

```typescript
// Login payload
{ email: "user@example.com", passwordHash: "MyPassword1" }

// Register payload
{ email: "user@example.com", passwordHash: "MyPassword1", name: "John" }
```

This is a known quirk — the DTO field is named after the DB column but receives the plain-text password. The backend hashes it server-side.

### 5.4 Real-Time (Socket.IO)

> The backend has a `sockets/` directory with a `socketManager.ts` and empty `handlers/` — real-time events are planned but not yet implemented. The frontend should be built to connect but gracefully handle no events.

**Planned events (to be wired up):**

| Event (server -> client) | Payload | Description |
|---|---|---|
| `task:created` | `Task` | New task created in a project |
| `task:updated` | `Task` | Task fields changed |
| `task:deleted` | `{ id: number }` | Task removed |
| `project:member-added` | `ProjectMember` | New member joined |

**Frontend socket setup:**

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  withCredentials: true,  // send auth cookies
  autoConnect: false,     // connect only after user is authenticated
});

// Connect after login
socket.connect();

// Listen for task updates
socket.on('task:updated', (task: Task) => {
  // update local state / invalidate query cache
});
```

---

## 6. Testing

Tests live in `backend/src/tests/` organized by module.

```bash
# Run all tests
npm run test

# Run specific suites
npm run test:auth     # auth controller + service tests
npm run test:user     # user service tests
npm run test:project  # project tests
```

Tests use **Jest + SWC** (via `@swc/jest`) for fast TypeScript transpilation. Repositories are mocked at the service layer so tests are unit-pure — no real DB connection needed.

**Current test coverage:**
- `tests/auth/auth.controller.test.ts` — controller-level auth flow tests
- `tests/auth/auth.service.test.ts` — refresh token logic, revocation
- `tests/users/user.service.test.ts` — full user service coverage (create, login, update, soft-delete)

---

## 7. Environment Variables

Create a `.env` file in `backend/`:

```env
# Server
PORT=5000
NODE_ENV=dev

# Database (required — server won't start without these)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=sprintslayer

# JWT (required)
ACCESS_SECRET=your_access_secret_min_32_chars
REFRESH_SECRET=your_refresh_secret_min_32_chars

# Token TTL (optional — defaults shown)
ACCESS_EXPIRE=1h
REFRESH_EXPIRE=7d

# Cookie max-age in milliseconds (optional — defaults shown)
ACCESS_COOKIES_EXPIRE=3600000
REFRESH_COOKIES_EXPIRE=604800000

# Email via Resend & Frontend URL (optional in dev — logs to console if empty)
RESEND_API_KEY=re_123456789
EMAIL_FROM=SprintSlayer <onboarding@resend.dev>
FRONTEND_URL=http://localhost:5173
```

> The `env.config.ts` module throws at startup if any `required()` variable is missing — the server will not start in a misconfigured environment. This is intentional: fail fast, fail loudly.
