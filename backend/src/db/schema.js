import { pgTable, text, serial, doublePrecision, integer, boolean, timestamp, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['owner', 'kasir'] }).notNull().default('kasir'),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Ingredients (Bahan Baku) ─────────────────────────────────────────────────
export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  unit: text('unit').notNull(), // kg, gram, pcs, ml, pack
  buyPricePerUnit: doublePrecision('buy_price_per_unit').notNull().default(0),
  currentStock: doublePrecision('current_stock').notNull().default(0),
  minimumStock: doublePrecision('minimum_stock').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Menu Items ───────────────────────────────────────────────────────────────
export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sellingPrice: doublePrecision('selling_price').notNull(),
  category: text('category').default('Minuman'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Recipes (Bill of Materials / BOM) ────────────────────────────────────────
export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  quantityNeeded: doublePrecision('quantity_needed').notNull(),
});

// ─── Sales ────────────────────────────────────────────────────────────────────
export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  totalAmount: doublePrecision('total_amount').notNull(),
  totalHpp: doublePrecision('total_hpp').notNull().default(0),
  paymentMethod: text('payment_method').notNull().default('cash'), // cash, qris, transfer
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Sale Items ───────────────────────────────────────────────────────────────
export const saleItems = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  unitPrice: doublePrecision('unit_price').notNull(),
  subtotal: doublePrecision('subtotal').notNull(),
  hppPerItem: doublePrecision('hpp_per_item').notNull().default(0),
});

// ─── Cash Transactions ───────────────────────────────────────────────────────
export const cashTransactions = pgTable('cash_transactions', {
  id: serial('id').primaryKey(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  category: text('category').notNull(),
  amount: doublePrecision('amount').notNull(),
  description: text('description'),
  paymentMethod: text('payment_method').default('cash'), // cash, qris, transfer
  relatedSaleId: integer('related_sale_id').references(() => sales.id),
  createdBy: integer('created_by').references(() => users.id),
  transactionDate: timestamp('transaction_date', { mode: 'string' }).notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});
