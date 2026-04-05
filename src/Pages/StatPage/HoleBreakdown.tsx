import { useMemo } from "react";
import { Course, GolfRound } from "../../types";
import "./HoleBreakdown.css";

type Props = {
  allRounds: GolfRound[]; // unfiltered — for global averages
  course: Course;
};

const HoleBreakdown = ({ allRounds, course }: Props) => {
  const courseRounds = useMemo(
    () => allRounds.filter((r) => r.currentCourse.courseId === course.courseId),
    [allRounds, course.courseId]
  );

  const holeAvgs = useMemo(() => {
    return course.holes.map((hole, i) => {
      const scores = courseRounds
        .map((r) => r.scores[i])
        .filter((s) => s !== undefined && s > 0);
      const avg = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;
      return { hole, avg, count: scores.length };
    });
  }, [courseRounds, course.holes]);

  if (courseRounds.length === 0) return null;

  return (
    <div className="holeBreakdown">
      <div className="holeBreakdownLabel">
        Average score · {courseRounds.length} round{courseRounds.length !== 1 ? "s" : ""}
      </div>
      <div className="holeBreakdownScroll">
        {holeAvgs.map(({ hole, avg }) => {
          const diff = avg !== null ? avg - hole.par : null;
          let colorClass = "hbNeutral";
          if (diff !== null) {
            if (diff <= -2) colorClass = "hbEagle";
            else if (diff <= -1) colorClass = "hbBirdie";
            else if (diff < 0.15) colorClass = "hbPar";
            else if (diff < 1.15) colorClass = "hbBogey";
            else colorClass = "hbDouble";
          }
          return (
            <div key={hole.holeNumber} className="hbCell">
              <span className="hbHoleNum">#{hole.holeNumber}</span>
              <span className="hbPar">P{hole.par}</span>
              <span className={`hbAvg ${colorClass}`}>
                {avg !== null ? avg.toFixed(1) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HoleBreakdown;
