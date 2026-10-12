import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-charcoal text-white dark:bg-brand-mist dark:text-brand-charcoal",
        secondary:
          "border-transparent bg-brand-mist/50 text-brand-charcoal dark:bg-brand-charcoal/50 dark:text-brand-mist",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        sage: "border-transparent bg-brand-sage/40 text-brand-charcoal dark:text-brand-mist font-medium",
        warning: "border-transparent bg-amber-500/20 text-amber-700 dark:text-amber-300",
        success: "border-transparent bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
