import { pgTable, uuid, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core'

export const content = pgTable('content', {
  id:        uuid('id').primaryKey().defaultRandom(),
  slug:      text('slug').unique().notNull(),
  title:     text('title').notNull(),
  type:      text('type').notNull(),          // 'text' | 'markdown' | 'json'
  body:      text('body').notNull().default(''),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const apiKeys = pgTable('api_keys', {
  id:         uuid('id').primaryKey().defaultRandom(),
  name:       text('name').notNull(),
  prefix:     text('prefix').notNull(),       // first 12 chars, for display
  hash:       text('hash').notNull().unique(), // SHA-256 of full key
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revoked:    boolean('revoked').notNull().default(false),
})

export const cdnAssets = pgTable('cdn_assets', {
  id:          uuid('id').primaryKey().defaultRandom(),
  key:         text('key').notNull().unique(),
  fileName:    text('file_name').notNull(),
  mimeType:    text('mime_type').notNull(),
  size:        integer('size').notNull(),
  access:      text('access').notNull().default('public'), // 'public' | 'api_key'
  bucketKey:   text('bucket_key').notNull(),
  destination: text('destination').notNull().default('unknown'),
  cacheData:   text('cache_data').notNull(),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export type Content    = typeof content.$inferSelect
export type NewContent = typeof content.$inferInsert

export type ApiKey    = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert

export type CdnAsset    = typeof cdnAssets.$inferSelect
export type NewCdnAsset = typeof cdnAssets.$inferInsert
