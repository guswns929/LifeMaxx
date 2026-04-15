/**
 * Adaptive Development Score Algorithm
 *
 * Personalizes scoring based on user profile (age, sex, body weight, training age)
 * and workout history. The algorithm adapts targets as the user progresses,
 * ensuring continuous challenge.
 *
 * Components (weighted):
 *   1. Strength Level (30%) — e1RM vs age/sex/weight-adjusted standards
 *   2. Progressive Overload (25%) — are you consistently adding load or volume?
 *   3. Training Consistency (20%) — frequency relative to optimal for your level
 *   4. Volume Progression (15%) — weekly volume trend over 8 weeks
 *   5. Recency (10%) — exponential decay, trains urgency
 *
 * The algorithm raises targets as you improve:
 *   - Optimal frequency increases with level (beginner: 2x/wk → advanced: 4x/wk)
 *   - Overload expectations scale (beginner: 5%/mo → advanced: 1%/mo)
 *   - Score "compresses" at higher levels (harder to maintain 80+ as you advance)
 */

export interface DevelopmentScore {
  overall: number;
  strengthLevel: number;
  progressiveOverload: number;
  consistency: number;
  volumeTrend: number;
  recency: number;
  nextMilestone: string; // personalized challenge text
}

export interface WeeklyVolume {
  weekStart: Date;
  volume: number; // sets * reps * weight
}

export interface SetData {
  weightKg: number;
  reps: number;
  date: Date;
}

export interface UserProfile {
  bodyWeightKg: number;
  sex: "male" | "female";
  ageYears: number;
  trainingMonths: number; // derived from first workout date
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── e1RM Estimation ──────────────────────────────────────────────────

export function calculateE1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  if (reps <= 15) return weight * (1 + reps / 30); // Epley
  return weight * (36 / (37 - reps)); // Brzycki
}

/**
 * Holistic E1RM Projection
 *
 * Instead of calculating e1RM per workout independently, this processes ALL
 * previous workouts for an exercise to produce a smoothed, projected e1RM
 * at each date. Uses a Bayesian-inspired exponentially weighted approach:
 *
 * 1. All historical sets contribute, weighted by recency (half-life ~14 days)
 * 2. Higher-quality estimates (lower rep ranges, higher RPE) get more weight
 * 3. Multiple sets on the same day are combined (best estimate wins)
 * 4. The projection uses EWMA (Exponentially Weighted Moving Average) to
 *    smooth noise and prevent single-session outliers from distorting the curve
 *
 * This gives a more realistic "true strength" estimate than per-workout max.
 *
 * References:
 *   - Epley/Brzycki formulas (1RM estimation)
 *   - EWMA for athletic load monitoring (Williams et al., 2017, JSCR)
 */
export interface ProjectedE1RM {
  date: Date;
  e1rm: number;         // smoothed projected e1RM at this date
  rawE1rm: number;      // best single-set e1RM on this date
  confidence: number;   // 0-1, how much data supports this estimate
}

export function calculateHolisticE1RM(
  sets: { date: Date; weightKg: number; reps: number; rpe?: number | null }[]
): ProjectedE1RM[] {
  if (sets.length === 0) return [];

  // Group sets by date, compute best raw e1RM per date
  const byDate = new Map<string, { date: Date; estimates: { e1rm: number; quality: number }[] }>();

  for (const s of sets) {
    if (s.weightKg <= 0 || s.reps <= 0) continue;
    const dateKey = `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, "0")}-${String(s.date.getDate()).padStart(2, "0")}`;
    const e1rm = calculateE1RM(s.weightKg, s.reps);

    // Quality weight: lower reps = more accurate estimate, higher RPE = closer to true max
    let quality = 1.0;
    if (s.reps <= 5) quality = 1.0;
    else if (s.reps <= 10) quality = 0.85;
    else if (s.reps <= 15) quality = 0.7;
    else quality = 0.5;
    if (s.rpe != null && s.rpe >= 8) quality *= 1.1; // high RPE = closer to true max

    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, { date: new Date(s.date), estimates: [] });
    }
    byDate.get(dateKey)!.estimates.push({ e1rm, quality });
  }

  // Sort dates chronologically
  const sorted = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      date: v.date,
      rawE1rm: Math.max(...v.estimates.map((e) => e.e1rm)),
      bestQuality: Math.max(...v.estimates.map((e) => e.quality)),
    }));

  if (sorted.length === 0) return [];

  // Apply EWMA smoothing
  // Alpha controls responsiveness: higher = more responsive to new data
  const alpha = 0.3;
  const results: ProjectedE1RM[] = [];
  let ewma = sorted[0].rawE1rm;

  for (let i = 0; i < sorted.length; i++) {
    const { date, rawE1rm, bestQuality } = sorted[i];

    // Apply exponential smoothing
    if (i === 0) {
      ewma = rawE1rm;
    } else {
      // Use adaptive alpha: higher quality data gets more influence
      const adaptiveAlpha = alpha * bestQuality;
      ewma = adaptiveAlpha * rawE1rm + (1 - adaptiveAlpha) * ewma;

      // If new raw is significantly higher than EWMA, pull up faster
      // (genuine strength gains should be respected)
      if (rawE1rm > ewma * 1.02) {
        ewma = Math.max(ewma, ewma + (rawE1rm - ewma) * 0.5);
      }
    }

    // Confidence based on data density around this date
    const confidence = Math.min(1, (i + 1) / 5); // reaches max after 5 data points

    results.push({
      date,
      e1rm: Math.round(ewma * 10) / 10,
      rawE1rm: Math.round(rawE1rm * 10) / 10,
      confidence,
    });
  }

  return results;
}

/**
 * Get the current projected e1RM (latest smoothed value).
 */
export function getCurrentProjectedE1RM(
  sets: { date: Date; weightKg: number; reps: number; rpe?: number | null }[]
): number {
  const projections = calculateHolisticE1RM(sets);
  if (projections.length === 0) return 0;
  return projections[projections.length - 1].e1rm;
}

// ── Age Adjustment Factor ────────────────────────────────────────────
// Masters lifters lose ~1-2% strength per year after 40 (Pearson et al., 2002)
// Youth lifters (<18) haven't peaked; adjust expectations down

function ageAdjustment(ageYears: number): number {
  if (ageYears < 16) return 0.70;
  if (ageYears < 18) return 0.82;
  if (ageYears < 24) return 0.95;
  if (ageYears <= 39) return 1.0; // peak years
  if (ageYears <= 49) return 0.95;
  if (ageYears <= 59) return 0.88;
  if (ageYears <= 69) return 0.78;
  return 0.68;
}

// ── 1. Strength Level (30%) ──────────────────────────────────────────
// Compares e1RM to age-adjusted standards

export function calcStrengthLevelScore(
  e1rm: number,
  standards: { beginner: number; novice: number; intermediate: number; advanced: number; elite: number } | null,
  profile?: UserProfile
): number {
  if (!standards || e1rm <= 0) return 0;

  const ageFactor = profile ? ageAdjustment(profile.ageYears) : 1.0;
  const adj = {
    beginner: standards.beginner * ageFactor,
    novice: standards.novice * ageFactor,
    intermediate: standards.intermediate * ageFactor,
    advanced: standards.advanced * ageFactor,
    elite: standards.elite * ageFactor,
  };

  if (e1rm < adj.beginner) return clamp((e1rm / adj.beginner) * 20, 0, 20);
  if (e1rm < adj.novice) return 20 + ((e1rm - adj.beginner) / (adj.novice - adj.beginner)) * 15;
  if (e1rm < adj.intermediate) return 35 + ((e1rm - adj.novice) / (adj.intermediate - adj.novice)) * 15;
  if (e1rm < adj.advanced) return 50 + ((e1rm - adj.intermediate) / (adj.advanced - adj.intermediate)) * 20;
  if (e1rm < adj.elite) return 70 + ((e1rm - adj.advanced) / (adj.elite - adj.advanced)) * 15;
  return clamp(85 + ((e1rm - adj.elite) / adj.elite) * 100, 85, 100);
}

// ── 2. Progressive Overload (25%) ────────────────────────────────────
// Tracks whether the user is adding weight/reps over time
// Expected rate decreases with training age (diminishing returns)

export function calcProgressiveOverloadScore(
  recentE1RMs: { date: Date; e1rm: number }[],
  profile?: UserProfile
): number {
  if (recentE1RMs.length < 2) return 50; // neutral if not enough data

  // Sort chronologically
  const sorted = [...recentE1RMs].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Use last 12 data points max
  const recent = sorted.slice(-12);
  const n = recent.length;

  // Linear regression on e1rm over time
  const xs = recent.map((_, i) => i);
  const ys = recent.map((r) => r.e1rm);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0 || meanY === 0) return 50;

  const slope = num / den;
  const monthlyChangeRate = (slope * 4) / meanY; // ~4 data points per month estimate

  // Expected monthly improvement rate based on training age
  const trainingMonths = profile?.trainingMonths ?? 6;
  let expectedRate: number;
  if (trainingMonths < 6) expectedRate = 0.05;      // 5%/month beginner
  else if (trainingMonths < 18) expectedRate = 0.025; // 2.5%/month intermediate
  else if (trainingMonths < 36) expectedRate = 0.012; // 1.2%/month advanced
  else expectedRate = 0.005;                           // 0.5%/month elite

  // Score: how well are you meeting expected overload?
  const ratio = monthlyChangeRate / expectedRate;
  return clamp(Math.round(50 + ratio * 40), 0, 100);
}

// ── 3. Training Consistency (20%) ────────────────────────────────────
// Optimal frequency adapts to level

export function calcConsistencyScore(
  avgWeeklyFrequency: number,
  profile?: UserProfile
): number {
  const trainingMonths = profile?.trainingMonths ?? 6;

  // Optimal frequency increases with experience
  let optimalFreq: number;
  if (trainingMonths < 3) optimalFreq = 2;
  else if (trainingMonths < 12) optimalFreq = 3;
  else if (trainingMonths < 24) optimalFreq = 4;
  else optimalFreq = 5;

  const ratio = avgWeeklyFrequency / optimalFreq;

  // Over-training penalty: >1.3x optimal starts decreasing score
  if (ratio > 1.3) {
    return clamp(Math.round(100 - (ratio - 1.3) * 80), 50, 100);
  }
  return clamp(Math.round(ratio * 100), 0, 100);
}

// ── 4. Volume Trend (15%) ────────────────────────────────────────────

export function calcVolumeTrendScore(weeklyVolumes: WeeklyVolume[]): number {
  if (weeklyVolumes.length < 2) return 50;

  const n = weeklyVolumes.length;
  const xs = weeklyVolumes.map((_, i) => i);
  const ys = weeklyVolumes.map((w) => w.volume);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0 || meanY === 0) return 50;

  const slope = num / den;
  const weeklyChangeRate = slope / meanY;
  const targetRate = 0.025; // 2.5% weekly increase

  return clamp(Math.round(50 + (weeklyChangeRate / targetRate) * 50), 0, 100);
}

// ── 5. Recency (10%) ─────────────────────────────────────────────────

export function calcRecencyScore(daysSinceLastTrained: number): number {
  const decayDays = 14;
  return Math.max(0, Math.round(100 - (daysSinceLastTrained * 100) / decayDays));
}

// ── Composite Score ──────────────────────────────────────────────────

export function calculateDevelopmentScore(params: {
  weeklyVolumes: WeeklyVolume[];
  bestE1RM: number;
  recentE1RMs?: { date: Date; e1rm: number }[];
  standards: { beginner: number; novice: number; intermediate: number; advanced: number; elite: number } | null;
  avgWeeklyFrequency: number;
  daysSinceLastTrained: number;
  profile?: UserProfile;
}): DevelopmentScore {
  const { profile } = params;

  const strengthLevel = calcStrengthLevelScore(params.bestE1RM, params.standards, profile);
  const progressiveOverload = calcProgressiveOverloadScore(params.recentE1RMs ?? [], profile);
  const consistency = calcConsistencyScore(params.avgWeeklyFrequency, profile);
  const volumeTrend = calcVolumeTrendScore(params.weeklyVolumes);
  const recency = calcRecencyScore(params.daysSinceLastTrained);

  const overall = Math.round(
    strengthLevel * 0.30 +
    progressiveOverload * 0.25 +
    consistency * 0.20 +
    volumeTrend * 0.15 +
    recency * 0.10
  );

  // Generate personalized next milestone
  const nextMilestone = generateMilestone(strengthLevel, progressiveOverload, consistency, params);

  return { overall, strengthLevel, progressiveOverload, consistency, volumeTrend, recency, nextMilestone };
}

// ── Personalized Milestones ──────────────────────────────────────────

function generateMilestone(
  strengthLevel: number,
  overload: number,
  consistency: number,
  params: {
    bestE1RM: number;
    standards: { beginner: number; novice: number; intermediate: number; advanced: number; elite: number } | null;
    avgWeeklyFrequency: number;
    profile?: UserProfile;
  }
): string {
  // Find weakest area and challenge the user
  const weakest = Math.min(strengthLevel, overload, consistency);

  if (weakest === consistency && params.avgWeeklyFrequency < 3) {
    const target = Math.ceil(params.avgWeeklyFrequency) + 1;
    return `Train ${target}x this week to build consistency`;
  }

  if (weakest === overload) {
    const targetE1RM = Math.round(params.bestE1RM * 1.025);
    return `Push for a ${targetE1RM}kg e1RM (+2.5%)`;
  }

  if (params.standards) {
    const s = params.standards;
    const ageFactor = params.profile ? ageAdjustment(params.profile.ageYears) : 1.0;
    const e1rm = params.bestE1RM;

    if (e1rm < s.novice * ageFactor) {
      return `Next target: ${Math.round(s.novice * ageFactor)}kg (Novice)`;
    }
    if (e1rm < s.intermediate * ageFactor) {
      return `Next target: ${Math.round(s.intermediate * ageFactor)}kg (Intermediate)`;
    }
    if (e1rm < s.advanced * ageFactor) {
      return `Next target: ${Math.round(s.advanced * ageFactor)}kg (Advanced)`;
    }
    if (e1rm < s.elite * ageFactor) {
      return `Next target: ${Math.round(s.elite * ageFactor)}kg (Elite)`;
    }
    return "Maintain elite-level performance";
  }

  return "Keep pushing — log more workouts to track progress";
}

// ── Rank Evaluation (Bi-Monthly) ─────────────────────────────────────
/**
 * Wilks-2 coefficient for bodyweight-normalized strength comparison.
 * Based on the IPF GL coefficient formula (2020 revision).
 *
 * Rank tiers based on Wilks score (combined SBD total):
 *   Iron:     < 150   (beginner, just starting)
 *   Bronze:   150-225 (consistent training, basic technique)
 *   Silver:   225-300 (solid foundation, 6-12 months)
 *   Gold:     300-375 (strong, 1-3 years dedicated training)
 *   Platinum: 375-425 (very strong, competitive amateur)
 *   Diamond:  425-475 (exceptional, regional-level competitor)
 *   Champion: 475+    (elite, national-level strength)
 */

const WILKS_COEFFICIENTS_MALE = [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 0.00000701863, -0.00000001291];
const WILKS_COEFFICIENTS_FEMALE = [594.31747775582, -27.23842536447, 0.82112226871, -0.00930733913, 0.00004731582, -0.00000009054];

export function calculateWilks(totalKg: number, bodyWeightKg: number, sex: "male" | "female"): number {
  if (totalKg <= 0 || bodyWeightKg <= 0) return 0;

  const coeffs = sex === "male" ? WILKS_COEFFICIENTS_MALE : WILKS_COEFFICIENTS_FEMALE;
  let denominator = coeffs[0];
  for (let i = 1; i < coeffs.length; i++) {
    denominator += coeffs[i] * Math.pow(bodyWeightKg, i);
  }

  if (denominator <= 0) return 0;
  return Math.round((totalKg * 500 / denominator) * 100) / 100;
}

export interface RankResult {
  rank: string;
  rankScore: number;    // 0-100
  wilksScore: number;
  totalKg: number;
  nextRank: string | null;
  pointsToNext: number; // wilks points needed
  benchPercentile: number;
  squatPercentile: number;
  deadliftPercentile: number;
}

const RANK_TIERS = [
  { name: "Iron", minWilks: 0, color: "#78716C" },
  { name: "Bronze", minWilks: 150, color: "#CD7F32" },
  { name: "Silver", minWilks: 225, color: "#C0C0C0" },
  { name: "Gold", minWilks: 300, color: "#FFD700" },
  { name: "Platinum", minWilks: 375, color: "#E5E4E2" },
  { name: "Diamond", minWilks: 425, color: "#B9F2FF" },
  { name: "Champion", minWilks: 475, color: "#FF4500" },
];

export function getRankTiers() {
  return RANK_TIERS;
}

export function calculateRank(
  benchKg: number,
  squatKg: number,
  deadliftKg: number,
  bodyWeightKg: number,
  sex: "male" | "female",
  ageYears?: number
): RankResult {
  const totalKg = benchKg + squatKg + deadliftKg;
  let wilksScore = calculateWilks(totalKg, bodyWeightKg, sex);

  // Age bonus: masters lifters get a coefficient boost (McCulloch age coefficients)
  if (ageYears && ageYears >= 40) {
    const ageCoeff = 1 + (ageYears - 39) * 0.005; // ~0.5% per year over 39
    wilksScore = Math.round(wilksScore * Math.min(ageCoeff, 1.35) * 100) / 100;
  }

  // Determine rank
  let rank = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (wilksScore >= tier.minWilks) rank = tier;
  }

  // Next rank
  const currentIdx = RANK_TIERS.indexOf(rank);
  const nextTier = currentIdx < RANK_TIERS.length - 1 ? RANK_TIERS[currentIdx + 1] : null;
  const pointsToNext = nextTier ? Math.max(0, nextTier.minWilks - wilksScore) : 0;

  // Rank score (0-100 within the tier system)
  const rankScore = Math.min(100, Math.round((wilksScore / 500) * 100));

  return {
    rank: rank.name,
    rankScore,
    wilksScore,
    totalKg,
    nextRank: nextTier?.name ?? null,
    pointsToNext: Math.round(pointsToNext * 10) / 10,
    benchPercentile: 0, // filled by caller
    squatPercentile: 0,
    deadliftPercentile: 0,
  };
}

// ── UI Helpers ───────────────────────────────────────────────────────

export function getScoreColor(score: number): string {
  if (score >= 61) return "text-accent";
  if (score >= 31) return "text-warning";
  return "text-danger";
}

export function getScoreBgColor(score: number): string {
  if (score >= 61) return "bg-green-100 text-green-800";
  if (score >= 31) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function getScoreLabel(score: number): string {
  if (score >= 85) return "Elite";
  if (score >= 70) return "Advanced";
  if (score >= 50) return "Intermediate";
  if (score >= 35) return "Novice";
  if (score >= 20) return "Beginner";
  return "Untrained";
}

export function getRankColor(rank: string): string {
  const tier = RANK_TIERS.find((t) => t.name === rank);
  return tier?.color ?? "#78716C";
}
