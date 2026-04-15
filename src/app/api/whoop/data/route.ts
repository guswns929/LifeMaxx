import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Composite scoring methodology:
 *
 * RECOVERY (0-100): Weighted composite of WHOOP recovery + research-backed factors
 *   - WHOOP recovery score (40%): Direct HRV-based autonomic readiness
 *   - HRV trend stability (20%): Coefficient of variation over 7 days (lower = better)
 *     Source: Plews et al., 2013, Int J Sports Physiol Perform
 *   - Resting HR deviation (20%): How far from 7-day baseline (lower = better)
 *     Source: Buchheit, 2014, Sports Medicine
 *   - Sleep quality (20%): Sleep performance percentage
 *     Source: Watson et al., 2017, ACSM consensus on sleep & athletic performance
 *
 * SLEEP (0-100): Multi-factor sleep quality score
 *   - Sleep performance % from WHOOP (30%)
 *   - Duration adequacy (30%): 7-9h optimal per AASM/Sleep Foundation guidelines
 *   - Sleep efficiency (20%): Time asleep / time in bed
 *     Source: Ohayon et al., 2017, Sleep Health
 *   - Consistency (20%): Deviation from average bedtime
 *     Source: Phillips et al., 2017, Scientific Reports
 *
 * STRAIN (0-100): Normalized training load
 *   - WHOOP strain (50%): Normalized from 0-21 scale
 *   - Acute:Chronic workload ratio consideration (25%): Compare today vs 7-day avg
 *     Source: Gabbett, 2016, Br J Sports Med (ACWR "sweet spot" 0.8-1.3)
 *   - Recovery-adjusted strain (25%): Strain relative to recovery capacity
 *     Source: Halson, 2014, Sports Medicine
 */

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const connection = await prisma.whoopConnection.findUnique({ where: { userId } });

    const data = await prisma.whoopDatum.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      take: 60,
    });

    const recoveryRecords = data.filter((d) => d.dataType === "recovery");
    const sleepRecords = data.filter((d) => d.dataType === "sleep");
    const strainRecords = data.filter((d) => d.dataType === "strain");

    // Deduplicate by date (keep latest per calendar day)
    // CRITICAL: Use local date parts, not UTC, to avoid off-by-one
    function toLocalDateKey(d: Date): string {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    function dedupeByDate<T extends { date: Date }>(records: T[]): T[] {
      const map = new Map<string, T>();
      for (const r of records) {
        const key = toLocalDateKey(new Date(r.date));
        map.set(key, r); // last wins (records are asc, so latest entry per day)
      }
      return Array.from(map.values());
    }

    const dedupedRecovery = dedupeByDate(recoveryRecords);
    const dedupedSleep = dedupeByDate(sleepRecords);
    const dedupedStrain = dedupeByDate(strainRecords);

    // --- Composite Recovery Score ---
    const latestRecovery = dedupedRecovery.at(-1);
    const latestSleep = dedupedSleep.at(-1);
    const latestStrain = dedupedStrain.at(-1);

    let compositeRecovery = 0;
    let compositeRecoveryBreakdown: Record<string, number> = {};
    if (latestRecovery) {
      const whoopScore = latestRecovery.recoveryScore ?? 50;

      // HRV stability: coefficient of variation over last 7 entries
      const recentHrvs = dedupedRecovery.slice(-7).map((r) => r.hrvRmssd).filter((v): v is number => v != null);
      let hrvStability = 80;
      if (recentHrvs.length >= 3) {
        const mean = recentHrvs.reduce((a, b) => a + b, 0) / recentHrvs.length;
        const stdDev = Math.sqrt(recentHrvs.reduce((s, v) => s + (v - mean) ** 2, 0) / recentHrvs.length);
        const cv = mean > 0 ? (stdDev / mean) * 100 : 50;
        // CV < 5% = excellent (100), CV > 25% = poor (0)
        hrvStability = Math.max(0, Math.min(100, 100 - (cv - 5) * (100 / 20)));
      }

      // Resting HR deviation from baseline
      const recentHRs = dedupedRecovery.slice(-7).map((r) => r.restingHr).filter((v): v is number => v != null);
      let hrDeviation = 80;
      if (recentHRs.length >= 3 && latestRecovery.restingHr != null) {
        const baseline = recentHRs.reduce((a, b) => a + b, 0) / recentHRs.length;
        const deviation = Math.abs(latestRecovery.restingHr - baseline);
        // 0 bpm deviation = 100, 10+ bpm = 0
        hrDeviation = Math.max(0, Math.min(100, 100 - deviation * 10));
      }

      // Sleep quality contribution
      const sleepQuality = latestSleep?.sleepPerformance ?? 70;

      compositeRecovery = Math.round(
        whoopScore * 0.4 +
        hrvStability * 0.2 +
        hrDeviation * 0.2 +
        sleepQuality * 0.2
      );
      compositeRecoveryBreakdown = {
        whoopRecovery: Math.round(whoopScore),
        hrvStability: Math.round(hrvStability),
        hrBaseline: Math.round(hrDeviation),
        sleepImpact: Math.round(sleepQuality),
      };
    }

    // --- Composite Sleep Score ---
    let compositeSleep = 0;
    let compositeSleepBreakdown: Record<string, number> = {};
    if (latestSleep) {
      const performance = latestSleep.sleepPerformance ?? 70;

      // Duration adequacy: 7-9h is optimal (AASM guidelines)
      const durationHrs = (latestSleep.sleepDurationMs ?? 0) / 3_600_000;
      let durationScore: number;
      if (durationHrs >= 7 && durationHrs <= 9) {
        durationScore = 100;
      } else if (durationHrs >= 6 && durationHrs < 7) {
        durationScore = 60 + (durationHrs - 6) * 40;
      } else if (durationHrs > 9 && durationHrs <= 10) {
        durationScore = 100 - (durationHrs - 9) * 20;
      } else if (durationHrs < 6) {
        durationScore = Math.max(0, durationHrs / 6 * 60);
      } else {
        durationScore = Math.max(40, 80 - (durationHrs - 10) * 20);
      }

      // Sleep efficiency
      const efficiency = latestSleep.sleepEfficiency ?? 85;
      // 95%+ = 100, 80% = 50, below 70% = 0
      const efficiencyScore = Math.max(0, Math.min(100, (efficiency - 70) * (100 / 25)));

      // Consistency: deviation in sleep start times
      const sleepTimes = dedupedSleep.slice(-7).map((s) => {
        const d = new Date(s.date);
        return d.getHours() * 60 + d.getMinutes();
      });
      let consistencyScore = 80;
      if (sleepTimes.length >= 3) {
        const avgTime = sleepTimes.reduce((a, b) => a + b, 0) / sleepTimes.length;
        const stdDev = Math.sqrt(sleepTimes.reduce((s, v) => s + (v - avgTime) ** 2, 0) / sleepTimes.length);
        // < 30 min std dev = 100, > 90 min = 0
        consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev - 30) * (100 / 60)));
      }

      compositeSleep = Math.round(
        performance * 0.3 +
        durationScore * 0.3 +
        efficiencyScore * 0.2 +
        consistencyScore * 0.2
      );
      compositeSleepBreakdown = {
        performance: Math.round(performance),
        duration: Math.round(durationScore),
        efficiency: Math.round(efficiencyScore),
        consistency: Math.round(consistencyScore),
      };
    }

    // --- Composite Strain Score ---
    let compositeStrain = 0;
    let compositeStrainBreakdown: Record<string, number> = {};
    if (latestStrain?.strainScore != null) {
      const normalizedStrain = Math.min(100, (latestStrain.strainScore / 21) * 100);

      // ACWR: acute (today) vs chronic (7-day avg)
      const recentStrains = dedupedStrain.slice(-7).map((s) => s.strainScore).filter((v): v is number => v != null);
      let acwrScore = 70;
      if (recentStrains.length >= 3) {
        const chronic = recentStrains.reduce((a, b) => a + b, 0) / recentStrains.length;
        const acwr = chronic > 0 ? latestStrain.strainScore / chronic : 1;
        // Sweet spot 0.8-1.3 = high score, outside = lower
        if (acwr >= 0.8 && acwr <= 1.3) {
          acwrScore = 90 + (1 - Math.abs(acwr - 1.05) / 0.25) * 10;
        } else if (acwr < 0.8) {
          acwrScore = Math.max(30, acwr / 0.8 * 70);
        } else {
          acwrScore = Math.max(20, 90 - (acwr - 1.3) * 50);
        }
      }

      // Recovery-adjusted: high strain with good recovery = effective
      const recovScore = latestRecovery?.recoveryScore ?? 50;
      const recoveryAdjusted = normalizedStrain * (recovScore / 100);

      compositeStrain = Math.round(
        normalizedStrain * 0.5 +
        acwrScore * 0.25 +
        recoveryAdjusted * 0.25
      );
      compositeStrainBreakdown = {
        rawStrain: Math.round(normalizedStrain),
        workloadRatio: Math.round(acwrScore),
        recoveryAdjusted: Math.round(recoveryAdjusted),
      };
    }

    return NextResponse.json({
      connected: !!connection,
      recovery: dedupedRecovery.map((r) => ({
        date: toLocalDateKey(new Date(r.date)),
        recoveryScore: r.recoveryScore ?? 0,
        hrvRmssd: r.hrvRmssd ?? 0,
        restingHr: r.restingHr ?? 0,
      })),
      sleep: dedupedSleep.map((s) => ({
        date: toLocalDateKey(new Date(s.date)),
        durationHours: Math.round(((s.sleepDurationMs ?? 0) / 3_600_000) * 10) / 10,
        performance: s.sleepPerformance ?? 0,
        efficiency: s.sleepEfficiency ?? 0,
      })),
      strain: dedupedStrain.map((s) => ({
        date: toLocalDateKey(new Date(s.date)),
        score: s.strainScore ?? 0,
      })),
      latestRecovery: latestRecovery
        ? { score: latestRecovery.recoveryScore ?? 0, hrv: latestRecovery.hrvRmssd ?? 0, restingHr: latestRecovery.restingHr ?? 0 }
        : null,
      latestStrain: latestStrain?.strainScore != null
        ? { score: latestStrain.strainScore, recommendation: "" }
        : null,
      compositeScores: {
        recovery: { score: compositeRecovery, breakdown: compositeRecoveryBreakdown },
        sleep: { score: compositeSleep, breakdown: compositeSleepBreakdown },
        strain: { score: compositeStrain, breakdown: compositeStrainBreakdown },
      },
    });
  } catch (error) {
    console.error("GET /api/whoop/data error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
