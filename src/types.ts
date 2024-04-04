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

export type Player = {
  userId: number;
  name: string;
  scores: number[];
  date: string;
  currentCourse: Course;
};

export type CourseOptionType = {
  label: string;
  value: Course;
};
export type PlayerOptionType = {
  label: string;
  value: FetchedPlayer;
};
export type FetchedPlayer = {
  userId: number;
  userName: string;
};

export type CourseRoundsMap = {
  [key: string]: Player[];
};
