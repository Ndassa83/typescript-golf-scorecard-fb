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
  const holeIncrementHandler = () => {
    const updatedScores = playerRounds.map((player, index) => {
      if (!playerRounds[index].scores[currentHole] && courseSelected) {
        playerRounds[index].scores[currentHole] =
          courseSelected.holes[currentHole].par;
      }

      return player;
    });
    setCurrentHole((prevHole) => prevHole + 1);
    setPlayerRounds(updatedScores);
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
        disabled={
          !!(courseSelected && currentHole === courseSelected.holes.length - 1)
        }
        onClick={holeIncrementHandler}
      >
        {">"}
      </Button>
    </div>
  );
};
