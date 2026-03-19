import { Button } from "@mui/material";
import { DartRound } from "../../types";
import { useEffect, useState } from "react";
import "./TossInput.css";

type TossInputProps = {
  curPlayerGames: DartRound[];
  setCurPlayerGames: React.Dispatch<React.SetStateAction<DartRound[]>>;
  currentToss: number;
  setCurrentToss: React.Dispatch<React.SetStateAction<number>>;
  gameLength: number;
  setGameLength: React.Dispatch<React.SetStateAction<number>>;
};

export const TossInput = ({
  curPlayerGames,
  setCurPlayerGames,
  currentToss,
  setCurrentToss,
  gameLength,
  setGameLength,
}: TossInputProps) => {
  const [tossTotal, setTossTotal] = useState<number[]>([]);
  const [activePlayerInOrder, setActivePlayerInOrder] = useState<number>(0);
  const [playerOrder, setPlayerOrder] = useState<number[]>(() =>
    curPlayerGames.map((_, i) => i)
  );
  const [waitingForOrder, setWaitingForOrder] = useState<boolean>(
    () => curPlayerGames.length > 1 && currentToss % 3 === 0 && currentToss < gameLength
  );
  const [pendingOrder, setPendingOrder] = useState<number[]>([]);

  useEffect(() => {
    setTossTotal([]);
    setActivePlayerInOrder(0);
    if (curPlayerGames.length > 1 && currentToss % 3 === 0 && currentToss < gameLength) {
      setWaitingForOrder(true);
      setPendingOrder([]);
    }
  }, [currentToss]);

  const handlePickOrderPlayer = (playerIdx: number) => {
    const newOrder = [...pendingOrder, playerIdx];
    if (newOrder.length === curPlayerGames.length) {
      setPlayerOrder(newOrder);
      setPendingOrder([]);
      setWaitingForOrder(false);
    } else {
      setPendingOrder(newOrder);
    }
  };

  const handleTossTotal = (value: number) => {
    setTossTotal((prev) => [...prev, value]);
  };

  const handleSubmitToss = () => {
    const r = playerOrder[activePlayerInOrder];
    const updatedScores = curPlayerGames.map((player, index) => {
      if (index !== r) return player;
      const newScores = [...player.scores];
      if (!newScores[currentToss]) {
        newScores[currentToss] = { tossNumber: currentToss + 1, values: [] };
      }
      newScores[currentToss].values = tossTotal;
      return { ...player, scores: newScores };
    });

    setCurPlayerGames(updatedScores);
    setTossTotal([]);

    const nextInOrder = activePlayerInOrder + 1;
    if (nextInOrder < curPlayerGames.length) {
      setActivePlayerInOrder(nextInOrder);
    } else {
      setActivePlayerInOrder(0);
      const allHaveToss = updatedScores.every(
        (p) =>
          Array.isArray(p.scores) &&
          p.scores.length > currentToss &&
          Array.isArray(p.scores[currentToss]?.values)
      );
      if (allHaveToss) setCurrentToss((prev) => prev + 1);
    }
  };

  const activePlayer = curPlayerGames[playerOrder[activePlayerInOrder]];
  const nextPlayer = curPlayerGames[playerOrder[activePlayerInOrder + 1]];
  const currentSetNumber = Math.floor(currentToss / 3) + 1;

  if (waitingForOrder) {
    const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
    const nextOrdinal = ordinals[pendingOrder.length] ?? `${pendingOrder.length + 1}th`;
    return (
      <div className="tossInputContainer">
        <div className="orderSelectionLabel">
          Set {currentSetNumber} — Who goes {nextOrdinal}?
        </div>
        <div className="orderSelectionButtons">
          {curPlayerGames.map((player, index) => {
            const assignedPos = pendingOrder.indexOf(index);
            const isAssigned = assignedPos !== -1;
            return (
              <Button
                key={player.userId}
                variant="contained"
                disabled={isAssigned}
                onClick={() => handlePickOrderPlayer(index)}
              >
                {isAssigned ? `${assignedPos + 1}. ` : ""}{player.name}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="tossInputContainer">
      {activePlayer && (
        <div className="activePlayerLabel">
          Entering: <strong>{activePlayer.name}</strong>
        </div>
      )}
      <div className="tossGrid">
        {[0, 5, 10, 20, 50, 100].map((val) => {
          const count = tossTotal.filter((v) => v === val).length;
          return (
            <button
              key={val}
              className="tossBtn"
              disabled={tossTotal.length >= 7}
              onClick={() => handleTossTotal(val)}
            >
              <span className="tossBtnValue">{val}</span>
              {count > 0 && <span className="tossBtnCount">×{count}</span>}
            </button>
          );
        })}
      </div>
      <div className="tossTotalDisplay">
        {tossTotal.length > 0 ? tossTotal.reduce((acc, cur) => acc + cur) : 0}
        <span className="tossTotalSub"> ({tossTotal.length}/7)</span>
      </div>
      <div className="tossBottomRow">
        <button
          className="tossActionBtn tossClearBtn"
          disabled={tossTotal.length <= 0}
          onClick={() => setTossTotal([])}
        >
          Clear
        </button>
        <button
          className="tossActionBtn tossSubmitBtn"
          disabled={tossTotal.length !== 7}
          onClick={handleSubmitToss}
        >
          Submit
        </button>
      </div>
    </div>
  );
};
