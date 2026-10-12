"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Bell, CheckCircle2, AlertCircle } from "lucide-react";

export default function NotificationsSettingsPage() {
  const [inApp, setInApp] = React.useState(true);
  const [pushEnabled, setPushEnabled] = React.useState(false);
  const [emailEnabled, setEmailEnabled] = React.useState(false);
  const [taskReminders, setTaskReminders] = React.useState(true);
  const [habitReminders, setHabitReminders] = React.useState(true);
  const [studyReminders, setStudyReminders] = React.useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = React.useState(false);
  const [quietStart, setQuietStart] = React.useState("22:00");
  const [quietEnd, setQuietEnd] = React.useState("07:00");
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setInApp(data.in_app_enabled);
        setPushEnabled(data.push_enabled);
        setEmailEnabled(data.email_enabled);
        setTaskReminders(data.task_reminders);
        setHabitReminders(data.habit_reminders);
        setStudyReminders(data.study_reminders);
        setQuietHoursEnabled(data.quiet_hours_enabled);
        setQuietStart(data.quiet_hours_start || "22:00");
        setQuietEnd(data.quiet_hours_end || "07:00");
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

    await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      in_app_enabled: inApp,
      push_enabled: pushEnabled,
      email_enabled: emailEnabled,
      task_reminders: taskReminders,
      habit_reminders: habitReminders,
      study_reminders: studyReminders,
      quiet_hours_enabled: quietHoursEnabled,
      quiet_hours_start: quietStart,
      quiet_hours_end: quietEnd,
      updated_at: new Date().toISOString(),
    });

    setIsSaving(false);
    setSuccessMsg("Notification preferences saved.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="border-b border-border/70 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
            Notification Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure delivery channels, deadline reminders, and quiet hours
          </p>
        </div>

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Delivery Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery Channels</CardTitle>
              <CardDescription>
                Where you want FocusMate to notify you of pending academic commitments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* In App */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/70">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">In-App Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Display badge updates and notification menu in dashboard
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={inApp}
                  onChange={(e) => setInApp(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-charcoal dark:accent-brand-mist"
                />
              </div>

              {/* Browser Push */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/70">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Browser Push Notifications</p>
                    <Badge variant="outline" className="text-[10px]">
                      PWA Supported
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Receive alerts even when your browser tab is in background
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-charcoal dark:accent-brand-mist"
                />
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/70">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Email Notifications</p>
                    <Badge variant="outline" className="text-[10px]">
                      Provider Config Required
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Periodic summary digest of approaching assignment deadlines
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-charcoal dark:accent-brand-mist"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reminder Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reminder Types</CardTitle>
              <CardDescription>Select which modules trigger reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={taskReminders}
                  onChange={(e) => setTaskReminders(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-charcoal dark:accent-brand-mist"
                />
                <span>Task & Assignment Deadlines</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={habitReminders}
                  onChange={(e) => setHabitReminders(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-charcoal dark:accent-brand-mist"
                />
                <span>Scheduled Habit Routines</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={studyReminders}
                  onChange={(e) => setStudyReminders(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-charcoal dark:accent-brand-mist"
                />
                <span>Planned Study Sessions</span>
              </label>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quiet Hours</CardTitle>
              <CardDescription>
                Suppress all non-critical notifications during your resting hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium">
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-charcoal dark:accent-brand-mist"
                />
                <span>Enable Quiet Hours</span>
              </label>

              {quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="qStart">Starts At</Label>
                    <Input
                      id="qStart"
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="qEnd">Ends At</Label>
                    <Input
                      id="qEnd"
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" variant="sage" className="w-full" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Notification Preferences"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
