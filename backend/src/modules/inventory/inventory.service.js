import { eq, and, lte, sql } from 'drizzle-orm';
import db from '../../db/index.js';
import { ingredients, cashTransactions } from '../../db/schema.js';
import { getBusinessFilter } from '../../middleware/businessScope.js';

export async function getAllIngredients(req) {
  const bizFilter = getBusinessFilter(req, ingredients.businessId);
  const conditions = bizFilter ? [bizFilter] : [];
  let query = db.select().from(ingredients).orderBy(ingredients.name);
  if (conditions.length > 0) query = query.where(and(...conditions));
  return await query;
}

export async function createIngredient(data, businessId) {
  const [ingredient] = await db.insert(ingredients).values({
    name: data.name, unit: data.unit,
    buyPricePerUnit: data.buyPricePerUnit, currentStock: data.currentStock || 0,
    minimumStock: data.minimumStock || 0, businessId: businessId || null,
  }).returning();
  return ingredient;
}

export async function updateIngredient(id, data) {
  const [ingredient] = await db.update(ingredients).set({
    name: data.name, unit: data.unit,
    buyPricePerUnit: data.buyPricePerUnit, minimumStock: data.minimumStock, updatedAt: new Date(),
  }).where(eq(ingredients.id, id)).returning();
  return ingredient;
}

export async function deleteIngredient(id) {
  const [ingredient] = await db.delete(ingredients).where(eq(ingredients.id, id)).returning();
  return ingredient;
}

export async function restockIngredient(id, quantity, userId, businessId) {
  const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, id));
  if (!ingredient) throw Object.assign(new Error('Bahan baku tidak ditemukan.'), { status: 404 });
  return await db.transaction(async (tx) => {
    await tx.update(ingredients).set({ currentStock: sql`${ingredients.currentStock} + ${quantity}`, updatedAt: new Date() }).where(eq(ingredients.id, id));
    await tx.insert(cashTransactions).values({
      type: 'expense', category: 'Pembelian Bahan Baku',
      amount: quantity * ingredient.buyPricePerUnit,
      description: `Restock ${ingredient.name}: ${quantity} ${ingredient.unit}`,
      paymentMethod: 'cash', createdBy: userId,
      businessId: businessId || ingredient.businessId || null,
      transactionDate: new Date().toISOString(),
    });
    const [updated] = await tx.select().from(ingredients).where(eq(ingredients.id, id));
    return updated;
  });
}

export async function getLowStockAlerts(req) {
  const bizFilter = getBusinessFilter(req, ingredients.businessId);
  const conditions = [lte(ingredients.currentStock, ingredients.minimumStock)];
  if (bizFilter) conditions.push(bizFilter);
  return await db.select().from(ingredients).where(and(...conditions)).orderBy(ingredients.name);
}