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
  arrayUnion,
  query,
  where,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { Button } from "@mui/material";
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

  // Complete state
  const [completing, setCompleting] = useState(false);

  // Fetch active tournaments for the join dropdown
  useEffect(() => {
    getDocs(query(tournamentCollection, where("status", "==", "active"))).then(
      (snap) => {
        setActiveTournaments(snap.docs.map((d) => d.data() as Tournament));
      }
    );
  }, []);

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

  if (activeTournament) {
    return (
      <div className="tournamentPage">
        <h1 className="tournamentHeading">Tournament</h1>

        <div className="tournamentPanel">
          <h2 className="tournamentSubHeading">{activeTournament.name}</h2>
          <div className="tournamentInfoGrid">
            <span className="tournamentInfoLabel">Status</span>
            <span>
              <span className={`tournamentStatusBadge ${activeTournament.status}`}>
                {activeTournament.status}
              </span>
            </span>
            <span className="tournamentInfoLabel">Rounds</span>
            <span className="tournamentInfoValue">
              {activeTournament.roundCount} of {activeTournament.targetRounds}
            </span>
            {activeTournament.lockedCourseName && (
              <>
                <span className="tournamentInfoLabel">Course</span>
                <span className="tournamentInfoValue">
                  {activeTournament.lockedCourseName} (locked)
                </span>
              </>
            )}
            <span className="tournamentInfoLabel">Players</span>
            <span className="tournamentInfoValue">
              {activeTournament.participantIds
                .map(
                  (id) =>
                    playerOptions.find((p) => p.value.userId === id)?.value
                      .userName ?? id
                )
                .join(", ")}
            </span>
          </div>

          <div className="tournamentActionRow">
            <Button
              variant="contained"
              component={Link}
              to={`/Tournament/Standings/${activeTournament.tournamentId}`}
            >
              View Standings
            </Button>
            <Button
              variant="outlined"
              disabled={roundsComplete}
              onClick={() => navigate("/Golf")}
            >
              {roundsComplete ? "All Rounds Complete" : "Start Next Round"}
            </Button>
            {isCreator && (
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
      </div>
    );
  }

  return (
    <div className="tournamentPage">
      <h1 className="tournamentHeading">Tournament</h1>

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
              value={targetRounds}
              onChange={(e) => setTargetRounds(Math.max(1, Number(e.target.value)))}
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
    </div>
  );
};

export default TournamentHome;
