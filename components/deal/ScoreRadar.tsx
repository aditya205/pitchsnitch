"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export type ScoreRadarPoint = {
  label: string;
  score: number;
};

export function ScoreRadar({ data }: { data: ScoreRadarPoint[] }) {
  if (data.length === 0) return null;

  return (
    // Squarish so the polygon never flattens; capped so it can't dominate.
    <div className="aspect-[4/3] max-h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="var(--color-line)" strokeWidth={1} />
          <PolarAngleAxis
            dataKey="label"
            tick={{
              fill: "var(--color-ink-tertiary)",
              fontSize: 11,
            }}
          />
          <PolarRadiusAxis
            angle={90}
            axisLine={false}
            domain={[0, 10]}
            tick={false}
            tickCount={6}
          />
          <Radar
            dataKey="score"
            fill="var(--color-accent)"
            fillOpacity={0.14}
            isAnimationActive={false}
            stroke="var(--color-accent)"
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
