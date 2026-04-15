"use client";

import { useState, useEffect, useCallback } from "react";
import { getRankColor, getRankTiers } from "@/lib/scoring";
import { formatWeight, parseWeightInput, type UnitSystem } from "@/lib/units";

interface Evaluation {
  id: string;
  date: string;
  benchPressKg: number | null;
  squatKg: number | null;
  deadliftKg: number | null;
  totalKg: number | null;
  wilksScore: number | null;
  rank: string | null;
  rankScore: number | null;
  bodyWeightKg: number | null;
  notes: string | null;
}

interface RankResult {
  rank: string;
  rankScore: number;
  wilksScore: number;
  totalKg: number;
  nextRank: string | null;
  pointsToNext: number;
  benchPercentile: number;
  squatPercentile: number;
  deadliftPercentile: number;
}

const RANK_TIERS = getRankTiers();

export default function RankedPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isDue, setIsDue] = useState(true);
  const [daysUntilNext, setDaysUntilNext] = useState(0);
  const [recentBests, setRecentBests] = useState<Record<string, number>>({});
  const [units, setUnits] = useState<UnitSystem>("imperial");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [lastResult, setLastResult] = useState<RankResult | null>(null);

  // Form state
  const [bench, setBench] = useState("");
  const [squat, setSquat] = useState("");
  const [deadlift, setDeadlift] = useState("");
  const [notes, setNotes] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [evalRes, settingsRes] = await Promise.all([
        fetch("/api/rank-evaluation"),
        fetch("/api/settings"),
      ]);
      if (evalRes.ok) {
        const data = await evalRes.json();
        setEvaluations(data.evaluations);
        setIsDue(data.isDue);
        setDaysUntilNext(data.daysUntilNext);
        setRecentBests(data.recentBests || {});
      }
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setUnits(s.preferredUnits || "imperial");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    const benchKg = bench ? parseWeightInput(parseFloat(bench), units) : 0;
    const squatKg = squat ? parseWeightInput(parseFloat(squat), units) : 0;
    const deadliftKg = deadlift ? parseWeightInput(parseFloat(deadlift), units) : 0;

    if (benchKg === 0 && squatKg === 0 && deadliftKg === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/rank-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benchPressKg: benchKg || null,
          squatKg: squatKg || null,
          deadliftKg: deadliftKg || null,
          notes: notes || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLastResult(data.result);
        setShowForm(false);
        setBench("");
        setSquat("");
        setDeadlift("");
        setNotes("");
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const latestEval = evaluations[0];
  const latestRank = latestEval?.rank ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Ranked Evaluation</h1>
      <p className="text-sm text-text-muted">
        Every 2 months, test your 1-rep max on Bench Press, Squat, and Deadlift.
        Your total is scored using the Wilks coefficient, adjusted for your body weight,
        sex, and age to determine your rank.
      </p>

      {/* Current Rank Card */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Current Rank</p>
            {latestRank ? (
              <div className="flex items-center gap-3 mt-2">
                <span
                  className="text-3xl font-black"
                  style={{ color: getRankColor(latestRank) }}
                >
                  {latestRank}
                </span>
                <div className="text-sm text-text-secondary">
                  <p>Wilks: {latestEval.wilksScore?.toFixed(1)}</p>
                  <p>Total: {formatWeight(latestEval.totalKg ?? 0, units)}</p>
                </div>
              </div>
            ) : (
              <p className="text-lg text-text-muted mt-2">No evaluations yet</p>
            )}
          </div>
          <div className="text-right">
            {isDue ? (
              <button
                onClick={() => setShowForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm"
              >
                Take Evaluation
              </button>
            ) : (
              <div>
                <p className="text-xs text-text-muted">Next evaluation in</p>
                <p className="text-xl font-bold text-text-primary">{daysUntilNext} days</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rank Tier Progression */}
      <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Rank Tiers</h3>
        <div className="flex items-center gap-1">
          {RANK_TIERS.map((tier, i) => {
            const isActive = latestRank === tier.name;
            const isPast = latestEval?.wilksScore ? (latestEval.wilksScore >= tier.minWilks) : false;
            return (
              <div
                key={tier.name}
                className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "ring-2 ring-white/30 scale-105"
                    : isPast
                    ? "opacity-80"
                    : "opacity-30"
                }`}
                style={{
                  backgroundColor: tier.color + (isActive ? "" : "40"),
                  color: isActive ? "#fff" : tier.color,
                }}
              >
                <div className="truncate px-1">{tier.name}</div>
                {i < RANK_TIERS.length - 1 && (
                  <div className="text-[9px] opacity-60">{tier.minWilks}+</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Last Result Banner */}
      {lastResult && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Evaluation Result</p>
          <span
            className="text-4xl font-black"
            style={{ color: getRankColor(lastResult.rank) }}
          >
            {lastResult.rank}
          </span>
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <p className="text-text-muted text-xs">Wilks Score</p>
              <p className="text-lg font-bold text-text-primary">{lastResult.wilksScore.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Total</p>
              <p className="text-lg font-bold text-text-primary">{formatWeight(lastResult.totalKg, units)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Rank Score</p>
              <p className="text-lg font-bold text-text-primary">{lastResult.rankScore}/100</p>
            </div>
          </div>
          {lastResult.nextRank && (
            <p className="text-sm text-text-muted mt-3">
              {lastResult.pointsToNext.toFixed(1)} Wilks points to <span className="font-semibold" style={{ color: getRankColor(lastResult.nextRank) }}>{lastResult.nextRank}</span>
            </p>
          )}
          <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
            {lastResult.benchPercentile > 0 && (
              <div className="p-2 rounded-lg bg-surface-raised">
                <p className="text-text-muted">Bench</p>
                <p className="text-text-primary font-semibold">Top {100 - lastResult.benchPercentile}%</p>
              </div>
            )}
            {lastResult.squatPercentile > 0 && (
              <div className="p-2 rounded-lg bg-surface-raised">
                <p className="text-text-muted">Squat</p>
                <p className="text-text-primary font-semibold">Top {100 - lastResult.squatPercentile}%</p>
              </div>
            )}
            {lastResult.deadliftPercentile > 0 && (
              <div className="p-2 rounded-lg bg-surface-raised">
                <p className="text-text-muted">Deadlift</p>
                <p className="text-text-primary font-semibold">Top {100 - lastResult.deadliftPercentile}%</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setLastResult(null)}
            className="mt-4 text-xs text-text-muted hover:text-text-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Evaluation Form */}
      {showForm && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Log 1RM Attempts</h3>
            <button onClick={() => setShowForm(false)} className="text-xs text-text-muted hover:text-text-primary">
              Cancel
            </button>
          </div>
          <p className="text-xs text-text-muted mb-4">
            Enter your 1-rep max for each lift. Based on your recent training, your estimated e1RMs are shown as placeholders.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">
                Bench Press ({units === "imperial" ? "lbs" : "kg"})
              </label>
              <input
                type="number"
                value={bench}
                onChange={(e) => setBench(e.target.value)}
                placeholder={recentBests["Bench Press"] ? formatWeight(recentBests["Bench Press"], units).replace(/[^\d.]/g, "") : ""}
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">
                Squat ({units === "imperial" ? "lbs" : "kg"})
              </label>
              <input
                type="number"
                value={squat}
                onChange={(e) => setSquat(e.target.value)}
                placeholder={recentBests["Squat"] ? formatWeight(recentBests["Squat"], units).replace(/[^\d.]/g, "") : ""}
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">
                Deadlift ({units === "imperial" ? "lbs" : "kg"})
              </label>
              <input
                type="number"
                value={deadlift}
                onChange={(e) => setDeadlift(e.target.value)}
                placeholder={recentBests["Deadlift"] ? formatWeight(recentBests["Deadlift"], units).replace(/[^\d.]/g, "") : ""}
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it feel?"
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || (!bench && !squat && !deadlift)}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {submitting ? "Calculating..." : "Submit Evaluation"}
            </button>
          </div>
        </div>
      )}

      {/* Evaluation History */}
      {evaluations.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Evaluation History</h3>
          <div className="space-y-2">
            {evaluations.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-bold w-20"
                    style={{ color: getRankColor(ev.rank ?? "Iron") }}
                  >
                    {ev.rank}
                  </span>
                  <div className="text-xs text-text-muted">
                    {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  {ev.benchPressKg && <span>B: {formatWeight(ev.benchPressKg, units)}</span>}
                  {ev.squatKg && <span>S: {formatWeight(ev.squatKg, units)}</span>}
                  {ev.deadliftKg && <span>D: {formatWeight(ev.deadliftKg, units)}</span>}
                  <span className="font-semibold text-text-primary">
                    Wilks: {ev.wilksScore?.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scoring Methodology */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Scoring Methodology</h4>
        <div className="text-[11px] text-text-muted leading-relaxed space-y-1">
          <p>
            <span className="text-text-secondary font-medium">Wilks Coefficient</span>: Normalizes your SBD total relative to body weight using the IPF-approved Wilks formula, enabling fair comparison across weight classes.
          </p>
          <p>
            <span className="text-text-secondary font-medium">Age Adjustment</span>: Masters lifters (40+) receive a McCulloch-style age coefficient to account for natural strength decline.
          </p>
          <p>
            <span className="text-text-secondary font-medium">Rank Tiers</span>: Iron (&lt;150) &rarr; Bronze (150) &rarr; Silver (225) &rarr; Gold (300) &rarr; Platinum (375) &rarr; Diamond (425) &rarr; Champion (475+).
          </p>
        </div>
      </div>
    </div>
  );
}
