export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

export function loadFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

export function clearStorage(...keys: string[]): void {
  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}

// Storage key constants
export const STORAGE_KEYS = {
  CURRENT_PLAYERS: "app_currentPlayers",
  COURSE_SELECTED: "app_courseSelected",
  GOLF_PLAYER_ROUNDS: "golf_playerRounds",
  GOLF_CURRENT_HOLE: "golf_currentHole",
  DARTS_GAME_ACTIVE: "darts_gameActive",
  DARTS_CUR_PLAYER_GAMES: "darts_curPlayerGames",
  DARTS_CUR_GAME_TYPE: "darts_curGameType",
  DARTS_CURRENT_TOSS: "darts_currentToss",
  DARTS_GAME_LENGTH: "darts_gameLength",
} as const;

export const GOLF_KEYS = [
  STORAGE_KEYS.COURSE_SELECTED,
  STORAGE_KEYS.GOLF_PLAYER_ROUNDS,
  STORAGE_KEYS.GOLF_CURRENT_HOLE,
] as const;

export const DART_KEYS = [
  STORAGE_KEYS.DARTS_GAME_ACTIVE,
  STORAGE_KEYS.DARTS_CUR_PLAYER_GAMES,
  STORAGE_KEYS.DARTS_CUR_GAME_TYPE,
  STORAGE_KEYS.DARTS_CURRENT_TOSS,
  STORAGE_KEYS.DARTS_GAME_LENGTH,
] as const;
