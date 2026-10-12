/**
 * Student Finance Analytics Engine
 * Exact decimal calculations avoiding floating-point precision issues.
 */

export interface TransactionItem {
  id: string;
  amount: number;
  transaction_type: "expense" | "income" | "refund";
  category_id: string | null;
  transaction_date: string;
}

export interface BudgetLimit {
  total_limit: number;
  currency: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  totalRefunds: number;
  netCashflow: number;
  transactionCount: number;
  budgetUtilizationPct: number | null;
  categoryTotals: Record<string, number>;
}

// Helper to convert float number to integer cents/paise
function toCents(val: number): number {
  return Math.round(val * 100);
}

// Convert integer cents back to 2-decimal number
function fromCents(cents: number): number {
  return cents / 100;
}

export function calculateFinanceSummary(
  transactions: TransactionItem[],
  budget?: BudgetLimit | null
): FinanceSummary {
  let incomeCents = 0;
  let expenseCents = 0;
  let refundCents = 0;
  const categoryMapCents: Record<string, number> = {};

  for (const tx of transactions) {
    const txCents = toCents(tx.amount);
    const catKey = tx.category_id || "uncategorized";

    if (tx.transaction_type === "income") {
      incomeCents += txCents;
    } else if (tx.transaction_type === "expense") {
      expenseCents += txCents;
      categoryMapCents[catKey] = (categoryMapCents[catKey] || 0) + txCents;
    } else if (tx.transaction_type === "refund") {
      refundCents += txCents;
      // Refund reduces expenses
      expenseCents = Math.max(0, expenseCents - txCents);
      if (categoryMapCents[catKey]) {
        categoryMapCents[catKey] = Math.max(0, categoryMapCents[catKey] - txCents);
      }
    }
  }

  const netCents = incomeCents - expenseCents;

  const categoryTotals: Record<string, number> = {};
  for (const [key, cents] of Object.entries(categoryMapCents)) {
    categoryTotals[key] = fromCents(cents);
  }

  let budgetUtilizationPct: number | null = null;
  if (budget && budget.total_limit > 0) {
    const budgetCents = toCents(budget.total_limit);
    budgetUtilizationPct = Math.round((expenseCents / budgetCents) * 100);
  }

  return {
    totalIncome: fromCents(incomeCents),
    totalExpenses: fromCents(expenseCents),
    totalRefunds: fromCents(refundCents),
    netCashflow: fromCents(netCents),
    transactionCount: transactions.length,
    budgetUtilizationPct,
    categoryTotals,
  };
}
