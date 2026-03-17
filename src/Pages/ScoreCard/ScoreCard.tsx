import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CollectionReference, Firestore } from "firebase/firestore";
import { ScoreCardTable } from "./ScoreCardTable";
import { HoleChanger } from "./HoleChanger";
import { PlayerScores } from "./PlayerScores";
import { PostRound } from "./PostRound";
import { GolfRound, Course, Tournament, PlayerOptionType } from "../../types";
import { saveToStorage, loadFromStorage, clearStorage, STORAGE_KEYS, GOLF_KEYS } from "../../utils/localStorage";
import { BackyardGolfLogo } from "../../components/BackyardGolfLogo";
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import "./ScoreCard.css";

type ScoreCardPageProps = {
  playerRounds: GolfRound[];
  setPlayerRounds: React.Dispatch<React.SetStateAction<GolfRound[]>>;
  courseSelected: Course | null;
  database: Firestore;
  collectionRef: CollectionReference;
  setCourseSelected: React.Dispatch<React.SetStateAction<Course | null>>;
  currentUserEmail: string | null;
  activeTournament: Tournament | null;
  setActiveTournament: React.Dispatch<React.SetStateAction<Tournament | null>>;
  playerOptions?: PlayerOptionType[];
};
const ScoreCardPage = ({
  playerRounds,
  setPlayerRounds,
  courseSelected,
  setCourseSelected,
  database,
  collectionRef,
  currentUserEmail,
  activeTournament,
  setActiveTournament,
  playerOptions,
}: ScoreCardPageProps) => {
  const navigate = useNavigate();
  const [currentHole, setCurrentHole] = useState<number>(
    () => loadFromStorage<number>(STORAGE_KEYS.GOLF_CURRENT_HOLE) ?? 0
  );
  const [quitDialogOpen, setQuitDialogOpen] = useState(false);

  useEffect(() => { saveToStorage(STORAGE_KEYS.GOLF_CURRENT_HOLE, currentHole); }, [currentHole]);

  const handleQuitRound = () => {
    clearStorage(...GOLF_KEYS, STORAGE_KEYS.GOLF_CURRENT_HOLE);
    setPlayerRounds([]);
    setCourseSelected(null);
    navigate("/");
  };

  return (
    <div className="scoreCardContainer">
      <BackyardGolfLogo className="gameLogo" />
      <div className="courseName">{courseSelected?.courseName}</div>

      <ScoreCardTable
        playerRounds={playerRounds}
        courseSelected={courseSelected}
        currentHole={currentHole}
        playerOptions={playerOptions}
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
        activeTournament={activeTournament}
        setActiveTournament={setActiveTournament}
      />

      <Button color="error" onClick={() => setQuitDialogOpen(true)}>
        Quit Round
      </Button>

      <Dialog open={quitDialogOpen} onClose={() => setQuitDialogOpen(false)}>
        <DialogTitle>Quit Round?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your round progress will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuitDialogOpen(false)}>Keep Playing</Button>
          <Button color="error" onClick={handleQuitRound}>Quit</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ScoreCardPage;
