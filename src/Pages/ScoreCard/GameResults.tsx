import { DartRound } from "../../types";
import "./DartScoreCard.css";

type GameResultsProps = {
  curPlayerGames: DartRound[];
  curGameType: string;
  currentToss: number;
};

export const GameResults = ({
  curPlayerGames,
  curGameType,
}: GameResultsProps) => {
  if (curGameType === "One Set" || curGameType === "Solo") return null;

  return (
    <div className="matchScoreHeader">
      {curPlayerGames.map((player) => (
        <span key={player.userId} className="matchScoreEntry">
          <span className="matchScoreWins">{player.gameWins}</span>
          <span className="matchScoreName">{player.name}</span>
        </span>
      ))}
    </div>
  );
};
