import { Autocomplete, TextField } from "@mui/material";
import { PlayerOptionType, CourseOptionType, Course, FetchedPlayer } from "../../types";
import "./StatFilter.css";

type StatFilterProps = {
  playerOptions: PlayerOptionType[];
  courseOptions: CourseOptionType[];
  selectedCourse: Course | null;
  selectedPlayer: FetchedPlayer | null;
  dateFrom: string;
  dateTo: string;
  hasActiveFilters: boolean;
  handleSelectedPlayerChange: any;
  onCourseChange: (course: Course | null) => void;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onClearFilters: () => void;
};

const StatFilter = ({
  playerOptions,
  courseOptions,
  selectedCourse,
  selectedPlayer,
  dateFrom,
  dateTo,
  hasActiveFilters,
  handleSelectedPlayerChange,
  onCourseChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}: StatFilterProps) => {
  const selectedCourseOption =
    selectedCourse
      ? courseOptions.find((o) => o.value.courseId === selectedCourse.courseId) ?? null
      : null;

  const selectedPlayerOption =
    selectedPlayer
      ? playerOptions.find((o) => o.value.userId === selectedPlayer.userId) ?? null
      : null;

  return (
    <div className="filterWrapper">
      <Autocomplete
        className="courseSelector"
        options={courseOptions}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => <TextField {...params} label="Course" />}
        value={selectedCourseOption}
        onChange={(_, opt) => onCourseChange(opt?.value ?? null)}
        size="small"
        slotProps={{ listbox: { className: "muiListbox" } }}
      />

      <Autocomplete
        className="courseSelector"
        options={playerOptions}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => <TextField {...params} label="Players" />}
        value={selectedPlayerOption}
        onChange={handleSelectedPlayerChange}
        size="small"
        slotProps={{ listbox: { className: "muiListbox" } }}
      />

      <div className="dateRangeRow">
        <input
          type="date"
          className="dateInput"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
        <span className="dateRangeSep">—</span>
        <input
          type="date"
          className="dateInput"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
      </div>

      {hasActiveFilters && (
        <button className="clearFiltersBtn" onClick={onClearFilters}>
          Clear filters
        </button>
      )}
    </div>
  );
};

export default StatFilter;
