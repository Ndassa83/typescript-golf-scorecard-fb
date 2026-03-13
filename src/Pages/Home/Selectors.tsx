import { useEffect } from "react";
import { Autocomplete, TextField } from "@mui/material";
import dayjs from "dayjs";
import "./Selectors.css";
import {
  GolfRound,
  Course,
  CourseOptionType,
  FetchedPlayer,
} from "../../types";

type SelectorsProps = {
  courseSelected: Course | null;
  onCourseChange: (course: Course | null) => void;
  courseOptions: CourseOptionType[];
  currentPlayers: FetchedPlayer[];
  playerRounds: GolfRound[];
  setPlayerRounds: React.Dispatch<React.SetStateAction<GolfRound[]>>;
};

export const Selectors = ({
  courseOptions,
  courseSelected,
  onCourseChange,
  currentPlayers,
  playerRounds,
  setPlayerRounds,
}: SelectorsProps) => {
  useEffect(() => {
    if (courseSelected) {
      // Don't reinitialize if we already have rounds for this course (e.g. restored from storage)
      const alreadyHasRounds =
        playerRounds.length > 0 &&
        playerRounds[0]?.currentCourse?.courseId === courseSelected.courseId;
      if (alreadyHasRounds) return;

      const roundarray: GolfRound[] = [];
      const roundDate = dayjs().toISOString();
      currentPlayers.forEach((player) => {
        const playerRound: GolfRound = {
          userId: player.userId,
          name: player.userName,
          scores: [],
          date: roundDate,
          currentCourse: courseSelected,
        };
        roundarray.push(playerRound);
      });
      setPlayerRounds(roundarray);
    }
  }, [courseSelected]);

  const updateCourse = (
    event: React.SyntheticEvent,
    newValue: CourseOptionType | null
  ) => {
    onCourseChange(newValue?.value || null);
  };

  const selectedOption =
    courseOptions.find((o) => o.value.courseId === courseSelected?.courseId) ?? null;

  return (
    <div className="selectorsContainer">
      <Autocomplete
        className="courseSelector"
        options={courseOptions}
        value={selectedOption}
        renderInput={(params) => <TextField {...params} label="Saved Courses" />}
        onChange={updateCourse}
        size="small"
        ListboxProps={{ className: "muiListbox" }}
        isOptionEqualToValue={(option, value) =>
          option.value.courseId === value.value.courseId
        }
      />

      <div className="playerDetails">
        {currentPlayers.map((player) => (
          <div key={player.userId} className="playerRow">
            <div>{player.userName}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
