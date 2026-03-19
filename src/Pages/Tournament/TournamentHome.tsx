import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import {
  CollectionReference,
  Firestore,
  collection,
  setDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  deleteField,
  arrayUnion,
  query,
  where,
} from "firebase/firestore";
import { User } from "firebase/auth";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import dayjs from "dayjs";
import {
  Tournament,
  TournamentBadge,
  TournamentStandingRow,
  PlayerOptionType,
  CourseOptionType,
  GolfRound,
} from "../../types";
import { clearStorage, TOURNAMENT_KEYS } from "../../utils/localStorage";
import { BackyardTourneyLogo } from "../../components/BackyardTourneyLogo";
import AvatarIcon from "../../components/Avatar/AvatarIcon";
import "./Tournament.css";

type TournamentHomeProps = {
  activeTournament: Tournament | null;
  setActiveTournament: React.Dispatch<React.SetStateAction<Tournament | null>>;
  tournamentCollection: CollectionReference;
  playerOptions: PlayerOptionType[];
  courseOptions: CourseOptionType[];
  currentUser: User | null;
  database: Firestore;
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
      map[id] = {
        userId: id,
        name: player.userName,
        rounds: 0,
        totalStrokes: 0,
        totalPar: 0,
        scoreToPar: 0,
      };
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

const TournamentHome = ({
  activeTournament,
  setActiveTournament,
  tournamentCollection,
  playerOptions,
  courseOptions,
  currentUser,
  database,
}: TournamentHomeProps) => {
  const navigate = useNavigate();

  // Create form state
  const [name, setName] = useState("");
  const [targetRounds, setTargetRounds] = useState(3);
  const [selectedParticipants, setSelectedParticipants] = useState<PlayerOptionType[]>([]);
  const [selectedCourseOption, setSelectedCourseOption] = useState<CourseOptionType | null>(null);
  const [creating, setCreating] = useState(false);

  // Join form state
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [joinSelected, setJoinSelected] = useState<{ label: string; value: Tournament } | null>(null);

  // Completed tournaments for history
  const [completedTournaments, setCompletedTournaments] = useState<Tournament[]>([]);

  // Live leaderboard for active tournament
  const [liveStandings, setLiveStandings] = useState<TournamentStandingRow[]>([]);

  // Complete state
  const [completing, setCompleting] = useState(false);

  // Abandon state
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [abandonError, setAbandonError] = useState(false);

  // Fetch active + completed tournaments
  useEffect(() => {
    getDocs(query(tournamentCollection, where("status", "==", "active"))).then(
      (snap) => {
        setActiveTournaments(snap.docs.map((d) => d.data() as Tournament));
      }
    );
    getDocs(query(tournamentCollection, where("status", "==", "completed"))).then(
      (snap) => {
        const sorted = snap.docs
          .map((d) => d.data() as Tournament)
          .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
        setCompletedTournaments(sorted);
      }
    );
  }, []);

  // Fetch live standings for active tournament
  useEffect(() => {
    if (!activeTournament) {
      setLiveStandings([]);
      return;
    }
    const playerDataRef = collection(database, "playerData");
    getDocs(
      query(playerDataRef, where("tournamentId", "==", activeTournament.tournamentId))
    ).then((snap) => {
      const rounds = snap.docs.map((d) => d.data() as GolfRound);
      setLiveStandings(buildStandings(rounds, activeTournament.participantIds, playerOptions));
    });
  }, [activeTournament?.tournamentId, playerOptions.length]);

  const handleCreate = async () => {
    if (!name.trim() || selectedParticipants.length === 0) return;
    setCreating(true);
    const tournamentId = `tourn_${Date.now()}`;
    const now = dayjs().toISOString();
    const newTournament: Tournament = {
      tournamentId,
      name: name.trim(),
      status: "active",
      createdBy: currentUser?.uid ?? "",
      createdAt: now,
      completedAt: null,
      participantIds: selectedParticipants.map((p) => p.value.userId),
      roundCount: 0,
      targetRounds,
      lockedCourseId: selectedCourseOption?.value.courseId ?? null,
      lockedCourseName: selectedCourseOption?.value.courseName ?? null,
      winnerId: null,
      winnerName: null,
    };
    await setDoc(doc(tournamentCollection, tournamentId), newTournament);
    setActiveTournament(newTournament);
    setCreating(false);
    navigate("/Golf");
  };

  const handleJoin = () => {
    if (!joinSelected) return;
    setActiveTournament(joinSelected.value);
  };

  const handleAbandon = async () => {
    if (!activeTournament) return;
    setAbandoning(true);
    setAbandonError(false);
    try {
      // Step 1: disassociate all saved rounds
      const playerDataRef = collection(database, "playerData");
      const roundsSnap = await getDocs(
        query(playerDataRef, where("tournamentId", "==", activeTournament.tournamentId))
      );
      await Promise.all(
        roundsSnap.docs.map((d) => updateDoc(d.ref, { tournamentId: deleteField() }))
      );

      // Step 2: delete tournament document (only after rounds are clean)
      const tSnap = await getDocs(
        query(tournamentCollection, where("tournamentId", "==", activeTournament.tournamentId))
      );
      if (!tSnap.empty) {
        await deleteDoc(tSnap.docs[0].ref);
      }

      // Step 3: clear local state
      setActiveTournament(null);
      clearStorage(...TOURNAMENT_KEYS);
      setShowAbandonModal(false);
    } catch {
      setAbandonError(true);
    } finally {
      setAbandoning(false);
    }
  };

  const handleComplete = async () => {
    if (!activeTournament) return;
    setCompleting(true);
    try {
      const playerDataRef = collection(database, "playerData");
      const roundsSnap = await getDocs(
        query(playerDataRef, where("tournamentId", "==", activeTournament.tournamentId))
      );
      const rounds = roundsSnap.docs.map((d) => d.data() as GolfRound);
      const standings = buildStandings(rounds, activeTournament.participantIds, playerOptions);

      const now = dayjs().toISOString();
      const lowestScore = standings[0]?.scoreToPar ?? 0;

      // Tied players at lowest score — prefer most rounds; if still tied, award both
      const tied = standings.filter((s) => s.scoreToPar === lowestScore);
      const maxRounds = Math.max(...tied.map((w) => w.rounds));
      const finalWinners = tied.filter((w) => w.rounds === maxRounds);

      // Find the tournament document by field (handles both setDoc and legacy addDoc tournaments)
      const tSnap = await getDocs(
        query(tournamentCollection, where("tournamentId", "==", activeTournament.tournamentId))
      );
      if (tSnap.empty) throw new Error("Tournament document not found");
      await updateDoc(tSnap.docs[0].ref, {
        status: "completed",
        completedAt: now,
        winnerId: finalWinners[0].userId,
        winnerName: finalWinners.map((w) => w.name).join(", "),
      });

      // Award badge to all final winners
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

      const completedId = activeTournament.tournamentId;
      setActiveTournament(null);
      clearStorage(...TOURNAMENT_KEYS);
      navigate("/Tournament/Standings/" + completedId);
    } finally {
      setCompleting(false);
    }
  };

  const isCreator = currentUser?.uid === activeTournament?.createdBy;
  const roundsComplete =
    activeTournament
      ? activeTournament.roundCount >= activeTournament.targetRounds
      : false;

  const progressPct = activeTournament
    ? Math.min(100, (activeTournament.roundCount / activeTournament.targetRounds) * 100)
    : 0;

  if (activeTournament) {
    return (
      <div className="tournamentPage">
        <BackyardTourneyLogo className="gameLogo" />

        <div className="tournamentPanel tournamentActivePanel">
          <h2 className="tournamentActiveName">{activeTournament.name}</h2>

          {/* Participant avatars */}
          <div className="tournamentAvatarRow">
            {activeTournament.participantIds.map((id) => {
              const player = playerOptions.find((p) => p.value.userId === id)?.value;
              return (
                <div key={id} className="tournamentAvatarItem">
                  <AvatarIcon
                    avatarId={player?.avatar}
                    size={44}
                    initials={player?.userName ?? String(id)}
                  />
                  <span className="tournamentAvatarName">{player?.userName ?? id}</span>
                </div>
              );
            })}
          </div>

          {/* Round progress bar */}
          <div className="tournamentProgressSection">
            <div className="tournamentProgressLabel">
              <span>Rounds</span>
              <span className="tournamentProgressCount">
                {activeTournament.roundCount} / {activeTournament.targetRounds}
              </span>
            </div>
            <div className="tournamentProgressBar">
              <div
                className="tournamentProgressFill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {activeTournament.lockedCourseName && (
            <div className="tournamentLockedCourseChip">
              📍 {activeTournament.lockedCourseName} (locked)
            </div>
          )}

          {/* Live leaderboard */}
          {liveStandings.length > 0 && (
            <div className="tournamentLiveLeaderboard">
              <div className="tournamentLiveLeaderboardTitle">Live Standings</div>
              <table className="tournamentLiveTable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Rds</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {liveStandings.map((row, i) => (
                    <tr key={row.userId} className={i === 0 && row.rounds > 0 ? "liveLeader" : ""}>
                      <td>
                        {i === 0 && row.rounds > 0
                          ? <EmojiEventsIcon fontSize="inherit" sx={{ color: "#d4af37", verticalAlign: "middle" }} />
                          : i + 1}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <AvatarIcon
                            avatarId={playerOptions.find((p) => p.value.userId === row.userId)?.value.avatar}
                            size={22}
                            initials={row.name}
                          />
                          {row.name}
                        </div>
                      </td>
                      <td>{row.rounds}</td>
                      <td>{row.rounds === 0 ? "—" : formatStp(row.scoreToPar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="tournamentActionRow">
            <Button
              variant="contained"
              size="large"
              disabled={roundsComplete}
              onClick={() => navigate("/Golf")}
              className="tournamentStartRoundBtn"
            >
              {roundsComplete ? "All Rounds Complete" : "⛳ Start Next Round"}
            </Button>
            <Button
              variant="outlined"
              component={Link}
              to={`/Tournament/Standings/${activeTournament.tournamentId}`}
            >
              More Details
            </Button>
            {isCreator && activeTournament.roundCount > 0 && (
              <Button
                variant={roundsComplete ? "contained" : "outlined"}
                color="success"
                startIcon={<EmojiEventsIcon />}
                disabled={completing}
                onClick={handleComplete}
              >
                {completing ? "Completing..." : "Complete Tournament"}
              </Button>
            )}
          </div>
        </div>

        <button
          className="tournamentAbandonLink"
          disabled={abandoning}
          onClick={() => { setAbandonError(false); setShowAbandonModal(true); }}
        >
          {abandoning ? "Abandoning..." : "Abandon tournament"}
        </button>

        <Dialog open={showAbandonModal} onClose={() => !abandoning && setShowAbandonModal(false)}>
          <DialogTitle>Abandon Tournament?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will permanently delete <strong>{activeTournament.name}</strong>. Rounds that
              have already been played will be kept but will no longer be associated with this
              tournament. This cannot be undone.
            </DialogContentText>
            {abandonError && (
              <DialogContentText color="error" sx={{ mt: 1 }}>
                Something went wrong. Please try again.
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAbandonModal(false)} disabled={abandoning}>
              Cancel
            </Button>
            <Button color="error" variant="contained" disabled={abandoning} onClick={handleAbandon}>
              {abandoning ? "Abandoning..." : "Abandon"}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="tournamentPage">
      <BackyardTourneyLogo className="gameLogo" />

      {/* Create new */}
      <div className="tournamentPanel">
        <h2 className="tournamentSubHeading">Create Tournament</h2>
        <div className="tournamentFormRow">
          <div>
            <label className="tournamentLabel">Tournament Name</label>
            <input
              className="tournamentInput"
              type="text"
              placeholder="e.g. Backyard Classic 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="tournamentLabel">Players</label>
            <Select
              isMulti
              options={playerOptions}
              value={selectedParticipants}
              onChange={(v) => setSelectedParticipants(v as PlayerOptionType[])}
              placeholder="Select players..."
            />
          </div>
          <div>
            <label className="tournamentLabel">Number of Rounds</label>
            <input
              className="tournamentNumberInput"
              type="number"
              min={1}
              max={4}
              value={targetRounds}
              onChange={(e) => setTargetRounds(Math.min(4, Math.max(1, Number(e.target.value))))}
            />
          </div>
          <div>
            <label className="tournamentLabel">Lock Course (optional)</label>
            <Select
              isClearable
              options={courseOptions}
              value={selectedCourseOption}
              onChange={(v) => setSelectedCourseOption(v as CourseOptionType | null)}
              placeholder="Any course allowed..."
            />
          </div>
        </div>
        <Button
          variant="contained"
          disabled={creating || !name.trim() || selectedParticipants.length === 0}
          onClick={handleCreate}
        >
          {creating ? "Creating..." : "Create & Start"}
        </Button>
      </div>

      {/* Join existing */}
      {activeTournaments.length > 0 && (
        <div className="tournamentPanel">
          <h2 className="tournamentSubHeading">Join Existing Tournament</h2>
          <div className="tournamentFormRow">
            <Select
              options={activeTournaments.map((t) => ({ label: t.name, value: t }))}
              value={joinSelected}
              onChange={(v) => setJoinSelected(v)}
              placeholder="Select a tournament..."
            />
          </div>
          <Button
            variant="outlined"
            disabled={!joinSelected}
            onClick={handleJoin}
          >
            Join
          </Button>
        </div>
      )}

      {/* Past tournaments history */}
      {completedTournaments.length > 0 && (
        <div className="tournamentHistorySection">
          <h2 className="tournamentSubHeading">Past Tournaments</h2>
          <div className="tournamentHistoryList">
            {completedTournaments.map((t) => (
              <Link
                key={t.tournamentId}
                to={`/Tournament/Standings/${t.tournamentId}`}
                className="tournamentHistoryCard"
              >
                <div className="tournamentHistoryCardTop">
                  <div className="tournamentHistoryCardMeta">
                    <span className="tournamentHistoryCardName">{t.name}</span>
                    <span className="tournamentHistoryCardDate">
                      {t.completedAt ? formatDate(t.completedAt) : ""} · {t.roundCount} round{t.roundCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="tournamentHistoryCardWinner">
                    <EmojiEventsIcon sx={{ color: "#d4af37", fontSize: 20 }} />
                    <span>{t.winnerName}</span>
                  </div>
                </div>
                <div className="tournamentHistoryCardAvatars">
                  {t.participantIds.map((id) => {
                    const player = playerOptions.find((p) => p.value.userId === id)?.value;
                    return (
                      <AvatarIcon
                        key={id}
                        avatarId={player?.avatar}
                        size={28}
                        initials={player?.userName ?? String(id)}
                      />
                    );
                  })}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentHome;
