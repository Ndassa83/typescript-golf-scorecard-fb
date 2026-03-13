import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { DartRound, FetchedPlayer } from "../../types";
import { useState, useEffect } from "react";
import DartScoreCard from "../ScoreCard/DartScoreCard";
import dayjs from "dayjs";
import { CollectionReference } from "firebase/firestore";
import {
  saveToStorage,
  loadFromStorage,
  clearStorage,
  STORAGE_KEYS,
  DART_KEYS,
} from "../../utils/localStorage";
import "./Home.css";

type DartHomeProps = {
  currentPlayers: FetchedPlayer[];
  setCurrentPlayers: React.Dispatch<React.SetStateAction<FetchedPlayer[]>>;
  dartRoundCollection: CollectionReference;
};

const DartHome = ({ currentPlayers, dartRoundCollection }: DartHomeProps) => {
  const [curGameType, setCurGameType] = useState<string>(
    () => loadFromStorage<string>(STORAGE_KEYS.DARTS_CUR_GAME_TYPE) ?? "Full Match"
  );
  const [curPlayerGames, setCurPlayerGames] = useState<DartRound[]>(
    () => loadFromStorage<DartRound[]>(STORAGE_KEYS.DARTS_CUR_PLAYER_GAMES) ?? []
  );
  const [gameActive, setGameActive] = useState<boolean>(
    () => loadFromStorage<boolean>(STORAGE_KEYS.DARTS_GAME_ACTIVE) ?? false
  );
  const [showResumeModal, setShowResumeModal] = useState<boolean>(
    () => loadFromStorage<boolean>(STORAGE_KEYS.DARTS_GAME_ACTIVE) ?? false
  );

  useEffect(() => { saveToStorage(STORAGE_KEYS.DARTS_CUR_GAME_TYPE, curGameType); }, [curGameType]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.DARTS_CUR_PLAYER_GAMES, curPlayerGames); }, [curPlayerGames]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.DARTS_GAME_ACTIVE, gameActive); }, [gameActive]);

  const handleDiscardGame = () => {
    clearStorage(...DART_KEYS);
    setCurPlayerGames([]);
    setGameActive(false);
    setCurGameType("Full Match");
    setShowResumeModal(false);
  };

  const handleGameStart = () => {
    if (currentPlayers.length > 0) {
      const gamesArr: DartRound[] = [];

      currentPlayers.forEach((player) => {
        const game = {
          gameType: curGameType,
          userId: player.userId,
          name: player.userName,
          date: dayjs().toISOString(),
          scores: [],
          gameWins: 0,
          matchWinner: false,
        };
        return gamesArr.push(game);
      });

      setCurPlayerGames(gamesArr);
      setGameActive(true);
    } else {
      alert("Please add players");
    }
  };

  return (
    <div className="dartHomeContainer">
      <Dialog open={showResumeModal} onClose={() => setShowResumeModal(false)}>
        <DialogTitle>Active Game in Progress</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have an unfinished dart game. Do you want to continue it, or discard it and start a new game?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResumeModal(false)}>
            Continue Current Game
          </Button>
          <Button color="error" onClick={handleDiscardGame}>
            Discard &amp; Start New
          </Button>
        </DialogActions>
      </Dialog>
      {!gameActive && (
        <div className="page-container">
          <div className="gameSelect">
            <div className="gameSelectLabel">Select a game mode to begin</div>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Game Type</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={curGameType}
                defaultValue={"Full Match"}
                label="Game Type"
                onChange={(event) => setCurGameType(event.target.value)}
              >
                <MenuItem value={"Full Match"}> Full Match</MenuItem>
                <MenuItem value={"One Set"}>One Set</MenuItem>
                <MenuItem value={"Solo"}>Solo 10-Toss</MenuItem>
              </Select>
            </FormControl>
            <Button
              disabled={curGameType === "Solo" && currentPlayers.length > 1}
              onClick={handleGameStart}
            >
              Start Game!
            </Button>
            <div className="gameSelectLabel" style={{ fontSize: 16 }}>Players:</div>
            <div>
              {currentPlayers.map((player) => (
                <div key={player.userId}>{player.userName}</div>
              ))}
            </div>
          </div>
        </div>
      )}
      {gameActive && (
        <DartScoreCard
          curPlayerGames={curPlayerGames}
          setCurPlayerGames={setCurPlayerGames}
          curGameType={curGameType}
          dartRoundCollection={dartRoundCollection}
        />
      )}
    </div>
  );
};

export default DartHome;
