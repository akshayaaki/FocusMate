import Link from "next/link";
import {
  CheckSquare,
  Timer,
  Sparkles,
  Target,
  Wallet,
  Moon,
  Scale,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <header className="border-b border-border/70 backdrop-blur-md sticky top-0 z-40 bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-brand-charcoal text-white dark:bg-brand-mist dark:text-brand-charcoal font-bold text-sm flex items-center justify-center">
              FM
            </div>
            <span className="font-semibold text-lg text-brand-charcoal dark:text-brand-mist tracking-tight">
              FocusMate
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="sage" size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-28 px-6 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-mist/40 text-brand-charcoal dark:bg-brand-charcoal/80 dark:text-brand-mist text-xs font-semibold mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-sage animate-pulse" />
            Designed for University & College Students
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist leading-[1.15]">
            Your life, in balance.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            One calm, private workspace to plan your academic deadlines, track study sessions, cultivate daily habits, understand your spending, and safeguard your rest.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" variant="sage" className="w-full sm:w-auto text-base px-8 h-12">
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-12">
              <Link href="/login">Sign In to Dashboard</Link>
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand-slate" /> Private individual accounts
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-mist" /> No social sharing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-mist" /> Free core tools
            </span>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 bg-muted/30 border-y border-border/60 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal dark:text-brand-mist">
                Everything student life demands, connected honestly.
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                No fake streaks, no guilt loops, no superficial metrics. Real tracking that respects your time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
                <div className="h-10 w-10 rounded-lg bg-brand-mist/50 dark:bg-brand-charcoal flex items-center justify-center text-brand-charcoal dark:text-brand-mist mb-4">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-brand-charcoal dark:text-brand-mist">
                  Academic Task Planning
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Manage assignments, exam prep, and daily routines with subtasks, explicit recurring rules, and subject tagging.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
                <div className="h-10 w-10 rounded-lg bg-brand-mist/50 dark:bg-brand-charcoal flex items-center justify-center text-brand-charcoal dark:text-brand-mist mb-4">
                  <Timer className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-brand-charcoal dark:text-brand-mist">
                  Focused Study Sessions
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Record actual elapsed study time with persistent focus timers. Compare planned study hours against real completed work.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
                <div className="h-10 w-10 rounded-lg bg-brand-mist/50 dark:bg-brand-charcoal flex items-center justify-center text-brand-charcoal dark:text-brand-mist mb-4">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-brand-charcoal dark:text-brand-mist">
                  Habit Tracker
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Track scheduled routines without penalty for unscheduled rest days. Honest streaks calculated from your local calendar.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
                <div className="h-10 w-10 rounded-lg bg-brand-mist/50 dark:bg-brand-charcoal flex items-center justify-center text-brand-charcoal dark:text-brand-mist mb-4">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-brand-charcoal dark:text-brand-mist">
                  Academic & Personal Goals
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Track semester goals and milestones. Separate manual progress entries from linked activities with auditable logging.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
                <div className="h-10 w-10 rounded-lg bg-brand-mist/50 dark:bg-brand-charcoal flex items-center justify-center text-brand-charcoal dark:text-brand-mist mb-4">
                  <Wallet className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-brand-charcoal dark:text-brand-mist">
                  Student Finance Tracker
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Manage allowances, shared food costs, and monthly budgets with exact decimal precision in INR and international currencies.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
                <div className="h-10 w-10 rounded-lg bg-brand-mist/50 dark:bg-brand-charcoal flex items-center justify-center text-brand-charcoal dark:text-brand-mist mb-4">
                  <Scale className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-brand-charcoal dark:text-brand-mist">
                  Life Balance Score
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  A transparent reflection score weighting study, rest, habits, goals, and reflections. Zero fake scores when data is new.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} FocusMate. Built for students. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/login" className="hover:underline">Student Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
