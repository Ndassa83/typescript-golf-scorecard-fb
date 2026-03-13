import React, { useState, useEffect } from "react";
import {
  CourseOptionType,
  PlayerOptionType,
  GolfRound,
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
import { BackyardGolfLogo } from "../../components/BackyardGolfLogo";
import { ScoreCardTable } from "../ScoreCard/ScoreCardTable";
import dayjs from "dayjs";
import "./StatPage.css";

type StatPageProps = {
  playerOptions: PlayerOptionType[];
  courseOptions: CourseOptionType[];
};

const StatPage = ({ playerOptions, courseOptions }: StatPageProps) => {
  const [allScoreData, setAllScoreData] = useState<GolfRound[]>([]);
  const [filteredAllScoreData, setFilteredAllScoreData] = useState<
    GolfRound[][]
  >([]);
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

  const handleSelectedCourseChange = (course: Course | null) => {
    setSelectedCourse(course);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const getScoresData = async () => {
    const snapshot = await getDocs(
      query(
        playerScoresCollectionRef,
        orderBy("name", "asc"),
        orderBy("date", "desc")
      )
    );
    const newData: GolfRound[] = snapshot.docs.map((doc) => doc.data() as GolfRound);
    setAllScoreData(newData);
  };
  useEffect(() => { getScoresData(); }, []);

  //getFilteredRounds
  useEffect(() => {
    const filtered = allScoreData.filter((player: GolfRound) => {
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

    const courseRoundArray: GolfRound[][] = Object.values(courseRoundsMap);

    setFilteredAllScoreData(courseRoundArray);
  }, [selectedPlayer, selectedCourse, selectedDate, allScoreData]);

  return (
    <div className="page-container">
      <BackyardGolfLogo className="gameLogo" />
      <div className="two-col-layout statPageLayout">
        <div className="statLeftCol">
          <h2 className="statColHeading">Filters</h2>
          <StatFilter
            playerOptions={playerOptions}
            courseOptions={courseOptions}
            selectedDate={selectedDate}
            handleSelectedPlayerChange={handleSelectedPlayerChange}
            onCourseChange={handleSelectedCourseChange}
            handleDateChange={handleDateChange}
          />
        </div>
        <div className="statRightCol">
          <h2 className="statColHeading">Results</h2>
          {filteredAllScoreData.length === 0 && (
            <div className="statEmptyMsg">No rounds match the current filters.</div>
          )}
          {filteredAllScoreData.map((courseScores, i) => {
            return (
              <React.Fragment key={`${courseScores[0].currentCourse.courseId}-${i}`}>
                <div className="courseName">
                  {courseScores[0].currentCourse.courseName}
                </div>
                <OverallStats courseScores={courseScores} />
                <ScoreCardTable
                  courseSelected={courseScores[0].currentCourse}
                  playerRounds={courseScores}
                  showDate
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default StatPage;
