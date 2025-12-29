"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type Props = {
  rows: Record<string, any>[];
};

export default function ChartRenderer({ rows }: Props) {
  // Safety checks
  if (!rows || rows.length === 0) return null;

  const columns = Object.keys(rows[0]);
  if (columns.length < 2) return null;

  // X-axis = first column
  const xKey = columns[0];

  // Y-axis = first numeric column
  const yKey = columns.find(
    key => typeof rows[0][key] === "number"
  );

  if (!yKey) return null;

  // Detect time-series (YYYY-MM or YYYY-MM-DD)
  const isTimeSeries =
    typeof rows[0][xKey] === "string" &&
    /\d{4}-\d{2}(-\d{2})?/.test(rows[0][xKey]);

  // Decide chart label
  const chartLabel = isTimeSeries
    ? "Line Chart (Time Series)"
    : rows.length <= 6
    ? "Bar Chart (Category Comparison)"
    : "Bar Chart (Aggregated Data)";

  return (
    <div className="glass fade-in mt-6">
      {/* Confidence Indicator */}
      <div className="text-sm text-muted mb-3 text-center">
        Auto-selected visualization: <strong>{chartLabel}</strong>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        {isTimeSeries ? (
          <LineChart data={rows}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        ) : (
          <BarChart data={rows}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey={yKey}
              fill="#8b5cf6"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}