CREATE TABLE "project" (
	"id" serial PRIMARY KEY,
	"title" varchar(255) NOT NULL,
	"description" varchar(1024),
	"owner_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_users_active" ON "users" ("active");--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE;