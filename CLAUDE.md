# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Start dev server (localhost:3000)
npm run build    # Production build
npm test         # Run tests in watch mode
npm test -- --watchAll=false  # Run tests once (CI mode)
npm test -- --testPathPattern="App"  # Run a single test file
```

## Environment Setup

Firebase config is loaded from environment variables. A `.env` file is required at the project root with:

```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
```

## Architecture

This is a Create React App + TypeScript app with Firebase Firestore as the backend. It supports two games: **Golf** and **Darts**.

### State Management

All Firebase initialization and top-level state (players, courses, player rounds) lives in [src/App.tsx](src/App.tsx). State is passed down as props — there is no global state manager (no Redux, no Context). Firebase collections used:

- `userList` — players (`FetchedPlayer`)
- `courseData` — golf courses (`Course`)
- `playerData` — completed golf rounds (`GolfRound`)
- `dartRounds` — completed dart rounds (`DartRound`)

### Routing (React Router v6)

| Path | Component | Purpose |
|---|---|---|
| `/` | `Home` | Select players, create players/courses |
| `/Golf` | `GolfHome` | Select course, configure golf game |
| `/Darts` | `DartHome` | Select game type, start dart game |
| `/ScoreCard` | `ScoreCard` | Active golf scorecard |
| `/StatPage` | `StatPage` | Golf stats with filter |
| `/DartStatPage` | `DartStatPage` | Dart stats with filter |

### Golf Flow

1. **Home** (`/`) → player selection/creation → navigate to `/Golf`
2. **GolfHome** (`/Golf`) → course selection → `playerRounds` (array of `GolfRound`) initialized → navigate to `/ScoreCard`
3. **ScoreCard** (`/ScoreCard`) → `HoleChanger` advances `currentHole` index, `PlayerScores` updates scores per hole, `ScoreCardTable` renders the full grid, `PostRound` saves to Firestore

### Darts Flow

1. **Home** (`/`) → player selection → navigate to `/Darts`
2. **DartHome** (`/Darts`) → select game type (`Full Match`, `One Set`, `Solo`) → initializes `curPlayerGames` (array of `DartRound`) → renders `DartScoreCard` inline (no route change)
3. **DartScoreCard** → `DartScoreCardTable` tracks tosses, `TossInput` records scores, `TieBreaker` handles ties, `PostDartRoundModal` saves to Firestore

### Key Types ([src/types.ts](src/types.ts))

- `GolfRound` — per-player round with `scores: number[]` indexed by hole
- `DartRound` — per-player round with `scores: { tossNumber, values[] }[]`, `gameWins`, `matchWinner`
- `Course` — has `holes: Hole[]` where each `Hole` has `par`, `yards`, `handicap`
- `PlayerOptionType` / `CourseOptionType` — wrappers for react-select dropdowns

### UI

MUI (Material UI v7) is used for buttons, selects, and icons. `react-select` is used for player/course autocomplete dropdowns. Per-page CSS files co-located with components.

### localStorage Persistence

Active game state survives page refresh. Utility: [src/utils/localStorage.ts](src/utils/localStorage.ts) — `saveToStorage`, `loadFromStorage`, `clearStorage`, plus `STORAGE_KEYS`, `GOLF_KEYS`, `DART_KEYS` constants.

| Key | Value | Cleared in |
|---|---|---|
| `app_currentPlayers` | `FetchedPlayer[]` | never (survives sessions) |
| `app_courseSelected` | `Course \| null` | `PostRound.tsx` |
| `golf_playerRounds` | `GolfRound[]` | `PostRound.tsx` |
| `golf_currentHole` | `number` | `PostRound.tsx` |
| `darts_gameActive` | `boolean` | `PostDartRoundModal.tsx` |
| `darts_curPlayerGames` | `DartRound[]` | `PostDartRoundModal.tsx` |
| `darts_curGameType` | `string` | `PostDartRoundModal.tsx` |
| `darts_currentToss` | `number` | `PostDartRoundModal.tsx` |
| `darts_gameLength` | `number` | `PostDartRoundModal.tsx` |

**No inline styles** — all styling in CSS files co-located with components.

### Dart Stat Page

Stats are computed in `DartOverallStats.tsx` from `filteredAllScoreData: DartRound[]` using these helpers (all in that file):
- `getTossHighScore` — max single-toss sum across all rounds
- `getSetHighScore` — max 3-toss set total
- `getSoloHighScore` — max total for `gameType === "Solo"` rounds
- `getThrowMap` — frequency map of each score value thrown
- `buildPlayerStats` — groups rounds by `userId` and computes all stats, returning `playerFilteredStatsMap`

The `throwBar` width uses an inline style because it's a data-driven percentage.

### Build Notes

- `tsconfig.json` uses `"target": "es5"` with `"downlevelIteration": true` (required for Map/Set spread)
- A patch was applied to `node_modules/webpack/lib/ConcatenationScope.js:148` to guard against `JSON.parse("")` from odd-length hex strings (webpack 5 bug with scope hoisting)
