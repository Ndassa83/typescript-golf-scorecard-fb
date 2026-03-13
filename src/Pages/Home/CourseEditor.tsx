import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
} from "@mui/material";
import { Course, Hole } from "../../types";
import "./Creators.css";

type CourseEditorProps = {
  course: Course;
  onSave: (updatedCourse: Course) => void;
  onClose: () => void;
};

export const CourseEditor = ({ course, onSave, onClose }: CourseEditorProps) => {
  const [holes, setHoles] = useState<Hole[]>(course.holes.map((h) => ({ ...h })));

  const { totalPar, totalYards } = holes.reduce(
    (acc, hole) => {
      acc.totalPar += hole.par;
      acc.totalYards += hole.yards;
      return acc;
    },
    { totalPar: 0, totalYards: 0 }
  );

  const updateHole = (index: number, field: keyof Omit<Hole, "holeNumber">, raw: string) => {
    const newValue = raw === "" ? 0 : Number(raw);
    if (isNaN(newValue)) return;
    setHoles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: newValue };
      return updated;
    });
  };

  const handleSave = () => {
    onSave({
      ...course,
      holes,
      totalPar,
      totalYards,
    });
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: "'Fredoka One', cursive" }}>
        Edit Course — {course.courseName}
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <div className="coursePropsContainer">
          <div className="coursePropsTitlesContainer">
            <div className="creatorCell">Hole:</div>
            <div className="creatorCell titleCell">Yards:</div>
            <div className="creatorCell titleCell">Par:</div>
            <div className="creatorCell titleCell">Handicap:</div>
          </div>
          {holes.map((hole, index) => (
            <div key={hole.holeNumber} className="courseProps">
              <div className="creatorCell">{hole.holeNumber}</div>
              <Input
                className="creatorCell"
                type="number"
                value={hole.yards === 0 ? "" : hole.yards}
                placeholder="0"
                onChange={(e) => updateHole(index, "yards", e.target.value)}
              />
              <Input
                className="creatorCell"
                type="number"
                value={hole.par === 0 ? "" : hole.par}
                placeholder="0"
                onChange={(e) => updateHole(index, "par", e.target.value)}
              />
              <Input
                className="creatorCell"
                type="number"
                value={hole.handicap}
                onChange={(e) => updateHole(index, "handicap", e.target.value)}
              />
            </div>
          ))}
          <div className="totalCourseProps">
            <div className="creatorCell totalCell">Totals:</div>
            <div className="creatorCell totalCell">{totalYards}</div>
            <div className="creatorCell totalCell">{totalPar}</div>
          </div>
        </div>
      </DialogContent>

      <DialogActions sx={{ gap: 1, px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Course</Button>
      </DialogActions>
    </Dialog>
  );
};
