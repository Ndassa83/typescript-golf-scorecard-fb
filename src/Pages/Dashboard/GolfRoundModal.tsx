import { Modal } from "@mui/material";
import { GolfRound } from "../../types";
import { ScoreCardTable } from "../ScoreCard/ScoreCardTable";
import "./Dashboard.css";

type Props = {
  open: boolean;
  onClose: () => void;
  rounds: GolfRound[];
};

const formatScoreToPar = (diff: number): { text: string; cls: string } => {
  if (diff === 0) return { text: "E", cls: "even" };
  if (diff > 0) return { text: `+${diff}`, cls: "positive" };
  return { text: `${diff}`, cls: "negative" };
};

export const GolfRoundModal = ({ open, onClose, rounds }: Props) => {
  if (!rounds.length) return null;

  const course = rounds[0].currentCourse;
  const date = new Date(rounds[0].date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Modal open={open} onClose={onClose}>
      <div className="roundModalBox">
        <button className="roundModalClose" onClick={onClose}>✕</button>
        <div className="roundModalHeader">
          <div className="roundModalTitle">{course.courseName}</div>
          <div className="roundModalDate">{date}</div>
        </div>
        <ScoreCardTable playerRounds={rounds} courseSelected={course} />
        <div className="roundModalResults">
          {rounds.map((r) => {
            const total = r.scores.reduce((a, b) => a + b, 0);
            const diff = total - course.totalPar;
            const { text, cls } = formatScoreToPar(diff);
            return (
              <div key={r.userId} className="roundModalResultRow">
                <span className="roundModalResultName">{r.name}</span>
                <span className="roundModalResultScore">
                  {total} <span className={`gameCardRight ${cls}`}>({text})</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
