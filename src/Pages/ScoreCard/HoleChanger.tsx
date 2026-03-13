import { Button } from "@mui/material";
import { Course, GolfRound } from "../../types";
import "./HoleChanger.css";

type HoleChangerProps = {
  courseSelected: Course | null;
  currentHole: number;
  setCurrentHole: React.Dispatch<React.SetStateAction<number>>;
  playerRounds: GolfRound[];
  setPlayerRounds: React.Dispatch<React.SetStateAction<GolfRound[]>>;
};

export const HoleChanger = ({
  courseSelected,
  currentHole,
  setCurrentHole,
  playerRounds,
  setPlayerRounds,
}: HoleChangerProps) => {
  const isLastHole = !!(courseSelected && currentHole === courseSelected.holes.length - 1);

  const holeIncrementHandler = () => {
    const updatedScores = playerRounds.map((player) => {
      if (!player.scores[currentHole] && courseSelected) {
        const newScores = [...player.scores];
        newScores[currentHole] = courseSelected.holes[currentHole].par;
        return { ...player, scores: newScores };
      }
      return player;
    });
    setPlayerRounds(updatedScores);
    if (!isLastHole) {
      setCurrentHole((prevHole) => prevHole + 1);
    }
  };

  return (
    <div className="holeChange">
      <Button
        className="button"
        disabled={currentHole === 0}
        onClick={() => setCurrentHole((prevHole) => prevHole - 1)}
      >
        {"<"}
      </Button>{" "}
      <div>Hole {currentHole + 1}</div>
      <Button
        className="button"
        onClick={holeIncrementHandler}
      >
        {isLastHole ? "Finish" : ">"}
      </Button>
    </div>
  );
};
