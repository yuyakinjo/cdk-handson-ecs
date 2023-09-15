import { boolean, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';

export const todos = pgTable('todos', {
  id: uuid('id'),
  title: varchar('title', { length: 140 }).default(''),
  description: text('description').default(''),
  completed: boolean('completed').default(false),
});
