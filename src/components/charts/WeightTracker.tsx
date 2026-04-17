"use client";

import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { type UnitSystem } from "@/lib/units";

interface WeightDataPoint {
  date: string;
  weightKg: number;
  phase?: "cut" | "bulk" | "maintain" | null;
}

interface WeightTrackerProps {
  data: WeightDataPoint[];
  units: UnitSystem;
}

export default function WeightTracker({ data, units }: WeightTrackerProps) {
  const displayData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: units === "imperial" ? Math.round(d.weightKg * 2.20462 * 10) / 10 : d.weightKg,
    phase: d.phase,
  }));

  // Identify phase regions for background coloring
  const phaseRegions: { start: number; end: number; phase: string }[] = [];
  let currentPhase: string | null = null;
  let regionStart = 0;

  displayData.forEach((d, i) => {
    if (d.phase && d.phase !== currentPhase) {
      if (currentPhase) {
        phaseRegions.push({ start: regionStart, end: i, phase: currentPhase });
      }
      currentPhase = d.phase;
      regionStart = i;
    }
  });
  if (currentPhase) {
    phaseRegions.push({ start: regionStart, end: displayData.length - 1, phase: currentPhase });
  }

  const phaseColors: Record<string, string> = {
    cut: "rgba(239, 68, 68, 0.05)",
    bulk: "rgba(59, 130, 246, 0.05)",
    maintain: "rgba(120, 113, 108, 0.05)",
  };

  // Tight y-axis around the data so small weight swings are visible.
  const weights = displayData.map((d) => d.weight);
  const weightUnit = units === "imperial" ? "lb" : "kg";
  const yDomain: [number | string, number | string] = weights.length > 0
    ? (() => {
        const min = Math.min(...weights);
        const max = Math.max(...weights);
        const span = Math.max(max - min, units === "imperial" ? 4 : 2);
        const pad = Math.max(span * 0.25, units === "imperial" ? 2 : 1);
        return [Math.floor(min - pad), Math.ceil(max + pad)];
      })()
    : ["auto", "auto"];

  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Body Weight</h3>
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/60" /> Cut</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500/60" /> Bulk</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-500/60" /> Maintain</span>
        </div>
      </div>

      {displayData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#44403C" />
            {phaseRegions.map((r, i) => (
              <ReferenceArea
                key={i}
                x1={displayData[r.start]?.date}
                x2={displayData[r.end]?.date}
                fill={phaseColors[r.phase] || "transparent"}
                fillOpacity={1}
              />
            ))}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#A8A29E" }}
              tickLine={false}
              axisLine={{ stroke: "#44403C" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#A8A29E" }}
              tickLine={false}
              axisLine={{ stroke: "#44403C" }}
              domain={yDomain}
              allowDecimals={false}
              unit={` ${weightUnit}`}
              width={65}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1C1917",
                border: "1px solid #44403C",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#FAFAF9",
              }}
              formatter={(value) => [`${value} ${weightUnit}`, "Weight"]}
            />
            <Area
              type="monotone"
              dataKey="weight"
              fill="#86EFAC"
              fillOpacity={0.25}
              stroke="#22C55E"
              strokeWidth={2}
              name={`Weight (${weightUnit})`}
              dot={{ r: 3, fill: "#22C55E", stroke: "#22C55E" }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-text-muted text-sm">
          Log body weight measurements to see trends
        </div>
      )}
    </div>
  );
}
