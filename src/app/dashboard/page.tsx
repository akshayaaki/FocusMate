"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { calculateLifeBalanceScore, type LifeBalanceScoreResult } from "@/lib/analytics/balance-score";
import { formatMinutes, formatCurrency } from "@/lib/utils";
import {
  CheckSquare,
  Timer,
  Sparkles,
  Target,
  Wallet,
  Moon,
  Scale,
  Calendar as CalendarIcon,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { TaskPriority, TaskCategory } from "@/types/database";

interface DashboardData {
  tasks: Array<{
    id: string;
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
    status: string;
    due_date: string | null;
  }>;
  studyMinutesToday: number;
  studyTargetMinutes: number;
  habits: Array<{
    id: string;
    name: string;
    is_completed_today: boolean;
  }>;
  activeGoals: Array<{
    id: string;
    title: string;
    target_value: number;
    current_value: number;
    unit: string;
  }>;
  finance: {
    spentThisMonth: number;
    incomeThisMonth: number;
    currency: string;
  };
  sleepLastNightHours: number | null;
  wellbeingDoneToday: boolean;
  balanceScore: LifeBalanceScoreResult;
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [greeting, setGreeting] = React.useState("Welcome back");
  const [currentDateFormatted, setCurrentDateFormatted] = React.useState("");

  const loadDashboardData = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Determine greetings & date
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    setCurrentDateFormatted(
      now.toLocaleDateString("en-IN", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );

    if (!user) {
      // In local mode without active auth, present fresh zero-state
      const zeroBalance = calculateLifeBalanceScore({});
      setData({
        tasks: [],
        studyMinutesToday: 0,
        studyTargetMinutes: 180,
        habits: [],
        activeGoals: [],
        finance: { spentThisMonth: 0, incomeThisMonth: 0, currency: "INR" },
        sleepLastNightHours: null,
        wellbeingDoneToday: false,
        balanceScore: zeroBalance,
      });
      setLoading(false);
      return;
    }

    try {
      const todayStr = now.toISOString().split("T")[0];

      // 1. Fetch Tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("id, title, category, priority, status, due_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // 2. Fetch User Prefs
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("study_daily_target_minutes, sleep_target_hours, currency")
        .eq("user_id", user.id)
        .maybeSingle();

      const studyTargetMinutes = prefs?.study_daily_target_minutes || 180;
      const sleepTargetHours = Number(prefs?.sleep_target_hours || 7.5);
      const currency = prefs?.currency || "INR";

      // 3. Fetch Today's Study Sessions
      const { data: sessionsData } = await supabase
        .from("study_sessions")
        .select("actual_duration_minutes")
        .eq("user_id", user.id)
        .gte("created_at", `${todayStr}T00:00:00`);

      const studyMinutesToday = (sessionsData || []).reduce(
        (sum, s) => sum + (s.actual_duration_minutes || 0),
        0
      );

      // 4. Fetch Active Habits & Today's completions
      const { data: habitsData } = await supabase
        .from("habits")
        .select("id, name, scheduled_days")
        .eq("user_id", user.id)
        .eq("is_archived", false);

      const dayOfWeek = now.getDay();
      const scheduledHabits = (habitsData || []).filter((h) =>
        (h.scheduled_days as number[]).includes(dayOfWeek)
      );

      const { data: todayEntries } = await supabase
        .from("habit_entries")
        .select("habit_id, is_completed")
        .eq("user_id", user.id)
        .eq("entry_date", todayStr);

      const completedHabitIds = new Set(
        (todayEntries || []).filter((e) => e.is_completed).map((e) => e.habit_id)
      );

      const habitsList = scheduledHabits.map((h) => ({
        id: h.id,
        name: h.name,
        is_completed_today: completedHabitIds.has(h.id),
      }));

      // 5. Fetch Active Goals
      const { data: goalsData } = await supabase
        .from("goals")
        .select("id, title, target_value, current_value, unit")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(4);

      // 6. Fetch Finance this month
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const { data: txData } = await supabase
        .from("finance_transactions")
        .select("amount, transaction_type")
        .eq("user_id", user.id)
        .gte("transaction_date", firstOfMonth);

      let spentThisMonth = 0;
      let incomeThisMonth = 0;
      (txData || []).forEach((t) => {
        if (t.transaction_type === "expense") spentThisMonth += Number(t.amount);
        if (t.transaction_type === "income") incomeThisMonth += Number(t.amount);
      });

      // 7. Fetch Sleep Last Night
      const { data: sleepData } = await supabase
        .from("sleep_logs")
        .select("duration_minutes")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const sleepLastNightHours = sleepData ? sleepData.duration_minutes / 60 : null;

      // 8. Fetch Today's Wellbeing Check-in
      const { data: checkinData } = await supabase
        .from("wellbeing_checkins")
        .select("id")
        .eq("user_id", user.id)
        .eq("checkin_date", todayStr)
        .maybeSingle();

      const wellbeingDoneToday = Boolean(checkinData);

      // 9. Compute Life Balance Score
      const goalsAvgProgress =
        (goalsData || []).length > 0
          ? (goalsData || []).reduce(
              (acc, g) => acc + (Number(g.current_value) / Number(g.target_value)) * 100,
              0
            ) / (goalsData || []).length
          : undefined;

      const balanceScore = calculateLifeBalanceScore({
        studyActualMinutes: studyMinutesToday,
        studyTargetMinutes: studyTargetMinutes,
        sleepLoggedHours: sleepLastNightHours || undefined,
        sleepTargetHours: sleepTargetHours,
        habitsCompleted: completedHabitIds.size,
        habitsEligible: scheduledHabits.length || undefined,
        goalsActiveCount: (goalsData || []).length,
        goalsAverageProgress: goalsAvgProgress,
        wellbeingCheckinsCount: wellbeingDoneToday ? 1 : 0,
        wellbeingPeriodDays: 1,
      });

      setData({
        tasks: tasksData || [],
        studyMinutesToday,
        studyTargetMinutes,
        habits: habitsList,
        activeGoals: (goalsData as DashboardData["activeGoals"]) || [],
        finance: { spentThisMonth, incomeThisMonth, currency },
        sleepLastNightHours,
        wellbeingDoneToday,
        balanceScore,
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const supabase = createClient();
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    const completedAt = newStatus === "completed" ? new Date().toISOString() : null;

    await supabase
      .from("tasks")
      .update({ status: newStatus as any, completed_at: completedAt })
      .eq("id", taskId);

    loadDashboardData();
  };

  const toggleHabitEntry = async (habitId: string, isCompleted: boolean) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStr = new Date().toISOString().split("T")[0];

    if (isCompleted) {
      // Delete entry
      await supabase
        .from("habit_entries")
        .delete()
        .eq("habit_id", habitId)
        .eq("entry_date", todayStr);
    } else {
      // Insert or update entry
      await supabase.from("habit_entries").upsert({
        habit_id: habitId,
        user_id: user.id,
        entry_date: todayStr,
        is_completed: true,
      });
    }
    loadDashboardData();
  };

  return (
    <AppShell>
      <div className="space-y-8 animate-in fade-in-50">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
              {greeting}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4" />
              {currentDateFormatted}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="sage">
              <Link href="/tasks">
                <Plus className="h-4 w-4 mr-1.5" /> New Task
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/study">
                <Timer className="h-4 w-4 mr-1.5" /> Focus Timer
              </Link>
            </Button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Study Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Study Today
              </CardTitle>
              <Timer className="h-4 w-4 text-brand-slate" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMinutes(data?.studyMinutesToday || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Target: {formatMinutes(data?.studyTargetMinutes || 180)}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Habits Scheduled Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Habits Today
              </CardTitle>
              <Sparkles className="h-4 w-4 text-brand-slate" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.habits.filter((h) => h.is_completed_today).length || 0} / {data?.habits.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data?.habits.length === 0
                  ? "No habits scheduled today"
                  : "Scheduled routines"}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Monthly Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Spending This Month
              </CardTitle>
              <Wallet className="h-4 w-4 text-brand-slate" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data?.finance.spentThisMonth || 0, data?.finance.currency || "INR")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Income: {formatCurrency(data?.finance.incomeThisMonth || 0, data?.finance.currency || "INR")}
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Life Balance Score */}
          <Card className="border-brand-sage/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Life Balance
              </CardTitle>
              <Scale className="h-4 w-4 text-brand-slate" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {data?.balanceScore.totalScore !== null
                    ? `${data?.balanceScore.totalScore}/100`
                    : "—"}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {data?.balanceScore.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {data?.balanceScore.coveragePct}% data coverage
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid: Tasks & Habits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Tasks Due & Priorities */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Academic & Personal Tasks</CardTitle>
                  <CardDescription>Tasks scheduled or pending action</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/tasks" className="flex items-center gap-1">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading tasks...</div>
                ) : data?.tasks.length === 0 ? (
                  <EmptyState
                    icon={CheckSquare}
                    title="No tasks yet"
                    description="You have no tasks created. Add your first assignment, study goal, or routine."
                    actionLabel="Add Task"
                    actionHref="/tasks"
                  />
                ) : (
                  <div className="space-y-2">
                    {data?.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(task.id, task.status)}
                            className="text-muted-foreground hover:text-brand-charcoal dark:hover:text-brand-mist"
                          >
                            {task.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <div className="h-5 w-5 rounded border border-border" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                task.status === "completed"
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {task.title}
                            </p>
                            {task.due_date && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(task.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="capitalize text-[11px]">
                            {task.category.replace("_", " ")}
                          </Badge>
                          <Badge
                            variant={
                              task.priority === "urgent"
                                ? "destructive"
                                : task.priority === "high"
                                ? "warning"
                                : "outline"
                            }
                            className="capitalize text-[11px]"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Goals Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Academic & Personal Goals</CardTitle>
                  <CardDescription>Ongoing progress towards key milestones</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/goals" className="flex items-center gap-1">
                    Manage <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data?.activeGoals.length === 0 ? (
                  <EmptyState
                    icon={Target}
                    title="No active goals"
                    description="Set semester goals, GPA milestones, or personal habits to track progress."
                    actionLabel="Set a Goal"
                    actionHref="/goals"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data?.activeGoals.map((goal) => {
                      const pct = Math.min(
                        100,
                        Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100)
                      );
                      return (
                        <div key={goal.id} className="p-4 rounded-lg border border-border/70 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm truncate">{goal.title}</h4>
                            <span className="text-xs font-semibold">{pct}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-brand-charcoal dark:bg-brand-mist rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {goal.current_value} / {goal.target_value} {goal.unit}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Habits & Rest Check-in */}
          <div className="space-y-6">
            {/* Today's Habits */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Today&apos;s Habits</CardTitle>
                  <CardDescription>Routines scheduled for today</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/habits" className="flex items-center gap-1">
                    All <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data?.habits.length === 0 ? (
                  <EmptyState
                    icon={Sparkles}
                    title="No habits scheduled"
                    description="Build healthy routines like reading, hydration, or review sessions."
                    actionLabel="Create Habit"
                    actionHref="/habits"
                  />
                ) : (
                  <div className="space-y-2">
                    {data?.habits.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => toggleHabitEntry(h.id, h.is_completed_today)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                          h.is_completed_today
                            ? "bg-brand-mist/20 border-brand-sage/60 text-brand-charcoal dark:text-brand-mist"
                            : "border-border/70 hover:bg-muted/40"
                        }`}
                      >
                        <span className="text-sm font-medium">{h.name}</span>
                        {h.is_completed_today ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <div className="h-5 w-5 rounded border border-border" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Well-being & Rest Status */}
            <Card>
              <CardHeader>
                <CardTitle>Well-being & Rest</CardTitle>
                <CardDescription>Daily check-in and sleep awareness</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-lg border border-border/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Moon className="h-5 w-5 text-brand-slate" />
                    <div>
                      <p className="text-sm font-medium">Last Night&apos;s Sleep</p>
                      <p className="text-xs text-muted-foreground">
                        {data?.sleepLastNightHours !== null
                          ? `${data?.sleepLastNightHours.toFixed(1)} hours logged`
                          : "Not recorded yet"}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/wellbeing">Log Sleep</Link>
                  </Button>
                </div>

                <div className="p-3.5 rounded-lg border border-border/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-brand-slate" />
                    <div>
                      <p className="text-sm font-medium">Daily Reflection</p>
                      <p className="text-xs text-muted-foreground">
                        {data?.wellbeingDoneToday ? "Completed today" : "Pending check-in"}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant={data?.wellbeingDoneToday ? "outline" : "sage"}>
                    <Link href="/wellbeing">
                      {data?.wellbeingDoneToday ? "Edit Log" : "Check In"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
