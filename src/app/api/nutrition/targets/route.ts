import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateNutritionTargets, type ActivityLevel } from "@/lib/nutrition";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Get latest body measurement for current weight
    const latestMeasurement = await prisma.bodyMeasurement.findFirst({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    });

    const weightKg = latestMeasurement?.weightKg ?? user.bodyWeightKg;
    const heightCm = user.heightCm;
    const dateOfBirth = user.dateOfBirth;
    const sex = (user.sex as "male" | "female") ?? "male";

    if (!weightKg || !heightCm || !dateOfBirth) {
      return NextResponse.json({
        error: "Profile incomplete. Please set weight, height, and date of birth in settings.",
        needsProfile: true,
      }, { status: 400 });
    }

    const ageYears = Math.floor(
      (Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );

    // Activity level from query param or default
    const activityLevel = (request.nextUrl.searchParams.get("activity") as ActivityLevel) || "moderate";
    const phase = (latestMeasurement?.phase as "cut" | "maintain" | "bulk") || "maintain";

    const targets = calculateNutritionTargets({
      weightKg,
      heightCm,
      ageYears,
      sex,
      activityLevel,
      phase,
    });

    return NextResponse.json({
      ...targets,
      phase,
      activityLevel,
      weightKg: Math.round(weightKg * 10) / 10,
      ageYears,
    });
  } catch (error) {
    console.error("GET /api/nutrition/targets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
