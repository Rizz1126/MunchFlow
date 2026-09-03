import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import db from '../../db/index.js';
import { users, userBusinesses, businesses } from '../../db/schema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is required.');

/**
 * Get assigned business IDs for a user
 */
async function getUserBusinessIds(userId) {
  const rows = await db.select({ businessId: userBusinesses.businessId })
    .from(userBusinesses)
    .where(eq(userBusinesses.userId, userId));
  return rows.map(r => r.businessId);
}

/**
 * Get assigned businesses (with details) for a user
 */
async function getUserBusinesses(userId) {
  const rows = await db.select({
    id: businesses.id,
    name: businesses.name,
    address: businesses.address,
    phone: businesses.phone,
    accessibleMenus: userBusinesses.accessibleMenus,
  })
    .from(userBusinesses)
    .innerJoin(businesses, eq(userBusinesses.businessId, businesses.id))
    .where(eq(userBusinesses.userId, userId));
  return rows;
}

export async function login(username, password) {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  
  if (!user) {
    throw Object.assign(new Error('Username atau password salah.'), { status: 401 });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) {
    throw Object.assign(new Error('Username atau password salah.'), { status: 401 });
  }

  const assignedBusinessIds = await getUserBusinessIds(user.id);
  const assignedBusinesses = await getUserBusinesses(user.id);

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      assignedBusinessIds,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      assignedBusinessIds,
      assignedBusinesses,
    },
  };
}

export async function getMe(userId) {
  const [user] = await db.select({
    id: users.id,
    username: users.username,
    role: users.role,
    displayName: users.displayName,
  }).from(users).where(eq(users.id, userId));

  if (!user) {
    throw Object.assign(new Error('User tidak ditemukan.'), { status: 404 });
  }

  const assignedBusinessIds = await getUserBusinessIds(user.id);
  const assignedBusinesses = await getUserBusinesses(user.id);

  return {
    ...user,
    assignedBusinessIds,
    assignedBusinesses,
  };
}
