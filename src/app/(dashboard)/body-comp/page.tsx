"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  formatWeight,
  parseWeightInput,
  weightLabel,
  type UnitSystem,
} from "@/lib/units";
import { ACTIVITY_LABELS, type ActivityLevel } from "@/lib/nutrition";
import WeightTracker from "@/components/charts/WeightTracker";

interface Measurement {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct: number | null;
  phase: string | null;
  notes: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

export default function BodyCompPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [units, setUnits] = useState<UnitSystem>("imperial");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [targets, setTargets] = useState<{
    bmr: number; tdee: number; targetCalories: number; deficit: number;
    proteinG: number; fatG: number; carbsG: number;
    proteinPct: number; fatPct: number; carbsPct: number;
    phase: string; weightKg: number; ageYears: number;
  } | null>(null);
  const [targetsError, setTargetsError] = useState<string | null>(null);

  // Form state
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [phase, setPhase] = useState<"cut" | "bulk" | "maintain">("maintain");
  const [notes, setNotes] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const fetchTargets = useCallback(async (activity: ActivityLevel) => {
    try {
      const res = await fetch(`/api/nutrition/targets?activity=${activity}`);
      const data = await res.json();
      if (res.ok) { setTargets(data); setTargetsError(null); }
      else { setTargetsError(data.error); setTargets(null); }
    } catch { setTargetsError("Failed to load targets"); }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [measRes, settingsRes] = await Promise.all([
        fetch("/api/body-measurements?limit=100"),
        fetch("/api/settings"),
      ]);
      if (measRes.ok) setMeasurements(await measRes.json());
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setUnits(settings.preferredUnits || "imperial");
      }
      await fetchTargets(activityLevel);
    } finally {
      setLoading(false);
    }
  }, [fetchTargets, activityLevel]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);
    setSuccessMsg(null);
    try {
      const weightKg = parseWeightInput(parseFloat(weight), units);
      const res = await fetch("/api/body-measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg,
          bodyFatPct: bodyFat ? parseFloat(bodyFat) : undefined,
          phase,
          notes: notes || undefined,
          calories: calories ? parseInt(calories) : undefined,
          proteinG: protein ? parseFloat(protein) : undefined,
          carbsG: carbs ? parseFloat(carbs) : undefined,
          fatG: fat ? parseFloat(fat) : undefined,
        }),
      });
      if (res.ok) {
        setWeight(""); setBodyFat(""); setNotes("");
        setCalories(""); setProtein(""); setCarbs(""); setFat("");
        setSuccessMsg("Measurement logged!");
        await fetchData();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this measurement?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/body-measurements/${id}`, { method: "DELETE" });
      if (res.ok) setMeasurements((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCsvImport = async (csvText: string) => {
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await fetch("/api/body-measurements/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportMsg(`Imported ${data.imported} entries (${data.skipped} skipped)`);
        await fetchData();
      } else {
        setImportMsg(data.error || "Import failed");
      }
    } catch {
      setImportMsg("Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) handleCsvImport(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Chart data: reverse so oldest first
  const chartData = [...measurements].reverse().map((m) => ({
    date: m.date,
    weightKg: m.weightKg,
    phase: m.phase as "cut" | "bulk" | "maintain" | null,
  }));

  // Calorie summary for the week
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekMeasurements = measurements.filter((m) => new Date(m.date) >= weekAgo && m.calories != null);
  const avgCalories = weekMeasurements.length > 0
    ? Math.round(weekMeasurements.reduce((sum, m) => sum + (m.calories ?? 0), 0) / weekMeasurements.length)
    : null;
  const avgProtein = weekMeasurements.length > 0
    ? Math.round(weekMeasurements.reduce((sum, m) => sum + (m.proteinG ?? 0), 0) / weekMeasurements.length)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Body Composition</h1>
        <button
          onClick={() => setShowImport(!showImport)}
          className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import CSV
        </button>
      </div>

      {/* Cronometer CSV Import */}
      {showImport && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text-primary mb-2">Import from Cronometer</h2>
          <p className="text-xs text-text-muted mb-4">
            Export your daily nutrition from Cronometer (More &rarr; Export Data &rarr; Daily Nutrition), then upload the CSV file. Columns: Date, Energy (kcal), Protein (g), Carbs (g), Fat (g).
          </p>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              {importing ? "Importing..." : "Upload CSV"}
            </button>
            {importMsg && (
              <span className={`text-sm ${importMsg.includes("Imported") ? "text-green-600" : "text-red-500"}`}>
                {importMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Weekly Nutrition Summary */}
      {avgCalories != null && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface rounded-xl border border-border p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-text-primary">{avgCalories}</p>
            <p className="text-xs text-text-muted">Avg Daily Calories</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-text-primary">{avgProtein}g</p>
            <p className="text-xs text-text-muted">Avg Daily Protein</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-text-primary">
              {weekMeasurements.length > 0
                ? Math.round(weekMeasurements.reduce((s, m) => s + (m.carbsG ?? 0), 0) / weekMeasurements.length)
                : "--"}g
            </p>
            <p className="text-xs text-text-muted">Avg Daily Carbs</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-text-primary">
              {weekMeasurements.length > 0
                ? Math.round(weekMeasurements.reduce((s, m) => s + (m.fatG ?? 0), 0) / weekMeasurements.length)
                : "--"}g
            </p>
            <p className="text-xs text-text-muted">Avg Daily Fat</p>
          </div>
        </div>
      )}

      {/* Daily Nutrition Targets */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Daily Nutrition Targets</h2>
          <select
            value={activityLevel}
            onChange={(e) => {
              const val = e.target.value as ActivityLevel;
              setActivityLevel(val);
              fetchTargets(val);
            }}
            className="rounded-lg border border-border px-2 py-1 text-xs text-text-primary focus:border-green-500 focus:outline-none"
          >
            {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {targetsError ? (
          <p className="text-sm text-text-muted text-center py-4">{targetsError}</p>
        ) : targets ? (
          <div className="space-y-4">
            {/* Calorie summary row */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-surface-raised">
                <p className="text-xs text-text-muted">BMR</p>
                <p className="text-lg font-bold text-text-primary">{targets.bmr}</p>
                <p className="text-[10px] text-text-muted">kcal/day</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-raised">
                <p className="text-xs text-text-muted">Maintenance</p>
                <p className="text-lg font-bold text-green-500">{targets.tdee}</p>
                <p className="text-[10px] text-text-muted">kcal/day</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-raised">
                <p className="text-xs text-text-muted">Target ({targets.phase})</p>
                <p className="text-lg font-bold" style={{ color: targets.deficit < 0 ? "#EF4444" : targets.deficit > 0 ? "#3B82F6" : "#22C55E" }}>
                  {targets.targetCalories}
                </p>
                <p className="text-[10px]" style={{ color: targets.deficit < 0 ? "#EF4444" : targets.deficit > 0 ? "#3B82F6" : "#A8A29E" }}>
                  {targets.deficit < 0 ? `${targets.deficit} deficit` : targets.deficit > 0 ? `+${targets.deficit} surplus` : "maintenance"}
                </p>
              </div>
            </div>

            {/* Macro targets */}
            <div>
              <p className="text-xs font-medium text-text-muted mb-2">Recommended Daily Macros</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised">
                  <div className="w-2 h-10 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-lg font-bold text-text-primary">{targets.proteinG}g</p>
                    <p className="text-[10px] text-text-muted">Protein ({targets.proteinPct}%)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised">
                  <div className="w-2 h-10 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-lg font-bold text-text-primary">{targets.carbsG}g</p>
                    <p className="text-[10px] text-text-muted">Carbs ({targets.carbsPct}%)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised">
                  <div className="w-2 h-10 rounded-full bg-rose-500" />
                  <div>
                    <p className="text-lg font-bold text-text-primary">{targets.fatG}g</p>
                    <p className="text-[10px] text-text-muted">Fat ({targets.fatPct}%)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's intake vs target */}
            {(() => {
              const today = measurements.find((m) => {
                const d = new Date(m.date);
                const now = new Date();
                return d.toDateString() === now.toDateString();
              });
              if (!today?.calories) return null;
              const calDiff = today.calories - targets.targetCalories;
              const protDiff = (today.proteinG ?? 0) - targets.proteinG;
              return (
                <div>
                  <p className="text-xs font-medium text-text-muted mb-2">Today&apos;s Intake vs Target</p>
                  <div className="space-y-2">
                    {[
                      { label: "Calories", actual: today.calories, target: targets.targetCalories, unit: "kcal", diff: calDiff },
                      { label: "Protein", actual: today.proteinG ?? 0, target: targets.proteinG, unit: "g", diff: protDiff },
                      { label: "Carbs", actual: today.carbsG ?? 0, target: targets.carbsG, unit: "g", diff: (today.carbsG ?? 0) - targets.carbsG },
                      { label: "Fat", actual: today.fatG ?? 0, target: targets.fatG, unit: "g", diff: (today.fatG ?? 0) - targets.fatG },
                    ].map(({ label, actual, target, unit, diff }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="w-16 text-xs text-text-muted">{label}</span>
                        <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (actual / target) * 100)}%`,
                              backgroundColor: Math.abs(diff) / target < 0.1 ? "#22C55E" : diff > 0 ? "#F59E0B" : "#3B82F6",
                            }}
                          />
                        </div>
                        <span className="w-20 text-xs text-right text-text-secondary">{actual} / {target}{unit}</span>
                        <span className={`w-12 text-xs text-right font-medium ${diff > 0 ? "text-amber-500" : diff < 0 ? "text-blue-400" : "text-green-500"}`}>
                          {diff > 0 ? "+" : ""}{Math.round(diff)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <p className="text-[10px] text-text-muted">
              Based on Mifflin-St Jeor (BMR), protein per Helms et al. 2014 &amp; Morton et al. 2018.
              Fat minimum per Volek et al. 2006. Deficit/surplus per Garthe et al. 2011 &amp; Ribeiro et al. 2022.
            </p>
          </div>
        ) : null}
      </div>

      {/* Log Measurement Form */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Log Measurement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Weight ({weightLabel(units)}) *
              </label>
              <input
                type="number" step="0.1" value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={units === "imperial" ? "185.0" : "84.0"}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Body Fat %</label>
              <input
                type="number" step="0.1" min="1" max="60" value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)} placeholder="15.0"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Phase</label>
              <select
                value={phase} onChange={(e) => setPhase(e.target.value as "cut" | "bulk" | "maintain")}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="maintain">Maintain</option>
                <option value="cut">Cut</option>
                <option value="bulk">Bulk</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
              <input
                type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Morning, fasted..."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Nutrition Fields */}
          <div>
            <p className="text-xs font-medium text-text-muted mb-2">Nutrition (or import from Cronometer CSV)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Calories</label>
                <input
                  type="number" value={calories} onChange={(e) => setCalories(e.target.value)}
                  placeholder="2200"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Protein (g)</label>
                <input
                  type="number" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)}
                  placeholder="180"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Carbs (g)</label>
                <input
                  type="number" step="0.1" value={carbs} onChange={(e) => setCarbs(e.target.value)}
                  placeholder="250"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Fat (g)</label>
                <input
                  type="number" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)}
                  placeholder="70"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit" disabled={saving || !weight}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              {saving ? "Saving..." : "Log Measurement"}
            </button>
            {successMsg && <span className="text-sm text-green-600">{successMsg}</span>}
          </div>
        </form>
      </div>

      {/* Weight Tracker Chart */}
      <WeightTracker data={chartData} units={units} />

      {/* Recent Measurements Table */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Recent Measurements</h2>
        {measurements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-medium text-text-muted">Date</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-muted">Weight</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-muted">BF%</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-muted">Cal</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-muted">P / C / F</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-muted">Phase</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-muted">Notes</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {measurements.map((m) => (
                  <tr key={m.id} className="border-b border-border-subtle last:border-0">
                    <td className="py-2 pr-3 text-text-secondary whitespace-nowrap">
                      {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="py-2 pr-3 text-text-primary font-medium">{formatWeight(m.weightKg, units)}</td>
                    <td className="py-2 pr-3 text-text-secondary">{m.bodyFatPct != null ? `${m.bodyFatPct}%` : "--"}</td>
                    <td className="py-2 pr-3 text-text-secondary">{m.calories ?? "--"}</td>
                    <td className="py-2 pr-3 text-text-secondary text-xs">
                      {m.proteinG != null || m.carbsG != null || m.fatG != null
                        ? `${m.proteinG ?? 0}g / ${m.carbsG ?? 0}g / ${m.fatG ?? 0}g`
                        : "--"}
                    </td>
                    <td className="py-2 pr-3">
                      {m.phase ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.phase === "cut" ? "bg-red-100 text-red-700"
                            : m.phase === "bulk" ? "bg-blue-100 text-blue-700"
                            : "bg-surface-raised text-text-secondary"
                        }`}>
                          {m.phase.charAt(0).toUpperCase() + m.phase.slice(1)}
                        </span>
                      ) : "--"}
                    </td>
                    <td className="py-2 pr-3 text-text-muted text-xs max-w-[120px] truncate">{m.notes || "--"}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        className="p-1 rounded-md text-text-muted hover:text-red-500 hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        title="Delete measurement"
                      >
                        {deletingId === m.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-8">
            No measurements logged yet. Use the form above to get started.
          </p>
        )}
      </div>
    </div>
  );
}
