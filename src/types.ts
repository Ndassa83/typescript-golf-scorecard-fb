export type Hole = {
  holeNumber: number;
  yards: number;
  par: number;
  handicap: number;
};

export type Course = {
  courseId: string;
  courseName: string;
  totalYards: number;
  totalPar: number;
  holes: Hole[];
};

export type GolfRound = {
  userId: number;
  name: string;
  scores: number[];
  date: string;
  currentCourse: Course;
  tournamentId?: string;
};

export type CourseOptionType = {
  label: string;
  value: Course;
};
export type PlayerOptionType = {
  label: string;
  value: FetchedPlayer;
};
export type TournamentBadge = {
  tournamentId: string;
  tournamentName: string;
  awardedAt: string;
};

export type Tournament = {
  tournamentId: string;
  name: string;
  status: "active" | "completed";
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
  participantIds: number[];
  roundCount: number;
  targetRounds: number;
  lockedCourseId: string | null;
  lockedCourseName: string | null;
  winnerId: number | null;
  winnerName: string | null;
};

export type TournamentStandingRow = {
  userId: number;
  name: string;
  rounds: number;
  totalStrokes: number;
  totalPar: number;
  scoreToPar: number;
};

export type FetchedPlayer = {
  userId: number;
  userName: string;
  avatar: string | null; //when i add profile pics make it a firestore link
  googleUid?: string;
  badges?: TournamentBadge[];
};

export type CourseRoundsMap = {
  [key: string]: GolfRound[];
};

export type DartRound = {
  gameType: string; //this would be either "full set, 3 game, 1 game, 10 toss solo"
  userId: number;
  name: string;
  date: string;
  scores: {
    tossNumber: number;
    values: number[];
  }[];
  gameWins: number;
  matchWinner: boolean | null;
};

export type playerFilteredStats = {
  name: string;
  userId: number;
  totalGameWins: number;
  totalMatchWins: number;
  totalMatchesPlayed: number;
  matchWinPct: number;
  highScoreToss: number;
  highScoreSet: number;
  highScoreSolo: number;
  throwMap: Map<number, number>;
  totalRoundsPlayed: number;
  totalTossCount: number;
  avgTossScore: number;
  longestWinStreak: number;
  currentWinStreak: number;
  bullRate: number;
  missRate: number;
};
export type playerFilteredStatsMap = {
  [key: string]: playerFilteredStats;
};
