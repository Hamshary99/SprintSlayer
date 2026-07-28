CREATE TYPE "priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "status" AS ENUM('to_do', 'in_progress', 'done');--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"description" text,
	"status" "status" DEFAULT 'to_do'::"status" NOT NULL,
	"priority" "priority" DEFAULT 'medium'::"priority" NOT NULL,
	"due_date" timestamp,
	"creator_id" integer NOT NULL,
	"assignee_id" integer,
	"project_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creator_id_users_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_users_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;