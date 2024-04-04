import { Link } from "react-router-dom";
import "firebase/firestore";
import { Firestore, CollectionReference } from "firebase/firestore";
import { addDoc } from "firebase/firestore";
import { Button } from "@mui/material";
import { Player, Course } from "../../types";
import { useEffect, useState } from "react";

type PostRoundProps = {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  database: Firestore;
  collectionRef: CollectionReference;
  courseSelected: Course | null;
  setCourseSelected: React.Dispatch<React.SetStateAction<Course | null>>;
};

export const PostRound = ({
  players,
  collectionRef,
  courseSelected,
  setPlayers,
  setCourseSelected,
}: PostRoundProps) => {
  const postRound = () => {
    players.forEach((player) => {
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
    setPlayers([]);
    setCourseSelected(null);
  };

  const isPostDisabled = players.some((player) => {
    return player.scores.length !== player.currentCourse.holes.length;
  });

  if (players.length !== 0) {
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
