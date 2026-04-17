import { STRENGTH_STANDARDS, type StandardRow } from "./strength-standards";
import { calculateE1RM } from "./scoring";

/**
 * Percentile Ranking Algorithm
 * ────────────────────────────
 * Strength is log-normally distributed across a population (large right tail:
 * most people cluster around novice/intermediate; a small fraction reach
 * advanced/elite). To produce an honest percentile, we:
 *
 *   1. Treat the five strength standards as anchor percentiles.
 *      StrengthLevel-style classification:
 *        beginner     → 5th  percentile  (consistent trainees, no real PRs)
 *        novice       → 25th percentile  (≈3–6 months trained)
 *        intermediate → 50th percentile  (≈1–2 years trained)
 *        advanced     → 85th percentile  (≈3–5 years dedicated training)
 *        elite        → 97th percentile  (competitive / drug-free elite)
 *
 *   2. Interpolate the user's e1RM between anchors in log-space. Because
 *      strength doubles aren't linear (225 → 315 bench is harder than 135 →
 *      225), a log-linear curve gives a more realistic rank than raw linear.
 *
 *   3. For aggregate (per-muscle, per-user) rankings we AVERAGE IN Z-SPACE,
 *      not percentile space. Averaging percentiles flattens extremes (a 99th
 *      + 50th would read as 74th, even though it represents a very unusual
 *      strength profile). Converting to z-scores, averaging, and mapping
 *      back preserves the geometry of the tails.
 *
 * References:
 *   - Symmonds & Isola (2013), PLoS ONE — Log-normality of strength data
 *   - strengthlevel.com methodology notes
 *   - CDC growth-chart methodology (z-score aggregation)
 */

// ── Types ────────────────────────────────────────────────────────────

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

type Standards = {
  beginner: number;
  novice: number;
  intermediate: number;
  advanced: number;
  elite: number;
};

// Anchor percentile assignments (see doc block above).
const ANCHOR_PCTS = { beginner: 5, novice: 25, intermediate: 50, advanced: 85, elite: 97 } as const;

// ── Interpolation of body-weight-specific standards ──────────────────

function interpolateStandard(rows: StandardRow[], bodyWeight: number): Standards | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => a.bodyWeightKg - b.bodyWeightKg);

  if (bodyWeight <= sorted[0].bodyWeightKg) return sorted[0];
  if (bodyWeight >= sorted[sorted.length - 1].bodyWeightKg) return sorted[sorted.length - 1];

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

// ── Percentile ↔ Z-score (standard normal) ───────────────────────────
// Acklam's rational approximation for the inverse standard normal CDF.
// Accurate to ~1e-9 over the full range.

function invNormalCDF(p: number): number {
  const clamped = Math.max(1e-6, Math.min(1 - 1e-6, p));
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const plow = 0.02425, phigh = 1 - plow;
  let q: number, r: number;
  if (clamped < plow) {
    q = Math.sqrt(-2 * Math.log(clamped));
    return (((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) / ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
  }
  if (clamped <= phigh) {
    q = clamped - 0.5;
    r = q*q;
    return (((((a[0]*r + a[1])*r + a[2])*r + a[3])*r + a[4])*r + a[5])*q / (((((b[0]*r + b[1])*r + b[2])*r + b[3])*r + b[4])*r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - clamped));
  return -(((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) / ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
}

// Standard normal CDF via Abramowitz & Stegun 7.1.26 error-function approximation.
function normalCDF(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429*t - 1.453152027)*t) + 1.421413741)*t - 0.284496736)*t + 0.254829592)*t * Math.exp(-x*x);
  return 0.5 * (1 + sign * y);
}

function pctToZ(pct: number): number {
  return invNormalCDF(Math.max(0.5, Math.min(99.5, pct)) / 100);
}

function zToPct(z: number): number {
  return normalCDF(z) * 100;
}

// ── Core: e1RM → percentile via log-linear interpolation between anchors ─

function e1rmToPercentile(e1rm: number, std: Standards): { percentile: number; level: string } {
  if (e1rm <= 0) return { percentile: 0, level: "Untrained" };

  // Below beginner: linearly scale from 0 up to the beginner anchor percentile.
  if (e1rm < std.beginner) {
    const pct = (e1rm / std.beginner) * ANCHOR_PCTS.beginner;
    return { percentile: Math.max(0, Math.round(pct)), level: "Untrained" };
  }

  // Anchors in order; we locate which bracket [lo, hi] the lift falls into and
  // interpolate linearly in ln(weight) ↔ percentile space.
  const points: Array<{ w: number; p: number; label: string }> = [
    { w: std.beginner,     p: ANCHOR_PCTS.beginner,     label: "Beginner" },
    { w: std.novice,       p: ANCHOR_PCTS.novice,       label: "Novice" },
    { w: std.intermediate, p: ANCHOR_PCTS.intermediate, label: "Intermediate" },
    { w: std.advanced,     p: ANCHOR_PCTS.advanced,     label: "Advanced" },
    { w: std.elite,        p: ANCHOR_PCTS.elite,        label: "Elite" },
  ];

  // At or above elite: extrapolate slowly, capped at 99.
  if (e1rm >= std.elite) {
    const logRatio = Math.log(e1rm / std.elite);
    const logElite = Math.log(std.elite / std.advanced);
    const extraPct = (logRatio / logElite) * (100 - ANCHOR_PCTS.elite);
    return { percentile: Math.min(99, Math.round(ANCHOR_PCTS.elite + extraPct)), level: "Elite" };
  }

  // Walk brackets; interpolate in log-space.
  for (let i = 0; i < points.length - 1; i++) {
    const lo = points[i], hi = points[i + 1];
    if (e1rm >= lo.w && e1rm < hi.w) {
      const t = (Math.log(e1rm) - Math.log(lo.w)) / (Math.log(hi.w) - Math.log(lo.w));
      const pct = lo.p + t * (hi.p - lo.p);
      return { percentile: Math.round(pct), level: lo.label };
    }
  }

  return { percentile: ANCHOR_PCTS.beginner, level: "Beginner" };
}

// ── Public API ───────────────────────────────────────────────────────

export function getExerciseRanking(
  exerciseName: string,
  bestWeight: number,
  bestReps: number,
  sex: "male" | "female",
  bodyWeightKg: number
): ExerciseRanking | null {
  const rows = STRENGTH_STANDARDS.filter((s) => s.exerciseName === exerciseName && s.sex === sex);
  const standards = interpolateStandard(rows, bodyWeightKg);
  if (!standards) return null;

  const e1rm = calculateE1RM(bestWeight, bestReps);
  const { percentile, level } = e1rmToPercentile(e1rm, standards);
  return { exerciseName, e1rm, percentile, level };
}

/**
 * Aggregate percentile across multiple exercises (e.g. all lifts hitting one
 * muscle group, or all tracked lifts for an overall rank).
 *
 * Aggregation is done in z-space: each exercise percentile → z-score, average
 * them, map the mean z back to a percentile. This keeps extreme values honest
 * — a 97 + 50 averages to ~80 (which is roughly right) instead of 74 (which
 * under-weights the exceptional lift).
 */
export function getMuscleRanking(
  exerciseRankings: ExerciseRanking[]
): { percentile: number; level: string } {
  if (exerciseRankings.length === 0) return { percentile: 0, level: "Untrained" };

  const zs = exerciseRankings.map((r) => pctToZ(r.percentile));
  const meanZ = zs.reduce((a, b) => a + b, 0) / zs.length;
  const percentile = Math.round(zToPct(meanZ));

  let level = "Untrained";
  if (percentile >= ANCHOR_PCTS.elite)        level = "Elite";
  else if (percentile >= ANCHOR_PCTS.advanced) level = "Advanced";
  else if (percentile >= ANCHOR_PCTS.intermediate) level = "Intermediate";
  else if (percentile >= ANCHOR_PCTS.novice)   level = "Novice";
  else if (percentile >= ANCHOR_PCTS.beginner) level = "Beginner";

  return { percentile, level };
}

export function getStandardsForExercise(
  exerciseName: string,
  sex: "male" | "female",
  bodyWeightKg: number
) {
  const rows = STRENGTH_STANDARDS.filter((s) => s.exerciseName === exerciseName && s.sex === sex);
  return interpolateStandard(rows, bodyWeightKg);
}

// Exposed for explanation UI / tests.
export const RANKING_ANCHORS = ANCHOR_PCTS;
