CREATE TABLE IF NOT EXISTS "cdn_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL,
  "file_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size" integer NOT NULL,
  "access" text DEFAULT 'public' NOT NULL,
  "bucket_key" text NOT NULL,
  "destination" text DEFAULT 'unknown' NOT NULL,
  "cache_data" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "cdn_assets_key_unique" UNIQUE("key")
);
