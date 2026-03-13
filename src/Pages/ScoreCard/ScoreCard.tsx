import { useState, useEffect } from "react";
import { CollectionReference, Firestore } from "firebase/firestore";
import { ScoreCardTable } from "./ScoreCardTable";
import { HoleChanger } from "./HoleChanger";
import { PlayerScores } from "./PlayerScores";
import { PostRound } from "./PostRound";
import { GolfRound, Course } from "../../types";
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from "../../utils/localStorage";
import { BackyardGolfLogo } from "../../components/BackyardGolfLogo";
import "./ScoreCard.css";

type ScoreCardPageProps = {
  playerRounds: GolfRound[];
  setPlayerRounds: React.Dispatch<React.SetStateAction<GolfRound[]>>;
  courseSelected: Course | null;
  database: Firestore;
  collectionRef: CollectionReference;
  setCourseSelected: React.Dispatch<React.SetStateAction<Course | null>>;
  currentUserEmail: string | null;
};
const ScoreCardPage = ({
  playerRounds,
  setPlayerRounds,
  courseSelected,
  setCourseSelected,
  database,
  collectionRef,
  currentUserEmail,
}: ScoreCardPageProps) => {
  const [currentHole, setCurrentHole] = useState<number>(
    () => loadFromStorage<number>(STORAGE_KEYS.GOLF_CURRENT_HOLE) ?? 0
  );
  useEffect(() => { saveToStorage(STORAGE_KEYS.GOLF_CURRENT_HOLE, currentHole); }, [currentHole]);

  return (
    <div className="scoreCardContainer">
      <BackyardGolfLogo className="gameLogo" />
      <div className="courseName">{courseSelected?.courseName}</div>

      <ScoreCardTable
        playerRounds={playerRounds}
        courseSelected={courseSelected}
        currentHole={currentHole}
      />

      <HoleChanger
        currentHole={currentHole}
        setCurrentHole={setCurrentHole}
        courseSelected={courseSelected}
        playerRounds={playerRounds}
        setPlayerRounds={setPlayerRounds}
      />

      <PlayerScores
        playerRounds={playerRounds}
        setPlayerRounds={setPlayerRounds}
        currentHole={currentHole}
        courseSelected={courseSelected}
      />

      <PostRound
        playerRounds={playerRounds}
        setPlayerRounds={setPlayerRounds}
        database={database}
        collectionRef={collectionRef}
        courseSelected={courseSelected}
        setCourseSelected={setCourseSelected}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
};

export default ScoreCardPage;
