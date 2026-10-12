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
import { calculateHabitStats, type HabitDefinition, type HabitEntryRecord, type HabitStats } from "@/lib/analytics/habits";
import {
  Sparkles,
  Plus,
  Flame,
  Award,
  CheckCircle2,
  Trash2,
  Archive,
  RotateCcw,
} from "lucide-react";
import type { HabitFreq } from "@/types/database";

interface HabitWithStats {
  habit: HabitDefinition & {
    description: string | null;
    category: string;
    is_measurable: boolean;
    target_quantity: number | null;
    unit: string | null;
    is_archived: boolean;
  };
  stats: HabitStats;
  todayCompleted: boolean;
  recentDays: Array<{ date: string; completed: boolean; isScheduled: boolean }>;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HabitsPage() {
  const [habitsData, setHabitsData] = React.useState<HabitWithStats[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // Form State
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("general");
  const [selectedDays, setSelectedDays] = React.useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [isMeasurable, setIsMeasurable] = React.useState(false);
  const [targetQuantity, setTargetQuantity] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchHabits = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setHabitsData([]);
      setLoading(false);
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Fetch habits and entries
    const [habitsRes, entriesRes] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("habit_entries").select("*").eq("user_id", user.id),
    ]);

    const rawHabits = (habitsRes.data || []) as any[];
    const rawEntries = (entriesRes.data || []) as HabitEntryRecord[];

    // Generate last 7 days window for mini-heatmap
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
    }

    const calculated: HabitWithStats[] = rawHabits.map((h) => {
      const habitDef: HabitDefinition = {
        id: h.id,
        name: h.name,
        frequency: h.frequency as HabitFreq,
        scheduled_days: h.scheduled_days as number[],
        start_date: h.start_date,
      };

      const stats = calculateHabitStats(habitDef, rawEntries, todayStr);

      const todayEntry = rawEntries.find(
        (e) => e.habit_id === h.id && e.entry_date === todayStr && e.is_completed
      );

      const recentDays = last7Days.map((dStr) => {
        const dObj = new Date(dStr);
        const dayOfWeek = dObj.getDay();
        const isScheduled = (h.scheduled_days as number[]).includes(dayOfWeek);
        const completed = rawEntries.some(
          (e) => e.habit_id === h.id && e.entry_date === dStr && e.is_completed
        );
        return { date: dStr, completed, isScheduled };
      });

      return {
        habit: {
          ...habitDef,
          description: h.description,
          category: h.category,
          is_measurable: h.is_measurable,
          target_quantity: h.target_quantity,
          unit: h.unit,
          is_archived: h.is_archived,
        },
        stats,
        todayCompleted: Boolean(todayEntry),
        recentDays,
      };
    });

    setHabitsData(calculated);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const toggleDaySelection = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("habits").insert({
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      category,
      frequency: selectedDays.length === 7 ? "daily" : "weekly_days",
      scheduled_days: selectedDays.length > 0 ? selectedDays : [0, 1, 2, 3, 4, 5, 6],
      is_measurable: isMeasurable,
      target_quantity: isMeasurable && targetQuantity ? parseFloat(targetQuantity) : null,
      unit: isMeasurable && unit ? unit.trim() : null,
    });

    if (!error) {
      setName("");
      setDescription("");
      setIsMeasurable(false);
      setTargetQuantity("");
      setUnit("");
      setShowCreateModal(false);
      fetchHabits();
    }
    setIsSubmitting(false);
  };

  const toggleHabitEntry = async (habitId: string, isCurrentlyCompleted: boolean) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStr = new Date().toISOString().split("T")[0];

    if (isCurrentlyCompleted) {
      await supabase
        .from("habit_entries")
        .delete()
        .eq("habit_id", habitId)
        .eq("entry_date", todayStr);
    } else {
      await supabase.from("habit_entries").upsert({
        habit_id: habitId,
        user_id: user.id,
        entry_date: todayStr,
        is_completed: true,
      });
    }

    fetchHabits();
  };

  const archiveHabit = async (habitId: string, currentArchived: boolean) => {
    const supabase = createClient();
    await supabase
      .from("habits")
      .update({ is_archived: !currentArchived })
      .eq("id", habitId);
    fetchHabits();
  };

  const deleteHabit = async (habitId: string) => {
    const supabase = createClient();
    await supabase.from("habits").delete().eq("id", habitId);
    fetchHabits();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
              Habit Tracker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cultivate consistency without guilt. Streaks calculated strictly on scheduled days.
            </p>
          </div>
          <Button variant="sage" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Habit
          </Button>
        </div>

        {/* Habits Cards */}
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading habits...</div>
        ) : habitsData.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No habits tracked yet"
            description="Create daily or scheduled habits like reading, hydration, morning revision, or exercise."
            actionLabel="Create Habit"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {habitsData.map(({ habit, stats, todayCompleted, recentDays }) => (
              <Card
                key={habit.id}
                className={habit.is_archived ? "opacity-60 bg-muted/20" : ""}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base truncate">{habit.name}</CardTitle>
                      {habit.is_archived && (
                        <Badge variant="outline" className="text-[10px]">
                          Archived
                        </Badge>
                      )}
                    </div>
                    {habit.description && (
                      <CardDescription className="line-clamp-1">
                        {habit.description}
                      </CardDescription>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => archiveHabit(habit.id, habit.is_archived)}
                      title={habit.is_archived ? "Restore Habit" : "Archive Habit"}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      {habit.is_archived ? (
                        <RotateCcw className="h-4 w-4" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteHabit(habit.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Streak and Completion Metrics */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/40 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                        <Flame className="h-4 w-4" />
                        {stats.currentStreak}
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Current Streak</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-1 text-sm font-bold text-brand-slate">
                        <Award className="h-4 w-4" />
                        {stats.longestStreak}
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Longest</p>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {stats.scheduledCompletionsRate}%
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Success Rate</p>
                    </div>
                  </div>

                  {/* 7-Day Mini Heatmap */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Past 7 Days</p>
                    <div className="flex items-center justify-between gap-1">
                      {recentDays.map((d) => {
                        const dayLabel = new Date(d.date).toLocaleDateString("en-US", { weekday: "narrow" });
                        return (
                          <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
                            <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
                            <div
                              title={`${d.date}: ${
                                d.completed
                                  ? "Completed"
                                  : d.isScheduled
                                  ? "Missed scheduled"
                                  : "Rest day (not scheduled)"
                              }`}
                              className={`h-7 w-full rounded-md border flex items-center justify-center transition-colors ${
                                d.completed
                                  ? "bg-brand-charcoal text-white dark:bg-brand-mist dark:text-brand-charcoal border-transparent"
                                  : !d.isScheduled
                                  ? "bg-muted/30 border-dashed border-border/40 text-muted-foreground/40"
                                  : "bg-background border-border/60"
                              }`}
                            >
                              {d.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                              {!d.isScheduled && <span className="text-[9px]">•</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Today Action Trigger */}
                  <Button
                    type="button"
                    variant={todayCompleted ? "secondary" : "sage"}
                    className="w-full justify-center"
                    onClick={() => toggleHabitEntry(habit.id, todayCompleted)}
                  >
                    {todayCompleted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                        Completed Today
                      </>
                    ) : (
                      "Mark Complete for Today"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Habit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <h3 className="text-lg font-semibold text-brand-charcoal dark:text-brand-mist">
                  Create Habit
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateHabit} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hName">Habit Name *</Label>
                  <Input
                    id="hName"
                    placeholder="e.g. Read 20 pages or Drink 2L water"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hDesc">Description</Label>
                  <Input
                    id="hDesc"
                    placeholder="Why this routine matters to you"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Scheduled Days */}
                <div className="space-y-2">
                  <Label>Scheduled Days</Label>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAY_NAMES.map((wName, idx) => {
                      const isSelected = selectedDays.includes(idx);
                      return (
                        <button
                          key={wName}
                          type="button"
                          onClick={() => toggleDaySelection(idx)}
                          className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                            isSelected
                              ? "bg-brand-charcoal text-white dark:bg-brand-mist dark:text-brand-charcoal border-transparent"
                              : "bg-background border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {wName}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Rest days are not penalized in streak calculations.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="sage" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Save Habit"}
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
