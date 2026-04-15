"use client";

import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
} from "recharts";
import { formatWeight, type UnitSystem } from "@/lib/units";

interface WeightDataPoint {
  date: string;
  weightKg: number;
  weeklyVolume?: number;
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
    volume: d.weeklyVolume ? Math.round(d.weeklyVolume / 1000) : undefined,
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

  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Body Weight & Training Volume</h3>

      {displayData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300} minWidth={0}>
          <ComposedChart data={displayData}>
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
              yAxisId="weight"
              tick={{ fontSize: 11, fill: "#A8A29E" }}
              tickLine={false}
              axisLine={{ stroke: "#44403C" }}
              unit={units === "imperial" ? " lb" : " kg"}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={{ fontSize: 11, fill: "#A8A29E" }}
              tickLine={false}
              axisLine={{ stroke: "#44403C" }}
              unit="k"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1C1917",
                border: "1px solid #44403C",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#FAFAF9",
              }}
            />
            <Legend />
            <Area
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              fill="#86EFAC"
              fillOpacity={0.3}
              stroke="#22C55E"
              strokeWidth={2}
              name={`Weight (${units === "imperial" ? "lb" : "kg"})`}
            />
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="#D4D4D8"
              fillOpacity={0.5}
              radius={[2, 2, 0, 0]}
              name="Volume (thousands)"
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
