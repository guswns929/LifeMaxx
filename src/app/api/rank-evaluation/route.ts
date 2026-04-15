import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRank, calculateE1RM } from "@/lib/scoring";
import { getExerciseRanking } from "@/lib/rankings";

// GET — fetch all evaluations + check if one is due
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const evaluations = await prisma.rankEvaluation.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    });

    // Check if evaluation is due (every 2 months)
    const lastEval = evaluations[0] ?? null;
    const now = new Date();
    let isDue = true;
    let daysUntilNext = 0;

    if (lastEval) {
      const nextDue = new Date(lastEval.date);
      nextDue.setMonth(nextDue.getMonth() + 2);
      isDue = now >= nextDue;
      daysUntilNext = isDue ? 0 : Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Get user's current best e1RMs from workout history for pre-fill
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const recentBests = await getRecentBests(session.user.id);

    return NextResponse.json({
      evaluations,
      isDue,
      daysUntilNext,
      recentBests,
      userProfile: {
        bodyWeightKg: user?.bodyWeightKg,
        sex: user?.sex,
        ageYears: user?.dateOfBirth
          ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/rank-evaluation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — submit a new evaluation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { benchPressKg, squatKg, deadliftKg, notes } = body;

    if (!benchPressKg && !squatKg && !deadliftKg) {
      return NextResponse.json({ error: "At least one lift is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.bodyWeightKg || !user?.sex) {
      return NextResponse.json({
        error: "Please set your body weight and sex in profile settings first",
      }, { status: 400 });
    }

    const ageYears = user.dateOfBirth
      ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined;

    const bench = benchPressKg ?? 0;
    const squat = squatKg ?? 0;
    const deadlift = deadliftKg ?? 0;

    const result = calculateRank(
      bench, squat, deadlift,
      user.bodyWeightKg,
      user.sex as "male" | "female",
      ageYears
    );

    // Get individual exercise percentiles
    const sex = user.sex as "male" | "female";
    const bw = user.bodyWeightKg;
    if (bench > 0) {
      const r = getExerciseRanking("Bench Press", bench, 1, sex, bw);
      if (r) result.benchPercentile = r.percentile;
    }
    if (squat > 0) {
      const r = getExerciseRanking("Squat", squat, 1, sex, bw);
      if (r) result.squatPercentile = r.percentile;
    }
    if (deadlift > 0) {
      const r = getExerciseRanking("Deadlift", deadlift, 1, sex, bw);
      if (r) result.deadliftPercentile = r.percentile;
    }

    const evaluation = await prisma.rankEvaluation.create({
      data: {
        userId: session.user.id,
        benchPressKg: bench > 0 ? bench : null,
        squatKg: squat > 0 ? squat : null,
        deadliftKg: deadlift > 0 ? deadlift : null,
        totalKg: result.totalKg,
        wilksScore: result.wilksScore,
        rank: result.rank,
        rankScore: result.rankScore,
        bodyWeightKg: user.bodyWeightKg,
        notes,
      },
    });

    return NextResponse.json({ evaluation, result });
  } catch (error) {
    console.error("POST /api/rank-evaluation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper: get recent best e1RMs for bench/squat/deadlift from workout history
async function getRecentBests(userId: string) {
  const exercises = ["Bench Press", "Squat", "Deadlift"];
  const bests: Record<string, number> = {};

  for (const name of exercises) {
    const exercise = await prisma.exercise.findUnique({ where: { name } });
    if (!exercise) continue;

    const sets = await prisma.exerciseSet.findMany({
      where: {
        workoutExercise: {
          exerciseId: exercise.id,
          workout: { userId },
        },
        isWarmup: false,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    let bestE1RM = 0;
    for (const s of sets) {
      const e1rm = calculateE1RM(s.weightKg, s.reps);
      if (e1rm > bestE1RM) bestE1RM = e1rm;
    }
    if (bestE1RM > 0) bests[name] = Math.round(bestE1RM * 10) / 10;
  }

  return bests;
}
