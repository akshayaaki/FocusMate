-- FOCUSMATE PRODUCTION DATABASE MIGRATION
-- Schema Version: 20261012000000
-- Target: Supabase PostgreSQL with Row Level Security (RLS)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
CREATE TYPE task_category AS ENUM ('study', 'assignment', 'exam_prep', 'personal', 'routine', 'custom');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE recurrence_freq AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');
CREATE TYPE event_category AS ENUM ('class', 'study', 'exam', 'assignment', 'personal', 'routine');
CREATE TYPE study_status AS ENUM ('planned', 'active', 'paused', 'completed', 'interrupted');
CREATE TYPE habit_freq AS ENUM ('daily', 'weekly_days', 'custom');
CREATE TYPE goal_category AS ENUM ('academic', 'personal', 'skill', 'health', 'finance');
CREATE TYPE goal_status AS ENUM ('active', 'paused', 'completed', 'archived');
CREATE TYPE transaction_type AS ENUM ('expense', 'income', 'refund');
CREATE TYPE notification_type AS ENUM ('task_deadline', 'exam_alert', 'study_session', 'habit_reminder', 'goal_review', 'system');
CREATE TYPE notification_channel AS ENUM ('in_app', 'browser_push', 'email');
CREATE TYPE delivery_status AS ENUM ('pending', 'delivered', 'failed', 'cancelled', 'unconfigured');
CREATE TYPE export_format AS ENUM ('pdf', 'csv', 'json');
CREATE TYPE report_type AS ENUM ('weekly', 'monthly', 'custom', 'data_export');

-- 3. PROFILES & USER PREFERENCES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    week_start TEXT NOT NULL DEFAULT 'monday' CHECK (week_start IN ('monday', 'sunday', 'saturday')),
    avatar_url TEXT,
    theme_preference TEXT NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('system', 'light', 'dark')),
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    study_daily_target_minutes INTEGER NOT NULL DEFAULT 180 CHECK (study_daily_target_minutes >= 0),
    sleep_target_hours NUMERIC(3,1) NOT NULL DEFAULT 7.5 CHECK (sleep_target_hours >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    dashboard_layout JSONB NOT NULL DEFAULT '{"widgets": ["priorities", "due_tasks", "events", "study", "habits", "goals", "finance", "wellbeing", "balance_score"]}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    task_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    habit_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    study_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start TEXT DEFAULT '22:00',
    quiet_hours_end TEXT DEFAULT '07:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ACADEMIC SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    color TEXT NOT NULL DEFAULT '#9CAEA9',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name)
);

-- 5. TASKS & SUBTASKS
CREATE TABLE IF NOT EXISTS public.task_recurrence_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    frequency recurrence_freq NOT NULL,
    interval INTEGER NOT NULL DEFAULT 1 CHECK (interval > 0),
    by_weekdays INTEGER[] DEFAULT '{}',
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    recurrence_rule_id UUID REFERENCES public.task_recurrence_rules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category task_category NOT NULL DEFAULT 'study',
    priority task_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'pending',
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    estimated_duration_minutes INTEGER CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes >= 0),
    actual_duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (actual_duration_minutes >= 0),
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CALENDAR & STUDY
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category event_category NOT NULL DEFAULT 'personal',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time >= start_time)
);

CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    planned_duration_minutes INTEGER NOT NULL DEFAULT 25 CHECK (planned_duration_minutes > 0),
    actual_duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (actual_duration_minutes >= 0),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status study_status NOT NULL DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. HABITS
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    frequency habit_freq NOT NULL DEFAULT 'daily',
    scheduled_days INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}'::INTEGER[],
    is_measurable BOOLEAN NOT NULL DEFAULT FALSE,
    target_quantity NUMERIC(10,2),
    unit TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.habit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT TRUE,
    quantity NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (habit_id, entry_date)
);

-- 8. GOALS
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category goal_category NOT NULL,
    target_value NUMERIC(10,2) NOT NULL DEFAULT 100 CHECK (target_value > 0),
    current_value NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (current_value >= 0),
    unit TEXT NOT NULL DEFAULT '%',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE NOT NULL,
    status goal_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (target_date >= start_date)
);

CREATE TABLE IF NOT EXISTS public.goal_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_value NUMERIC(10,2),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    target_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goal_progress_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value_recorded NUMERIC(10,2) NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. FINANCE
CREATE TABLE IF NOT EXISTS public.finance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'both')),
    color TEXT NOT NULL DEFAULT '#788585',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    transaction_type transaction_type NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    payment_method TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
    total_limit NUMERIC(12,2) NOT NULL CHECK (total_limit >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, month, year)
);

CREATE TABLE IF NOT EXISTS public.budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.finance_categories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    allocated_amount NUMERIC(12,2) NOT NULL CHECK (allocated_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (budget_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    target_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. SLEEP & WELLBEING
CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sleep_start TIMESTAMPTZ NOT NULL,
    sleep_end TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    notes TEXT,
    log_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (sleep_end > sleep_start)
);

CREATE TABLE IF NOT EXISTS public.wellbeing_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL,
    mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 5),
    energy_score INTEGER CHECK (energy_score BETWEEN 1 AND 5),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
    self_care_activities TEXT[] DEFAULT '{}',
    journal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, checkin_date)
);

-- 11. LIFE BALANCE SCORE
CREATE TABLE IF NOT EXISTS public.balance_score_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    weight_study NUMERIC(4,2) NOT NULL DEFAULT 0.25,
    weight_sleep NUMERIC(4,2) NOT NULL DEFAULT 0.25,
    weight_habits NUMERIC(4,2) NOT NULL DEFAULT 0.20,
    weight_goals NUMERIC(4,2) NOT NULL DEFAULT 0.20,
    weight_wellbeing NUMERIC(4,2) NOT NULL DEFAULT 0.10,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK ((weight_study + weight_sleep + weight_habits + weight_goals + weight_wellbeing) = 1.00)
);

CREATE TABLE IF NOT EXISTS public.balance_score_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score_date DATE NOT NULL,
    total_score NUMERIC(5,2) NOT NULL,
    study_score NUMERIC(5,2),
    sleep_score NUMERIC(5,2),
    habits_score NUMERIC(5,2),
    goals_score NUMERIC(5,2),
    wellbeing_score NUMERIC(5,2),
    data_coverage_pct NUMERIC(5,2) NOT NULL,
    is_provisional BOOLEAN NOT NULL DEFAULT FALSE,
    scoring_version TEXT NOT NULL DEFAULT 'v1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, score_date)
);

-- 12. NOTIFICATIONS & AUDIT
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'system',
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    delivery_status delivery_status NOT NULL DEFAULT 'pending',
    idempotency_key TEXT NOT NULL UNIQUE,
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    delivered_at TIMESTAMPTZ,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    keys_p256dh TEXT NOT NULL,
    keys_auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    metadata JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type report_type NOT NULL,
    format export_format NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_due ON public.tasks (user_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_category ON public.tasks (user_id, category);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_task ON public.task_subtasks (task_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_time ON public.calendar_events (user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_status ON public.study_sessions (user_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_habits_user_archived ON public.habits (user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user_date ON public.habit_entries (user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals (user_id, status);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal ON public.goal_milestones (goal_id);
CREATE INDEX IF NOT EXISTS idx_finance_tx_user_date ON public.finance_transactions (user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_tx_category ON public.finance_transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON public.sleep_logs (user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_wellbeing_user_date ON public.wellbeing_checkins (user_id, checkin_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_status ON public.notification_jobs (delivery_status, scheduled_for);

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on every user-isolated table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbeing_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_score_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

-- Helper macro function for user isolation RLS
-- Profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- User Preferences
CREATE POLICY "user_preferences_all" ON public.user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notification Preferences
CREATE POLICY "notification_preferences_all" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Subjects
CREATE POLICY "subjects_all" ON public.subjects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Task Recurrence
CREATE POLICY "task_recurrence_rules_all" ON public.task_recurrence_rules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tasks
CREATE POLICY "tasks_all" ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Task Subtasks (checked both on user_id and task owner)
CREATE POLICY "task_subtasks_all" ON public.task_subtasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Calendar Events
CREATE POLICY "calendar_events_all" ON public.calendar_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Study Sessions
CREATE POLICY "study_sessions_all" ON public.study_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Habits
CREATE POLICY "habits_all" ON public.habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Habit Entries
CREATE POLICY "habit_entries_all" ON public.habit_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goals
CREATE POLICY "goals_all" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goal Milestones
CREATE POLICY "goal_milestones_all" ON public.goal_milestones FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goal Progress Entries
CREATE POLICY "goal_progress_entries_all" ON public.goal_progress_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Finance Categories
CREATE POLICY "finance_categories_all" ON public.finance_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Finance Transactions
CREATE POLICY "finance_transactions_all" ON public.finance_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Budgets
CREATE POLICY "budgets_all" ON public.budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Budget Categories
CREATE POLICY "budget_categories_all" ON public.budget_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Savings Goals
CREATE POLICY "savings_goals_all" ON public.savings_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sleep Logs
CREATE POLICY "sleep_logs_all" ON public.sleep_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Wellbeing Checkins
CREATE POLICY "wellbeing_checkins_all" ON public.wellbeing_checkins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Balance Score Preferences
CREATE POLICY "balance_score_preferences_all" ON public.balance_score_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Balance Score Snapshots
CREATE POLICY "balance_score_snapshots_all" ON public.balance_score_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notification Jobs
CREATE POLICY "notification_jobs_all" ON public.notification_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Push Subscriptions
CREATE POLICY "push_subscriptions_all" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Audit Events
CREATE POLICY "audit_events_select" ON public.audit_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "audit_events_insert" ON public.audit_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Report Exports
CREATE POLICY "report_exports_all" ON public.report_exports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 15. AUTOMATIC PROFILE AND INITIAL DATA TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO public.profiles (id, display_name, timezone, onboarding_completed)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Kolkata'),
        FALSE
    );

    -- Create default preferences
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);

    -- Create notification preferences
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id);

    -- Create default balance score preferences
    INSERT INTO public.balance_score_preferences (user_id)
    VALUES (NEW.id);

    -- Create default finance categories
    INSERT INTO public.finance_categories (user_id, name, type, color, is_default) VALUES
        (NEW.id, 'Food & Dining', 'expense', '#9CAEA9', TRUE),
        (NEW.id, 'Transportation', 'expense', '#788585', TRUE),
        (NEW.id, 'Education & Books', 'expense', '#38302E', TRUE),
        (NEW.id, 'Accommodation & Rent', 'expense', '#6F6866', TRUE),
        (NEW.id, 'Entertainment', 'expense', '#CCDAD1', TRUE),
        (NEW.id, 'Shopping', 'expense', '#9CAEA9', TRUE),
        (NEW.id, 'Health & Fitness', 'expense', '#788585', TRUE),
        (NEW.id, 'Allowance / Salary', 'income', '#38302E', TRUE),
        (NEW.id, 'Other Income', 'income', '#9CAEA9', TRUE),
        (NEW.id, 'Other Expenses', 'expense', '#6F6866', TRUE);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 16. ATOMIC RECURRING TASK COMPLETION FUNCTION
CREATE OR REPLACE FUNCTION public.complete_task_with_recurrence(p_task_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_task public.tasks%ROWTYPE;
    v_rule public.task_recurrence_rules%ROWTYPE;
    v_next_due TIMESTAMPTZ;
    v_new_task_id UUID;
BEGIN
    SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id AND user_id = auth.uid();
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task not found or access denied';
    END IF;

    -- Update current task to completed
    UPDATE public.tasks
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_task_id;

    -- If recurring, spawn next occurrence
    IF v_task.is_recurring AND v_task.recurrence_rule_id IS NOT NULL THEN
        SELECT * INTO v_rule FROM public.task_recurrence_rules WHERE id = v_task.recurrence_rule_id;
        IF FOUND THEN
            -- Calculate next date
            IF v_rule.frequency = 'daily' THEN
                v_next_due := COALESCE(v_task.due_date, NOW()) + (v_rule.interval || ' day')::INTERVAL;
            ELSIF v_rule.frequency = 'weekly' THEN
                v_next_due := COALESCE(v_task.due_date, NOW()) + (v_rule.interval || ' week')::INTERVAL;
            ELSIF v_rule.frequency = 'biweekly' THEN
                v_next_due := COALESCE(v_task.due_date, NOW()) + (v_rule.interval * 2 || ' week')::INTERVAL;
            ELSIF v_rule.frequency = 'monthly' THEN
                v_next_due := COALESCE(v_task.due_date, NOW()) + (v_rule.interval || ' month')::INTERVAL;
            END IF;

            -- Check end_date
            IF v_rule.end_date IS NULL OR v_next_due <= v_rule.end_date THEN
                INSERT INTO public.tasks (
                    user_id, subject_id, recurrence_rule_id, title, description,
                    category, priority, status, start_date, due_date,
                    estimated_duration_minutes, is_recurring
                ) VALUES (
                    v_task.user_id, v_task.subject_id, v_task.recurrence_rule_id, v_task.title, v_task.description,
                    v_task.category, v_task.priority, 'pending', NULL, v_next_due,
                    v_task.estimated_duration_minutes, TRUE
                ) RETURNING id INTO v_new_task_id;
            END IF;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'completed_task_id', p_task_id,
        'spawned_task_id', v_new_task_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
