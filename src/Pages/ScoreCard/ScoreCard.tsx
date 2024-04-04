import { useState } from "react";
import { CollectionReference, Firestore } from "firebase/firestore";
import { ScoreCardTable } from "./ScoreCardTable";
import { HoleChanger } from "./HoleChanger";
import { PlayerScores } from "./PlayerScores";
import { PostRound } from "./PostRound";
import { Player, Course } from "../../types";
import "./ScoreCard.css";

type ScoreCardPageProps = {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  courseSelected: Course | null;
  database: Firestore;
  collectionRef: CollectionReference;
  setCourseSelected: React.Dispatch<React.SetStateAction<Course | null>>;
};
const ScoreCardPage = ({
  players,
  setPlayers,
  courseSelected,
  setCourseSelected,
  database,
  collectionRef,
}: ScoreCardPageProps) => {
  const [currentHole, setCurrentHole] = useState<number>(0);

  return (
    <div className="scoreCardContainer">
      <div className="courseName"> {courseSelected?.courseName}</div>
      <ScoreCardTable
        players={players}
        courseSelected={courseSelected}
        currentHole={currentHole}
      />

      <HoleChanger
        currentHole={currentHole}
        setCurrentHole={setCurrentHole}
        courseSelected={courseSelected}
        players={players}
        setPlayers={setPlayers}
      />

      <PlayerScores
        players={players}
        setPlayers={setPlayers}
        currentHole={currentHole}
        courseSelected={courseSelected}
      />

      <PostRound
        players={players}
        setPlayers={setPlayers}
        database={database}
        collectionRef={collectionRef}
        courseSelected={courseSelected}
        setCourseSelected={setCourseSelected}
      />
    </div>
  );
};

export default ScoreCardPage;
