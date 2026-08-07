import { sql, eq, and, gte, lte } from 'drizzle-orm';
import db from '../../db/index.js';
import { cashTransactions, sales, saleItems, ingredients } from '../../db/schema.js';

/**
 * Get KPI data for a date range
 */
export function getKPI(startDate, endDate) {
  const incomeResult = db.select({
    total: sql`COALESCE(SUM(${cashTransactions.amount}), 0)`.as('total'),
  }).from(cashTransactions)
    .where(and(
      eq(cashTransactions.type, 'income'),
      gte(cashTransactions.transactionDate, startDate),
      lte(cashTransactions.transactionDate, endDate),
    ))
    .get();

  const expenseResult = db.select({
    total: sql`COALESCE(SUM(${cashTransactions.amount}), 0)`.as('total'),
  }).from(cashTransactions)
    .where(and(
      eq(cashTransactions.type, 'expense'),
      gte(cashTransactions.transactionDate, startDate),
      lte(cashTransactions.transactionDate, endDate),
    ))
    .get();

  const salesCountResult = db.select({
    count: sql`COUNT(*)`.as('count'),
  }).from(sales)
    .where(and(
      gte(sales.createdAt, startDate),
      lte(sales.createdAt, endDate + ' 23:59:59'),
    ))
    .get();

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
export function getSalesTrend(days = 14) {
  const results = db.select({
    date: cashTransactions.transactionDate,
    total: sql`SUM(${cashTransactions.amount})`.as('total'),
  }).from(cashTransactions)
    .where(and(
      eq(cashTransactions.type, 'income'),
      eq(cashTransactions.category, 'Penjualan Harian'),
      gte(cashTransactions.transactionDate, sql`date('now', 'localtime', '-${sql.raw(String(days))} days')`),
    ))
    .groupBy(cashTransactions.transactionDate)
    .orderBy(cashTransactions.transactionDate)
    .all();

  return results;
}

/**
 * Get expense composition for charts
 */
export function getExpenseComposition(startDate, endDate) {
  const conditions = [eq(cashTransactions.type, 'expense')];
  if (startDate) conditions.push(gte(cashTransactions.transactionDate, startDate));
  if (endDate) conditions.push(lte(cashTransactions.transactionDate, endDate));

  return db.select({
    category: cashTransactions.category,
    total: sql`SUM(${cashTransactions.amount})`.as('total'),
    count: sql`COUNT(*)`.as('count'),
  }).from(cashTransactions)
    .where(and(...conditions))
    .groupBy(cashTransactions.category)
    .orderBy(sql`total DESC`)
    .all();
}

/**
 * Get low stock alerts
 */
export function getLowStockAlerts() {
  return db.select().from(ingredients)
    .where(lte(ingredients.currentStock, ingredients.minimumStock))
    .orderBy(ingredients.name)
    .all();
}
