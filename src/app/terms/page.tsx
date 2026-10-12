import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-brand-charcoal dark:text-brand-mist">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: October 2026
          </p>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-brand-charcoal dark:text-brand-mist">
              1. Acceptance of Terms
            </h2>
            <p>
              By creating a FocusMate account or using our application, you agree to these Terms of Service. FocusMate is an academic and personal lifestyle management tool provided to support college and university students.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-brand-charcoal dark:text-brand-mist">
              2. User Accounts and Security
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your credentials. You agree to notify us immediately of any unauthorized use of your account. We will never ask you for your account password.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-brand-charcoal dark:text-brand-mist">
              3. No Medical or Financial Advice
            </h2>
            <p>
              FocusMate features—including the Life Balance Score, sleep tracking, and finance tools—are informational and personal planning utilities. They do not constitute certified financial guidance, academic guarantees, or medical or psychological diagnosis.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
