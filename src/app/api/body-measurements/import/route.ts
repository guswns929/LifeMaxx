import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Import nutrition data from Cronometer CSV export.
 * Cronometer "Daily Nutrition" export format has columns:
 *   Date, Energy (kcal), Protein (g), Carbs (g), Fat (g), ...
 *
 * Also supports generic CSV with columns: date, calories, protein, carbs, fat, weight
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json();
    const { csvText } = body;

    if (!csvText || typeof csvText !== "string") {
      return NextResponse.json({ error: "csvText is required" }, { status: 400 });
    }

    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
    }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));

    // Find column indices - support both Cronometer and generic formats
    const dateIdx = header.findIndex((h) => h === "date" || h === "day");
    const calIdx = header.findIndex((h) => h.includes("energy") || h === "calories" || h === "kcal" || h === "cals");
    const proteinIdx = header.findIndex((h) => h.includes("protein"));
    const carbIdx = header.findIndex((h) => h.includes("carb"));
    const fatIdx = header.findIndex((h) => h === "fat (g)" || h === "fat" || h.includes("total fat"));
    const weightIdx = header.findIndex((h) => h.includes("weight") || h.includes("body weight"));

    if (dateIdx === -1) {
      return NextResponse.json({ error: "CSV must have a 'Date' column" }, { status: 400 });
    }
    if (calIdx === -1 && weightIdx === -1) {
      return NextResponse.json({ error: "CSV must have calories or weight data" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length <= dateIdx) { skipped++; continue; }

      const dateStr = cols[dateIdx]?.replace(/"/g, "").trim();
      if (!dateStr) { skipped++; continue; }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) { skipped++; continue; }

      const calories = calIdx >= 0 ? parseNum(cols[calIdx]) : null;
      const proteinG = proteinIdx >= 0 ? parseNum(cols[proteinIdx]) : null;
      const carbsG = carbIdx >= 0 ? parseNum(cols[carbIdx]) : null;
      const fatG = fatIdx >= 0 ? parseNum(cols[fatIdx]) : null;
      const weightKg = weightIdx >= 0 ? parseNum(cols[weightIdx]) : null;

      if (calories == null && weightKg == null) { skipped++; continue; }

      // Check if a measurement already exists for this date
      const existingDate = new Date(date);
      existingDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(existingDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const existing = await prisma.bodyMeasurement.findFirst({
        where: {
          userId,
          date: { gte: existingDate, lt: nextDay },
        },
      });

      if (existing) {
        // Update existing with nutrition data
        await prisma.bodyMeasurement.update({
          where: { id: existing.id },
          data: {
            ...(calories != null && { calories: Math.round(calories) }),
            ...(proteinG != null && { proteinG }),
            ...(carbsG != null && { carbsG }),
            ...(fatG != null && { fatG }),
            ...(weightKg != null && weightKg > 0 && { weightKg }),
          },
        });
      } else if (weightKg != null && weightKg > 0) {
        // Create new only if we have weight data
        await prisma.bodyMeasurement.create({
          data: {
            userId,
            date,
            weightKg,
            calories: calories != null ? Math.round(calories) : null,
            proteinG,
            carbsG,
            fatG,
          },
        });
      } else {
        // Create with a default weight (will need existing weight data)
        const latestMeasurement = await prisma.bodyMeasurement.findFirst({
          where: { userId },
          orderBy: { date: "desc" },
        });
        if (latestMeasurement) {
          await prisma.bodyMeasurement.create({
            data: {
              userId,
              date,
              weightKg: latestMeasurement.weightKg,
              calories: calories != null ? Math.round(calories) : null,
              proteinG,
              carbsG,
              fatG,
            },
          });
        } else {
          skipped++;
          continue;
        }
      }
      imported++;
    }

    return NextResponse.json({ success: true, imported, skipped });
  } catch (error) {
    console.error("POST /api/body-measurements/import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

function parseNum(val: string | undefined): number | null {
  if (!val) return null;
  const cleaned = val.replace(/"/g, "").trim();
  if (!cleaned || cleaned === "-") return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
