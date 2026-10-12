# FocusMate — System Architecture & Technical Specification

## 1. Executive Summary

FocusMate is an end-to-end student life organizer designed to assist college and university students in balancing academic performance, daily habits, deep work sessions, budgeting, and physical/mental recovery.

### Guiding Architectural Principles:
1. **Zero Fabricated Data**: New user accounts begin with authentic zero-data states. Missing data is never substituted with mocked statistics or fake charts.
2. **Deterministic Computations**: The Life Balance Score and habit streaks are calculated using pure mathematical algorithms rather than arbitrary heuristics or AI hallucinations.
3. **Strict Multi-Tenant Isolation**: Enforced by PostgreSQL Row Level Security (RLS) on all user-owned tables. Every read and mutation verifies `auth.uid() = user_id`.
4. **Resilient Offline & PWA Foundation**: Web App Manifest and service worker capabilities for fast, private, distraction-free access.

---

## 2. Technical Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | Server components for read-heavy operations, client components for interactive widgets. |
| **Language** | TypeScript (Strict mode) | Strict type definitions (`src/types/database.ts`) aligned 1:1 with PostgreSQL schema. |
| **Styling** | Tailwind CSS + Radix UI | Official FocusMate brand tokens (#CCDAD1, #9CAEA9, #788585, #6F6866, #38302E) with custom dark mode. |
| **Database & Identity** | Supabase (PostgreSQL + Auth) | RLS policies, atomic functions, cascade deletions, email verification, and OAuth. |
| **Report Generation** | jsPDF & RFC-4180 CSV Engine | Client-memory export generation for confidential student reports. |
| **Testing** | Vitest | Deterministic analytical tests covering all streak, financial, balance score, and notification logic. |

---

## 3. Data Model & RLS Security

The database schema is defined in `supabase/migrations/20261012000000_focusmate_schema.sql` spanning 28 entities:
- **Identity & Preferences**: `profiles`, `user_preferences`, `notification_preferences`
- **Academics & Scheduling**: `subjects`, `tasks`, `task_subtasks`, `task_recurrence_rules`, `calendar_events`, `study_sessions`
- **Habits & Goals**: `habits`, `habit_entries`, `goals`, `goal_milestones`, `goal_progress_entries`
- **Finance**: `finance_categories`, `finance_transactions`, `budgets`, `budget_categories`, `savings_goals`
- **Well-being & Reflections**: `sleep_logs`, `wellbeing_checkins`, `balance_score_preferences`, `balance_score_snapshots`
- **Operations & Audit**: `notifications`, `notification_jobs`, `push_subscriptions`, `audit_events`, `report_exports`

### RLS Boundary
Every user-owned table has Row Level Security enabled. Policies enforce that only the authenticated user matching `auth.uid()` can SELECT, INSERT, UPDATE, or DELETE their rows.

---

## 4. Life Balance Score Formulation

The composite score $S$ is computed dynamically across 5 life dimensions:
$$S = \frac{\sum_{i \in \text{Valid}} w_i \cdot s_i}{\sum_{i \in \text{Valid}} w_i}$$

### Default Dimension Weights:
1. **Study Consistency ($w = 0.25$)**: $\min(100, \frac{\text{Actual Minutes}}{\text{Target Minutes}} \times 100)$
2. **Sleep Routine ($w = 0.25$)**: $\max(0, 100 - |\text{Actual Hours} - \text{Target Hours}| \times 15)$
3. **Habit Consistency ($w = 0.20$)**: $\frac{\text{Scheduled Completed}}{\text{Eligible Scheduled}} \times 100$
4. **Goal Progress ($w = 0.20$)**: Average progress percentage across active student goals.
5. **Well-being Reflection ($w = 0.10$)**: Ratio of days checked in. Note: self-selected mood score is **never** judged or penalized.

### Minimum Data Thresholds:
- If fewer than 2 dimensions have records, score returns `null` with status `insufficient_data`.
- If 2 or 3 dimensions have records, status is marked `provisional` with normalized weights.
- If 4 or 5 dimensions have records, status is marked `sufficient_data`.
