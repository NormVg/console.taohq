import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'

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

export type Content    = typeof content.$inferSelect
export type NewContent = typeof content.$inferInsert

export type ApiKey    = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert
