CREATE TABLE IF NOT EXISTS "todos" (
	"id" uuid,
	"title" varchar(140) DEFAULT '',
	"description" text DEFAULT '',
	"completed" boolean DEFAULT false
);
