# ⚡ SprintSlayer — Enterprise Task & Project Management System

> **Technical Recruitment Assessment Submission — Full Stack Node.js Developer (2-Day Challenge)**  
> **Stack:** Node.js (Express 5) · TypeScript · PostgreSQL · Drizzle ORM · Socket.IO · React (Vite) · TailwindCSS · Swagger · Docker · Railway

[![Railway Deployed](https://img.shields.io/badge/Railway-Deployed-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://sprintslayer-production.up.railway.app/health)
[![OpenAPI/Swagger](https://img.shields.io/badge/Swagger-Interactive_Docs-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://sprintslayer-production.up.railway.app/api-docs)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://orm.drizzle.team/)
[![Docker Ready](https://img.shields.io/badge/Docker-Compose_Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#-docker-compose-setup-bonus-feature)

---

## 🌐 Live Production Deployment & Quick Links

| Service | Live URL / Location | Description |
| :--- | :--- | :--- |
| 🚀 **Live API Base URL** | [`https://sprintslayer-production.up.railway.app/api`](https://sprintslayer-production.up.railway.app/api) | Public production deployment hosted on Railway |
| 📖 **Interactive Swagger UI** | [`https://sprintslayer-production.up.railway.app/api-docs`](https://sprintslayer-production.up.railway.app/api-docs) | Live OpenAPI 3.0 interactive endpoint testing UI |
| 🟢 **Health Check Endpoint** | [`https://sprintslayer-production.up.railway.app/health`](https://sprintslayer-production.up.railway.app/health) | API + Database pre-flight connectivity status |
| 📦 **Postman Collection** | [`backend/Postman/SprintSlayer.postman_collection.json`](file:///c:/Users/amido/OneDrive/Desktop/lecs/Projects/SprintSlayer/backend/Postman/SprintSlayer.postman_collection.json) | Ready-to-import Postman collection with all routes & environments |

---

## 🔑 Test Credentials (Pre-seeded Demo Accounts)

The production database on Railway and local seed scripts are pre-loaded with **20 users** (5 Admins + 15 Members), 5 Projects, and multiple Tasks.

> [!NOTE]
> All pre-seeded accounts share the default password: **`Password123!`** (or configured via `SEED_PASSWORD` in environment variables).

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | `liam.smith1@gmail.com` | `Password123!` | Full admin rights: Create projects, assign members, create/edit/delete tasks across projects |
| 👤 **Member** | `sophia.brown6@gmail.com` | `Password123!` | Standard user: Access assigned projects/tasks, update status, view project boards |


---

## 📋 Requirement Compliance & Technical Flex Matrix

This project strictly satisfies **100% of core requirements** and completes **all optional bonus features** specified in the assessment.

| Category | Requirement | Status | Implementation Details & Highlights |
| :--- | :--- | :---: | :--- |
| **Authentication & Security** | User Register & Login | ✅ | JWT-based auth, dual-token system (Access + Refresh tokens), password hashing with `bcrypt` (10 rounds). |
| | Protected Routes & RBAC | ✅ | Granular `requireAuth` and `requireRole('admin', 'member')` middleware guards on all private endpoints. |
| | Dual Token Security | ✅ | Tokens delivered via secure `HttpOnly`, `SameSite` cookies with fallback support for `Authorization: Bearer` headers. Single-session refresh token revocation on logout. |
| | Password Reset | ✅ | Self-service email reset flow integrated with Resend API and token verification. |
| **Projects Module** | Project CRUD | ✅ | Admins can create/edit/delete projects. Creators auto-assigned as project owners and members. |
| | Member Management | ✅ | Owner admins can add or remove team members (`/project/:projectId/members`). |
| | Access Scoping | ✅ | Members can only view/access projects they are explicitly added to. Admins retain global access. |
| **Tasks Module** | Task CRUD & Attributes | ✅ | Complete task lifecycle. Attributes: `title`, `description`, `status` (`to_do`, `in_progress`, `done`), `priority` (`low`, `medium`, `high`), `dueDate`, `creatorId`, `assigneeId`, `projectId`. |
| | Authorization Guards | ✅ | Only admins owning the project can create/edit/delete tasks inside that project. Server side overrides `creatorId` from `req.user.id`. |
| | Filtering, Search & Sorting | ✅ | Filter by `status`, `priority`, `assignee`. Case-insensitive keyword search on title/desc. Dynamic multi-column sorting (`sortBy`, `sortOrder`). |
| **Frontend & UX** | Framework & Styling | ✅ | React + Vite + TypeScript + TailwindCSS. |
| | Views & Interfaces | ✅ | Login/Register pages, Dashboard, Interactive Kanban Task Board, Project Detail pages, User Profile, Admin User Management. |
| | UX & State Handling | ✅ | Robust client-side validation, clean loading states, error alerts, empty states, and responsive layout for mobile and desktop. |
| **Engineering Standards** | Architecture | ✅ | Layered modular architecture (`route -> controller -> service -> repository -> schema`). Strict single-responsibility principle. |
| | Request Validation | ✅ | `class-validator` DTOs with `{ whitelist: true }` parameter stripping to block body parameter injection attacks. |
| | Centralized Errors | ✅ | Custom `AppError` class with operational HTTP status codes and global error handling middleware. |
| | Strict Environment | ✅ | Fail-fast typed environment configuration (`env.config.ts`) with `required()` assertions. |
| | Automated Tests | ✅ | **135+ tests across 10 test suites** covering auth, users, projects, and tasks using Jest + SWC. |
| **Bonus Features** | Docker Compose | ✅ | Full `docker-compose.yml` setup orchestrating PostgreSQL and Node.js API container. |
| | API Documentation | ✅ | Live Swagger UI (`/api-docs`) + OpenAPI 3.0 specification + Postman Collection file. |
| | Real-Time Sockets | ✅ | Socket.IO connection manager & real-time event pipeline architecture (`task:created`, `task:updated`, `task:deleted`). |
| | Pagination & Search | ✅ | Standardized pagination (`page`, `limit`) across Users, Projects, Project Members, and Tasks. |
| | Live Deployment | ✅ | Public deployment live on Railway with `trust proxy` configured for HTTPS cookie security. |

---

## 🏗️ System Architecture & Backend Design

### Layered Module Structure
SprintSlayer uses a **domain-driven, layered modular architecture** where each feature domain (`auth`, `users`, `projects`, `tasks`) is completely self-contained.

```
[ Client / Frontend / Postman ]
               │
               ▼
[ Middleware Pipeline: CORS ➔ BodyParser ➔ CookieParser ➔ requireAuth ➔ requireRole ]
               │
               ▼
   [ Controller Layer ]  ── Parsing HTTP requests, route binding, returning HTTP status codes
               │
               ▼
     [ Service Layer ]   ── Business logic, authorization rules, ownership checks, data mapping
               │
               ▼
  [ Repository Layer ]  ── Pure Drizzle ORM database queries (no business logic)
               │
               ▼
   [ PostgreSQL Database ]
```

### Database Schema (Drizzle ORM)

```
╔═══════════════╗        ╔═════════════════════╗        ╔═══════════════════╗
║     USERS     ║1      *║   PROJECT_MEMBERS   ║*      1║     PROJECTS      ║
╠───────────────╣────────╠─────────────────────╣────────╠───────────────────╣
║ id (PK)       ║        ║ id (PK)             ║        ║ id (PK)           ║
║ email (UQ)    ║        ║ project_id (FK)     ║        ║ title             ║
║ password_hash ║        ║ user_id (FK)        ║        ║ description       ║
║ name          ║        ╚═════════════════════╝        ║ owner_id (FK)     ║
║ role (Enum)   ║                                       ╚═══════════════════╝
║ active (Bool) ║                                                 │ 1
║ refresh_token ║                                                 │
║ created_at    ║                                                 │ *
╚═══════════════╝                                       ╔═══════════════════╗
   │ 1 (creator)                                        ║       TASKS       ║
   ├───────────────────────────────────────────────────>║───────────────────║
   │ 1 (assignee)                                       ║ id (PK)           ║
   └───────────────────────────────────────────────────>║ title, description║
                                                        ║ status (Enum)     ║
                                                        ║ priority (Enum)   ║
                                                        ║ due_date          ║
                                                        ║ creator_id (FK)   ║
                                                        ║ assignee_id (FK)  ║
                                                        ║ project_id (FK)   ║
                                                        ╚═══════════════════╝
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- **Node.js**: `>= 20.x`
- **PostgreSQL**: Local instance OR Docker container
- **npm**: `>= 10.x`

---

### Option A: Local Development Setup

#### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Hamshary99/SprintSlayer.git
cd SprintSlayer

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=dev

# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=sprintslayer

# Authentication Secrets (minimum 32 characters)
ACCESS_SECRET=your_super_secret_access_key_min_32_chars
REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars

# Optional Seed Password & Mailer
SEED_PASSWORD=Password123!
RESEND_API_KEY=re_your_resend_api_key
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

#### 3. Database Migration & Seeding

```bash
cd backend

# Push Drizzle schema directly to PostgreSQL
npm run db:push

# Seed Database with 20 Users, 5 Projects, and 20 Tasks
npm run seed:users
npm run seed:projects
```

#### 4. Run Servers

```bash
# Start Backend API (runs on http://localhost:5000)
cd backend
npm run dev

# In a new terminal tab, start Frontend Vite Dev Server (http://localhost:5173)
cd frontend
npm run dev
```

---

### Option B: Docker Compose Setup (Bonus Feature)

Spin up **PostgreSQL**, **Backend API**, and **Frontend Client** all together with a single command:

```bash
# From the project root directory:
docker compose up --build
```

- **Database (PostgreSQL)**: Health-checked container listening on `localhost:5432`
- **Backend API (Express 5 + TypeScript)**: Accessible on [`http://localhost:5000`](http://localhost:5000) (Swagger UI: [`http://localhost:5000/api-docs`](http://localhost:5000/api-docs))
- **Frontend App (React + Nginx)**: Accessible on [`http://localhost:3000`](http://localhost:3000)


---

## 🧪 Testing Suite

SprintSlayer features comprehensive unit and integration test coverage powered by **Jest** and `@swc/jest` for high-speed execution. Repositories are mocked at the service layer to enable isolated unit testing.

```bash
cd backend

# Run the complete test suite
npm run test

# Run specific module test suites
npm run test:auth     # Auth service, controller, and route tests
npm run test:user     # User CRUD and soft-delete tests
npm run test:project  # Project membership and authorization tests
npm run test:task     # Task management and project ownership tests
```

### Test Coverage Summary:
- **10 Test Suites**
- **135+ Test Cases**
- **100% Pass Rate**

---

## 🔌 API Reference Overview

Base API Endpoint: `http://localhost:5000/api` (Local) or `https://sprintslayer-production.up.railway.app/api` (Production)  
Full interactive documentation is accessible live at [/api-docs](https://sprintslayer-production.up.railway.app/api-docs).

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Auth | Body / Query | Description |
|---|---|---|---|---|
| `POST` | `/auth/register` | Public | `{ email, passwordHash, name, role? }` | Register new user account (`admin` or `member`) |
| `POST` | `/auth/login` | Public | `{ email, passwordHash }` | Authenticate user, set HttpOnly cookies |
| `POST` | `/auth/refresh` | Cookie | — | Refresh access token & rotate refresh cookie |
| `POST` | `/auth/logout` | Required | — | Invalidate refresh token in DB & clear cookies |
| `POST` | `/auth/forgot-password` | Public | `{ email }` | Initiate password reset email request |
| `POST` | `/auth/reset-password` | Public | `{ token, newPassword }` | Complete password reset using token |

### User Management Endpoints (`/api/user`)

| Method | Endpoint | Auth | Required Role | Description |
|---|---|---|---|---|
| `GET` | `/user` | Required | Any | List users (supports `page`, `limit`, `role`, `search`, `sortBy`) |
| `GET` | `/user/:id` | Required | Any | Get user details by ID |
| `PATCH` | `/user/:id` | Required | Self / Admin | Update user name, email, or role |
| `DELETE` | `/user/:id` | Required | Self / Admin | Soft-delete user (`active = false`) |

### Project Management Endpoints (`/api/project`)

| Method | Endpoint | Auth | Required Role | Description |
|---|---|---|---|---|
| `POST` | `/project` | Required | Admin | Create a new project (Owner auto-added as member) |
| `GET` | `/project/my-projects` | Required | Any | List accessible projects (Admin: all, Member: assigned) |
| `GET` | `/project/:id` | Required | Member / Admin | Get project details by ID |
| `PUT` | `/project/:id` | Required | Project Owner | Update project title & description |
| `DELETE` | `/project/:id` | Required | Project Owner | Hard-delete project and cascading resources |
| `POST` | `/project/:projectId/members` | Required | Project Owner | Add member user to project |
| `DELETE` | `/project/:projectId/members` | Required | Project Owner | Remove member user from project |
| `GET` | `/project/members/:projectId` | Required | Member / Admin | List members of a project (Paginated) |

### Task Management Endpoints (`/api/task`)

| Method | Endpoint | Auth | Required Role | Description |
|---|---|---|---|---|
| `POST` | `/task` | Required | Admin | Create task in project (`title`, `status`, `priority`, `assigneeId`, etc.) |
| `GET` | `/task/project/:projectId` | Required | Member / Admin | List project tasks with filters (`status`, `priority`, `search`, `sortBy`) |
| `GET` | `/task/assignee/:assigneeId` | Required | Member / Admin | List tasks assigned to specific user |
| `GET` | `/task/:id` | Required | Member / Admin | Get single task details |
| `PATCH` | `/task/:id` | Required | Project Owner | Update task details or status |
| `DELETE` | `/task/:id` | Required | Project Owner | Delete task |

---

## 🛠️ Project Directory Structure

```
SprintSlayer/
├── backend/
│   ├── Postman/
│   │   └── SprintSlayer.postman_collection.json  # Postman API Collection
│   ├── src/
│   │   ├── server.ts                             # Express server entrypoint
│   │   ├── app.ts                                # Middleware pipeline & Swagger setup
│   │   ├── route.ts                              # Main REST router
│   │   ├── config/
│   │   │   ├── env.config.ts                     # Strict typed environment loader
│   │   │   ├── db.config.ts                      # PostgreSQL + Drizzle ORM setup
│   │   │   └── swagger.config.ts                 # OpenAPI 3.0 configuration
│   │   ├── common/
│   │   │   ├── error/AppError.ts                 # Operational error handler
│   │   │   ├── middlewares/                      # Auth, Role, and Error middlewares
│   │   │   └── utils/                            # JWT helpers, validator wrappers
│   │   ├── db/                                   # Drizzle schema migrations
│   │   ├── modules/
│   │   │   ├── auth/                             # Auth routes, controllers, services, DTOs
│   │   │   ├── users/                            # User domain logic & schemas
│   │   │   ├── projects/                         # Project & member management domain
│   │   │   └── tasks/                            # Task management, search & filters domain
│   │   ├── seeds/
│   │   │   ├── seed.users.ts                     # User database seeder
│   │   │   └── seed.projects.ts                  # Project & Task database seeder
│   │   ├── sockets/                              # Socket.IO real-time manager
│   │   └── tests/                                # 10 Test suites (Unit & Integration)
│   ├── Dockerfile                                # Production Docker container config
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/                           # Shared UI components & layouts
│   │   ├── context/                              # AuthContext provider
│   │   ├── pages/                                # Page views (Dashboard, Board, Profile, etc.)
│   │   ├── services/                             # Axios API clients
│   │   └── types/                                # TypeScript interface definitions
│   └── package.json
├── docker-compose.yml                            # Orchestrated Postgres + API setup
└── README.md                                     # Project Documentation
```

---

## 👤 Author & Submission Notes

- **Developer**: Full Stack Developer Candidate
- **Repository**: [https://github.com/Hamshary99/SprintSlayer](https://github.com/Hamshary99/SprintSlayer)
- **Deployment Platform**: Railway (`trust proxy` enabled for HTTPS cookie transmission)
- **Submission Date**: July 2026

*Built with passion, clean code principles, and enterprise-grade architecture.*
