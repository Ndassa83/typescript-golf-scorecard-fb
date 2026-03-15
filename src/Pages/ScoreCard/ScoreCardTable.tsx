import { GolfRound, Course, Hole } from "../../types";
import dayjs from "dayjs";
import { useMediaQuery } from "@mui/material";
import "./ScoreCardTable.css";

type ScoreCardProps = {
  playerRounds: GolfRound[];
  courseSelected: Course | null;
  currentHole?: number;
  showDate?: boolean;
};

export const ScoreCardTable = ({
  playerRounds,
  courseSelected,
  currentHole,
  showDate,
}: ScoreCardProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const holes = courseSelected?.holes ?? [];

  const totalPlayerScores: number[] = playerRounds.map((player) =>
    player.scores.reduce((acc, cur) => cur + acc, 0)
  );

  const renderLabels = () => (
    <div className="titles">
      <div className="cell cellTitles">Hole</div>
      <div className="cell cellTitles">Yards</div>
      <div className="cell cellTitles">Par</div>
      <div className="cell cellTitles">Handicap</div>
      {playerRounds.map((player) => (
        <div key={player.name} className="cell cellTitles scores playerDateDiv">
          <div>
            {player.name.length > 9
              ? player.name.substring(0, 9) + "..."
              : player.name}
          </div>
          <div className="dateOfRound">
            {showDate ? dayjs(player.date).format("M/D/YY") : ""}
          </div>
        </div>
      ))}
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
        {playerRounds.map((player) => (
          <div
            key={player.name + index}
            className={`cell scores${isActive ? " currentHole" : ""}`}
          >
            {player.scores[index]}
          </div>
        ))}
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
        {playerRounds.map((player, pi) => (
          <div key={pi} className="cell scores totals">
            {indices.reduce((sum, i) => sum + (player.scores[i] ?? 0), 0)}
          </div>
        ))}
      </div>
    );
  };

  // Mobile + 18-hole course: split into front 9 / back 9
  if (isMobile && holes.length > 9) {
    const frontIdx = Array.from({ length: 9 }, (_, i) => i);
    const backIdx = Array.from({ length: holes.length - 9 }, (_, i) => i + 9);

    return (
      <div className="scoreCardScrollWrapper splitTables">
        {/* Front 9 */}
        <div className="scoreCard">
          {renderLabels()}
          {frontIdx.map((i) => renderHoleCol(holes[i], i))}
          {renderSubtotalCol("Out", frontIdx)}
        </div>

        {/* Back 9 */}
        <div className="scoreCard">
          {renderLabels()}
          {backIdx.map((i) => renderHoleCol(holes[i], i))}
          <div className="cellInfo">
            {[
              "Tot",
              courseSelected?.totalYards,
              courseSelected?.totalPar,
              "-",
            ].map((val, idx) => (
              <div key={idx} className="cell totals">
                {val}
              </div>
            ))}
            {totalPlayerScores.map((score, idx) => (
              <div key={idx} className="cell scores totals">
                {score}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop (or ≤9-hole course): single table unchanged
  return (
    <div className="scoreCardScrollWrapper">
      <div className="scoreCard">
        {renderLabels()}

        {holes.map((hole, index) => renderHoleCol(hole, index))}

        <div className="cellInfo">
          {[
            "Total",
            courseSelected?.totalYards,
            courseSelected?.totalPar,
            "-",
          ].map((val, idx) => (
            <div key={idx} className="cell totals">
              {val}
            </div>
          ))}
          {totalPlayerScores.map((score, idx) => (
            <div key={idx} className="cell scores totals">
              {score}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
