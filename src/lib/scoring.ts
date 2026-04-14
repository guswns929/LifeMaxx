// Development Score Algorithm
// Composite of 4 sub-scores, each 0-100, weighted to produce final 0-100 score

export interface DevelopmentScore {
  overall: number;
  volumeTrend: number;
  strengthLevel: number;
  frequency: number;
  recency: number;
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Epley formula for estimated 1RM
export function calculateE1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  if (reps <= 15) {
    return weight * (1 + reps / 30);
  }
  // Brzycki for high rep ranges
  return weight * (36 / (37 - reps));
}

// Sub-score 1: Volume Load Trend (35%)
// Linear regression on 8 weeks of volume data
export function calcVolumeTrendScore(weeklyVolumes: WeeklyVolume[]): number {
  if (weeklyVolumes.length < 2) return 50;

  const n = weeklyVolumes.length;
  const xs = weeklyVolumes.map((_, i) => i);
  const ys = weeklyVolumes.map((w) => w.volume);

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xs[i] - meanX) * (ys[i] - meanY);
    denominator += (xs[i] - meanX) ** 2;
  }

  if (denominator === 0 || meanY === 0) return 50;

  const slope = numerator / denominator;
  const weeklyChangeRate = slope / meanY; // as fraction of mean
  const targetRate = 0.025; // 2.5% weekly increase

  return clamp(50 + (weeklyChangeRate / targetRate) * 50, 0, 100);
}

// Sub-score 2: Strength Level relative to standards (35%)
export function calcStrengthLevelScore(
  e1rm: number,
  standards: { beginner: number; novice: number; intermediate: number; advanced: number; elite: number } | null
): number {
  if (!standards || e1rm <= 0) return 0;
  const { beginner, novice, intermediate, advanced, elite } = standards;

  if (e1rm < beginner) return clamp((e1rm / beginner) * 20, 0, 20);
  if (e1rm < novice) return 20 + ((e1rm - beginner) / (novice - beginner)) * 15;
  if (e1rm < intermediate) return 35 + ((e1rm - novice) / (intermediate - novice)) * 15;
  if (e1rm < advanced) return 50 + ((e1rm - intermediate) / (advanced - intermediate)) * 20;
  if (e1rm < elite) return 70 + ((e1rm - advanced) / (elite - advanced)) * 15;
  return clamp(85 + ((e1rm - elite) / elite) * 100, 85, 100);
}

// Sub-score 3: Training Frequency (15%)
export function calcFrequencyScore(avgWeeklyFrequency: number, optimalFrequency: number): number {
  if (optimalFrequency <= 0) return 0;
  return clamp((avgWeeklyFrequency / optimalFrequency) * 100, 0, 100);
}

// Sub-score 4: Recency (15%)
export function calcRecencyScore(daysSinceLastTrained: number): number {
  const decayDays = 14;
  return Math.max(0, 100 - (daysSinceLastTrained * 100) / decayDays);
}

// Composite development score
export function calculateDevelopmentScore(params: {
  weeklyVolumes: WeeklyVolume[];
  bestE1RM: number;
  standards: { beginner: number; novice: number; intermediate: number; advanced: number; elite: number } | null;
  avgWeeklyFrequency: number;
  optimalFrequency: number;
  daysSinceLastTrained: number;
}): DevelopmentScore {
  const volumeTrend = calcVolumeTrendScore(params.weeklyVolumes);
  const strengthLevel = calcStrengthLevelScore(params.bestE1RM, params.standards);
  const frequency = calcFrequencyScore(params.avgWeeklyFrequency, params.optimalFrequency);
  const recency = calcRecencyScore(params.daysSinceLastTrained);

  const overall = Math.round(
    volumeTrend * 0.35 + strengthLevel * 0.35 + frequency * 0.15 + recency * 0.15
  );

  return { overall, volumeTrend, strengthLevel, frequency, recency };
}

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
