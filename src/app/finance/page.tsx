"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { calculateFinanceSummary, type TransactionItem, type FinanceSummary } from "@/lib/analytics/finance";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Trash2,
  Calendar,
  PiggyBank,
} from "lucide-react";
import type { TransactionType } from "@/types/database";

interface FinanceCategoryItem {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface TransactionRecord extends TransactionItem {
  description: string;
  payment_method: string | null;
  currency: string;
  created_at: string;
}

export default function FinancePage() {
  const [transactions, setTransactions] = React.useState<TransactionRecord[]>([]);
  const [categories, setCategories] = React.useState<FinanceCategoryItem[]>([]);
  const [summary, setSummary] = React.useState<FinanceSummary | null>(null);
  const [budgetLimit, setBudgetLimit] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showBudgetModal, setShowBudgetModal] = React.useState(false);

  // Form State
  const [amount, setAmount] = React.useState("");
  const [type, setType] = React.useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [txDate, setTxDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = React.useState("UPI");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Budget state
  const [newBudgetInput, setNewBudgetInput] = React.useState("");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    const [txRes, catRes, budgetRes] = await Promise.all([
      supabase.from("finance_transactions").select("*").eq("user_id", user.id).order("transaction_date", { ascending: false }),
      supabase.from("finance_categories").select("*").eq("user_id", user.id).order("name"),
      supabase.from("budgets").select("total_limit, currency").eq("user_id", user.id).eq("month", curMonth).eq("year", curYear).maybeSingle(),
    ]);

    const rawTxs = (txRes.data || []) as TransactionRecord[];
    const rawCats = (catRes.data || []) as FinanceCategoryItem[];
    const budgetVal = budgetRes.data ? Number(budgetRes.data.total_limit) : null;

    setTransactions(rawTxs);
    setCategories(rawCats);
    setBudgetLimit(budgetVal);

    const calculatedSummary = calculateFinanceSummary(
      rawTxs,
      budgetVal !== null ? { total_limit: budgetVal, currency: "INR" } : null
    );
    setSummary(calculatedSummary);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsSubmitting(false);
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("finance_transactions").insert({
      user_id: user.id,
      amount: numericAmount,
      currency: "INR",
      transaction_type: type,
      category_id: categoryId || null,
      description: description.trim(),
      transaction_date: txDate,
      payment_method: paymentMethod.trim() || null,
    });

    if (!error) {
      setAmount("");
      setDescription("");
      setShowAddModal(false);
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const val = parseFloat(newBudgetInput);
    if (isNaN(val) || val < 0) return;

    const now = new Date();
    await supabase.from("budgets").upsert({
      user_id: user.id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      total_limit: val,
      currency: "INR",
    });

    setShowBudgetModal(false);
    fetchData();
  };

  const deleteTransaction = async (id: string) => {
    const supabase = createClient();
    await supabase.from("finance_transactions").delete().eq("id", id);
    fetchData();
  };

  // Filtered transactions
  const filteredTxs = transactions.filter((tx) =>
    tx.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
              Student Finance Tracker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track daily expenses, monthly allowances, and realistic student budgets
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBudgetModal(true)}>
              <PiggyBank className="h-4 w-4 mr-1.5" /> Set Monthly Budget
            </Button>
            <Button variant="sage" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Log Transaction
            </Button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary?.totalExpenses || 0, "INR")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.transactionCount || 0} recorded transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Income
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary?.totalIncome || 0, "INR")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Allowance / Stips</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Cashflow
              </CardTitle>
              <Wallet className="h-4 w-4 text-brand-slate" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  (summary?.netCashflow || 0) >= 0 ? "text-foreground" : "text-red-600"
                }`}
              >
                {formatCurrency(summary?.netCashflow || 0, "INR")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(summary?.netCashflow || 0) >= 0 ? "Positive balance" : "Deficit"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Budget
              </CardTitle>
              <PiggyBank className="h-4 w-4 text-brand-slate" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {budgetLimit !== null ? formatCurrency(budgetLimit, "INR") : "Not set"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.budgetUtilizationPct !== null
                  ? `${summary?.budgetUtilizationPct}% utilized`
                  : "Click above to set limit"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>All recorded income, expenses, and adjustments</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading transactions...</div>
            ) : filteredTxs.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title={transactions.length === 0 ? "No financial records" : "No matches found"}
                description={
                  transactions.length === 0
                    ? "Log your first expense or allowance to start tracking where your money goes."
                    : "No transactions matched your search query."
                }
                actionLabel="Log Transaction"
                onAction={() => setShowAddModal(true)}
              />
            ) : (
              <div className="space-y-2">
                {filteredTxs.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  const isExpense = tx.transaction_type === "expense";
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3.5 rounded-lg border border-border/70 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                            isExpense
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isExpense ? (
                            <ArrowDownRight className="h-5 w-5" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-medium truncate text-foreground">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(tx.transaction_date).toLocaleDateString()}</span>
                            {cat && <span>• {cat.name}</span>}
                            {tx.payment_method && <span>• {tx.payment_method}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-sm font-bold ${
                            isExpense ? "text-foreground" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isExpense ? "-" : "+"}
                          {formatCurrency(Number(tx.amount), tx.currency)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTransaction(tx.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Transaction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <h3 className="text-lg font-semibold text-brand-charcoal dark:text-brand-mist">
                  Log Transaction
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="txAmount">Amount (INR) *</Label>
                    <Input
                      id="txAmount"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 150.00"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="txType">Type</Label>
                    <select
                      id="txType"
                      value={type}
                      onChange={(e) => setType(e.target.value as TransactionType)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                      <option value="refund">Refund</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="txDesc">Description *</Label>
                  <Input
                    id="txDesc"
                    placeholder="e.g. Lunch at college canteen"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="txCat">Category</Label>
                    <select
                      id="txCat"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="txDate">Date</Label>
                    <Input
                      id="txDate"
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="txMethod">Payment Method</Label>
                  <Input
                    id="txMethod"
                    placeholder="e.g. UPI, Cash, Card"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="sage" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Record"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Set Budget Modal */}
        {showBudgetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <h3 className="text-lg font-semibold text-brand-charcoal dark:text-brand-mist">
                  Set Monthly Budget Limit
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveBudget} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bAmount">Monthly Spending Limit (INR) *</Label>
                  <Input
                    id="bAmount"
                    type="number"
                    step="100"
                    placeholder="e.g. 8000"
                    required
                    value={newBudgetInput}
                    onChange={(e) => setNewBudgetInput(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBudgetModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="sage">
                    Save Budget
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
