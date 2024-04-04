import { Button } from "@mui/material";
import { Course, Player } from "../../types";
import "./HoleChanger.css";

type HoleChangerProps = {
  courseSelected: Course | null;
  currentHole: number;
  setCurrentHole: React.Dispatch<React.SetStateAction<number>>;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
};

export const HoleChanger = ({
  courseSelected,
  currentHole,
  setCurrentHole,
  players,
  setPlayers,
}: HoleChangerProps) => {
  const holeIncrementHandler = () => {
    const updatedScores = players.map((player, index) => {
      if (!players[index].scores[currentHole] && courseSelected) {
        players[index].scores[currentHole] =
          courseSelected.holes[currentHole].par;
      }

      return player;
    });
    setCurrentHole((prevHole) => prevHole + 1);
    setPlayers(updatedScores);
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
