import { GolfRound, Course } from "../../types";
import dayjs from "dayjs";
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
  const totalPlayerScores: number[] = playerRounds.map((player) =>
    player.scores.reduce((acc, cur) => cur + acc, 0)
  );

  return (
    <div className="scoreCardScrollWrapper">
    <div className="scoreCard">
      {/* Titles row */}
      <div className="titles">
        <div className="cell cellTitles">Hole</div>
        <div className="cell cellTitles">Yards</div>
        <div className="cell cellTitles">Par</div>
        <div className="cell cellTitles">Handicap</div>
        {playerRounds?.map((player) => (
          <div
            key={player.name}
            className="cell cellTitles scores playerDateDiv"
          >
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

      {/* Holes rows */}
      {courseSelected?.holes.map((hole, index) => {
        const { holeNumber, yards, par, handicap } = hole;
        const cellClassName = `cell ${
          index === currentHole ? " currentHole" : ""
        }`;

        return (
          <div key={holeNumber} className="cellInfo">
            {[holeNumber, yards, par, handicap].map((val, idx) => (
              <div key={idx} className={cellClassName}>
                {val}
              </div>
            ))}

            {playerRounds?.map((player) => (
              <div
                key={player.name + index}
                className={`cell scores${
                  index === currentHole ? " currentHole" : ""
                }`}
              >
                {player.scores[index]}
              </div>
            ))}
          </div>
        );
      })}

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

        {totalPlayerScores?.map((score, idx) => (
          <div key={idx} className="cell scores totals">
            {score}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};
