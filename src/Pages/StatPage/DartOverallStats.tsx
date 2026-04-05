import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { DartRound, FetchedPlayer, playerFilteredStats, playerFilteredStatsMap } from "../../types";
import { tossSum, getTossHighScore, getSetHighScore, getSoloHighScore, getThrowMap } from "../../utils/dartStatHelpers";
import { ThrowPieChart } from "../../components/ThrowPieChart";
import "./DartOverallStats.css";

type DartOverallStatsProps = {
  filteredAllScoreData: DartRound[];
  allScoreData: DartRound[];
  selectedPlayer: FetchedPlayer | null;
  combinedMode?: boolean;
};

const buildPlayerStats = (rounds: DartRound[]): playerFilteredStatsMap => {
  const map: playerFilteredStatsMap = {};

  // Group rounds by userId (one DartRound per player per game)
  rounds.forEach((round) => {
    const key = String(round.userId);
    if (!map[key]) {
      map[key] = {
        name: round.name,
        userId: round.userId,
        totalGameWins: 0,
        totalMatchWins: 0,
        totalMatchesPlayed: 0,
        matchWinPct: 0,
        highScoreToss: 0,
        highScoreSet: 0,
        highScoreSolo: 0,
        throwMap: new Map<number, number>([
          [0, 0], [5, 0], [10, 0], [20, 0], [50, 0], [100, 0],
        ]),
        totalRoundsPlayed: 0,
        totalTossCount: 0,
        avgTossScore: 0,
        longestWinStreak: 0,
        currentWinStreak: 0,
        bullRate: 0,
        missRate: 0,
      };
    }
  });

  // Compute per-player stats from only that player's rounds
  Object.keys(map).forEach((key) => {
    const playerRounds = rounds.filter((r) => String(r.userId) === key);
    const stats = map[key];

    stats.totalMatchWins = playerRounds.filter((r) => r.matchWinner === true).length;
    stats.totalGameWins = playerRounds.reduce((sum, r) => sum + r.gameWins, 0);
    stats.highScoreToss = getTossHighScore(playerRounds);
    stats.highScoreSet = getSetHighScore(playerRounds);
    stats.highScoreSolo = getSoloHighScore(playerRounds);
    stats.throwMap = getThrowMap(playerRounds);
    stats.totalRoundsPlayed = playerRounds.length;

    // Match win %
    const matchRounds = playerRounds.filter((r) => r.matchWinner !== null);
    stats.totalMatchesPlayed = matchRounds.length;
    stats.matchWinPct = matchRounds.length > 0 ? stats.totalMatchWins / matchRounds.length : 0;

    // Avg toss score
    const allTosses = playerRounds.flatMap((r) => r.scores);
    stats.totalTossCount = allTosses.length;
    stats.avgTossScore = allTosses.length > 0
      ? allTosses.reduce((sum, toss) => sum + tossSum(toss), 0) / allTosses.length
      : 0;

    // Per-dart accuracy
    const allDartValues = playerRounds.flatMap((r) => r.scores.flatMap((t) => t.values ?? []));
    const totalDarts = allDartValues.length;
    stats.bullRate = totalDarts > 0
      ? allDartValues.filter((v) => v === 50 || v === 100).length / totalDarts
      : 0;
    stats.missRate = totalDarts > 0
      ? allDartValues.filter((v) => v === 0).length / totalDarts
      : 0;

    // Win streaks — sort non-null match rounds by date
    const sortedMatchRounds = [...matchRounds].sort(
      (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );
    let longest = 0;
    let current = 0;
    sortedMatchRounds.forEach((r) => {
      if (r.matchWinner === true) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 0;
      }
    });
    stats.longestWinStreak = longest;
    stats.currentWinStreak = current;
  });

  return map;
};

const buildCombinedStats = (rounds: DartRound[]): playerFilteredStats => {
  const allTosses = rounds.flatMap((r) => r.scores);
  const allDartValues = rounds.flatMap((r) => r.scores.flatMap((t) => t.values ?? []));
  const totalDarts = allDartValues.length;
  const matchRounds = rounds.filter((r) => r.matchWinner !== null);
  const totalMatchWins = rounds.filter((r) => r.matchWinner === true).length;
  return {
    name: "All Players",
    userId: -1,
    totalRoundsPlayed: rounds.length,
    totalMatchWins,
    totalMatchesPlayed: matchRounds.length,
    matchWinPct: matchRounds.length > 0 ? totalMatchWins / matchRounds.length : 0,
    totalGameWins: rounds.reduce((sum, r) => sum + r.gameWins, 0),
    highScoreToss: getTossHighScore(rounds),
    highScoreSet: getSetHighScore(rounds),
    highScoreSolo: getSoloHighScore(rounds),
    throwMap: getThrowMap(rounds),
    totalTossCount: allTosses.length,
    avgTossScore: allTosses.length > 0
      ? allTosses.reduce((sum, t) => sum + tossSum(t), 0) / allTosses.length
      : 0,
    bullRate: totalDarts > 0
      ? allDartValues.filter((v) => v === 50 || v === 100).length / totalDarts
      : 0,
    missRate: totalDarts > 0
      ? allDartValues.filter((v) => v === 0).length / totalDarts
      : 0,
    longestWinStreak: 0,
    currentWinStreak: 0,
  };
};

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const dec = (n: number) => n.toFixed(1);

const PlayerStatsCard = ({ stats, showStreak = true }: { stats: playerFilteredStats; showStreak?: boolean }) => {
  const throwEntries = Array.from(stats.throwMap.entries());
  const totalThrows = throwEntries.reduce((sum, [, c]) => sum + c, 0);
  return (
    <div className="dartPlayerStats">
      <div className="dartPlayerName">{stats.name}</div>
      <div className="dartStatGrid">
        <span className="dartStatLabel">Rounds Played</span>
        <span className="dartStatValue">{stats.totalRoundsPlayed}</span>

        <span className="dartStatLabel">Match Wins</span>
        <span className="dartStatValue">
          {stats.totalMatchWins}
          {stats.totalMatchesPlayed > 0 && (
            <span className="dartStatSub"> ({pct(stats.matchWinPct)} win rate)</span>
          )}
        </span>

        <span className="dartStatLabel">Set Wins</span>
        <span className="dartStatValue">{stats.totalGameWins}</span>

        {showStreak && (
          <>
            <span className="dartStatLabel">Win Streak</span>
            <span className="dartStatValue">
              {stats.currentWinStreak} current · {stats.longestWinStreak} best
            </span>
          </>
        )}

        <span className="dartStatLabel">Best Toss</span>
        <span className="dartStatValue">{stats.highScoreToss}</span>

        {stats.highScoreSet > 0 && (
          <>
            <span className="dartStatLabel">Best Set</span>
            <span className="dartStatValue">{stats.highScoreSet}</span>
          </>
        )}

        {stats.highScoreSolo > 0 && (
          <>
            <span className="dartStatLabel">Best Solo</span>
            <span className="dartStatValue">{stats.highScoreSolo}</span>
          </>
        )}

        <span className="dartStatLabel">Avg Toss Score</span>
        <span className="dartStatValue">{dec(stats.avgTossScore)} pts</span>

        <span className="dartStatLabel">Bull Rate</span>
        <span className="dartStatValue">{pct(stats.bullRate)}</span>

        <span className="dartStatLabel">Miss Rate</span>
        <span className="dartStatValue">{pct(stats.missRate)}</span>
      </div>

      {totalThrows > 0 && (
        <div className="throwDistribution">
          <div className="throwDistLabel">Throw Distribution</div>
          <ThrowPieChart entries={throwEntries} total={totalThrows} />
        </div>
      )}
    </div>
  );
};

type LeaderboardEntry = { stats: playerFilteredStats; displayValue: string };

const LeaderboardTable = ({
  title,
  entries,
}: {
  title: string;
  entries: LeaderboardEntry[];
}) => {
  if (entries.length === 0) return null;
  return (
    <div className="leaderboardTable">
      <div className="leaderboardTitle">{title}</div>
      {entries.map((entry, index) => (
        <div
          key={entry.stats.userId}
          className={`leaderboardRow${index === 0 ? " leaderboardFirst" : ""}`}
        >
          <span className="leaderboardRank">#{index + 1}</span>
          <span className="leaderboardName">{entry.stats.name}</span>
          <span className="leaderboardStat">{entry.displayValue}</span>
        </div>
      ))}
    </div>
  );
};

const DartOverallStats = ({
  filteredAllScoreData,
  allScoreData,
  selectedPlayer,
  combinedMode,
}: DartOverallStatsProps) => {
  const [activeIdx, setActiveIdx] = useState(0);

  // Always build stats from all data for leaderboard; use filtered for detail view
  const allPlayerStatsMap = useMemo(
    () => buildPlayerStats(allScoreData),
    [allScoreData]
  );

  const filteredPlayerStatsMap = useMemo(
    () => buildPlayerStats(filteredAllScoreData),
    [filteredAllScoreData]
  );

  if (filteredAllScoreData.length === 0 && allScoreData.length === 0) {
    return <div className="dartOverallStats">No rounds found.</div>;
  }

  // Combined view — no player selected, show aggregate stats for all rounds
  if (combinedMode) {
    if (filteredAllScoreData.length === 0) {
      return <div className="dartOverallStats">No rounds found.</div>;
    }
    return (
      <div className="dartOverallStats">
        <PlayerStatsCard stats={buildCombinedStats(filteredAllScoreData)} showStreak={false} />
      </div>
    );
  }

  // Detail view — player is selected
  if (selectedPlayer !== null) {
    const stats = filteredPlayerStatsMap[String(selectedPlayer.userId)];
    if (!stats) {
      return <div className="dartOverallStats">No rounds found for this player.</div>;
    }
    return (
      <div className="dartOverallStats">
        <PlayerStatsCard stats={stats} />
      </div>
    );
  }

  // Leaderboard view
  if (allScoreData.length === 0) {
    return <div className="dartOverallStats">No rounds found.</div>;
  }

  const allStats = Object.values(allPlayerStatsMap);
  const sorted = (key: keyof playerFilteredStats, display: (s: playerFilteredStats) => string, filterFn?: (s: playerFilteredStats) => boolean): LeaderboardEntry[] =>
    (filterFn ? allStats.filter(filterFn) : allStats)
      .filter((s) => (s[key] as number) > 0)
      .sort((a, b) => (b[key] as number) - (a[key] as number))
      .map((s) => ({ stats: s, displayValue: display(s) }));

  type DartCategoryDef = { label: string; description: string; entries: LeaderboardEntry[] };

  const allCategories: DartCategoryDef[] = [
    { label: "Match Wins", description: "Total matches won across all game types.", entries: sorted("totalMatchWins", (s) => `${s.totalMatchWins} wins${s.totalMatchesPlayed > 0 ? ` · ${pct(s.matchWinPct)} win rate` : ""}`) },
    { label: "Win %", description: "Match win percentage (min. 1 match played).", entries: sorted("matchWinPct", (s) => `${pct(s.matchWinPct)} (${s.totalMatchWins}/${s.totalMatchesPlayed})`, (s) => s.totalMatchesPlayed >= 1) },
    { label: "Set Wins", description: "Total sets won across all matches.", entries: sorted("totalGameWins", (s) => `${s.totalGameWins}`) },
    { label: "Win Streak", description: "Longest consecutive match win streak on record.", entries: sorted("longestWinStreak", (s) => `${s.longestWinStreak} in a row`) },
    { label: "Best Toss", description: "Highest single 3-dart toss score ever recorded.", entries: sorted("highScoreToss", (s) => `${s.highScoreToss} pts`) },
    { label: "Avg Toss", description: "Average points scored per toss across all rounds.", entries: sorted("avgTossScore", (s) => `${dec(s.avgTossScore)} pts/toss`) },
    { label: "Bull Rate", description: "Percentage of darts landing on 50 or 100.", entries: sorted("bullRate", (s) => pct(s.bullRate)) },
    { label: "Rounds", description: "Total number of rounds participated in.", entries: sorted("totalRoundsPlayed", (s) => `${s.totalRoundsPlayed} rounds`) },
    { label: "Best Set", description: "Highest combined score across a 3-toss set.", entries: sorted("highScoreSet", (s) => `${s.highScoreSet} pts`) },
    { label: "Best Solo", description: "Highest total score recorded in a Solo game.", entries: sorted("highScoreSolo", (s) => `${s.highScoreSolo} pts`) },
  ].filter((cat) => cat.entries.length > 0);

  const clampedIdx = Math.min(activeIdx, allCategories.length - 1);
  const active = allCategories[clampedIdx];

  return (
    <div className="dartOverallStats">
      <div className="leaderboardDashboard">
        <div className="leaderboardChips">
          {allCategories.map((cat, i) => (
            <button
              key={cat.label}
              className={`leaderboardChip${i === clampedIdx ? " active" : ""}`}
              onClick={() => setActiveIdx(i)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <p className="leaderboardDescription">{active.description}</p>
        <LeaderboardTable title={active.label} entries={active.entries} />
      </div>
    </div>
  );
};

export default DartOverallStats;
