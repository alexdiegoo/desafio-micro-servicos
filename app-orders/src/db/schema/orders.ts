import { pgTable, text, integer, pgEnum, timestamp } from 'drizzle-orm/pg-core'
import { customers } from './customers.ts'

export const orderStatusEnmu = pgEnum('order_status', [
  'pending',
  'paid',
  'canceled'
])

export const orders = pgTable('orders', {
  id: text().primaryKey(),
  customerId: text().notNull().references(() => customers.id),
  amount: integer().notNull(),
  status: orderStatusEnmu().notNull().default('pending'),
  createdAt: timestamp().defaultNow().notNull()
}) 