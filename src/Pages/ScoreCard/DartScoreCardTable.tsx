import { DartRound, PlayerOptionType } from "../../types";
import AvatarIcon from "../../components/Avatar/AvatarIcon";
import dayjs from "dayjs";
import "./ScoreCardTable.css";
import "./DartScoreCard.css";
import { useEffect, useState } from "react";
import { hexToRgb } from "@mui/material";
import { PostDartRoundModal } from "./PostDartRoundModal";
import { CollectionReference } from "firebase/firestore";

type DartScoreCardTableProps = {
  curPlayerGames: DartRound[];
  setCurPlayerGames: React.Dispatch<React.SetStateAction<DartRound[]>>;
  curGameType: string;
  currentToss: number;
  gameLength: number;
  setGameLength: React.Dispatch<React.SetStateAction<number>>;
  setCurrentToss: React.Dispatch<React.SetStateAction<number>>;
  tieBreaker: boolean;
  setTieBreaker: React.Dispatch<React.SetStateAction<boolean>>;
  setWinningPlayer: React.Dispatch<React.SetStateAction<DartRound | null>>;
  winningPlayer: DartRound | null;
  dartRoundCollection: CollectionReference;
  checkIfWinner: () => void;
  currentUserEmail: string | null;
  playerOptions?: PlayerOptionType[];
};
export const DartScoreCardTable = ({
  curPlayerGames,
  curGameType,
  currentToss,
  setCurrentToss,
  gameLength,
  setGameLength,
  tieBreaker,
  setTieBreaker,
  setCurPlayerGames,
  dartRoundCollection,
  setWinningPlayer,
  winningPlayer,
  checkIfWinner,
  currentUserEmail,
  playerOptions,
}: DartScoreCardTableProps) => {
  const totalPlayerScores: number[] = curPlayerGames.map((player) => {
    return player.scores
      .flatMap((score) => score.values)
      .reduce((sum, value) => sum + value, 0);
  });

  function add(accumulator: number, a: number) {
    return accumulator + a;
  }

  const compareScores = (beg: number, end: number): number | null => {
    let maxScore = -Infinity;
    let maxIndex: number | null = null;
    curPlayerGames.forEach((player, index) => {
      const first3Games = player.scores.slice(beg, end);

      const totalScore = first3Games
        .flatMap((score) => score.values)
        .reduce((sum, value) => sum + value, 0);

      if (totalScore === maxScore) {
        maxIndex = null;
      }
      if (totalScore > maxScore) {
        maxScore = totalScore;
        maxIndex = index;
      }
    });

    return maxIndex;
  };

  const handleIncrement = (index: number) => {
    const updated = [...curPlayerGames];
    updated[index].gameWins += 1;
    setCurPlayerGames(updated);
  };

  // const checkIfWinner = () => {
  //   //Full Match Logic
  //   if (curGameType === "Full Match") {
  //     let winner: DartRound | null = null;

  //     curPlayerGames.some((player) => {
  //       if (player.gameWins === 2) {
  //         player.matchWinner = true;
  //         winner = player;
  //         console.log(winner.name, "won");
  //         setWinningPlayer(winner);
  //       }
  //       return player.gameWins === 2;
  //     });

  //     if (
  //       curPlayerGames.every((player) => {
  //         return player.gameWins !== 2;
  //       })
  //     ) {
  //       setGameLength((prev) => (prev += 3));
  //     }
  //   }
  //   //One Set Logic
  //   if (curGameType === "One Set") {
  //     console.log("somebody won");
  //     let winner: DartRound | null = null;
  //     curPlayerGames.some((player) => {
  //       if (player.gameWins === 1) {
  //         player.matchWinner = true;
  //         winner = player;
  //         console.log(winner.name, "won");
  //         setWinningPlayer(winner);
  //       }
  //       // return player.gameWins === 2;
  //     });
  //   }

  //   //solo round logic
  //   if (curGameType === "Solo") {
  //     let soloPlayer: DartRound | null = null;

  //     curPlayerGames[0].matchWinner = null;
  //     curPlayerGames[0].gameWins = 0;

  //     setWinningPlayer(soloPlayer);
  //   }
  // };
  useEffect(() => {
    const runWinnerCheck = () => {
      const winnerIndex = compareScores(currentToss - 3, currentToss);
      let totalInputs = 0;
      curPlayerGames.forEach((player) => (totalInputs += player.scores.length));
      if (curGameType === "Solo" && currentToss >= 9) {
        checkIfWinner();
      }
      if (currentToss % 3 === 0 && currentToss > 0) {
        if (winnerIndex === null) {
          setTieBreaker(true);
        } else if (winnerIndex !== null) {
          handleIncrement(winnerIndex);
        }
        if (totalInputs === curPlayerGames.length * gameLength) {
          checkIfWinner();
        }
      }
    };
    runWinnerCheck();
  }, [currentToss]);

  return (
    <div className="scoreCard">
      <div className="titles">
        <div className="cell cellTitles">Toss</div>
        {curPlayerGames?.map((player) => {
          const avatarId = playerOptions?.find(
            (o) => o.value.userId === player.userId
          )?.value.avatar;
          return (
            <div key={player.userId} className="cell cellTitles scores playerDateDiv">
              <div className="playerLabelRow">
                <AvatarIcon avatarId={avatarId} size={18} initials={player.name} />
                <span>
                  {player.name.length > 7
                    ? player.name.substring(0, 7) + "…"
                    : player.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {[...Array(gameLength)].map((_, index) => {
        const cellClassName = `cell ${
          index === currentToss ? " currentHole" : ""
        }`;

        return (
          <div key={index} className="cellInfo">
            <div className={cellClassName}>{index + 1}</div>

            {curPlayerGames?.map((player) => (
              <div
                key={player.userId}
                className={`cell scores${
                  index === currentToss ? " currentHole" : ""
                }`}
              >
                {player.scores[index]?.values?.reduce(add, 0)}
              </div>
            ))}
          </div>
        );
      })}

      <div className="cellInfo">
        <div className="cell totals">Total</div>
        {totalPlayerScores?.map((score, i) => (
          <div key={i} className="cell scores totals">{score}</div>
        ))}
      </div>

      <PostDartRoundModal
        curPlayerGames={curPlayerGames}
        setCurPlayerGames={setCurPlayerGames}
        curGameType={curGameType}
        winningPlayer={winningPlayer}
        setWinningPlayer={setWinningPlayer}
        dartRoundCollection={dartRoundCollection}
        setGameLength={setGameLength}
        setCurrentToss={setCurrentToss}
        currentToss={currentToss}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
};
