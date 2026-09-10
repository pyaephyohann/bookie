"use client";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  formatValue?: (val: number) => string;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({
  segments,
  size = 160,
  thickness = 24,
  formatValue = (v) => String(v),
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-body-sm text-text-muted">No data available</p>
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Pre-compute offsets to avoid reassignment during render
  const segmentData = segments.map((seg, i) => {
    const pct = seg.value / total;
    const dashLength = pct * circumference;
    let offsetSoFar = 0;
    for (let j = 0; j < i; j++) {
      offsetSoFar += (segments[j].value / total) * circumference;
    }
    return { seg, pct, dashLength, dashOffset: -offsetSoFar };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full"
          role="img"
          aria-label="Donut chart"
        >
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-surface-muted)"
            strokeWidth={thickness}
          />

          {/* Segments */}
          {segmentData.map(({ seg, pct, dashLength, dashOffset }) => (
            <circle
              key={seg.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              className="transition-all duration-500"
            >
              <title>{`${seg.label}: ${formatValue(seg.value)} (${Math.round(pct * 100)}%)`}</title>
            </circle>
          ))}
        </svg>

        {/* Center text */}
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span className="text-h3 font-bold text-text">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-caption text-text-muted">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-caption text-text-muted">
              {seg.label} ({seg.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
