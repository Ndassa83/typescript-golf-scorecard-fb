import { useState, useMemo } from "react";
import { GolfRound } from "../../types";
import { calculateHandicapIndex } from "../../utils/handicapHelpers";
import "./GolfLeaderboards.css";

type PlayerGolfStats = {
  userId: number;
  name: string;
  totalRounds: number;
  bestScoreToPar: number;
  avgScoreToPar: number;
  totalBirdies: number;
  totalEagles: number;
  birdieRate: number;
  totalHolesInOne: number;
  bogeyFreeRounds: number;
  roundsUnderPar: number;
  totalHolesPlayed: number;
};

const buildGolfStats = (rounds: GolfRound[]): PlayerGolfStats[] => {
  const map: Record<string, PlayerGolfStats> = {};

  rounds.forEach((round) => {
    const key = String(round.userId);
    if (!map[key]) {
      map[key] = {
        userId: round.userId,
        name: round.name,
        totalRounds: 0,
        bestScoreToPar: Infinity,
        avgScoreToPar: 0,
        totalBirdies: 0,
        totalEagles: 0,
        birdieRate: 0,
        totalHolesInOne: 0,
        bogeyFreeRounds: 0,
        roundsUnderPar: 0,
        totalHolesPlayed: 0,
      };
    }
  });

  Object.keys(map).forEach((key) => {
    const playerRounds = rounds.filter((r) => String(r.userId) === key);
    const stats = map[key];
    stats.totalRounds = playerRounds.length;

    let totalScoreToPar = 0;
    let totalBirdies = 0;
    let totalEagles = 0;
    let totalHolesInOne = 0;
    let totalHoles = 0;
    let bogeyFreeRounds = 0;
    let roundsUnderPar = 0;

    playerRounds.forEach((round) => {
      const courseHoles = round.currentCourse.holes;
      const totalScore = round.scores.reduce((a, b) => a + b, 0);
      const scoreToPar = totalScore - round.currentCourse.totalPar;
      if (scoreToPar < stats.bestScoreToPar) stats.bestScoreToPar = scoreToPar;
      totalScoreToPar += scoreToPar;
      if (scoreToPar < 0) roundsUnderPar++;

      let bogeyFree = true;
      round.scores.forEach((score, i) => {
        const hole = courseHoles[i];
        if (!hole) return;
        totalHoles++;
        if (score === 1) totalHolesInOne++;
        if (score === hole.par - 1) totalBirdies++;
        if (score <= hole.par - 2) totalEagles++;
        if (score > hole.par) bogeyFree = false;
      });
      if (bogeyFree) bogeyFreeRounds++;
    });

    stats.avgScoreToPar = playerRounds.length > 0 ? totalScoreToPar / playerRounds.length : 0;
    stats.totalBirdies = totalBirdies;
    stats.totalEagles = totalEagles;
    stats.birdieRate = totalHoles > 0 ? totalBirdies / totalHoles : 0;
    stats.totalHolesInOne = totalHolesInOne;
    stats.bogeyFreeRounds = bogeyFreeRounds;
    stats.roundsUnderPar = roundsUnderPar;
    stats.totalHolesPlayed = totalHoles;
    if (stats.bestScoreToPar === Infinity) stats.bestScoreToPar = 0;
  });

  return Object.values(map);
};

const fmtStpInt = (n: number): string => {
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
};

const fmtStp = (n: number): string => {
  const s = n.toFixed(1);
  const f = parseFloat(s);
  if (f === 0) return "E";
  return f > 0 ? `+${s}` : s;
};

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
// pct used by birdieRate leaderboard

type Entry = { userId: number; name: string; displayValue: string };

const PAGE_SIZE = 5;

const GolfLeaderboardTable = ({ title, entries }: { title: string; entries: Entry[] }) => {
  const [visible, setVisible] = useState(PAGE_SIZE);
  if (entries.length === 0) return null;
  const shown = entries.slice(0, visible);
  return (
    <div className="leaderboardTable">
      <div className="leaderboardTitle">{title}</div>
      {shown.map((entry, index) => (
        <div
          key={entry.userId}
          className={`leaderboardRow${index === 0 ? " leaderboardFirst" : ""}`}
        >
          <span className="leaderboardRank">#{index + 1}</span>
          <span className="leaderboardName">{entry.name}</span>
          <span className="leaderboardStat">{entry.displayValue}</span>
        </div>
      ))}
      {visible < entries.length && (
        <button className="leaderboardLoadMore" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
          Load {Math.min(PAGE_SIZE, entries.length - visible)} more
        </button>
      )}
    </div>
  );
};

type CategoryDef = { label: string; description: string; entries: (stats: PlayerGolfStats[], allStats: PlayerGolfStats[], allRounds: GolfRound[]) => Entry[] };

type Props = { allScoreData: GolfRound[] };

const GolfLeaderboards = ({ allScoreData }: Props) => {
  const allStats = useMemo(() => buildGolfStats(allScoreData), [allScoreData]);
  const [activeIdx, setActiveIdx] = useState(0);

  const desc = (
    stats: PlayerGolfStats[],
    key: keyof PlayerGolfStats,
    display: (s: PlayerGolfStats) => string,
    filter?: (s: PlayerGolfStats) => boolean
  ): Entry[] =>
    (filter ? stats.filter(filter) : stats)
      .filter((s) => (s[key] as number) > 0)
      .sort((a, b) => (b[key] as number) - (a[key] as number))
      .map((s) => ({ userId: s.userId, name: s.name, displayValue: display(s) }));

  const asc = (
    stats: PlayerGolfStats[],
    key: keyof PlayerGolfStats,
    display: (s: PlayerGolfStats) => string,
  ): Entry[] =>
    stats
      .sort((a, b) => (a[key] as number) - (b[key] as number))
      .map((s) => ({ userId: s.userId, name: s.name, displayValue: display(s) }));

  const categories: CategoryDef[] = [
    { label: "Best Round", description: "Lowest single-round score to par across all rounds played.", entries: (s) => asc(s, "bestScoreToPar", (p) => fmtStpInt(p.bestScoreToPar)) },
    { label: "Avg Score", description: "Average score to par across every round played.", entries: (s) => asc(s, "avgScoreToPar", (p) => fmtStp(p.avgScoreToPar)) },
    { label: "Rounds", description: "Total number of completed rounds on record.", entries: (s) => desc(s, "totalRounds", (p) => `${p.totalRounds} rounds`) },
    { label: "Birdies", description: "Total birdies (1 under par on a hole) across all rounds.", entries: (s) => desc(s, "totalBirdies", (p) => `${p.totalBirdies} birdies`) },
    { label: "Eagles", description: "Total eagles (2 under par on a hole) across all rounds.", entries: (s) => desc(s, "totalEagles", (p) => `${p.totalEagles} eagles`) },
    { label: "Birdie Rate", description: "Birdie percentage per hole played (min. 9 holes required).", entries: (_s, all) => desc(all, "birdieRate", (p) => pct(p.birdieRate), (p) => p.totalHolesPlayed >= 9) },
    { label: "Holes in One", description: "Total aces (score of 1) recorded across all rounds.", entries: (s) => desc(s, "totalHolesInOne", (p) => `${p.totalHolesInOne}`) },
    { label: "Bogey-Free", description: "Rounds completed without a single bogey or worse.", entries: (s) => desc(s, "bogeyFreeRounds", (p) => `${p.bogeyFreeRounds} rounds`) },
    { label: "Under Par", description: "Number of rounds finished with a total score below par.", entries: (s) => desc(s, "roundsUnderPar", (p) => `${p.roundsUnderPar} rounds`) },
    {
      label: "Handicap",
      description: "Simplified Handicap Index: avg of best 8 differentials (score − par) from last 20 rounds × 0.96. Min. 3 rounds required. Lower is better.",
      entries: (_s, all, rounds) => {
        return all
          .map((p) => ({ ...p, hi: calculateHandicapIndex(rounds, p.userId) }))
          .filter((p) => p.hi !== null)
          .sort((a, b) => (a.hi as number) - (b.hi as number))
          .map((p) => ({
            userId: p.userId,
            name: p.name,
            displayValue: `${(p.hi as number) >= 0 ? "+" : ""}${p.hi}`,
          }));
      },
    },
  ];

  if (allStats.length === 0) {
    return <div className="statEmptyMsg">No rounds recorded yet.</div>;
  }

  const active = categories[activeIdx];
  const entries = active.entries([...allStats], allStats, allScoreData);

  return (
    <div className="leaderboardDashboard">
      <div className="leaderboardChips">
        {categories.map((cat, i) => (
          <button
            key={cat.label}
            className={`leaderboardChip${i === activeIdx ? " active" : ""}`}
            onClick={() => setActiveIdx(i)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <p className="leaderboardDescription">{active.description}</p>
      <GolfLeaderboardTable title={active.label} entries={entries} />
    </div>
  );
};

export default GolfLeaderboards;
