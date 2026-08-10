import { sql, eq, and, gte, lt } from 'drizzle-orm';
import db from '../../db/index.js';
import { cashTransactions, sales, saleItems, ingredients } from '../../db/schema.js';

/**
 * Get KPI data for a date range
 */
export async function getKPI(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  const [incomeResult] = await db.select({
    total: sql`COALESCE(SUM(${cashTransactions.amount}), 0)`.as('total'),
  }).from(cashTransactions)
    .where(and(
      eq(cashTransactions.type, 'income'),
      gte(cashTransactions.transactionDate, start),
      lt(cashTransactions.transactionDate, end),
    ));

  const [expenseResult] = await db.select({
    total: sql`COALESCE(SUM(${cashTransactions.amount}), 0)`.as('total'),
  }).from(cashTransactions)
    .where(and(
      eq(cashTransactions.type, 'expense'),
      gte(cashTransactions.transactionDate, start),
      lt(cashTransactions.transactionDate, end),
    ));

  const [salesCountResult] = await db.select({
    count: sql`COUNT(*)`.as('count'),
  }).from(sales)
    .where(and(
      gte(sales.createdAt, start),
      lt(sales.createdAt, end),
    ));

  const totalIncome = incomeResult.total;
  const totalExpense = expenseResult.total;
  const netProfit = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    netProfit,
    profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0,
    salesCount: salesCountResult.count,
  };
}

/**
 * Get daily sales trend for the last N days
 */
export async function getSalesTrend(days = 14) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const cutoffDate = d.toISOString().split('T')[0];

  const results = await db.select({
    date: cashTransactions.transactionDate,
    total: sql`SUM(${cashTransactions.amount})`.as('total'),
  }).from(cashTransactions)
    .where(and(
      eq(cashTransactions.type, 'income'),
      eq(cashTransactions.category, 'Penjualan Harian'),
      gte(cashTransactions.transactionDate, cutoffDate),
    ))
    .groupBy(cashTransactions.transactionDate)
    .orderBy(cashTransactions.transactionDate);

  return results;
}

/**
 * Get expense composition for charts
 */
export async function getExpenseComposition(startDate, endDate) {
  const conditions = [eq(cashTransactions.type, 'expense')];
  if (startDate) conditions.push(gte(cashTransactions.transactionDate, new Date(`${startDate}T00:00:00.000Z`)));
  if (endDate) { const end = new Date(`${endDate}T00:00:00.000Z`); end.setUTCDate(end.getUTCDate() + 1); conditions.push(lt(cashTransactions.transactionDate, end)); }

  return await db.select({
    category: cashTransactions.category,
    total: sql`SUM(${cashTransactions.amount})`.as('total'),
    count: sql`COUNT(*)`.as('count'),
  }).from(cashTransactions)
    .where(and(...conditions))
    .groupBy(cashTransactions.category)
    .orderBy(sql`total DESC`);
}

/**
 * Get low stock alerts
 */
export async function getLowStockAlerts() {
  return await db.select().from(ingredients)
    .where(lte(ingredients.currentStock, ingredients.minimumStock))
    .orderBy(ingredients.name);
}
