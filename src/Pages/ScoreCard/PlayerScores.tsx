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
  const incrementPlayerScore = (r: number) => {
    const updatedScores = playerRounds.map((player, index) => {
      if (r === index) {
        if (!playerRounds[index].scores[currentHole] && courseSelected) {
          playerRounds[index].scores[currentHole] =
            courseSelected.holes[currentHole].par;
        }

        playerRounds[index].scores[currentHole] += 1;
      }
      return player;
    });

    setPlayerRounds(updatedScores);
  };
  const decrementPlayerScore = (r: number) => {
    const updatedScores = playerRounds.map((player, index) => {
      if (r === index) {
        if (!playerRounds[index].scores[currentHole] && courseSelected) {
          playerRounds[index].scores[currentHole] =
            courseSelected.holes[currentHole].par;
        }

        playerRounds[index].scores[currentHole] -= 1;
      }

      return player;
    });

    setPlayerRounds(updatedScores);
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
              onClick={() => decrementPlayerScore(index)}
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
              onClick={() => incrementPlayerScore(index)}
            >
              +
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
