"use client";

import { useCallback, useState } from "react";

interface SetRowProps {
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe: number | null;
  isWarmup: boolean;
  units: "metric" | "imperial";
  onChange: (data: {
    weightKg: number;
    reps: number;
    rpe: number | null;
    isWarmup: boolean;
  }) => void;
  onRemove: () => void;
}

const KG_TO_LB = 2.20462;

function kgToDisplay(kg: number, units: "metric" | "imperial"): string {
  if (kg === 0) return "";
  if (units === "imperial") {
    const lbs = kg * KG_TO_LB;
    return lbs % 1 === 0 ? lbs.toFixed(0) : lbs.toFixed(1);
  }
  return kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1);
}

function displayToKg(value: number, units: "metric" | "imperial"): number {
  if (units === "imperial") {
    return value / KG_TO_LB;
  }
  return value;
}

export default function SetRow({
  setNumber,
  weightKg,
  reps,
  rpe,
  isWarmup,
  units,
  onChange,
  onRemove,
}: SetRowProps) {
  const weightLabel = units === "imperial" ? "lbs" : "kg";

  // Use local state for weight input so user can type freely
  const [weightInput, setWeightInput] = useState(kgToDisplay(weightKg, units));

  const handleWeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawText = e.target.value;
      setWeightInput(rawText);
      const parsed = parseFloat(rawText);
      if (!isNaN(parsed)) {
        onChange({ weightKg: displayToKg(parsed, units), reps, rpe, isWarmup });
      } else if (rawText === "") {
        onChange({ weightKg: 0, reps, rpe, isWarmup });
      }
    },
    [units, reps, rpe, isWarmup, onChange]
  );

  const handleWeightBlur = useCallback(() => {
    // On blur, format the display value
    setWeightInput(kgToDisplay(weightKg, units));
  }, [weightKg, units]);

  const handleRepsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10) || 0;
      onChange({ weightKg, reps: value, rpe, isWarmup });
    },
    [weightKg, rpe, isWarmup, onChange]
  );

  const handleRpeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        onChange({ weightKg, reps, rpe: null, isWarmup });
        return;
      }
      const value = Math.min(10, Math.max(1, parseInt(raw, 10) || 1));
      onChange({ weightKg, reps, rpe: value, isWarmup });
    },
    [weightKg, reps, isWarmup, onChange]
  );

  const handleWarmupChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ weightKg, reps, rpe, isWarmup: e.target.checked });
    },
    [weightKg, reps, rpe, onChange]
  );

  return (
    <div className="flex items-center gap-2 py-1.5">
      {/* Set number */}
      <span className="w-7 shrink-0 text-center text-xs font-medium text-text-muted">
        {isWarmup ? "W" : setNumber}
      </span>

      {/* Weight input */}
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          inputMode="decimal"
          value={weightInput}
          onChange={handleWeightChange}
          onBlur={handleWeightBlur}
          className="block w-full rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 pr-9 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
          placeholder="0"
          aria-label={`Weight (${weightLabel})`}
        />
        <span className="absolute inset-y-0 right-2.5 flex items-center text-xs text-text-muted pointer-events-none">
          {weightLabel}
        </span>
      </div>

      {/* Reps input */}
      <div className="relative w-16 shrink-0">
        <input
          type="number"
          min={0}
          value={reps || ""}
          onChange={handleRepsChange}
          className="block w-full rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
          placeholder="Reps"
          aria-label="Reps"
        />
      </div>

      {/* RPE input */}
      <div className="relative w-16 shrink-0">
        <input
          type="number"
          min={1}
          max={10}
          value={rpe ?? ""}
          onChange={handleRpeChange}
          className="block w-full rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
          placeholder="RPE"
          aria-label="RPE (1-10)"
        />
      </div>

      {/* Warmup checkbox */}
      <label className="flex items-center gap-1 shrink-0 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isWarmup}
          onChange={handleWarmupChange}
          className="h-3.5 w-3.5 rounded border-border text-green-500 focus:ring-green-500/20 cursor-pointer"
        />
        <span className="text-xs text-text-muted">W</span>
      </label>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-md p-1 text-text-muted hover:text-red-500 hover:bg-red-900/30 transition-colors"
        aria-label="Remove set"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
