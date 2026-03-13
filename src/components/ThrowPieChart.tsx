import "./ThrowPieChart.css";

const COLORS = [
  "#4a7c3f",
  "#e84040",
  "#c9a227",
  "#7a5c3e",
  "#2d7a6b",
  "#c85c8e",
  "#2d5a27",
  "#b83232",
  "#5b6e2d",
  "#8b5e3c",
];

interface ThrowPieChartProps {
  entries: [number, number][];
  total: number;
}

const CX = 100;
const CY = 100;
const R = 88;

function polarXY(r: number, angle: number) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

function arcPath(startAngle: number, endAngle: number) {
  if (endAngle - startAngle >= 2 * Math.PI - 0.001) {
    return `M ${CX - R} ${CY} A ${R} ${R} 0 1 1 ${CX + R} ${CY} A ${R} ${R} 0 1 1 ${CX - R} ${CY} Z`;
  }
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const s = polarXY(R, startAngle);
  const e = polarXY(R, endAngle);
  return `M ${CX} ${CY} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

export function ThrowPieChart({ entries, total }: ThrowPieChartProps) {
  let cumAngle = -Math.PI / 2;
  const slices = entries.map((entry, i) => {
    const [score, count] = entry;
    const fraction = total > 0 ? count / total : 0;
    const startAngle = cumAngle;
    const endAngle = cumAngle + fraction * 2 * Math.PI;
    cumAngle = endAngle;
    return { score, count, fraction, startAngle, endAngle, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="throwPieChart">
      <svg className="throwPieSvg" viewBox="0 0 200 200">
        {slices
          .filter((s) => s.fraction > 0)
          .map((s) => (
            <path
              key={s.score}
              d={arcPath(s.startAngle, s.endAngle)}
              fill={s.color}
              stroke="#f9f3e3"
              strokeWidth="2"
            />
          ))}
        {total === 0 && (
          <circle cx={CX} cy={CY} r={R} fill="#e8e0d0" />
        )}
      </svg>
      <div className="throwPieLegend">
        {slices.map((s) => (
          <div
            key={s.score}
            className="throwPieLegendItem"
            style={{ color: s.color }}
          >
            {s.score} pts — {(s.fraction * 100).toFixed(1)}% ({s.count})
          </div>
        ))}
      </div>
    </div>
  );
}
