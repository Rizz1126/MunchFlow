import { eq, sql } from 'drizzle-orm';
import db from '../../db/index.js';
import { menuItems, recipes, ingredients } from '../../db/schema.js';

export function getAllMenuItems() {
  const menus = db.select().from(menuItems).orderBy(menuItems.name).all();

  // Attach recipes with ingredient details and calculate HPP
  return menus.map(menu => {
    const recipeItems = db.select({
      id: recipes.id,
      ingredientId: recipes.ingredientId,
      ingredientName: ingredients.name,
      unit: ingredients.unit,
      buyPricePerUnit: ingredients.buyPricePerUnit,
      quantityNeeded: recipes.quantityNeeded,
    })
      .from(recipes)
      .innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id))
      .where(eq(recipes.menuItemId, menu.id))
      .all();

    const hpp = recipeItems.reduce((sum, r) => sum + (r.buyPricePerUnit * r.quantityNeeded), 0);

    return {
      ...menu,
      recipe: recipeItems,
      hpp,
      profitPerItem: menu.sellingPrice - hpp,
      profitMargin: menu.sellingPrice > 0 ? ((menu.sellingPrice - hpp) / menu.sellingPrice * 100) : 0,
    };
  });
}

export function getMenuItemById(id) {
  const menu = db.select().from(menuItems).where(eq(menuItems.id, id)).get();
  if (!menu) return null;

  const recipeItems = db.select({
    id: recipes.id,
    ingredientId: recipes.ingredientId,
    ingredientName: ingredients.name,
    unit: ingredients.unit,
    buyPricePerUnit: ingredients.buyPricePerUnit,
    quantityNeeded: recipes.quantityNeeded,
  })
    .from(recipes)
    .innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id))
    .where(eq(recipes.menuItemId, menu.id))
    .all();

  const hpp = recipeItems.reduce((sum, r) => sum + (r.buyPricePerUnit * r.quantityNeeded), 0);

  return {
    ...menu,
    recipe: recipeItems,
    hpp,
    profitPerItem: menu.sellingPrice - hpp,
    profitMargin: menu.sellingPrice > 0 ? ((menu.sellingPrice - hpp) / menu.sellingPrice * 100) : 0,
  };
}

export function createMenuItem(data) {
  return db.insert(menuItems).values({
    name: data.name,
    sellingPrice: data.sellingPrice,
    category: data.category || 'Minuman',
    isActive: data.isActive !== false,
  }).returning().get();
}

export function updateMenuItem(id, data) {
  return db.update(menuItems)
    .set({
      name: data.name,
      sellingPrice: data.sellingPrice,
      category: data.category,
      isActive: data.isActive,
    })
    .where(eq(menuItems.id, id))
    .returning().get();
}

export function setRecipe(menuItemId, recipeItems) {
  // Delete existing recipes for this menu item
  db.delete(recipes).where(eq(recipes.menuItemId, menuItemId)).run();

  // Insert new recipes
  for (const item of recipeItems) {
    db.insert(recipes).values({
      menuItemId,
      ingredientId: item.ingredientId,
      quantityNeeded: item.quantityNeeded,
    }).run();
  }

  return getMenuItemById(menuItemId);
}

/**
 * Calculate HPP for a specific menu item
 */
export function calculateHpp(menuItemId) {
  const recipeItems = db.select({
    buyPricePerUnit: ingredients.buyPricePerUnit,
    quantityNeeded: recipes.quantityNeeded,
  })
    .from(recipes)
    .innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id))
    .where(eq(recipes.menuItemId, menuItemId))
    .all();

  return recipeItems.reduce((sum, r) => sum + (r.buyPricePerUnit * r.quantityNeeded), 0);
}
