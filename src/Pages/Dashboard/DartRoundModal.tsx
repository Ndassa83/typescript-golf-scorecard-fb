import { Modal } from "@mui/material";
import { DartRound } from "../../types";
import "./Dashboard.css";
import "../ScoreCard/ScoreCardTable.css";

type Props = {
  open: boolean;
  onClose: () => void;
  rounds: DartRound[];
};

const vals = (t: { values: number[] }): number[] =>
  Array.isArray(t.values) ? t.values : [];

const tossSum = (t: { values: number[] }): number =>
  vals(t).reduce((a, b) => a + b, 0);

export const DartRoundModal = ({ open, onClose, rounds }: Props) => {
  if (!rounds.length) return null;

  const date = new Date(rounds[0].date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const gameType = rounds[0].gameType;
  const maxTosses = Math.max(...rounds.map((r) => r.scores.length));

  return (
    <Modal open={open} onClose={onClose}>
      <div className="roundModalBox">
        <button className="roundModalClose" onClick={onClose}>✕</button>
        <div className="roundModalHeader">
          <div className="roundModalTitle">Darts — {gameType}</div>
          <div className="roundModalDate">{date}</div>
        </div>

        <div className="scoreCardScrollWrapper">
          <div className="scoreCard">
            {/* Label column */}
            <div className="titles">
              <div className="cell cellTitles">Toss</div>
              {rounds.map((r) => (
                <div key={r.userId} className="cell cellTitles scores playerDateDiv">
                  {r.name.length > 9 ? r.name.substring(0, 9) + "..." : r.name}
                </div>
              ))}
            </div>

            {/* One column per toss */}
            {[...Array(maxTosses)].map((_, i) => (
              <div key={i} className="cellInfo">
                <div className="cell">{i + 1}</div>
                {rounds.map((r) => (
                  <div key={r.userId} className="cell scores">
                    {r.scores[i] !== undefined ? tossSum(r.scores[i]) : "—"}
                  </div>
                ))}
              </div>
            ))}

            {/* Totals column */}
            <div className="cellInfo">
              <div className="cell totals">Total</div>
              {rounds.map((r) => (
                <div key={r.userId} className="cell scores totals">
                  {r.scores.reduce((sum, t) => sum + tossSum(t), 0)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="roundModalResults">
          {rounds.map((r) => {
            let resultText = "";
            let resultCls = "solo";
            if (r.matchWinner === true) { resultText = "Win"; resultCls = "win"; }
            else if (r.matchWinner === false) { resultText = "Loss"; resultCls = "loss"; }
            else {
              const total = r.scores.reduce((sum, t) => sum + tossSum(t), 0);
              resultText = `${total} pts`;
            }
            return (
              <div key={r.userId} className="roundModalResultRow">
                <span className="roundModalResultName">{r.name}</span>
                <span className={`gameCardRight ${resultCls}`}>{resultText}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
