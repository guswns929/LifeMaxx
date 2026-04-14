import { STRENGTH_STANDARDS, type StandardRow } from "./strength-standards";
import { calculateE1RM } from "./scoring";

export interface RankingResult {
  percentile: number;
  level: string;
  exerciseRankings: ExerciseRanking[];
}

export interface ExerciseRanking {
  exerciseName: string;
  e1rm: number;
  percentile: number;
  level: string;
}

function interpolateStandard(
  rows: StandardRow[],
  bodyWeight: number
): { beginner: number; novice: number; intermediate: number; advanced: number; elite: number } | null {
  if (rows.length === 0) return null;

  // Sort by body weight
  const sorted = [...rows].sort((a, b) => a.bodyWeightKg - b.bodyWeightKg);

  // Clamp to range
  if (bodyWeight <= sorted[0].bodyWeightKg) {
    return sorted[0];
  }
  if (bodyWeight >= sorted[sorted.length - 1].bodyWeightKg) {
    return sorted[sorted.length - 1];
  }

  // Find surrounding rows
  let lower = sorted[0];
  let upper = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (bodyWeight >= sorted[i].bodyWeightKg && bodyWeight <= sorted[i + 1].bodyWeightKg) {
      lower = sorted[i];
      upper = sorted[i + 1];
      break;
    }
  }

  const t = (bodyWeight - lower.bodyWeightKg) / (upper.bodyWeightKg - lower.bodyWeightKg);
  return {
    beginner: lower.beginner + t * (upper.beginner - lower.beginner),
    novice: lower.novice + t * (upper.novice - lower.novice),
    intermediate: lower.intermediate + t * (upper.intermediate - lower.intermediate),
    advanced: lower.advanced + t * (upper.advanced - lower.advanced),
    elite: lower.elite + t * (upper.elite - lower.elite),
  };
}

function e1rmToPercentile(
  e1rm: number,
  standards: { beginner: number; novice: number; intermediate: number; advanced: number; elite: number }
): { percentile: number; level: string } {
  const { beginner, novice, intermediate, advanced, elite } = standards;

  if (e1rm < beginner) {
    const pct = Math.max(0, (e1rm / beginner) * 20);
    return { percentile: Math.round(pct), level: "Untrained" };
  }
  if (e1rm < novice) {
    const pct = 20 + ((e1rm - beginner) / (novice - beginner)) * 20;
    return { percentile: Math.round(pct), level: "Beginner" };
  }
  if (e1rm < intermediate) {
    const pct = 40 + ((e1rm - novice) / (intermediate - novice)) * 20;
    return { percentile: Math.round(pct), level: "Novice" };
  }
  if (e1rm < advanced) {
    const pct = 60 + ((e1rm - intermediate) / (advanced - intermediate)) * 20;
    return { percentile: Math.round(pct), level: "Intermediate" };
  }
  if (e1rm < elite) {
    const pct = 80 + ((e1rm - advanced) / (elite - advanced)) * 12;
    return { percentile: Math.round(pct), level: "Advanced" };
  }
  return { percentile: Math.min(99, Math.round(92 + ((e1rm - elite) / elite) * 50)), level: "Elite" };
}

export function getExerciseRanking(
  exerciseName: string,
  bestWeight: number,
  bestReps: number,
  sex: "male" | "female",
  bodyWeightKg: number
): ExerciseRanking | null {
  const rows = STRENGTH_STANDARDS.filter(
    (s) => s.exerciseName === exerciseName && s.sex === sex
  );
  const standards = interpolateStandard(rows, bodyWeightKg);
  if (!standards) return null;

  const e1rm = calculateE1RM(bestWeight, bestReps);
  const { percentile, level } = e1rmToPercentile(e1rm, standards);

  return { exerciseName, e1rm, percentile, level };
}

export function getMuscleRanking(
  exerciseRankings: ExerciseRanking[]
): { percentile: number; level: string } {
  if (exerciseRankings.length === 0) return { percentile: 0, level: "Untrained" };

  const avgPercentile =
    exerciseRankings.reduce((sum, r) => sum + r.percentile, 0) / exerciseRankings.length;

  const percentile = Math.round(avgPercentile);
  let level = "Untrained";
  if (percentile >= 92) level = "Elite";
  else if (percentile >= 80) level = "Advanced";
  else if (percentile >= 60) level = "Intermediate";
  else if (percentile >= 40) level = "Novice";
  else if (percentile >= 20) level = "Beginner";

  return { percentile, level };
}

export function getStandardsForExercise(
  exerciseName: string,
  sex: "male" | "female",
  bodyWeightKg: number
) {
  const rows = STRENGTH_STANDARDS.filter(
    (s) => s.exerciseName === exerciseName && s.sex === sex
  );
  return interpolateStandard(rows, bodyWeightKg);
}
