import { Button } from "@mui/material";
import { Course, Player } from "../../types";
import { maxScore } from "../../Constants";
import "./PlayerScores.css";

type PlayerScoresProps = {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  currentHole: number;
  courseSelected: Course | null;
};

export const PlayerScores = ({
  players,
  setPlayers,
  currentHole,
  courseSelected,
}: PlayerScoresProps) => {
  const incrementPlayerScore = (playerIndex: number) => {
    const updatedScores = players.map((player, index) => {
      if (playerIndex === index) {
        if (!players[index].scores[currentHole] && courseSelected) {
          players[index].scores[currentHole] =
            courseSelected.holes[currentHole].par;
        }

        players[index].scores[currentHole] += 1;
      }
      return player;
    });

    setPlayers(updatedScores);
  };
  const decrementPlayerScore = (playerIndex: number) => {
    const updatedScores = players.map((player, index) => {
      if (playerIndex === index) {
        if (!players[index].scores[currentHole] && courseSelected) {
          players[index].scores[currentHole] =
            courseSelected.holes[currentHole].par;
        }

        players[index].scores[currentHole] -= 1;
      }

      return player;
    });

    setPlayers(updatedScores);
  };

  return (
    <div className="playerBoxesContainer">
      {players.map((player, index) => (
        <div className="playerScoreBox">
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
