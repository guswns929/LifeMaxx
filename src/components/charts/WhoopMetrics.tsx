"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

interface WhoopMetricsProps {
  recovery: RecoveryData[];
  sleep: SleepData[];
  latestRecovery?: {
    score: number;
    hrv: number;
    restingHr: number;
  } | null;
  latestStrain?: {
    score: number;
    recommendation: string;
  } | null;
  compositeScores?: {
    recovery: CompositeScore;
    sleep: CompositeScore;
    strain: CompositeScore;
  } | null;
}

// Donut chart for a composite score
function ScoreDonut({ score, label, color, breakdown }: {
  score: number;
  label: string;
  color: string;
  breakdown: Record<string, number>;
}) {
  const remaining = Math.max(0, 100 - score);
  const data = [
    { name: label, value: score },
    { name: "remaining", value: remaining },
  ];

  const labelMap: Record<string, string> = {
    whoopRecovery: "WHOOP Recovery",
    hrvStability: "HRV Stability",
    hrBaseline: "HR Baseline",
    sleepImpact: "Sleep Impact",
    performance: "Sleep Performance",
    duration: "Duration (7-9h)",
    efficiency: "Sleep Efficiency",
    consistency: "Consistency",
    rawStrain: "Raw Strain",
    workloadRatio: "Acute:Chronic Ratio",
    recoveryAdjusted: "Recovery-Adjusted",
  };

  const getScoreColor = (s: number) => {
    if (s >= 67) return "#22C55E";
    if (s >= 34) return "#F59E0B";
    return "#EF4444";
  };

  const scoreColor = getScoreColor(score);

  return (
    <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{label}</h3>
      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={32}
                outerRadius={48}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={scoreColor} />
                <Cell fill="#292524" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: scoreColor }}>{score}</span>
            <span className="text-[10px] text-text-muted">/100</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted truncate">{labelMap[key] ?? key}</span>
                  <span className="text-text-secondary font-medium ml-1">{value}</span>
                </div>
                <div className="h-1 bg-stone-800 rounded-full mt-0.5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${value}%`, backgroundColor: getScoreColor(value) }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function WhoopMetrics({
  recovery,
  sleep,
  latestRecovery,
  latestStrain,
  compositeScores,
}: WhoopMetricsProps) {
  // Format chart data with deduped single-date labels
  const recoveryChart = recovery.map((r) => ({
    date: formatDate(r.date),
    recoveryScore: r.recoveryScore,
    hrvRmssd: r.hrvRmssd,
    restingHr: r.restingHr,
  }));
  const sleepChart = sleep.map((s) => ({
    date: formatDate(s.date),
    durationHours: s.durationHours,
    performance: s.performance,
  }));

  return (
    <div className="space-y-6">
      {/* Composite Score Donuts */}
      {compositeScores && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScoreDonut
            score={compositeScores.recovery.score}
            label="Recovery Score"
            color="#22C55E"
            breakdown={compositeScores.recovery.breakdown}
          />
          <ScoreDonut
            score={compositeScores.sleep.score}
            label="Sleep Score"
            color="#818CF8"
            breakdown={compositeScores.sleep.breakdown}
          />
          <ScoreDonut
            score={compositeScores.strain.score}
            label="Strain Score"
            color="#F59E0B"
            breakdown={compositeScores.strain.breakdown}
          />
        </div>
      )}

      {/* Top Cards - raw WHOOP values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {latestRecovery && (
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">WHOOP Recovery</h4>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold" style={{ color: latestRecovery.score >= 67 ? "#22C55E" : latestRecovery.score >= 34 ? "#F59E0B" : "#EF4444" }}>
                {latestRecovery.score}%
              </span>
            </div>
          </div>
        )}
        {latestRecovery && (
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Vitals</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">HRV</span>
                <span className="text-sm font-semibold text-text-primary">{Math.round(latestRecovery.hrv)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Resting HR</span>
                <span className="text-sm font-semibold text-text-primary">{latestRecovery.restingHr} bpm</span>
              </div>
            </div>
          </div>
        )}
        {latestStrain && (
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Today&apos;s Strain</h4>
            <span className="text-3xl font-bold text-text-primary">{latestStrain.score.toFixed(1)}</span>
            <span className="text-sm text-text-muted ml-1">/ 21</span>
          </div>
        )}
      </div>

      {/* HRV Trend */}
      {recoveryChart.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary mb-4">HRV Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={recoveryChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#44403C" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#A8A29E" }} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "#A8A29E" }} tickLine={false} unit=" ms" />
              <Tooltip contentStyle={{ backgroundColor: "#1C1917", border: "1px solid #44403C", borderRadius: "8px", fontSize: "12px", color: "#FAFAF9" }} />
              <Line type="monotone" dataKey="hrvRmssd" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} name="HRV" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sleep Duration */}
      {sleepChart.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Sleep Duration</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sleepChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#44403C" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#A8A29E" }} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "#A8A29E" }} tickLine={false} unit=" hrs" />
              <Tooltip contentStyle={{ backgroundColor: "#1C1917", border: "1px solid #44403C", borderRadius: "8px", fontSize: "12px", color: "#FAFAF9" }} />
              <Bar dataKey="durationHours" fill="#818CF8" radius={[4, 4, 0, 0]} name="Sleep (hrs)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Methodology note */}
      {compositeScores && (
        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Scoring Methodology</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-text-muted leading-relaxed">
            <div>
              <span className="text-text-secondary font-medium">Recovery</span>: WHOOP recovery (40%), HRV coefficient of variation over 7 days (20%, Plews et al. 2013), resting HR deviation from baseline (20%, Buchheit 2014), sleep quality (20%, Watson et al. 2017).
            </div>
            <div>
              <span className="text-text-secondary font-medium">Sleep</span>: WHOOP performance (30%), duration adequacy per AASM 7-9h guidelines (30%), sleep efficiency (20%, Ohayon et al. 2017), bedtime consistency (20%, Phillips et al. 2017).
            </div>
            <div>
              <span className="text-text-secondary font-medium">Strain</span>: Normalized WHOOP strain (50%), acute:chronic workload ratio sweet spot 0.8-1.3 (25%, Gabbett 2016), recovery-adjusted training load (25%, Halson 2014).
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!latestRecovery && !latestStrain && recovery.length === 0 && (
        <div className="bg-surface rounded-xl border border-border p-12 shadow-sm text-center">
          <p className="text-text-muted mb-2">No WHOOP data available</p>
          <p className="text-sm text-text-muted">Click &quot;Sync Data&quot; to fetch your latest metrics</p>
        </div>
      )}
    </div>
  );
}
