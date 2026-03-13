import { useMemo } from "react";
import dayjs from "dayjs";
import { DartRound, FetchedPlayer, playerFilteredStats, playerFilteredStatsMap } from "../../types";
import "./DartOverallStats.css";

type DartOverallStatsProps = {
  filteredAllScoreData: DartRound[];
  allScoreData: DartRound[];
  selectedPlayer: FetchedPlayer | null;
};

const tossSum = (toss: DartRound["scores"][number]): number =>
  Array.isArray(toss.values) ? toss.values.reduce((s, v) => s + v, 0) : 0;

// Returns the highest single-toss total (sum of values in one toss)
const getTossHighScore = (rounds: DartRound[]): number => {
  let best = 0;
  rounds.forEach((round) => {
    round.scores.forEach((toss) => {
      const total = tossSum(toss);
      if (total > best) best = total;
    });
  });
  return best;
};

// Returns the highest 3-toss set total (groups tosses in chunks of 3)
const getSetHighScore = (rounds: DartRound[]): number => {
  let best = 0;
  rounds.forEach((round) => {
    for (let i = 0; i + 2 < round.scores.length; i += 3) {
      const setTotal = round.scores
        .slice(i, i + 3)
        .reduce((sum, toss) => sum + tossSum(toss), 0);
      if (setTotal > best) best = setTotal;
    }
  });
  return best;
};

// Returns the highest total for a solo (10-toss) round
const getSoloHighScore = (rounds: DartRound[]): number => {
  let best = 0;
  rounds
    .filter((r) => r.gameType === "Solo")
    .forEach((round) => {
      const total = round.scores.reduce((sum, toss) => sum + tossSum(toss), 0);
      if (total > best) best = total;
    });
  return best;
};

// Counts how many times each score value was thrown across all rounds
const getThrowMap = (rounds: DartRound[]): Map<number, number> => {
  const map = new Map<number, number>([
    [0, 0],
    [5, 0],
    [10, 0],
    [20, 0],
    [50, 0],
    [100, 0],
  ]);
  rounds.forEach((round) => {
    round.scores.forEach((toss) => {
      if (!Array.isArray(toss.values)) return;
      toss.values.forEach((v) => {
        map.set(v, (map.get(v) ?? 0) + 1);
      });
    });
  });
  return map;
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

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const dec = (n: number) => n.toFixed(1);

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
}: DartOverallStatsProps) => {
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

  // Detail view — player is selected
  if (selectedPlayer !== null) {
    const stats = filteredPlayerStatsMap[String(selectedPlayer.userId)];
    if (!stats) {
      return <div className="dartOverallStats">No rounds found for this player.</div>;
    }

    const throwEntries = Array.from(stats.throwMap.entries()).filter(
      ([, count]) => count > 0
    );
    const maxCount = Math.max(...throwEntries.map(([, c]) => c), 1);
    const hasSolo = stats.highScoreSolo > 0;
    const hasSet = stats.highScoreSet > 0;

    return (
      <div className="dartOverallStats">
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

            <span className="dartStatLabel">Game Wins</span>
            <span className="dartStatValue">{stats.totalGameWins}</span>

            <span className="dartStatLabel">Win Streak</span>
            <span className="dartStatValue">
              {stats.currentWinStreak} current · {stats.longestWinStreak} best
            </span>

            <span className="dartStatLabel">Best Toss</span>
            <span className="dartStatValue">{stats.highScoreToss}</span>

            {hasSet && (
              <>
                <span className="dartStatLabel">Best Set</span>
                <span className="dartStatValue">{stats.highScoreSet}</span>
              </>
            )}

            {hasSolo && (
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

          {throwEntries.length > 0 && (
            <div className="throwDistribution">
              <div className="throwDistLabel">Throw Distribution</div>
              {throwEntries.map(([score, count]) => (
                <div key={score} className="throwRow">
                  <span className="throwScore">{score}</span>
                  <div className="throwBarTrack">
                    <div
                      className="throwBar"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="throwCount">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Leaderboard view — no player selected
  if (allScoreData.length === 0) {
    return <div className="dartOverallStats">No rounds found.</div>;
  }

  const allStats = Object.values(allPlayerStatsMap);
  const sorted = <T,>(key: keyof playerFilteredStats, display: (s: playerFilteredStats) => string, filterFn?: (s: playerFilteredStats) => boolean): LeaderboardEntry[] =>
    (filterFn ? allStats.filter(filterFn) : allStats)
      .filter((s) => (s[key] as number) > 0)
      .sort((a, b) => (b[key] as number) - (a[key] as number))
      .map((s) => ({ stats: s, displayValue: display(s) }));

  const hasSet = allStats.some((s) => s.highScoreSet > 0);
  const hasSolo = allStats.some((s) => s.highScoreSolo > 0);

  return (
    <div className="dartOverallStats">
      <div className="leaderboardContainer">
        <LeaderboardTable
          title="Most Match Wins"
          entries={sorted("totalMatchWins", (s) =>
            `${s.totalMatchWins} wins${s.totalMatchesPlayed > 0 ? ` · ${pct(s.matchWinPct)} win rate` : ""}`
          )}
        />
        <LeaderboardTable
          title="Best Match Win %"
          entries={sorted(
            "matchWinPct",
            (s) => `${pct(s.matchWinPct)} (${s.totalMatchWins}/${s.totalMatchesPlayed})`,
            (s) => s.totalMatchesPlayed >= 1
          )}
        />
        <LeaderboardTable
          title="Most Game Wins"
          entries={sorted("totalGameWins", (s) => `${s.totalGameWins}`)}
        />
        <LeaderboardTable
          title="Longest Win Streak"
          entries={sorted("longestWinStreak", (s) => `${s.longestWinStreak} in a row`)}
        />
        <LeaderboardTable
          title="Best Single Toss"
          entries={sorted("highScoreToss", (s) => `${s.highScoreToss} pts`)}
        />
        <LeaderboardTable
          title="Highest Avg Toss Score"
          entries={sorted("avgTossScore", (s) => `${dec(s.avgTossScore)} pts/toss`)}
        />
        <LeaderboardTable
          title="Best Bull Rate"
          entries={sorted("bullRate", (s) => pct(s.bullRate))}
        />
        <LeaderboardTable
          title="Most Rounds Played"
          entries={sorted("totalRoundsPlayed", (s) => `${s.totalRoundsPlayed} rounds`)}
        />
        {hasSet && (
          <LeaderboardTable
            title="Best Set Score"
            entries={sorted("highScoreSet", (s) => `${s.highScoreSet} pts`)}
          />
        )}
        {hasSolo && (
          <LeaderboardTable
            title="Best Solo Score"
            entries={sorted("highScoreSolo", (s) => `${s.highScoreSolo} pts`)}
          />
        )}
      </div>
    </div>
  );
};

export default DartOverallStats;
