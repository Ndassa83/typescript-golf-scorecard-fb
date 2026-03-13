import { Link } from "react-router-dom";
import "firebase/firestore";
import { Firestore, CollectionReference } from "firebase/firestore";
import { addDoc } from "firebase/firestore";
import { Button } from "@mui/material";
import { GolfRound, Course } from "../../types";
import { useEffect, useState } from "react";
import { clearStorage, GOLF_KEYS, STORAGE_KEYS } from "../../utils/localStorage";

type PostRoundProps = {
  playerRounds: GolfRound[];
  setPlayerRounds: React.Dispatch<React.SetStateAction<GolfRound[]>>;
  database: Firestore;
  collectionRef: CollectionReference;
  courseSelected: Course | null;
  setCourseSelected: React.Dispatch<React.SetStateAction<Course | null>>;
};

export const PostRound = ({
  playerRounds,
  collectionRef,
  courseSelected,
  setPlayerRounds,
  setCourseSelected,
}: PostRoundProps) => {
  const postRound = () => {
    playerRounds.forEach((player) => {
      addDoc(collectionRef, player);
      alert(`${player.name} Total Shots: ${""}
      ${player.scores.reduce((acc, cur) => {
        return acc + cur;
      }, 0)} Score to Par:
      ${
        courseSelected &&
        player.scores.reduce((acc, cur) => {
          return acc + cur;
        }, 0) - courseSelected.totalPar
      }`);
    });
    setPlayerRounds([]);
    setCourseSelected(null);
    clearStorage(...GOLF_KEYS, STORAGE_KEYS.GOLF_CURRENT_HOLE);
  };

  const isPostDisabled = playerRounds.some((player) => {
    return player.scores.length !== player.currentCourse.holes.length;
  });

  if (playerRounds.length !== 0) {
    return (
      <div>
        <Button
          className="button"
          disabled={isPostDisabled}
          onClick={postRound}
        >
          <Link to="/"> Post Round</Link>
        </Button>
      </div>
    );
  } else {
    return <div></div>;
  }
};
