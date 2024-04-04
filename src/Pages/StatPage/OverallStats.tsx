import { Player } from "../../types";

import "./OverallStats.css";

type OverallStatsProps = {
  courseScores: Player[];
};

const OverallStats = ({ courseScores }: OverallStatsProps) => {
  let bestScore = 99; // questionable initiation here
  const overallScoreToPar = courseScores.reduce((totalScoreToPar, score) => {
    const scoreToPar =
      score.scores.reduce((acc, cur) => acc + cur, 0) -
      score.currentCourse.totalPar;
    if (scoreToPar < bestScore) {
      bestScore = scoreToPar;
    }
    return totalScoreToPar + scoreToPar / courseScores.length;
  }, 0);

  return (
    <div className="overallStats">
      <div>Rounds Played: {courseScores.length}</div>
      <div>
        Avg. Score: {overallScoreToPar.toFixed(1)}
        {` (${(
          courseScores[0].currentCourse.totalPar + overallScoreToPar
        ).toFixed(1)})`}
      </div>
      <div>Best Score: {bestScore}</div>
    </div>
  );
};

export default OverallStats;
