"use client";

import { useState, useEffect, useCallback } from "react";
import WhoopMetrics from "@/components/charts/WhoopMetrics";

interface RecoveryData {
  date: string;
  recoveryScore: number;
  hrvRmssd: number;
  restingHr: number;
}

interface SleepData {
  date: string;
  durationHours: number;
  performance: number;
}

interface CompositeScore {
  score: number;
  breakdown: Record<string, number>;
}

interface StrainData {
  date: string;
  score: number;
}

interface WhoopApiResponse {
  connected: boolean;
  recovery: { date: string; recoveryScore: number; hrvRmssd: number; restingHr: number }[];
  sleep: { date: string; durationHours: number; performance: number }[];
  strain: { date: string; score: number }[];
  latestRecovery: { score: number; hrv: number; restingHr: number } | null;
  latestStrain: { score: number; recommendation: string } | null;
  compositeScores?: {
    recovery: CompositeScore;
    sleep: CompositeScore;
    strain: CompositeScore;
  };
}

export default function WhoopPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<RecoveryData[]>([]);
  const [sleep, setSleep] = useState<SleepData[]>([]);
  const [latestRecovery, setLatestRecovery] = useState<{
    score: number;
    hrv: number;
    restingHr: number;
  } | null>(null);
  const [strain, setStrain] = useState<StrainData[]>([]);
  const [latestStrain, setLatestStrain] = useState<{
    score: number;
    recommendation: string;
  } | null>(null);
  const [compositeScores, setCompositeScores] = useState<WhoopApiResponse["compositeScores"]>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchWhoopData = useCallback(async () => {
    try {
      const res = await fetch("/api/whoop/data");
      if (!res.ok) {
        setConnected(false);
        return;
      }
      const data: WhoopApiResponse = await res.json();
      setConnected(data.connected);

      if (data.connected) {
        // Format recovery data for charts
        setRecovery(
          (data.recovery ?? []).map((r) => ({
            date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            recoveryScore: r.recoveryScore ?? 0,
            hrvRmssd: r.hrvRmssd ?? 0,
            restingHr: r.restingHr ?? 0,
          }))
        );
        setSleep(
          (data.sleep ?? []).map((s) => ({
            date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            durationHours: s.durationHours ?? 0,
            performance: s.performance ?? 0,
          }))
        );
        setStrain(
          (data.strain ?? []).map((s) => ({
            date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            score: s.score ?? 0,
          }))
        );
        setLatestRecovery(data.latestRecovery);
        setLatestStrain(data.latestStrain);
        setCompositeScores(data.compositeScores);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWhoopData();
  }, [fetchWhoopData]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/whoop/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const parts = [];
        if (data.synced?.recovery) parts.push(`${data.synced.recovery} recovery`);
        if (data.synced?.sleep) parts.push(`${data.synced.sleep} sleep`);
        if (data.synced?.workouts) parts.push(`${data.synced.workouts} workout`);
        const summary = parts.length > 0 ? `Synced ${parts.join(", ")} records` : "Sync complete (no new data)";
        const warnings = data.errors?.length ? `. Partial errors: ${data.errors.join("; ")}` : "";
        setSyncMessage(`${summary}${warnings}. Refreshing...`);
        await fetchWhoopData();
      } else {
        setSyncMessage(data.error || "Sync failed. Please try again.");
      }
    } catch {
      setSyncMessage("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">WHOOP Integration</h1>

      {!connected ? (
        <div className="bg-surface rounded-xl border border-border p-12 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-6.364-6.364L4.5 8.257m5.25 1.5l4.5-4.5"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Connect Your WHOOP
          </h2>
          <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
            Link your WHOOP account to automatically track recovery, strain, and
            sleep data alongside your workouts.
          </p>
          <a
            href="/api/whoop/connect"
            className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm"
          >
            Connect WHOOP
          </a>
        </div>
      ) : (
        <>
          {/* Sync Controls */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  WHOOP Connected
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Sync to fetch the latest 14 days of data
                </p>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {syncing ? "Syncing..." : "Sync Data"}
              </button>
            </div>
            {syncMessage && (
              <p
                className={`mt-3 text-sm ${
                  syncMessage.includes("complete")
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {syncMessage}
              </p>
            )}
          </div>

          {/* WHOOP Metrics */}
          <WhoopMetrics
            recovery={recovery}
            sleep={sleep}
            strain={strain}
            latestRecovery={latestRecovery}
            latestStrain={latestStrain}
            compositeScores={compositeScores}
          />
        </>
      )}
    </div>
  );
}
