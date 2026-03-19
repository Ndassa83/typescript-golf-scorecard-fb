import { GolfRound, Course, Hole, PlayerOptionType } from "../../types";
import dayjs from "dayjs";
import { useMediaQuery } from "@mui/material";
import "./ScoreCardTable.css";

type ScoreCardProps = {
  playerRounds: GolfRound[];
  courseSelected: Course | null;
  currentHole?: number;
  showDate?: boolean;
  playerOptions?: PlayerOptionType[];
};

export const ScoreCardTable = ({
  playerRounds,
  courseSelected,
  currentHole,
  showDate,
  playerOptions,
}: ScoreCardProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const holes = courseSelected?.holes ?? [];

  const totalPlayerScores: number[] = playerRounds.map((player) =>
    player.scores.reduce((acc, cur) => cur + acc, 0)
  );

  const formatStp = (val: number) =>
    val === 0 ? "E" : val > 0 ? `+${val}` : `${val}`;

  const stpClass = (val: number) =>
    val < 0 ? "stpUnder" : val > 0 ? "stpOver" : "stpEven";

  const parLabelClass = (score: number | undefined, par: number) => {
    if (score === undefined) return "";
    const diff = score - par;
    if (diff <= -2) return " score-eagle";
    if (diff === -1) return " score-birdie";
    if (diff === 1) return " score-bogey";
    if (diff >= 2) return " score-dbl-bogey";
    return "";
  };

  const renderLabels = () => (
    <div className="titles">
      <div className="cell cellTitles">Hole</div>
      <div className="cell cellTitles">Yards</div>
      <div className="cell cellTitles">Par</div>
      <div className="cell cellTitles">Handicap</div>
      {playerRounds.map((player) => {
        return (
          <div key={player.name} className="cell cellTitles scores playerDateDiv">
            <span className="playerNameLabel" title={player.name}>
              {player.name.length > 7
                ? player.name.substring(0, 7) + "…"
                : player.name}
            </span>
            <div className="dateOfRound">
              {showDate ? dayjs(player.date).format("M/D/YY") : ""}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderHoleCol = (hole: Hole, index: number) => {
    const { holeNumber, yards, par, handicap } = hole;
    const isActive = index === currentHole;
    const cellCls = `cell${isActive ? " currentHole" : ""}`;
    return (
      <div key={holeNumber} className="cellInfo">
        {[holeNumber, yards, par, handicap].map((val, idx) => (
          <div key={idx} className={cellCls}>
            {val}
          </div>
        ))}
        {playerRounds.map((player) => {
          const score = player.scores[index];
          const pcls = isActive ? "" : parLabelClass(score, par);
          return (
            <div
              key={player.name + index}
              className={`cell scores${isActive ? " currentHole" : ""}`}
            >
              <span className={`parLabel${pcls}`}>{score}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSubtotalCol = (label: string, indices: number[]) => {
    const yardsSum = indices.reduce((sum, i) => sum + (holes[i]?.yards ?? 0), 0);
    const parSum = indices.reduce((sum, i) => sum + (holes[i]?.par ?? 0), 0);
    return (
      <div className="cellInfo">
        {[label, yardsSum, parSum, "-"].map((val, idx) => (
          <div key={idx} className="cell totals">
            {val}
          </div>
        ))}
        {playerRounds.map((player, pi) => {
          const subScore = indices.reduce((sum, i) => sum + (player.scores[i] ?? 0), 0);
          const playedInRange = indices.filter((i) => player.scores[i] !== undefined).length;
          const subPar = indices
            .slice(0, playedInRange)
            .reduce((sum, i) => sum + (holes[i]?.par ?? 0), 0);
          const stpVal = playedInRange > 0 ? subScore - subPar : null;
          return (
            <div key={pi} className="cell scores totals totalScoreCell">
              <span>{subScore}</span>
              {stpVal !== null && (
                <span className={`subtotalStp ${stpClass(stpVal)}`}>
                  {formatStp(stpVal)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTotalCol = (label: string) => (
    <div className="cellInfo">
      {[label, courseSelected?.totalYards, courseSelected?.totalPar, "-"].map(
        (val, idx) => (
          <div key={idx} className="cell totals">
            {val}
          </div>
        )
      )}
      {playerRounds.map((player, idx) => {
        const total = totalPlayerScores[idx];
        const playedCount = player.scores.length;
        const playedPar = holes
          .slice(0, playedCount)
          .reduce((sum, h) => sum + h.par, 0);
        const stpVal = playedCount > 0 ? total - playedPar : null;
        return (
          <div key={idx} className="cell scores totals totalScoreCell">
            <span>{total}</span>
            {stpVal !== null && (
              <span className={`subtotalStp ${stpClass(stpVal)}`}>
                {formatStp(stpVal)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  // Mobile + 18-hole course: split into front 9 / back 9
  if (isMobile && holes.length > 9) {
    const frontIdx = Array.from({ length: 9 }, (_, i) => i);
    const backIdx = Array.from({ length: holes.length - 9 }, (_, i) => i + 9);

    return (
      <div className="scoreCardScrollWrapper splitTables">
        <div className="scoreCard">
          {renderLabels()}
          {frontIdx.map((i) => renderHoleCol(holes[i], i))}
          {renderSubtotalCol("Out", frontIdx)}
        </div>
        <div className="scoreCard">
          {renderLabels()}
          {backIdx.map((i) => renderHoleCol(holes[i], i))}
          {renderTotalCol("Tot")}
        </div>
      </div>
    );
  }

  // Desktop (or ≤9-hole course): single table
  return (
    <div className="scoreCardScrollWrapper">
      <div className="scoreCard">
        {renderLabels()}
        {holes.map((hole, index) => renderHoleCol(hole, index))}
        {renderTotalCol("Total")}
      </div>
    </div>
  );
};
