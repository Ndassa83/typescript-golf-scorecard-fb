import React, { useState, useEffect } from "react";
import {
  CourseOptionType,
  PlayerOptionType,
  Player,
  Course,
  FetchedPlayer,
  CourseRoundsMap,
} from "../../types";
import {
  collection,
  getFirestore,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import StatFilter from "./StatFilter";
import OverallStats from "./OverallStats";
import { ScoreCardTable } from "../ScoreCard/ScoreCardTable";
import dayjs from "dayjs";
import "./StatPage.css";

type StatPageProps = {
  playerOptions: PlayerOptionType[];
  courseOptions: CourseOptionType[];
};

const StatPage = ({ playerOptions, courseOptions }: StatPageProps) => {
  const [allScoreData, setAllScoreData] = useState<Player[]>([]);
  const [filteredAllScoreData, setFilteredAllScoreData] = useState<Player[][]>(
    []
  );
  const [selectedPlayer, setSelectedPlayer] = useState<FetchedPlayer | null>(
    null
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const database = getFirestore();
  const playerScoresCollectionRef = collection(database, "playerData");
  const courseCollectionRef = collection(database, "courseData");

  const handleSelectedPlayerChange = (
    event: React.SyntheticEvent,
    newValue: PlayerOptionType | null
  ) => {
    setSelectedPlayer(newValue?.value || null);
  };

  const handleSelectedCourseChange = (
    event: React.SyntheticEvent,
    newValue: CourseOptionType | null
  ) => {
    setSelectedCourse(newValue?.value || null);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const getScoresData = () => {
    const newData: any = [];
    getDocs(
      query(
        playerScoresCollectionRef,
        orderBy("name", "asc"),
        orderBy("date", "desc")
      )
    ).then((snapshot) => {
      snapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        newData.push(data);
      });
    });

    setAllScoreData(newData);
  };
  useEffect(getScoresData, []);

  //getFilteredRounds
  useEffect(() => {
    const filtered = allScoreData.filter((player: Player) => {
      return (
        (selectedPlayer ? player.userId === selectedPlayer?.userId : true) &&
        (selectedCourse
          ? player.currentCourse.courseId === selectedCourse?.courseId
          : true) &&
        (selectedDate
          ? dayjs(selectedDate).isSame(dayjs(player.date), "day")
          : true)
      );
    });

    const courseRoundsMap: CourseRoundsMap = {};
    filtered.forEach((round) => {
      const id = round.currentCourse.courseId;
      if (!courseRoundsMap[id]) {
        courseRoundsMap[id] = [round];
      } else {
        courseRoundsMap[id].push(round);
      }
    });

    const courseRoundArray: Player[][] = Object.values(courseRoundsMap);

    setFilteredAllScoreData(courseRoundArray);
  }, [selectedPlayer, selectedCourse, selectedDate]);

  return (
    <div className="statPageContainer">
      <div className="statContent">
        <StatFilter
          playerOptions={playerOptions}
          courseOptions={courseOptions}
          selectedDate={selectedDate}
          handleSelectedPlayerChange={handleSelectedPlayerChange}
          handleSelectedCourseChange={handleSelectedCourseChange}
          handleDateChange={handleDateChange}
        />
        {filteredAllScoreData.map((courseScores) => {
          return (
            <>
              <div className="courseName">
                {courseScores[0].currentCourse.courseName}
              </div>
              <OverallStats courseScores={courseScores} />
              <ScoreCardTable
                courseSelected={courseScores[0].currentCourse}
                players={courseScores}
                showDate
              />
            </>
          );
        })}
      </div>
    </div>
  );
};
export default StatPage;
