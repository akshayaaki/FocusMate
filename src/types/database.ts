export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskCategory = 'study' | 'assignment' | 'exam_prep' | 'personal' | 'routine' | 'custom';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RecurrenceFreq = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type EventCategory = 'class' | 'study' | 'exam' | 'assignment' | 'personal' | 'routine';
export type StudyStatus = 'planned' | 'active' | 'paused' | 'completed' | 'interrupted';
export type HabitFreq = 'daily' | 'weekly_days' | 'custom';
export type GoalCategory = 'academic' | 'personal' | 'skill' | 'health' | 'finance';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type TransactionType = 'expense' | 'income' | 'refund';
export type NotificationType = 'task_deadline' | 'exam_alert' | 'study_session' | 'habit_reminder' | 'goal_review' | 'system';
export type NotificationChannel = 'in_app' | 'browser_push' | 'email';
export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'cancelled' | 'unconfigured';
export type ExportFormat = 'pdf' | 'csv' | 'json';
export type ReportType = 'weekly' | 'monthly' | 'custom' | 'data_export';

export interface RawTables {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          timezone: string;
          week_start: 'monday' | 'sunday' | 'saturday';
          avatar_url: string | null;
          theme_preference: 'system' | 'light' | 'dark';
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          timezone?: string;
          week_start?: 'monday' | 'sunday' | 'saturday';
          avatar_url?: string | null;
          theme_preference?: 'system' | 'light' | 'dark';
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          timezone?: string;
          week_start?: 'monday' | 'sunday' | 'saturday';
          avatar_url?: string | null;
          theme_preference?: 'system' | 'light' | 'dark';
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          study_daily_target_minutes: number;
          sleep_target_hours: number;
          currency: string;
          dashboard_layout: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          study_daily_target_minutes?: number;
          sleep_target_hours?: number;
          currency?: string;
          dashboard_layout?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          study_daily_target_minutes?: number;
          sleep_target_hours?: number;
          currency?: string;
          dashboard_layout?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          in_app_enabled: boolean;
          push_enabled: boolean;
          email_enabled: boolean;
          task_reminders: boolean;
          habit_reminders: boolean;
          study_reminders: boolean;
          quiet_hours_enabled: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          in_app_enabled?: boolean;
          push_enabled?: boolean;
          email_enabled?: boolean;
          task_reminders?: boolean;
          habit_reminders?: boolean;
          study_reminders?: boolean;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          in_app_enabled?: boolean;
          push_enabled?: boolean;
          email_enabled?: boolean;
          task_reminders?: boolean;
          habit_reminders?: boolean;
          study_reminders?: boolean;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          code: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          code?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          code?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string | null;
          recurrence_rule_id: string | null;
          title: string;
          description: string | null;
          category: TaskCategory;
          priority: TaskPriority;
          status: TaskStatus;
          start_date: string | null;
          due_date: string | null;
          estimated_duration_minutes: number | null;
          actual_duration_minutes: number;
          is_recurring: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id?: string | null;
          recurrence_rule_id?: string | null;
          title: string;
          description?: string | null;
          category?: TaskCategory;
          priority?: TaskPriority;
          status?: TaskStatus;
          start_date?: string | null;
          due_date?: string | null;
          estimated_duration_minutes?: number | null;
          actual_duration_minutes?: number;
          is_recurring?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string | null;
          recurrence_rule_id?: string | null;
          title?: string;
          description?: string | null;
          category?: TaskCategory;
          priority?: TaskPriority;
          status?: TaskStatus;
          start_date?: string | null;
          due_date?: string | null;
          estimated_duration_minutes?: number | null;
          actual_duration_minutes?: number;
          is_recurring?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_subtasks: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          title: string;
          is_completed: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          title: string;
          is_completed?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          title?: string;
          is_completed?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_recurrence_rules: {
        Row: {
          id: string;
          user_id: string;
          frequency: RecurrenceFreq;
          interval: number;
          by_weekdays: number[] | null;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          frequency: RecurrenceFreq;
          interval?: number;
          by_weekdays?: number[] | null;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          frequency?: RecurrenceFreq;
          interval?: number;
          by_weekdays?: number[] | null;
          end_date?: string | null;
          created_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string | null;
          linked_task_id: string | null;
          title: string;
          description: string | null;
          category: EventCategory;
          start_time: string;
          end_time: string;
          is_all_day: boolean;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id?: string | null;
          linked_task_id?: string | null;
          title: string;
          description?: string | null;
          category?: EventCategory;
          start_time: string;
          end_time: string;
          is_all_day?: boolean;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string | null;
          linked_task_id?: string | null;
          title?: string;
          description?: string | null;
          category?: EventCategory;
          start_time?: string;
          end_time?: string;
          is_all_day?: boolean;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string | null;
          linked_task_id: string | null;
          title: string;
          planned_duration_minutes: number;
          actual_duration_minutes: number;
          started_at: string | null;
          completed_at: string | null;
          status: StudyStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id?: string | null;
          linked_task_id?: string | null;
          title: string;
          planned_duration_minutes?: number;
          actual_duration_minutes?: number;
          started_at?: string | null;
          completed_at?: string | null;
          status?: StudyStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string | null;
          linked_task_id?: string | null;
          title?: string;
          planned_duration_minutes?: number;
          actual_duration_minutes?: number;
          started_at?: string | null;
          completed_at?: string | null;
          status?: StudyStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          category: string;
          frequency: HabitFreq;
          scheduled_days: number[];
          is_measurable: boolean;
          target_quantity: number | null;
          unit: string | null;
          start_date: string;
          end_date: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          category?: string;
          frequency?: HabitFreq;
          scheduled_days?: number[];
          is_measurable?: boolean;
          target_quantity?: number | null;
          unit?: string | null;
          start_date?: string;
          end_date?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          frequency?: HabitFreq;
          scheduled_days?: number[];
          is_measurable?: boolean;
          target_quantity?: number | null;
          unit?: string | null;
          start_date?: string;
          end_date?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      habit_entries: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          entry_date: string;
          is_completed: boolean;
          quantity: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          habit_id: string;
          user_id: string;
          entry_date: string;
          is_completed?: boolean;
          quantity?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          habit_id?: string;
          user_id?: string;
          entry_date?: string;
          is_completed?: boolean;
          quantity?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string | null;
          title: string;
          description: string | null;
          category: GoalCategory;
          target_value: number;
          current_value: number;
          unit: string;
          start_date: string;
          target_date: string;
          status: GoalStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id?: string | null;
          title: string;
          description?: string | null;
          category: GoalCategory;
          target_value?: number;
          current_value?: number;
          unit?: string;
          start_date?: string;
          target_date: string;
          status?: GoalStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string | null;
          title?: string;
          description?: string | null;
          category?: GoalCategory;
          target_value?: number;
          current_value?: number;
          unit?: string;
          start_date?: string;
          target_date?: string;
          status?: GoalStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      goal_milestones: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          title: string;
          target_value: number | null;
          is_completed: boolean;
          target_date: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          title: string;
          target_value?: number | null;
          is_completed?: boolean;
          target_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          user_id?: string;
          title?: string;
          target_value?: number | null;
          is_completed?: boolean;
          target_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      goal_progress_entries: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          value_recorded: number;
          notes: string | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          value_recorded: number;
          notes?: string | null;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          user_id?: string;
          value_recorded?: number;
          notes?: string | null;
          recorded_at?: string;
        };
      };
      finance_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'expense' | 'income' | 'both';
          color: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'expense' | 'income' | 'both';
          color?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'expense' | 'income' | 'both';
          color?: string;
          is_default?: boolean;
          created_at?: string;
        };
      };
      finance_transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          currency: string;
          transaction_type: TransactionType;
          transaction_date: string;
          description: string;
          payment_method: string | null;
          is_recurring: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          currency?: string;
          transaction_type: TransactionType;
          transaction_date?: string;
          description: string;
          payment_method?: string | null;
          is_recurring?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          amount?: number;
          currency?: string;
          transaction_type?: TransactionType;
          transaction_date?: string;
          description?: string;
          payment_method?: string | null;
          is_recurring?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          month: number;
          year: number;
          total_limit: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: number;
          year: number;
          total_limit: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month?: number;
          year?: number;
          total_limit?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      budget_categories: {
        Row: {
          id: string;
          budget_id: string;
          category_id: string;
          user_id: string;
          allocated_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          category_id: string;
          user_id: string;
          allocated_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          budget_id?: string;
          category_id?: string;
          user_id?: string;
          allocated_amount?: number;
          created_at?: string;
        };
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          target_amount: number;
          current_amount: number;
          currency: string;
          target_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          target_amount: number;
          current_amount?: number;
          currency?: string;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          target_amount?: number;
          current_amount?: number;
          currency?: string;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sleep_logs: {
        Row: {
          id: string;
          user_id: string;
          sleep_start: string;
          sleep_end: string;
          duration_minutes: number;
          quality_rating: number | null;
          notes: string | null;
          log_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sleep_start: string;
          sleep_end: string;
          duration_minutes: number;
          quality_rating?: number | null;
          notes?: string | null;
          log_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sleep_start?: string;
          sleep_end?: string;
          duration_minutes?: number;
          quality_rating?: number | null;
          notes?: string | null;
          log_date?: string;
          created_at?: string;
        };
      };
      wellbeing_checkins: {
        Row: {
          id: string;
          user_id: string;
          checkin_date: string;
          mood_score: number | null;
          energy_score: number | null;
          stress_level: number | null;
          self_care_activities: string[];
          journal_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          checkin_date: string;
          mood_score?: number | null;
          energy_score?: number | null;
          stress_level?: number | null;
          self_care_activities?: string[];
          journal_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          checkin_date?: string;
          mood_score?: number | null;
          energy_score?: number | null;
          stress_level?: number | null;
          self_care_activities?: string[];
          journal_notes?: string | null;
          created_at?: string;
        };
      };
      balance_score_preferences: {
        Row: {
          id: string;
          user_id: string;
          weight_study: number;
          weight_sleep: number;
          weight_habits: number;
          weight_goals: number;
          weight_wellbeing: number;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight_study?: number;
          weight_sleep?: number;
          weight_habits?: number;
          weight_goals?: number;
          weight_wellbeing?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weight_study?: number;
          weight_sleep?: number;
          weight_habits?: number;
          weight_goals?: number;
          weight_wellbeing?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      balance_score_snapshots: {
        Row: {
          id: string;
          user_id: string;
          score_date: string;
          total_score: number;
          study_score: number | null;
          sleep_score: number | null;
          habits_score: number | null;
          goals_score: number | null;
          wellbeing_score: number | null;
          data_coverage_pct: number;
          is_provisional: boolean;
          scoring_version: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score_date: string;
          total_score: number;
          study_score?: number | null;
          sleep_score?: number | null;
          habits_score?: number | null;
          goals_score?: number | null;
          wellbeing_score?: number | null;
          data_coverage_pct: number;
          is_provisional?: boolean;
          scoring_version?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          score_date?: string;
          total_score?: number;
          study_score?: number | null;
          sleep_score?: number | null;
          habits_score?: number | null;
          goals_score?: number | null;
          wellbeing_score?: number | null;
          data_coverage_pct?: number;
          is_provisional?: boolean;
          scoring_version?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          action_url: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: NotificationType;
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: NotificationType;
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
      };
      notification_jobs: {
        Row: {
          id: string;
          user_id: string;
          channel: NotificationChannel;
          scheduled_for: string;
          delivery_status: DeliveryStatus;
          idempotency_key: string;
          retry_count: number;
          error_message: string | null;
          delivered_at: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel: NotificationChannel;
          scheduled_for: string;
          delivery_status?: DeliveryStatus;
          idempotency_key: string;
          retry_count?: number;
          error_message?: string | null;
          delivered_at?: string | null;
          payload: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel?: NotificationChannel;
          scheduled_for?: string;
          delivery_status?: DeliveryStatus;
          idempotency_key?: string;
          retry_count?: number;
          error_message?: string | null;
          delivered_at?: string | null;
          payload?: Json;
          created_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          keys_p256dh?: string;
          keys_auth?: string;
          created_at?: string;
        };
      };
      audit_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          metadata: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          metadata?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_type?: string;
          metadata?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      report_exports: {
        Row: {
          id: string;
          user_id: string;
          report_type: ReportType;
          format: ExportFormat;
          start_date: string;
          end_date: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          report_type: ReportType;
          format: ExportFormat;
          start_date: string;
          end_date: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          report_type?: ReportType;
          format?: ExportFormat;
          start_date?: string;
          end_date?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          created_at?: string;
        };
      };
}

export type Tables<T extends keyof RawTables> = RawTables[T]["Row"];
export type TablesInsert<T extends keyof RawTables> = RawTables[T]["Insert"];
export type TablesUpdate<T extends keyof RawTables> = RawTables[T]["Update"];

export interface Database {
  public: {
    Tables: {
      [K in keyof RawTables]: {
        Row: RawTables[K]["Row"];
        Insert: RawTables[K]["Insert"];
        Update: RawTables[K]["Update"];
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      task_category: TaskCategory;
      task_priority: TaskPriority;
      task_status: TaskStatus;
      recurrence_freq: RecurrenceFreq;
      event_category: EventCategory;
      study_status: StudyStatus;
      habit_freq: HabitFreq;
      goal_category: GoalCategory;
      goal_status: GoalStatus;
      transaction_type: TransactionType;
      notification_type: NotificationType;
      notification_channel: NotificationChannel;
      delivery_status: DeliveryStatus;
      export_format: ExportFormat;
      report_type: ReportType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
