import { pgTable, text, serial, doublePrecision, integer, boolean, timestamp, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Businesses (Multi-Branch) ────────────────────────────────────────────────
export const businesses = pgTable('businesses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['owner', 'kasir'] }).notNull().default('kasir'),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── User ↔ Business Assignment (Pivot) ───────────────────────────────────────
export const userBusinesses = pgTable('user_businesses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  accessibleMenus: text('accessible_menus'), // e.g. "pos,cash,dashboard"
});

// ─── Ingredients (Bahan Baku) ─────────────────────────────────────────────────
export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  unit: text('unit').notNull(), // kg, gram, pcs, ml, pack
  buyPricePerUnit: doublePrecision('buy_price_per_unit').notNull().default(0),
  currentStock: doublePrecision('current_stock').notNull().default(0),
  minimumStock: doublePrecision('minimum_stock').notNull().default(0),
  businessId: integer('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
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
  businessId: integer('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Recipes (Bill of Materials / BOM) ────────────────────────────────────────
export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  quantityNeeded: doublePrecision('quantity_needed').notNull(),
});

// ─── Add-on Groups (per Menu Item) - DEPRECATED ────────────────────────────────
export const addonGroups = pgTable('addon_groups', {
  id: serial('id').primaryKey(),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isRequired: boolean('is_required').notNull().default(false),
  maxSelect: integer('max_select').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

export const addonOptions = pgTable('addon_options', {
  id: serial('id').primaryKey(),
  addonGroupId: integer('addon_group_id').notNull().references(() => addonGroups.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  extraPrice: doublePrecision('extra_price').notNull().default(0),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const addonRecipes = pgTable('addon_recipes', {
  id: serial('id').primaryKey(),
  addonOptionId: integer('addon_option_id').notNull().references(() => addonOptions.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  quantityNeeded: doublePrecision('quantity_needed').notNull(),
});

export const saleItemAddons = pgTable('sale_item_addons', {
  id: serial('id').primaryKey(),
  saleItemId: integer('sale_item_id').notNull(), // removed FK to avoid circular dependencies for now
  addonOptionId: integer('addon_option_id').notNull(),
  extraPrice: doublePrecision('extra_price').notNull().default(0),
  addonName: text('addon_name'),
  groupName: text('group_name'),
});

// ─── Global Modifiers (Add-ons Dinamis Kasir) ─────────────────────────────────
export const modifiers = pgTable('modifiers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g. "Less Ice", "Extra Shot"
  extraPrice: doublePrecision('extra_price').notNull().default(0),
  businessId: integer('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Sales ────────────────────────────────────────────────────────────────────
export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  totalAmount: doublePrecision('total_amount').notNull(),
  totalHpp: doublePrecision('total_hpp').notNull().default(0),
  paymentMethod: text('payment_method').notNull().default('cash'), // cash, qris, transfer
  businessId: integer('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
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
  modifiersTotal: doublePrecision('modifiers_total').notNull().default(0),
  subtotal: doublePrecision('subtotal').notNull(),
  hppPerItem: doublePrecision('hpp_per_item').notNull().default(0),
  note: text('note'), // gabungan modifiers / catatan manual "Less Ice, Extra Plastik"
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
  businessId: integer('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdBy: integer('created_by').references(() => users.id),
  transactionDate: timestamp('transaction_date', { mode: 'string' }).notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});
