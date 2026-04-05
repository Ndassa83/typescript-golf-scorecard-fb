import { useState, useEffect } from "react";
import { Firestore, collection, getDocs, query, where } from "firebase/firestore";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { Tournament, GolfRound, PlayerOptionType, Course } from "../../types";
import "../Tournament/Tournament.css";

type Props = {
  activeTournament: Tournament;
  playerRounds: GolfRound[];
  courseSelected: Course | null;
  playerOptions: PlayerOptionType[];
  database: Firestore;
};

type LeaderboardRow = {
  userId: number;
  name: string;
  totalScoreToPar: number;
  thru: number;
  holesInRound: number;
};

function formatStp(n: number): string {
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
}

const LiveTournamentLeaderboard = ({
  activeTournament,
  playerRounds,
  courseSelected,
  playerOptions,
  database,
}: Props) => {
  const [completedRounds, setCompletedRounds] = useState<GolfRound[]>([]);

  useEffect(() => {
    getDocs(
      query(
        collection(database, "playerData"),
        where("tournamentId", "==", activeTournament.tournamentId)
      )
    ).then((snap) => setCompletedRounds(snap.docs.map((d) => d.data() as GolfRound)));
  }, [activeTournament.tournamentId, database]);

  const holesInRound = courseSelected?.holes.length ?? 18;

  const rows: LeaderboardRow[] = activeTournament.participantIds
    .map((id) => {
      const player = playerOptions.find((p) => p.value.userId === id)?.value;
      const name = player?.userName ?? `Player ${id}`;

      // Sum all completed rounds for this tournament
      const completedForPlayer = completedRounds.filter((r) => r.userId === id);
      const completedStrokes = completedForPlayer.reduce(
        (sum, r) => sum + r.scores.reduce((a, b) => a + b, 0),
        0
      );
      const completedPar = completedForPlayer.reduce(
        (sum, r) => sum + r.currentCourse.totalPar,
        0
      );
      const completedStp = completedStrokes - completedPar;

      // Current in-progress round (only holes with a score entered)
      const liveRound = playerRounds.find((r) => r.userId === id);
      let liveStp = 0;
      let thru = 0;

      if (liveRound && courseSelected) {
        const playedHoles = liveRound.scores
          .map((score, holeIdx) => ({
            score,
            par: courseSelected.holes[holeIdx]?.par ?? 0,
          }))
          .filter(({ score }) => score > 0);

        thru = playedHoles.length;
        const liveStrokes = playedHoles.reduce((sum, { score }) => sum + score, 0);
        const livePar = playedHoles.reduce((sum, { par }) => sum + par, 0);
        liveStp = liveStrokes - livePar;
      }

      return {
        userId: id,
        name,
        totalScoreToPar: completedStp + liveStp,
        thru,
        holesInRound,
      };
    })
    .sort((a, b) => a.totalScoreToPar - b.totalScoreToPar);

  return (
    <div className="tournamentLiveLeaderboard" style={{ width: "100%" }}>
      <div className="tournamentLiveLeaderboardTitle">
        {activeTournament.name} — Live Standings
      </div>
      <table className="tournamentLiveTable">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Score</th>
            <th>Thru</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.userId} className={i === 0 ? "liveLeader" : ""}>
              <td>
                {i === 0 ? (
                  <EmojiEventsIcon
                    fontSize="inherit"
                    sx={{ color: "#d4af37", verticalAlign: "middle" }}
                  />
                ) : (
                  i + 1
                )}
              </td>
              <td>{row.name}</td>
              <td>{formatStp(row.totalScoreToPar)}</td>
              <td>
                {row.thru === 0
                  ? "—"
                  : row.thru === row.holesInRound
                  ? "F"
                  : row.thru}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LiveTournamentLeaderboard;
