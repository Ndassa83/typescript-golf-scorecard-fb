import React, { useState } from "react";
import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SeedRandom from "seed-random";
import { PlayerOptionType, Course, CourseOptionType } from "../../types";
import "./Creators.css";

type PlayerCreatorProps = {
  setCreatedPlayerName: React.Dispatch<React.SetStateAction<string>>;
  setCreatedPlayerId: React.Dispatch<React.SetStateAction<number | undefined>>;
  createdPlayerName: string | null;
  playerOptions: PlayerOptionType[];
  playerImage: string | null;
  setPlayerImage: React.Dispatch<React.SetStateAction<string | null>>;
};

export const PlayerCreator = ({
  setCreatedPlayerId,
  setCreatedPlayerName,
  createdPlayerName,
  playerOptions,
  playerImage,
  setPlayerImage,
}: PlayerCreatorProps) => {
  const [isPlayerCreatorOpen, setIsPlayerCreatorOpen] =
    useState<boolean>(false);
  const [image, setImage] = useState<string | null>(null);

  const handleCreatePlayerModal = () => {
    setIsPlayerCreatorOpen((prev) => !prev);
  };

  const isPlayerNameTaken = () => {
    return playerOptions.some((player) => player.label === createdPlayerName);
  };

  const handleNewPlayerSubmit = () => {
    if (!createdPlayerName) return;
    if (isPlayerNameTaken()) {
      setCreatedPlayerName("");
      alert("Username is Taken");
    } else {
      setCreatedPlayerId(SeedRandom(createdPlayerName));
      setIsPlayerCreatorOpen(false);
      setPlayerImage(image);
    }
  };

  const handleImageChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  return (
    <>
      <Button onClick={handleCreatePlayerModal}>Create Player</Button>

      <Dialog
        open={isPlayerCreatorOpen}
        onClose={handleCreatePlayerModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "'Fredoka One', cursive" }}>
          Create your player
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            id="playerNameInput"
            label="Player Name"
            variant="outlined"
            fullWidth
            value={createdPlayerName}
            onChange={(e) => setCreatedPlayerName(e.target.value)}
          />
          <Button variant="contained" component="label">
            Upload File
            <input type="file" hidden onChange={handleImageChange} />
          </Button>
        </DialogContent>
        <DialogActions sx={{ gap: 1, px: 3, pb: 2 }}>
          <Button onClick={handleCreatePlayerModal}>Close</Button>
          <Button
            disabled={!createdPlayerName}
            onClick={handleNewPlayerSubmit}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
