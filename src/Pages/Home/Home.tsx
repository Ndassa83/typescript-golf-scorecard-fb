import { Selectors } from "./Selectors";
import { PlayerCreator } from "./PlayerCreator";
import { CourseCreator } from "./CourseCreator";

import {
  GolfRound,
  Hole,
  Course,
  CourseOptionType,
  PlayerOptionType,
  FetchedPlayer,
} from "../../types";
import "./Home.css";
import { PlayerSelector } from "./PlayerSelector";
import { Link, Route } from "react-router-dom";
import GolfHome from "./GolfHome";
import { Button } from "@mui/material";

type HomeProps = {
  courseSelected: Course | null;
  setCourseSelected: React.Dispatch<React.SetStateAction<Course | null>>;
  playerOptions: PlayerOptionType[];
  courseOptions: CourseOptionType[];
  setCreatedPlayerName: React.Dispatch<React.SetStateAction<string>>;
  createdPlayerName: string | null;
  setCreatedPlayerId: React.Dispatch<React.SetStateAction<number | undefined>>;
  createdCourse: Course | null;
  setCreatedCourse: React.Dispatch<React.SetStateAction<Course | null>>;
  playerImage: string | null;
  setPlayerImage: React.Dispatch<React.SetStateAction<string | null>>;
  currentPlayers: FetchedPlayer[];
  setCurrentPlayers: React.Dispatch<React.SetStateAction<FetchedPlayer[]>>;
};

const Home = ({
  courseSelected,
  setCourseSelected,
  playerOptions,
  courseOptions,
  setCreatedPlayerId,
  setCreatedPlayerName,
  createdPlayerName,
  createdCourse,
  setCreatedCourse,
  playerImage,
  setPlayerImage,
  currentPlayers,
  setCurrentPlayers,
}: HomeProps) => {
  return (
    <div className="page-container">
      <div className="homeHero">
        <img src="/Backyard_Sports_logo.png" className="homeLogoImg" alt="Backyard Sports"></img>
        <p className="homeSubtitle">Track scores for Golf and Darts</p>
      </div>
      <div className="homeContent">
        <div className="homeStep">
          <div className="homeStepHeader">
            <span className="homeStepBadge">1</span>
            <h2 className="homeHeading">Add players</h2>
          </div>
          <PlayerSelector
            playerOptions={playerOptions}
            currentPlayers={currentPlayers}
            setCurrentPlayers={setCurrentPlayers}
          />
          <div className="homeCreatorRow">
            <span className="homeSubHeading">New player?</span>
            <PlayerCreator
              setCreatedPlayerId={setCreatedPlayerId}
              setCreatedPlayerName={setCreatedPlayerName}
              createdPlayerName={createdPlayerName}
              playerOptions={playerOptions}
              playerImage={playerImage}
              setPlayerImage={setPlayerImage}
            />
          </div>
        </div>
        <div className="homeStep">
          <div className="homeStepHeader">
            <span className="homeStepBadge">2</span>
            <h2 className="homeHeading">Choose a game</h2>
          </div>
          {currentPlayers.length === 0 ? (
            <p className="homeHint">Add at least one player to get started</p>
          ) : (
            <p className="homeHint">Ready — pick a game below</p>
          )}
          <div className="gameButtonGroup">
            <Button
              disabled={currentPlayers.length === 0}
              className="homeGameBtn"
              component={Link}
              to="/Golf"
            >
              Golf
            </Button>
            <Button
              disabled={currentPlayers.length === 0}
              className="homeGameBtn"
              component={Link}
              to="/Darts"
            >
              Darts
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
