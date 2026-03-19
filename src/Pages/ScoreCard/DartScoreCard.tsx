import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveToStorage, loadFromStorage, clearStorage, STORAGE_KEYS, DART_KEYS } from "../../utils/localStorage";
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { CollectionReference } from "firebase/firestore";
import { TieBreaker } from "./TieBreaker";
import { DartRound, PlayerOptionType } from "../../types";
import "./ScoreCard.css";
import { GarageDartsLogo } from "../../components/GarageDartsLogo";
import { DartScoreCardTable } from "./DartScoreCardTable";
import { TossInput } from "./TossInput";
import { GameResults } from "./GameResults";

type DartScoreCardProps = {
  dartRoundCollection: CollectionReference;
  currentUserEmail: string | null;
  playerOptions?: PlayerOptionType[];
};
const DartScoreCard = ({
  dartRoundCollection,
  currentUserEmail,
  playerOptions,
}: DartScoreCardProps) => {
  const [curPlayerGames, setCurPlayerGames] = useState<DartRound[]>(
    () => loadFromStorage<DartRound[]>(STORAGE_KEYS.DARTS_CUR_PLAYER_GAMES) ?? []
  );
  const [curGameType] = useState<string>(
    () => loadFromStorage<string>(STORAGE_KEYS.DARTS_CUR_GAME_TYPE) ?? "Full Match"
  );
  const [currentToss, setCurrentToss] = useState<number>(
    () => loadFromStorage<number>(STORAGE_KEYS.DARTS_CURRENT_TOSS) ?? 0
  );
  const [gameLength, setGameLength] = useState<number>(
    () => loadFromStorage<number>(STORAGE_KEYS.DARTS_GAME_LENGTH) ?? 3
  );
  const [tieBreaker, setTieBreaker] = useState<boolean>(false);
  const [winningPlayer, setWinningPlayer] = useState<DartRound | null>(null);
  const [tiebreakerWinners, setTiebreakerWinners] = useState<Record<number, number>>(
    () => loadFromStorage<Record<number, number>>(STORAGE_KEYS.DARTS_TIEBREAKER_WINNERS) ?? {}
  );

  useEffect(() => { saveToStorage(STORAGE_KEYS.DARTS_CUR_PLAYER_GAMES, curPlayerGames); }, [curPlayerGames]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.DARTS_CURRENT_TOSS, currentToss); }, [currentToss]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.DARTS_GAME_LENGTH, gameLength); }, [gameLength]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.DARTS_TIEBREAKER_WINNERS, tiebreakerWinners); }, [tiebreakerWinners]);

  const checkIfWinner = (games?: DartRound[]) => {
    const data = games ?? curPlayerGames;
    //Full Match Logic
    if (curGameType === "Full Match") {
      const winner = data.find((p) => p.gameWins === 2) ?? null;
      if (winner) {
        const updated = { ...winner, matchWinner: true };
        setCurPlayerGames((prev) =>
          prev.map((p) => (p.userId === winner.userId ? updated : p))
        );
        setWinningPlayer(updated);
      } else if (data.every((p) => p.gameWins !== 2)) {
        setGameLength((prev) => prev + 3);
      }
    }
    //One Set Logic
    if (curGameType === "One Set") {
      const winner = data.find((p) => p.gameWins === 1) ?? null;
      if (winner) {
        const updated = { ...winner, matchWinner: true };
        setCurPlayerGames((prev) =>
          prev.map((p) => (p.userId === winner.userId ? updated : p))
        );
        setWinningPlayer(updated);
      }
    }

    //solo round logic
    if (curGameType === "Solo") {
      setWinningPlayer(null);
    }
  };

  useEffect(() => {
    // Only set initial game length when starting fresh (no scores yet)
    const hasScores = curPlayerGames.some((p) => p.scores.length > 0);
    if (!hasScores) {
      if (curGameType === "Full Match") {
        setGameLength(6);
      } else if (curGameType === "One Set") {
        setGameLength(3);
      } else if (curGameType === "Solo") {
        setGameLength(10);
      }
    }
  }, [curGameType]);

  const navigate = useNavigate();
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);

  const handleAbandonMatch = () => {
    clearStorage(...DART_KEYS);
    navigate("/");
  };

  return (
    <div className="scoreCardContainer">
      <GarageDartsLogo className="gameLogo" />

      <TossInput
        curPlayerGames={curPlayerGames}
        setCurPlayerGames={setCurPlayerGames}
        currentToss={currentToss}
        setCurrentToss={setCurrentToss}
        gameLength={gameLength}
        setGameLength={setGameLength}
      />

      <GameResults
        curPlayerGames={curPlayerGames}
        curGameType={curGameType}
        currentToss={currentToss}
      />

      <DartScoreCardTable
        curPlayerGames={curPlayerGames}
        curGameType={curGameType}
        currentToss={currentToss}
        setCurrentToss={setCurrentToss}
        gameLength={gameLength}
        setGameLength={setGameLength}
        tieBreaker={tieBreaker}
        setTieBreaker={setTieBreaker}
        setCurPlayerGames={setCurPlayerGames}
        dartRoundCollection={dartRoundCollection}
        checkIfWinner={checkIfWinner}
        setWinningPlayer={setWinningPlayer}
        winningPlayer={winningPlayer}
        currentUserEmail={currentUserEmail}
        playerOptions={playerOptions}
        tiebreakerWinners={tiebreakerWinners}
        setTiebreakerWinners={setTiebreakerWinners}
      />

      {tieBreaker && (
        <TieBreaker
          curPlayerGames={curPlayerGames}
          setCurPlayerGames={setCurPlayerGames}
          onClose={() => setTieBreaker(false)}
          checkIfWinner={checkIfWinner}
          tiebreakerSetIdx={Math.floor(currentToss / 3) - 1}
          onTiebreakerWin={(setIdx, playerIdx) =>
            setTiebreakerWinners((prev) => ({ ...prev, [setIdx]: playerIdx }))
          }
        />
      )}

      <Button color="error" onClick={() => setAbandonDialogOpen(true)}>
        Abandon Match
      </Button>

      <Dialog open={abandonDialogOpen} onClose={() => setAbandonDialogOpen(false)}>
        <DialogTitle>Abandon Match?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your match progress will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbandonDialogOpen(false)}>Keep Playing</Button>
          <Button color="error" onClick={handleAbandonMatch}>Abandon</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DartScoreCard;
