import { useState, useEffect, useMemo } from "react";
import {
  Firestore,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { Button, Tabs, Tab } from "@mui/material";
import Select from "react-select";
import { GolfRound, DartRound, PlayerOptionType } from "../../types";
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
  placeholder: (base: React.CSSProperties) => ({ ...base, fontSize: 13, color: "#aaa" }),
  singleValue: (base: React.CSSProperties) => ({ ...base, fontSize: 13 }),
};

type Props = {
  database: Firestore;
  playerOptions: PlayerOptionType[];
  currentUser: User | null;
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

const Dashboard = ({ database, playerOptions, currentUser }: Props) => {
  const [golfRounds, setGolfRounds] = useState<GolfRound[]>([]);
  const [dartRounds, setDartRounds] = useState<DartRound[]>([]);
  const [golfVisible, setGolfVisible] = useState(5);
  const [dartVisible, setDartVisible] = useState(5);
  const [activeTab, setActiveTab] = useState<"golf" | "darts">("golf");
  const [selectedGolfRound, setSelectedGolfRound] = useState<GolfRound | null>(
    null,
  );
  const [selectedDartRound, setSelectedDartRound] = useState<DartRound | null>(
    null,
  );
  const [golfCourseFilter, setGolfCourseFilter] = useState<string | null>(null);
  const [golfDateFrom, setGolfDateFrom] = useState("");
  const [golfDateTo, setGolfDateTo] = useState("");

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
        opts.push({ value: r.currentCourse.courseName, label: r.currentCourse.courseName });
      }
    });
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [myGolfRounds]);

  const filteredGolfRounds = useMemo(() => {
    let rounds = myGolfRounds;
    if (golfCourseFilter) {
      rounds = rounds.filter((r) => r.currentCourse.courseName === golfCourseFilter);
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
    ]).then(([golfSnap, dartSnap]) => {
      setGolfRounds(golfSnap.docs.map((d) => d.data() as GolfRound));
      setDartRounds(dartSnap.docs.map((d) => d.data() as DartRound));
    });
  }, [database]);

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
          </div>
        ) : (
          <div className="noGames">No rounds recorded yet.</div>
        )}
      </div>

      {/* Past games */}
      <div className="pastGamesCard">
        <div className="pastGamesTitle">Past Rounds</div>
        {myGolfRounds.length > 0 && (
          <div className="pastGamesFilters">
            <Select
              placeholder="Filter by course..."
              isClearable
              options={golfCourseOptions}
              value={golfCourseFilter ? { value: golfCourseFilter, label: golfCourseFilter } : null}
              onChange={(opt) => { setGolfCourseFilter(opt?.value ?? null); setGolfVisible(5); }}
              styles={courseSelectStyles as any}
            />
            <div className="dateRangeRow">
              <input
                type="date"
                className="dateInput"
                value={golfDateFrom}
                onChange={(e) => { setGolfDateFrom(e.target.value); setGolfVisible(5); }}
              />
              <span className="dateRangeSep">—</span>
              <input
                type="date"
                className="dateInput"
                value={golfDateTo}
                onChange={(e) => { setGolfDateTo(e.target.value); setGolfVisible(5); }}
              />
            </div>
            {(golfCourseFilter || golfDateFrom || golfDateTo) && (
              <button
                className="clearFiltersBtn"
                onClick={() => { setGolfCourseFilter(null); setGolfDateFrom(""); setGolfDateTo(""); setGolfVisible(5); }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
        {filteredGolfRounds.length === 0 ? (
          <div className="noGames">
            {myGolfRounds.length === 0 ? "No rounds recorded yet." : "No rounds match filters."}
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
                    <span className="gameCardDate">{formatDate(r.date)}</span>
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
              <span className="dashboardStatLabel">Game Wins</span>
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

      {currentUser?.email === "ndassa83@gmail.com" && <AdminPanel database={database} />}

      {!currentUser || !linkedPlayer ? (
        <div className="noGames">
          {!currentUser
            ? "Sign in to see your stats."
            : "No player linked to your Google account. Link one from the profile menu."}
        </div>
      ) : (
        <>
          {/* Desktop: two columns */}
          <div className="dashboardCols">
            {golfCol}
            {dartCol}
          </div>

          {/* Mobile: tabs */}
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
                sx={{ fontFamily: "'Fredoka One', cursive", fontSize: "16px" }}
              />
              <Tab
                value="darts"
                label="Darts"
                sx={{ fontFamily: "'Fredoka One', cursive", fontSize: "16px" }}
              />
            </Tabs>
            <div className="dashboardColMobile">
              {activeTab === "golf" ? golfCol : dartCol}
            </div>
          </div>
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
