/**
 * Daily Journal Analysis Engine
 *
 * Produces a comprehensive daily analysis with scored verdicts across
 * nutrition, training, recovery, and trends. Each score includes a detailed
 * explanation for why it was given.
 *
 * Scores are evidence-based with citations:
 *   - Nutrition: Helms et al. 2014, Morton et al. 2018, Iraki et al. 2019
 *   - Training: Schoenfeld et al. 2017 (volume), Gabbett 2016 (ACWR)
 *   - Recovery: Watson et al. 2017 (sleep), Plews et al. 2013 (HRV)
 *   - Trends: Hall et al. 2011 (weight loss rates), Trexler et al. 2014 (metabolic adaptation)
 */

export interface DailyInput {
  // Nutrition
  calories?: number;
  targetCalories?: number;
  proteinG?: number;
  targetProteinG?: number;
  carbsG?: number;
  fatG?: number;
  bodyWeightKg: number;
  phase: "cut" | "maintain" | "bulk";

  // Training
  todaySets: number;
  todayMusclesHit: string[];
  todayExercises: string[];
  todayStrainScore?: number | null;
  workoutType?: string; // "strength" | "cardio" | "misc"
  isCardioOrMisc?: boolean; // true if today had cardio/misc workouts
  whoopActivityStrain?: number | null; // strain from any WHOOP-tracked strenuous activity
  whoopActivityTypes?: string[]; // WHOOP sport_id values for today's activities
  cardioMinutes?: number; // total minutes of cardio/misc activities

  // Recovery
  whoopRecoveryScore?: number | null;
  sleepHours?: number | null;
  sleepPerformance?: number | null;

  // Trends (14-day)
  avgCalories14d?: number;
  avgProtein14d?: number;
  avgSleepHours14d?: number;
  trainingDays14d?: number;
  consecutiveTrainingDays?: number;
  weightChange14d?: number; // kg, positive = gaining
  volumeTrendPct?: number; // % change over period
  daysInPhase?: number;
}

export interface Verdict {
  category: "nutrition" | "training" | "recovery" | "trend";
  status: "optimal" | "good" | "warning" | "critical";
  title: string;
  explanation: string;
  evidence?: string; // research citation
}

export interface ScoreExplanation {
  score: number;
  label: string;
  factors: { name: string; value: number; maxValue: number; detail: string }[];
}

export interface DailyAnalysis {
  overallScore: number;
  nutritionScore: ScoreExplanation;
  trainingScore: ScoreExplanation;
  recoveryScore: ScoreExplanation;
  trendScore: ScoreExplanation;
  mpsScore: { score: number; explanation: string };
  phaseAlignment: { aligned: boolean; explanation: string };
  verdicts: Verdict[];
  recommendations: string[];
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function statusFromScore(score: number): "optimal" | "good" | "warning" | "critical" {
  if (score >= 80) return "optimal";
  if (score >= 60) return "good";
  if (score >= 40) return "warning";
  return "critical";
}

// ── Nutrition Scoring (40% of total) ─────────────────────────────────

function scoreNutrition(input: DailyInput): { score: ScoreExplanation; verdicts: Verdict[]; mps: { score: number; explanation: string } } {
  const verdicts: Verdict[] = [];
  const factors: ScoreExplanation["factors"] = [];

  // Calorie adherence
  let calorieScore = 50;
  if (input.calories != null && input.targetCalories != null && input.targetCalories > 0) {
    const deviation = Math.abs(input.calories - input.targetCalories) / input.targetCalories;
    if (input.phase === "cut") {
      // On a cut, being slightly under is fine, over is bad
      const isOver = input.calories > input.targetCalories;
      if (deviation < 0.05) calorieScore = 100;
      else if (deviation < 0.10) calorieScore = isOver ? 70 : 85;
      else if (deviation < 0.20) calorieScore = isOver ? 45 : 65;
      else calorieScore = isOver ? 20 : 40;
    } else if (input.phase === "bulk") {
      // On a bulk, being slightly over is fine, under is suboptimal
      const isUnder = input.calories < input.targetCalories;
      if (deviation < 0.05) calorieScore = 100;
      else if (deviation < 0.10) calorieScore = isUnder ? 70 : 85;
      else if (deviation < 0.20) calorieScore = isUnder ? 45 : 65;
      else calorieScore = isUnder ? 20 : 40;
    } else {
      if (deviation < 0.05) calorieScore = 100;
      else if (deviation < 0.10) calorieScore = 80;
      else if (deviation < 0.20) calorieScore = 55;
      else calorieScore = 30;
    }
    factors.push({
      name: "Calorie Adherence",
      value: calorieScore,
      maxValue: 100,
      detail: `${input.calories} / ${input.targetCalories} kcal (${deviation < 0.05 ? "on target" : `${Math.round(deviation * 100)}% ${input.calories > input.targetCalories ? "over" : "under"}`})`,
    });

    if (deviation > 0.15) {
      verdicts.push({
        category: "nutrition",
        status: deviation > 0.25 ? "critical" : "warning",
        title: `Calories ${input.calories > input.targetCalories ? "over" : "under"} target`,
        explanation: `You consumed ${input.calories} kcal vs target of ${input.targetCalories}. A ${Math.round(deviation * 100)}% deviation can impair your ${input.phase === "cut" ? "fat loss" : input.phase === "bulk" ? "muscle gain" : "body composition"} goals.`,
        evidence: "Hall et al., 2011 — Quantification of the effect of energy imbalance on bodyweight",
      });
    }
  }

  // Protein & MPS (Muscle Protein Synthesis)
  let proteinScore = 50;
  let mpsScore = 50;
  let mpsExplanation = "Insufficient data to assess MPS.";
  const proteinPerKg = input.proteinG != null ? input.proteinG / input.bodyWeightKg : 0;

  if (input.proteinG != null && input.bodyWeightKg > 0) {
    // MPS thresholds based on Morton et al., 2018 meta-analysis
    if (proteinPerKg >= 2.2) {
      proteinScore = 100;
      mpsScore = 100;
      mpsExplanation = `At ${proteinPerKg.toFixed(1)}g/kg, you're maximizing muscle protein synthesis. Research shows >1.6g/kg saturates MPS response in most individuals, and 2.2g/kg provides an additional safety margin during caloric restriction.`;
    } else if (proteinPerKg >= 1.6) {
      proteinScore = 80;
      mpsScore = 85;
      mpsExplanation = `At ${proteinPerKg.toFixed(1)}g/kg, you're meeting the minimum threshold for maximal MPS stimulation (1.6g/kg per Morton et al., 2018). ${input.phase === "cut" ? "Consider increasing to 2.0-2.4g/kg during your cut to prevent muscle loss (Helms et al., 2014)." : "This is adequate for your phase."}`;
    } else if (proteinPerKg >= 1.2) {
      proteinScore = 55;
      mpsScore = 60;
      mpsExplanation = `At ${proteinPerKg.toFixed(1)}g/kg, you're below the optimal MPS threshold of 1.6g/kg. You're leaving muscle growth on the table. Aim for at least ${Math.round(input.bodyWeightKg * 1.6)}g daily.`;
    } else {
      proteinScore = 25;
      mpsScore = 30;
      mpsExplanation = `At ${proteinPerKg.toFixed(1)}g/kg, protein intake is critically low for muscle maintenance. MPS is significantly blunted below 1.2g/kg. Risk of muscle loss${input.phase === "cut" ? " is elevated during your cut" : ""}.`;
      verdicts.push({
        category: "nutrition",
        status: "critical",
        title: "Protein intake critically low",
        explanation: `${input.proteinG}g protein (${proteinPerKg.toFixed(1)}g/kg) is well below the minimum 1.6g/kg recommended for muscle preservation.`,
        evidence: "Morton et al., 2018, Br J Sports Med — A systematic review of protein and MPS",
      });
    }
    factors.push({
      name: "Protein / MPS",
      value: proteinScore,
      maxValue: 100,
      detail: `${input.proteinG}g (${proteinPerKg.toFixed(1)}g/kg) — ${proteinPerKg >= 1.6 ? "MPS saturated" : "below MPS threshold"}`,
    });
  }

  // Macro balance
  let macroScore = 60;
  if (input.fatG != null && input.calories != null && input.calories > 0) {
    const fatPct = (input.fatG * 9) / input.calories;
    const fatPerKg = input.fatG / input.bodyWeightKg;
    if (fatPerKg < 0.5) {
      macroScore = 30;
      verdicts.push({
        category: "nutrition",
        status: "warning",
        title: "Fat intake too low",
        explanation: `${input.fatG}g fat (${fatPerKg.toFixed(1)}g/kg) is below the 0.5g/kg minimum needed for hormonal health.`,
        evidence: "Volek et al., 2006 — Dietary fat and testosterone",
      });
    } else if (fatPct >= 0.20 && fatPct <= 0.35) {
      macroScore = 90;
    } else {
      macroScore = 65;
    }
    factors.push({
      name: "Macro Balance",
      value: macroScore,
      maxValue: 100,
      detail: `Fat: ${input.fatG}g (${Math.round(fatPct * 100)}% of cals)${input.carbsG ? `, Carbs: ${input.carbsG}g` : ""}`,
    });
  }

  const overallNutrition = Math.round(calorieScore * 0.40 + proteinScore * 0.40 + macroScore * 0.20);

  return {
    score: {
      score: overallNutrition,
      label: "Nutrition",
      factors,
    },
    verdicts,
    mps: { score: mpsScore, explanation: mpsExplanation },
  };
}

// ── Training Scoring (25% of total) ──────────────────────────────────

function scoreTraining(input: DailyInput): { score: ScoreExplanation; verdicts: Verdict[] } {
  const verdicts: Verdict[] = [];
  const factors: ScoreExplanation["factors"] = [];

  // Volume assessment — considers both strength sets and cardio/strain
  let volumeScore = 50;
  const hasStrengthWork = input.todaySets > 0;
  const hasCardioWork = input.isCardioOrMisc || (input.whoopActivityStrain ?? 0) > 5;
  const cardioMin = input.cardioMinutes ?? 0;

  if (hasStrengthWork && hasCardioWork) {
    // Mixed session: score both components
    const strengthComponent = input.todaySets >= 4 && input.todaySets <= 25 ? 90 : input.todaySets < 4 ? 60 : 70;
    const cardioComponent = cardioMin >= 20 ? 85 : cardioMin >= 10 ? 70 : 60;
    volumeScore = Math.round(strengthComponent * 0.6 + cardioComponent * 0.4);
  } else if (hasStrengthWork) {
    if (input.todaySets >= 4 && input.todaySets <= 25) {
      volumeScore = 90;
    } else if (input.todaySets < 4) {
      volumeScore = 60;
    } else {
      volumeScore = 70;
      verdicts.push({
        category: "training",
        status: "warning",
        title: "Very high volume session",
        explanation: `${input.todaySets} sets may exceed your recovery capacity. Research suggests diminishing returns beyond 20-25 sets per session.`,
        evidence: "Schoenfeld et al., 2017 — Dose-response relationship of weekly resistance training volume",
      });
    }
  } else if (hasCardioWork) {
    // Pure cardio/misc day — score based on strain and duration
    const strainVal = input.whoopActivityStrain ?? input.todayStrainScore ?? 0;
    if (strainVal >= 8 && strainVal <= 16) volumeScore = 85;
    else if (strainVal >= 5) volumeScore = 75;
    else if (cardioMin >= 30) volumeScore = 80;
    else volumeScore = 65;
  }

  const volumeDetail = (() => {
    const parts: string[] = [];
    if (hasStrengthWork) parts.push(`${input.todaySets} sets across ${input.todayMusclesHit.length} muscles`);
    if (hasCardioWork && cardioMin > 0) parts.push(`${cardioMin}min cardio/misc`);
    if (parts.length > 0) return parts.join(" + ");
    return input.isCardioOrMisc ? "Cardio/misc workout logged" : "Rest day";
  })();

  factors.push({
    name: "Session Volume",
    value: volumeScore,
    maxValue: 100,
    detail: volumeDetail,
  });

  // Strain-aware training
  let strainScore = 70;
  const totalStrain = (input.todayStrainScore ?? 0) + (input.whoopActivityStrain ?? 0);
  if (totalStrain > 0) {
    const recovery = input.whoopRecoveryScore ?? 50;
    if (recovery < 33 && totalStrain > 14) {
      strainScore = 30;
      verdicts.push({
        category: "training",
        status: "critical",
        title: "High strain with low recovery",
        explanation: `Strain of ${totalStrain.toFixed(1)} combined with ${recovery}% recovery significantly increases injury risk. Consider lighter training or active recovery.`,
        evidence: "Gabbett, 2016 — The training-injury prevention paradox (ACWR model)",
      });
    } else if (recovery < 50 && totalStrain > 12) {
      strainScore = 50;
    } else if (totalStrain >= 8 && totalStrain <= 16) {
      strainScore = 90;
    }
    factors.push({
      name: "Strain vs Recovery",
      value: strainScore,
      maxValue: 100,
      detail: `Strain: ${totalStrain.toFixed(1)}${input.whoopRecoveryScore != null ? ` | Recovery: ${input.whoopRecoveryScore}%` : ""}`,
    });
  }

  // Exercise variety
  let varietyScore = 70;
  if (input.todayExercises.length >= 4) varietyScore = 90;
  else if (input.todayExercises.length >= 2) varietyScore = 75;
  else if (input.todayExercises.length === 1) varietyScore = 55;
  if (input.todayExercises.length > 0) {
    factors.push({
      name: "Exercise Variety",
      value: varietyScore,
      maxValue: 100,
      detail: `${input.todayExercises.length} exercise${input.todayExercises.length !== 1 ? "s" : ""}`,
    });
  }

  // Overtraining check
  let overtainingDeduction = 0;
  if ((input.consecutiveTrainingDays ?? 0) > 5) {
    overtainingDeduction = 15;
    verdicts.push({
      category: "training",
      status: "warning",
      title: "Extended training streak",
      explanation: `You've trained ${input.consecutiveTrainingDays} consecutive days. Recovery is essential for muscle adaptation. Consider a rest day.`,
      evidence: "Kreher & Schwartz, 2012 — Overtraining Syndrome: A Practical Guide",
    });
  }

  const avgFactors = factors.length > 0
    ? Math.round(factors.reduce((sum, f) => sum + f.value, 0) / factors.length)
    : 50;
  const overallTraining = clamp(avgFactors - overtainingDeduction, 0, 100);

  return {
    score: { score: overallTraining, label: "Training", factors },
    verdicts,
  };
}

// ── Recovery Scoring (15% of total) ──────────────────────────────────

function scoreRecovery(input: DailyInput): { score: ScoreExplanation; verdicts: Verdict[] } {
  const verdicts: Verdict[] = [];
  const factors: ScoreExplanation["factors"] = [];

  // Sleep
  let sleepScore = 50;
  if (input.sleepHours != null) {
    if (input.sleepHours >= 7 && input.sleepHours <= 9) {
      sleepScore = 100;
    } else if (input.sleepHours >= 6) {
      sleepScore = 65;
    } else {
      sleepScore = 30;
      verdicts.push({
        category: "recovery",
        status: "critical",
        title: "Insufficient sleep",
        explanation: `${input.sleepHours.toFixed(1)}h is below the 7-9h recommended by the AASM. Chronic sleep deprivation impairs recovery, muscle protein synthesis, and increases cortisol.`,
        evidence: "Watson et al., 2017 — ACSM consensus on sleep and athletic performance",
      });
    }
    factors.push({
      name: "Sleep Duration",
      value: sleepScore,
      maxValue: 100,
      detail: `${input.sleepHours.toFixed(1)}h${input.sleepPerformance ? ` (${input.sleepPerformance}% performance)` : ""}`,
    });
  }

  // WHOOP recovery
  let recoveryScore = 50;
  if (input.whoopRecoveryScore != null) {
    if (input.whoopRecoveryScore >= 67) recoveryScore = 95;
    else if (input.whoopRecoveryScore >= 34) recoveryScore = 65;
    else recoveryScore = 25;

    factors.push({
      name: "WHOOP Recovery",
      value: recoveryScore,
      maxValue: 100,
      detail: `${input.whoopRecoveryScore}% — ${input.whoopRecoveryScore >= 67 ? "Green (ready)" : input.whoopRecoveryScore >= 34 ? "Yellow (moderate)" : "Red (strained)"}`,
    });

    if (input.whoopRecoveryScore < 34) {
      verdicts.push({
        category: "recovery",
        status: "critical",
        title: "WHOOP recovery in red zone",
        explanation: `Recovery at ${input.whoopRecoveryScore}% indicates significant physiological stress. Your HRV and resting HR suggest your autonomic nervous system hasn't fully recovered. Prioritize sleep, hydration, and lower intensity today.`,
        evidence: "Plews et al., 2013 — HRV-guided training in endurance sports",
      });
    }
  }

  const overallRecovery = factors.length > 0
    ? Math.round(factors.reduce((sum, f) => sum + f.value, 0) / factors.length)
    : 50;

  return {
    score: { score: overallRecovery, label: "Recovery", factors },
    verdicts,
  };
}

// ── Trend Scoring (20% of total) ─────────────────────────────────────

function scoreTrends(input: DailyInput): { score: ScoreExplanation; verdicts: Verdict[]; phaseAlignment: { aligned: boolean; explanation: string } } {
  const verdicts: Verdict[] = [];
  const factors: ScoreExplanation["factors"] = [];

  // Weight trend vs phase
  let weightTrendScore = 60;
  let phaseAligned = true;
  let phaseExplanation = "";

  if (input.weightChange14d != null) {
    const weeklyChange = input.weightChange14d / 2; // 14 days -> weekly
    const weeklyPct = input.bodyWeightKg > 0 ? (weeklyChange / input.bodyWeightKg) * 100 : 0;

    if (input.phase === "cut") {
      if (weeklyPct >= -1.0 && weeklyPct <= -0.3) {
        weightTrendScore = 95;
        phaseExplanation = `Losing ${Math.abs(weeklyPct).toFixed(1)}%/week — ideal rate for preserving muscle while cutting (Helms et al., 2014 recommends 0.5-1.0% BW/week).`;
      } else if (weeklyPct > 0) {
        weightTrendScore = 20;
        phaseAligned = false;
        phaseExplanation = `Gaining weight during a cut phase. Your calorie intake likely exceeds your deficit target.`;
        verdicts.push({
          category: "trend", status: "critical", title: "Gaining weight during cut",
          explanation: phaseExplanation,
          evidence: "Helms et al., 2014 — Evidence-based recommendations for contest preparation",
        });
      } else if (weeklyPct < -1.0) {
        weightTrendScore = 55;
        phaseExplanation = `Losing ${Math.abs(weeklyPct).toFixed(1)}%/week — faster than recommended. Risk of muscle loss increases above 1%/week.`;
        verdicts.push({
          category: "trend", status: "warning", title: "Weight loss too rapid",
          explanation: phaseExplanation,
        });
      } else {
        weightTrendScore = 70;
        phaseExplanation = `Losing ${Math.abs(weeklyPct).toFixed(1)}%/week — slightly slow but still progressing.`;
      }
    } else if (input.phase === "bulk") {
      if (weeklyPct >= 0.15 && weeklyPct <= 0.5) {
        weightTrendScore = 95;
        phaseExplanation = `Gaining ${weeklyPct.toFixed(2)}%/week — ideal lean bulk rate.`;
      } else if (weeklyPct < 0) {
        weightTrendScore = 25;
        phaseAligned = false;
        phaseExplanation = `Losing weight during a bulk. Increase caloric intake.`;
      } else if (weeklyPct > 0.5) {
        weightTrendScore = 60;
        phaseExplanation = `Gaining ${weeklyPct.toFixed(2)}%/week — may be gaining excess fat. Slow the surplus.`;
      } else {
        weightTrendScore = 75;
        phaseExplanation = `Slow weight gain. Consider increasing calories slightly.`;
      }
    } else {
      if (Math.abs(weeklyPct) < 0.2) {
        weightTrendScore = 95;
        phaseExplanation = "Weight stable — excellent maintenance.";
      } else {
        weightTrendScore = 65;
        phaseExplanation = `Weight drifting ${weeklyPct > 0 ? "up" : "down"}. Monitor and adjust intake.`;
      }
    }

    factors.push({
      name: "Weight Trend",
      value: weightTrendScore,
      maxValue: 100,
      detail: `${input.weightChange14d > 0 ? "+" : ""}${input.weightChange14d.toFixed(1)}kg over 14 days (${weeklyPct > 0 ? "+" : ""}${weeklyPct.toFixed(2)}%/week)`,
    });
  } else {
    phaseExplanation = "Not enough weight data to assess phase alignment. Log daily weight for trend analysis.";
  }

  // Metabolic adaptation check
  if (input.phase === "cut" && (input.daysInPhase ?? 0) > 84) {
    verdicts.push({
      category: "trend", status: "warning", title: "Potential metabolic adaptation",
      explanation: `You've been in a cut for ${input.daysInPhase} days (>12 weeks). Consider a 1-2 week diet break at maintenance to upregulate metabolism.`,
      evidence: "Trexler et al., 2014 — Metabolic adaptation to weight loss",
    });
  }

  // Calorie consistency
  let calConsistency = 70;
  if (input.avgCalories14d != null && input.targetCalories != null && input.targetCalories > 0) {
    const avgDeviation = Math.abs(input.avgCalories14d - input.targetCalories) / input.targetCalories;
    calConsistency = avgDeviation < 0.05 ? 100 : avgDeviation < 0.10 ? 80 : avgDeviation < 0.20 ? 55 : 30;
    factors.push({
      name: "Calorie Consistency (14d)",
      value: calConsistency,
      maxValue: 100,
      detail: `Avg: ${Math.round(input.avgCalories14d)} kcal vs target ${input.targetCalories}`,
    });
  }

  // Training consistency
  let trainingConsistency = 60;
  if (input.trainingDays14d != null) {
    const weeklyAvg = input.trainingDays14d / 2;
    if (weeklyAvg >= 3 && weeklyAvg <= 6) {
      trainingConsistency = 90;
    } else if (weeklyAvg >= 2) {
      trainingConsistency = 70;
    } else {
      trainingConsistency = 40;
    }
    factors.push({
      name: "Training Frequency (14d)",
      value: trainingConsistency,
      maxValue: 100,
      detail: `${input.trainingDays14d} sessions in 14 days (${weeklyAvg.toFixed(1)}/week)`,
    });
  }

  // Sleep trend
  if (input.avgSleepHours14d != null) {
    const sleepTrendScore = input.avgSleepHours14d >= 7 ? 90 : input.avgSleepHours14d >= 6 ? 60 : 30;
    factors.push({
      name: "Sleep Trend (14d)",
      value: sleepTrendScore,
      maxValue: 100,
      detail: `Avg: ${input.avgSleepHours14d.toFixed(1)}h/night`,
    });
    if (input.avgSleepHours14d < 6.5) {
      verdicts.push({
        category: "trend", status: "warning", title: "Chronic sleep deprivation",
        explanation: `Averaging ${input.avgSleepHours14d.toFixed(1)}h over 14 days. This impairs muscle recovery, increases cortisol, and blunts training adaptations.`,
        evidence: "Dattilo et al., 2011 — Sleep and muscle recovery",
      });
    }
  }

  const overallTrend = factors.length > 0
    ? Math.round(factors.reduce((sum, f) => sum + f.value, 0) / factors.length)
    : 50;

  return {
    score: { score: overallTrend, label: "Trends", factors },
    verdicts,
    phaseAlignment: { aligned: phaseAligned, explanation: phaseExplanation },
  };
}

// ── Nutrition Recommendations ────────────────────────────────────────

function generateNutritionRecommendations(input: DailyInput): string[] {
  const recs: string[] = [];
  const proteinPerKg = input.proteinG != null ? input.proteinG / input.bodyWeightKg : 0;

  if (proteinPerKg > 0 && proteinPerKg < 1.6) {
    const target = Math.round(input.bodyWeightKg * (input.phase === "cut" ? 2.2 : 1.8));
    recs.push(`Increase protein to ${target}g/day (${(target / input.bodyWeightKg).toFixed(1)}g/kg). Try adding a protein shake or Greek yogurt.`);
  }

  if (input.fatG != null && input.fatG / input.bodyWeightKg < 0.5) {
    recs.push(`Add healthy fats: your ${input.fatG}g is below the 0.5g/kg minimum for hormonal health. Include nuts, avocado, or olive oil.`);
  }

  if (input.calories != null && input.targetCalories != null) {
    const diff = input.calories - input.targetCalories;
    if (diff > 200 && input.phase === "cut") {
      recs.push(`You're ${diff} kcal over your cut target. Reduce portion sizes or cut liquid calories.`);
    } else if (diff < -200 && input.phase === "bulk") {
      recs.push(`You're ${Math.abs(diff)} kcal under your bulk target. Add a calorie-dense snack (nuts, peanut butter, trail mix).`);
    }
  }

  if (input.avgProtein14d != null && input.bodyWeightKg > 0) {
    const avgProt = input.avgProtein14d / input.bodyWeightKg;
    if (avgProt < 1.6) {
      recs.push(`Your 14-day average protein (${input.avgProtein14d.toFixed(0)}g, ${avgProt.toFixed(1)}g/kg) is below optimal. Consistency matters for MPS.`);
    }
  }

  if ((input.avgSleepHours14d ?? 8) < 7 && input.phase === "cut") {
    recs.push("Poor sleep during a cut accelerates muscle loss. Prioritize 7-8h for cortisol management.");
  }

  if (input.phase === "cut" && (input.daysInPhase ?? 0) > 84) {
    recs.push("Consider a 7-14 day diet break at maintenance calories to counteract metabolic adaptation.");
  }

  return recs;
}

// ── Daily Recommendations ────────────────────────────────────────────

function generateDailyRecommendations(input: DailyInput, analysis: { nutritionScore: number; trainingScore: number; recoveryScore: number; trendScore: number }): string[] {
  const recs: string[] = [];

  // Recovery-based recommendation
  if (input.whoopRecoveryScore != null && input.whoopRecoveryScore < 34) {
    recs.push("Recovery is red — opt for light movement, stretching, or a complete rest day.");
  } else if (input.whoopRecoveryScore != null && input.whoopRecoveryScore < 67) {
    recs.push("Recovery is yellow — moderate intensity is okay, but avoid PR attempts.");
  }

  // Training recommendation
  if (input.todaySets === 0 && !input.isCardioOrMisc) {
    if ((input.consecutiveTrainingDays ?? 0) < 2) {
      recs.push("Consider training today — you've had adequate rest.");
    }
  }

  if ((input.consecutiveTrainingDays ?? 0) >= 5) {
    recs.push("Schedule a rest day soon. Recovery drives adaptation, not just training.");
  }

  // Sleep recommendation
  if (input.sleepHours != null && input.sleepHours < 7) {
    recs.push("Tonight, aim for 7-9h. Avoid screens 1h before bed and keep your room cool (65-68F).");
  }

  // Phase-specific
  if (input.phase === "cut" && analysis.nutritionScore < 60) {
    recs.push("Your nutrition score is low. Track every meal today to stay within your calorie target.");
  }

  if (input.phase === "bulk" && analysis.trainingScore < 50) {
    recs.push("Maximize your surplus with a quality training session today.");
  }

  // Nutrition recs
  recs.push(...generateNutritionRecommendations(input));

  return [...new Set(recs)].slice(0, 6); // Dedupe and cap at 6
}

// ── Main Analysis Function ───────────────────────────────────────────

export function analyzeDailyPerformance(input: DailyInput): DailyAnalysis {
  const nutritionResult = scoreNutrition(input);
  const trainingResult = scoreTraining(input);
  const recoveryResult = scoreRecovery(input);
  const trendResult = scoreTrends(input);

  const overallScore = Math.round(
    nutritionResult.score.score * 0.40 +
    trainingResult.score.score * 0.25 +
    recoveryResult.score.score * 0.15 +
    trendResult.score.score * 0.20
  );

  const verdicts = [
    ...nutritionResult.verdicts,
    ...trainingResult.verdicts,
    ...recoveryResult.verdicts,
    ...trendResult.verdicts,
  ];

  const recommendations = generateDailyRecommendations(input, {
    nutritionScore: nutritionResult.score.score,
    trainingScore: trainingResult.score.score,
    recoveryScore: recoveryResult.score.score,
    trendScore: trendResult.score.score,
  });

  return {
    overallScore,
    nutritionScore: nutritionResult.score,
    trainingScore: trainingResult.score,
    recoveryScore: recoveryResult.score,
    trendScore: trendResult.score,
    mpsScore: nutritionResult.mps,
    phaseAlignment: trendResult.phaseAlignment,
    verdicts,
    recommendations,
  };
}
