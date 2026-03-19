import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Firestore,
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { User } from "firebase/auth";
import { Button, Tabs, Tab, useMediaQuery } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Select from "react-select";
import {
  GolfRound,
  DartRound,
  PlayerOptionType,
  TournamentBadge,
  Tournament,
} from "../../types";
import { GolfRoundModal } from "./GolfRoundModal";
import { DartRoundModal } from "./DartRoundModal";
import {
  tossSum,
  getTossHighScore,
  getSetHighScore,
  getSoloHighScore,
  getThrowMap,
} from "../../utils/dartStatHelpers";
import { ThrowPieChart } from "../../components/ThrowPieChart";
import { AdminPanel } from "./AdminPanel";
import AvatarIcon from "../../components/Avatar/AvatarIcon";
import AvatarPicker from "../../components/Avatar/AvatarPicker";
import { getH2HForPlayer, getDartH2HForPlayer, H2HRecord } from "../../utils/h2hHelpers";
import ScoreTrendChart from "../../components/ScoreTrendChart";
import { getParTypeAvgs, calculateHandicapIndex } from "../../utils/handicapHelpers";
import "./Dashboard.css";

const courseSelectStyles = {
  control: (base: React.CSSProperties) => ({
    ...base,
    borderColor: "#d8eed8",
    borderWidth: 2,
    borderRadius: 8,
    minHeight: 34,
    fontSize: 13,
    boxShadow: "none",
    "&:hover": { borderColor: "var(--green-primary)" },
  }),
  option: (
    base: React.CSSProperties,
    state: { isSelected: boolean; isFocused: boolean },
  ) => ({
    ...base,
    fontSize: 13,
    backgroundColor: state.isSelected
      ? "var(--green-primary)"
      : state.isFocused
        ? "#f0f9f0"
        : "white",
    color: state.isSelected ? "white" : "var(--text-dark)",
  }),
  placeholder: (base: React.CSSProperties) => ({
    ...base,
    fontSize: 13,
    color: "#aaa",
  }),
  singleValue: (base: React.CSSProperties) => ({ ...base, fontSize: 13 }),
};

type Props = {
  database: Firestore;
  playerOptions: PlayerOptionType[];
  currentUser: User | null;
  onSignIn: () => void;
  onUpdatePlayerAvatar: (userId: number, avatarId: string) => Promise<void>;
};

const formatScoreToPar = (diff: number): { text: string; cls: string } => {
  if (diff === 0) return { text: "E", cls: "even" };
  if (diff > 0) return { text: `+${diff}`, cls: "positive" };
  return { text: `${diff}`, cls: "negative" };
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const Dashboard = ({
  database,
  playerOptions,
  currentUser,
  onSignIn,
  onUpdatePlayerAvatar,
}: Props) => {
  const [golfRounds, setGolfRounds] = useState<GolfRound[]>([]);
  const [dartRounds, setDartRounds] = useState<DartRound[]>([]);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [myBadges, setMyBadges] = useState<TournamentBadge[]>([]);
  const [golfVisible, setGolfVisible] = useState(5);
  const [dartVisible, setDartVisible] = useState(5);
  const [activeTab, setActiveTab] = useState<"golf" | "darts">("golf");
  const [selectedGolfRound, setSelectedGolfRound] = useState<GolfRound | null>(
    null,
  );
  const [selectedDartRound, setSelectedDartRound] = useState<DartRound | null>(
    null,
  );
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [golfCourseFilter, setGolfCourseFilter] = useState<string | null>(null);
  const [golfDateFrom, setGolfDateFrom] = useState("");
  const [golfDateTo, setGolfDateTo] = useState("");
  const [rivalriesVisible, setRivalriesVisible] = useState(5);
  const [dartRivalriesVisible, setDartRivalriesVisible] = useState(5);

  const linkedPlayer = useMemo(
    () =>
      playerOptions.find((opt) => opt.value.googleUid === currentUser?.uid)
        ?.value ?? null,
    [currentUser, playerOptions],
  );

  const myGolfRounds = useMemo(
    () =>
      linkedPlayer
        ? golfRounds.filter((r) => r.userId === linkedPlayer.userId)
        : [],
    [golfRounds, linkedPlayer],
  );

  const myDartRounds = useMemo(
    () =>
      linkedPlayer
        ? dartRounds.filter((r) => r.userId === linkedPlayer.userId)
        : [],
    [dartRounds, linkedPlayer],
  );

  const golfCourseOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [];
    myGolfRounds.forEach((r) => {
      if (!seen.has(r.currentCourse.courseName)) {
        seen.add(r.currentCourse.courseName);
        opts.push({
          value: r.currentCourse.courseName,
          label: r.currentCourse.courseName,
        });
      }
    });
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [myGolfRounds]);

  const filteredGolfRounds = useMemo(() => {
    let rounds = myGolfRounds;
    if (golfCourseFilter) {
      rounds = rounds.filter(
        (r) => r.currentCourse.courseName === golfCourseFilter,
      );
    }
    if (golfDateFrom) {
      rounds = rounds.filter((r) => r.date >= golfDateFrom);
    }
    if (golfDateTo) {
      rounds = rounds.filter((r) => r.date <= golfDateTo);
    }
    return rounds;
  }, [myGolfRounds, golfCourseFilter, golfDateFrom, golfDateTo]);

  useEffect(() => {
    Promise.all([
      getDocs(
        query(collection(database, "playerData"), orderBy("date", "desc")),
      ),
      getDocs(
        query(collection(database, "dartRounds"), orderBy("date", "desc")),
      ),
      getDocs(
        query(
          collection(database, "tournaments"),
          orderBy("createdAt", "desc"),
        ),
      ),
    ]).then(([golfSnap, dartSnap, tournSnap]) => {
      setGolfRounds(golfSnap.docs.map((d) => d.data() as GolfRound));
      setDartRounds(dartSnap.docs.map((d) => d.data() as DartRound));
      setAllTournaments(tournSnap.docs.map((d) => d.data() as Tournament));
    });
  }, [database]);

  useEffect(() => {
    if (!linkedPlayer) return;
    getDocs(
      query(
        collection(database, "userList"),
        where("userId", "==", linkedPlayer.userId),
      ),
    ).then((snap) => {
      const data = snap.docs[0]?.data();
      setMyBadges(data?.badges ?? []);
    });
  }, [linkedPlayer?.userId]);

  const myTournaments = useMemo(
    () =>
      linkedPlayer
        ? allTournaments.filter((t) =>
            t.participantIds.includes(linkedPlayer.userId),
          )
        : [],
    [allTournaments, linkedPlayer],
  );

  const existingTournamentIds = useMemo(
    () => new Set(allTournaments.map((t) => t.tournamentId)),
    [allTournaments],
  );

  const tournamentMap = useMemo(
    () => Object.fromEntries(allTournaments.map((t) => [t.tournamentId, t])),
    [allTournaments],
  );

  // Map tournamentId → sorted unique session timestamps (all players in one round share the exact same timestamp)
  const tournamentSessionMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    golfRounds.forEach((r) => {
      if (r.tournamentId) {
        if (!map[r.tournamentId]) map[r.tournamentId] = [];
        if (!map[r.tournamentId].includes(r.date))
          map[r.tournamentId].push(r.date);
      }
    });
    Object.values(map).forEach((dates) => dates.sort());
    return map;
  }, [golfRounds]);

  const validBadges = useMemo(
    () => myBadges.filter((b) => existingTournamentIds.has(b.tournamentId)),
    [myBadges, existingTournamentIds],
  );

  // Golf stats
  const golfStats = useMemo(() => {
    if (!myGolfRounds.length) return null;
    let totalDiff = 0;
    let bestDiff = Infinity;
    const playerCount: Record<string, number> = {};
    myGolfRounds.forEach((r) => {
      const total = r.scores.reduce((a, b) => a + b, 0);
      const diff = total - r.currentCourse.totalPar;
      totalDiff += diff;
      if (diff < bestDiff) bestDiff = diff;
      playerCount[r.name] = (playerCount[r.name] ?? 0) + 1;
    });
    const mostActive =
      Object.entries(playerCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const avg = totalDiff / myGolfRounds.length;
    return { totalRounds: myGolfRounds.length, avg, bestDiff, mostActive };
  }, [myGolfRounds]);

  // Par-type averages (par-3, par-4, par-5)
  const parTypeAvgs = useMemo(() => {
    if (!linkedPlayer) return null;
    return getParTypeAvgs(golfRounds, linkedPlayer.userId);
  }, [golfRounds, linkedPlayer]);

  // Handicap Index
  const handicapIndex = useMemo(() => {
    if (!linkedPlayer) return null;
    return calculateHandicapIndex(golfRounds, linkedPlayer.userId);
  }, [golfRounds, linkedPlayer]);

  // H2H rivalries (computed from all rounds, not filtered)
  const rivalries = useMemo<H2HRecord[]>(() => {
    if (!linkedPlayer) return [];
    return getH2HForPlayer(golfRounds, linkedPlayer.userId, playerOptions);
  }, [golfRounds, linkedPlayer, playerOptions]);

  // Dart H2H rivalries
  const dartRivalries = useMemo<H2HRecord[]>(() => {
    if (!linkedPlayer) return [];
    return getDartH2HForPlayer(dartRounds, linkedPlayer.userId, playerOptions);
  }, [dartRounds, linkedPlayer, playerOptions]);

  // Dart stats
  const dartStats = useMemo(() => {
    if (!myDartRounds.length) return null;
    const matchRounds = myDartRounds.filter((r) => r.matchWinner !== null);
    const totalMatchWins = myDartRounds.filter(
      (r) => r.matchWinner === true,
    ).length;
    const matchWinPct =
      matchRounds.length > 0 ? (totalMatchWins / matchRounds.length) * 100 : 0;
    const totalGameWins = myDartRounds.reduce((sum, r) => sum + r.gameWins, 0);

    const allTosses = myDartRounds.flatMap((r) => r.scores);
    const totalTossCount = allTosses.length;
    const totalTossSum = allTosses.reduce((sum, t) => sum + tossSum(t), 0);
    const avgTossScore = totalTossCount > 0 ? totalTossSum / totalTossCount : 0;

    const allDartValues = myDartRounds.flatMap((r) =>
      r.scores.flatMap((t) => (Array.isArray(t.values) ? t.values : [])),
    );
    const totalDarts = allDartValues.length;
    const bullRate =
      totalDarts > 0
        ? (allDartValues.filter((v) => v === 50 || v === 100).length /
            totalDarts) *
          100
        : 0;
    const missRate =
      totalDarts > 0
        ? (allDartValues.filter((v) => v === 0).length / totalDarts) * 100
        : 0;

    // Win streaks sorted by date
    const sorted = [...myDartRounds].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    let longest = 0,
      current = 0;
    sorted.forEach((r) => {
      if (r.matchWinner === true) {
        current++;
        longest = Math.max(longest, current);
      } else if (r.matchWinner === false) {
        current = 0;
      }
    });

    const throwMap = getThrowMap(myDartRounds);
    const highScoreToss = getTossHighScore(myDartRounds);
    const highScoreSet = getSetHighScore(myDartRounds);
    const highScoreSolo = getSoloHighScore(myDartRounds);
    const hasSolo = myDartRounds.some((r) => r.gameType === "Solo");

    return {
      totalRounds: myDartRounds.length,
      totalMatchWins,
      matchWinPct,
      totalGameWins,
      highScoreToss,
      highScoreSet,
      highScoreSolo,
      hasSolo,
      avgTossScore,
      bullRate,
      missRate,
      longestWinStreak: longest,
      currentWinStreak: current,
      throwMap,
    };
  }, [myDartRounds]);

  const throwEntries = useMemo(() => {
    if (!dartStats) return [];
    return Array.from(dartStats.throwMap.entries());
  }, [dartStats]);

  const totalThrows = useMemo(
    () => throwEntries.reduce((sum, [, c]) => sum + c, 0),
    [throwEntries],
  );

  const golfCol = (
    <div className="dashboardCol">
      <div className="dashboardColTitle">Golf</div>

      {/* Summary stats */}
      <div className="dashboardStatCard">
        <div className="dashboardStatCardTitle">Summary</div>
        {golfStats ? (
          <div className="dashboardStatGrid">
            <span className="dashboardStatLabel">Rounds Played</span>
            <span className="dashboardStatValue">{golfStats.totalRounds}</span>
            <span className="dashboardStatLabel">Avg Score to Par</span>
            <span className="dashboardStatValue">
              {golfStats.avg >= 0
                ? `+${golfStats.avg.toFixed(1)}`
                : golfStats.avg.toFixed(1)}
            </span>
            <span className="dashboardStatLabel">Best Score to Par</span>
            <span className="dashboardStatValue">
              {formatScoreToPar(golfStats.bestDiff).text}
            </span>
            <span className="dashboardStatLabel">Handicap Index</span>
            <span className="dashboardStatValue">
              {handicapIndex !== null
                ? `${handicapIndex >= 0 ? "+" : ""}${handicapIndex}`
                : "—"}
            </span>
            {parTypeAvgs && parTypeAvgs.par3Avg !== null && (
              <>
                <span className="dashboardStatLabel">Avg on Par 3s</span>
                <span className="dashboardStatValue">{parTypeAvgs.par3Avg.toFixed(2)}</span>
              </>
            )}
            {parTypeAvgs && parTypeAvgs.par4Avg !== null && (
              <>
                <span className="dashboardStatLabel">Avg on Par 4s</span>
                <span className="dashboardStatValue">{parTypeAvgs.par4Avg.toFixed(2)}</span>
              </>
            )}
            {parTypeAvgs && parTypeAvgs.par5Avg !== null && (
              <>
                <span className="dashboardStatLabel">Avg on Par 5s</span>
                <span className="dashboardStatValue">{parTypeAvgs.par5Avg.toFixed(2)}</span>
              </>
            )}
          </div>
        ) : (
          <div className="noGames">No rounds recorded yet.</div>
        )}
        {validBadges.length > 0 && (
          <div className="dashboardTrophySection">
            <div className="dashboardTrophyTitle">Trophies</div>
            <div className="dashboardTrophyList">
              {validBadges.map((b) => (
                <div
                  key={b.tournamentId}
                  className="dashboardTrophyBadge"
                  title={`Won ${new Date(b.awardedAt).toLocaleDateString()}`}
                >
                  <EmojiEventsIcon fontSize="small" sx={{ color: "#d4af37" }} />
                  <span className="dashboardTrophyName">
                    {b.tournamentName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Score Trend Chart */}
      {linkedPlayer && myGolfRounds.length >= 2 && (
        <ScoreTrendChart
          rounds={golfRounds}
          playerId={linkedPlayer.userId}
          label="Score trend (5-round avg)"
        />
      )}

      {/* Rivalries */}
      {rivalries.length > 0 && (
        <div className="pastGamesCard">
          <div className="pastGamesTitle">Rivalries</div>
          {rivalries.slice(0, rivalriesVisible).map((r) => {
            const total = r.wins + r.losses + r.ties;
            return (
              <div key={r.opponentId} className="gameCard">
                <div className="gameCardLeft">
                  <span className="gameCardPlayer">
                    <AvatarIcon
                      avatarId={playerOptions.find((p) => p.value.userId === r.opponentId)?.value.avatar}
                      size={18}
                      initials={r.opponentName}
                    />
                    {" "}{r.opponentName}
                  </span>
                  <span className="gameCardSub">{total} game{total !== 1 ? "s" : ""}</span>
                </div>
                <span className="rivalryRecord">
                  <span className="rivalryW">{r.wins}W</span>
                  {" · "}
                  <span className="rivalryL">{r.losses}L</span>
                  {r.ties > 0 && <>{" · "}<span className="rivalryT">{r.ties}T</span></>}
                </span>
              </div>
            );
          })}
          {rivalriesVisible < rivalries.length && (
            <Button
              className="loadMoreBtn"
              variant="outlined"
              onClick={() => setRivalriesVisible((v) => v + 5)}
            >
              Show More
            </Button>
          )}
        </div>
      )}

      {/* Tournaments */}
      {myTournaments.length > 0 && (
        <div className="pastGamesCard">
          <div className="pastGamesTitle">Tournaments</div>
          {myTournaments.map((t) => {
            const isWinner = t.winnerId === linkedPlayer?.userId;
            return (
              <div key={t.tournamentId} className="gameCard">
                <div className="gameCardLeft">
                  <span className="gameCardPlayer">
                    {isWinner && (
                      <EmojiEventsIcon
                        fontSize="inherit"
                        sx={{
                          color: "#d4af37",
                          mr: 0.5,
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                    {t.name}
                  </span>
                  <span className="gameCardSub">
                    {t.roundCount} / {t.targetRounds} rounds
                    {t.winnerName ? ` · Won by ${t.winnerName}` : ""}
                  </span>
                  {t.completedAt && (
                    <span className="gameCardDate">
                      {formatDate(t.completedAt)}
                    </span>
                  )}
                </div>
                <Button
                  component={Link}
                  to={`/Tournament/Standings/${t.tournamentId}`}
                  size="small"
                  variant="text"
                  sx={{ fontSize: 11, minWidth: 0, p: "2px 6px" }}
                >
                  Standings
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Past games */}
      <div className="pastGamesCard">
        <div className="pastGamesTitle">Past Rounds</div>
        {myGolfRounds.length > 0 && (
          <div className="pastGamesFilters">
            <Select
              placeholder="Filter by course..."
              isClearable
              options={golfCourseOptions}
              value={
                golfCourseFilter
                  ? { value: golfCourseFilter, label: golfCourseFilter }
                  : null
              }
              onChange={(opt) => {
                setGolfCourseFilter(opt?.value ?? null);
                setGolfVisible(5);
              }}
              styles={courseSelectStyles as any}
            />
            <div className="dateRangeRow">
              <input
                type="date"
                className="dateInput"
                value={golfDateFrom}
                onChange={(e) => {
                  setGolfDateFrom(e.target.value);
                  setGolfVisible(5);
                }}
              />
              <span className="dateRangeSep">—</span>
              <input
                type="date"
                className="dateInput"
                value={golfDateTo}
                onChange={(e) => {
                  setGolfDateTo(e.target.value);
                  setGolfVisible(5);
                }}
              />
            </div>
            {(golfCourseFilter || golfDateFrom || golfDateTo) && (
              <button
                className="clearFiltersBtn"
                onClick={() => {
                  setGolfCourseFilter(null);
                  setGolfDateFrom("");
                  setGolfDateTo("");
                  setGolfVisible(5);
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
        {filteredGolfRounds.length === 0 ? (
          <div className="noGames">
            {myGolfRounds.length === 0
              ? "No rounds recorded yet."
              : "No rounds match filters."}
          </div>
        ) : (
          <>
            {filteredGolfRounds.slice(0, golfVisible).map((r, i) => {
              const total = r.scores.reduce((a, b) => a + b, 0);
              const diff = total - r.currentCourse.totalPar;
              const { text, cls } = formatScoreToPar(diff);
              return (
                <div
                  className="gameCard"
                  key={i}
                  onClick={() => setSelectedGolfRound(r)}
                >
                  <div className="gameCardLeft">
                    <span className="gameCardPlayer">{r.name}</span>
                    <span className="gameCardSub">
                      {r.currentCourse.courseName}
                    </span>
                    <span className="gameCardDate">
                      {r.tournamentId &&
                        (() => {
                          const t = tournamentMap[r.tournamentId];
                          const sessions =
                            tournamentSessionMap[r.tournamentId] ?? [];
                          const roundNum = sessions.indexOf(r.date) + 1;
                          const target = t?.targetRounds ?? "?";
                          const tName = t?.name ?? "Tournament";
                          return (
                            <span className="gameCardTournamentTag">
                              {tName} {roundNum}/{target}{" "}
                            </span>
                          );
                        })()}
                      {formatDate(r.date)}
                    </span>
                  </div>
                  <span className={`gameCardRight ${cls}`}>{text}</span>
                </div>
              );
            })}
            {golfVisible < filteredGolfRounds.length && (
              <Button
                className="loadMoreBtn"
                variant="outlined"
                onClick={() => setGolfVisible((v) => v + 5)}
              >
                Load More
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );

  const dartCol = (
    <div className="dashboardCol">
      <div className="dashboardColTitle">Darts</div>

      {/* Summary stats */}
      <div className="dashboardStatCard">
        <div className="dashboardStatCardTitle">Summary</div>
        {dartStats ? (
          <>
            <div className="dashboardStatGrid">
              <span className="dashboardStatLabel">Rounds Played</span>
              <span className="dashboardStatValue">
                {dartStats.totalRounds}
              </span>
              <span className="dashboardStatLabel">Match Wins</span>
              <span className="dashboardStatValue">
                {dartStats.totalMatchWins} ({dartStats.matchWinPct.toFixed(0)}%)
              </span>
              <span className="dashboardStatLabel">Set Wins</span>
              <span className="dashboardStatValue">
                {dartStats.totalGameWins}
              </span>
              <span className="dashboardStatLabel">Best Toss</span>
              <span className="dashboardStatValue">
                {dartStats.highScoreToss}
              </span>
              <span className="dashboardStatLabel">Best Set</span>
              <span className="dashboardStatValue">
                {dartStats.highScoreSet}
              </span>
              {dartStats.hasSolo && (
                <>
                  <span className="dashboardStatLabel">Best Solo</span>
                  <span className="dashboardStatValue">
                    {dartStats.highScoreSolo}
                  </span>
                </>
              )}
              <span className="dashboardStatLabel">Avg Toss</span>
              <span className="dashboardStatValue">
                {dartStats.avgTossScore.toFixed(1)}
              </span>
              <span className="dashboardStatLabel">Bull Rate</span>
              <span className="dashboardStatValue">
                {dartStats.bullRate.toFixed(1)}%
              </span>
              <span className="dashboardStatLabel">Miss Rate</span>
              <span className="dashboardStatValue">
                {dartStats.missRate.toFixed(1)}%
              </span>
              <span className="dashboardStatLabel">Longest Streak</span>
              <span className="dashboardStatValue">
                {dartStats.longestWinStreak}
              </span>
              <span className="dashboardStatLabel">Current Streak</span>
              <span className="dashboardStatValue">
                {dartStats.currentWinStreak}
              </span>
            </div>

            {/* Score frequency (point spread) */}
            {totalThrows > 0 && (
              <div className="dashboardThrowDist">
                <div className="dashboardThrowDistLabel">Score Frequency</div>
                <ThrowPieChart entries={throwEntries} total={totalThrows} />
              </div>
            )}
          </>
        ) : (
          <div className="noGames">No rounds recorded yet.</div>
        )}
      </div>

      {/* Dart Rivalries */}
      {dartRivalries.length > 0 && (
        <div className="pastGamesCard">
          <div className="pastGamesTitle">Dart Rivalries</div>
          {dartRivalries.slice(0, dartRivalriesVisible).map((r) => {
            const total = r.wins + r.losses + r.ties;
            return (
              <div key={r.opponentId} className="gameCard">
                <div className="gameCardLeft">
                  <span className="gameCardPlayer">
                    <AvatarIcon
                      avatarId={playerOptions.find((p) => p.value.userId === r.opponentId)?.value.avatar}
                      size={18}
                      initials={r.opponentName}
                    />
                    {" "}{r.opponentName}
                  </span>
                  <span className="gameCardSub">{total} match{total !== 1 ? "es" : ""}</span>
                </div>
                <span className="rivalryRecord">
                  <span className="rivalryW">{r.wins}W</span>
                  {" · "}
                  <span className="rivalryL">{r.losses}L</span>
                  {r.ties > 0 && <>{" · "}<span className="rivalryT">{r.ties}T</span></>}
                </span>
              </div>
            );
          })}
          {dartRivalriesVisible < dartRivalries.length && (
            <Button
              className="loadMoreBtn"
              variant="outlined"
              onClick={() => setDartRivalriesVisible((v) => v + 5)}
            >
              Show More
            </Button>
          )}
        </div>
      )}

      {/* Past games */}
      <div className="pastGamesCard">
        <div className="pastGamesTitle">Past Rounds</div>
        {myDartRounds.length === 0 ? (
          <div className="noGames">No rounds recorded yet.</div>
        ) : (
          <>
            {myDartRounds.slice(0, dartVisible).map((r, i) => {
              let resultText = "";
              let resultCls = "solo";
              if (r.matchWinner === true) {
                resultText = "Win";
                resultCls = "win";
              } else if (r.matchWinner === false) {
                resultText = "Loss";
                resultCls = "loss";
              } else {
                const total = r.scores.reduce((sum, t) => sum + tossSum(t), 0);
                resultText = `${total} pts`;
              }
              return (
                <div
                  className="gameCard"
                  key={i}
                  onClick={() => setSelectedDartRound(r)}
                >
                  <div className="gameCardLeft">
                    <span className="gameCardPlayer">{r.name}</span>
                    <span className="gameCardSub">{r.gameType}</span>
                    <span className="gameCardDate">{formatDate(r.date)}</span>
                  </div>
                  <span className={`gameCardRight ${resultCls}`}>
                    {resultText}
                  </span>
                </div>
              );
            })}
            {dartVisible < myDartRounds.length && (
              <Button
                className="loadMoreBtn"
                variant="outlined"
                onClick={() => setDartVisible((v) => v + 5)}
              >
                Load More
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboardPage">
      <div className="dashboardHeading">Dashboard</div>

      {currentUser?.email === "ndassa83@gmail.com" && (
        <AdminPanel database={database} />
      )}

      {!currentUser || !linkedPlayer ? (
        <div className="noGames">
          {!currentUser ? (
            <>
              <div>Sign in to see your stats.</div>
              <Button variant="contained" onClick={onSignIn} sx={{ mt: 1 }}>
                Sign in with Google
              </Button>
            </>
          ) : (
            "No player linked to your Google account. Link one from the profile menu."
          )}
        </div>
      ) : (
        <>
          {/* Profile card */}
          <div className="dashboardProfileCard">
            <AvatarIcon
              avatarId={linkedPlayer.avatar}
              size={64}
              initials={linkedPlayer.userName}
            />
            <div className="dashboardProfileInfo">
              <div className="dashboardProfileName">{linkedPlayer.userName}</div>
              <Button size="small" onClick={() => { setPendingAvatar(linkedPlayer.avatar ?? null); setAvatarPickerOpen(true); }}>
                Edit Avatar
              </Button>
            </div>
          </div>

          <Dialog open={avatarPickerOpen} onClose={() => setAvatarPickerOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontFamily: "'Fredoka One', cursive" }}>Choose Avatar</DialogTitle>
            <DialogContent>
              <AvatarPicker selected={pendingAvatar} onSelect={setPendingAvatar} />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button onClick={() => setAvatarPickerOpen(false)}>Cancel</Button>
              <Button
                disabled={!pendingAvatar}
                onClick={async () => {
                  if (pendingAvatar) {
                    await onUpdatePlayerAvatar(linkedPlayer.userId, pendingAvatar);
                  }
                  setAvatarPickerOpen(false);
                }}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {isMobile ? (
            <div className="mobileTabs">
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                textColor="inherit"
                TabIndicatorProps={{
                  style: { backgroundColor: "var(--green-primary)" },
                }}
                sx={{
                  borderBottom: "2px solid var(--green-primary)",
                  marginBottom: "16px",
                }}
              >
                <Tab
                  value="golf"
                  label="Golf"
                  sx={{
                    fontFamily: "'Fredoka One', cursive",
                    fontSize: "16px",
                  }}
                />
                <Tab
                  value="darts"
                  label="Darts"
                  sx={{
                    fontFamily: "'Fredoka One', cursive",
                    fontSize: "16px",
                  }}
                />
              </Tabs>
              <div className="dashboardColMobile">
                {activeTab === "golf" ? golfCol : dartCol}
              </div>
            </div>
          ) : (
            <div className="dashboardCols">
              {golfCol}
              {dartCol}
            </div>
          )}
        </>
      )}
      <GolfRoundModal
        open={selectedGolfRound !== null}
        onClose={() => setSelectedGolfRound(null)}
        rounds={golfRounds.filter((r) => r.date === selectedGolfRound?.date)}
      />
      <DartRoundModal
        open={selectedDartRound !== null}
        onClose={() => setSelectedDartRound(null)}
        rounds={dartRounds.filter((r) => r.date === selectedDartRound?.date)}
      />
    </div>
  );
};

export default Dashboard;
