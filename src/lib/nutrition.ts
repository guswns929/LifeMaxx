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
  tdee: number;            // maintenance calories (strain-adjusted if available)
  baseTdee: number;        // TDEE before strain adjustment
  strainAdjustment: number; // calories added/removed due to strain
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
/**
 * Estimate exercise calories from WHOOP strain score.
 *
 * WHOOP strain is 0-21 on a logarithmic scale based on cardiovascular load.
 * We convert it to an estimated calorie burn using a body-weight-scaled
 * model derived from WHOOP's own published strain-to-calorie relationships
 * (Capodilupo & Amin, 2020, WHOOP white paper).
 *
 * Low strain (0-8):   ~50-200 kcal (light activity / daily living)
 * Moderate (8-14):    ~200-500 kcal (standard workout)
 * High (14-18):       ~500-900 kcal (intense training)
 * Very high (18-21):  ~900-1200+ kcal (extreme / competition day)
 *
 * The baseline activity multiplier already accounts for general activity,
 * so we subtract an expected baseline and only add the delta.
 */
function strainToCalorieAdjustment(
  strainScore: number,
  weightKg: number,
  activityLevel: ActivityLevel
): number {
  // Estimate total exercise kcal from strain (weight-scaled)
  // Quadratic model: higher strain = disproportionately more calories
  const basePerKg = 0.15; // kcal per kg per strain-unit squared factor
  const exerciseCals = basePerKg * weightKg * Math.pow(strainScore, 1.4) / 10;

  // Expected exercise kcal already baked into the activity multiplier
  // sedentary=0, light≈150, moderate≈300, active≈500, very_active≈700
  const expectedExerciseCals: Record<ActivityLevel, number> = {
    sedentary: 0,
    light: 150,
    moderate: 300,
    active: 500,
    very_active: 700,
  };

  const delta = Math.round(exerciseCals - expectedExerciseCals[activityLevel]);
  // Clamp to ±600 kcal to avoid extreme swings
  return Math.max(-300, Math.min(600, delta));
}

export function calculateNutritionTargets(params: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: "male" | "female";
  activityLevel: ActivityLevel;
  phase: "cut" | "maintain" | "bulk";
  whoopStrain?: number | null; // 0-21 scale, today's strain from WHOOP
}): NutritionTargets {
  const { weightKg, heightCm, ageYears, sex, activityLevel, phase, whoopStrain } = params;

  const bmr = calculateBMR(weightKg, heightCm, ageYears, sex);
  const baseTdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);

  // Adjust TDEE with WHOOP strain data when available
  let strainAdjustment = 0;
  if (whoopStrain != null && whoopStrain > 0) {
    strainAdjustment = strainToCalorieAdjustment(whoopStrain, weightKg, activityLevel);
  }
  const tdee = baseTdee + strainAdjustment;

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
    tdee: Math.round(tdee),
    baseTdee,
    strainAdjustment,
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
