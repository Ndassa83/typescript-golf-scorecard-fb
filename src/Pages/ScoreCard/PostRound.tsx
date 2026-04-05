import { useNavigate } from "react-router-dom";
import "firebase/firestore";
import { Firestore, CollectionReference, collection, addDoc, getDocs, updateDoc, increment, arrayUnion, query, where } from "firebase/firestore";
import { Alert, Button, Modal } from "@mui/material";
import { GolfRound, Course, Tournament, TournamentBadge, TournamentStandingRow, PlayerOptionType } from "../../types";
import { useState } from "react";
import dayjs from "dayjs";
import { clearStorage, GOLF_KEYS, STORAGE_KEYS, TOURNAMENT_KEYS } from "../../utils/localStorage";
import "./PostRound.css";

type PostRoundProps = {
  playerRounds: GolfRound[];
  setPlayerRounds: React.Dispatch<React.SetStateAction<GolfRound[]>>;
  database: Firestore;
  collectionRef: CollectionReference;
  courseSelected: Course | null;
  setCourseSelected: React.Dispatch<React.SetStateAction<Course | null>>;
  currentUserEmail: string | null;
  activeTournament: Tournament | null;
  setActiveTournament: React.Dispatch<React.SetStateAction<Tournament | null>>;
  playerOptions: PlayerOptionType[];
};

function buildStandings(
  rounds: GolfRound[],
  participantIds: number[],
  playerOptions: PlayerOptionType[]
): TournamentStandingRow[] {
  const map: Record<number, TournamentStandingRow> = {};
  participantIds.forEach((id) => {
    const player = playerOptions.find((p) => p.value.userId === id)?.value;
    if (player) {
      map[id] = { userId: id, name: player.userName, rounds: 0, totalStrokes: 0, totalPar: 0, scoreToPar: 0 };
    }
  });
  rounds.forEach((r) => {
    if (!map[r.userId]) return;
    map[r.userId].rounds += 1;
    map[r.userId].totalStrokes += r.scores.reduce((a, b) => a + b, 0);
    map[r.userId].totalPar += r.currentCourse.totalPar;
  });
  Object.values(map).forEach((row) => { row.scoreToPar = row.totalStrokes - row.totalPar; });
  return Object.values(map).sort((a, b) => a.scoreToPar - b.scoreToPar);
}

type ResultRow = {
  name: string;
  total: number;
  scoreToPar: number;
  courseAvg: number | null;
};

function formatPar(diff: number): string {
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function getCourseAvg(rounds: GolfRound[], userId: number, courseId: string): number | null {
  const relevant = rounds.filter(
    (r) => r.userId === userId && r.currentCourse.courseId === courseId
  );
  if (!relevant.length) return null;
  return (
    relevant.reduce(
      (sum, r) => sum + r.scores.reduce((a, b) => a + b, 0) - r.currentCourse.totalPar,
      0
    ) / relevant.length
  );
}

function buildShareText(results: ResultRow[], courseName: string): string {
  const date = new Date().toLocaleDateString();
  const header = `${courseName} — ${date}`;
  const rows = results.map((r) => {
    const parStr = formatPar(r.scoreToPar);
    const avgStr =
      r.courseAvg === null
        ? "First round on this course"
        : (() => {
            const delta = r.scoreToPar - r.courseAvg;
            const direction = delta <= 0 ? "better" : "worse";
            return `${Math.abs(delta).toFixed(1)} ${direction} than avg (avg: ${formatPar(Math.round(r.courseAvg))})`;
          })();
    return `${r.name}: ${r.total} shots (${parStr}) — ${avgStr}`;
  });
  return [header, ...rows].join("\n");
}

export const PostRound = ({
  playerRounds,
  collectionRef,
  courseSelected,
  setPlayerRounds,
  setCourseSelected,
  currentUserEmail,
  activeTournament,
  setActiveTournament,
  database,
  playerOptions,
}: PostRoundProps) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoCompletedId, setAutoCompletedId] = useState<string | null>(null);

  const postRound = async () => {
    if (!courseSelected) return;
    setPosting(true);
    setPostError(null);

    try {
      // Fetch historical rounds before adding new ones so avg excludes today's round
      const snapshot = await getDocs(collectionRef);
      const historical: GolfRound[] = snapshot.docs.map((d) => d.data() as GolfRound);

      const computed: ResultRow[] = playerRounds.map((player) => {
        const total = player.scores.reduce((a, b) => a + b, 0);
        const scoreToPar = total - courseSelected.totalPar;
        const courseAvg = getCourseAvg(historical, player.userId, courseSelected.courseId);
        return { name: player.name, total, scoreToPar, courseAvg };
      });

      await Promise.all(playerRounds.map((player) => addDoc(collectionRef, player)));

      // Clear storage immediately so a page-refresh can't re-post the same rounds
      clearStorage(...GOLF_KEYS, STORAGE_KEYS.GOLF_CURRENT_HOLE);

      // Increment tournament round count if this was a tournament round
      const tournamentId = playerRounds[0]?.tournamentId;
      if (tournamentId && activeTournament) {
        const tSnap = await getDocs(
          query(collection(database, "tournaments"), where("tournamentId", "==", tournamentId))
        );
        if (!tSnap.empty) {
          const newRoundCount = activeTournament.roundCount + 1;
          await updateDoc(tSnap.docs[0].ref, { roundCount: increment(1) });

          if (newRoundCount >= activeTournament.targetRounds) {
            // Auto-complete the tournament
            const allRoundsSnap = await getDocs(
              query(collection(database, "playerData"), where("tournamentId", "==", tournamentId))
            );
            const allRounds = allRoundsSnap.docs.map((d) => d.data() as GolfRound);
            const standings = buildStandings(allRounds, activeTournament.participantIds, playerOptions);
            const now = dayjs().toISOString();
            const lowestScore = standings[0]?.scoreToPar ?? 0;
            const tied = standings.filter((s) => s.scoreToPar === lowestScore);
            const maxRounds = Math.max(...tied.map((w) => w.rounds));
            const finalWinners = tied.filter((w) => w.rounds === maxRounds);

            await updateDoc(tSnap.docs[0].ref, {
              status: "completed",
              completedAt: now,
              winnerId: finalWinners[0].userId,
              winnerName: finalWinners.map((w) => w.name).join(", "),
            });

            const userListRef = collection(database, "userList");
            await Promise.all(
              finalWinners.map(async (w) => {
                const userSnap = await getDocs(
                  query(userListRef, where("userId", "==", w.userId))
                );
                if (!userSnap.empty) {
                  const badge: TournamentBadge = {
                    tournamentId: activeTournament.tournamentId,
                    tournamentName: activeTournament.name,
                    awardedAt: now,
                  };
                  await updateDoc(userSnap.docs[0].ref, { badges: arrayUnion(badge) });
                }
              })
            );

            setActiveTournament(null);
            clearStorage(...TOURNAMENT_KEYS);
            setAutoCompletedId(tournamentId);
          } else {
            setActiveTournament((prev) =>
              prev ? { ...prev, roundCount: newRoundCount } : prev
            );
          }
        }
      }

      setResults(computed);
      setModalOpen(true);
    } catch (err) {
      console.error("Failed to post round:", err);
      setPostError("Failed to save round. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const goHome = () => {
    setPlayerRounds([]);
    setCourseSelected(null);
    clearStorage(...GOLF_KEYS, STORAGE_KEYS.GOLF_CURRENT_HOLE);
    if (autoCompletedId) {
      navigate(`/Tournament/Standings/${autoCompletedId}`);
    } else if (playerRounds[0]?.tournamentId) {
      navigate("/Tournament");
    } else {
      navigate("/");
    }
  };

  const shareText = courseSelected
    ? buildShareText(results, courseSelected.courseName)
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      console.error("Clipboard write failed");
    });
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Golf Round — ${courseSelected?.courseName ?? ""}`);
    const body = encodeURIComponent(shareText);
    const to = currentUserEmail ? encodeURIComponent(currentUserEmail) : "";
    window.open(`mailto:${to}?subject=${subject}&body=${body}`);
  };

  const isPostDisabled = playerRounds.some(
    (player) => player.scores.length !== player.currentCourse.holes.length
  );

  if (playerRounds.length === 0) return <div />;

  return (
    <div>
      <Button className="button" disabled={isPostDisabled || posting} onClick={postRound}>
        {posting ? "Posting..." : "Post Round"}
      </Button>
      {postError && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setPostError(null)}>
          {postError}
        </Alert>
      )}

      <Modal open={modalOpen}>
        <div className="modalContainer">
          <div className="modalContent">
            <h2 className="postRoundTitle">Round Complete</h2>
            <p className="postRoundCourse">{courseSelected?.courseName}</p>

            <table className="postRoundTable">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Score</th>
                  <th>+/- Par</th>
                  <th>vs Course Avg</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const delta = r.courseAvg !== null ? r.scoreToPar - r.courseAvg : null;
                  return (
                    <tr key={r.name}>
                      <td>{r.name}</td>
                      <td>{r.total}</td>
                      <td
                        className={
                          r.scoreToPar < 0
                            ? "under-par"
                            : r.scoreToPar > 0
                            ? "over-par"
                            : ""
                        }
                      >
                        {formatPar(r.scoreToPar)}
                      </td>
                      <td>
                        {r.courseAvg === null ? (
                          <span className="first-round">First round here</span>
                        ) : (
                          <span className={delta! <= 0 ? "better-avg" : "worse-avg"}>
                            {Math.abs(delta!).toFixed(1)}{" "}
                            {delta! <= 0 ? "better" : "worse"} than avg (
                            {formatPar(Math.round(r.courseAvg))})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="shareButtons">
              <Button variant="outlined" size="small" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy Results"}
              </Button>
              <Button variant="outlined" size="small" onClick={handleEmail}>
                Email Results
              </Button>
            </div>

            <Button variant="contained" className="goHomeBtn" onClick={goHome}>
              {autoCompletedId ? "🏆 View Tournament Results" : "Go Home"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
