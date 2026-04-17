import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeDailyPerformance, type DailyInput } from "@/lib/daily-analysis";
import { calculateNutritionTargets, type ActivityLevel } from "@/lib/nutrition";
import { parseLocalDate } from "@/lib/date-utils";

/**
 * GET — Fetch journal entries.
 *   ?date=YYYY-MM-DD  → single entry with full analysis JSON
 *   (no date)         → last 30 summary entries
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const dateParam = request.nextUrl.searchParams.get("date");

    if (dateParam) {
      // Return specific journal entry with full analysis
      const entryDate = parseLocalDate(dateParam);
      const entryDateEnd = new Date(entryDate);
      entryDateEnd.setHours(23, 59, 59, 999);

      const entry = await prisma.journalEntry.findFirst({
        where: { userId, date: { gte: entryDate, lte: entryDateEnd } },
      });

      if (!entry) {
        return NextResponse.json({ error: "No entry for this date" }, { status: 404 });
      }

      return NextResponse.json({
        date: entry.date.toISOString(),
        overallScore: entry.overallScore,
        nutritionScore: entry.nutritionScore,
        trainingScore: entry.trainingScore,
        recoveryScore: entry.recoveryScore,
        trendScore: entry.trendScore,
        analysis: JSON.parse(entry.analysisJson),
        recommendations: entry.recommendations ? JSON.parse(entry.recommendations) : [],
      });
    }

    // Return all journal entries (summary)
    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 30,
    });
    return NextResponse.json(
      entries.map((e) => ({
        date: e.date.toISOString(),
        overallScore: e.overallScore,
        nutritionScore: e.nutritionScore,
        trainingScore: e.trainingScore,
        recoveryScore: e.recoveryScore,
        trendScore: e.trendScore,
      }))
    );
  } catch (error) {
    console.error("GET /api/daily-log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST — Compile / generate the journal entry for a given date.
 *   body: { date?: "YYYY-MM-DD" }  (defaults to today)
 *
 * This runs the full analysis, saves the journal entry, and returns
 * the complete analysis object.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json().catch(() => ({}));
    const dateStr: string | undefined = body.date;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const ageYears = user.dateOfBirth
      ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 25;
    const bodyWeightKg = user.bodyWeightKg ?? 80;
    const sex = (user.sex as "male" | "female") ?? "male";

    // Target day boundaries in local time
    const targetStart = dateStr ? parseLocalDate(dateStr) : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
    const targetEnd = new Date(targetStart);
    targetEnd.setHours(23, 59, 59, 999);

    // 14-day lookback from target date
    const fourteenDaysAgo = new Date(targetStart);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch data in parallel
    const [
      dayWorkouts,
      recentWorkouts,
      dayMeasurement,
      recentMeasurements,
      whoopRecovery,
      whoopSleep,
      whoopStrain,
    ] = await Promise.all([
      prisma.workout.findMany({
        where: { userId, date: { gte: targetStart, lte: targetEnd } },
        include: { exercises: { include: { exercise: true, sets: true } } },
      }),
      prisma.workout.findMany({
        where: { userId, date: { gte: fourteenDaysAgo, lte: targetEnd } },
        include: { exercises: { include: { exercise: true, sets: true } } },
      }),
      prisma.bodyMeasurement.findFirst({
        where: { userId, date: { gte: targetStart, lte: targetEnd } },
        orderBy: { date: "desc" },
      }),
      prisma.bodyMeasurement.findMany({
        where: { userId, date: { gte: fourteenDaysAgo, lte: targetEnd } },
        orderBy: { date: "asc" },
      }),
      prisma.whoopDatum.findFirst({
        where: { userId, dataType: "recovery", date: { gte: targetStart, lte: targetEnd } },
        orderBy: { date: "desc" },
      }),
      prisma.whoopDatum.findFirst({
        where: { userId, dataType: "sleep", date: { gte: targetStart, lte: targetEnd } },
        orderBy: { date: "desc" },
      }),
      prisma.whoopDatum.findFirst({
        where: { userId, dataType: "strain", date: { gte: targetStart, lte: targetEnd } },
        orderBy: { date: "desc" },
      }),
    ]);

    // Parse muscles helper
    function parseMuscles(raw: string | null | undefined): string[] {
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : raw.split(",").map((m) => m.trim());
      } catch {
        return raw.split(",").map((m) => m.trim());
      }
    }

    // Target day's training data
    let daySets = 0;
    const dayMusclesHit = new Set<string>();
    const dayExercises: string[] = [];
    let dayStrainScore: number | null = null;
    let isCardioOrMisc = false;
    let whoopActivityStrain: number | null = null;
    const whoopActivityTypes: string[] = [];
    let cardioMinutes = 0;

    dayWorkouts.forEach((w) => {
      if (w.workoutType === "cardio" || w.workoutType === "misc") {
        isCardioOrMisc = true;
        if (w.durationMin) cardioMinutes += w.durationMin;
      }
      if (w.strainScore) {
        whoopActivityStrain = (whoopActivityStrain ?? 0) + w.strainScore;
      }
      if (w.activityType) {
        whoopActivityTypes.push(w.activityType);
      }
      w.exercises.forEach((we) => {
        dayExercises.push(we.exercise.name);
        const working = we.sets.filter((s) => !s.isWarmup);
        daySets += working.length;
        parseMuscles(we.exercise.primaryMuscles).forEach((m) => dayMusclesHit.add(m));
      });
    });

    if (whoopStrain?.strainScore) {
      dayStrainScore = whoopStrain.strainScore;
    }

    // 14-day trends
    const toLocalDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const trainingDays14d = new Set(recentWorkouts.map((w) => toLocalDate(new Date(w.date)))).size;

    // Consecutive training days — strength-only. Cardio/misc sessions don't
    // trigger the same systemic-recovery demand as resistance training, so we
    // exclude them from rest-day recommendations.
    let consecutiveTrainingDays = 0;
    const strengthWorkouts = recentWorkouts.filter(
      (w) => w.workoutType !== "cardio" && w.workoutType !== "misc"
    );
    const strengthDateSet = new Set(strengthWorkouts.map((w) => toLocalDate(new Date(w.date))));
    for (let i = 0; i <= 14; i++) {
      const d = new Date(targetStart);
      d.setDate(d.getDate() - i);
      if (strengthDateSet.has(toLocalDate(d))) {
        consecutiveTrainingDays++;
      } else break;
    }

    // Weight change
    let weightChange14d: number | undefined;
    if (recentMeasurements.length >= 2) {
      const first = recentMeasurements[0].weightKg;
      const last = recentMeasurements[recentMeasurements.length - 1].weightKg;
      weightChange14d = last - first;
    }

    // Average calories and protein
    const calValues = recentMeasurements.filter((m) => m.calories != null).map((m) => m.calories!);
    const avgCalories14d = calValues.length > 0 ? calValues.reduce((a, b) => a + b, 0) / calValues.length : undefined;
    const protValues = recentMeasurements.filter((m) => m.proteinG != null).map((m) => m.proteinG!);
    const avgProtein14d = protValues.length > 0 ? protValues.reduce((a, b) => a + b, 0) / protValues.length : undefined;

    // Sleep data
    const sleepHours = whoopSleep?.sleepDurationMs ? whoopSleep.sleepDurationMs / 3_600_000 : null;
    const recentSleepData = await prisma.whoopDatum.findMany({
      where: { userId, dataType: "sleep", date: { gte: fourteenDaysAgo, lte: targetEnd } },
    });
    const sleepHoursArr = recentSleepData
      .map((s) => (s.sleepDurationMs ? s.sleepDurationMs / 3_600_000 : null))
      .filter((v): v is number => v != null);
    const avgSleepHours14d = sleepHoursArr.length > 0
      ? sleepHoursArr.reduce((a, b) => a + b, 0) / sleepHoursArr.length
      : undefined;

    // Phase and nutrition targets
    const phase = dayMeasurement?.phase as "cut" | "maintain" | "bulk" || "maintain";
    const daysInPhase = recentMeasurements.filter((m) => m.phase === phase).length;

    const nutritionTargets = calculateNutritionTargets({
      weightKg: bodyWeightKg,
      heightCm: user.heightCm ?? 175,
      ageYears,
      sex,
      activityLevel: "moderate" as ActivityLevel,
      phase,
      whoopStrain: dayStrainScore,
    });

    // Build analysis input
    const dailyInput: DailyInput = {
      calories: dayMeasurement?.calories ?? undefined,
      targetCalories: nutritionTargets.targetCalories,
      proteinG: dayMeasurement?.proteinG ?? undefined,
      targetProteinG: nutritionTargets.proteinG,
      carbsG: dayMeasurement?.carbsG ?? undefined,
      fatG: dayMeasurement?.fatG ?? undefined,
      bodyWeightKg,
      phase,
      todaySets: daySets,
      todayMusclesHit: Array.from(dayMusclesHit),
      todayExercises: dayExercises,
      todayStrainScore: dayStrainScore,
      isCardioOrMisc,
      whoopActivityStrain,
      whoopActivityTypes,
      cardioMinutes: cardioMinutes > 0 ? cardioMinutes : undefined,
      whoopRecoveryScore: whoopRecovery?.recoveryScore ?? null,
      sleepHours,
      sleepPerformance: whoopSleep?.sleepPerformance ?? null,
      avgCalories14d,
      avgProtein14d,
      avgSleepHours14d,
      trainingDays14d,
      consecutiveTrainingDays,
      weightChange14d,
      daysInPhase,
    };

    const analysis = analyzeDailyPerformance(dailyInput);

    // Save/update journal entry
    const journalDate = new Date(targetStart);
    await prisma.journalEntry.upsert({
      where: { userId_date: { userId, date: journalDate } },
      create: {
        userId,
        date: journalDate,
        overallScore: analysis.overallScore,
        nutritionScore: analysis.nutritionScore.score,
        trainingScore: analysis.trainingScore.score,
        recoveryScore: analysis.recoveryScore.score,
        trendScore: analysis.trendScore.score,
        analysisJson: JSON.stringify(analysis),
        recommendations: JSON.stringify(analysis.recommendations),
      },
      update: {
        overallScore: analysis.overallScore,
        nutritionScore: analysis.nutritionScore.score,
        trainingScore: analysis.trainingScore.score,
        recoveryScore: analysis.recoveryScore.score,
        trendScore: analysis.trendScore.score,
        analysisJson: JSON.stringify(analysis),
        recommendations: JSON.stringify(analysis.recommendations),
      },
    });

    return NextResponse.json({
      analysis,
      nutritionTargets,
      dayData: {
        workouts: dayWorkouts.length,
        sets: daySets,
        muscles: Array.from(dayMusclesHit),
        hasNutrition: dayMeasurement != null,
        phase,
      },
      savedJournal: true,
    });
  } catch (error) {
    console.error("POST /api/daily-log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
