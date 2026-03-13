import { Button } from "@mui/material";
import { DartRound } from "../../types";
import "./TieBreaker.css";

type TieBreakerProps = {
  curPlayerGames: DartRound[];
  setCurPlayerGames: React.Dispatch<React.SetStateAction<DartRound[]>>;
  onClose: () => void;
  checkIfWinner: () => void;
};

export const TieBreaker = ({
  curPlayerGames,
  setCurPlayerGames,
  onClose,
  checkIfWinner,
}: TieBreakerProps) => {
  const handleIncrement = (index: number) => {
    const updated = [...curPlayerGames];
    updated[index].gameWins += 1;
    setCurPlayerGames(updated);

    checkIfWinner();
    onClose();
  };

  return (
    <div className="tieBreakBackdrop">
      <div className="tieBreakContainer">
        <h2 className="tieBreakTitle">
          There's been a tie - Throw a Game to determine the winner!
        </h2>
        {curPlayerGames.map((player, index) => (
          <div key={player.name} className="playerRowTie">
            <div className="playerName">{player.name}</div>
            <Button
              variant="contained"
              onClick={() => handleIncrement(index)}
              className="winButton"
            >
              Winner
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
