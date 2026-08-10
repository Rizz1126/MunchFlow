import { eq } from 'drizzle-orm';
import db from '../../db/index.js';
import { menuItems, recipes, ingredients } from '../../db/schema.js';

const recipeSelect = { id: recipes.id, ingredientId: recipes.ingredientId, ingredientName: ingredients.name,
  unit: ingredients.unit, buyPricePerUnit: ingredients.buyPricePerUnit, quantityNeeded: recipes.quantityNeeded };
function withTotals(menu, recipe) { const hpp = recipe.reduce((sum, item) => sum + item.buyPricePerUnit * item.quantityNeeded, 0);
  return { ...menu, recipe, hpp, profitPerItem: menu.sellingPrice - hpp, profitMargin: menu.sellingPrice > 0 ? (menu.sellingPrice - hpp) / menu.sellingPrice * 100 : 0 }; }

export async function getAllMenuItems() { const menus = await db.select().from(menuItems).orderBy(menuItems.name);
  return await Promise.all(menus.map(async (menu) => { const recipe = await db.select(recipeSelect).from(recipes)
    .innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id)).where(eq(recipes.menuItemId, menu.id)); return withTotals(menu, recipe); })); }

export async function getMenuItemById(id) { const [menu] = await db.select().from(menuItems).where(eq(menuItems.id, id)); if (!menu) return null;
  const recipe = await db.select(recipeSelect).from(recipes).innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id)).where(eq(recipes.menuItemId, menu.id)); return withTotals(menu, recipe); }

export async function createMenuItem(data) { const [menu] = await db.insert(menuItems).values({ name: data.name, sellingPrice: data.sellingPrice,
  category: data.category || 'Minuman', isActive: data.isActive !== false }).returning(); return menu; }
export async function updateMenuItem(id, data) { const [menu] = await db.update(menuItems).set({ name: data.name, sellingPrice: data.sellingPrice,
  category: data.category, isActive: data.isActive }).where(eq(menuItems.id, id)).returning(); return menu; }
export async function setRecipe(menuItemId, items) { await db.transaction(async (tx) => { await tx.delete(recipes).where(eq(recipes.menuItemId, menuItemId));
  if (items.length) await tx.insert(recipes).values(items.map((item) => ({ menuItemId, ingredientId: item.ingredientId, quantityNeeded: item.quantityNeeded }))); }); return await getMenuItemById(menuItemId); }
export async function calculateHpp(menuItemId) { const recipe = await db.select({ buyPricePerUnit: ingredients.buyPricePerUnit, quantityNeeded: recipes.quantityNeeded }).from(recipes)
  .innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id)).where(eq(recipes.menuItemId, menuItemId)); return recipe.reduce((sum, item) => sum + item.buyPricePerUnit * item.quantityNeeded, 0); }