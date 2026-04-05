import { GolfRound } from "../types";

/**
 * Simplified WHS Handicap Index (no slope/course rating).
 * Differential = Score - Par per round.
 * Takes best 8 of last 20 differentials × 0.96.
 * Returns null if player has fewer than 3 rounds.
 */
export function calculateHandicapIndex(
  allRounds: GolfRound[],
  playerId: number
): number | null {
  const playerRounds = allRounds
    .filter((r) => r.userId === playerId)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (playerRounds.length < 3) return null;

  const last20 = playerRounds.slice(-20);

  const differentials = last20.map((r) => {
    const total = r.scores.reduce((a, b) => a + b, 0);
    return total - r.currentCourse.totalPar;
  });

  differentials.sort((a, b) => a - b);
  const best8 = differentials.slice(0, Math.min(8, differentials.length));
  const avg = best8.reduce((a, b) => a + b, 0) / best8.length;

  return Math.round(avg * 0.96 * 10) / 10;
}

/**
 * Returns average scores per par type (par-3, par-4, par-5) for a given player.
 * Returns null for a type if the player has played no holes of that par.
 */
export function getParTypeAvgs(
  allRounds: GolfRound[],
  playerId: number
): { par3Avg: number | null; par4Avg: number | null; par5Avg: number | null } {
  const playerRounds = allRounds.filter((r) => r.userId === playerId);

  let par3Total = 0, par3Count = 0;
  let par4Total = 0, par4Count = 0;
  let par5Total = 0, par5Count = 0;

  playerRounds.forEach((round) => {
    round.scores.forEach((score, i) => {
      const hole = round.currentCourse.holes[i];
      if (!hole) return;
      if (hole.par === 3) { par3Total += score; par3Count++; }
      else if (hole.par === 4) { par4Total += score; par4Count++; }
      else if (hole.par === 5) { par5Total += score; par5Count++; }
    });
  });

  return {
    par3Avg: par3Count > 0 ? Math.round((par3Total / par3Count) * 100) / 100 : null,
    par4Avg: par4Count > 0 ? Math.round((par4Total / par4Count) * 100) / 100 : null,
    par5Avg: par5Count > 0 ? Math.round((par5Total / par5Count) * 100) / 100 : null,
  };
}
