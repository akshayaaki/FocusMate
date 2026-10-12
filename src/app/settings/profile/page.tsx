"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, User } from "lucide-react";

export default function ProfileSettingsPage() {
  const [displayName, setDisplayName] = React.useState("");
  const [timezone, setTimezone] = React.useState("Asia/Kolkata");
  const [weekStart, setWeekStart] = React.useState<"monday" | "sunday" | "saturday">("monday");
  const [themePreference, setThemePreference] = React.useState<"system" | "light" | "dark">("system");
  const [studyDailyTarget, setStudyDailyTarget] = React.useState("180");
  const [sleepTarget, setSleepTarget] = React.useState("7.5");
  const [currency, setCurrency] = React.useState("INR");
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const [profRes, prefsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (profRes.data) {
        setDisplayName(profRes.data.display_name || "");
        setTimezone(profRes.data.timezone || "Asia/Kolkata");
        setWeekStart(profRes.data.week_start || "monday");
        setThemePreference(profRes.data.theme_preference || "system");
      }

      if (prefsRes.data) {
        setStudyDailyTarget(String(prefsRes.data.study_daily_target_minutes || 180));
        setSleepTarget(String(prefsRes.data.sleep_target_hours || 7.5));
        setCurrency(prefsRes.data.currency || "INR");
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsSaving(false);
      return;
    }

    await Promise.all([
      supabase.from("profiles").update({
        display_name: displayName.trim(),
        timezone,
        week_start: weekStart,
        theme_preference: themePreference,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id),

      supabase.from("user_preferences").upsert({
        user_id: user.id,
        study_daily_target_minutes: parseInt(studyDailyTarget, 10) || 180,
        sleep_target_hours: parseFloat(sleepTarget) || 7.5,
        currency,
        updated_at: new Date().toISOString(),
      }),
    ]);

    setIsSaving(false);
    setSuccessMsg("Profile and preferences updated successfully.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="border-b border-border/70 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
            Profile & Student Preferences
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your student display identity, targets, and calendar week configuration
          </p>
        </div>

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>How FocusMate greets you in your private workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="dName">Display Name</Label>
                <Input
                  id="dName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tZone">Time Zone</Label>
                  <select
                    id="tZone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="wStart">Week Starts On</Label>
                  <select
                    id="wStart"
                    value={weekStart}
                    onChange={(e) => setWeekStart(e.target.value as any)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="monday">Monday</option>
                    <option value="sunday">Sunday</option>
                    <option value="saturday">Saturday</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Targets & Currency</CardTitle>
              <CardDescription>Default baselines for your Life Balance Score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="studyTarget">Study Target (min/day)</Label>
                  <Input
                    id="studyTarget"
                    type="number"
                    min="15"
                    step="15"
                    value={studyDailyTarget}
                    onChange={(e) => setStudyDailyTarget(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sleepTarget">Sleep Target (hrs)</Label>
                  <Input
                    id="sleepTarget"
                    type="number"
                    min="4"
                    max="12"
                    step="0.5"
                    value={sleepTarget}
                    onChange={(e) => setSleepTarget(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="curr">Currency</Label>
                  <select
                    id="curr"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" variant="sage" className="w-full" disabled={isSaving}>
            {isSaving ? "Saving Settings..." : "Save Preferences"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
