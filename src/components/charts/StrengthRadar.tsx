"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarDataPoint {
  muscle: string;
  score: number;
}

interface StrengthRadarProps {
  data: RadarDataPoint[];
  title?: string;
}

export default function StrengthRadar({
  data,
  title = "Muscle Balance",
}: StrengthRadarProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{title}</h3>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#44403C" />
            <PolarAngleAxis
              dataKey="muscle"
              tick={{ fontSize: 10, fill: "#78716C" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#A8A29E" }}
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
            <Radar
              name="Development Score"
              dataKey="score"
              stroke="#22C55E"
              fill="#22C55E"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-text-muted text-sm">
          Log workouts to see your muscle balance
        </div>
      )}
    </div>
  );
}
