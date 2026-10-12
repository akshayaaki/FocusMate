"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Download, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function DataPrivacySettingsPage() {
  const router = useRouter();
  const [isExporting, setIsExporting] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleExportAllData = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg("Authentication required to export data.");
        setIsExporting(false);
        return;
      }

      // Query all user-owned records
      const [
        profileRes,
        tasksRes,
        studyRes,
        habitsRes,
        habitEntriesRes,
        goalsRes,
        financeRes,
        sleepRes,
        wellbeingRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("study_sessions").select("*").eq("user_id", user.id),
        supabase.from("habits").select("*").eq("user_id", user.id),
        supabase.from("habit_entries").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("finance_transactions").select("*").eq("user_id", user.id),
        supabase.from("sleep_logs").select("*").eq("user_id", user.id),
        supabase.from("wellbeing_checkins").select("*").eq("user_id", user.id),
      ]);

      const fullArchive = {
        exportedAt: new Date().toISOString(),
        studentId: user.id,
        profile: profileRes.data,
        tasks: tasksRes.data,
        studySessions: studyRes.data,
        habits: habitsRes.data,
        habitEntries: habitEntriesRes.data,
        goals: goalsRes.data,
        financeTransactions: financeRes.data,
        sleepLogs: sleepRes.data,
        wellbeingCheckins: wellbeingRes.data,
      };

      const jsonStr = JSON.stringify(fullArchive, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `focusmate_data_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to export data archive.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePermanentAccountDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmation !== "DELETE") {
      setErrorMsg('You must type "DELETE" to confirm permanent account deletion.');
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsDeleting(false);
        return;
      }

      // Delete user records cascade from profiles
      await supabase.from("profiles").delete().eq("id", user.id);

      // Sign out
      await supabase.auth.signOut();
      router.push("/login?message=account_deleted");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to execute account deletion.");
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="border-b border-border/70 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
            Data Rights & Account Deletion
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete data transparency, exportable backups, and self-service account eradication
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4 text-brand-slate" /> Export Complete Student Archive
            </CardTitle>
            <CardDescription>
              Download a full machine-readable JSON backup containing every record you created in FocusMate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your export includes all tasks, study sessions, recorded habits and entries, financial transactions, sleep logs, and private journal reflections.
            </p>
            <Button
              variant="outline"
              onClick={handleExportAllData}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Generating Archive..." : "Download JSON Data Export"}
            </Button>
          </CardContent>
        </Card>

        {/* Permanent Account Deletion */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Permanent Account Deletion
            </CardTitle>
            <CardDescription>
              Irreversible action. Deletes your student identity, all tasks, history, and records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-lg bg-destructive/5 border border-destructive/15 text-xs text-muted-foreground leading-relaxed">
              <strong>Warning:</strong> Deleting your account will immediately remove all your personal data from the active database. This action cannot be reversed.
            </div>

            <form onSubmit={handlePermanentAccountDeletion} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="delConfirm" className="text-xs">
                  Type <span className="font-bold text-destructive">DELETE</span> to confirm
                </Label>
                <Input
                  id="delConfirm"
                  placeholder="DELETE"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  disabled={isDeleting}
                />
              </div>

              <Button
                type="submit"
                variant="destructive"
                disabled={deleteConfirmation !== "DELETE" || isDeleting}
              >
                {isDeleting ? "Erasing Data..." : "Permanently Erase Account & All Data"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
