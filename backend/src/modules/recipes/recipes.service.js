import { eq, and } from 'drizzle-orm';
import db from '../../db/index.js';
import { menuItems, recipes, ingredients, addonGroups, addonOptions, addonRecipes } from '../../db/schema.js';
import { getBusinessFilter } from '../../middleware/businessScope.js';

const recipeSelect = {
  id: recipes.id, ingredientId: recipes.ingredientId, ingredientName: ingredients.name,
  unit: ingredients.unit, buyPricePerUnit: ingredients.buyPricePerUnit, quantityNeeded: recipes.quantityNeeded,
};

function withTotals(menu, recipe) {
  const hpp = recipe.reduce((sum, item) => sum + item.buyPricePerUnit * item.quantityNeeded, 0);
  return {
    ...menu, recipe, hpp,
    profitPerItem: menu.sellingPrice - hpp,
    profitMargin: menu.sellingPrice > 0 ? (menu.sellingPrice - hpp) / menu.sellingPrice * 100 : 0,
  };
}

// ─── Menu CRUD ────────────────────────────────────────────────────────────────

export async function getAllMenuItems(req) {
  const bizFilter = req ? getBusinessFilter(req, menuItems.businessId) : null;
  const conditions = bizFilter ? [bizFilter] : [];
  let query = db.select().from(menuItems).orderBy(menuItems.name);
  if (conditions.length > 0) query = query.where(and(...conditions));
  const menus = await query;

  return await Promise.all(menus.map(async (menu) => {
    const recipe = await db.select(recipeSelect).from(recipes)
      .innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id))
      .where(eq(recipes.menuItemId, menu.id));

    // Get addon groups count
    const groups = await db.select({ id: addonGroups.id }).from(addonGroups)
      .where(eq(addonGroups.menuItemId, menu.id));

    const result = withTotals(menu, recipe);
    result.addonGroupCount = groups.length;
    return result;
  }));
}

export async function getMenuItemById(id) {
  const [menu] = await db.select().from(menuItems).where(eq(menuItems.id, id));
  if (!menu) return null;
  const recipe = await db.select(recipeSelect).from(recipes)
    .innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id))
    .where(eq(recipes.menuItemId, menu.id));
  return withTotals(menu, recipe);
}

export async function createMenuItem(data, businessId) {
  const [menu] = await db.insert(menuItems).values({
    name: data.name, sellingPrice: data.sellingPrice,
    category: data.category || 'Minuman', isActive: data.isActive !== false,
    businessId: businessId || null,
  }).returning();
  return menu;
}

export async function updateMenuItem(id, data) {
  const [menu] = await db.update(menuItems).set({
    name: data.name, sellingPrice: data.sellingPrice,
    category: data.category, isActive: data.isActive,
  }).where(eq(menuItems.id, id)).returning();
  return menu;
}

export async function setRecipe(menuItemId, items) {
  await db.transaction(async (tx) => {
    await tx.delete(recipes).where(eq(recipes.menuItemId, menuItemId));
    if (items.length) await tx.insert(recipes).values(
      items.map((item) => ({ menuItemId, ingredientId: item.ingredientId, quantityNeeded: item.quantityNeeded }))
    );
  });
  return await getMenuItemById(menuItemId);
}

export async function calculateHpp(menuItemId) {
  const recipe = await db.select({ buyPricePerUnit: ingredients.buyPricePerUnit, quantityNeeded: recipes.quantityNeeded })
    .from(recipes).innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id))
    .where(eq(recipes.menuItemId, menuItemId));
  return recipe.reduce((sum, item) => sum + item.buyPricePerUnit * item.quantityNeeded, 0);
}

// ─── Add-on Groups CRUD ──────────────────────────────────────────────────────

export async function getAddonGroups(menuItemId) {
  const groups = await db.select().from(addonGroups)
    .where(eq(addonGroups.menuItemId, menuItemId))
    .orderBy(addonGroups.name);

  return await Promise.all(groups.map(async (group) => {
    const options = await db.select().from(addonOptions)
      .where(eq(addonOptions.addonGroupId, group.id))
      .orderBy(addonOptions.name);

    // Get recipes for each option
    const optionsWithRecipes = await Promise.all(options.map(async (opt) => {
      const optRecipes = await db.select({
        id: addonRecipes.id,
        ingredientId: addonRecipes.ingredientId,
        ingredientName: ingredients.name,
        unit: ingredients.unit,
        buyPricePerUnit: ingredients.buyPricePerUnit,
        quantityNeeded: addonRecipes.quantityNeeded,
      }).from(addonRecipes)
        .innerJoin(ingredients, eq(addonRecipes.ingredientId, ingredients.id))
        .where(eq(addonRecipes.addonOptionId, opt.id));
      return { ...opt, recipes: optRecipes };
    }));

    return { ...group, options: optionsWithRecipes };
  }));
}

export async function createAddonGroup(menuItemId, data) {
  const [group] = await db.insert(addonGroups).values({
    menuItemId,
    name: data.name,
    isRequired: data.isRequired || false,
    maxSelect: data.maxSelect || 1,
  }).returning();
  return group;
}

export async function updateAddonGroup(groupId, data) {
  const [group] = await db.update(addonGroups).set({
    name: data.name,
    isRequired: data.isRequired,
    maxSelect: data.maxSelect,
  }).where(eq(addonGroups.id, groupId)).returning();
  return group;
}

export async function deleteAddonGroup(groupId) {
  const [group] = await db.delete(addonGroups).where(eq(addonGroups.id, groupId)).returning();
  return group;
}

// ─── Add-on Options CRUD ─────────────────────────────────────────────────────

export async function createAddonOption(groupId, data) {
  const [option] = await db.insert(addonOptions).values({
    addonGroupId: groupId,
    name: data.name,
    extraPrice: data.extraPrice || 0,
    isDefault: data.isDefault || false,
  }).returning();
  return option;
}

export async function updateAddonOption(optionId, data) {
  const [option] = await db.update(addonOptions).set({
    name: data.name,
    extraPrice: data.extraPrice,
    isDefault: data.isDefault,
  }).where(eq(addonOptions.id, optionId)).returning();
  return option;
}

export async function deleteAddonOption(optionId) {
  const [option] = await db.delete(addonOptions).where(eq(addonOptions.id, optionId)).returning();
  return option;
}

// ─── Add-on Recipes ──────────────────────────────────────────────────────────

export async function setAddonRecipe(addonOptionId, items) {
  await db.transaction(async (tx) => {
    await tx.delete(addonRecipes).where(eq(addonRecipes.addonOptionId, addonOptionId));
    if (items.length) {
      await tx.insert(addonRecipes).values(
        items.map((item) => ({
          addonOptionId,
          ingredientId: item.ingredientId,
          quantityNeeded: item.quantityNeeded,
        }))
      );
    }
  });

  // Return updated option with recipes
  const optRecipes = await db.select({
    id: addonRecipes.id,
    ingredientId: addonRecipes.ingredientId,
    ingredientName: ingredients.name,
    unit: ingredients.unit,
    buyPricePerUnit: ingredients.buyPricePerUnit,
    quantityNeeded: addonRecipes.quantityNeeded,
  }).from(addonRecipes)
    .innerJoin(ingredients, eq(addonRecipes.ingredientId, ingredients.id))
    .where(eq(addonRecipes.addonOptionId, addonOptionId));

  return optRecipes;
}