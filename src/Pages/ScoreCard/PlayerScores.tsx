import { Button } from "@mui/material";
import { Course, GolfRound } from "../../types";
import { maxScore } from "../../Constants";
import "./PlayerScores.css";

type PlayerScoresProps = {
  playerRounds: GolfRound[];
  setPlayerRounds: React.Dispatch<React.SetStateAction<GolfRound[]>>;
  currentHole: number;
  courseSelected: Course | null;
};

export const PlayerScores = ({
  playerRounds,
  setPlayerRounds,
  currentHole,
  courseSelected,
}: PlayerScoresProps) => {
  const adjustScore = (r: number, delta: number) => {
    setPlayerRounds((prev) =>
      prev.map((player, index) => {
        if (index !== r) return player;
        const current = player.scores[currentHole] || (courseSelected?.holes[currentHole].par ?? 0);
        const newScores = [...player.scores];
        newScores[currentHole] = current + delta;
        return { ...player, scores: newScores };
      })
    );
  };

  return (
    <div className="playerBoxesContainer">
      {playerRounds.map((player, index) => (
        <div key={player.userId} className="playerScoreBox">
          <div className="playerName">{player.name}</div>

          <div className="scoreChange">
            <Button
              className="button"
              disabled={player.scores[currentHole] <= 1}
              onClick={() => adjustScore(index, -1)}
            >
              -
            </Button>
            <div>
              {player.scores[currentHole]
                ? player.scores[currentHole]
                : courseSelected?.holes[currentHole].par}
            </div>
            <Button
              className="button"
              disabled={player.scores[currentHole] >= maxScore}
              onClick={() => adjustScore(index, 1)}
            >
              +
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
