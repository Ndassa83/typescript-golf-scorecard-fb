import React, { useEffect, useState } from "react";
import { TextField, Button, Modal, Input } from "@mui/material";
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
        par: 0,
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
    <div className="creatorsContainer">
      <Modal open={isCourseCreatorOpen} onClose={handleCreateCourseModal}>
        <div className="modalContainer">
          <div className="modalContent">
            <div className="modalText">Create your Course</div>

            {!isCourseNamed ? (
              <div>
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
                <div>
                  Number of holes:{" "}
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
                <div className="navButtons">
                  <Button onClick={handleCreateCourseModal}>Close</Button>
                  <Button
                    className="button"
                    // disabled={!createdCourse.courseName} issue with null
                    onClick={handleNewCourseNameSubmit}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="courseName">{courseName} </div>
                <div className="coursePropsContainer">
                  <div className="coursePropsTitlesContainer">
                    <div className="creatorCell ">Hole:</div>
                    <div className="creatorCell titleCell">Yards:</div>
                    <div className="creatorCell titleCell">Par:</div>
                    <div className="creatorCell titleCell">Handicap:</div>
                  </div>
                  {courseHoles.map((hole, index) => (
                    <div className="courseProps">
                      <div className="creatorCell">{hole.holeNumber}</div>
                      <Input
                        className="creatorCell"
                        type="number"
                        value={hole.yards}
                        onChange={(e) => {
                          const newValue = Number(e.target.value);
                          if (!!newValue) {
                            const updatedHoles = [...courseHoles];
                            updatedHoles[index] = {
                              ...hole,
                              yards: newValue,
                            };
                            setCourseHoles(updatedHoles);
                          }
                        }}
                      />
                      <Input
                        className="creatorCell"
                        type="number"
                        value={hole.par}
                        onChange={(e) => {
                          const newValue = Number(e.target.value);
                          if (!!newValue) {
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
                          const newValue = Number(e.target.value);
                          if (!!newValue) {
                            const updatedHoles = [...courseHoles];
                            updatedHoles[index] = {
                              ...hole,
                              handicap: newValue,
                            };
                            setCourseHoles(updatedHoles);
                          }
                        }}
                      />
                    </div>
                  ))}
                  <div className="totalCourseProps ">
                    <div className="creatorCell totalCell">Totals:</div>
                    <div className="creatorCell totalCell">{totalYards}</div>
                    <div className="creatorCell totalCell">{totalPar}</div>
                  </div>
                </div>
                <div className="navButtons">
                  <Button
                    onClick={() => {
                      setIsCourseNamed(false);
                    }}
                  >
                    Back
                  </Button>
                  <Button onClick={handleSubmitCourse}>Submit Course</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
      <Button onClick={handleCreateCourseModal}>Create Course</Button>
    </div>
  );
};
