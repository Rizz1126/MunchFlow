import { eq, lt, sql, and, gte, lte, desc } from 'drizzle-orm';
import db, { sqlite } from '../../db/index.js';
import { ingredients, cashTransactions } from '../../db/schema.js';

export function getAllIngredients() {
  return db.select().from(ingredients).orderBy(ingredients.name).all();
}

export function getIngredientById(id) {
  return db.select().from(ingredients).where(eq(ingredients.id, id)).get();
}

export function createIngredient(data) {
  return db.insert(ingredients).values({
    name: data.name,
    unit: data.unit,
    buyPricePerUnit: data.buyPricePerUnit,
    currentStock: data.currentStock || 0,
    minimumStock: data.minimumStock || 0,
  }).returning().get();
}

export function updateIngredient(id, data) {
  return db.update(ingredients)
    .set({
      name: data.name,
      unit: data.unit,
      buyPricePerUnit: data.buyPricePerUnit,
      minimumStock: data.minimumStock,
      updatedAt: sql`datetime('now', 'localtime')`,
    })
    .where(eq(ingredients.id, id))
    .returning().get();
}

export function deleteIngredient(id) {
  return db.delete(ingredients).where(eq(ingredients.id, id)).returning().get();
}

/**
 * Restock ingredient + auto-create cash expense (ATOMIC)
 */
export function restockIngredient(id, quantity, userId) {
  const ingredient = db.select().from(ingredients).where(eq(ingredients.id, id)).get();
  if (!ingredient) {
    throw Object.assign(new Error('Bahan baku tidak ditemukan.'), { status: 404 });
  }

  const totalCost = quantity * ingredient.buyPricePerUnit;

  // Atomic transaction: update stock + create expense
  const txn = sqlite.transaction(() => {
    // Update stock
    db.update(ingredients)
      .set({
        currentStock: sql`${ingredients.currentStock} + ${quantity}`,
        updatedAt: sql`datetime('now', 'localtime')`,
      })
      .where(eq(ingredients.id, id))
      .run();

    // Create cash expense
    db.insert(cashTransactions).values({
      type: 'expense',
      category: 'Pembelian Bahan Baku',
      amount: totalCost,
      description: `Restock ${ingredient.name}: ${quantity} ${ingredient.unit} @ Rp ${ingredient.buyPricePerUnit.toLocaleString('id-ID')}`,
      paymentMethod: 'cash',
      createdBy: userId,
      transactionDate: new Date().toISOString().split('T')[0],
    }).run();

    // Return updated ingredient
    return db.select().from(ingredients).where(eq(ingredients.id, id)).get();
  });

  return txn();
}

/**
 * Get ingredients below minimum stock
 */
export function getLowStockAlerts() {
  return db.select().from(ingredients)
    .where(lte(ingredients.currentStock, ingredients.minimumStock))
    .orderBy(ingredients.name)
    .all();
}
