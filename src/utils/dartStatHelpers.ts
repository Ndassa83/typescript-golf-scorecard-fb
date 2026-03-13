import { DartRound } from "../types";

export const DART_SCORES = [0, 5, 10, 20, 50, 100];

export const tossSum = (toss: DartRound["scores"][number]): number =>
  Array.isArray(toss.values) ? toss.values.reduce((s, v) => s + v, 0) : 0;

export const getTossHighScore = (rounds: DartRound[]): number => {
  let best = 0;
  rounds.forEach((r) =>
    r.scores.forEach((t) => {
      const sum = tossSum(t);
      if (sum > best) best = sum;
    })
  );
  return best;
};

export const getSetHighScore = (rounds: DartRound[]): number => {
  let best = 0;
  rounds.forEach((r) => {
    for (let i = 0; i + 2 < r.scores.length; i += 3) {
      const setTotal = r.scores
        .slice(i, i + 3)
        .reduce((sum, t) => sum + tossSum(t), 0);
      if (setTotal > best) best = setTotal;
    }
  });
  return best;
};

export const getSoloHighScore = (rounds: DartRound[]): number => {
  let best = 0;
  rounds
    .filter((r) => r.gameType === "Solo")
    .forEach((r) => {
      const total = r.scores.reduce((sum, t) => sum + tossSum(t), 0);
      if (total > best) best = total;
    });
  return best;
};

export const getThrowMap = (rounds: DartRound[]): Map<number, number> => {
  const map = new Map<number, number>(DART_SCORES.map((s) => [s, 0]));
  rounds.forEach((r) =>
    r.scores.forEach((t) =>
      (Array.isArray(t.values) ? t.values : []).forEach((v) => {
        map.set(v, (map.get(v) ?? 0) + 1);
      })
    )
  );
  return map;
};
