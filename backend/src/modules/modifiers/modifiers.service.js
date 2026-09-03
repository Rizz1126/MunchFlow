import { eq, and } from 'drizzle-orm';
import db from '../../db/index.js';
import { modifiers } from '../../db/schema.js';

export async function getModifiers(businessId) {
  return await db.select()
    .from(modifiers)
    .where(businessId ? eq(modifiers.businessId, businessId) : undefined)
    .orderBy(modifiers.name);
}

export async function createModifier(data) {
  const [modifier] = await db.insert(modifiers).values({
    name: data.name,
    extraPrice: data.extraPrice || 0,
    businessId: data.businessId,
  }).returning();
  return modifier;
}

export async function updateModifier(id, data, businessId) {
  const condition = businessId 
    ? and(eq(modifiers.id, id), eq(modifiers.businessId, businessId))
    : eq(modifiers.id, id);

  const [modifier] = await db.update(modifiers).set({
    name: data.name,
    extraPrice: data.extraPrice,
  }).where(condition).returning();
  
  return modifier;
}

export async function deleteModifier(id, businessId) {
  const condition = businessId 
    ? and(eq(modifiers.id, id), eq(modifiers.businessId, businessId))
    : eq(modifiers.id, id);

  const [modifier] = await db.delete(modifiers).where(condition).returning();
  return modifier;
}
