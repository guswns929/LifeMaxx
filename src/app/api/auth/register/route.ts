import { NextResponse } from "next/server";
import { z } from "zod/v4";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { lbToKg, inchesToCm } from "@/lib/units";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  sex: z.enum(["male", "female"]),
  bodyWeight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  dateOfBirth: z.string().optional(),
  units: z.enum(["imperial", "metric"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password, sex, bodyWeight, height, dateOfBirth, units } =
      parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Convert to metric for internal storage
    const bodyWeightKg = bodyWeight
      ? units === "imperial"
        ? lbToKg(bodyWeight)
        : bodyWeight
      : undefined;

    const heightCm = height
      ? units === "imperial"
        ? inchesToCm(height)
        : height
      : undefined;

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        sex,
        bodyWeightKg,
        heightCm,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        preferredUnits: units,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
