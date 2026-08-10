import { sql, eq, and, gte, lt } from 'drizzle-orm';
import db from '../../db/index.js';
import { cashTransactions, sales } from '../../db/schema.js';

export async function getProfitLoss(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00.000Z`), end = new Date(`${endDate}T00:00:00.000Z`); end.setUTCDate(end.getUTCDate() + 1);
  const period = (column) => and(gte(column, start), lt(column, end));
  const incomeWhere = and(eq(cashTransactions.type, 'income'), period(cashTransactions.transactionDate));
  const expenseWhere = and(eq(cashTransactions.type, 'expense'), period(cashTransactions.transactionDate));
  const [revenue, cogs, opex, cogsExpense, expenseBreakdown, incomeBreakdown] = await Promise.all([
    db.select({ total: sql`COALESCE(SUM(${cashTransactions.amount}), 0)`.as('total') }).from(cashTransactions).where(incomeWhere),
    db.select({ total: sql`COALESCE(SUM(${sales.totalHpp}), 0)`.as('total') }).from(sales).where(period(sales.createdAt)),
    db.select({ total: sql`COALESCE(SUM(${cashTransactions.amount}), 0)`.as('total') }).from(cashTransactions).where(and(expenseWhere, sql`${cashTransactions.category} != 'Pembelian Bahan Baku'`)),
    db.select({ total: sql`COALESCE(SUM(${cashTransactions.amount}), 0)`.as('total') }).from(cashTransactions).where(and(expenseWhere, eq(cashTransactions.category, 'Pembelian Bahan Baku'))),
    db.select({ category: cashTransactions.category, total: sql`SUM(${cashTransactions.amount})`.as('total') }).from(cashTransactions).where(expenseWhere).groupBy(cashTransactions.category).orderBy(sql`total DESC`),
    db.select({ category: cashTransactions.category, total: sql`SUM(${cashTransactions.amount})`.as('total') }).from(cashTransactions).where(incomeWhere).groupBy(cashTransactions.category).orderBy(sql`total DESC`),
  ]);
  const grossRevenue = Number(revenue[0].total || 0), totalCogs = Number(cogsExpense[0].total || 0), totalOpex = Number(opex[0].total || 0), grossProfit = grossRevenue - totalCogs;
  return { period: { startDate, endDate }, grossRevenue, totalCogs, grossProfit, grossProfitMargin: grossRevenue ? grossProfit / grossRevenue * 100 : 0, totalOpex,
    netProfit: grossProfit - totalOpex, netProfitMargin: grossRevenue ? (grossProfit - totalOpex) / grossRevenue * 100 : 0, totalExpense: totalCogs + totalOpex,
    expenseBreakdown, incomeBreakdown, salesHpp: Number(cogs[0].total || 0) };
}