import { eq, and, gte, lt, desc, sql } from 'drizzle-orm';
import db from '../../db/index.js';
import { cashTransactions } from '../../db/schema.js';

export async function createTransaction(data) {
  const [result] = await db.insert(cashTransactions).values({
    type: data.type,
    category: data.category,
    amount: data.amount,
    description: data.description || null,
    paymentMethod: data.paymentMethod || 'cash',
    relatedSaleId: data.relatedSaleId || null,
    createdBy: data.createdBy,
    transactionDate: data.transactionDate || new Date().toISOString().split('T')[0],
  }).returning();
  return result;
}

export async function getTransactions(filters = {}) {
  const conditions = [];

  if (filters.type) {
    conditions.push(eq(cashTransactions.type, filters.type));
  }
  if (filters.category) {
    conditions.push(eq(cashTransactions.category, filters.category));
  }
  if (filters.startDate) {
    conditions.push(gte(cashTransactions.transactionDate, filters.startDate));
  }
  if (filters.endDate) {
    const end = new Date(`${filters.endDate}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    conditions.push(lt(cashTransactions.transactionDate, end));
  }

  let query = db.select().from(cashTransactions).orderBy(desc(cashTransactions.createdAt));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const limit = filters.limit ? parseInt(filters.limit) : 200;
  query = query.limit(limit);

  return await query;
}

export async function getSummary(startDate, endDate) {
  const conditions = [];
  if (startDate) conditions.push(gte(cashTransactions.transactionDate, startDate));
  if (endDate) { const end = new Date(`${endDate}T00:00:00.000Z`); end.setUTCDate(end.getUTCDate() + 1); conditions.push(lt(cashTransactions.transactionDate, end)); }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [income] = await db.select({
    total: sql`COALESCE(SUM(${cashTransactions.amount}), 0)`.as('total'),
  }).from(cashTransactions)
    .where(whereClause ? and(eq(cashTransactions.type, 'income'), whereClause) : eq(cashTransactions.type, 'income'));

  const [expense] = await db.select({
    total: sql`COALESCE(SUM(${cashTransactions.amount}), 0)`.as('total'),
  }).from(cashTransactions)
    .where(whereClause ? and(eq(cashTransactions.type, 'expense'), whereClause) : eq(cashTransactions.type, 'expense'));

  return {
    totalIncome: income.total,
    totalExpense: expense.total,
    netProfit: income.total - expense.total,
    profitMargin: income.total > 0 ? ((income.total - expense.total) / income.total * 100) : 0,
  };
}

export async function getExpenseBreakdown(startDate, endDate) {
  const conditions = [eq(cashTransactions.type, 'expense')];
  if (startDate) conditions.push(gte(cashTransactions.transactionDate, startDate));
  if (endDate) { const end = new Date(`${endDate}T00:00:00.000Z`); end.setUTCDate(end.getUTCDate() + 1); conditions.push(lt(cashTransactions.transactionDate, end)); }

  return await db.select({
    category: cashTransactions.category,
    total: sql`SUM(${cashTransactions.amount})`.as('total'),
  }).from(cashTransactions)
    .where(and(...conditions))
    .groupBy(cashTransactions.category);
}
