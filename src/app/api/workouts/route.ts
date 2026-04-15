import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseLocalDate } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const limit = Number(request.nextUrl.searchParams.get("limit")) || 20;

    const workouts = await prisma.workout.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: limit,
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: "asc" } },
          },
        },
      },
    });

    return NextResponse.json(workouts);
  } catch (error) {
    console.error("GET /api/workouts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json();
    const { date, notes, durationMin, exercises, workoutType } = body;

    const workout = await prisma.workout.create({
      data: {
        userId,
        date: (() => {
          if (date && typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return parseLocalDate(date);
          }
          const d = date ? new Date(date) : new Date();
          d.setHours(0, 0, 0, 0);
          return d;
        })(),
        notes,
        durationMin,
        workoutType: workoutType || "strength",
        isDetailed: Array.isArray(exercises) && exercises.length > 0,
        exercises: {
          create: (exercises || []).map(
            (
              ex: {
                exerciseId: string;
                sets: {
                  weightKg: number;
                  reps: number;
                  rpe?: number;
                  isWarmup?: boolean;
                }[];
              },
              i: number
            ) => ({
              exerciseId: ex.exerciseId,
              order: i,
              sets: {
                create: ex.sets.map(
                  (
                    s: {
                      weightKg: number;
                      reps: number;
                      rpe?: number;
                      isWarmup?: boolean;
                    },
                    j: number
                  ) => ({
                    setNumber: j + 1,
                    weightKg: s.weightKg,
                    reps: s.reps,
                    rpe: s.rpe,
                    isWarmup: s.isWarmup ?? false,
                  })
                ),
              },
            })
          ),
        },
      },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: "asc" } },
          },
        },
      },
    });

    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    console.error("POST /api/workouts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
