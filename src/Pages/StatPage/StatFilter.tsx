import { Autocomplete, TextField, Button } from "@mui/material";
import { PlayerOptionType, CourseOptionType } from "../../types";
import "./StatFilter.css";

type StatFilterProps = {
  playerOptions: PlayerOptionType[];
  courseOptions: CourseOptionType[];
  selectedDate: string | null;
  handleSelectedPlayerChange: any;
  handleSelectedCourseChange: any;
  handleDateChange: any;
};

const StatFilter = ({
  playerOptions,
  courseOptions,
  selectedDate,
  handleSelectedPlayerChange,
  handleSelectedCourseChange,
  handleDateChange,
}: StatFilterProps) => {
  return (
    <div className="filterWrapper">
      <Autocomplete
        className="courseSelector"
        options={courseOptions}
        renderInput={(params) => <TextField {...params} label="Courses" />}
        onChange={handleSelectedCourseChange}
        size="small"
        ListboxProps={{ style: { fontSize: "12px" } }}
      />

      <Autocomplete
        className="courseSelector"
        options={playerOptions}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => <TextField {...params} label="Players" />}
        onChange={handleSelectedPlayerChange}
        size="small"
        ListboxProps={{ style: { fontSize: "12px" } }}
      />

      <TextField
        size="small"
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
        className="textField"
      />
    </div>
  );
};

export default StatFilter;
