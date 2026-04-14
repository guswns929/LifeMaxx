import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");
    const muscle = request.nextUrl.searchParams.get("muscle");

    const session = await auth();
    const userId = session?.user?.id;

    const exercises = await prisma.exercise.findMany({
      where: {
        AND: [
          q ? { name: { contains: q } } : {},
          muscle ? {
            OR: [
              { primaryMuscles: { contains: muscle } },
              { secondaryMuscles: { contains: muscle } },
            ],
          } : {},
          // Show global exercises + user's custom ones
          {
            OR: [
              { isCustom: false },
              ...(userId ? [{ createdByUserId: userId }] : []),
            ],
          },
        ],
      },
      orderBy: { name: "asc" },
      take: 50,
      select: {
        id: true,
        name: true,
        category: true,
        equipment: true,
        primaryMuscles: true,
        secondaryMuscles: true,
        isCustom: true,
        linkedExerciseId: true,
      },
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("GET /api/exercises error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, category, equipment, primaryMuscles, secondaryMuscles, linkedExerciseId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Exercise name is required" }, { status: 400 });
    }
    if (!primaryMuscles) {
      return NextResponse.json({ error: "At least one primary muscle required" }, { status: 400 });
    }

    // Check for duplicate name
    const existing = await prisma.exercise.findFirst({
      where: { name: name.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "An exercise with this name already exists" }, { status: 409 });
    }

    // Validate linked exercise exists if provided
    if (linkedExerciseId) {
      const linked = await prisma.exercise.findUnique({ where: { id: linkedExerciseId } });
      if (!linked) {
        return NextResponse.json({ error: "Linked exercise not found" }, { status: 400 });
      }
    }

    const exercise = await prisma.exercise.create({
      data: {
        name: name.trim(),
        category: category || "compound",
        equipment: equipment || null,
        primaryMuscles: primaryMuscles,
        secondaryMuscles: secondaryMuscles || null,
        isCustom: true,
        createdByUserId: session.user.id,
        linkedExerciseId: linkedExerciseId || null,
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error("POST /api/exercises error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
