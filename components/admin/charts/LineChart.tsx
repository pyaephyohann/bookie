"use client";

interface LineSeries {
  label: string;
  color: string;
  data: number[];
}

interface LineChartProps {
  labels: string[];
  series: LineSeries[];
  height?: number;
  formatValue?: (val: number) => string;
}

export function LineChart({
  labels,
  series,
  height = 200,
  formatValue = (v) => String(v),
}: LineChartProps) {
  if (labels.length === 0 || series.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-body-sm text-text-muted">No data available</p>
      </div>
    );
  }

  const allValues = series.flatMap((s) => s.data);
  const max = Math.max(...allValues, 1);
  const padding = { top: 20, right: 10, bottom: 30, left: 10 };
  const chartW = 400;
  const chartH = height - padding.top - padding.bottom;
  const stepX = labels.length > 1 ? chartW / (labels.length - 1) : chartW / 2;

  const toPath = (data: number[]): string => {
    return data
      .map((val, i) => {
        const x = labels.length > 1 ? i * stepX : chartW / 2;
        const y = padding.top + chartH * (1 - val / max);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  // Area path (filled under the first series)
  const areaPath = series[0]
    ? (() => {
        const data = series[0].data;
        const line = data
          .map((val, i) => {
            const x = labels.length > 1 ? i * stepX : chartW / 2;
            const y = padding.top + chartH * (1 - val / max);
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ");
        const lastX = labels.length > 1 ? (data.length - 1) * stepX : chartW / 2;
        const firstX = labels.length > 1 ? 0 : chartW / 2;
        return `${line} L ${lastX} ${padding.top + chartH} L ${firstX} ${padding.top + chartH} Z`;
      })()
    : "";

  // Show every Nth label to avoid crowding
  const maxLabels = 8;
  const labelStep = Math.max(1, Math.floor(labels.length / maxLabels));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`-${padding.left} 0 ${chartW + padding.left + padding.right} ${height}`}
        className="w-full"
        role="img"
        aria-label="Line chart"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={0}
            y1={padding.top + chartH * (1 - pct)}
            x2={chartW}
            y2={padding.top + chartH * (1 - pct)}
            stroke="var(--color-border-subtle)"
            strokeWidth={1}
            strokeDasharray={pct === 0 ? "none" : "3 3"}
          />
        ))}

        {/* Area fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill={series[0]?.color ?? "var(--color-brand)"}
            fillOpacity={0.1}
          />
        )}

        {/* Lines */}
        {series.map((s) => (
          <path
            key={s.label}
            d={toPath(s.data)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Data points */}
        {series.map((s) =>
          s.data.map((val, i) => {
            const x = labels.length > 1 ? i * stepX : chartW / 2;
            const y = padding.top + chartH * (1 - val / max);
            return (
              <circle
                key={`${s.label}-${i}`}
                cx={x}
                cy={y}
                r={3}
                fill={s.color}
                className="opacity-0 hover:opacity-100 transition-opacity"
              >
                <title>{`${s.label} (${labels[i]}): ${formatValue(val)}`}</title>
              </circle>
            );
          }),
        )}

        {/* X-axis labels */}
        {labels.map((label, i) => {
          if (i % labelStep !== 0 && i !== labels.length - 1) return null;
          const x = labels.length > 1 ? i * stepX : chartW / 2;
          return (
            <text
              key={i}
              x={x}
              y={height - 4}
              textAnchor="middle"
              className="fill-text-muted"
              fontSize={9}
            >
              {label.length > 6 ? label.slice(0, 5) + "…" : label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-caption text-text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
