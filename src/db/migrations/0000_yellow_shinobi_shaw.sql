CREATE TABLE IF NOT EXISTS "todos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(140) DEFAULT '',
	"description" text DEFAULT '',
	"completed" boolean DEFAULT false
);
