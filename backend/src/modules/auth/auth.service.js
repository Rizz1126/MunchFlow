import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import db from '../../db/index.js';
import { users } from '../../db/schema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'munchflow-secret';

export async function login(username, password) {
  const user = db.select().from(users).where(eq(users.username, username)).get();
  
  if (!user) {
    throw Object.assign(new Error('Username atau password salah.'), { status: 401 });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) {
    throw Object.assign(new Error('Username atau password salah.'), { status: 401 });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role, displayName: user.displayName },
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
    },
  };
}

export function getMe(userId) {
  const user = db.select({
    id: users.id,
    username: users.username,
    role: users.role,
    displayName: users.displayName,
  }).from(users).where(eq(users.id, userId)).get();

  if (!user) {
    throw Object.assign(new Error('User tidak ditemukan.'), { status: 404 });
  }

  return user;
}
