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
import { DartRound, FetchedPlayer, PlayerOptionType } from "../../types";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import dayjs from "dayjs";
import { CollectionReference } from "firebase/firestore";
import {
  saveToStorage,
  loadFromStorage,
  clearStorage,
  STORAGE_KEYS,
  DART_KEYS,
} from "../../utils/localStorage";
import { PlayerSelector } from "./PlayerSelector";
import { PlayerCreator } from "./PlayerCreator";
import "./Home.css";

type DartHomeProps = {
  currentPlayers: FetchedPlayer[];
  setCurrentPlayers: React.Dispatch<React.SetStateAction<FetchedPlayer[]>>;
  dartRoundCollection: CollectionReference;
  currentUserEmail: string | null;
  playerOptions: PlayerOptionType[];
  setCreatedPlayerId: React.Dispatch<React.SetStateAction<number | undefined>>;
  setCreatedPlayerName: React.Dispatch<React.SetStateAction<string>>;
  createdPlayerName: string | null;
  playerImage: string | null;
  setPlayerImage: React.Dispatch<React.SetStateAction<string | null>>;
  setDartGameActive: React.Dispatch<React.SetStateAction<boolean>>;
};

const DartHome = ({
  currentPlayers,
  setCurrentPlayers,
  playerOptions,
  setCreatedPlayerId,
  setCreatedPlayerName,
  createdPlayerName,
  playerImage,
  setPlayerImage,
  setDartGameActive,
}: DartHomeProps) => {
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
  const [showPlayerError, setShowPlayerError] = useState(false);

  useEffect(() => { saveToStorage(STORAGE_KEYS.DARTS_CUR_GAME_TYPE, curGameType); }, [curGameType]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.DARTS_CUR_PLAYER_GAMES, curPlayerGames); }, [curPlayerGames]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DARTS_GAME_ACTIVE, gameActive);
    setDartGameActive(gameActive);
  }, [gameActive]);
  useEffect(() => { if (currentPlayers.length > 0) setShowPlayerError(false); }, [currentPlayers]);

  const handleDiscardGame = () => {
    clearStorage(...DART_KEYS);
    setCurPlayerGames([]);
    setGameActive(false);
    setCurGameType("Full Match");
    setShowResumeModal(false);
  };

  const handleGameStart = () => {
    if (currentPlayers.length > 0) {
      const roundDate = dayjs().toISOString();
      const gamesArr: DartRound[] = currentPlayers.map((player) => ({
        gameType: curGameType,
        userId: player.userId,
        name: player.userName,
        date: roundDate,
        scores: [],
        gameWins: 0,
        matchWinner: false,
      }));

      setShowPlayerError(false);
      saveToStorage(STORAGE_KEYS.DARTS_CUR_PLAYER_GAMES, gamesArr);
      saveToStorage(STORAGE_KEYS.DARTS_GAME_ACTIVE, true);
      setCurPlayerGames(gamesArr);
      setGameActive(true);
    } else {
      setShowPlayerError(true);
    }
  };

  const isSoloMultiPlayer = curGameType === "Solo" && currentPlayers.length > 1;
  const canStart = currentPlayers.length > 0 && !isSoloMultiPlayer;

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
          <div className="two-col-layout">
            {/* Left column: player selection */}
            <div className="golfHomeLeftCol">
              <div className="homeStepHeader">
                <span className="homeStepBadge">1</span>
                <h2 className="homeHeading">Add Players</h2>
              </div>
              <PlayerSelector
                playerOptions={playerOptions}
                currentPlayers={currentPlayers}
                setCurrentPlayers={setCurrentPlayers}
              />
              <div className="homeCreatorRow">
                <span className="homeSubHeading">New player?</span>
                <PlayerCreator
                  setCreatedPlayerId={setCreatedPlayerId}
                  setCreatedPlayerName={setCreatedPlayerName}
                  createdPlayerName={createdPlayerName}
                  playerOptions={playerOptions}
                  playerImage={playerImage}
                  setPlayerImage={setPlayerImage}
                />
              </div>
            </div>

            {/* Right column: game setup + start */}
            <div className="golfHomeRightCol">
              <div className="homeStepHeader">
                <span className="homeStepBadge">2</span>
                <h2 className="homeHeading">Game Setup</h2>
              </div>

              <div className="readyPanel">
                <div className="readyRow">
                  <span className="readyLabel">Players</span>
                  {currentPlayers.length === 0 ? (
                    <span className="readyEmpty">None selected</span>
                  ) : (
                    <div className="readyPlayerList">
                      {currentPlayers.map((p) => (
                        <span key={p.userId} className="readyPlayerChip">{p.userName}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="readyRow">
                  <span className="readyLabel">Game Type</span>
                  <FormControl fullWidth size="small">
                    <InputLabel id="dart-game-type-label">Game Type</InputLabel>
                    <Select
                      labelId="dart-game-type-label"
                      value={curGameType}
                      label="Game Type"
                      onChange={(e) => setCurGameType(e.target.value)}
                    >
                      <MenuItem value="Full Match">Full Match</MenuItem>
                      <MenuItem value="One Set">One Set</MenuItem>
                      <MenuItem value="Solo">Solo 10-Toss</MenuItem>
                    </Select>
                  </FormControl>
                  {isSoloMultiPlayer && (
                    <span className="soloWarning">Solo is single-player only</span>
                  )}
                </div>
              </div>

              {showPlayerError && (
                <span className="soloWarning">Add at least one player to start</span>
              )}

              <Button
                variant="contained"
                disabled={!canStart}
                className="startRoundBtn"
                onClick={handleGameStart}
              >
                Start Game
              </Button>
            </div>
          </div>
        </div>
      )}
      {gameActive && <Navigate to="/DartScoreCard" replace />}
    </div>
  );
};

export default DartHome;
