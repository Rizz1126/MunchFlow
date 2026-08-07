import { eq, sql, desc } from 'drizzle-orm';
import db, { sqlite } from '../../db/index.js';
import { sales, saleItems, menuItems, recipes, ingredients, cashTransactions } from '../../db/schema.js';

/**
 * Process a sale (ATOMIC TRANSACTION)
 * 1. Create sale record
 * 2. Create sale items
 * 3. Deduct ingredient stock per recipe
 * 4. Create cash income transaction
 */
export function processSale(data, userId) {
  const { items, paymentMethod } = data;
  // items: [{ menuItemId, quantity }]

  if (!items || items.length === 0) {
    throw Object.assign(new Error('Minimal 1 item harus dipesan.'), { status: 400 });
  }

  const txn = sqlite.transaction(() => {
    let totalAmount = 0;
    let totalHpp = 0;
    const processedItems = [];

    // Process each item
    for (const item of items) {
      const menu = db.select().from(menuItems).where(eq(menuItems.id, item.menuItemId)).get();
      if (!menu) {
        throw Object.assign(new Error(`Menu dengan ID ${item.menuItemId} tidak ditemukan.`), { status: 404 });
      }

      // Calculate HPP from recipe
      const recipeItems = db.select({
        ingredientId: recipes.ingredientId,
        quantityNeeded: recipes.quantityNeeded,
        buyPricePerUnit: ingredients.buyPricePerUnit,
        currentStock: ingredients.currentStock,
        ingredientName: ingredients.name,
        unit: ingredients.unit,
      })
        .from(recipes)
        .innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id))
        .where(eq(recipes.menuItemId, menu.id))
        .all();

      const hppPerItem = recipeItems.reduce((sum, r) => sum + (r.buyPricePerUnit * r.quantityNeeded), 0);
      const subtotal = menu.sellingPrice * item.quantity;

      // Deduct stock for each ingredient
      for (const recipe of recipeItems) {
        const totalNeeded = recipe.quantityNeeded * item.quantity;
        
        // Check stock availability
        if (recipe.currentStock < totalNeeded) {
          throw Object.assign(
            new Error(`Stok ${recipe.ingredientName} tidak mencukupi. Butuh ${totalNeeded} ${recipe.unit}, tersedia ${recipe.currentStock} ${recipe.unit}.`),
            { status: 400 }
          );
        }

        // Deduct stock
        db.update(ingredients)
          .set({
            currentStock: sql`${ingredients.currentStock} - ${totalNeeded}`,
            updatedAt: sql`datetime('now', 'localtime')`,
          })
          .where(eq(ingredients.id, recipe.ingredientId))
          .run();
      }

      totalAmount += subtotal;
      totalHpp += hppPerItem * item.quantity;

      processedItems.push({
        menuItemId: menu.id,
        menuName: menu.name,
        quantity: item.quantity,
        unitPrice: menu.sellingPrice,
        subtotal,
        hppPerItem,
      });
    }

    // Generate invoice number
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const invoiceNumber = `INV-${dateStr}-${timeStr}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Create sale record
    const sale = db.insert(sales).values({
      invoiceNumber,
      totalAmount,
      totalHpp,
      paymentMethod: paymentMethod || 'cash',
      createdBy: userId,
    }).returning().get();

    // Create sale items
    for (const item of processedItems) {
      db.insert(saleItems).values({
        saleId: sale.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        hppPerItem: item.hppPerItem,
      }).run();
    }

    // Create cash income transaction
    db.insert(cashTransactions).values({
      type: 'income',
      category: 'Penjualan Harian',
      amount: totalAmount,
      description: `Penjualan ${invoiceNumber} (${processedItems.map(i => `${i.menuName} x${i.quantity}`).join(', ')})`,
      paymentMethod: paymentMethod || 'cash',
      relatedSaleId: sale.id,
      createdBy: userId,
      transactionDate: now.toISOString().split('T')[0],
    }).run();

    return {
      ...sale,
      items: processedItems,
    };
  });

  return txn();
}

export function getRecentSales(limit = 50) {
  const salesList = db.select().from(sales).orderBy(desc(sales.createdAt)).limit(limit).all();

  return salesList.map(sale => {
    const items = db.select({
      id: saleItems.id,
      menuItemId: saleItems.menuItemId,
      menuName: menuItems.name,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      subtotal: saleItems.subtotal,
      hppPerItem: saleItems.hppPerItem,
    })
      .from(saleItems)
      .innerJoin(menuItems, eq(saleItems.menuItemId, menuItems.id))
      .where(eq(saleItems.saleId, sale.id))
      .all();

    return { ...sale, items };
  });
}
