import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MUSCLE_GROUPS } from "@/lib/muscle-groups";
import { getStandardsForExercise } from "@/lib/rankings";
import {
  calculateDevelopmentScore,
  getCurrentProjectedE1RM,
  calcStrengthLevelScore,
  type WeeklyVolume,
  type UserProfile,
} from "@/lib/scoring";

const STANDARD_NAME_MAP: Record<string, string> = {
  "Barbell Bench Press": "Bench Press",
  "Incline Barbell Bench Press": "Bench Press",
  "Dumbbell Bench Press": "Bench Press",
  "Barbell Squat": "Squat",
  "Front Squat": "Squat",
  "Barbell Deadlift": "Deadlift",
  "Sumo Deadlift": "Deadlift",
  "Trap Bar Deadlift": "Deadlift",
  "Overhead Press": "Overhead Press",
  "Dumbbell Shoulder Press": "Overhead Press",
  "Barbell Row": "Barbell Row",
  "Pendlay Row": "Barbell Row",
  "Barbell Curl": "Barbell Curl",
  "EZ-Bar Curl": "Barbell Curl",
  "Pull-Ups": "Pull-Up",
  "Chin-Ups": "Pull-Up",
  "Weighted Pull-Ups": "Pull-Up",
};

function parseMuscles(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : raw.split(",").map((m) => m.trim());
  } catch {
    return raw.split(",").map((m) => m.trim());
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const [user, workouts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.workout.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 200,
        include: {
          exercises: {
            include: {
              exercise: true,
              sets: { orderBy: { setNumber: "asc" } },
            },
          },
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const ageYears = user.dateOfBirth
      ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 25;
    const firstWorkout = workouts.length > 0 ? workouts[workouts.length - 1] : null;
    const trainingMonths = firstWorkout
      ? Math.floor((now.getTime() - new Date(firstWorkout.date).getTime()) / (30.44 * 24 * 60 * 60 * 1000))
      : 0;

    const profile: UserProfile = {
      bodyWeightKg: user.bodyWeightKg ?? 80,
      sex: (user.sex as "male" | "female") ?? "male",
      ageYears,
      trainingMonths,
    };

    // Build per-muscle data
    const muscleScores = MUSCLE_GROUPS.map((mg) => {
      const slug = mg.slug;

      // Find all workouts targeting this muscle
      const muscleWorkouts = workouts.filter((w) =>
        w.exercises.some((we) => {
          const primary = parseMuscles(we.exercise.primaryMuscles);
          const secondary = parseMuscles(we.exercise.secondaryMuscles);
          return primary.includes(slug) || secondary.includes(slug);
        })
      );

      // Collect all sets for this muscle with dates
      const allSets: { date: Date; weightKg: number; reps: number; rpe?: number | null }[] = [];
      const exerciseNames = new Set<string>();

      muscleWorkouts.forEach((w) => {
        w.exercises.forEach((we) => {
          const primary = parseMuscles(we.exercise.primaryMuscles);
          const secondary = parseMuscles(we.exercise.secondaryMuscles);
          if (primary.includes(slug) || secondary.includes(slug)) {
            exerciseNames.add(we.exercise.name);
            we.sets.filter((s) => !s.isWarmup).forEach((s) => {
              allSets.push({
                date: new Date(w.date),
                weightKg: s.weightKg,
                reps: s.reps,
                rpe: s.rpe,
              });
            });
          }
        });
      });

      // Holistic E1RM
      const bestE1RM = getCurrentProjectedE1RM(allSets);

      // Get standards for the best-matching exercise
      let standards = null;
      for (const name of exerciseNames) {
        const standardName = STANDARD_NAME_MAP[name] ?? name;
        const s = getStandardsForExercise(standardName, profile.sex, profile.bodyWeightKg);
        if (s) { standards = s; break; }
      }

      // Weekly volumes (last 8 weeks)
      const eightWeeksAgo = new Date(now);
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
      const weeklyVolumes: WeeklyVolume[] = [];
      for (let week = 0; week < 8; week++) {
        const weekStart = new Date(eightWeeksAgo);
        weekStart.setDate(weekStart.getDate() + week * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        let volume = 0;
        allSets
          .filter((s) => s.date >= weekStart && s.date < weekEnd)
          .forEach((s) => { volume += s.weightKg * s.reps; });

        weeklyVolumes.push({ weekStart, volume });
      }

      // Average weekly frequency (last 4 weeks)
      const fourWeeksAgo = new Date(now);
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const recentMuscleWorkouts = muscleWorkouts.filter((w) => new Date(w.date) >= fourWeeksAgo);
      const avgWeeklyFrequency = recentMuscleWorkouts.length / 4;

      // Days since last trained
      const daysSinceLastTrained = muscleWorkouts.length > 0
        ? Math.floor((now.getTime() - new Date(muscleWorkouts[0].date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Recent E1RMs for progressive overload calculation
      const recentE1RMs = allSets
        .filter((s) => s.weightKg > 0 && s.reps > 0)
        .map((s) => ({
          date: s.date,
          e1rm: s.weightKg * (1 + s.reps / 30),
        }));

      const devScore = calculateDevelopmentScore({
        weeklyVolumes,
        bestE1RM: bestE1RM,
        recentE1RMs,
        standards,
        avgWeeklyFrequency,
        daysSinceLastTrained,
        profile,
      });

      return {
        slug,
        displayName: mg.displayName,
        development: devScore,
        workoutCount: muscleWorkouts.length,
        daysSinceLastTrained: daysSinceLastTrained === 999 ? null : daysSinceLastTrained,
        bestE1RM,
        strengthLevel: standards ? calcStrengthLevelScore(bestE1RM, standards, profile) : null,
      };
    });

    return NextResponse.json({ muscleScores, profile });
  } catch (error) {
    console.error("GET /api/muscle-scores error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
