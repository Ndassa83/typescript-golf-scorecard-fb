import { Autocomplete, TextField, Button } from "@mui/material";
import { PlayerOptionType, CourseOptionType } from "../../types";
import "./StatFilter.css";

type DartStatFilterProps = {
  playerOptions: PlayerOptionType[];
  selectedDate: string | null;
  handleSelectedPlayerChange: any;
  handleDateChange: any;
};

const DartStatFilter = ({
  playerOptions,
  selectedDate,
  handleSelectedPlayerChange,
  handleDateChange,
}: DartStatFilterProps) => {
  return (
    <div className="filterWrapper">
      <Autocomplete
        className="courseSelector"
        options={playerOptions}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => <TextField {...params} label="Players" />}
        onChange={handleSelectedPlayerChange}
        size="small"
        ListboxProps={{ className: "muiListbox" }}
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

export default DartStatFilter;
