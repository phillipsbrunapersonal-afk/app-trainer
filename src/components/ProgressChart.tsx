"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Point = { date: string; weight: number; reps: number | null };

export function ProgressChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 20, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
        <XAxis dataKey="date" stroke="#737373" fontSize={11} />
        <YAxis
          yAxisId="weight"
          stroke="#10b981"
          fontSize={11}
          label={{ value: "kg", angle: -90, position: "insideLeft", fill: "#10b981", fontSize: 10 }}
        />
        <YAxis
          yAxisId="reps"
          orientation="right"
          stroke="#38bdf8"
          fontSize={11}
          allowDecimals={false}
          label={{ value: "reps", angle: 90, position: "insideRight", fill: "#38bdf8", fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{
            background: "#171717",
            border: "1px solid #404040",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line
          yAxisId="weight"
          type="monotone"
          dataKey="weight"
          name="Peso (kg)"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
        >
          <LabelList dataKey="weight" position="top" fontSize={10} fill="#10b981" />
        </Line>
        <Line
          yAxisId="reps"
          type="monotone"
          dataKey="reps"
          name="Reps"
          stroke="#38bdf8"
          strokeWidth={2}
          strokeDasharray="4 3"
          dot={{ r: 3 }}
          connectNulls
        >
          <LabelList dataKey="reps" position="bottom" fontSize={10} fill="#38bdf8" />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}
