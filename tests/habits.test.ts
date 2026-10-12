import { describe, it, expect } from "vitest";
import {
  calculateHabitStats,
  type HabitDefinition,
  type HabitEntryRecord,
} from "@/lib/analytics/habits";

describe("Habit Analytics Engine", () => {
  it("calculates current streak for daily habit with consecutive days", () => {
    const habit: HabitDefinition = {
      id: "h-1",
      name: "Daily Reading",
      frequency: "daily",
      scheduled_days: [0, 1, 2, 3, 4, 5, 6],
      start_date: "2026-10-01",
    };

    const entries: HabitEntryRecord[] = [
      { habit_id: "h-1", entry_date: "2026-10-10", is_completed: true },
      { habit_id: "h-1", entry_date: "2026-10-11", is_completed: true },
      { habit_id: "h-1", entry_date: "2026-10-12", is_completed: true },
    ];

    const stats = calculateHabitStats(habit, entries, "2026-10-12");
    expect(stats.currentStreak).toBe(3);
    expect(stats.totalCompletions).toBe(3);
    expect(stats.longestStreak).toBe(3);
  });

  it("does NOT penalize streak for unscheduled days (e.g., MWF habit)", () => {
    // 2026-10-07 was Wed (day 3), 2026-10-09 was Fri (day 5), 2026-10-12 was Mon (day 1)
    const habit: HabitDefinition = {
      id: "h-2",
      name: "Gym Workout",
      frequency: "weekly_days",
      scheduled_days: [1, 3, 5], // Mon, Wed, Fri
      start_date: "2026-10-01",
    };

    const entries: HabitEntryRecord[] = [
      { habit_id: "h-2", entry_date: "2026-10-07", is_completed: true }, // Wed
      { habit_id: "h-2", entry_date: "2026-10-09", is_completed: true }, // Fri
      { habit_id: "h-2", entry_date: "2026-10-12", is_completed: true }, // Mon
    ];

    // Thu, Sat, Sun were not scheduled and should NOT break the streak
    const stats = calculateHabitStats(habit, entries, "2026-10-12");
    expect(stats.currentStreak).toBe(3);
  });

  it("resets streak when a scheduled day is missed", () => {
    const habit: HabitDefinition = {
      id: "h-3",
      name: "Daily Meditation",
      frequency: "daily",
      scheduled_days: [0, 1, 2, 3, 4, 5, 6],
      start_date: "2026-10-01",
    };

    // Missed 2026-10-11
    const entries: HabitEntryRecord[] = [
      { habit_id: "h-3", entry_date: "2026-10-08", is_completed: true },
      { habit_id: "h-3", entry_date: "2026-10-09", is_completed: true },
      { habit_id: "h-3", entry_date: "2026-10-10", is_completed: true },
      // 10-11 missed
      { habit_id: "h-3", entry_date: "2026-10-12", is_completed: true },
    ];

    const stats = calculateHabitStats(habit, entries, "2026-10-12");
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(3);
  });
});
