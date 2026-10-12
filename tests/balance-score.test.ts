import { describe, it, expect } from "vitest";
import {
  calculateLifeBalanceScore,
  DEFAULT_WEIGHTS,
} from "@/lib/analytics/balance-score";

describe("Life Balance Score Analytical Engine", () => {
  it("returns insufficient_data and null score when no data is provided", () => {
    const result = calculateLifeBalanceScore({});
    expect(result.status).toBe("insufficient_data");
    expect(result.totalScore).toBeNull();
    expect(result.coveragePct).toBe(0);
  });

  it("returns insufficient_data when only 1 dimension has data (< 40% coverage)", () => {
    const result = calculateLifeBalanceScore({
      studyActualMinutes: 120,
      studyTargetMinutes: 120,
    });
    expect(result.status).toBe("insufficient_data");
    expect(result.totalScore).toBeNull();
    expect(result.coveragePct).toBe(20);
    expect(result.dimensions.study.score).toBe(100);
  });

  it("returns provisional status when 2 or 3 dimensions have valid data", () => {
    const result = calculateLifeBalanceScore({
      studyActualMinutes: 90,
      studyTargetMinutes: 180, // 50%
      sleepLoggedHours: 7.5,
      sleepTargetHours: 7.5, // 100%
    });

    expect(result.status).toBe("provisional");
    expect(result.coveragePct).toBe(40);
    expect(result.totalScore).not.toBeNull();
    // Normalized between study (0.25) and sleep (0.25): (50*0.25 + 100*0.25) / 0.5 = 75
    expect(result.totalScore).toBe(75);
  });

  it("computes complete score with sufficient_data when 4 or more dimensions have data", () => {
    const result = calculateLifeBalanceScore({
      studyActualMinutes: 180,
      studyTargetMinutes: 180, // 100
      sleepLoggedHours: 7.5,
      sleepTargetHours: 7.5, // 100
      habitsCompleted: 4,
      habitsEligible: 4, // 100
      goalsActiveCount: 2,
      goalsAverageProgress: 80, // 80
      wellbeingCheckinsCount: 1,
      wellbeingPeriodDays: 1, // 100
    });

    expect(result.status).toBe("sufficient_data");
    expect(result.coveragePct).toBe(100);
    // Weighted: 100*0.25 + 100*0.25 + 100*0.20 + 80*0.20 + 100*0.10 = 25 + 25 + 20 + 16 + 10 = 96
    expect(result.totalScore).toBe(96);
  });

  it("respects custom validated weights", () => {
    const customWeights = {
      study: 0.50,
      sleep: 0.10,
      habits: 0.20,
      goals: 0.10,
      wellbeing: 0.10,
    };

    const result = calculateLifeBalanceScore(
      {
        studyActualMinutes: 180,
        studyTargetMinutes: 180, // 100
        sleepLoggedHours: 5.5,
        sleepTargetHours: 7.5, // diff 2.0 -> 100 - 30 = 70
        habitsCompleted: 1,
        habitsEligible: 2, // 50
        goalsActiveCount: 1,
        goalsAverageProgress: 100, // 100
        wellbeingCheckinsCount: 1,
        wellbeingPeriodDays: 1, // 100
      },
      customWeights
    );

    // 100*0.50 + 70*0.10 + 50*0.20 + 100*0.10 + 100*0.10 = 50 + 7 + 10 + 10 + 10 = 87
    expect(result.totalScore).toBe(87);
  });
});
