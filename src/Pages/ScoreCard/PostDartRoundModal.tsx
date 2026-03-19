import { useState } from "react";
import { DartRound } from "../../types";
import { Alert, Button, Modal } from "@mui/material";
import "./PostDartRound.css";
import { CollectionReference } from "firebase/firestore";
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
  currentUserEmail: string | null;
};

function buildDartShareText(players: DartRound[], gameType: string): string {
  const date = new Date().toLocaleDateString();
  const header = `Darts — ${date} (${gameType})`;
  const sorted = [...players].sort((a, b) => b.gameWins - a.gameWins);
  const rows = sorted.map((p) => {
    const result = p.matchWinner ? " — Winner" : "";
    return `${p.name}: ${p.gameWins} set win${p.gameWins !== 1 ? "s" : ""}${result}`;
  });
  return [header, ...rows].join("\n");
}

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
  currentUserEmail,
}: PostDartRoundModalProps) => {
  const [gameUploaded, setGameUploaded] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const handlePostRound = async () => {
    setPosting(true);
    setPostError(null);
    try {
      await Promise.all(curPlayerGames.map((game) => addDoc(dartRoundCollection, game)));
      setGameUploaded(true);
    } catch (err) {
      console.error("Failed to save dart round:", err);
      setPostError("Failed to save round. Please try again.");
    } finally {
      setPosting(false);
    }
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

  const shareText = buildDartShareText(curPlayerGames, curGameType);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Darts — ${curGameType}`);
    const body = encodeURIComponent(shareText);
    const to = currentUserEmail ? encodeURIComponent(currentUserEmail) : "";
    window.open(`mailto:${to}?subject=${subject}&body=${body}`);
  };

  const isSoloComplete = curGameType === "Solo" && currentToss === 10;
  const isOpen = winningPlayer !== null || isSoloComplete;

  return (
    <div>
      <Modal open={isOpen}>
        <div className="modalContainer">
          <div className="modalContent">
            {isSoloComplete && !winningPlayer ? (
              <h2 className="dartResultTitle">Solo Complete!</h2>
            ) : (
              <h2 className="dartResultTitle">{winningPlayer?.name} Won!</h2>
            )}

            <div className="dartPlayerResults">
              {[...curPlayerGames]
                .sort((a, b) => b.gameWins - a.gameWins)
                .map((p) => (
                  <div key={p.userId} className="dartPlayerRow">
                    <span className="dartPlayerName">{p.name}</span>
                    {curGameType !== "Solo" && (
                      <span className="dartPlayerWins">
                        {p.gameWins} set win{p.gameWins !== 1 ? "s" : ""}
                      </span>
                    )}
                    {p.matchWinner && (
                      <span className="dartWinnerBadge">Winner</span>
                    )}
                  </div>
                ))}
            </div>

            {!gameUploaded ? (
              <>
                <Button variant="contained" fullWidth onClick={handlePostRound} disabled={posting}>
                  {posting ? "Saving..." : "Post Round"}
                </Button>
                {postError && (
                  <Alert severity="error" sx={{ mt: 1 }} onClose={() => setPostError(null)}>
                    {postError}
                  </Alert>
                )}
              </>
            ) : (
              <div className="dartShareButtons">
                <Button variant="outlined" size="small" onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy Results"}
                </Button>
                <Button variant="outlined" size="small" onClick={handleEmail}>
                  Email Results
                </Button>
              </div>
            )}

            {gameUploaded && (
              <Button variant="outlined" fullWidth onClick={restartMatch} sx={{ mt: 1 }}>
                Re-match?
              </Button>
            )}

            <Link
              to="/"
              className="dartGoHome"
              onClick={() => clearStorage(...DART_KEYS)}
            >
              Go Home
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
};
