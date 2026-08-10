import bcrypt from 'bcryptjs';
import db from './index.js';
import { users, ingredients, menuItems, recipes } from './schema.js';

const ingredientData = [['Kopi Bubuk Robusta', 'gram', 0.15, 5000, 500], ['Susu UHT Full Cream', 'ml', 0.025, 20000, 3000], ['Gula Pasir', 'gram', 0.015, 10000, 1000], ['Es Batu', 'gram', 0.005, 30000, 5000], ['Cup Plastik 16oz', 'pcs', 800, 200, 50], ['Coklat Bubuk', 'gram', 0.2, 3000, 300], ['Matcha Powder', 'gram', 0.8, 1000, 100], ['Sirup Vanila', 'ml', 0.1, 2000, 200], ['Sedotan', 'pcs', 100, 500, 100], ['Lid Cup', 'pcs', 200, 200, 50]];
const menuData = [['Es Kopi Susu', 18000, 'Minuman Kopi'], ['Americano Ice', 15000, 'Minuman Kopi'], ['Matcha Latte', 22000, 'Minuman Non-Kopi'], ['Coklat Susu', 18000, 'Minuman Non-Kopi'], ['Kopi Hitam', 12000, 'Minuman Kopi'], ['Susu Vanila', 16000, 'Minuman Non-Kopi']];
const recipeData = [[1, 1, 20], [1, 2, 150], [1, 3, 15], [1, 4, 100], [1, 5, 1], [1, 9, 1], [1, 10, 1], [2, 1, 18], [2, 4, 150], [2, 5, 1], [2, 9, 1], [2, 10, 1], [3, 7, 10], [3, 2, 200], [3, 3, 10], [3, 4, 100], [3, 5, 1], [3, 9, 1], [3, 10, 1], [4, 6, 15], [4, 2, 200], [4, 3, 15], [4, 4, 100], [4, 5, 1], [4, 9, 1], [4, 10, 1], [5, 1, 20], [5, 4, 100], [5, 5, 1], [5, 9, 1], [5, 10, 1], [6, 2, 250], [6, 8, 30], [6, 3, 10], [6, 4, 100], [6, 5, 1], [6, 9, 1], [6, 10, 1]];

async function seed() {
  console.log('🌱 Seeding Supabase database...');
  await db.delete(recipes); await db.delete(menuItems); await db.delete(ingredients); await db.delete(users);
  await db.insert(users).values([{ username: 'owner', passwordHash: await bcrypt.hash('owner123', 10), role: 'owner', displayName: 'Pak Budi (Owner)' }, { username: 'kasir', passwordHash: await bcrypt.hash('kasir123', 10), role: 'kasir', displayName: 'Sari (Kasir)' }]);
  await db.insert(ingredients).values(ingredientData.map(([name, unit, buyPricePerUnit, currentStock, minimumStock]) => ({ name, unit, buyPricePerUnit, currentStock, minimumStock })));
  await db.insert(menuItems).values(menuData.map(([name, sellingPrice, category]) => ({ name, sellingPrice, category, isActive: true })));
  await db.insert(recipes).values(recipeData.map(([menuItemId, ingredientId, quantityNeeded]) => ({ menuItemId, ingredientId, quantityNeeded })));
  console.log('✅ Seed complete. Login: owner/owner123 and kasir/kasir123'); process.exit(0);
}
seed().catch((error) => { console.error('❌ Seed failed:', error); process.exit(1); });