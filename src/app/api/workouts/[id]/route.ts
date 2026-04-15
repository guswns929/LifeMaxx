import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const workout = await prisma.workout.findUnique({
      where: { id, userId: session.user.id },
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

    if (!workout)
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });

    return NextResponse.json(workout);
  } catch (error) {
    console.error("GET /api/workouts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const { id } = await params;

    const existing = await prisma.workout.findUnique({
      where: { id, userId },
    });
    if (!existing)
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });

    const body = await request.json();
    const { date, name, notes, durationMin, exercises, workoutType } = body;

    if (Array.isArray(exercises)) {
      await prisma.workoutExercise.deleteMany({ where: { workoutId: id } });
    }

    const workout = await prisma.workout.update({
      where: { id },
      data: {
        ...(date !== undefined && {
          date: (() => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; })(),
        }),
        ...(name !== undefined && { name }),
        ...(notes !== undefined && { notes }),
        ...(durationMin !== undefined && { durationMin }),
        ...(workoutType !== undefined && { workoutType }),
        ...(Array.isArray(exercises) && {
          isDetailed: exercises.length > 0,
          exercises: {
            create: exercises.map(
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
        }),
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

    return NextResponse.json(workout);
  } catch (error) {
    console.error("PUT /api/workouts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.workout.findUnique({
      where: { id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });

    await prisma.workout.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workouts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
