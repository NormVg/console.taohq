ALTER TABLE "cdn_assets"
ADD COLUMN IF NOT EXISTS "cache_data" text NOT NULL DEFAULT '';
