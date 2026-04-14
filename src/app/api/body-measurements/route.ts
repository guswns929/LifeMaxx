import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const limit = Number(request.nextUrl.searchParams.get("limit")) || 20;

    const measurements = await prisma.bodyMeasurement.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json(measurements);
  } catch (error) {
    console.error("GET /api/body-measurements error:", error);
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
    const { weightKg, bodyFatPct, phase, notes, calories, proteinG, carbsG, fatG } = body;

    if (typeof weightKg !== "number" || weightKg <= 0) {
      return NextResponse.json(
        { error: "weightKg is required and must be a positive number" },
        { status: 400 }
      );
    }

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        userId, weightKg, bodyFatPct, phase, notes,
        calories: calories != null ? Math.round(calories) : null,
        proteinG: proteinG ?? null,
        carbsG: carbsG ?? null,
        fatG: fatG ?? null,
      },
    });

    return NextResponse.json(measurement, { status: 201 });
  } catch (error) {
    console.error("POST /api/body-measurements error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
