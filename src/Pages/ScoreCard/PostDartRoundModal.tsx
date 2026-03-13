import { useEffect, useMemo, useState } from "react";
import { DartRound } from "../../types";
import { Button, Modal } from "@mui/material";
import "./PostDartRound.css";
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  query,
  orderBy,
  CollectionReference,
} from "firebase/firestore";
import { addDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { clearStorage, DART_KEYS } from "../../utils/localStorage";

type PostDartRoundModalProps = {
  curPlayerGames: DartRound[];
  setCurPlayerGames: React.Dispatch<React.SetStateAction<DartRound[]>>;
  currentToss: number;
  setCurrentToss: React.Dispatch<React.SetStateAction<number>>;
  setGameLength: React.Dispatch<React.SetStateAction<number>>;
  curGameType: string;
  setWinningPlayer: React.Dispatch<React.SetStateAction<DartRound | null>>;
  winningPlayer: DartRound | null;
  dartRoundCollection: CollectionReference;
};

export const PostDartRoundModal = ({
  curPlayerGames,
  curGameType,
  setWinningPlayer,
  winningPlayer,
  dartRoundCollection,
  setGameLength,
  setCurrentToss,
  currentToss,
  setCurPlayerGames,
}: PostDartRoundModalProps) => {
  const [gameUploaded, setGameUploaded] = useState<boolean>(false);

  const handlePostRound = () => {
    curPlayerGames.forEach((game) => {
      addDoc(dartRoundCollection, game);
      alert(`${game.name}'s scores have been uploaded`);
    });

    setGameUploaded(true);
  };

  const restartMatch = () => {
    const newDate = new Date().toISOString();
    setCurPlayerGames((prevPlayers) =>
      prevPlayers.map((player) => ({
        ...player,
        scores: [],
        gameWins: 0,
        matchWinner: false,
        date: newDate,
      }))
    );
    setCurrentToss(0);
    setGameLength(
      curGameType === "Full Match" ? 6 : curGameType === "One Set" ? 3 : 10
    );
    setGameUploaded(false);
    setWinningPlayer(null);
  };

  // left off here i created a post round button and then a rematch or go home button. need to finish the go home button and then need to also be able to upload solo and single matches
  return (
    <div>
      <Modal
        open={
          winningPlayer !== null ||
          (curGameType === "Solo" && currentToss === 10)
        }
      >
        <div className="modalContainer">
          {!gameUploaded ? (
            <div className="modalContent">
              <div>{winningPlayer?.name} Won!</div>
              <Button onClick={handlePostRound}>Post Round</Button>
              <Link to="/" onClick={() => clearStorage(...DART_KEYS)}>Go Home</Link>
            </div>
          ) : (
            <div className="modalContent">
              <div>{winningPlayer?.name} Won!</div>
              <Button onClick={restartMatch}>Re-match?</Button>
              <Link to="/" onClick={() => clearStorage(...DART_KEYS)}>Go Home</Link>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
