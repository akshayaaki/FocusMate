import { describe, it, expect } from "vitest";
import {
  calculateFinanceSummary,
  type TransactionItem,
} from "@/lib/analytics/finance";

describe("Student Finance Analytics Engine", () => {
  it("calculates exact totals avoiding floating point rounding errors", () => {
    // 0.1 + 0.2 in naive float equals 0.30000000000000004
    const transactions: TransactionItem[] = [
      { id: "1", amount: 0.1, transaction_type: "expense", category_id: "cat-1", transaction_date: "2026-10-01" },
      { id: "2", amount: 0.2, transaction_type: "expense", category_id: "cat-1", transaction_date: "2026-10-02" },
      { id: "3", amount: 1000.55, transaction_type: "income", category_id: "cat-2", transaction_date: "2026-10-01" },
    ];

    const summary = calculateFinanceSummary(transactions);
    expect(summary.totalExpenses).toBe(0.3);
    expect(summary.totalIncome).toBe(1000.55);
    expect(summary.netCashflow).toBe(1000.25);
  });

  it("handles refunds by reducing expenses", () => {
    const transactions: TransactionItem[] = [
      { id: "1", amount: 500, transaction_type: "expense", category_id: "cat-books", transaction_date: "2026-10-01" },
      { id: "2", amount: 100, transaction_type: "refund", category_id: "cat-books", transaction_date: "2026-10-03" },
    ];

    const summary = calculateFinanceSummary(transactions);
    expect(summary.totalExpenses).toBe(400);
    expect(summary.totalRefunds).toBe(100);
    expect(summary.categoryTotals["cat-books"]).toBe(400);
  });

  it("calculates budget utilization accurately", () => {
    const transactions: TransactionItem[] = [
      { id: "1", amount: 2500, transaction_type: "expense", category_id: null, transaction_date: "2026-10-01" },
    ];

    const summary = calculateFinanceSummary(transactions, {
      total_limit: 10000,
      currency: "INR",
    });

    expect(summary.budgetUtilizationPct).toBe(25);
  });
});
