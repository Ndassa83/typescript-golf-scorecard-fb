import { Selectors } from "./Selectors";
import { PlayerCreator } from "./PlayerCreator";
import { CourseCreator } from "./CourseCreator";

import {
  Player,
  Hole,
  Course,
  CourseOptionType,
  PlayerOptionType,
  FetchedPlayer,
} from "../../types";
import "./Home.css";

type HomeProps = {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  courseSelected: Course | null;
  setCourseSelected: React.Dispatch<React.SetStateAction<Course | null>>;
  playerOptions: PlayerOptionType[];
  courseOptions: CourseOptionType[];
  setCreatedPlayerName: React.Dispatch<React.SetStateAction<string>>;
  createdPlayerName: string | null;
  setCreatedPlayerId: React.Dispatch<React.SetStateAction<number | undefined>>;
  createdCourse: Course | null;
  setCreatedCourse: React.Dispatch<React.SetStateAction<Course | null>>;
};

const Home = ({
  players,
  setPlayers,
  courseSelected,
  setCourseSelected,
  playerOptions,
  courseOptions,
  setCreatedPlayerId,
  setCreatedPlayerName,
  createdPlayerName,
  createdCourse,
  setCreatedCourse,
}: HomeProps) => {
  return (
    <div className="homeContainer">
      <div className="creatorsContainer">
        <PlayerCreator
          setCreatedPlayerId={setCreatedPlayerId}
          setCreatedPlayerName={setCreatedPlayerName}
          createdPlayerName={createdPlayerName}
          playerOptions={playerOptions}
        />
        <CourseCreator
          createdCourse={createdCourse}
          setCreatedCourse={setCreatedCourse}
          courseOptions={courseOptions}
        />
      </div>
      <Selectors
        players={players}
        setPlayers={setPlayers}
        playerOptions={playerOptions}
        courseOptions={courseOptions}
        courseSelected={courseSelected}
        setCourseSelected={setCourseSelected}
      />
    </div>
  );
};

export default Home;
