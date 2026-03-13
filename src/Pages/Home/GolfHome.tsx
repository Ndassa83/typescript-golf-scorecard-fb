import { useState } from "react";
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
import { CourseCreator } from "./CourseCreator";
import { CourseEditor } from "./CourseEditor";
import CourseSearch from "./CourseSearch";
import { clearStorage, GOLF_KEYS } from "../../utils/localStorage";
import dayjs from "dayjs";

import {
  GolfRound,
  Course,
  CourseOptionType,
  FetchedPlayer,
} from "../../types";
import "./Home.css";

type GolfHomeProps = {
  courseSelected: Course | null;
  setCourseSelected: React.Dispatch<React.SetStateAction<Course | null>>;
  courseOptions: CourseOptionType[];
  createdCourse: Course | null;
  setCreatedCourse: React.Dispatch<React.SetStateAction<Course | null>>;
  currentPlayers: FetchedPlayer[];
  setCurrentPlayers: React.Dispatch<React.SetStateAction<FetchedPlayer[]>>;
  playerRounds: GolfRound[];
  setPlayerRounds: React.Dispatch<React.SetStateAction<GolfRound[]>>;
  onUpdateCourse: (course: Course) => void;
};

const GolfHome = ({
  courseSelected,
  setCourseSelected,
  courseOptions,
  createdCourse,
  setCreatedCourse,
  currentPlayers,
  playerRounds,
  setPlayerRounds,
  onUpdateCourse,
}: GolfHomeProps) => {
  const navigate = useNavigate();
  const [pendingCourse, setPendingCourse] = useState<Course | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(
    () => playerRounds.length > 0
  );
  const [editingCourse, setEditingCourse] = useState(false);

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
    }));
    setPlayerRounds(roundarray);
    navigate("/ScoreCard");
  };

  const canStart = courseSelected && currentPlayers.length > 0;

  return (
    <div className="page-container">
      <div className="two-col-layout golfHomeLayout">
        {/* Left column: course selection */}
        <div className="golfHomeLeftCol">
          <div className="homeStepHeader">
            <span className="homeStepBadge">1</span>
            <h2 className="homeHeading">Select a Course</h2>
          </div>
          <CourseSearch
            onPlayCourse={handleCourseSelect}
            courseOptions={courseOptions}
          />

          <div className="homeCreatorRow">
            <span className="homeSubHeading">New course?</span>
            <CourseCreator
              createdCourse={createdCourse}
              setCreatedCourse={setCreatedCourse}
              courseOptions={courseOptions}
            />
          </div>
        </div>

        {/* Right column: summary + start */}
        <div className="golfHomeRightCol">
          <div className="homeStepHeader">
            <span className="homeStepBadge">2</span>
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
                    <span key={p.userId} className="readyPlayerChip">{p.userName}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="readyRow">
              <span className="readyLabel">Course</span>
              {courseSelected ? (
                <div className="readyCourseInfo">
                  <div className="readyCourseNameRow">
                    <span className="readyCourseName">{courseSelected.courseName}</span>
                    {!courseSelected.courseId.startsWith("api-") && (
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
