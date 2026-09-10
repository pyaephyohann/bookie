"use client";

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  maxValue?: number;
  formatValue?: (val: number) => string;
  showLabels?: boolean;
}

export function BarChart({
  data,
  height = 200,
  maxValue,
  formatValue = (v) => String(v),
  showLabels = true,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-body-sm text-text-muted">No data available</p>
      </div>
    );
  }

  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(20, Math.floor(400 / data.length) - 8);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${Math.max(data.length * (barWidth + 8), 200)} ${height + 40}`}
        className="w-full"
        style={{ minWidth: data.length * (barWidth + 8) }}
        role="img"
        aria-label="Bar chart"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={0}
            y1={height * (1 - pct)}
            x2={Math.max(data.length * (barWidth + 8), 200)}
            y2={height * (1 - pct)}
            stroke="var(--color-border-subtle)"
            strokeWidth={1}
          />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = max > 0 ? (d.value / max) * height : 0;
          const x = i * (barWidth + 8) + 4;
          const y = height - barHeight;
          const color = d.color ?? "var(--color-brand)";

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                fill={color}
                rx={3}
                className="transition-all duration-300"
              >
                <title>{`${d.label}: ${formatValue(d.value)}`}</title>
              </rect>

              {/* Value label */}
              {d.value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-text-secondary"
                  fontSize={10}
                  fontWeight={600}
                >
                  {formatValue(d.value)}
                </text>
              )}

              {/* Category label */}
              {showLabels && (
                <text
                  x={x + barWidth / 2}
                  y={height + 14}
                  textAnchor="middle"
                  className="fill-text-muted"
                  fontSize={9}
                >
                  {d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
