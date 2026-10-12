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
import { formatMinutes } from "@/lib/utils";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Square,
  Plus,
  BookOpen,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { StudyStatus } from "@/types/database";

interface SubjectItem {
  id: string;
  name: string;
  code: string | null;
  color: string;
}

interface StudySessionItem {
  id: string;
  title: string;
  planned_duration_minutes: number;
  actual_duration_minutes: number;
  status: StudyStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export default function StudyPage() {
  const [subjects, setSubjects] = React.useState<SubjectItem[]>([]);
  const [sessions, setSessions] = React.useState<StudySessionItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Focus Timer State
  const [timerMode, setTimerMode] = React.useState<"focus" | "short_break" | "long_break">("focus");
  const [focusDuration, setFocusDuration] = React.useState(25); // minutes
  const [secondsRemaining, setSecondsRemaining] = React.useState(25 * 60);
  const [timerActive, setTimerActive] = React.useState(false);
  const [sessionStartTime, setSessionStartTime] = React.useState<Date | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>("");
  const [sessionTopic, setSessionTopic] = React.useState("");

  // Modals
  const [showSubjectModal, setShowSubjectModal] = React.useState(false);
  const [newSubName, setNewSubName] = React.useState("");
  const [newSubCode, setNewSubCode] = React.useState("");
  const [newSubColor, setNewSubColor] = React.useState("#9CAEA9");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setSubjects([]);
      setSessions([]);
      setLoading(false);
      return;
    }

    const [subRes, sessRes] = await Promise.all([
      supabase.from("subjects").select("*").eq("user_id", user.id).order("name"),
      supabase.from("study_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    if (subRes.data) setSubjects(subRes.data as SubjectItem[]);
    if (sessRes.data) setSessions(sessRes.data as StudySessionItem[]);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Timer Tick
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && timerActive) {
      // Completed timer
      handleSessionComplete();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, secondsRemaining]);

  const startTimer = () => {
    if (!sessionStartTime) {
      setSessionStartTime(new Date());
    }
    setTimerActive(true);
  };

  const pauseTimer = () => {
    setTimerActive(false);
  };

  const resetTimer = () => {
    setTimerActive(false);
    const duration =
      timerMode === "focus"
        ? focusDuration
        : timerMode === "short_break"
        ? 5
        : 15;
    setSecondsRemaining(duration * 60);
    setSessionStartTime(null);
  };

  const switchMode = (mode: "focus" | "short_break" | "long_break") => {
    setTimerMode(mode);
    setTimerActive(false);
    setSessionStartTime(null);
    const duration = mode === "focus" ? focusDuration : mode === "short_break" ? 5 : 15;
    setSecondsRemaining(duration * 60);
  };

  const handleSessionComplete = async () => {
    setTimerActive(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user && timerMode === "focus") {
      const actualMinutes = Math.max(
        1,
        Math.round((focusDuration * 60 - secondsRemaining) / 60)
      );

      await supabase.from("study_sessions").insert({
        user_id: user.id,
        subject_id: selectedSubjectId || null,
        title: sessionTopic.trim() || "Focused Study Session",
        planned_duration_minutes: focusDuration,
        actual_duration_minutes: actualMinutes,
        status: "completed",
        started_at: sessionStartTime?.toISOString() || new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

      fetchData();
    }
    resetTimer();
  };

  const handleStopEarly = async () => {
    if (!sessionStartTime) {
      resetTimer();
      return;
    }

    const elapsedSeconds = focusDuration * 60 - secondsRemaining;
    const elapsedMinutes = Math.round(elapsedSeconds / 60);

    if (elapsedMinutes >= 1) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && timerMode === "focus") {
        await supabase.from("study_sessions").insert({
          user_id: user.id,
          subject_id: selectedSubjectId || null,
          title: sessionTopic.trim() || "Focused Study Session",
          planned_duration_minutes: focusDuration,
          actual_duration_minutes: elapsedMinutes,
          status: "completed",
          started_at: sessionStartTime.toISOString(),
          completed_at: new Date().toISOString(),
        });
        fetchData();
      }
    }
    resetTimer();
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("subjects").insert({
      user_id: user.id,
      name: newSubName.trim(),
      code: newSubCode.trim() || null,
      color: newSubColor,
    });

    setNewSubName("");
    setNewSubCode("");
    setShowSubjectModal(false);
    fetchData();
  };

  // Format Timer mm:ss
  const minutesDisplay = Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, "0");
  const secondsDisplay = (secondsRemaining % 60).toString().padStart(2, "0");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
              Study Planner & Focus Timer
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Deep focus intervals, subjects management, and study hour tracking
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSubjectModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Subject
          </Button>
        </div>

        {/* Focus Timer Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-brand-sage/40">
            <CardHeader className="text-center pb-2">
              <div className="inline-flex mx-auto rounded-lg border border-border p-1 bg-muted/40">
                <button
                  type="button"
                  onClick={() => switchMode("focus")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    timerMode === "focus"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Focus ({focusDuration}m)
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("short_break")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    timerMode === "short_break"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Short Break (5m)
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("long_break")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    timerMode === "long_break"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Long Break (15m)
                </button>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center py-8 space-y-6">
              {/* Timer Display */}
              <div className="text-6xl sm:text-7xl font-mono font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
                {minutesDisplay}:{secondsDisplay}
              </div>

              {/* Optional Subject & Topic */}
              <div className="w-full max-w-sm space-y-3">
                <Input
                  placeholder="What are you studying right now?"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  disabled={timerActive}
                  className="text-center"
                />

                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  disabled={timerActive}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">No subject assigned</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} {sub.code ? `(${sub.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {!timerActive ? (
                  <Button size="lg" variant="sage" className="px-8" onClick={startTimer}>
                    <Play className="h-5 w-5 mr-2" /> Start Focus
                  </Button>
                ) : (
                  <Button size="lg" variant="default" className="px-8" onClick={pauseTimer}>
                    <Pause className="h-5 w-5 mr-2" /> Pause
                  </Button>
                )}

                <Button size="lg" variant="outline" onClick={resetTimer}>
                  <RotateCcw className="h-5 w-5" />
                </Button>

                {timerActive && (
                  <Button size="lg" variant="destructive" onClick={handleStopEarly}>
                    <Square className="h-5 w-5 mr-2" /> Stop & Log
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subjects Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Registered Subjects</CardTitle>
                <CardDescription>Courses & modules</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSubjectModal(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No subjects added"
                  description="Add your courses or study areas to categorize sessions."
                  actionLabel="Add Subject"
                  onAction={() => setShowSubjectModal(true)}
                />
              ) : (
                <div className="space-y-2">
                  {subjects.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/70"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <div>
                          <p className="text-sm font-medium">{sub.name}</p>
                          {sub.code && (
                            <p className="text-xs text-muted-foreground">{sub.code}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Study Session History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Focus Sessions</CardTitle>
            <CardDescription>Actual time dedicated to study</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <EmptyState
                icon={Timer}
                title="No completed sessions yet"
                description="Start the focus timer above. When completed, your study history will be permanently recorded here."
              />
            ) : (
              <div className="space-y-2">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-border/70 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{sess.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {new Date(sess.created_at).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold">
                        {formatMinutes(sess.actual_duration_minutes)}
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        planned {sess.planned_duration_minutes}m
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Modal */}
        {showSubjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <h3 className="text-lg font-semibold text-brand-charcoal dark:text-brand-mist">
                  Add Academic Subject
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubject} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="subName">Subject Name *</Label>
                  <Input
                    id="subName"
                    placeholder="e.g. Operating Systems"
                    required
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subCode">Course Code</Label>
                  <Input
                    id="subCode"
                    placeholder="e.g. CS301"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subColor">Color Label</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="subColor"
                      type="color"
                      value={newSubColor}
                      onChange={(e) => setNewSubColor(e.target.value)}
                      className="h-10 w-16 p-1 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">{newSubColor}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSubjectModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="sage">
                    Save Subject
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
