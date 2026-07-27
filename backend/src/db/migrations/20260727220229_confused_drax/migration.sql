CREATE TYPE "role" AS ENUM('admin', 'member', 'guest', 'banned');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"email" varchar(255) NOT NULL UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'member'::"role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"refresh_token" varchar(255) UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
