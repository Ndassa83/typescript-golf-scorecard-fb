import { useNavigate } from "react-router-dom";
import "firebase/firestore";
import { Firestore, CollectionReference, collection, addDoc, getDocs, doc, updateDoc, increment, query, where } from "firebase/firestore";
import { Button, Modal } from "@mui/material";
import { GolfRound, Course, Tournament } from "../../types";
import { useState } from "react";
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
};

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
}: PostRoundProps) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [posting, setPosting] = useState(false);
  const [copied, setCopied] = useState(false);

  const postRound = async () => {
    if (!courseSelected) return;
    setPosting(true);

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
    if (tournamentId) {
      const tSnap = await getDocs(
        query(collection(database, "tournaments"), where("tournamentId", "==", tournamentId))
      );
      if (!tSnap.empty) {
        await updateDoc(tSnap.docs[0].ref, { roundCount: increment(1) });
        setActiveTournament((prev) =>
          prev ? { ...prev, roundCount: prev.roundCount + 1 } : prev
        );
      }
    }

    setResults(computed);
    setPosting(false);
    setModalOpen(true);
  };

  const goHome = () => {
    const isTournament = !!playerRounds[0]?.tournamentId;
    setPlayerRounds([]);
    setCourseSelected(null);
    clearStorage(...GOLF_KEYS, STORAGE_KEYS.GOLF_CURRENT_HOLE);
    navigate(isTournament ? "/Tournament" : "/");
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
              Go Home
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
