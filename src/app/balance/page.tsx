"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  calculateLifeBalanceScore,
  DEFAULT_WEIGHTS,
  type LifeBalanceScoreResult,
  type BalanceScoreWeights,
} from "@/lib/analytics/balance-score";
import {
  Scale,
  BookOpen,
  Moon,
  Sparkles,
  Target,
  Smile,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

export default function BalanceScorePage() {
  const [result, setResult] = React.useState<LifeBalanceScoreResult | null>(null);
  const [weights, setWeights] = React.useState<BalanceScoreWeights>(DEFAULT_WEIGHTS);
  const [loading, setLoading] = React.useState(true);
  const [editingWeights, setEditingWeights] = React.useState(false);
  const [weightInputs, setWeightInputs] = React.useState({
    study: "25",
    sleep: "25",
    habits: "20",
    goals: "20",
    wellbeing: "10",
  });
  const [weightError, setWeightError] = React.useState<string | null>(null);

  const fetchScoreData = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const zeroScore = calculateLifeBalanceScore({});
      setResult(zeroScore);
      setLoading(false);
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Fetch user preferences & custom weights
    const [weightRes, prefsRes, studyRes, habitsRes, entriesRes, goalsRes, sleepRes, checkinRes] =
      await Promise.all([
        supabase.from("balance_score_preferences").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_preferences").select("study_daily_target_minutes, sleep_target_hours").eq("user_id", user.id).maybeSingle(),
        supabase.from("study_sessions").select("actual_duration_minutes").eq("user_id", user.id).gte("created_at", `${todayStr}T00:00:00`),
        supabase.from("habits").select("id, scheduled_days").eq("user_id", user.id).eq("is_archived", false),
        supabase.from("habit_entries").select("habit_id, is_completed").eq("user_id", user.id).eq("entry_date", todayStr),
        supabase.from("goals").select("target_value, current_value").eq("user_id", user.id).eq("status", "active"),
        supabase.from("sleep_logs").select("duration_minutes").eq("user_id", user.id).order("log_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("wellbeing_checkins").select("id").eq("user_id", user.id).eq("checkin_date", todayStr).maybeSingle(),
      ]);

    let activeWeights = DEFAULT_WEIGHTS;
    const weightData = weightRes.data as any;
    if (weightData) {
      activeWeights = {
        study: Number(weightData.weight_study),
        sleep: Number(weightData.weight_sleep),
        habits: Number(weightData.weight_habits),
        goals: Number(weightData.weight_goals),
        wellbeing: Number(weightData.weight_wellbeing),
      };
      setWeights(activeWeights);
      setWeightInputs({
        study: String(Math.round(activeWeights.study * 100)),
        sleep: String(Math.round(activeWeights.sleep * 100)),
        habits: String(Math.round(activeWeights.habits * 100)),
        goals: String(Math.round(activeWeights.goals * 100)),
        wellbeing: String(Math.round(activeWeights.wellbeing * 100)),
      });
    }

    // Calculations
    const prefsData = prefsRes.data as any;
    const studyTarget = prefsData?.study_daily_target_minutes || 180;
    const studyActual = ((studyRes.data as any[]) || []).reduce((s, x) => s + (x.actual_duration_minutes || 0), 0);

    const sleepTarget = Number(prefsData?.sleep_target_hours || 7.5);
    const sleepData = sleepRes.data as any;
    const sleepActual = sleepData ? sleepData.duration_minutes / 60 : undefined;

    const dayOfWeek = today.getDay();
    const scheduledHabits = ((habitsRes.data as any[]) || []).filter((h) =>
      (h.scheduled_days as number[]).includes(dayOfWeek)
    );
    const completedHabitCount = ((entriesRes.data as any[]) || []).filter((e) => e.is_completed).length;

    const activeGoals = (goalsRes.data as any[]) || [];
    const goalsAvg =
      activeGoals.length > 0
        ? activeGoals.reduce((s, g) => s + (Number(g.current_value) / Number(g.target_value)) * 100, 0) /
          activeGoals.length
        : undefined;

    const checkinDone = Boolean(checkinRes.data);

    const computed = calculateLifeBalanceScore(
      {
        studyActualMinutes: studyActual > 0 ? studyActual : undefined,
        studyTargetMinutes: studyTarget,
        sleepLoggedHours: sleepActual,
        sleepTargetHours: sleepTarget,
        habitsCompleted: completedHabitCount,
        habitsEligible: scheduledHabits.length > 0 ? scheduledHabits.length : undefined,
        goalsActiveCount: activeGoals.length > 0 ? activeGoals.length : undefined,
        goalsAverageProgress: goalsAvg,
        wellbeingCheckinsCount: checkinDone ? 1 : undefined,
        wellbeingPeriodDays: 1,
      },
      activeWeights
    );

    setResult(computed);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchScoreData();
  }, [fetchScoreData]);

  const handleSaveWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    setWeightError(null);

    const wStudy = parseFloat(weightInputs.study) / 100;
    const wSleep = parseFloat(weightInputs.sleep) / 100;
    const wHabits = parseFloat(weightInputs.habits) / 100;
    const wGoals = parseFloat(weightInputs.goals) / 100;
    const wWellbeing = parseFloat(weightInputs.wellbeing) / 100;

    const total = Math.round((wStudy + wSleep + wHabits + wGoals + wWellbeing) * 100);
    if (total !== 100) {
      setWeightError(`Weights must total exactly 100%. Current total: ${total}%.`);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from("balance_score_preferences") as any).upsert({
      user_id: user.id,
      weight_study: wStudy,
      weight_sleep: wSleep,
      weight_habits: wHabits,
      weight_goals: wGoals,
      weight_wellbeing: wWellbeing,
      is_visible: true,
    });

    setEditingWeights(false);
    fetchScoreData();
  };

  const handleResetWeights = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from("balance_score_preferences") as any).upsert({
      user_id: user.id,
      weight_study: DEFAULT_WEIGHTS.study,
      weight_sleep: DEFAULT_WEIGHTS.sleep,
      weight_habits: DEFAULT_WEIGHTS.habits,
      weight_goals: DEFAULT_WEIGHTS.goals,
      weight_wellbeing: DEFAULT_WEIGHTS.wellbeing,
      is_visible: true,
    });

    setEditingWeights(false);
    fetchScoreData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
              Life Balance Score
            </h1>
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-brand-slate" />
              Transparent, deterministic student reflection. Never a competitive leaderboard.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingWeights(!editingWeights)}
          >
            {editingWeights ? "Close Weight Settings" : "Customize Weights"}
          </Button>
        </div>

        {/* Weights Customizer Box */}
        {editingWeights && (
          <Card className="border-brand-sage/60 animate-in fade-in-50">
            <CardHeader>
              <CardTitle className="text-base">Customize Dimension Weights</CardTitle>
              <CardDescription>
                Adjust the importance of each dimension according to your personal semester priorities. Total must equal 100%.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weightError && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{weightError}</span>
                </div>
              )}

              <form onSubmit={handleSaveWeights} className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Study (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={weightInputs.study}
                      onChange={(e) =>
                        setWeightInputs({ ...weightInputs, study: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sleep (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={weightInputs.sleep}
                      onChange={(e) =>
                        setWeightInputs({ ...weightInputs, sleep: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Habits (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={weightInputs.habits}
                      onChange={(e) =>
                        setWeightInputs({ ...weightInputs, habits: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Goals (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={weightInputs.goals}
                      onChange={(e) =>
                        setWeightInputs({ ...weightInputs, goals: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Reflection (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={weightInputs.wellbeing}
                      onChange={(e) =>
                        setWeightInputs({ ...weightInputs, wellbeing: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetWeights}
                    className="text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset to Defaults (25/25/20/20/10)
                  </Button>
                  <Button type="submit" variant="sage" size="sm">
                    Save Weights
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Score Overview Card */}
        <Card className="border-brand-sage/50">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-mist/30 text-xs font-semibold">
                  <span>Version {result?.scoringVersion}</span>
                  <span>•</span>
                  <span>{result?.coveragePct}% Data Coverage</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
                  {result?.status === "insufficient_data"
                    ? "Awaiting Sufficient Records"
                    : `${result?.totalScore} / 100`}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result?.summaryExplanation}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/40 border border-border/80 min-w-[200px]">
                <span className="text-5xl font-extrabold text-brand-charcoal dark:text-brand-mist font-mono">
                  {result?.totalScore !== null ? result?.totalScore : "—"}
                </span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Composite Score
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimension Breakdown Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-brand-charcoal dark:text-brand-mist">
            Component Dimensions Breakdown
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dimension 1: Study */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand-slate" /> Study Consistency
                </CardTitle>
                <Badge variant="outline" className="text-[11px]">
                  Weight {Math.round(weights.study * 100)}%
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">
                  {result?.dimensions.study.score !== null
                    ? `${result?.dimensions.study.score}%`
                    : "No Data"}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result?.dimensions.study.explanation}
                </p>
              </CardContent>
            </Card>

            {/* Dimension 2: Sleep */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Moon className="h-4 w-4 text-brand-slate" /> Sleep Routine
                </CardTitle>
                <Badge variant="outline" className="text-[11px]">
                  Weight {Math.round(weights.sleep * 100)}%
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">
                  {result?.dimensions.sleep.score !== null
                    ? `${result?.dimensions.sleep.score}%`
                    : "No Data"}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result?.dimensions.sleep.explanation}
                </p>
              </CardContent>
            </Card>

            {/* Dimension 3: Habits */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-slate" /> Habit Consistency
                </CardTitle>
                <Badge variant="outline" className="text-[11px]">
                  Weight {Math.round(weights.habits * 100)}%
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">
                  {result?.dimensions.habits.score !== null
                    ? `${result?.dimensions.habits.score}%`
                    : "No Data"}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result?.dimensions.habits.explanation}
                </p>
              </CardContent>
            </Card>

            {/* Dimension 4: Goals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-brand-slate" /> Goal Progress
                </CardTitle>
                <Badge variant="outline" className="text-[11px]">
                  Weight {Math.round(weights.goals * 100)}%
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">
                  {result?.dimensions.goals.score !== null
                    ? `${result?.dimensions.goals.score}%`
                    : "No Data"}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result?.dimensions.goals.explanation}
                </p>
              </CardContent>
            </Card>

            {/* Dimension 5: Well-being */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Smile className="h-4 w-4 text-brand-slate" /> Daily Reflection
                </CardTitle>
                <Badge variant="outline" className="text-[11px]">
                  Weight {Math.round(weights.wellbeing * 100)}%
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">
                  {result?.dimensions.wellbeing.score !== null
                    ? `${result?.dimensions.wellbeing.score}%`
                    : "No Data"}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result?.dimensions.wellbeing.explanation}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
