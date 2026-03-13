import { useEffect, useMemo } from "react";
import { DartRound } from "../../types";
import { PlayerScores } from "./PlayerScores";
import { PostDartRoundModal } from "./PostDartRoundModal";

type GameResultsProps = {
  curPlayerGames: DartRound[];
  curGameType: string;
  currentToss: number;
};

export const GameResults = ({
  curPlayerGames,
  curGameType,
  currentToss,
}: GameResultsProps) => {
  const getTotalPlayerScores = (start: number, end: number): number[] => {
    return curPlayerGames.map((player) => {
      const flattenedArr = player.scores.reduce<number[]>(
        (acc, cur) => acc.concat(cur.values), // ⬅ flatten VALUES arrays
        []
      );

      const threeGameSplit = flattenedArr.slice(start, end);

      return threeGameSplit.reduce((acc, cur) => acc + cur, 0);
    });
  };

  const numSets = useMemo(() => {
    const throwsPerSet = 22; //one more than actual so floor isnt hit too early and makes a new game before necessary
    const firstPlayer = curPlayerGames[0];
    const totalThrows = firstPlayer?.scores.flat().length || 0;
    return Math.floor(totalThrows / throwsPerSet) + 1;
  }, [curPlayerGames]);

  const setIndices = Array.from({ length: numSets }, (_, i) => i);

  // left off Here-next step is to create game win screen and double check that that all Works-that should be in dartscorecartable

  console.log(`first 3 player scores ${getTotalPlayerScores(0, 21)}`);
  return (
    <div>
      {curGameType !== "One Set" && (
        <div className="setTotalContainers">
          {setIndices.map((val) => {
            return (
              <div key={val} className="setTotals">
                <div>Set 1 Total:</div>
                <div>
                  {" "}
                  {curPlayerGames.map((player, index) => {
                    return (
                      <div key={player.userId}>{`${player.name}:${
                        getTotalPlayerScores(val * 21, val * 21 + 21)[index]
                      }
                (${player.gameWins})`}</div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
