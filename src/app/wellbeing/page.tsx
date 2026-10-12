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
  Moon,
  Smile,
  Zap,
  Activity,
  Plus,
  Trash2,
  Calendar,
  Lock,
} from "lucide-react";

interface SleepRecord {
  id: string;
  sleep_start: string;
  sleep_end: string;
  duration_minutes: number;
  quality_rating: number | null;
  notes: string | null;
  log_date: string;
}

interface WellbeingCheckin {
  id: string;
  checkin_date: string;
  mood_score: number | null;
  energy_score: number | null;
  stress_level: number | null;
  self_care_activities: string[];
  journal_notes: string | null;
}

const SELF_CARE_OPTIONS = [
  "Outdoor Walk",
  "Hydration Goal",
  "Meditation / Breathwork",
  "Reading for Fun",
  "Healthy Meal",
  "Screen-Free Time",
  "Connected with Friends",
];

export default function WellbeingPage() {
  const [sleepLogs, setSleepLogs] = React.useState<SleepRecord[]>([]);
  const [todayCheckin, setTodayCheckin] = React.useState<WellbeingCheckin | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showSleepModal, setShowSleepModal] = React.useState(false);

  // Sleep Form
  const [sleepStart, setSleepStart] = React.useState("23:30");
  const [sleepEnd, setSleepEnd] = React.useState("07:00");
  const [logDate, setLogDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [qualityRating, setQualityRating] = React.useState("4");
  const [sleepNotes, setSleepNotes] = React.useState("");

  // Check-in Form
  const [moodScore, setMoodScore] = React.useState<number>(4);
  const [energyScore, setEnergyScore] = React.useState<number>(3);
  const [stressLevel, setStressLevel] = React.useState<number>(2);
  const [selectedActivities, setSelectedActivities] = React.useState<string[]>([]);
  const [journalNotes, setJournalNotes] = React.useState("");
  const [isSavingCheckin, setIsSavingCheckin] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const [sleepRes, checkinRes] = await Promise.all([
      supabase.from("sleep_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: false }).limit(14),
      supabase.from("wellbeing_checkins").select("*").eq("user_id", user.id).eq("checkin_date", todayStr).maybeSingle(),
    ]);

    if (sleepRes.data) setSleepLogs(sleepRes.data as SleepRecord[]);
    if (checkinRes.data) {
      const c = checkinRes.data as WellbeingCheckin;
      setTodayCheckin(c);
      if (c.mood_score) setMoodScore(c.mood_score);
      if (c.energy_score) setEnergyScore(c.energy_score);
      if (c.stress_level) setStressLevel(c.stress_level);
      if (c.self_care_activities) setSelectedActivities(c.self_care_activities);
      if (c.journal_notes) setJournalNotes(c.journal_notes);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Calculate duration handling midnight crossing
    const [sH, sM] = sleepStart.split(":").map(Number);
    const [eH, eM] = sleepEnd.split(":").map(Number);

    let startMinutes = sH * 60 + sM;
    let endMinutes = eH * 60 + eM;

    // If wake time is earlier than sleep start, add 24 hours
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    const durationMinutes = endMinutes - startMinutes;

    const startDate = new Date(`${logDate}T${sleepStart}:00`);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    await supabase.from("sleep_logs").insert({
      user_id: user.id,
      sleep_start: startDate.toISOString(),
      sleep_end: endDate.toISOString(),
      duration_minutes: durationMinutes,
      quality_rating: parseInt(qualityRating, 10),
      notes: sleepNotes.trim() || null,
      log_date: logDate,
    });

    setShowSleepModal(false);
    setSleepNotes("");
    fetchData();
  };

  const handleSaveCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCheckin(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSavingCheckin(false);
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    await supabase.from("wellbeing_checkins").upsert({
      user_id: user.id,
      checkin_date: todayStr,
      mood_score: moodScore,
      energy_score: energyScore,
      stress_level: stressLevel,
      self_care_activities: selectedActivities,
      journal_notes: journalNotes.trim() || null,
    });

    setIsSavingCheckin(false);
    fetchData();
  };

  const deleteSleepLog = async (id: string) => {
    const supabase = createClient();
    await supabase.from("sleep_logs").delete().eq("id", id);
    fetchData();
  };

  const toggleActivity = (act: string) => {
    setSelectedActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
              Sleep & Well-being Journal
            </h1>
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-brand-slate" />
              Private reflection space. FocusMate never diagnoses medical conditions.
            </p>
          </div>
          <Button variant="sage" onClick={() => setShowSleepModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Log Sleep
          </Button>
        </div>

        {/* Top Grid: Daily Reflection & Sleep History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Reflection Form */}
          <Card className="border-brand-sage/40">
            <CardHeader>
              <CardTitle>Daily Self-Awareness Reflection</CardTitle>
              <CardDescription>
                A neutral check-in for self-reflection. Mood choices are never penalized in your balance score.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCheckin} className="space-y-5">
                {/* Mood Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <Label className="flex items-center gap-1.5">
                      <Smile className="h-4 w-4 text-brand-slate" /> Mood
                    </Label>
                    <span className="font-semibold text-xs">{moodScore} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={moodScore}
                    onChange={(e) => setMoodScore(Number(e.target.value))}
                    className="w-full accent-brand-charcoal dark:accent-brand-mist"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Low</span>
                    <span>Neutral</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Energy Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <Label className="flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-500" /> Energy
                    </Label>
                    <span className="font-semibold text-xs">{energyScore} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={energyScore}
                    onChange={(e) => setEnergyScore(Number(e.target.value))}
                    className="w-full accent-brand-charcoal dark:accent-brand-mist"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Exhausted</span>
                    <span>Balanced</span>
                    <span>Vibrant</span>
                  </div>
                </div>

                {/* Stress Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <Label className="flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-brand-slate" /> Academic Stress
                    </Label>
                    <span className="font-semibold text-xs">{stressLevel} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(Number(e.target.value))}
                    className="w-full accent-brand-charcoal dark:accent-brand-mist"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Calm</span>
                    <span>Manageable</span>
                    <span>Intense</span>
                  </div>
                </div>

                {/* Self Care Tags */}
                <div className="space-y-2">
                  <Label>Self-Care Activities</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {SELF_CARE_OPTIONS.map((act) => {
                      const isSel = selectedActivities.includes(act);
                      return (
                        <button
                          key={act}
                          type="button"
                          onClick={() => toggleActivity(act)}
                          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                            isSel
                              ? "bg-brand-charcoal text-white dark:bg-brand-mist dark:text-brand-charcoal border-transparent font-medium"
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {act}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Private Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="journal">Private Reflection Notes</Label>
                  <textarea
                    id="journal"
                    rows={3}
                    placeholder="Private reflection on today's classes and routine..."
                    value={journalNotes}
                    onChange={(e) => setJournalNotes(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <Button type="submit" variant="sage" className="w-full" disabled={isSavingCheckin}>
                  {isSavingCheckin ? "Saving Reflection..." : "Save Today's Reflection"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sleep Logs History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sleep Log History</CardTitle>
                <CardDescription>Rest duration and perceived quality</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowSleepModal(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Log
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading sleep logs...</div>
              ) : sleepLogs.length === 0 ? (
                <EmptyState
                  icon={Moon}
                  title="No sleep recorded yet"
                  description="Keep track of your rest duration to understand your recovery and energy levels."
                  actionLabel="Log Sleep"
                  onAction={() => setShowSleepModal(true)}
                />
              ) : (
                <div className="space-y-2.5">
                  {sleepLogs.map((log) => {
                    const hours = (log.duration_minutes / 60).toFixed(1);
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3.5 rounded-lg border border-border/70 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Moon className="h-5 w-5 text-brand-slate shrink-0" />
                          <div>
                            <p className="text-sm font-semibold">{hours} hours</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {new Date(log.log_date).toLocaleDateString()}
                              {log.quality_rating && (
                                <span>• Quality: {log.quality_rating}/5</span>
                              )}
                            </p>
                            {log.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {log.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSleepLog(log.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sleep Modal */}
        {showSleepModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <h3 className="text-lg font-semibold text-brand-charcoal dark:text-brand-mist">
                  Log Sleep Record
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSleepModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleLogSleep} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sDate">Sleep Night Date *</Label>
                  <Input
                    id="sDate"
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sStart">Fell Asleep *</Label>
                    <Input
                      id="sStart"
                      type="time"
                      required
                      value={sleepStart}
                      onChange={(e) => setSleepStart(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sEnd">Woke Up *</Label>
                    <Input
                      id="sEnd"
                      type="time"
                      required
                      value={sleepEnd}
                      onChange={(e) => setSleepEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sQuality">Quality Rating (1 to 5)</Label>
                  <select
                    id="sQuality"
                    value={qualityRating}
                    onChange={(e) => setQualityRating(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="5">5 - Deep, Restorative Sleep</option>
                    <option value="4">4 - Good Rest</option>
                    <option value="3">3 - Fair / Average</option>
                    <option value="2">2 - Restless / Interrupted</option>
                    <option value="1">1 - Poor / Insomnia</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sNotes">Optional Notes</Label>
                  <Input
                    id="sNotes"
                    placeholder="e.g. Studied late before bed"
                    value={sleepNotes}
                    onChange={(e) => setSleepNotes(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSleepModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="sage">
                    Save Sleep Log
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
