import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
} from "@mui/material";
import { Course, CourseOptionType, Hole } from "../../types";
import "./Creators.css";

type CourseCreatorProp = {
  createdCourse: Course | null;
  setCreatedCourse: React.Dispatch<React.SetStateAction<Course | null>>;
  courseOptions: CourseOptionType[];
};

export const CourseCreator = ({
  createdCourse,
  setCreatedCourse,
  courseOptions,
}: CourseCreatorProp) => {
  const [isCourseCreatorOpen, setIsCourseCreatorOpen] =
    useState<boolean>(false);
  const [isCourseNamed, setIsCourseNamed] = useState<boolean>(false);
  const [courseName, setCourseName] = useState<string>("");
  const [amtCourseHoles, setAmtCourseHoles] = useState<number>(9);
  const [courseHoles, setCourseHoles] = useState<Hole[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [courseTotalPar, setCourseTotalPar] = useState<number | null>(null);
  const [courseTotalYards, setCourseTotalYards] = useState<number | null>(null);

  const setHolesArray = () => {
    let holesArray = [];
    for (let i = 0; i < amtCourseHoles; i++) {
      holesArray.push({
        holeNumber: i + 1,
        yards: 0,
        par: 3,
        handicap: 0,
      });
    }
    setCourseHoles(holesArray);
  };

  const handleCreateCourseModal = () => {
    setIsCourseCreatorOpen((prev) => !prev);
    setCourseName("");
  };

  const handleNewCourseNameSubmit = () => {
    if (courseOptions.some((course) => course.label === courseName)) {
      alert("Course Name is Taken");
      return;
    }
    setIsCourseNamed(true);
    setHolesArray();
  };

  const { totalPar, totalYards }: any = courseHoles.reduce(
    (acc, hole) => {
      acc.totalPar += hole.par;
      acc.totalYards += hole.yards;
      return acc;
    },
    { totalPar: 0, totalYards: 0 }
  );

  const handleSubmitCourse = () => {
    setCreatedCourse({
      courseName: courseName,
      courseId: courseId,
      holes: courseHoles,
      totalPar: totalPar,
      totalYards: totalYards,
    });
    setIsCourseCreatorOpen(false);
  };

  //resets the course creator
  useEffect(() => {
    setCourseHoles([]);
    setCourseId("");
    setAmtCourseHoles(9);
    setCourseName("");
    setIsCourseNamed(false);
  }, [createdCourse]);

  return (
    <>
      <Button onClick={handleCreateCourseModal}>Create Course</Button>

      <Dialog
        open={isCourseCreatorOpen}
        onClose={handleCreateCourseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "'Fredoka One', cursive" }}>
          Create your Course
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {!isCourseNamed ? (
            <>
              <TextField
                id="CourseNameInput"
                label="Course Name"
                variant="outlined"
                defaultValue={courseName}
                fullWidth
                onChange={(e) => {
                  const value = e.target.value;
                  setCourseName(value);
                  setCourseId(value.replace(" ", ""));
                }}
              />
              <div className="holesInputRow">
                <span>Number of holes:</span>
                <Input
                  className="creatorCell"
                  value={amtCourseHoles}
                  type="number"
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value >= 1 && value <= 18) {
                      setAmtCourseHoles(value);
                    }
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="courseCreatorName">{courseName}</div>
              <div className="coursePropsContainer">
                <div className="coursePropsTitlesContainer">
                  <div className="creatorCell">Hole:</div>
                  <div className="creatorCell titleCell">Yards:</div>
                  <div className="creatorCell titleCell">Par:</div>
                  <div className="creatorCell titleCell">Handicap:</div>
                </div>
                {courseHoles.map((hole, index) => (
                  <div key={hole.holeNumber} className="courseProps">
                    <div className="creatorCell">{hole.holeNumber}</div>
                    <Input
                      className="creatorCell"
                      type="number"
                      value={hole.yards === 0 ? "" : hole.yards}
                      placeholder="0"
                      onChange={(e) => {
                        const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                        if (!isNaN(newValue)) {
                          const updatedHoles = [...courseHoles];
                          updatedHoles[index] = { ...hole, yards: newValue };
                          setCourseHoles(updatedHoles);
                        }
                      }}
                    />
                    <Input
                      className="creatorCell"
                      type="number"
                      value={hole.par === 0 ? "" : hole.par}
                      placeholder="0"
                      onChange={(e) => {
                        const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                        if (!isNaN(newValue)) {
                          const updatedHoles = [...courseHoles];
                          updatedHoles[index] = { ...hole, par: newValue };
                          setCourseHoles(updatedHoles);
                        }
                      }}
                    />
                    <Input
                      className="creatorCell"
                      type="number"
                      value={hole.handicap}
                      onChange={(e) => {
                        const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                        if (!isNaN(newValue)) {
                          const updatedHoles = [...courseHoles];
                          updatedHoles[index] = { ...hole, handicap: newValue };
                          setCourseHoles(updatedHoles);
                        }
                      }}
                    />
                  </div>
                ))}
                <div className="totalCourseProps">
                  <div className="creatorCell totalCell">Totals:</div>
                  <div className="creatorCell totalCell">{totalYards}</div>
                  <div className="creatorCell totalCell">{totalPar}</div>
                </div>
              </div>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ gap: 1, px: 3, pb: 2 }}>
          {!isCourseNamed ? (
            <>
              <Button onClick={handleCreateCourseModal}>Close</Button>
              <Button onClick={handleNewCourseNameSubmit}>Next</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsCourseNamed(false)}>Back</Button>
              <Button onClick={handleSubmitCourse}>Submit Course</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};
