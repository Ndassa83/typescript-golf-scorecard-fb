import { Autocomplete, TextField } from "@mui/material";
import { PlayerOptionType } from "../../types";
import "./StatFilter.css";

type DartStatFilterProps = {
  playerOptions: PlayerOptionType[];
  dateFrom: string;
  dateTo: string;
  hasActiveFilters: boolean;
  handleSelectedPlayerChange: any;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onClearFilters: () => void;
};

const DartStatFilter = ({
  playerOptions,
  dateFrom,
  dateTo,
  hasActiveFilters,
  handleSelectedPlayerChange,
  onDateFromChange,
  onDateToChange,
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

export default DartStatFilter;
