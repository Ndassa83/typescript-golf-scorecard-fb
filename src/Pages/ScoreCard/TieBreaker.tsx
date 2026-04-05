import { Button } from "@mui/material";
import { DartRound } from "../../types";
import "./TieBreaker.css";

type TieBreakerProps = {
  curPlayerGames: DartRound[];
  setCurPlayerGames: React.Dispatch<React.SetStateAction<DartRound[]>>;
  onClose: () => void;
  checkIfWinner: (games?: DartRound[]) => void;
  tiebreakerSetIdx: number;
  onTiebreakerWin: (setIdx: number, playerIdx: number) => void;
};

export const TieBreaker = ({
  curPlayerGames,
  setCurPlayerGames,
  onClose,
  checkIfWinner,
  tiebreakerSetIdx,
  onTiebreakerWin,
}: TieBreakerProps) => {
  const handleIncrement = (index: number) => {
    const updated = curPlayerGames.map((p, i) =>
      i === index ? { ...p, gameWins: p.gameWins + 1 } : p
    );
    setCurPlayerGames(updated);

    onTiebreakerWin(tiebreakerSetIdx, index);
    checkIfWinner(updated);
    onClose();
  };

  return (
    <div className="tieBreakBackdrop">
      <div className="tieBreakContainer">
        <h2 className="tieBreakTitle">
          There's been a tie - Throw a Set to determine the winner!
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
