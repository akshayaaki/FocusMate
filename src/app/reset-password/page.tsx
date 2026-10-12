"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
      <Card className="w-full max-w-md shadow-md border-border/80">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
          <CardDescription>
            Choose a new secure password for your FocusMate account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="rounded-lg bg-brand-mist/20 border border-brand-sage p-5 text-center space-y-3">
              <CheckCircle2 className="h-8 w-8 text-brand-slate mx-auto" />
              <h4 className="font-semibold text-brand-charcoal dark:text-brand-mist">
                Password Successfully Reset
              </h4>
              <p className="text-sm text-muted-foreground">
                Redirecting you to your dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat new password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button type="submit" variant="sage" className="w-full" disabled={loading}>
                {loading ? "Updating Password..." : "Update Password"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t border-border/50 pt-4">
          <p className="text-sm text-muted-foreground">
            Remembered your credentials?{" "}
            <Link href="/login" className="font-semibold text-brand-charcoal dark:text-brand-mist hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
