import { Button, IconButton } from "@mui/material";
import { DartRound } from "../../types";
import { useEffect, useState } from "react";
import ArrowCircleLeftIcon from "@mui/icons-material/ArrowCircleLeft";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
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

  const handleTossTotal = (value: number) => {
    setTossTotal((prev) => [...prev, value]);
  };

  const handleSubmitToss = (r: number) => {
    const updatedScores = curPlayerGames.map((player, index) => {
      if (index !== r) return player;

      // clone the scores array
      const newScores = [...player.scores];

      // lazy-create toss object if it doesn't exist
      if (!newScores[currentToss]) {
        newScores[currentToss] = { tossNumber: currentToss + 1, values: [] };
      }

      // assign tossTotal directly — no nesting
      newScores[currentToss].values = tossTotal;

      return { ...player, scores: newScores };
    });

    setCurPlayerGames(updatedScores);
    setTossTotal([]);

    // advance toss index only if all players have submitted this toss
    const allHaveToss = updatedScores.every(
      (p) =>
        Array.isArray(p.scores) &&
        p.scores.length > currentToss &&
        Array.isArray(p.scores[currentToss]?.values)
    );

    if (allHaveToss) setCurrentToss((prev) => prev + 1);
  };
  console.log(
    "checking what values looks like before upload,",
    curPlayerGames[0]
  );
  //this is the next step
  useEffect(() => {
    const checkTie = () => {
      //go through each users scores every 3 tosses. add them up and compare to every other users scores. whichever user is highest add 1 to their gameWins
      // first check if no player has 2 Set wins.
      //if no player has 2 set wins, add 3 to gameLength, continue game
      //if a player has 2 set wins, Finish game, prompt user to post round
    };
  }, [currentToss]);

  console.log("Toss :", currentToss);
  return (
    <div className="tossInputContainer">
      <div className="tossGrid">
        {[0, 5, 10, 20, 50, 100].map((val) => (
          <Button
            key={val}
            disabled={tossTotal.length >= 7}
            onClick={() => handleTossTotal(val)}
          >
            {val}
          </Button>
        ))}
        <Button
          className="tossGridClear"
          disabled={tossTotal.length <= 0}
          onClick={() => setTossTotal([])}
        >
          Clear
        </Button>
      </div>
      <div className="tossTotalDisplay">
        Toss Total: {tossTotal.length > 0 ? tossTotal.reduce((acc, cur) => acc + cur) : 0}
        {` (Throw ${tossTotal.length}/7)`}
      </div>
      <div className="tossSubmitRow">
        {curPlayerGames.map((player, index) => (
          <Button
            key={player.userId}
            disabled={tossTotal.length !== 7}
            onClick={() => handleSubmitToss(index)}
          >
            {player.name}
          </Button>
        ))}
      </div>
    </div>
  );
};
