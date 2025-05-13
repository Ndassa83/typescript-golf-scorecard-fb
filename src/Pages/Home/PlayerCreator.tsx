import React, { useState } from "react";
import { TextField, Button, Modal } from "@mui/material";
import SeedRandom from "seed-random";
import { PlayerOptionType, Course, CourseOptionType } from "../../types";
import "./Creators.css";

type PlayerCreatorProps = {
  setCreatedPlayerName: React.Dispatch<React.SetStateAction<string>>;
  setCreatedPlayerId: React.Dispatch<React.SetStateAction<number | undefined>>;
  createdPlayerName: string | null;
  playerOptions: PlayerOptionType[];
  playerImage: File | null;
  setPlayerImage: React.Dispatch<React.SetStateAction<File | null>>;
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
  const [image, setImage] = useState<File | null>(null);

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
    <div className="creatorsContainer">
      {/* create player Modal */}
      <Modal open={isPlayerCreatorOpen} onClose={handleCreatePlayerModal}>
        <div className="modalContainer">
          <div className="modalContent">
            <div className="modalText">Create your player</div>
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

            <Button
              className="button"
              disabled={!createdPlayerName}
              onClick={handleNewPlayerSubmit}
            >
              Submit
            </Button>
            <Button onClick={handleCreatePlayerModal}>Close</Button>
          </div>
        </div>
      </Modal>

      <Button onClick={handleCreatePlayerModal}>Create Player</Button>
    </div>
  );
};
