import { useState } from "react";
import { Autocomplete, TextField, Chip } from "@mui/material";
import "./Selectors.css";
import { PlayerOptionType, FetchedPlayer } from "../../types";

type PlayerSelectorProps = {
  playerOptions: PlayerOptionType[];
  currentPlayers: FetchedPlayer[];
  setCurrentPlayers: React.Dispatch<React.SetStateAction<FetchedPlayer[]>>;
};

export const PlayerSelector = ({
  playerOptions,
  currentPlayers,
  setCurrentPlayers,
}: PlayerSelectorProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleSelectedPlayerChange = (
    event: React.SyntheticEvent,
    newValue: PlayerOptionType | null
  ) => {
    if (!newValue) return;
    const player = newValue.value;
    if (currentPlayers.some((p) => p.userId === player.userId)) {
      window.alert("Player is already in the game");
    } else {
      setCurrentPlayers((prev) => [...prev, player]);
    }
    setInputValue("");
  };

  const handleDeletePlayer = (userId: number) => {
    setCurrentPlayers(currentPlayers.filter((p) => p.userId !== userId));
  };

  return (
    <div className="selectorsContainer">
      <Autocomplete
        className="courseSelector"
        options={playerOptions}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => <TextField {...params} label="Players" />}
        onChange={handleSelectedPlayerChange}
        value={null}
        inputValue={inputValue}
        onInputChange={(_, val) => setInputValue(val)}
        size="small"
        ListboxProps={{ className: "muiListbox" }}
      />

      <div className="playerDetails">
        {currentPlayers?.map((player) => (
          <Chip
            key={player.userId}
            label={player.userName}
            onDelete={() => handleDeletePlayer(player.userId)}
            className="playerChip"
          />
        ))}
      </div>
    </div>
  );
};
