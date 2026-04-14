import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getValidToken,
  fetchRecoveryData,
  fetchSleepData,
  fetchWorkoutData,
} from "@/lib/whoop";

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

    const results = { recovery: 0, sleep: 0, workouts: 0, errors: [] as string[] };

    // Sync each data type independently so one failure doesn't block others
    try {
      const recoveryData = await fetchRecoveryData(token, startDate, endDate);
      const cycleRecords = recoveryData.records || recoveryData;
      if (Array.isArray(cycleRecords)) {
        for (const cycle of cycleRecords) {
          const score = cycle.score;
          if (!score) continue;
          const date = new Date(cycle.created_at || cycle.start || cycle.updated_at);
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

    try {
      const sleepData = await fetchSleepData(token, startDate, endDate);
      const sleepRecords = sleepData.records || sleepData;
      if (Array.isArray(sleepRecords)) {
        for (const s of sleepRecords) {
          const date = new Date(s.start || s.created_at);
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
          const date = new Date(w.start || w.created_at);

          await prisma.whoopDatum.upsert({
            where: { userId_date_dataType: { userId, date, dataType: "strain" } },
            create: {
              userId, date, dataType: "strain",
              strainScore: w.score?.strain ?? null,
              rawJson: JSON.stringify(w),
            },
            update: {
              strainScore: w.score?.strain ?? null,
              rawJson: JSON.stringify(w),
            },
          });

          await prisma.workout.upsert({
            where: { whoopActivityId: activityId },
            create: {
              userId, date,
              whoopActivityId: activityId,
              strainScore: w.score?.strain ?? null,
              avgHeartRate: w.score?.average_heart_rate ?? null,
              maxHeartRate: w.score?.max_heart_rate ?? null,
              calories: w.score?.kilojoule ? w.score.kilojoule / 4.184 : null,
              activityType: w.sport_id?.toString() ?? null,
              durationMin: w.end ? Math.round((new Date(w.end).getTime() - date.getTime()) / 60000) : null,
            },
            update: {
              strainScore: w.score?.strain ?? null,
              avgHeartRate: w.score?.average_heart_rate ?? null,
              maxHeartRate: w.score?.max_heart_rate ?? null,
              calories: w.score?.kilojoule ? w.score.kilojoule / 4.184 : null,
              activityType: w.sport_id?.toString() ?? null,
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

    if (results.errors.length > 0 && results.recovery + results.sleep + results.workouts === 0) {
      return NextResponse.json({ error: results.errors.join("; ") }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      synced: { recovery: results.recovery, sleep: results.sleep, workouts: results.workouts },
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error("POST /api/whoop/sync error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
