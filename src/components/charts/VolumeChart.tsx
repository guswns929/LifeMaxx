"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VolumeDataPoint {
  week: string;
  volume: number;
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
  title?: string;
}

export default function VolumeChart({
  data,
  title = "Weekly Training Volume",
}: VolumeChartProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{title}</h3>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#44403C" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "#A8A29E" }}
              tickLine={false}
              axisLine={{ stroke: "#44403C" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#A8A29E" }}
              tickLine={false}
              axisLine={{ stroke: "#44403C" }}
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
                `${Math.round(value as number).toLocaleString()}`,
                "Volume (kg)",
              ]}
            />
            <Bar dataKey="volume" fill="#86EFAC" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">
          No volume data yet
        </div>
      )}
    </div>
  );
}
