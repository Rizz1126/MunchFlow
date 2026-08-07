import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['owner', 'kasir'] }).notNull().default('kasir'),
  displayName: text('display_name').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now', 'localtime'))`),
});

// ─── Ingredients (Bahan Baku) ─────────────────────────────────────────────────
export const ingredients = sqliteTable('ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  unit: text('unit').notNull(), // kg, gram, pcs, ml, pack
  buyPricePerUnit: real('buy_price_per_unit').notNull().default(0),
  currentStock: real('current_stock').notNull().default(0),
  minimumStock: real('minimum_stock').notNull().default(0),
  createdAt: text('created_at').default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now', 'localtime'))`),
});

// ─── Menu Items ───────────────────────────────────────────────────────────────
export const menuItems = sqliteTable('menu_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sellingPrice: real('selling_price').notNull(),
  category: text('category').default('Minuman'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`(datetime('now', 'localtime'))`),
});

// ─── Recipes (Bill of Materials / BOM) ────────────────────────────────────────
export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  quantityNeeded: real('quantity_needed').notNull(),
});

// ─── Sales ────────────────────────────────────────────────────────────────────
export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  totalAmount: real('total_amount').notNull(),
  totalHpp: real('total_hpp').notNull().default(0),
  paymentMethod: text('payment_method').notNull().default('cash'), // cash, qris, transfer
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`(datetime('now', 'localtime'))`),
});

// ─── Sale Items ───────────────────────────────────────────────────────────────
export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  subtotal: real('subtotal').notNull(),
  hppPerItem: real('hpp_per_item').notNull().default(0),
});

// ─── Cash Transactions ───────────────────────────────────────────────────────
export const cashTransactions = sqliteTable('cash_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  category: text('category').notNull(),
  amount: real('amount').notNull(),
  description: text('description'),
  paymentMethod: text('payment_method').default('cash'), // cash, qris, transfer
  relatedSaleId: integer('related_sale_id').references(() => sales.id),
  createdBy: integer('created_by').references(() => users.id),
  transactionDate: text('transaction_date').notNull().default(sql`(date('now', 'localtime'))`),
  createdAt: text('created_at').default(sql`(datetime('now', 'localtime'))`),
});
