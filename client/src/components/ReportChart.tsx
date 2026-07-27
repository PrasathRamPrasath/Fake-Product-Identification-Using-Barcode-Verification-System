import { useState } from 'react';
import dayjs from 'dayjs';

export interface ReportPoint {
  date: string;
  genuine: number;
  counterfeit: number;
}

interface ReportChartProps {
  data: ReportPoint[];
}

const COLOR_GOOD = '#0ca30c';
const COLOR_CRITICAL = '#d03b3b';
const COLOR_GRID = '#e1e0d9';
const COLOR_AXIS = '#c3c2b7';
const COLOR_MUTED = '#898781';
const COLOR_TEXT = '#0b0b0b';

const WIDTH = 760;
const HEIGHT = 280;
const MARGIN = { top: 16, right: 16, bottom: 36, left: 36 };

const ReportChart = ({ data }: ReportChartProps) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="text-muted">No verification activity in this period yet.</div>;
  }

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.genuine, d.counterfeit)));
  const niceMax = Math.ceil(maxValue / 5) * 5 || 5;

  const groupWidth = plotWidth / data.length;
  const barWidth = Math.min(18, groupWidth / 3);
  const gap = 3;

  const yScale = (value: number) => plotHeight - (value / niceMax) * plotHeight;

  const ticks = [0, niceMax / 2, niceMax];

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 13 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: COLOR_GOOD, display: 'inline-block' }} />
          Genuine
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: COLOR_CRITICAL, display: 'inline-block' }} />
          Counterfeit
        </span>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img" aria-label="Daily verification report">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={plotWidth} y1={yScale(t)} y2={yScale(t)} stroke={COLOR_GRID} strokeWidth={1} />
              <text x={-8} y={yScale(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={COLOR_MUTED}>
                {t}
              </text>
            </g>
          ))}
          <line x1={0} x2={0} y1={0} y2={plotHeight} stroke={COLOR_AXIS} strokeWidth={1} />
          <line x1={0} x2={plotWidth} y1={plotHeight} y2={plotHeight} stroke={COLOR_AXIS} strokeWidth={1} />

          {data.map((d, i) => {
            const groupX = i * groupWidth;
            const center = groupX + groupWidth / 2;
            const genuineH = plotHeight - yScale(d.genuine);
            const counterfeitH = plotHeight - yScale(d.counterfeit);
            const isHover = hoverIndex === i;

            return (
              <g
                key={d.date}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect x={groupX} y={0} width={groupWidth} height={plotHeight} fill="transparent" />
                <rect
                  x={center - gap / 2 - barWidth}
                  y={yScale(d.genuine)}
                  width={barWidth}
                  height={genuineH}
                  rx={3}
                  fill={COLOR_GOOD}
                  opacity={isHover || hoverIndex === null ? 1 : 0.35}
                />
                <rect
                  x={center + gap / 2}
                  y={yScale(d.counterfeit)}
                  width={barWidth}
                  height={counterfeitH}
                  rx={3}
                  fill={COLOR_CRITICAL}
                  opacity={isHover || hoverIndex === null ? 1 : 0.35}
                />
                {(i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 8) === 0) && (
                  <text x={center} y={plotHeight + 18} textAnchor="middle" fontSize={11} fill={COLOR_MUTED}>
                    {dayjs(d.date).format('D MMM')}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {hoverIndex !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${((hoverIndex + 0.5) / data.length) * 100}%`,
            top: 40,
            transform: 'translateX(-50%)',
            background: '#fff',
            border: `1px solid ${COLOR_GRID}`,
            borderRadius: 8,
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(11,11,11,0.12)',
            fontSize: 12,
            color: COLOR_TEXT,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{dayjs(data[hoverIndex].date).format('DD MMM YYYY')}</div>
          <div>Genuine: {data[hoverIndex].genuine}</div>
          <div>Counterfeit: {data[hoverIndex].counterfeit}</div>
        </div>
      )}
    </div>
  );
};

export default ReportChart;
