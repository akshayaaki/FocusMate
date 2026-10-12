"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Password recovery request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
      <Link
        href="/login"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Sign In
      </Link>

      <Card className="w-full max-w-md shadow-md border-border/80">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your student email and we&apos;ll send you a password recovery link
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
                Recovery Link Dispatched
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If an account exists with <strong className="text-foreground">{email}</strong>, a secure password reset link has been dispatched.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/login">Return to Sign In</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@university.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button type="submit" variant="default" className="w-full" disabled={loading}>
                {loading ? "Sending Link..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t border-border/50 pt-4">
          <p className="text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/login" className="font-semibold text-brand-charcoal dark:text-brand-mist hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
