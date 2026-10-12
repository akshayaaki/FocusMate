# FocusMate — Your Life, in Balance.

FocusMate is a complete, production-ready student life organizer designed to assist college and university students in managing academic coursework, planned study routines, personal habits, financial tracking, sleep logs, and general well-being in a private, distraction-free workspace.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL with Row Level Security), and Vitest.

---

## Brand Identity & Design System

FocusMate adheres strictly to the official five-color brand palette:

| Token | HEX | Role |
|---|---|---|
| **Sage Mist** | `#CCDAD1` | Soft sage backgrounds, selected surfaces |
| **Soft Sage** | `#9CAEA9` | Secondary accents, habit indicators |
| **Slate Sage** | `#788585` | Icons, secondary controls, chart accents |
| **Warm Grey** | `#6F6866` | Muted text, supporting labels, subtle borders |
| **Deep Charcoal** | `#38302E` | Primary typography, navigation, high-contrast buttons |

---

## Key Modules & Capabilities

1. **Dashboard (`/dashboard`)**: Unified daily overview with today's priorities, tasks due, study summaries, scheduled habits, active goals, monthly spending, and Life Balance Score.
2. **Task Management (`/tasks`)**: Complete CRUD, subtasks, categories (study, assignment, exam prep, personal, routine), priorities, due dates, and explicit recurrence rules.
3. **Calendar & Scheduling (`/calendar`)**: Internal Month and Agenda views tracking classes, exams, focus blocks, and assignment deadlines.
4. **Study Planner & Focus Timer (`/study`)**: Subject management, planned study sessions, and a persistent focus timer tracking actual elapsed duration.
5. **Habit Tracker (`/habits`)**: Scheduled routines (daily or custom weekdays), streaks calculated without penalizing unscheduled rest days, and 7-day mini heatmaps.
6. **Academic & Personal Goals (`/goals`)**: Target values, milestone progress logging, and verified completion tracking.
7. **Student Finance Tracker (`/finance`)**: Income, expense, and refund tracking with exact decimal arithmetic, monthly spending budgets, and utilization progress.
8. **Sleep & Well-being (`/wellbeing`)**: Sleep log with cross-midnight duration calculation, daily self-reflection check-ins, and confidential private notes.
9. **Life Balance Score (`/balance`)**: Transparent, deterministic reflection score across 5 weighted dimensions (Study 25%, Sleep 25%, Habits 20%, Goals 20%, Well-being 10%). Zero fake scores when data is insufficient.
10. **Reports & Exports (`/reports`)**: Weekly and monthly performance summaries with authentic client-generated PDF downloads and RFC-4180 compliant CSV exports.
11. **Settings**:
    - Profile (`/settings/profile`)
    - Notifications (`/settings/notifications`) with quiet hours
    - Security & Sessions (`/settings/security`)
    - Data Rights & Account Deletion (`/settings/data`) with full JSON export and cascading permanent deletion.

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ (Node 24 supported)
- npm 9+
- Supabase account (free tier)

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Migration
Apply the PostgreSQL migration:
```bash
# Via Supabase CLI:
supabase db push

# Or paste contents of supabase/migrations/20261012000000_focusmate_schema.sql
# into the Supabase Dashboard SQL Editor.
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Automated Tests
```bash
npm test
```

### 6. Production Build
```bash
npm run build
npm start
```

---

## Security & Row Level Security (RLS)

All user tables enforce PostgreSQL Row Level Security. Policies guarantee that `auth.uid() = user_id` for every operation. Unauthenticated requests and cross-user data access attempts are denied at the database engine level.
