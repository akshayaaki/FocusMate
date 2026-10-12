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
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Trash2,
  TrendingUp,
} from "lucide-react";
import type { GoalCategory, GoalStatus } from "@/types/database";

interface GoalItem {
  id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: GoalStatus;
  created_at: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = React.useState<GoalItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [selectedGoalForProgress, setSelectedGoalForProgress] = React.useState<GoalItem | null>(null);

  // Form State
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<GoalCategory>("academic");
  const [targetValue, setTargetValue] = React.useState("100");
  const [currentValue, setCurrentValue] = React.useState("0");
  const [unit, setUnit] = React.useState("%");
  const [targetDate, setTargetDate] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Progress Update State
  const [progressVal, setProgressVal] = React.useState("");
  const [progressNotes, setProgressNotes] = React.useState("");

  const fetchGoals = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setGoals(data as GoalItem[]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      target_value: parseFloat(targetValue) || 100,
      current_value: parseFloat(currentValue) || 0,
      unit: unit.trim() || "%",
      target_date: targetDate,
      status: "active",
    });

    if (!error) {
      setTitle("");
      setDescription("");
      setTargetValue("100");
      setCurrentValue("0");
      setTargetDate("");
      setShowCreateModal(false);
      fetchGoals();
    }
    setIsSubmitting(false);
  };

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForProgress) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const val = parseFloat(progressVal);
    if (isNaN(val)) return;

    // Log progress history
    await supabase.from("goal_progress_entries").insert({
      goal_id: selectedGoalForProgress.id,
      user_id: user.id,
      value_recorded: val,
      notes: progressNotes.trim() || null,
    });

    // Update goal current_value
    const isCompleted = val >= selectedGoalForProgress.target_value;
    await supabase
      .from("goals")
      .update({
        current_value: val,
        status: isCompleted ? "completed" : selectedGoalForProgress.status,
      })
      .eq("id", selectedGoalForProgress.id);

    setSelectedGoalForProgress(null);
    setProgressVal("");
    setProgressNotes("");
    fetchGoals();
  };

  const deleteGoal = async (goalId: string) => {
    const supabase = createClient();
    await supabase.from("goals").delete().eq("id", goalId);
    fetchGoals();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
              Academic & Personal Goals
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Define measurable milestones for your semester and track verified progress
            </p>
          </div>
          <Button variant="sage" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Goal
          </Button>
        </div>

        {/* Goals Grid */}
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading goals...</div>
        ) : goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals set yet"
            description="Set your first academic goal, GPA milestone, skill objective, or health target."
            actionLabel="Create Goal"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const pct = Math.min(
                100,
                Math.round((goal.current_value / goal.target_value) * 100)
              );

              return (
                <Card key={goal.id}>
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base truncate">{goal.title}</CardTitle>
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {goal.category}
                        </Badge>
                      </div>
                      {goal.description && (
                        <CardDescription className="line-clamp-1">
                          {goal.description}
                        </CardDescription>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoal(goal.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Progress</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-brand-charcoal dark:bg-brand-mist rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span>
                          {goal.current_value} / {goal.target_value} {goal.unit}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Target: {new Date(goal.target_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <Badge
                        variant={goal.status === "completed" ? "success" : "secondary"}
                        className="capitalize text-xs"
                      >
                        {goal.status}
                      </Badge>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGoalForProgress(goal);
                          setProgressVal(String(goal.current_value));
                        }}
                      >
                        <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Log Progress
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Goal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <h3 className="text-lg font-semibold text-brand-charcoal dark:text-brand-mist">
                  Create Personal or Academic Goal
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gTitle">Goal Title *</Label>
                  <Input
                    id="gTitle"
                    placeholder="e.g. Achieve 9.0 SGPA in Semester 5"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gDesc">Description</Label>
                  <Input
                    id="gDesc"
                    placeholder="Context and purpose of this goal"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="gCategory">Category</Label>
                    <select
                      id="gCategory"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as GoalCategory)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="academic">Academic</option>
                      <option value="personal">Personal</option>
                      <option value="skill">Skill</option>
                      <option value="health">Health</option>
                      <option value="finance">Finance</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gUnit">Measurement Unit</Label>
                    <Input
                      id="gUnit"
                      placeholder="e.g. %, hours, books, GPA"
                      required
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="gTarget">Target Value *</Label>
                    <Input
                      id="gTarget"
                      type="number"
                      step="any"
                      required
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gCurrent">Current Starting Value</Label>
                    <Input
                      id="gCurrent"
                      type="number"
                      step="any"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gDate">Target Date *</Label>
                  <Input
                    id="gDate"
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
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
                    {isSubmitting ? "Saving..." : "Save Goal"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Log Progress Modal */}
        {selectedGoalForProgress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <h3 className="text-lg font-semibold text-brand-charcoal dark:text-brand-mist">
                  Log Progress: {selectedGoalForProgress.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedGoalForProgress(null)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleLogProgress} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pVal">
                    New Current Value ({selectedGoalForProgress.unit}) *
                  </Label>
                  <Input
                    id="pVal"
                    type="number"
                    step="any"
                    required
                    value={progressVal}
                    onChange={(e) => setProgressVal(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pNotes">Notes / Reflection</Label>
                  <Input
                    id="pNotes"
                    placeholder="e.g. Midterm results published"
                    value={progressNotes}
                    onChange={(e) => setProgressNotes(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedGoalForProgress(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="sage">
                    Record Update
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
