import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Autocomplete, TextField, Button } from "@mui/material";
import dayjs from "dayjs";
import "./Selectors.css";
import {
  Player,
  Course,
  CourseOptionType,
  PlayerOptionType,
  FetchedPlayer,
} from "../../types";

type SelectorsProps = {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  courseSelected: Course | null;
  setCourseSelected: React.Dispatch<React.SetStateAction<Course | null>>;
  playerOptions: PlayerOptionType[];
  courseOptions: CourseOptionType[];
};

export const Selectors = ({
  players,
  setPlayers,
  playerOptions,
  courseOptions,
  courseSelected,
  setCourseSelected,
}: SelectorsProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<FetchedPlayer | null>();

  const handleSelectedPlayerChange = (
    event: React.SyntheticEvent,
    newValue: PlayerOptionType | null
  ) => {
    setSelectedPlayer(newValue?.value || null);
  };

  // updatePlayersNobutton
  useEffect(() => {
    if (courseSelected && selectedPlayer) {
      const newPlayer: Player = {
        userId: selectedPlayer.userId,
        name: selectedPlayer.userName,
        scores: [],
        date: dayjs().toISOString(),
        currentCourse: courseSelected,
        // avatar: selectedPlayer.avatar?. //i want have the image here
      };

      setPlayers((prevPlayers: Player[]) => [...prevPlayers, newPlayer]);

      setSelectedPlayer(null);
    } else {
    }
  }, [selectedPlayer]);

  // const updatePlayers = () => {
  //   if (courseSelected && selectedPlayer) {
  //     const newPlayer: Player = {
  //       userId: selectedPlayer.userId,
  //       name: selectedPlayer.userName,
  //       scores: [],
  //       date: dayjs().toISOString(),
  //       currentCourse: courseSelected,
  //     };

  //     setPlayers((prevPlayers: Player[]) => [...prevPlayers, newPlayer]);

  //     setSelectedPlayer(null);
  //   } else {
  //     alert("Please select a course.");
  //   }
  // };

  const updateCourse = (
    event: React.SyntheticEvent,
    newValue: CourseOptionType | null
  ) => {
    setCourseSelected(newValue?.value || null);
    setPlayers([]);
  };

  const deletePlayer = (userId: number) => {
    setPlayers(
      players.filter((player) => {
        if (player.userId !== userId) return player;
      })
    );
  };
  console.log(players);
  return (
    <div className="selectorsContainer">
      <Autocomplete
        className="courseSelector"
        options={courseOptions}
        renderInput={(params) => <TextField {...params} label="Courses" />}
        onChange={updateCourse}
        size="small"
        ListboxProps={{ style: { fontSize: "12px" } }}
      />
      {courseSelected && (
        <div className="courseDetails">
          <div>{courseSelected?.courseName}</div>
          <div>Holes: {courseSelected?.holes.length}</div>
          <div>Par: {courseSelected?.totalPar}</div>
          <div>Yards: {courseSelected?.totalYards}</div>
        </div>
      )}

      {courseSelected && (
        <Autocomplete
          className="courseSelector"
          options={playerOptions}
          getOptionLabel={(option) => option.label}
          renderInput={(params) => <TextField {...params} label="Players" />}
          onChange={handleSelectedPlayerChange}
          size="small"
          ListboxProps={{ style: { fontSize: "12px" } }}
        />
      )}

      {/* <Button className='button'
        disabled={!selectedPlayer}
        onClick={updatePlayers}
        className="handleSelectedPlayerChangeButton"
      >
        + Add Player
      </Button> */}

      <div className="playerDetails">
        {players.map((player) => (
          //if player.value.userID is in players
          <div className="playerRow">
            {/* <img src={player.avatar?.name} /> */}
            <Button
              className="button"
              onClick={() => deletePlayer(player.userId)}
            >
              x
            </Button>
            <div key={player.userId}>{player.name}</div>
          </div>
        ))}
      </div>

      {courseSelected && (
        <Button disabled={players.length === 0}>
          <Link to="/ScoreCard">Start Round</Link>
        </Button>
      )}
    </div>
  );
};
