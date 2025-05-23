import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  uuid,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  subscriptionType: varchar('subscriptionType', { enum: ['free', 'paid'] })
    .notNull()
    .default('free'),
});

export type User = InferSelectModel<typeof user>;
