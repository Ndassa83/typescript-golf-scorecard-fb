import { useState, useMemo } from "react";
import { GolfRound } from "../../types";
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

type Props = { allScoreData: GolfRound[] };

const GolfLeaderboards = ({ allScoreData }: Props) => {
  const allStats = useMemo(() => buildGolfStats(allScoreData), [allScoreData]);

  if (allStats.length === 0) {
    return <div className="statEmptyMsg">No rounds recorded yet.</div>;
  }

  const desc = (
    key: keyof PlayerGolfStats,
    display: (s: PlayerGolfStats) => string,
    filter?: (s: PlayerGolfStats) => boolean
  ): Entry[] =>
    (filter ? allStats.filter(filter) : allStats)
      .filter((s) => (s[key] as number) > 0)
      .sort((a, b) => (b[key] as number) - (a[key] as number))
      .map((s) => ({ userId: s.userId, name: s.name, displayValue: display(s) }));

  const asc = (
    key: keyof PlayerGolfStats,
    display: (s: PlayerGolfStats) => string,
    filter?: (s: PlayerGolfStats) => boolean
  ): Entry[] =>
    (filter ? allStats.filter(filter) : allStats)
      .sort((a, b) => (a[key] as number) - (b[key] as number))
      .map((s) => ({ userId: s.userId, name: s.name, displayValue: display(s) }));

  return (
    <div className="leaderboardContainer">
      <GolfLeaderboardTable
        title="Best Single Round"
        entries={asc("bestScoreToPar", (s) => fmtStpInt(s.bestScoreToPar))}
      />
      <GolfLeaderboardTable
        title="Best Avg Score to Par"
        entries={asc("avgScoreToPar", (s) => fmtStp(s.avgScoreToPar))}
      />
      <GolfLeaderboardTable
        title="Most Rounds Played"
        entries={desc("totalRounds", (s) => `${s.totalRounds} rounds`)}
      />
      <GolfLeaderboardTable
        title="Most Birdies"
        entries={desc("totalBirdies", (s) => `${s.totalBirdies} birdies`)}
      />
      <GolfLeaderboardTable
        title="Most Eagles"
        entries={desc("totalEagles", (s) => `${s.totalEagles} eagles`)}
      />
      <GolfLeaderboardTable
        title="Best Birdie Rate"
        entries={desc("birdieRate", (s) => pct(s.birdieRate), (s) => s.totalHolesPlayed >= 9)}
      />
      <GolfLeaderboardTable
        title="Most Holes in One"
        entries={desc("totalHolesInOne", (s) => `${s.totalHolesInOne}`)}
      />
      <GolfLeaderboardTable
        title="Most Bogey-Free Rounds"
        entries={desc("bogeyFreeRounds", (s) => `${s.bogeyFreeRounds} rounds`)}
      />
      <GolfLeaderboardTable
        title="Most Rounds Under Par"
        entries={desc("roundsUnderPar", (s) => `${s.roundsUnderPar} rounds`)}
      />
    </div>
  );
};

export default GolfLeaderboards;
