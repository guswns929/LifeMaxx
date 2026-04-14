/**
 * Nutrition calculations based on peer-reviewed research.
 *
 * TDEE: Mifflin-St Jeor equation (most accurate for general population)
 *   Source: Mifflin et al., 1990, Am J Clin Nutr
 *
 * Activity multipliers: Based on Harris-Benedict activity factors
 *
 * Protein recommendations:
 *   - Cut: 2.0-2.4 g/kg (Helms et al., 2014, JISSN)
 *   - Maintain: 1.6-2.0 g/kg (Morton et al., 2018, Br J Sports Med)
 *   - Bulk: 1.6-2.2 g/kg (Iraki et al., 2019, JISSN)
 *
 * Fat minimum: 0.5 g/kg minimum for hormonal health (Volek et al., 2006)
 *   Recommended: 25-35% of calories (AMDR)
 *
 * Deficit/surplus targets:
 *   - Cut: 300-500 kcal deficit (~0.5-1 lb/week, Garthe et al., 2011)
 *   - Bulk: 200-350 kcal surplus (~0.25-0.5 lb/week, Ribeiro et al., 2022)
 */

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,      // desk job, no exercise
  light: 1.375,        // 1-3 days/week
  moderate: 1.55,      // 3-5 days/week
  active: 1.725,       // 6-7 days/week
  very_active: 1.9,    // 2x/day or very physical job
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job)",
  light: "Lightly Active (1-3x/week)",
  moderate: "Moderately Active (3-5x/week)",
  active: "Active (6-7x/week)",
  very_active: "Very Active (2x/day)",
};

export interface NutritionTargets {
  bmr: number;
  tdee: number;            // maintenance calories
  targetCalories: number;  // after deficit/surplus
  deficit: number;         // negative = deficit, positive = surplus
  proteinG: number;
  fatG: number;
  carbsG: number;
  proteinPct: number;
  fatPct: number;
  carbsPct: number;
}

/**
 * Calculate BMR using Mifflin-St Jeor equation.
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: "male" | "female"
): number {
  if (sex === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
}

/**
 * Calculate full nutrition targets.
 */
export function calculateNutritionTargets(params: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: "male" | "female";
  activityLevel: ActivityLevel;
  phase: "cut" | "maintain" | "bulk";
}): NutritionTargets {
  const { weightKg, heightCm, ageYears, sex, activityLevel, phase } = params;

  const bmr = calculateBMR(weightKg, heightCm, ageYears, sex);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);

  // Calorie target based on phase
  let deficit = 0;
  if (phase === "cut") {
    deficit = -400; // moderate deficit
  } else if (phase === "bulk") {
    deficit = 275;  // lean bulk surplus
  }
  const targetCalories = tdee + deficit;

  // Protein: higher during cut to preserve muscle
  let proteinPerKg: number;
  if (phase === "cut") proteinPerKg = 2.2;
  else if (phase === "bulk") proteinPerKg = 1.8;
  else proteinPerKg = 2.0;

  const proteinG = Math.round(weightKg * proteinPerKg);
  const proteinCals = proteinG * 4;

  // Fat: 25-30% of calories, minimum 0.5 g/kg
  const fatPct = phase === "cut" ? 0.25 : 0.30;
  const fatCals = Math.round(targetCalories * fatPct);
  const fatG = Math.max(Math.round(weightKg * 0.5), Math.round(fatCals / 9));
  const actualFatCals = fatG * 9;

  // Carbs: remainder
  const carbCals = Math.max(0, targetCalories - proteinCals - actualFatCals);
  const carbsG = Math.round(carbCals / 4);

  // Actual percentages
  const total = proteinCals + actualFatCals + carbCals;

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories: Math.round(targetCalories),
    deficit,
    proteinG,
    fatG,
    carbsG,
    proteinPct: total > 0 ? Math.round((proteinCals / total) * 100) : 0,
    fatPct: total > 0 ? Math.round((actualFatCals / total) * 100) : 0,
    carbsPct: total > 0 ? Math.round((carbCals / total) * 100) : 0,
  };
}
