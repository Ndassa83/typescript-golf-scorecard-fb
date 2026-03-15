import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { Button } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { Tournament, TournamentStandingRow, PlayerOptionType, GolfRound } from "../../types";
import { ScoreCardTable } from "../ScoreCard/ScoreCardTable";
import "./Tournament.css";

type TournamentStandingsProps = {
  database: Firestore;
  playerOptions: PlayerOptionType[];
};

function formatStp(n: number): string {
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
  Object.values(map).forEach((row) => {
    row.scoreToPar = row.totalStrokes - row.totalPar;
  });
  return Object.values(map).sort((a, b) => a.scoreToPar - b.scoreToPar);
}

// Group rounds into sessions: all players in one round share the exact same timestamp
function groupRoundsBySession(rounds: GolfRound[]): { date: string; rounds: GolfRound[] }[] {
  const map: Record<string, GolfRound[]> = {};
  const order: string[] = [];
  rounds.forEach((r) => {
    if (!map[r.date]) {
      map[r.date] = [];
      order.push(r.date);
    }
    map[r.date].push(r);
  });
  return order
    .sort((a, b) => a.localeCompare(b))
    .map((date) => ({ date, rounds: map[date].sort((a, b) => a.userId - b.userId) }));
}

const TournamentStandings = ({ database, playerOptions }: TournamentStandingsProps) => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [rounds, setRounds] = useState<GolfRound[]>([]);
  const [standings, setStandings] = useState<TournamentStandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionIndex, setSessionIndex] = useState(0);

  const fetchData = async () => {
    if (!tournamentId) return;
    setLoading(true);
    const tSnap = await getDocs(
      query(collection(database, "tournaments"), where("tournamentId", "==", tournamentId))
    );
    if (tSnap.empty) { setLoading(false); return; }
    const t = tSnap.docs[0].data() as Tournament;
    setTournament(t);

    const roundsSnap = await getDocs(
      query(collection(database, "playerData"), where("tournamentId", "==", tournamentId))
    );
    const fetchedRounds = roundsSnap.docs.map((d) => d.data() as GolfRound);
    setRounds(fetchedRounds);
    setStandings(buildStandings(fetchedRounds, t.participantIds, playerOptions));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tournamentId, playerOptions.length]);

  if (loading) return <div className="tournamentStandingsPage"><p>Loading...</p></div>;
  if (!tournament) return <div className="tournamentStandingsPage"><p>Tournament not found.</p></div>;

  const sessions = groupRoundsBySession(rounds);

  return (
    <div className="tournamentStandingsPage">
      <h1 className="tournamentHeading">{tournament.name}</h1>

      {tournament.status === "completed" && (
        <div className="tournamentWinnerBanner">
          <span className="tournamentWinnerTrophy">🏆</span>
          <div>
            <div className="tournamentWinnerTitle">Tournament Winner</div>
            <div className="tournamentWinnerName">{tournament.winnerName}</div>
          </div>
        </div>
      )}

      {/* Summary standings */}
      {standings.length > 0 && (
        <div className="tournamentSummarySection">
          <h2 className="tournamentSubHeading">Summary</h2>
          <table className="tournamentStandingsTable">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Rounds</th>
                <th>Total</th>
                <th>Score to Par</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr key={row.userId} className={i === 0 && row.rounds > 0 ? "leader" : ""}>
                  <td>
                    {row.rounds === 0 ? "—" : (
                      <>
                        {i === 0 && <EmojiEventsIcon fontSize="inherit" sx={{ color: "#d4af37", verticalAlign: "middle", mr: 0.5 }} />}
                        {i + 1}
                      </>
                    )}
                  </td>
                  <td>{row.name}</td>
                  <td>{row.rounds} / {tournament.targetRounds}</td>
                  <td>{row.totalStrokes > 0 ? row.totalStrokes : "—"}</td>
                  <td>{row.rounds === 0 ? "—" : formatStp(row.scoreToPar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Round-by-round scorecards */}
      {sessions.length > 0 && (
        <div className="tournamentRoundsSection">
          <h2 className="tournamentSubHeading">Rounds</h2>
          <div className="tournamentRoundNav">
            <button
              className="tournamentRoundNavBtn"
              onClick={() => setSessionIndex((i) => Math.max(0, i - 1))}
              disabled={sessionIndex === 0}
            >
              &#8592;
            </button>
            <span className="tournamentRoundNavLabel">
              Round {sessionIndex + 1} of {sessions.length}
            </span>
            <button
              className="tournamentRoundNavBtn"
              onClick={() => setSessionIndex((i) => Math.min(sessions.length - 1, i + 1))}
              disabled={sessionIndex === sessions.length - 1}
            >
              &#8594;
            </button>
          </div>
          {(() => {
            const session = sessions[sessionIndex];
            return (
              <div className="tournamentRoundBlock">
                <div className="tournamentRoundLabel">
                  {formatDate(session.date)}
                  {session.rounds[0]?.currentCourse?.courseName && (
                    <span className="tournamentRoundCourse">
                      {" · "}{session.rounds[0].currentCourse.courseName}
                    </span>
                  )}
                </div>
                <ScoreCardTable
                  courseSelected={session.rounds[0].currentCourse}
                  playerRounds={session.rounds}
                />
              </div>
            );
          })()}
        </div>
      )}

      {rounds.length === 0 && (
        <p className="tournamentNoRounds">No rounds played yet.</p>
      )}

      <div className="tournamentStandingsFooter">
        <Button size="small" variant="outlined" onClick={fetchData}>
          Refresh
        </Button>
        <Button component={Link} to="/Tournament" variant="text" size="small">
          ← Back to Tournament
        </Button>
      </div>
    </div>
  );
};

export default TournamentStandings;
