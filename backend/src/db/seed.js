import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as schema from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const dbPath = path.resolve(__dirname, '../../', process.env.DB_PATH || './data/munchflow.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// ─── Create Tables ────────────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'kasir',
    display_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    buy_price_per_unit REAL NOT NULL DEFAULT 0,
    current_stock REAL NOT NULL DEFAULT 0,
    minimum_stock REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    selling_price REAL NOT NULL,
    category TEXT DEFAULT 'Minuman',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_needed REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE,
    total_amount REAL NOT NULL,
    total_hpp REAL NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    hpp_per_item REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS cash_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    payment_method TEXT DEFAULT 'cash',
    related_sale_id INTEGER REFERENCES sales(id),
    created_by INTEGER REFERENCES users(id),
    transaction_date TEXT NOT NULL DEFAULT (date('now', 'localtime')),
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

const db = drizzle(sqlite, { schema });

// ─── Seed Data ────────────────────────────────────────────────────────────────
console.log('🌱 Seeding MunchFlow database...\n');

// Clear existing data
sqlite.exec(`
  DELETE FROM cash_transactions;
  DELETE FROM sale_items;
  DELETE FROM sales;
  DELETE FROM recipes;
  DELETE FROM menu_items;
  DELETE FROM ingredients;
  DELETE FROM users;
`);

// 1. Users
const ownerHash = bcrypt.hashSync('owner123', 10);
const kasirHash = bcrypt.hashSync('kasir123', 10);

const insertUser = sqlite.prepare(`
  INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)
`);

insertUser.run('owner', ownerHash, 'owner', 'Pak Budi (Owner)');
insertUser.run('kasir', kasirHash, 'kasir', 'Sari (Kasir)');
console.log('✅ Users created (owner / owner123, kasir / kasir123)');

// 2. Ingredients (Bahan Baku)
const insertIngredient = sqlite.prepare(`
  INSERT INTO ingredients (name, unit, buy_price_per_unit, current_stock, minimum_stock) VALUES (?, ?, ?, ?, ?)
`);

const ingredientData = [
  ['Kopi Bubuk Robusta', 'gram', 0.15, 5000, 500],      // Rp 150/gram = Rp 150.000/kg
  ['Susu UHT Full Cream', 'ml', 0.025, 20000, 3000],    // Rp 25/ml = Rp 25.000/L
  ['Gula Pasir', 'gram', 0.015, 10000, 1000],            // Rp 15/gram = Rp 15.000/kg
  ['Es Batu', 'gram', 0.005, 30000, 5000],               // Rp 5/gram
  ['Cup Plastik 16oz', 'pcs', 800, 200, 50],             // Rp 800/pcs
  ['Coklat Bubuk', 'gram', 0.2, 3000, 300],              // Rp 200/gram
  ['Matcha Powder', 'gram', 0.8, 1000, 100],             // Rp 800/gram
  ['Sirup Vanila', 'ml', 0.1, 2000, 200],                // Rp 100/ml
  ['Sedotan', 'pcs', 100, 500, 100],                     // Rp 100/pcs
  ['Lid Cup', 'pcs', 200, 200, 50],                      // Rp 200/pcs
];

for (const ing of ingredientData) {
  insertIngredient.run(...ing);
}
console.log('✅ 10 Ingredients seeded');

// 3. Menu Items
const insertMenu = sqlite.prepare(`
  INSERT INTO menu_items (name, selling_price, category) VALUES (?, ?, ?)
`);

const menuData = [
  ['Es Kopi Susu', 18000, 'Minuman Kopi'],
  ['Americano Ice', 15000, 'Minuman Kopi'],
  ['Matcha Latte', 22000, 'Minuman Non-Kopi'],
  ['Coklat Susu', 18000, 'Minuman Non-Kopi'],
  ['Kopi Hitam', 12000, 'Minuman Kopi'],
  ['Susu Vanila', 16000, 'Minuman Non-Kopi'],
];

for (const menu of menuData) {
  insertMenu.run(...menu);
}
console.log('✅ 6 Menu items seeded');

// 4. Recipes (BOM)
const insertRecipe = sqlite.prepare(`
  INSERT INTO recipes (menu_item_id, ingredient_id, quantity_needed) VALUES (?, ?, ?)
`);

const recipeData = [
  // Es Kopi Susu (menu 1): Kopi 20g, Susu 150ml, Gula 15g, Es 100g, Cup 1, Sedotan 1, Lid 1
  [1, 1, 20], [1, 2, 150], [1, 3, 15], [1, 4, 100], [1, 5, 1], [1, 9, 1], [1, 10, 1],
  // Americano Ice (menu 2): Kopi 18g, Es 150g, Cup 1, Sedotan 1, Lid 1
  [2, 1, 18], [2, 4, 150], [2, 5, 1], [2, 9, 1], [2, 10, 1],
  // Matcha Latte (menu 3): Matcha 10g, Susu 200ml, Gula 10g, Es 100g, Cup 1, Sedotan 1, Lid 1
  [3, 7, 10], [3, 2, 200], [3, 3, 10], [3, 4, 100], [3, 5, 1], [3, 9, 1], [3, 10, 1],
  // Coklat Susu (menu 4): Coklat 15g, Susu 200ml, Gula 15g, Es 100g, Cup 1, Sedotan 1, Lid 1
  [4, 6, 15], [4, 2, 200], [4, 3, 15], [4, 4, 100], [4, 5, 1], [4, 9, 1], [4, 10, 1],
  // Kopi Hitam (menu 5): Kopi 20g, Es 100g, Cup 1, Sedotan 1, Lid 1
  [5, 1, 20], [5, 4, 100], [5, 5, 1], [5, 9, 1], [5, 10, 1],
  // Susu Vanila (menu 6): Susu 250ml, Sirup Vanila 30ml, Gula 10g, Es 100g, Cup 1, Sedotan 1, Lid 1
  [6, 2, 250], [6, 8, 30], [6, 3, 10], [6, 4, 100], [6, 5, 1], [6, 9, 1], [6, 10, 1],
];

for (const recipe of recipeData) {
  insertRecipe.run(...recipe);
}
console.log('✅ Recipes (BOM) seeded for all menu items');

// 5. Generate some historical sales & cash data for dashboard demo
const today = new Date();
const insertSale = sqlite.prepare(`
  INSERT INTO sales (invoice_number, total_amount, total_hpp, payment_method, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)
`);
const insertSaleItem = sqlite.prepare(`
  INSERT INTO sale_items (sale_id, menu_item_id, quantity, unit_price, subtotal, hpp_per_item) VALUES (?, ?, ?, ?, ?, ?)
`);
const insertCash = sqlite.prepare(`
  INSERT INTO cash_transactions (type, category, amount, description, payment_method, related_sale_id, created_by, transaction_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Menu prices and HPP estimates
const menuInfo = [
  { id: 1, name: 'Es Kopi Susu', price: 18000, hpp: 7925 },
  { id: 2, name: 'Americano Ice', price: 15000, hpp: 4950 },
  { id: 3, name: 'Matcha Latte', price: 22000, hpp: 14250 },
  { id: 4, name: 'Coklat Susu', price: 18000, hpp: 9975 },
  { id: 5, name: 'Kopi Hitam', price: 12000, hpp: 4600 },
  { id: 6, name: 'Susu Vanila', price: 16000, hpp: 10450 },
];

const paymentMethods = ['cash', 'qris', 'transfer'];
let saleCounter = 0;

// Generate 14 days of historical data
for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
  const date = new Date(today);
  date.setDate(date.getDate() - dayOffset);
  const dateStr = date.toISOString().split('T')[0];
  const dateTime = `${dateStr} ${8 + Math.floor(Math.random() * 10)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;

  // 5-15 sales per day
  const salesCount = 5 + Math.floor(Math.random() * 11);

  for (let s = 0; s < salesCount; s++) {
    saleCounter++;
    const invoiceNum = `INV-${dateStr.replace(/-/g, '')}-${String(saleCounter).padStart(4, '0')}`;
    const pm = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    // 1-3 items per sale
    const itemCount = 1 + Math.floor(Math.random() * 3);
    let totalAmount = 0;
    let totalHpp = 0;
    const items = [];

    for (let i = 0; i < itemCount; i++) {
      const menu = menuInfo[Math.floor(Math.random() * menuInfo.length)];
      const qty = 1 + Math.floor(Math.random() * 3);
      const subtotal = menu.price * qty;
      totalAmount += subtotal;
      totalHpp += menu.hpp * qty;
      items.push({ menuId: menu.id, qty, price: menu.price, subtotal, hpp: menu.hpp });
    }

    const saleTime = `${dateStr} ${8 + Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
    
    const saleResult = insertSale.run(invoiceNum, totalAmount, totalHpp, pm, 2, saleTime);
    const saleId = saleResult.lastInsertRowid;

    for (const item of items) {
      insertSaleItem.run(saleId, item.menuId, item.qty, item.price, item.subtotal, item.hpp);
    }

    // Cash income from sale
    insertCash.run('income', 'Penjualan Harian', totalAmount, `Penjualan ${invoiceNum}`, pm, saleId, 2, dateStr, saleTime);
  }

  // Add some operational expenses on some days
  if (dayOffset % 3 === 0) {
    insertCash.run('expense', 'Biaya Operasional', 50000 + Math.floor(Math.random() * 30000), 'Es Batu & Gas', 'cash', null, 1, dateStr, `${dateStr} 07:00:00`);
  }
  if (dayOffset % 7 === 0) {
    insertCash.run('expense', 'Pembelian Bahan Baku', 200000 + Math.floor(Math.random() * 150000), 'Restock bahan mingguan', 'transfer', null, 1, dateStr, `${dateStr} 06:30:00`);
  }
}

// Add monthly expenses
const thisMonth = today.toISOString().split('T')[0].substring(0, 7);
insertCash.run('expense', 'Biaya Operasional', 1500000, 'Sewa Tempat Bulan Ini', 'transfer', null, 1, `${thisMonth}-01`, `${thisMonth}-01 09:00:00`);
insertCash.run('expense', 'Gaji/Bonus', 2000000, 'Gaji Kasir', 'transfer', null, 1, `${thisMonth}-01`, `${thisMonth}-01 09:00:00`);
insertCash.run('expense', 'Biaya Operasional', 350000, 'Listrik', 'transfer', null, 1, `${thisMonth}-05`, `${thisMonth}-05 10:00:00`);

console.log(`✅ ${saleCounter} historical sales generated (14 days)`);
console.log('✅ Cash transactions (income + expenses) seeded');

console.log('\n🎉 Seed complete! Database ready at:', dbPath);
console.log('\n📋 Login credentials:');
console.log('   Owner: owner / owner123');
console.log('   Kasir: kasir / kasir123');

sqlite.close();
