import { useMemo } from "react";
import { GolfRound } from "../types";
import "./ScoreTrendChart.css";

type Props = {
  rounds: GolfRound[];
  playerId: number;
  label?: string;
};

const W = 500;
const H = 180;
const PAD = { top: 20, right: 20, bottom: 36, left: 44 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;
const WINDOW = 5;

const ScoreTrendChart = ({ rounds, playerId, label }: Props) => {
  const data = useMemo(() => {
    const playerRounds = rounds
      .filter((r) => r.userId === playerId)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (playerRounds.length < 2) return null;

    // Score-to-par per round
    const rawDiffs = playerRounds.map((r) => {
      const total = r.scores.reduce((a, b) => a + b, 0);
      return { diff: total - r.currentCourse.totalPar, date: r.date };
    });

    // Rolling WINDOW-round average
    const avgPoints = rawDiffs.map((_, i) => {
      const slice = rawDiffs.slice(Math.max(0, i - WINDOW + 1), i + 1);
      return slice.reduce((sum, d) => sum + d.diff, 0) / slice.length;
    });

    const allVals = avgPoints;
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    const range = maxVal - minVal || 1;

    // Padding so line doesn't hug edges
    const yPad = Math.ceil(range * 0.2) + 1;
    const yMin = Math.floor(minVal - yPad);
    const yMax = Math.ceil(maxVal + yPad);
    const yRange = yMax - yMin;

    const n = avgPoints.length;
    const xScale = (i: number) => (n === 1 ? CHART_W / 2 : (i / (n - 1)) * CHART_W);
    const yScale = (v: number) => CHART_H - ((v - yMin) / yRange) * CHART_H;

    // Build polyline points
    const linePoints = avgPoints
      .map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`)
      .join(" ");

    // Y-axis ticks: par (0), and evenly-spaced integers
    const tickStep = Math.max(1, Math.round(yRange / 4));
    const yTicks: number[] = [];
    for (let t = yMin; t <= yMax; t += tickStep) yTicks.push(t);

    // X-axis ticks
    const xTickCount = Math.min(n, 6);
    const xTicks = Array.from({ length: xTickCount }, (_, i) =>
      Math.round((i / (xTickCount - 1)) * (n - 1))
    );

    return { avgPoints, linePoints, yScale, xScale, yMin, yMax, yTicks, xTicks, n, rawDiffs };
  }, [rounds, playerId]);

  if (!data) return null;

  const { linePoints, yScale, xScale, yTicks, xTicks, n, rawDiffs } = data;

  return (
    <div className="scoreTrendChart">
      {label && <div className="scoreTrendLabel">{label}</div>}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="scoreTrendSvg"
        aria-label="Score trend chart"
      >
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Grid lines + Y axis labels */}
          {yTicks.map((t) => {
            const y = yScale(t).toFixed(1);
            const isParLine = t === 0;
            return (
              <g key={t}>
                <line
                  x1={0}
                  y1={y}
                  x2={CHART_W}
                  y2={y}
                  className={isParLine ? "trendParLine" : "trendGridLine"}
                />
                <text x={-6} y={y} className="trendAxisLabel" dominantBaseline="middle" textAnchor="end">
                  {t === 0 ? "E" : t > 0 ? `+${t}` : t}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {xTicks.map((idx) => {
            const x = xScale(idx).toFixed(1);
            return (
              <text key={idx} x={x} y={CHART_H + 18} className="trendAxisLabel" textAnchor="middle">
                {idx + 1}
              </text>
            );
          })}

          {/* X axis label */}
          <text x={CHART_W / 2} y={CHART_H + 34} className="trendAxisTitle" textAnchor="middle">
            Round ({n} total)
          </text>

          {/* Trend line */}
          <polyline
            points={linePoints}
            className="trendLine"
            fill="none"
          />

          {/* Data points */}
          {rawDiffs.map((d, i) => {
            const cy = yScale(d.diff);
            const cx = xScale(i);
            return (
              <circle
                key={i}
                cx={cx.toFixed(1)}
                cy={cy.toFixed(1)}
                r={3}
                className="trendDot"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default ScoreTrendChart;
