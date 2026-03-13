import { Autocomplete, TextField } from "@mui/material";
import { PlayerOptionType } from "../../types";
import "./StatFilter.css";

type DartStatFilterProps = {
  playerOptions: PlayerOptionType[];
  selectedDate: string | null;
  hasActiveFilters: boolean;
  handleSelectedPlayerChange: any;
  handleDateChange: any;
  onClearFilters: () => void;
};

const DartStatFilter = ({
  playerOptions,
  selectedDate,
  hasActiveFilters,
  handleSelectedPlayerChange,
  handleDateChange,
  onClearFilters,
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

      {hasActiveFilters && (
        <button className="clearFiltersBtn" onClick={onClearFilters}>
          Clear filters
        </button>
      )}
    </div>
  );
};

export default DartStatFilter;
