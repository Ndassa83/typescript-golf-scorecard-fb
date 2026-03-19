import { DartRound, GolfRound, PlayerOptionType } from "../types";

export type H2HRecord = {
  opponentId: number;
  opponentName: string;
  wins: number;
  losses: number;
  ties: number;
};

// Groups rounds by exact date string — rounds sharing the same date are one session.
// For each session, compares all pairs by total score (lower = win in golf).
export function getH2HForPlayer(
  allRounds: GolfRound[],
  playerId: number,
  playerOptions: PlayerOptionType[]
): H2HRecord[] {
  const sessions: Record<string, GolfRound[]> = {};
  allRounds.forEach((r) => {
    if (!sessions[r.date]) sessions[r.date] = [];
    sessions[r.date].push(r);
  });

  const map: Record<number, H2HRecord> = {};

  Object.values(sessions).forEach((sessionRounds) => {
    const playerRound = sessionRounds.find((r) => r.userId === playerId);
    if (!playerRound) return;
    const myScore = playerRound.scores.reduce((a, b) => a + b, 0);

    sessionRounds.forEach((r) => {
      if (r.userId === playerId) return;
      const opponentScore = r.scores.reduce((a, b) => a + b, 0);

      if (!map[r.userId]) {
        const opponentName =
          playerOptions.find((p) => p.value.userId === r.userId)?.value.userName ?? r.name;
        map[r.userId] = { opponentId: r.userId, opponentName, wins: 0, losses: 0, ties: 0 };
      }

      if (myScore < opponentScore) map[r.userId].wins++;
      else if (myScore > opponentScore) map[r.userId].losses++;
      else map[r.userId].ties++;
    });
  });

  return Object.values(map).sort(
    (a, b) => (b.wins + b.losses + b.ties) - (a.wins + a.losses + a.ties)
  );
}

/**
 * Dart H2H: groups rounds by date. For each date-session,
 * if the linked player has matchWinner=true and opponent has matchWinner=false → player wins.
 * Skips Solo rounds (no opponent).
 */
export function getDartH2HForPlayer(
  allRounds: DartRound[],
  playerId: number,
  playerOptions: PlayerOptionType[]
): H2HRecord[] {
  // Only consider non-solo rounds where matchWinner is determined
  const matchRounds = allRounds.filter(
    (r) => r.gameType !== "Solo" && r.matchWinner !== null
  );

  const sessions: Record<string, DartRound[]> = {};
  matchRounds.forEach((r) => {
    if (!sessions[r.date]) sessions[r.date] = [];
    sessions[r.date].push(r);
  });

  const map: Record<number, H2HRecord> = {};

  Object.values(sessions).forEach((sessionRounds) => {
    const playerRound = sessionRounds.find((r) => r.userId === playerId);
    if (!playerRound) return;

    sessionRounds.forEach((r) => {
      if (r.userId === playerId) return;

      if (!map[r.userId]) {
        const opponentName =
          playerOptions.find((p) => p.value.userId === r.userId)?.value.userName ?? r.name;
        map[r.userId] = { opponentId: r.userId, opponentName, wins: 0, losses: 0, ties: 0 };
      }

      if (playerRound.matchWinner === true && r.matchWinner === false) {
        map[r.userId].wins++;
      } else if (playerRound.matchWinner === false && r.matchWinner === true) {
        map[r.userId].losses++;
      }
      // both true or both false = data anomaly, skip
    });
  });

  return Object.values(map).sort(
    (a, b) => (b.wins + b.losses + b.ties) - (a.wins + a.losses + a.ties)
  );
}

export function getH2HBetween(
  allRounds: GolfRound[],
  idA: number,
  idB: number
): { winsA: number; winsB: number; ties: number } {
  const sessions: Record<string, GolfRound[]> = {};
  allRounds.forEach((r) => {
    if (!sessions[r.date]) sessions[r.date] = [];
    sessions[r.date].push(r);
  });

  let winsA = 0, winsB = 0, ties = 0;

  Object.values(sessions).forEach((sessionRounds) => {
    const roundA = sessionRounds.find((r) => r.userId === idA);
    const roundB = sessionRounds.find((r) => r.userId === idB);
    if (!roundA || !roundB) return;

    const scoreA = roundA.scores.reduce((a, b) => a + b, 0);
    const scoreB = roundB.scores.reduce((a, b) => a + b, 0);

    if (scoreA < scoreB) winsA++;
    else if (scoreA > scoreB) winsB++;
    else ties++;
  });

  return { winsA, winsB, ties };
}
