import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getValidToken,
  fetchRecoveryData,
  fetchCycleData,
  fetchSleepData,
  fetchWorkoutData,
} from "@/lib/whoop";

/**
 * WHOOP sport_id → workout type + name mapping.
 * Source: WHOOP API v2 sport_id enum
 *   -1 = "Activity" (unknown/misc)
 *   0 = Running, 1 = Cycling, 33 = Swimming, 36 = Volleyball, etc.
 *   Strength-type: 44 = Weightlifting, 71 = CrossFit, 123 = Functional Fitness
 *   Cardio-type: 0 = Running, 1 = Cycling, 33 = Swimming, etc.
 */
const WHOOP_ACTIVITY_MAP: Record<string, { type: "strength" | "cardio" | "misc"; name: string; muscles?: string[] }> = {
  "-1": { type: "misc", name: "Activity" },
  "0": { type: "cardio", name: "Running", muscles: ["quadriceps", "hamstring", "calves", "gluteal"] },
  "1": { type: "cardio", name: "Cycling", muscles: ["quadriceps", "hamstring", "calves", "gluteal"] },
  "2": { type: "cardio", name: "Rowing", muscles: ["upper-back", "biceps", "quadriceps", "abs"] },
  "3": { type: "cardio", name: "Hiking", muscles: ["quadriceps", "hamstring", "calves", "gluteal"] },
  "5": { type: "cardio", name: "Elliptical", muscles: ["quadriceps", "hamstring", "gluteal"] },
  "6": { type: "cardio", name: "Stairmaster", muscles: ["quadriceps", "gluteal", "calves"] },
  "16": { type: "cardio", name: "Swimming", muscles: ["upper-back", "chest", "front-deltoids", "triceps"] },
  "17": { type: "misc", name: "Yoga", muscles: ["abs", "lower-back", "hamstring"] },
  "22": { type: "misc", name: "Stretching" },
  "25": { type: "cardio", name: "Jump Rope", muscles: ["calves", "quadriceps", "forearm"] },
  "33": { type: "cardio", name: "Skiing", muscles: ["quadriceps", "hamstring", "gluteal", "abs"] },
  "36": { type: "cardio", name: "Volleyball", muscles: ["front-deltoids", "quadriceps", "calves", "abs"] },
  "37": { type: "cardio", name: "Tennis", muscles: ["forearm", "front-deltoids", "quadriceps", "calves"] },
  "38": { type: "cardio", name: "Basketball", muscles: ["quadriceps", "calves", "gluteal", "hamstring"] },
  "39": { type: "cardio", name: "Soccer", muscles: ["quadriceps", "hamstring", "calves", "gluteal"] },
  "42": { type: "cardio", name: "Lacrosse", muscles: ["quadriceps", "front-deltoids", "forearm"] },
  "43": { type: "cardio", name: "Field Hockey", muscles: ["quadriceps", "hamstring", "lower-back"] },
  "44": { type: "strength", name: "Weightlifting" },
  "47": { type: "cardio", name: "Boxing", muscles: ["chest", "front-deltoids", "triceps", "abs", "calves"] },
  "48": { type: "cardio", name: "Martial Arts", muscles: ["abs", "quadriceps", "hamstring", "gluteal"] },
  "52": { type: "cardio", name: "Dance", muscles: ["calves", "quadriceps", "gluteal"] },
  "55": { type: "cardio", name: "Spin", muscles: ["quadriceps", "hamstring", "calves", "gluteal"] },
  "63": { type: "misc", name: "Pilates", muscles: ["abs", "obliques", "lower-back", "gluteal"] },
  "71": { type: "strength", name: "CrossFit" },
  "73": { type: "cardio", name: "HIIT", muscles: ["quadriceps", "gluteal", "abs", "chest"] },
  "82": { type: "misc", name: "Meditation" },
  "84": { type: "misc", name: "Breathwork" },
  "123": { type: "strength", name: "Functional Fitness" },
};

function getActivityInfo(sportId: string | null | undefined): { type: "strength" | "cardio" | "misc"; name: string; muscles: string[] } {
  const key = sportId ?? "-1";
  const mapped = WHOOP_ACTIVITY_MAP[key];
  if (mapped) return { type: mapped.type, name: mapped.name, muscles: mapped.muscles ?? [] };
  // Default unknown activities to misc
  return { type: "misc", name: `Activity ${key}`, muscles: [] };
}

export async function POST(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const token = await getValidToken(userId);

    const endDate = new Date().toISOString();
    const startDate = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    const results = { recovery: 0, strain: 0, sleep: 0, workouts: 0, errors: [] as string[] };

    // Normalize to local midnight for consistent daily deduplication.
    // WHOOP returns ISO timestamps representing real moments in time.
    // We extract the LOCAL calendar date the event occurred on.
    function toLocalMidnight(d: Date): Date {
      const m = new Date(d);
      m.setHours(0, 0, 0, 0);
      return m;
    }

    // Sync each data type independently so one failure doesn't block others
    try {
      const recoveryData = await fetchRecoveryData(token, startDate, endDate);
      const cycleRecords = recoveryData.records || recoveryData;
      if (Array.isArray(cycleRecords)) {
        for (const cycle of cycleRecords) {
          const score = cycle.score;
          if (!score) continue;
          const date = toLocalMidnight(new Date(cycle.created_at || cycle.start || cycle.updated_at));
          await prisma.whoopDatum.upsert({
            where: { userId_date_dataType: { userId, date, dataType: "recovery" } },
            create: {
              userId, date, dataType: "recovery",
              recoveryScore: score.recovery_score ?? score.recoveryScore ?? null,
              hrvRmssd: score.hrv_rmssd_milli ?? score.hrvRmssd ?? null,
              restingHr: score.resting_heart_rate ?? score.restingHr ?? null,
              rawJson: JSON.stringify(cycle),
            },
            update: {
              recoveryScore: score.recovery_score ?? score.recoveryScore ?? null,
              hrvRmssd: score.hrv_rmssd_milli ?? score.hrvRmssd ?? null,
              restingHr: score.resting_heart_rate ?? score.restingHr ?? null,
              rawJson: JSON.stringify(cycle),
            },
          });
          results.recovery++;
        }
      }
    } catch (e) {
      console.error("WHOOP sync recovery error:", e);
      results.errors.push(`Recovery: ${e instanceof Error ? e.message : "unknown"}`);
    }

    // Sync daily strain from cycles (this is the TOTAL daily strain, not per-workout)
    try {
      const cycleData = await fetchCycleData(token, startDate, endDate);
      const cycles = cycleData.records || cycleData;
      if (Array.isArray(cycles)) {
        for (const cycle of cycles) {
          const score = cycle.score;
          if (!score?.strain) continue;
          const date = toLocalMidnight(new Date(cycle.start || cycle.created_at));
          await prisma.whoopDatum.upsert({
            where: { userId_date_dataType: { userId, date, dataType: "strain" } },
            create: {
              userId, date, dataType: "strain",
              strainScore: score.strain,
              rawJson: JSON.stringify(cycle),
            },
            update: {
              strainScore: score.strain,
              rawJson: JSON.stringify(cycle),
            },
          });
          results.strain++;
        }
      }
    } catch (e) {
      console.error("WHOOP sync cycle/strain error:", e);
      results.errors.push(`Strain: ${e instanceof Error ? e.message : "unknown"}`);
    }

    try {
      const sleepData = await fetchSleepData(token, startDate, endDate);
      const sleepRecords = sleepData.records || sleepData;
      if (Array.isArray(sleepRecords)) {
        for (const s of sleepRecords) {
          const date = toLocalMidnight(new Date(s.start || s.created_at));
          await prisma.whoopDatum.upsert({
            where: { userId_date_dataType: { userId, date, dataType: "sleep" } },
            create: {
              userId, date, dataType: "sleep",
              sleepDurationMs: s.score?.stage_summary?.total_in_bed_time_milli ?? null,
              sleepPerformance: s.score?.sleep_performance_percentage ?? null,
              sleepEfficiency: s.score?.sleep_efficiency_percentage ?? null,
              spo2: s.score?.respiratory_rate ?? null,
              rawJson: JSON.stringify(s),
            },
            update: {
              sleepDurationMs: s.score?.stage_summary?.total_in_bed_time_milli ?? null,
              sleepPerformance: s.score?.sleep_performance_percentage ?? null,
              sleepEfficiency: s.score?.sleep_efficiency_percentage ?? null,
              spo2: s.score?.respiratory_rate ?? null,
              rawJson: JSON.stringify(s),
            },
          });
          results.sleep++;
        }
      }
    } catch (e) {
      console.error("WHOOP sync sleep error:", e);
      results.errors.push(`Sleep: ${e instanceof Error ? e.message : "unknown"}`);
    }

    try {
      const workoutData = await fetchWorkoutData(token, startDate, endDate);
      const workoutRecords = workoutData.records || workoutData;
      if (Array.isArray(workoutRecords)) {
        for (const w of workoutRecords) {
          const activityId = String(w.id);
          // Use local midnight so the workout appears on the correct calendar day
          const rawDate = new Date(w.start || w.created_at);
          const date = toLocalMidnight(rawDate);

          // Map WHOOP sport_id to workout type and display name
          const sportId = w.sport_id?.toString() ?? null;
          const activityInfo = getActivityInfo(sportId);

          // Per-workout strain is stored on the Workout record, not WhoopDatum
          // Daily strain comes from the cycle sync above
          // Check if user has already customized this workout's name/type
          const existing = await prisma.workout.findUnique({
            where: { whoopActivityId: activityId },
            select: { name: true, workoutType: true, isDetailed: true },
          });

          await prisma.workout.upsert({
            where: { whoopActivityId: activityId },
            create: {
              userId, date,
              whoopActivityId: activityId,
              name: activityInfo.name !== "Activity" ? activityInfo.name : null,
              workoutType: activityInfo.type,
              strainScore: w.score?.strain ?? null,
              avgHeartRate: w.score?.average_heart_rate ?? null,
              maxHeartRate: w.score?.max_heart_rate ?? null,
              calories: w.score?.kilojoule ? w.score.kilojoule / 4.184 : null,
              activityType: sportId,
              durationMin: w.end ? Math.round((new Date(w.end).getTime() - rawDate.getTime()) / 60000) : null,
            },
            update: {
              strainScore: w.score?.strain ?? null,
              avgHeartRate: w.score?.average_heart_rate ?? null,
              maxHeartRate: w.score?.max_heart_rate ?? null,
              calories: w.score?.kilojoule ? w.score.kilojoule / 4.184 : null,
              activityType: sportId,
              // Only update name/type if user hasn't customized them
              ...(existing && !existing.isDetailed ? {} : {}),
              ...(!existing ? { name: activityInfo.name !== "Activity" ? activityInfo.name : null, workoutType: activityInfo.type } : {}),
            },
          });
          results.workouts++;
        }
      }
    } catch (e) {
      console.error("WHOOP sync workout error:", e);
      results.errors.push(`Workouts: ${e instanceof Error ? e.message : "unknown"}`);
    }

    console.log("WHOOP sync results:", results);

    if (results.errors.length > 0 && results.recovery + results.strain + results.sleep + results.workouts === 0) {
      return NextResponse.json({ error: results.errors.join("; ") }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      synced: { recovery: results.recovery, strain: results.strain, sleep: results.sleep, workouts: results.workouts },
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error("POST /api/whoop/sync error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
