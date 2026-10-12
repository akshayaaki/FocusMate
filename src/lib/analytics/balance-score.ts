/**
 * Life Balance Score Analytical Engine
 * Deterministic calculation across 5 key dimensions:
 * 1. Study Consistency (default 25%)
 * 2. Sleep Routine (default 25%)
 * 3. Habit Consistency (default 20%)
 * 4. Personal Goal Progress (default 20%)
 * 5. Well-being Check-ins (default 10%)
 *
 * Adheres strictly to the NO-DEMO-DATA policy:
 * - If insufficient real data exists (< 40% valid dimensions), returns insufficient_data status.
 * - Missing data is never treated as a punitive failure.
 * - Well-being checks never judge mood choice, only self-reflection consistency.
 */

export interface BalanceScoreWeights {
  study: number; // default 0.25
  sleep: number; // default 0.25
  habits: number; // default 0.20
  goals: number; // default 0.20
  wellbeing: number; // default 0.10
}

export const DEFAULT_WEIGHTS: BalanceScoreWeights = {
  study: 0.25,
  sleep: 0.25,
  habits: 0.20,
  goals: 0.20,
  wellbeing: 0.10,
};

export interface BalanceDimensionInput {
  // Study: actual minutes studied vs target minutes in period
  studyActualMinutes?: number;
  studyTargetMinutes?: number;

  // Sleep: average sleep hours logged vs target hours
  sleepLoggedHours?: number;
  sleepTargetHours?: number;

  // Habits: completed occurrences vs eligible scheduled occurrences
  habitsCompleted?: number;
  habitsEligible?: number;

  // Goals: average completion percentage across active goals
  goalsActiveCount?: number;
  goalsAverageProgress?: number; // 0 - 100

  // Wellbeing: checkins completed vs total days in window
  wellbeingCheckinsCount?: number;
  wellbeingPeriodDays?: number;
}

export interface DimensionResult {
  score: number | null;
  weight: number;
  normalizedWeight: number;
  hasData: boolean;
  explanation: string;
}

export interface LifeBalanceScoreResult {
  totalScore: number | null;
  status: "sufficient_data" | "provisional" | "insufficient_data";
  coveragePct: number;
  dimensions: {
    study: DimensionResult;
    sleep: DimensionResult;
    habits: DimensionResult;
    goals: DimensionResult;
    wellbeing: DimensionResult;
  };
  scoringVersion: string;
  summaryExplanation: string;
}

export function calculateLifeBalanceScore(
  input: BalanceDimensionInput,
  customWeights: BalanceScoreWeights = DEFAULT_WEIGHTS
): LifeBalanceScoreResult {
  const version = "v1.0";

  // Validate weights total 1.00
  const weightTotal =
    customWeights.study +
    customWeights.sleep +
    customWeights.habits +
    customWeights.goals +
    customWeights.wellbeing;

  const safeWeights: BalanceScoreWeights =
    Math.abs(weightTotal - 1.0) < 0.01
      ? customWeights
      : DEFAULT_WEIGHTS;

  // 1. Study Consistency
  let studyScore: number | null = null;
  let studyHasData = false;
  let studyExplanation = "No study sessions recorded in this period.";

  if (
    typeof input.studyActualMinutes === "number" &&
    typeof input.studyTargetMinutes === "number" &&
    input.studyTargetMinutes > 0
  ) {
    studyHasData = true;
    const ratio = (input.studyActualMinutes / input.studyTargetMinutes) * 100;
    studyScore = Math.min(100, Math.max(0, Math.round(ratio)));
    studyExplanation = `${input.studyActualMinutes}m studied of ${input.studyTargetMinutes}m planned target.`;
  }

  // 2. Sleep Routine
  let sleepScore: number | null = null;
  let sleepHasData = false;
  let sleepExplanation = "No sleep logs recorded in this period.";

  if (
    typeof input.sleepLoggedHours === "number" &&
    typeof input.sleepTargetHours === "number" &&
    input.sleepTargetHours > 0
  ) {
    sleepHasData = true;
    const diff = Math.abs(input.sleepLoggedHours - input.sleepTargetHours);
    // Score decreases as deviation grows (penalty of 15% per hour away from target)
    const raw = 100 - diff * 15;
    sleepScore = Math.min(100, Math.max(0, Math.round(raw)));
    sleepExplanation = `Average ${input.sleepLoggedHours.toFixed(1)}h logged vs ${input.sleepTargetHours.toFixed(1)}h target.`;
  }

  // 3. Habit Consistency
  let habitsScore: number | null = null;
  let habitsHasData = false;
  let habitsExplanation = "No scheduled habits in this period.";

  if (
    typeof input.habitsEligible === "number" &&
    input.habitsEligible > 0 &&
    typeof input.habitsCompleted === "number"
  ) {
    habitsHasData = true;
    const ratio = (input.habitsCompleted / input.habitsEligible) * 100;
    habitsScore = Math.min(100, Math.max(0, Math.round(ratio)));
    habitsExplanation = `${input.habitsCompleted} completed out of ${input.habitsEligible} scheduled habit days.`;
  }

  // 4. Personal Goal Progress
  let goalsScore: number | null = null;
  let goalsHasData = false;
  let goalsExplanation = "No active goals in progress.";

  if (
    typeof input.goalsActiveCount === "number" &&
    input.goalsActiveCount > 0 &&
    typeof input.goalsAverageProgress === "number"
  ) {
    goalsHasData = true;
    goalsScore = Math.min(100, Math.max(0, Math.round(input.goalsAverageProgress)));
    goalsExplanation = `${input.goalsActiveCount} active goals tracked at average ${goalsScore}% progress.`;
  }

  // 5. Wellbeing Check-ins
  let wellbeingScore: number | null = null;
  let wellbeingHasData = false;
  let wellbeingExplanation = "No daily check-ins recorded in this period.";

  if (
    typeof input.wellbeingPeriodDays === "number" &&
    input.wellbeingPeriodDays > 0 &&
    typeof input.wellbeingCheckinsCount === "number"
  ) {
    wellbeingHasData = true;
    const ratio = (input.wellbeingCheckinsCount / input.wellbeingPeriodDays) * 100;
    wellbeingScore = Math.min(100, Math.max(0, Math.round(ratio)));
    wellbeingExplanation = `${input.wellbeingCheckinsCount} check-in days logged out of ${input.wellbeingPeriodDays} days.`;
  }

  // Calculate coverage
  const totalDimensions = 5;
  const validDimensionsCount = [
    studyHasData,
    sleepHasData,
    habitsHasData,
    goalsHasData,
    wellbeingHasData,
  ].filter(Boolean).length;

  const coveragePct = Math.round((validDimensionsCount / totalDimensions) * 100);

  // Minimum data requirements:
  // Need at least 2 dimensions (40% coverage) to compute any score
  if (validDimensionsCount < 2) {
    return {
      totalScore: null,
      status: "insufficient_data",
      coveragePct,
      dimensions: {
        study: { score: studyScore, weight: safeWeights.study, normalizedWeight: 0, hasData: studyHasData, explanation: studyExplanation },
        sleep: { score: sleepScore, weight: safeWeights.sleep, normalizedWeight: 0, hasData: sleepHasData, explanation: sleepExplanation },
        habits: { score: habitsScore, weight: safeWeights.habits, normalizedWeight: 0, hasData: habitsHasData, explanation: habitsExplanation },
        goals: { score: goalsScore, weight: safeWeights.goals, normalizedWeight: 0, hasData: goalsHasData, explanation: goalsExplanation },
        wellbeing: { score: wellbeingScore, weight: safeWeights.wellbeing, normalizedWeight: 0, hasData: wellbeingHasData, explanation: wellbeingExplanation },
      },
      scoringVersion: version,
      summaryExplanation: "FocusMate requires data across at least 2 life dimensions before computing your Life Balance Score.",
    };
  }

  // Normalize weights among dimensions that have data
  let validWeightSum = 0;
  if (studyHasData) validWeightSum += safeWeights.study;
  if (sleepHasData) validWeightSum += safeWeights.sleep;
  if (habitsHasData) validWeightSum += safeWeights.habits;
  if (goalsHasData) validWeightSum += safeWeights.goals;
  if (wellbeingHasData) validWeightSum += safeWeights.wellbeing;

  let weightedScoreSum = 0;
  if (studyHasData && studyScore !== null) weightedScoreSum += studyScore * safeWeights.study;
  if (sleepHasData && sleepScore !== null) weightedScoreSum += sleepScore * safeWeights.sleep;
  if (habitsHasData && habitsScore !== null) weightedScoreSum += habitsScore * safeWeights.habits;
  if (goalsHasData && goalsScore !== null) weightedScoreSum += goalsScore * safeWeights.goals;
  if (wellbeingHasData && wellbeingScore !== null) weightedScoreSum += wellbeingScore * safeWeights.wellbeing;

  const totalScore = Math.round(weightedScoreSum / validWeightSum);
  const status: "sufficient_data" | "provisional" = validDimensionsCount >= 4 ? "sufficient_data" : "provisional";

  return {
    totalScore,
    status,
    coveragePct,
    dimensions: {
      study: {
        score: studyScore,
        weight: safeWeights.study,
        normalizedWeight: studyHasData ? Number((safeWeights.study / validWeightSum).toFixed(2)) : 0,
        hasData: studyHasData,
        explanation: studyExplanation,
      },
      sleep: {
        score: sleepScore,
        weight: safeWeights.sleep,
        normalizedWeight: sleepHasData ? Number((safeWeights.sleep / validWeightSum).toFixed(2)) : 0,
        hasData: sleepHasData,
        explanation: sleepExplanation,
      },
      habits: {
        score: habitsScore,
        weight: safeWeights.habits,
        normalizedWeight: habitsHasData ? Number((safeWeights.habits / validWeightSum).toFixed(2)) : 0,
        hasData: habitsHasData,
        explanation: habitsExplanation,
      },
      goals: {
        score: goalsScore,
        weight: safeWeights.goals,
        normalizedWeight: goalsHasData ? Number((safeWeights.goals / validWeightSum).toFixed(2)) : 0,
        hasData: goalsHasData,
        explanation: goalsExplanation,
      },
      wellbeing: {
        score: wellbeingScore,
        weight: safeWeights.wellbeing,
        normalizedWeight: wellbeingHasData ? Number((safeWeights.wellbeing / validWeightSum).toFixed(2)) : 0,
        hasData: wellbeingHasData,
        explanation: wellbeingExplanation,
      },
    },
    scoringVersion: version,
    summaryExplanation:
      status === "provisional"
        ? `Provisional score based on ${validDimensionsCount} of 5 dimensions (${coveragePct}% data coverage). Add logs in other areas for full accuracy.`
        : `Balanced score computed across ${validDimensionsCount} dimensions with complete data coverage.`,
  };
}
