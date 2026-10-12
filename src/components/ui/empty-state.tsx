import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/50 p-8 text-center animate-in fade-in-50">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-mist/30 text-brand-slate dark:bg-brand-charcoal/50 dark:text-brand-mist">
        <Icon className="h-6 w-6 stroke-[1.5]" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-brand-charcoal dark:text-brand-mist">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <div className="mt-5">
          {actionHref ? (
            <Button asChild size="sm" variant="sage">
              <a href={actionHref}>{actionLabel}</a>
            </Button>
          ) : (
            <Button size="sm" variant="sage" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
