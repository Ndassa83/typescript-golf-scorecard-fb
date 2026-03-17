import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { Firestore, collection, getDocs } from "firebase/firestore";
import { CourseCreator } from "./CourseCreator";
import { CourseEditor } from "./CourseEditor";
import CourseSearch from "./CourseSearch";
import { PlayerSelector } from "./PlayerSelector";
import { PlayerCreator } from "./PlayerCreator";
import AvatarIcon from "../../components/Avatar/AvatarIcon";
import { clearStorage, GOLF_KEYS } from "../../utils/localStorage";
import { getH2HBetween } from "../../utils/h2hHelpers";
import dayjs from "dayjs";

import {
  GolfRound,
  Course,
  CourseOptionType,
  PlayerOptionType,
  FetchedPlayer,
  Tournament,
} from "../../types";
import "./Home.css";

type GolfHomeProps = {
  courseSelected: Course | null;
  setCourseSelected: React.Dispatch<React.SetStateAction<Course | null>>;
  courseOptions: CourseOptionType[];
  playerOptions: PlayerOptionType[];
  createdCourse: Course | null;
  setCreatedCourse: React.Dispatch<React.SetStateAction<Course | null>>;
  currentPlayers: FetchedPlayer[];
  setCurrentPlayers: React.Dispatch<React.SetStateAction<FetchedPlayer[]>>;
  playerRounds: GolfRound[];
  setPlayerRounds: React.Dispatch<React.SetStateAction<GolfRound[]>>;
  onUpdateCourse: (course: Course) => void;
  activeTournament: Tournament | null;
  setCreatedPlayerId: React.Dispatch<React.SetStateAction<number | undefined>>;
  setCreatedPlayerName: React.Dispatch<React.SetStateAction<string>>;
  createdPlayerName: string | null;
  playerImage: string | null;
  setPlayerImage: React.Dispatch<React.SetStateAction<string | null>>;
  database: Firestore;
};

const GolfHome = ({
  courseSelected,
  setCourseSelected,
  courseOptions,
  playerOptions,
  createdCourse,
  setCreatedCourse,
  currentPlayers,
  setCurrentPlayers,
  playerRounds,
  setPlayerRounds,
  onUpdateCourse,
  activeTournament,
  setCreatedPlayerId,
  setCreatedPlayerName,
  createdPlayerName,
  playerImage,
  setPlayerImage,
  database,
}: GolfHomeProps) => {
  const navigate = useNavigate();
  const [pendingCourse, setPendingCourse] = useState<Course | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(
    () => playerRounds.length > 0
  );
  const [editingCourse, setEditingCourse] = useState(false);
  const [playOutsideTournament, setPlayOutsideTournament] = useState(false);
  const [allRounds, setAllRounds] = useState<GolfRound[]>([]);
  const [roundsFetched, setRoundsFetched] = useState(false);

  const handleCourseSelect = (course: Course | null) => {
    if (playerRounds.length > 0) {
      setPendingCourse(course);
      setShowDiscardModal(true);
    } else {
      setCourseSelected(course);
    }
  };

  const handleDiscardAndStart = () => {
    setPlayerRounds([]);
    clearStorage(...GOLF_KEYS);
    setCourseSelected(pendingCourse);
    setShowDiscardModal(false);
    setPendingCourse(null);
  };

  const handleStartRound = () => {
    if (!courseSelected) return;
    const roundDate = dayjs().toISOString();
    const roundarray: GolfRound[] = currentPlayers.map((player) => ({
      userId: player.userId,
      name: player.userName,
      scores: [],
      date: roundDate,
      currentCourse: courseSelected,
      ...(activeTournament && !playOutsideTournament
        ? { tournamentId: activeTournament.tournamentId }
        : {}),
    }));
    setPlayerRounds(roundarray);
    navigate("/ScoreCard");
  };

  const handleToggleOutsideTournament = () => {
    const next = !playOutsideTournament;
    setPlayOutsideTournament(next);
    if (!next && activeTournament && playerOptions.length > 0) {
      const tournamentPlayers = activeTournament.participantIds
        .map((id) => playerOptions.find((p) => p.value.userId === id)?.value)
        .filter((p): p is FetchedPlayer => !!p);
      if (tournamentPlayers.length > 0) setCurrentPlayers(tournamentPlayers);
      if (activeTournament.lockedCourseId) {
        const locked = courseOptions.find(
          (o) => o.value.courseId === activeTournament.lockedCourseId
        );
        if (locked) setCourseSelected(locked.value);
      }
    }
  };

  const courseLocked = !!(activeTournament?.lockedCourseId) && !playOutsideTournament;
  const tournamentPlayersLocked = !!(activeTournament) && !playOutsideTournament;

  // When entering GolfHome for a tournament round, force currentPlayers to match tournament participants
  useEffect(() => {
    if (!activeTournament || playerOptions.length === 0 || playOutsideTournament) return;
    const tournamentPlayers = activeTournament.participantIds
      .map((id) => playerOptions.find((p) => p.value.userId === id)?.value)
      .filter((p): p is FetchedPlayer => !!p);
    if (tournamentPlayers.length > 0) {
      setCurrentPlayers(tournamentPlayers);
    }
  }, [activeTournament?.tournamentId, playerOptions.length, playOutsideTournament]);

  // Auto-select locked course when entering GolfHome for a tournament round
  useEffect(() => {
    if (courseLocked && activeTournament?.lockedCourseId && courseOptions.length > 0) {
      const locked = courseOptions.find(
        (o) => o.value.courseId === activeTournament.lockedCourseId
      );
      if (locked) setCourseSelected(locked.value);
    }
  }, [courseLocked, activeTournament?.lockedCourseId, courseOptions.length]);

  // Fetch all rounds once when 2+ players are selected (for H2H display)
  useEffect(() => {
    if (currentPlayers.length < 2 || roundsFetched) return;
    getDocs(collection(database, "playerData")).then((snap) => {
      setAllRounds(snap.docs.map((d) => d.data() as GolfRound));
      setRoundsFetched(true);
    });
  }, [currentPlayers.length, roundsFetched]);

  const h2hPairs = useMemo(() => {
    if (currentPlayers.length < 2 || allRounds.length === 0) return [];
    const pairs: { nameA: string; nameB: string; winsA: number; winsB: number; ties: number }[] = [];
    for (let i = 0; i < currentPlayers.length; i++) {
      for (let j = i + 1; j < currentPlayers.length; j++) {
        const a = currentPlayers[i];
        const b = currentPlayers[j];
        const { winsA, winsB, ties } = getH2HBetween(allRounds, a.userId, b.userId);
        if (winsA + winsB + ties > 0) {
          pairs.push({ nameA: a.userName, nameB: b.userName, winsA, winsB, ties });
        }
      }
    }
    return pairs;
  }, [currentPlayers, allRounds]);

  const canStart = courseSelected && currentPlayers.length > 0;

  // Step numbers shift when player selection is visible
  const showPlayerSelector = !tournamentPlayersLocked;
  const courseStepNum = showPlayerSelector ? 2 : 1;
  const readyStepNum = showPlayerSelector ? 3 : 2;

  return (
    <div className="page-container">
      <div className="two-col-layout golfHomeLayout">
        {/* Left column */}
        <div className="golfHomeLeftCol">
          {activeTournament && (
            <div className={`tournamentBanner${playOutsideTournament ? " tournamentBannerMuted" : ""}`}>
              <span className="tournamentBannerText">
                {playOutsideTournament
                  ? `Casual round (${activeTournament.name} paused)`
                  : `🏆 ${activeTournament.name} — Round ${activeTournament.roundCount + 1} of ${activeTournament.targetRounds}`}
              </span>
              <button
                className="tournamentBannerToggle"
                onClick={handleToggleOutsideTournament}
              >
                {playOutsideTournament ? "Back to tournament" : "Play casual round"}
              </button>
            </div>
          )}

          {/* Player selection — hidden during locked tournament rounds */}
          {showPlayerSelector && (
            <>
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
            </>
          )}

          {/* Course selection */}
          <div className="homeStepHeader">
            <span className="homeStepBadge">{courseStepNum}</span>
            <h2 className="homeHeading">Select a Course</h2>
          </div>
          {courseLocked ? (
            <div className="courseLockedDisplay">
              <span className="courseLockedLabel">Course (locked)</span>
              <span className="courseLockedName">{activeTournament?.lockedCourseName}</span>
            </div>
          ) : (
            <CourseSearch
              onPlayCourse={handleCourseSelect}
              courseOptions={courseOptions}
            />
          )}
          {!courseLocked && (
            <div className="homeCreatorRow">
              <span className="homeSubHeading">New course?</span>
              <CourseCreator
                createdCourse={createdCourse}
                setCreatedCourse={setCreatedCourse}
                courseOptions={courseOptions}
              />
            </div>
          )}
        </div>

        {/* Right column: summary + start */}
        <div className="golfHomeRightCol">
          <div className="homeStepHeader">
            <span className="homeStepBadge">{readyStepNum}</span>
            <h2 className="homeHeading">Ready to Play</h2>
          </div>

          <div className="readyPanel">
            <div className="readyRow">
              <span className="readyLabel">Players</span>
              {currentPlayers.length === 0 ? (
                <span className="readyEmpty">None selected</span>
              ) : (
                <div className="readyPlayerList">
                  {currentPlayers.map((p) => (
                    <span key={p.userId} className="readyPlayerChip">
                      <AvatarIcon avatarId={p.avatar} size={20} initials={p.userName} />
                      {p.userName}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {h2hPairs.length > 0 && (
              <div className="readyRow">
                <span className="readyLabel">H2H</span>
                <div className="readyH2HList">
                  {h2hPairs.map((p, i) => (
                    <span key={i} className="readyH2HBadge">
                      <span className="readyH2HName">{p.nameA}</span>
                      {" "}
                      <span className="readyH2HRecord">
                        <span className="readyH2HW">{p.winsA}</span>
                        {"–"}
                        <span className="readyH2HL">{p.winsB}</span>
                        {p.ties > 0 && <>{"–"}<span className="readyH2HT">{p.ties}</span></>}
                      </span>
                      {" "}
                      <span className="readyH2HName">{p.nameB}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="readyRow">
              <span className="readyLabel">Course</span>
              {courseSelected ? (
                <div className="readyCourseInfo">
                  <div className="readyCourseNameRow">
                    <span className="readyCourseName">{courseSelected.courseName}</span>
                    {!courseSelected.courseId.startsWith("api-") && !courseLocked && (
                      <Tooltip title="Edit course">
                        <IconButton
                          size="small"
                          onClick={() => setEditingCourse(true)}
                          sx={{ ml: 0.5, p: 0.25 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                  <span className="readyCourseDetails">
                    {courseSelected.holes.length} holes &nbsp;·&nbsp; Par {courseSelected.totalPar}
                    {courseSelected.totalYards ? ` · ${courseSelected.totalYards} yds` : ""}
                  </span>
                </div>
              ) : (
                <span className="readyEmpty">No course selected</span>
              )}
            </div>
          </div>

          <Button
            variant="contained"
            disabled={!canStart}
            className="startRoundBtn"
            onClick={handleStartRound}
          >
            Start Round
          </Button>
        </div>
      </div>

      {editingCourse && courseSelected && (
        <CourseEditor
          course={courseSelected}
          onSave={(updated) => {
            onUpdateCourse(updated);
            setEditingCourse(false);
          }}
          onClose={() => setEditingCourse(false)}
        />
      )}

      <Dialog open={showDiscardModal} onClose={() => setShowDiscardModal(false)}>
        <DialogTitle>Active Round in Progress</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have an unfinished round. Do you want to continue it, or discard it and start a new game?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowDiscardModal(false);
              navigate("/ScoreCard");
            }}
          >
            Continue Current Round
          </Button>
          <Button color="error" onClick={handleDiscardAndStart}>
            Discard &amp; Start New
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default GolfHome;
