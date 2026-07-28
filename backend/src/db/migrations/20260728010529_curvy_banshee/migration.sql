CREATE TABLE "project_members" (
	"id" serial PRIMARY KEY,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_project_members_active" ON "project_members" ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_project_owner_id" ON "project" ("owner_id");--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;