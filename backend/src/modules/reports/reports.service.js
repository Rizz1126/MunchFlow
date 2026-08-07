import { sql, eq, and, gte, lte } from 'drizzle-orm';
import db from '../../db/index.js';
import { cashTransactions, sales, saleItems } from '../../db/schema.js';

/**
 * Generate Profit & Loss report for a date range
 */
export function getProfitLoss(startDate, endDate) {
  // Gross Revenue (all income)
  const revenueResult = db.select({
    total: sql`COALESCE(SUM(${cashTransactions.amount}), 0)`.as('total'),
  }).from(cashTransactions)
    .where(and(
      eq(cashTransactions.type, 'income'),
      gte(cashTransactions.transactionDate, startDate),
      lte(cashTransactions.transactionDate, endDate),
    ))
    .get();

  // Total HPP/COGS from sales in the period
  const cogsResult = db.select({
    total: sql`COALESCE(SUM(${sales.totalHpp}), 0)`.as('total'),
  }).from(sales)
    .where(and(
      gte(sales.createdAt, startDate),
      lte(sales.createdAt, endDate + ' 23:59:59'),
    ))
    .get();

  // Operational expenses (non-COGS expenses)
  const opexResult = db.select({
    total: sql`COALESCE(SUM(${cashTransactions.amount}), 0)`.as('total'),
  }).from(cashTransactions)
    .where(and(
      eq(cashTransactions.type, 'expense'),
      sql`${cashTransactions.category} != 'Pembelian Bahan Baku'`,
      gte(cashTransactions.transactionDate, startDate),
      lte(cashTransactions.transactionDate, endDate),
    ))
    .get();

  // COGS from cash transactions (bahan baku purchases)
  const cogsExpenseResult = db.select({
    total: sql`COALESCE(SUM(${cashTransactions.amount}), 0)`.as('total'),
  }).from(cashTransactions)
    .where(and(
      eq(cashTransactions.type, 'expense'),
      eq(cashTransactions.category, 'Pembelian Bahan Baku'),
      gte(cashTransactions.transactionDate, startDate),
      lte(cashTransactions.transactionDate, endDate),
    ))
    .get();

  // Expense breakdown by category
  const expenseBreakdown = db.select({
    category: cashTransactions.category,
    total: sql`SUM(${cashTransactions.amount})`.as('total'),
  }).from(cashTransactions)
    .where(and(
      eq(cashTransactions.type, 'expense'),
      gte(cashTransactions.transactionDate, startDate),
      lte(cashTransactions.transactionDate, endDate),
    ))
    .groupBy(cashTransactions.category)
    .orderBy(sql`total DESC`)
    .all();

  // Income breakdown by category
  const incomeBreakdown = db.select({
    category: cashTransactions.category,
    total: sql`SUM(${cashTransactions.amount})`.as('total'),
  }).from(cashTransactions)
    .where(and(
      eq(cashTransactions.type, 'income'),
      gte(cashTransactions.transactionDate, startDate),
      lte(cashTransactions.transactionDate, endDate),
    ))
    .groupBy(cashTransactions.category)
    .orderBy(sql`total DESC`)
    .all();

  const grossRevenue = revenueResult.total;
  const totalCogs = cogsExpenseResult.total;
  const grossProfit = grossRevenue - totalCogs;
  const totalOpex = opexResult.total;
  const netProfit = grossProfit - totalOpex;
  const totalExpense = totalCogs + totalOpex;

  return {
    period: { startDate, endDate },
    grossRevenue,
    totalCogs,
    grossProfit,
    grossProfitMargin: grossRevenue > 0 ? (grossProfit / grossRevenue * 100) : 0,
    totalOpex,
    netProfit,
    netProfitMargin: grossRevenue > 0 ? (netProfit / grossRevenue * 100) : 0,
    totalExpense,
    expenseBreakdown,
    incomeBreakdown,
    salesHpp: cogsResult.total, // actual HPP from recipes used in sales
  };
}
