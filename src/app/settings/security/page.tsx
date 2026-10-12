"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle2, Monitor, Database, Lock } from "lucide-react";
import { DEFAULT_USER_ID } from "@/lib/auth/get-user";

export default function SecuritySettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand-slate" /> Security & Workspace Status
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review workspace access mode, database security, and privacy isolation
          </p>
        </div>

        {/* Access Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-brand-slate" /> Workspace Access Mode
            </CardTitle>
            <CardDescription>Authentication and access configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/80 gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-brand-charcoal text-white dark:bg-brand-mist dark:text-brand-charcoal flex items-center justify-center font-bold text-sm shadow-xs">
                  FM
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Direct Student Workspace</h4>
                  <p className="text-xs text-muted-foreground">Open private access enabled</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Fully Active
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Login barriers and third-party authentication services have been removed. Your student dashboard, study tools, habits, financial tracker, and life balance scores load directly into your private database space.
            </p>
          </CardContent>
        </Card>

        {/* Database Session Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4 text-brand-slate" /> Workspace Environment Details
            </CardTitle>
            <CardDescription>Direct Supabase PostgreSQL database metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/70">
              <span className="text-muted-foreground">Workspace Profile</span>
              <span className="font-medium text-xs">Student (Local Active)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/70">
              <span className="text-muted-foreground">Primary User UUID</span>
              <span className="font-mono text-xs text-muted-foreground truncate max-w-[260px]">
                {DEFAULT_USER_ID}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/70">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-brand-slate" /> Database Storage
              </span>
              <span className="text-xs text-emerald-600 font-medium">Supabase PostgreSQL (Live)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
