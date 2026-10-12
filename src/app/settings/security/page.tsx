"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Shield, CheckCircle2, AlertCircle, KeyRound, Monitor } from "lucide-react";

export default function SecuritySettingsPage() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [lastSignIn, setLastSignIn] = React.useState<string | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || null);
        setUserId(user.id);
        setLastSignIn(user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : null);
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      setIsUpdating(false);
      return;
    }

    if (password.length < 8) {
      setMessage({ text: "Password must be at least 8 characters long.", type: "error" });
      setIsUpdating(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "Password updated successfully.", type: "success" });
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to update password.", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="border-b border-border/70 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
            Account Security & Authentication
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your credentials and active session security
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-brand-slate" /> Change Password
            </CardTitle>
            <CardDescription>Update your login credentials securely</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPass">New Password</Label>
                <Input
                  id="newPass"
                  type="password"
                  placeholder="At least 8 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isUpdating}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPass">Confirm New Password</Label>
                <Input
                  id="confirmPass"
                  type="password"
                  placeholder="Repeat new password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isUpdating}
                />
              </div>

              <Button type="submit" variant="sage" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4 text-brand-slate" /> Active Session
            </CardTitle>
            <CardDescription>Security context and session metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/70">
              <span className="text-muted-foreground">Account Email</span>
              <span className="font-mono text-xs">{userEmail || "—"}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/70">
              <span className="text-muted-foreground">User UUID</span>
              <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                {userId || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/70">
              <span className="text-muted-foreground">Last Session Sign-In</span>
              <span className="text-xs">{lastSignIn || "Current active session"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
