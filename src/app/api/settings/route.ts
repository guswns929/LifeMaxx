import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        sex: true,
        bodyWeightKg: true,
        heightCm: true,
        dateOfBirth: true,
        preferredUnits: true,
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, sex, bodyWeightKg, heightCm, dateOfBirth, preferredUnits } =
      body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(sex !== undefined && { sex }),
        ...(bodyWeightKg !== undefined && { bodyWeightKg }),
        ...(heightCm !== undefined && { heightCm }),
        ...(dateOfBirth !== undefined && {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        }),
        ...(preferredUnits !== undefined && { preferredUnits }),
      },
      select: {
        name: true,
        sex: true,
        bodyWeightKg: true,
        heightCm: true,
        dateOfBirth: true,
        preferredUnits: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
