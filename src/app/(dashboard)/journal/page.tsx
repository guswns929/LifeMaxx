"use client";

import { useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
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

interface JournalDetailEntry {
  date: string;
  overallScore: number;
  analysis: DailyAnalysis;
  recommendations: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(iso: string): string {
  // Handle both YYYY-MM-DD and ISO strings safely
  const parts = iso.split("T")[0].split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#EAB308";
  if (score >= 40) return "#F97316";
  return "#EF4444";
}

function scoreTextClass(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function statusBadge(status: string): string {
  switch (status) {
    case "optimal": return "bg-green-500/15 border-green-500/30 text-green-400";
    case "good": return "bg-blue-500/15 border-blue-500/30 text-blue-400";
    case "warning": return "bg-yellow-500/15 border-yellow-500/30 text-yellow-400";
    case "critical": return "bg-red-500/15 border-red-500/30 text-red-400";
    default: return "bg-surface-raised border-border text-text-secondary";
  }
}

function statusDot(status: string): string {
  switch (status) {
    case "optimal": return "bg-green-500";
    case "good": return "bg-blue-500";
    case "warning": return "bg-yellow-500";
    case "critical": return "bg-red-500";
    default: return "bg-text-muted";
  }
}

/* ------------------------------------------------------------------ */
/*  Score Ring                                                         */
/* ------------------------------------------------------------------ */
function ScoreRing({ score, size = 64, label, onClick }: { score: number; size?: number; label: string; onClick?: () => void }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group cursor-pointer hover:scale-105 transition-transform relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-surface-raised" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-sm font-bold text-text-primary">{score}</span>
      </div>
      <span className="text-[10px] text-text-muted font-medium group-hover:text-text-secondary transition-colors">{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Score Detail Modal                                                 */
/* ------------------------------------------------------------------ */
function ScoreDetailModal({ scoreExplanation, onClose }: { scoreExplanation: ScoreExplanation; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-xl border border-border shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{scoreExplanation.label}</h3>
            <span className={`text-2xl font-bold ${scoreTextClass(scoreExplanation.score)}`}>{scoreExplanation.score}<span className="text-sm text-text-muted">/100</span></span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-3">
          {scoreExplanation.factors.map((f, i) => (
            <div key={i} className="bg-surface-raised rounded-lg p-3 border border-border-subtle">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-text-secondary">{f.name}</span>
                <span className={`text-sm font-bold ${scoreTextClass((f.value / f.maxValue) * 100)}`}>
                  {f.value}/{f.maxValue}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-1.5 mb-2">
                <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${(f.value / f.maxValue) * 100}%`, backgroundColor: scoreColor((f.value / f.maxValue) * 100) }} />
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{f.detail}</p>
            </div>
          ))}
          {scoreExplanation.factors.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">No data available. Log more data to see detailed scoring.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MPS Modal                                                          */
/* ------------------------------------------------------------------ */
function MpsModal({ mps, onClose }: { mps: { score: number; explanation: string }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-xl border border-border shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">MPS Score: <span className={scoreTextClass(mps.score)}>{mps.score}</span>/100</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">{mps.explanation}</p>

        {/* MPS thresholds */}
        <div className="space-y-2 mb-4">
          {[
            { threshold: "≥ 2.2 g/kg", score: "100", label: "Maximized MPS", color: "text-green-400" },
            { threshold: "≥ 1.6 g/kg", score: "80", label: "MPS saturated", color: "text-yellow-400" },
            { threshold: "≥ 1.2 g/kg", score: "55", label: "Below optimal", color: "text-orange-400" },
            { threshold: "< 1.2 g/kg", score: "25", label: "Critically low", color: "text-red-400" },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-surface-raised text-xs">
              <span className="text-text-muted font-mono">{t.threshold}</span>
              <span className={`font-bold ${t.color}`}>{t.score}</span>
              <span className="text-text-secondary">{t.label}</span>
            </div>
          ))}
        </div>

        <div className="bg-background rounded-lg p-3 text-xs text-text-muted border border-border-subtle">
          <p className="font-medium text-text-secondary mb-1">What is MPS?</p>
          <p>Muscle Protein Synthesis (MPS) is the process of building new muscle tissue. It is primarily stimulated by resistance training and adequate protein intake (especially leucine-rich sources). The MPS response is maximized at ~1.6g/kg/day protein intake (Morton et al., 2018) and can last 24-72h after training.</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Phase Alignment Modal                                              */
/* ------------------------------------------------------------------ */
function PhaseAlignmentModal({ pa, onClose }: { pa: { aligned: boolean; explanation: string }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-xl border border-border shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Phase Alignment</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${pa.aligned ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${pa.aligned ? "bg-green-500" : "bg-red-500"}`} />
          {pa.aligned ? "On Track" : "Off Track"}
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">{pa.explanation}</p>
        <div className="bg-background rounded-lg p-3 text-xs text-text-muted border border-border-subtle">
          <p className="font-medium text-text-secondary mb-1">What is Phase Alignment?</p>
          <p>Phase alignment checks whether your weight trend matches your declared training phase. In a cut, you should be losing 0.3-1.0% bodyweight per week. In a bulk, gaining 0.15-0.5% per week. Misalignment usually means your calorie intake needs adjustment.</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trend Explanation Modal                                            */
/* ------------------------------------------------------------------ */
function TrendExplanationModal({ trendScore, onClose }: { trendScore: ScoreExplanation; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-xl border border-border shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Trend Analysis</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          The trend score evaluates your 14-day patterns across weight change, calorie consistency, training frequency, and sleep quality.
          It helps detect issues like metabolic adaptation (extended cutting), training inconsistency, or chronic sleep debt before they stall progress.
        </p>
        <div className="space-y-2 mb-4">
          {trendScore.factors.map((f, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-raised text-sm border border-border-subtle">
              <span className="text-text-secondary">{f.name}</span>
              <span className={`font-bold ${scoreTextClass((f.value / f.maxValue) * 100)}`}>{f.value}/{f.maxValue}</span>
            </div>
          ))}
        </div>
        <div className="bg-background rounded-lg p-3 text-xs text-text-muted border border-border-subtle">
          <p className="font-medium text-text-secondary mb-1">Research basis</p>
          <p>Weight trend targets based on Helms et al., 2014 (cut: -0.5-1% BW/wk) and Iraki et al., 2019 (bulk: +0.25-0.5% BW/wk). Metabolic adaptation warning after 84+ days in a deficit (Trexler et al., 2014).</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Full Analysis View (reusable for today + history detail)           */
/* ------------------------------------------------------------------ */
function AnalysisView({
  analysis,
  dateLabel,
  onScoreClick,
  onMpsClick,
  onPhaseClick,
  onTrendClick,
}: {
  analysis: DailyAnalysis;
  dateLabel: string;
  onScoreClick: (s: ScoreExplanation) => void;
  onMpsClick: () => void;
  onPhaseClick: () => void;
  onTrendClick: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredVerdicts = selectedCategory
    ? analysis.verdicts.filter((v) => v.category === selectedCategory)
    : analysis.verdicts;

  return (
    <div className="space-y-5">
      {/* Score Overview */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{dateLabel}</h2>
            <p className="text-xs text-text-muted mt-0.5">Click any score for a detailed breakdown</p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-bold ${scoreTextClass(analysis.overallScore)}`}>{analysis.overallScore}</span>
            <span className="text-sm text-text-muted">/100</span>
          </div>
        </div>

        {/* Score Rings */}
        <div className="flex justify-around items-start relative">
          <ScoreRing score={analysis.nutritionScore.score} label="Nutrition" onClick={() => onScoreClick(analysis.nutritionScore)} />
          <ScoreRing score={analysis.trainingScore.score} label="Training" onClick={() => onScoreClick(analysis.trainingScore)} />
          <ScoreRing score={analysis.recoveryScore.score} label="Recovery" onClick={() => onScoreClick(analysis.recoveryScore)} />
          <ScoreRing score={analysis.trendScore.score} label="Trends" onClick={onTrendClick} />
        </div>

        {/* MPS + Phase badges */}
        <div className="flex justify-center gap-3 mt-5">
          <button onClick={onMpsClick} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:brightness-110 ${
            analysis.mpsScore.score >= 80 ? "bg-green-500/15 border-green-500/30 text-green-400" :
            analysis.mpsScore.score >= 60 ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400" :
            "bg-red-500/15 border-red-500/30 text-red-400"
          }`}>
            MPS: {analysis.mpsScore.score}
          </button>
          <button onClick={onPhaseClick} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:brightness-110 ${
            analysis.phaseAlignment.aligned ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-red-500/15 border-red-500/30 text-red-400"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${analysis.phaseAlignment.aligned ? "bg-green-500" : "bg-red-500"}`} />
            Phase {analysis.phaseAlignment.aligned ? "Aligned" : "Misaligned"}
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Daily Recommendations</h2>
          <div className="space-y-2.5">
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2.5 py-1.5">
                <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verdicts / Analysis */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Detailed Analysis</h2>
          <div className="flex gap-1">
            {["nutrition", "training", "recovery", "trend"].map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === cat ? "bg-accent text-white" : "bg-surface-raised text-text-muted hover:text-text-secondary"
                }`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredVerdicts.length > 0 ? (
          <div className="space-y-3">
            {filteredVerdicts.map((v, i) => (
              <div key={i} className={`border rounded-lg p-4 ${statusBadge(v.status)}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${statusDot(v.status)}`} />
                  <span className="text-sm font-semibold">{v.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 uppercase font-medium">{v.category}</span>
                </div>
                <p className="text-xs leading-relaxed mt-1 opacity-90">{v.explanation}</p>
                {v.evidence && (
                  <p className="text-[10px] mt-2 opacity-60 italic">Ref: {v.evidence}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-6">
            {analysis.verdicts.length === 0 ? "All metrics look good! No issues detected." : "No issues in this category."}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function JournalPage() {
  const [analysis, setAnalysis] = useState<DailyAnalysis | null>(null);
  const [history, setHistory] = useState<JournalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailAnalysis, setDetailAnalysis] = useState<DailyAnalysis | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [showScoreDetail, setShowScoreDetail] = useState<ScoreExplanation | null>(null);
  const [showMps, setShowMps] = useState(false);
  const [showPhaseAlignment, setShowPhaseAlignment] = useState(false);
  const [showTrend, setShowTrend] = useState(false);

  // Fetch history + check if today has been compiled
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/daily-log");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);

        // Check if today already has an entry
        const today = todayLocal();
        const todayEntry = data.find((e: JournalHistoryEntry) => e.date.startsWith(today));
        if (todayEntry) {
          // Fetch the full analysis for today
          const detailRes = await fetch(`/api/daily-log?date=${today}`);
          if (detailRes.ok) {
            const detail: JournalDetailEntry = await detailRes.json();
            setAnalysis(detail.analysis);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Compile today's journal
  const handleCompile = async () => {
    setCompiling(true);
    try {
      const res = await fetch("/api/daily-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayLocal() }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
        // Refresh history
        const histRes = await fetch("/api/daily-log");
        if (histRes.ok) setHistory(await histRes.json());
      }
    } finally {
      setCompiling(false);
    }
  };

  // View a past entry
  const handleViewEntry = async (dateStr: string) => {
    const dateKey = dateStr.split("T")[0];
    setSelectedDate(dateKey);
    setDetailAnalysis(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/daily-log?date=${dateKey}`);
      if (res.ok) {
        const data: JournalDetailEntry = await res.json();
        setDetailAnalysis(data.analysis);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToToday = () => {
    setSelectedDate(null);
    setDetailAnalysis(null);
  };

  // Determine the active analysis and current MPS source
  const activeAnalysis = selectedDate ? detailAnalysis : analysis;
  const activeMps = activeAnalysis?.mpsScore ?? { score: 0, explanation: "No data available" };
  const activePhase = activeAnalysis?.phaseAlignment ?? { aligned: true, explanation: "No data available" };
  const activeTrend = activeAnalysis?.trendScore ?? { score: 0, label: "Trends", factors: [] };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {selectedDate ? "Journal Entry" : "Daily Journal"}
          </h1>
          {selectedDate && (
            <button onClick={handleBackToToday} className="text-sm text-accent hover:text-accent-light transition-colors mt-0.5 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              Back to today
            </button>
          )}
        </div>
        {!selectedDate && (
          <button
            onClick={handleCompile}
            disabled={compiling}
            className="bg-accent hover:bg-accent-dark disabled:opacity-50 text-white font-medium py-2 px-5 rounded-lg transition-colors text-sm flex items-center gap-2"
          >
            {compiling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Compiling...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                Compile Journal
              </>
            )}
          </button>
        )}
      </div>

      {/* Viewing a past entry */}
      {selectedDate && (
        detailLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
          </div>
        ) : detailAnalysis ? (
          <AnalysisView
            analysis={detailAnalysis}
            dateLabel={formatDateLabel(selectedDate)}
            onScoreClick={setShowScoreDetail}
            onMpsClick={() => setShowMps(true)}
            onPhaseClick={() => setShowPhaseAlignment(true)}
            onTrendClick={() => setShowTrend(true)}
          />
        ) : (
          <div className="bg-surface rounded-xl border border-border p-8 text-center">
            <p className="text-text-muted">No detailed analysis stored for this date.</p>
          </div>
        )
      )}

      {/* Today's view */}
      {!selectedDate && (
        analysis ? (
          <AnalysisView
            analysis={analysis}
            dateLabel="Today's Performance"
            onScoreClick={setShowScoreDetail}
            onMpsClick={() => setShowMps(true)}
            onPhaseClick={() => setShowPhaseAlignment(true)}
            onTrendClick={() => setShowTrend(true)}
          />
        ) : (
          <div className="bg-surface rounded-xl border border-border p-12 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="text-lg font-medium text-text-primary mb-2">Ready to compile</p>
            <p className="text-sm text-text-muted max-w-sm mx-auto mb-5">
              Click &quot;Compile Journal&quot; to generate your end-of-day analysis based on today&apos;s workouts, nutrition, and recovery data.
            </p>
            <button onClick={handleCompile} disabled={compiling}
              className="bg-accent hover:bg-accent-dark disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm">
              {compiling ? "Compiling..." : "Compile Journal"}
            </button>
          </div>
        )
      )}

      {/* Journal History */}
      {!selectedDate && history.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Entries</h2>
          <div className="space-y-1">
            {history.slice(0, 14).map((entry, i) => {
              const isToday = entry.date.startsWith(todayLocal());
              return (
                <button
                  key={i}
                  onClick={() => !isToday && handleViewEntry(entry.date)}
                  className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg border transition-colors ${
                    isToday
                      ? "border-accent/30 bg-accent/5 cursor-default"
                      : "border-border-subtle hover:bg-surface-raised hover:border-border cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-secondary">
                      {formatDateLabel(entry.date)}
                    </span>
                    {isToday && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium">Today</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.nutritionScore != null && (
                      <span className="text-xs text-text-muted">N:<span className={scoreTextClass(entry.nutritionScore)}>{entry.nutritionScore}</span></span>
                    )}
                    {entry.trainingScore != null && (
                      <span className="text-xs text-text-muted">T:<span className={scoreTextClass(entry.trainingScore)}>{entry.trainingScore}</span></span>
                    )}
                    {entry.recoveryScore != null && (
                      <span className="text-xs text-text-muted">R:<span className={scoreTextClass(entry.recoveryScore)}>{entry.recoveryScore}</span></span>
                    )}
                    {entry.trendScore != null && (
                      <span className="text-xs text-text-muted">Tr:<span className={scoreTextClass(entry.trendScore)}>{entry.trendScore}</span></span>
                    )}
                    <span className={`text-sm font-bold ${scoreTextClass(entry.overallScore)}`}>
                      {entry.overallScore}
                    </span>
                    {!isToday && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><path d="M9 18l6-6-6-6" /></svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showScoreDetail && <ScoreDetailModal scoreExplanation={showScoreDetail} onClose={() => setShowScoreDetail(null)} />}
      {showMps && activeAnalysis && <MpsModal mps={activeMps} onClose={() => setShowMps(false)} />}
      {showPhaseAlignment && activeAnalysis && <PhaseAlignmentModal pa={activePhase} onClose={() => setShowPhaseAlignment(false)} />}
      {showTrend && activeAnalysis && <TrendExplanationModal trendScore={activeTrend} onClose={() => setShowTrend(false)} />}
    </div>
  );
}
