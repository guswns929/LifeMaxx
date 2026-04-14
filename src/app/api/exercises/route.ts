import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");
    const muscle = request.nextUrl.searchParams.get("muscle");

    const exercises = await prisma.exercise.findMany({
      where: {
        ...(q && { name: { contains: q } }),
        ...(muscle && { primaryMuscles: { contains: muscle } }),
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("GET /api/exercises error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
