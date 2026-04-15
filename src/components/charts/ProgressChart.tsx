"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatWeight, type UnitSystem } from "@/lib/units";

interface DataPoint {
  date: string;
  value: number; // e1RM in kg
}

interface ProgressChartProps {
  data: DataPoint[];
  units: UnitSystem;
  title?: string;
  color?: string;
}

const TIME_WINDOWS = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "All", days: 9999 },
];

export default function ProgressChart({
  data,
  units,
  title = "Estimated 1RM Progress",
  color = "#22C55E",
}: ProgressChartProps) {
  const [window, setWindow] = useState(90);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - window);

  const filtered = window === 9999
    ? data
    : data.filter((d) => new Date(d.date) >= cutoff);

  const displayData = filtered.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: units === "imperial" ? Math.round(d.value * 2.20462) : d.value,
  }));

  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <div className="flex gap-1 bg-surface-raised rounded-lg p-0.5">
          {TIME_WINDOWS.map((w) => (
            <button
              key={w.label}
              onClick={() => setWindow(w.days)}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                window === w.days
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {displayData.length > 0 ? (
        <ResponsiveContainer width="100%" height={240} minWidth={0}>
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#44403C" />
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
              unit={units === "imperial" ? " lb" : " kg"}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1C1917",
                border: "1px solid #44403C",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#FAFAF9",
              }}
              formatter={(value: unknown) => [
                formatWeight(units === "imperial" ? (value as number) / 2.20462 : (value as number), units),
                "e1RM",
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[240px] flex items-center justify-center text-text-muted text-sm">
          No data available for this time period
        </div>
      )}
    </div>
  );
}
