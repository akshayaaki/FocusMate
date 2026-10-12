/**
 * Habit Analytics Engine
 * Calculates current streaks, longest streaks, and completion rates
 * strictly respecting user schedule without penalizing unscheduled rest days.
 * Handles local date boundaries consistently without UTC ISO split drift.
 */

export interface HabitDefinition {
  id: string;
  name: string;
  frequency: "daily" | "weekly_days" | "custom";
  scheduled_days: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_date: string; // YYYY-MM-DD
}

export interface HabitEntryRecord {
  habit_id: string;
  entry_date: string; // YYYY-MM-DD
  is_completed: boolean;
  quantity?: number | null;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  scheduledCompletionsRate: number; // percentage (0 - 100)
  lastCompletedDate: string | null;
}

export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function calculateHabitStats(
  habit: HabitDefinition,
  entries: HabitEntryRecord[],
  referenceDateStr?: string
): HabitStats {
  const completedDates = new Set(
    entries
      .filter((e) => e.habit_id === habit.id && e.is_completed)
      .map((e) => e.entry_date)
  );

  const totalCompletions = completedDates.size;
  if (totalCompletions === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      scheduledCompletionsRate: 0,
      lastCompletedDate: null,
    };
  }

  const today = referenceDateStr ? parseDateLocal(referenceDateStr) : new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = parseDateLocal(habit.start_date);

  // 1. Current streak calculation:
  // Walk backwards starting from today (or yesterday if today is scheduled and not completed yet)
  let currentStreak = 0;
  let cursor = new Date(today);

  const todayStr = formatDateKey(cursor);
  const isTodayScheduled = habit.scheduled_days.includes(cursor.getDay());

  if (isTodayScheduled && !completedDates.has(todayStr)) {
    // If today is scheduled but not completed yet, streak looks back to yesterday
    cursor.setDate(cursor.getDate() - 1);
  }

  while (cursor >= startDate) {
    const dayOfWeek = cursor.getDay();
    const isScheduled = habit.scheduled_days.includes(dayOfWeek);
    const dateStr = formatDateKey(cursor);

    if (isScheduled) {
      if (completedDates.has(dateStr)) {
        currentStreak++;
      } else {
        // A scheduled day was not completed -> streak broken
        break;
      }
    }
    // If not scheduled, step past without breaking streak
    cursor.setDate(cursor.getDate() - 1);
  }

  // 2. Longest streak calculation:
  // Walk forward from startDate to today
  let longestStreak = 0;
  let runningStreak = 0;
  const walkDate = new Date(startDate);

  let scheduledDaysCount = 0;
  let scheduledCompletedCount = 0;

  while (walkDate <= today) {
    const dayOfWeek = walkDate.getDay();
    const isScheduled = habit.scheduled_days.includes(dayOfWeek);
    const dateStr = formatDateKey(walkDate);

    if (isScheduled) {
      scheduledDaysCount++;
      if (completedDates.has(dateStr)) {
        runningStreak++;
        scheduledCompletedCount++;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    }
    walkDate.setDate(walkDate.getDate() + 1);
  }

  const scheduledCompletionsRate =
    scheduledDaysCount > 0
      ? Math.round((scheduledCompletedCount / scheduledDaysCount) * 100)
      : 0;

  const sortedDates = Array.from(completedDates).sort();
  const lastCompletedDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    scheduledCompletionsRate,
    lastCompletedDate,
  };
}
