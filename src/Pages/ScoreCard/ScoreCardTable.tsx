import { Player, Course } from "../../types";
import dayjs from "dayjs";
import "./ScoreCardTable.css";

type ScoreCardProps = {
  players: Player[];
  courseSelected: Course | null;
  currentHole?: number;
  showDate?: boolean;
};
export const ScoreCardTable = ({
  players,
  courseSelected,
  currentHole,
  showDate,
}: ScoreCardProps) => {
  const totalPlayerScores: number[] = players.map((player) => {
    return player.scores.reduce((acc, cur) => {
      return cur + acc;
    }, 0);
  });

  return (
    <div className="scoreCardContainer ">
      <div className="scoreCard">
        <div className="titles">
          <div className="cell cellTitles">Hole</div>
          <div className="cell cellTitles">Yards</div>
          <div className="cell cellTitles">Par</div>
          <div className="cell cellTitles">Handicap</div>
          {players.map((player) => (
            <div className="cell cellTitles scores playerDateDiv">
              <div>
                {player.name.length > 9
                  ? player.name.substring(0, 9) + "..."
                  : player.name}
              </div>
              <div className="dateOfRound">
                {showDate ? dayjs(player.date).format("M/D/YY") : ""}{" "}
              </div>
            </div>
          ))}
        </div>
        {courseSelected?.holes.map((hole, index) => {
          const { holeNumber, yards, par, handicap } = hole;
          const cellClassName = `cell ${
            index === currentHole ? " currentHole" : ""
          }`;

          return (
            <div className="cellInfo">
              {[holeNumber, yards, par, handicap].map((val) => (
                <div className={cellClassName}>{val}</div>
              ))}

              {players.map((player) => (
                <div
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
          ].map((val) => (
            <div className="cell totals">{val}</div>
          ))}

          {totalPlayerScores?.map((score) => (
            <div className="cell scores totals">{score}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
