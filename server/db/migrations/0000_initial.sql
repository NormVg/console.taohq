CREATE TABLE IF NOT EXISTS "content" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "type" text NOT NULL,
  "body" text DEFAULT '' NOT NULL,
  "published" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "content_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "prefix" text NOT NULL,
  "hash" text NOT NULL,
  "last_used_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "revoked" boolean DEFAULT false NOT NULL,
  CONSTRAINT "api_keys_hash_unique" UNIQUE("hash")
);
