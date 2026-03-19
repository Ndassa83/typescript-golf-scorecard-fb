import { DartRound, PlayerOptionType } from "../../types";
import AvatarIcon from "../../components/Avatar/AvatarIcon";
import "./ScoreCardTable.css";
import "./DartScoreCard.css";
import "./TossInput.css";
import { useEffect, useState } from "react";
import { PostDartRoundModal } from "./PostDartRoundModal";
import { CollectionReference } from "firebase/firestore";
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

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
  checkIfWinner: (games?: DartRound[]) => void;
  currentUserEmail: string | null;
  playerOptions?: PlayerOptionType[];
  tiebreakerWinners: Record<number, number>;
  setTiebreakerWinners: React.Dispatch<React.SetStateAction<Record<number, number>>>;
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
  tiebreakerWinners,
  setTiebreakerWinners,
}: DartScoreCardTableProps) => {
  function add(accumulator: number, a: number) {
    return accumulator + a;
  }

  // Accept an optional games array so callers can pass updated data before state settles
  const compareScores = (beg: number, end: number, games = curPlayerGames): number | null => {
    let maxScore = -Infinity;
    let maxIndex: number | null = null;
    games.forEach((player, index) => {
      const slice = player.scores.slice(beg, end);
      const totalScore = slice
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

  // Recompute gameWins for all completed sets from scratch (idempotent on refresh/StrictMode).
  // Accepts optional games + tbWinners so edit handler can pass updated data immediately.
  const recomputeAllGameWins = (
    upToToss: number,
    games = curPlayerGames,
    tbWinners = tiebreakerWinners
  ): DartRound[] => {
    const completedSets = Math.floor(upToToss / 3);
    const newWins = games.map(() => 0);
    for (let s = 0; s < completedSets; s++) {
      const w = compareScores(s * 3, s * 3 + 3, games);
      if (w !== null) {
        newWins[w]++;
      } else if (tbWinners[s] !== undefined) {
        newWins[tbWinners[s]]++;
      }
    }
    const updatedGames = games.map((p, i) => ({ ...p, gameWins: newWins[i] }));
    setCurPlayerGames(updatedGames);
    return updatedGames;
  };

  useEffect(() => {
    if (currentToss === 0 || currentToss % 3 !== 0) return;

    const lastSetIdx = Math.floor(currentToss / 3) - 1;
    const winnerIndex = compareScores(currentToss - 3, currentToss);
    let totalInputs = 0;
    curPlayerGames.forEach((player) => (totalInputs += player.scores.length));

    const updatedGames = recomputeAllGameWins(currentToss);

    if (curGameType === "Solo" && currentToss >= 9) {
      checkIfWinner(updatedGames);
    } else if (winnerIndex === null) {
      if (tiebreakerWinners[lastSetIdx] === undefined) {
        setTieBreaker(true);
      }
    } else if (totalInputs === curPlayerGames.length * gameLength) {
      checkIfWinner(updatedGames);
    }
  }, [currentToss]);

  // ── Edit score state ──────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<{ tossIdx: number; playerIdx: number } | null>(null);
  const [editValues, setEditValues] = useState<number[]>([]);

  const openEdit = (tossIdx: number, playerIdx: number) => {
    const existing = curPlayerGames[playerIdx]?.scores[tossIdx]?.values ?? [];
    setEditValues(existing);
    setEditTarget({ tossIdx, playerIdx });
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditValues([]);
  };

  const handleEditSubmit = () => {
    if (!editTarget) return;
    const { tossIdx, playerIdx } = editTarget;

    // Build updated games with new values
    const updatedGames = curPlayerGames.map((player, i) => {
      if (i !== playerIdx) return player;
      const newScores = [...player.scores];
      newScores[tossIdx] = { ...newScores[tossIdx], values: editValues };
      return { ...player, scores: newScores };
    });

    // If the edited set was previously a tiebreaker but now has a clear winner, clear it
    const editedSetIdx = Math.floor(tossIdx / 3);
    const editedSetWinner = compareScores(
      editedSetIdx * 3,
      editedSetIdx * 3 + 3,
      updatedGames
    );
    let newTbWinners = tiebreakerWinners;
    if (editedSetWinner !== null && tiebreakerWinners[editedSetIdx] !== undefined) {
      newTbWinners = { ...tiebreakerWinners };
      delete newTbWinners[editedSetIdx];
      setTiebreakerWinners(newTbWinners);
    }

    // Recompute all wins from the fresh data immediately (avoids stale closure)
    recomputeAllGameWins(currentToss, updatedGames, newTbWinners);

    closeEdit();
  };

  // ── Set navigation ────────────────────────────────────────────────
  const currentSetIdx = Math.floor(currentToss / 3);
  const lastCompletedSetIdx = Math.ceil(currentToss / 3) - 1;
  const [viewedSetIdx, setViewedSetIdx] = useState(currentSetIdx);
  const [navDirection, setNavDirection] = useState<"back" | "forward" | null>(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setNavDirection("forward");
    setAnimKey((k) => k + 1);
    setViewedSetIdx(currentSetIdx);
  }, [currentSetIdx]);

  const goBack = () => {
    setNavDirection("back");
    setAnimKey((k) => k + 1);
    setViewedSetIdx((v) => v - 1);
  };

  const goForward = () => {
    setNavDirection("forward");
    setAnimKey((k) => k + 1);
    setViewedSetIdx((v) => v + 1);
  };

  const setIdx = viewedSetIdx;
  const setStart = setIdx * 3;
  const isComplete = currentToss >= setStart + 3;
  const isActive = !isComplete && setIdx === currentSetIdx;
  const setWinnerIndex = isComplete ? compareScores(setStart, setStart + 3) : null;

  const rw = curPlayerGames.map(() => 0);
  for (let s = 0; s <= setIdx; s++) {
    if (currentToss >= (s + 1) * 3) {
      const w = compareScores(s * 3, s * 3 + 3);
      if (w !== null) rw[w]++;
    }
  }
  if (isComplete && setIdx === lastCompletedSetIdx) {
    curPlayerGames.forEach((p, i) => { rw[i] = p.gameWins; });
  }

  return (
    <div>
      <div className="setNavRow">
        {viewedSetIdx > 0 ? (
          <IconButton className="setNavArrow" onClick={goBack}>
            <ArrowBackIosIcon fontSize="medium" />
          </IconButton>
        ) : (
          <span className="setNavSpacer" />
        )}

        <div
          key={animKey}
          className={`setCard${isActive ? " setCardActive" : ""}${navDirection === "back" ? " setNavSlideBack" : navDirection === "forward" ? " setNavSlideForward" : ""}`}
        >
          <div className="setCardHeader">Set {setIdx + 1}</div>
          <div className="setCardTable">
            {/* Label column */}
            <div className="titles">
              <div className="cell cellTitles">Toss</div>
              {curPlayerGames.map((player) => {
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

            {/* 3 toss columns */}
            {[0, 1, 2].map((offset) => {
              const tossIdx = setStart + offset;
              const isCurrent = tossIdx === currentToss;
              return (
                <div key={offset} className="cellInfo">
                  <div className={`cell${isCurrent ? " currentHole" : ""}`}>
                    {tossIdx + 1}
                  </div>
                  {curPlayerGames.map((player, playerIdx) => {
                    const vals = player.scores[tossIdx]?.values ?? [];
                    const hundreds = vals.filter((v) => v === 100).length;
                    const fifties = vals.filter((v) => v === 50).length;
                    const isEditable = !isCurrent && vals.length > 0;
                    return (
                      <div
                        key={player.userId}
                        className={`cell scores${isCurrent ? " currentHole" : ""}${isEditable ? " editableCell" : ""}`}
                        onClick={isEditable ? () => openEdit(tossIdx, playerIdx) : undefined}
                      >
                        {(hundreds > 0 || fifties > 0) && (
                          <div className="scoreCircles">
                            {Array.from({ length: hundreds }).map((_, i) => (
                              <span key={`h${i}`} className="scoreCircle100" />
                            ))}
                            {Array.from({ length: fifties }).map((_, i) => (
                              <span key={`f${i}`} className="scoreCircle50" />
                            ))}
                          </div>
                        )}
                        {vals.length > 0 ? vals.reduce(add, 0) : ""}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Set total column */}
            <div className="cellInfo">
              <div className="cell totals">Total</div>
              {curPlayerGames.map((player) => {
                const setTotal = player.scores
                  .slice(setStart, setStart + 3)
                  .flatMap((s) => s.values)
                  .reduce((sum, v) => sum + v, 0);
                return (
                  <div key={player.userId} className="cell scores totals">
                    {setTotal > 0 ? setTotal : ""}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Winner strip for completed sets */}
          {isComplete && (
            <div className="setWinnerStrip">
              {setWinnerIndex !== null ? (
                <span className="setWinnerName">
                  {curPlayerGames[setWinnerIndex].name} wins
                </span>
              ) : tiebreakerWinners[setIdx] !== undefined ? (
                <span className="setWinnerName">
                  {curPlayerGames[tiebreakerWinners[setIdx]].name} wins
                </span>
              ) : (
                <span>Tiebreaker</span>
              )}
            </div>
          )}
        </div>

        {viewedSetIdx < currentSetIdx ? (
          <IconButton className="setNavArrow" onClick={goForward}>
            <ArrowForwardIosIcon fontSize="medium" />
          </IconButton>
        ) : (
          <span className="setNavSpacer" />
        )}
      </div>

      {/* ── Edit Score Dialog ─────────────────────────────────────── */}
      <Dialog open={editTarget !== null} onClose={closeEdit} PaperProps={{ className: "editScoreDialog" }}>
        <DialogTitle className="editScoreTitle">
          Edit Toss {editTarget ? editTarget.tossIdx + 1 : ""}
          {editTarget ? ` — ${curPlayerGames[editTarget.playerIdx]?.name}` : ""}
        </DialogTitle>
        <DialogContent className="editScoreContent">
          <div className="tossGrid" style={{ maxWidth: 260, margin: "0 auto" }}>
            {[0, 5, 10, 20, 50, 100].map((val) => {
              const count = editValues.filter((v) => v === val).length;
              return (
                <button
                  key={val}
                  className="tossBtn"
                  disabled={editValues.length >= 7}
                  onClick={() => setEditValues((prev) => [...prev, val])}
                >
                  <span className="tossBtnValue">{val}</span>
                  {count > 0 && <span className="tossBtnCount">×{count}</span>}
                </button>
              );
            })}
          </div>
          <div className="tossTotalDisplay" style={{ marginTop: 12 }}>
            {editValues.length > 0 ? editValues.reduce((a, b) => a + b, 0) : 0}
            <span className="tossTotalSub"> ({editValues.length}/7)</span>
          </div>
        </DialogContent>
        <DialogActions className="editScoreActions">
          <button
            className="tossActionBtn tossClearBtn"
            disabled={editValues.length === 0}
            onClick={() => setEditValues([])}
          >
            Clear
          </button>
          <button
            className="tossActionBtn tossSubmitBtn"
            disabled={editValues.length !== 7}
            onClick={handleEditSubmit}
          >
            Save
          </button>
        </DialogActions>
      </Dialog>

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
