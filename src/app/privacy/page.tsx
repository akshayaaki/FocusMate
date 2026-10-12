import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to FocusMate
        </Link>

        <div className="space-y-2 border-b border-border pb-6">
          <div className="flex items-center gap-2 text-brand-slate">
            <Shield className="h-6 w-6" />
            <span className="text-sm font-semibold uppercase tracking-wider">Privacy First</span>
          </div>
          <h1 className="text-3xl font-bold text-brand-charcoal dark:text-brand-mist">
            FocusMate Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: October 2026
          </p>
        </div>

        <div className="prose prose-stone dark:prose-invert max-w-none space-y-6 text-sm sm:text-base leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-brand-charcoal dark:text-brand-mist">
              1. Our Core Privacy Commitment
            </h2>
            <p>
              FocusMate is built strictly for individual students. We believe your study routines, sleep duration, personal finance entries, and self-care reflections belong exclusively to you. We do not sell your personal data, monetize student profiles, or provide access to advertisers or academic institutions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-brand-charcoal dark:text-brand-mist">
              2. Data We Store and How It Is Isolated
            </h2>
            <p>
              All application data—including tasks, study sessions, habits, budgets, and sleep logs—is partitioned using PostgreSQL Row Level Security (RLS). Every database query enforces strict tenant isolation, ensuring no student can access or inspect another user&apos;s records.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-brand-charcoal dark:text-brand-mist">
              3. Well-being and Mental Health Reflections
            </h2>
            <p>
              Optional check-ins (mood, energy, stress, and journal notes) are strictly private reflections. They are never used for psychological diagnosis or clinical profiling. Journal notes are excluded from third-party AI processing unless explicit consent is provided.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-brand-charcoal dark:text-brand-mist">
              4. Data Export and Permanent Deletion
            </h2>
            <p>
              In accordance with data rights principles, you can export your entire dataset in CSV/JSON format at any time from your account settings. You may also initiate permanent account deletion, which immediately cascades across all your records, notification jobs, and stored preferences.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
