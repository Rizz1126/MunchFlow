import { eq } from 'drizzle-orm';
import db from '../../db/index.js';
import { businesses, userBusinesses, users } from '../../db/schema.js';

export async function getAllBusinesses() {
  return await db.select().from(businesses).orderBy(businesses.name);
}

export async function getBusinessesByUser(userId) {
  const rows = await db.select({
    id: businesses.id,
    name: businesses.name,
    address: businesses.address,
    phone: businesses.phone,
    createdAt: businesses.createdAt,
    accessibleMenus: userBusinesses.accessibleMenus,
  })
    .from(userBusinesses)
    .innerJoin(businesses, eq(userBusinesses.businessId, businesses.id))
    .where(eq(userBusinesses.userId, userId));
  return rows;
}

export async function createBusiness(data) {
  const [biz] = await db.insert(businesses).values({
    name: data.name,
    address: data.address || null,
    phone: data.phone || null,
  }).returning();
  return biz;
}

export async function updateBusiness(id, data) {
  const [biz] = await db.update(businesses).set({
    name: data.name,
    address: data.address,
    phone: data.phone,
  }).where(eq(businesses.id, id)).returning();
  return biz;
}

export async function deleteBusiness(id) {
  const [biz] = await db.delete(businesses).where(eq(businesses.id, id)).returning();
  return biz;
}

export async function getBusinessUsers(businessId) {
  const rows = await db.select({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    role: users.role,
    assignmentId: userBusinesses.id,
    accessibleMenus: userBusinesses.accessibleMenus,
  })
    .from(userBusinesses)
    .innerJoin(users, eq(userBusinesses.userId, users.id))
    .where(eq(userBusinesses.businessId, businessId));
  return rows;
}

export async function assignUserToBusiness(userId, businessId, accessibleMenus = null) {
  // Check if already assigned
  const existing = await db.select().from(userBusinesses)
    .where(eq(userBusinesses.userId, userId))
    .then(rows => rows.filter(r => r.businessId === businessId));

  if (existing.length > 0) {
    throw Object.assign(new Error('User sudah di-assign ke bisnis ini.'), { status: 409 });
  }

  const [assignment] = await db.insert(userBusinesses).values({
    userId,
    businessId,
    accessibleMenus,
  }).returning();
  return assignment;
}

export async function updateUserAccess(userId, businessId, accessibleMenus) {
  const rows = await db.select().from(userBusinesses)
    .where(eq(userBusinesses.userId, userId))
    .then(r => r.filter(row => row.businessId === businessId));

  if (rows.length === 0) {
    throw Object.assign(new Error('Assignment tidak ditemukan.'), { status: 404 });
  }

  const [updated] = await db.update(userBusinesses)
    .set({ accessibleMenus })
    .where(eq(userBusinesses.id, rows[0].id))
    .returning();
  
  return updated;
}

export async function unassignUserFromBusiness(userId, businessId) {
  const rows = await db.select().from(userBusinesses)
    .where(eq(userBusinesses.userId, userId))
    .then(r => r.filter(row => row.businessId === businessId));

  if (rows.length === 0) {
    throw Object.assign(new Error('Assignment tidak ditemukan.'), { status: 404 });
  }

  await db.delete(userBusinesses).where(eq(userBusinesses.id, rows[0].id));
  return { message: 'User berhasil di-unassign dari bisnis.' };
}

export async function getAllUsers() {
  return await db.select({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    role: users.role,
  }).from(users).orderBy(users.displayName);
}
