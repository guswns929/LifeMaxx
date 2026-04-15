"use client";

import { useState, useEffect, useCallback } from "react";

interface ScoreFactor {
  name: string;
  value: number;
  maxValue: number;
  detail: string;
}

interface ScoreExplanation {
  score: number;
  label: string;
  factors: ScoreFactor[];
}

interface Verdict {
  category: string;
  status: "optimal" | "good" | "warning" | "critical";
  title: string;
  explanation: string;
  evidence?: string;
}

interface DailyAnalysis {
  overallScore: number;
  nutritionScore: ScoreExplanation;
  trainingScore: ScoreExplanation;
  recoveryScore: ScoreExplanation;
  trendScore: ScoreExplanation;
  mpsScore: { score: number; explanation: string };
  phaseAlignment: { aligned: boolean; explanation: string };
  verdicts: Verdict[];
  recommendations: string[];
}

interface JournalHistoryEntry {
  date: string;
  overallScore: number;
  nutritionScore: number | null;
  trainingScore: number | null;
  recoveryScore: number | null;
  trendScore: number | null;
}

function ScoreRing({ score, size = 64, label, onClick }: { score: number; size?: number; label: string; onClick?: () => void }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? "#22C55E" : score >= 60 ? "#EAB308" : score >= 40 ? "#F97316" : "#EF4444";

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group cursor-pointer hover:scale-105 transition-transform"
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth="4"
          className="text-stone-200"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-sm font-bold text-stone-900">{score}</span>
      </div>
      <span className="text-[10px] text-stone-500 font-medium group-hover:text-stone-700">{label}</span>
    </button>
  );
}

function ScoreDetailModal({ scoreExplanation, onClose }: { scoreExplanation: ScoreExplanation; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900">{scoreExplanation.label} Score: {scoreExplanation.score}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          {scoreExplanation.factors.map((f, i) => (
            <div key={i} className="border border-stone-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-stone-700">{f.name}</span>
                <span className={`text-sm font-bold ${f.value >= 80 ? "text-green-600" : f.value >= 60 ? "text-yellow-600" : f.value >= 40 ? "text-orange-600" : "text-red-600"}`}>
                  {f.value}/{f.maxValue}
                </span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 mb-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${(f.value / f.maxValue) * 100}%`,
                    backgroundColor: f.value >= 80 ? "#22C55E" : f.value >= 60 ? "#EAB308" : f.value >= 40 ? "#F97316" : "#EF4444",
                  }}
                />
              </div>
              <p className="text-xs text-stone-500">{f.detail}</p>
            </div>
          ))}
          {scoreExplanation.factors.length === 0 && (
            <p className="text-sm text-stone-500 text-center py-4">
              No data available for this category. Log more data to see detailed scoring.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MpsModal({ mps, onClose }: { mps: { score: number; explanation: string }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900">MPS Score: {mps.score}/100</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-stone-600 leading-relaxed mb-3">{mps.explanation}</p>
        <div className="bg-stone-50 rounded-lg p-3 text-xs text-stone-500">
          <p className="font-medium text-stone-600 mb-1">What is MPS?</p>
          <p>Muscle Protein Synthesis (MPS) is the process of building new muscle tissue. It is primarily stimulated by resistance training and adequate protein intake (especially leucine-rich sources). The MPS response is maximized at ~1.6g/kg/day protein intake (Morton et al., 2018) and can last 24-72h after training.</p>
        </div>
      </div>
    </div>
  );
}

function PhaseAlignmentModal({ pa, onClose }: { pa: { aligned: boolean; explanation: string }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900">
            Phase Alignment: {pa.aligned ? "On Track" : "Off Track"}
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${pa.aligned ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${pa.aligned ? "bg-green-500" : "bg-red-500"}`} />
          {pa.aligned ? "Aligned" : "Misaligned"}
        </div>
        <p className="text-sm text-stone-600 leading-relaxed">{pa.explanation}</p>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [analysis, setAnalysis] = useState<DailyAnalysis | null>(null);
  const [history, setHistory] = useState<JournalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScoreDetail, setShowScoreDetail] = useState<ScoreExplanation | null>(null);
  const [showMps, setShowMps] = useState(false);
  const [showPhaseAlignment, setShowPhaseAlignment] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    try {
      const [analysisRes, historyRes] = await Promise.all([
        fetch("/api/daily-log"),
        fetch("/api/daily-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
      ]);
      if (analysisRes.ok) {
        const data = await analysisRes.json();
        setAnalysis(data.analysis);
      }
      if (historyRes.ok) {
        const histData = await historyRes.json();
        setHistory(histData);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-16 text-stone-500">
        <p className="text-lg font-medium mb-2">No data for today</p>
        <p className="text-sm">Log workouts, nutrition, and connect WHOOP to see your daily analysis.</p>
      </div>
    );
  }

  const filteredVerdicts = selectedCategory
    ? analysis.verdicts.filter((v) => v.category === selectedCategory)
    : analysis.verdicts;

  const statusColors = {
    optimal: "bg-green-50 border-green-200 text-green-800",
    good: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    critical: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Daily Journal</h1>

      {/* Score Overview */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-900">Today&apos;s Performance</h2>
          <div className="text-right">
            <span className="text-3xl font-bold text-stone-900">{analysis.overallScore}</span>
            <span className="text-sm text-stone-500">/100</span>
          </div>
        </div>

        {/* Score Rings — click to expand */}
        <div className="flex justify-around items-start relative">
          <ScoreRing score={analysis.nutritionScore.score} label="Nutrition" onClick={() => setShowScoreDetail(analysis.nutritionScore)} />
          <ScoreRing score={analysis.trainingScore.score} label="Training" onClick={() => setShowScoreDetail(analysis.trainingScore)} />
          <ScoreRing score={analysis.recoveryScore.score} label="Recovery" onClick={() => setShowScoreDetail(analysis.recoveryScore)} />
          <ScoreRing score={analysis.trendScore.score} label="Trends" onClick={() => setShowScoreDetail(analysis.trendScore)} />
        </div>
        <p className="text-xs text-stone-400 text-center mt-3">Click any score for details</p>

        {/* MPS and Phase Alignment badges */}
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={() => setShowMps(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:shadow-sm ${
              analysis.mpsScore.score >= 80
                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                : analysis.mpsScore.score >= 60
                ? "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            }`}
          >
            MPS: {analysis.mpsScore.score}
          </button>
          <button
            onClick={() => setShowPhaseAlignment(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:shadow-sm ${
              analysis.phaseAlignment.aligned
                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${analysis.phaseAlignment.aligned ? "bg-green-500" : "bg-red-500"}`} />
            Phase {analysis.phaseAlignment.aligned ? "Aligned" : "Misaligned"}
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Daily Recommendations</h2>
          <div className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2.5 py-1.5">
                <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
                <p className="text-sm text-stone-600">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verdicts */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-900">Analysis</h2>
          <div className="flex gap-1">
            {["nutrition", "training", "recovery", "trend"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredVerdicts.length > 0 ? (
          <div className="space-y-3">
            {filteredVerdicts.map((v, i) => (
              <div key={i} className={`border rounded-lg p-4 ${statusColors[v.status]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    v.status === "optimal" ? "bg-green-500" : v.status === "good" ? "bg-blue-500" : v.status === "warning" ? "bg-yellow-500" : "bg-red-500"
                  }`} />
                  <span className="text-sm font-semibold">{v.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/50 uppercase font-medium">{v.category}</span>
                </div>
                <p className="text-xs leading-relaxed mt-1">{v.explanation}</p>
                {v.evidence && (
                  <p className="text-[10px] mt-2 opacity-70">Ref: {v.evidence}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400 text-center py-6">
            {analysis.verdicts.length === 0
              ? "All metrics look good! No issues detected."
              : "No issues in this category."}
          </p>
        )}
      </div>

      {/* Journal History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Recent Entries</h2>
          <div className="space-y-2">
            {history.slice(0, 7).map((entry, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <span className="text-sm text-stone-600">
                  {new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <div className="flex items-center gap-3">
                  {entry.nutritionScore != null && (
                    <span className="text-xs text-stone-400">N:{entry.nutritionScore}</span>
                  )}
                  {entry.trainingScore != null && (
                    <span className="text-xs text-stone-400">T:{entry.trainingScore}</span>
                  )}
                  {entry.recoveryScore != null && (
                    <span className="text-xs text-stone-400">R:{entry.recoveryScore}</span>
                  )}
                  <span className={`text-sm font-bold ${
                    entry.overallScore >= 80 ? "text-green-600" : entry.overallScore >= 60 ? "text-yellow-600" : entry.overallScore >= 40 ? "text-orange-600" : "text-red-600"
                  }`}>
                    {entry.overallScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Detail Modal */}
      {showScoreDetail && (
        <ScoreDetailModal scoreExplanation={showScoreDetail} onClose={() => setShowScoreDetail(null)} />
      )}
      {showMps && analysis && (
        <MpsModal mps={analysis.mpsScore} onClose={() => setShowMps(false)} />
      )}
      {showPhaseAlignment && analysis && (
        <PhaseAlignmentModal pa={analysis.phaseAlignment} onClose={() => setShowPhaseAlignment(false)} />
      )}
    </div>
  );
}
