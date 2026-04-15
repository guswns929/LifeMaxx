import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeDailyPerformance, type DailyInput } from "@/lib/daily-analysis";
import { calculateNutritionTargets, type ActivityLevel } from "@/lib/nutrition";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const ageYears = user.dateOfBirth
      ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 25;
    const bodyWeightKg = user.bodyWeightKg ?? 80;
    const sex = (user.sex as "male" | "female") ?? "male";

    // Today's boundaries in local time
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 14-day lookback
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch data in parallel
    const [
      todayWorkouts,
      recentWorkouts,
      todayMeasurement,
      recentMeasurements,
      whoopRecovery,
      whoopSleep,
      whoopStrain,
      existingJournal,
    ] = await Promise.all([
      prisma.workout.findMany({
        where: { userId, date: { gte: todayStart, lte: todayEnd } },
        include: { exercises: { include: { exercise: true, sets: true } } },
      }),
      prisma.workout.findMany({
        where: { userId, date: { gte: fourteenDaysAgo } },
        include: { exercises: { include: { exercise: true, sets: true } } },
      }),
      prisma.bodyMeasurement.findFirst({
        where: { userId, date: { gte: todayStart, lte: todayEnd } },
        orderBy: { date: "desc" },
      }),
      prisma.bodyMeasurement.findMany({
        where: { userId, date: { gte: fourteenDaysAgo } },
        orderBy: { date: "asc" },
      }),
      prisma.whoopDatum.findFirst({
        where: { userId, dataType: "recovery", date: { gte: todayStart, lte: todayEnd } },
        orderBy: { date: "desc" },
      }),
      prisma.whoopDatum.findFirst({
        where: { userId, dataType: "sleep", date: { gte: todayStart, lte: todayEnd } },
        orderBy: { date: "desc" },
      }),
      prisma.whoopDatum.findFirst({
        where: { userId, dataType: "strain", date: { gte: todayStart, lte: todayEnd } },
        orderBy: { date: "desc" },
      }),
      prisma.journalEntry.findFirst({
        where: { userId, date: { gte: todayStart, lte: todayEnd } },
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

    // Today's training data
    let todaySets = 0;
    const todayMusclesHit = new Set<string>();
    const todayExercises: string[] = [];
    let todayStrainScore: number | null = null;
    let isCardioOrMisc = false;
    let whoopActivityStrain: number | null = null;

    todayWorkouts.forEach((w) => {
      if (w.workoutType === "cardio" || w.workoutType === "misc") {
        isCardioOrMisc = true;
      }
      if (w.strainScore) {
        whoopActivityStrain = (whoopActivityStrain ?? 0) + w.strainScore;
      }
      w.exercises.forEach((we) => {
        todayExercises.push(we.exercise.name);
        const working = we.sets.filter((s) => !s.isWarmup);
        todaySets += working.length;
        parseMuscles(we.exercise.primaryMuscles).forEach((m) => todayMusclesHit.add(m));
      });
    });

    if (whoopStrain?.strainScore) {
      todayStrainScore = whoopStrain.strainScore;
    }

    // 14-day trends
    const toLocalDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const trainingDays14d = new Set(recentWorkouts.map((w) => toLocalDate(new Date(w.date)))).size;

    // Consecutive training days
    let consecutiveTrainingDays = 0;
    const trainingDateSet = new Set(recentWorkouts.map((w) => toLocalDate(new Date(w.date))));
    for (let i = 0; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (trainingDateSet.has(toLocalDate(d))) {
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
      where: { userId, dataType: "sleep", date: { gte: fourteenDaysAgo } },
    });
    const sleepHoursArr = recentSleepData
      .map((s) => (s.sleepDurationMs ? s.sleepDurationMs / 3_600_000 : null))
      .filter((v): v is number => v != null);
    const avgSleepHours14d = sleepHoursArr.length > 0
      ? sleepHoursArr.reduce((a, b) => a + b, 0) / sleepHoursArr.length
      : undefined;

    // Phase and nutrition targets
    const phase = todayMeasurement?.phase as "cut" | "maintain" | "bulk" || "maintain";
    const daysInPhase = recentMeasurements.filter((m) => m.phase === phase).length;

    const nutritionTargets = calculateNutritionTargets({
      weightKg: bodyWeightKg,
      heightCm: user.heightCm ?? 175,
      ageYears,
      sex,
      activityLevel: "moderate" as ActivityLevel,
      phase,
      whoopStrain: todayStrainScore,
    });

    // Build analysis input
    const dailyInput: DailyInput = {
      calories: todayMeasurement?.calories ?? undefined,
      targetCalories: nutritionTargets.targetCalories,
      proteinG: todayMeasurement?.proteinG ?? undefined,
      targetProteinG: nutritionTargets.proteinG,
      carbsG: todayMeasurement?.carbsG ?? undefined,
      fatG: todayMeasurement?.fatG ?? undefined,
      bodyWeightKg,
      phase,
      todaySets,
      todayMusclesHit: Array.from(todayMusclesHit),
      todayExercises,
      todayStrainScore,
      isCardioOrMisc,
      whoopActivityStrain,
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
    const journalDate = new Date(todayStart);
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
      todayData: {
        workouts: todayWorkouts.length,
        sets: todaySets,
        muscles: Array.from(todayMusclesHit),
        hasNutrition: todayMeasurement != null,
        phase,
      },
      savedJournal: true,
    });
  } catch (error) {
    console.error("GET /api/daily-log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET past journal entries
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const { date } = await request.json();
    if (!date) {
      // Return all journal entries
      const entries = await prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 30,
      });
      return NextResponse.json(entries.map((e) => ({
        date: e.date.toISOString(),
        overallScore: e.overallScore,
        nutritionScore: e.nutritionScore,
        trainingScore: e.trainingScore,
        recoveryScore: e.recoveryScore,
        trendScore: e.trendScore,
      })));
    }

    // Return specific journal entry with full analysis
    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);
    const entry = await prisma.journalEntry.findUnique({
      where: { userId_date: { userId, date: entryDate } },
    });

    if (!entry) {
      return NextResponse.json({ error: "No entry for this date" }, { status: 404 });
    }

    return NextResponse.json({
      date: entry.date.toISOString(),
      overallScore: entry.overallScore,
      analysis: JSON.parse(entry.analysisJson),
      recommendations: entry.recommendations ? JSON.parse(entry.recommendations) : [],
    });
  } catch (error) {
    console.error("POST /api/daily-log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
