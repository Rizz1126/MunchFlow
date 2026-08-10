import { eq, sql, desc } from 'drizzle-orm';
import db from '../../db/index.js';
import { sales, saleItems, menuItems, recipes, ingredients, cashTransactions } from '../../db/schema.js';

export async function processSale(data, userId) {
  const { items, paymentMethod } = data;
  if (!items || items.length === 0) throw Object.assign(new Error('Minimal 1 item harus dipesan.'), { status: 400 });
  return await db.transaction(async (tx) => {
    let totalAmount = 0, totalHpp = 0; const processedItems = [];
    for (const item of items) {
      const [menu] = await tx.select().from(menuItems).where(eq(menuItems.id, item.menuItemId));
      if (!menu) throw Object.assign(new Error(`Menu dengan ID ${item.menuItemId} tidak ditemukan.`), { status: 404 });
      const recipeItems = await tx.select({ ingredientId: recipes.ingredientId, quantityNeeded: recipes.quantityNeeded,
        buyPricePerUnit: ingredients.buyPricePerUnit, currentStock: ingredients.currentStock, ingredientName: ingredients.name, unit: ingredients.unit })
        .from(recipes).innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id)).where(eq(recipes.menuItemId, menu.id));
      const hppPerItem = recipeItems.reduce((sum, r) => sum + r.buyPricePerUnit * r.quantityNeeded, 0);
      const subtotal = menu.sellingPrice * item.quantity;
      for (const recipe of recipeItems) {
        const needed = recipe.quantityNeeded * item.quantity;
        if (recipe.currentStock < needed) throw Object.assign(new Error(`Stok ${recipe.ingredientName} tidak mencukupi.`), { status: 400 });
        await tx.update(ingredients).set({ currentStock: sql`${ingredients.currentStock} - ${needed}`, updatedAt: new Date() }).where(eq(ingredients.id, recipe.ingredientId));
      }
      totalAmount += subtotal; totalHpp += hppPerItem * item.quantity;
      processedItems.push({ menuItemId: menu.id, menuName: menu.name, quantity: item.quantity, unitPrice: menu.sellingPrice, subtotal, hppPerItem });
    }
    const now = new Date();
    const invoiceNumber = `INV-${now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const [sale] = await tx.insert(sales).values({ invoiceNumber, totalAmount, totalHpp, paymentMethod: paymentMethod || 'cash', createdBy: userId }).returning();
    await tx.insert(saleItems).values(processedItems.map((item) => ({ saleId: sale.id, menuItemId: item.menuItemId, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal, hppPerItem: item.hppPerItem })));
    await tx.insert(cashTransactions).values({ type: 'income', category: 'Penjualan Harian', amount: totalAmount, description: `Penjualan ${invoiceNumber}`, paymentMethod: paymentMethod || 'cash', relatedSaleId: sale.id, createdBy: userId, transactionDate: now });
    return { ...sale, items: processedItems };
  });
}

export async function getRecentSales(limit = 50) {
  const salesList = await db.select().from(sales).orderBy(desc(sales.createdAt)).limit(limit);
  return await Promise.all(salesList.map(async (sale) => ({ ...sale, items: await db.select({ id: saleItems.id, menuItemId: saleItems.menuItemId,
    menuName: menuItems.name, quantity: saleItems.quantity, unitPrice: saleItems.unitPrice, subtotal: saleItems.subtotal, hppPerItem: saleItems.hppPerItem })
    .from(saleItems).innerJoin(menuItems, eq(saleItems.menuItemId, menuItems.id)).where(eq(saleItems.saleId, sale.id)) })));
}