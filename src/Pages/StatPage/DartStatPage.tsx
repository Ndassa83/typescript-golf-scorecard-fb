import React, { useState, useEffect } from "react";
import { PlayerOptionType, FetchedPlayer, DartRound } from "../../types";
import {
  collection,
  getFirestore,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import dayjs from "dayjs";
import "./StatPage.css";
import DartStatFilter from "./DartStatFilter";
import DartOverallStats from "./DartOverallStats";
import { GarageDartsLogo } from "../../components/GarageDartsLogo";

type DartStatPageProps = {
  playerOptions: PlayerOptionType[];
};

const DartStatPage = ({ playerOptions }: DartStatPageProps) => {
  const [allScoreData, setAllScoreData] = useState<DartRound[]>([]);
  const [filteredAllScoreData, setFilteredAllScoreData] = useState<DartRound[]>(
    []
  );
  const [selectedPlayer, setSelectedPlayer] = useState<FetchedPlayer | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const database = getFirestore();
  const dartRoundsCollectionRef = collection(database, "dartRounds");

  const handleSelectedPlayerChange = (
    event: React.SyntheticEvent,
    newValue: PlayerOptionType | null
  ) => {
    setSelectedPlayer(newValue?.value || null);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const getScoresData = async () => {
    const snapshot = await getDocs(
      query(
        dartRoundsCollectionRef,
        orderBy("name", "asc"),
        orderBy("date", "desc")
      )
    );
    const newData: DartRound[] = snapshot.docs.map(
      (doc) => doc.data() as DartRound
    );
    setAllScoreData(newData);
    setFilteredAllScoreData(newData);
  };

  useEffect(() => {
    getScoresData();
  }, []);

  useEffect(() => {
    const filtered = allScoreData.filter((round: DartRound) => {
      return (
        (selectedPlayer ? round.userId === selectedPlayer.userId : true) &&
        (selectedDate
          ? dayjs(selectedDate).isSame(dayjs(round.date), "day")
          : true)
      );
    });
    setFilteredAllScoreData(filtered);
  }, [selectedPlayer, selectedDate, allScoreData]);

  return (
    <div className="page-container">
      <GarageDartsLogo className="gameLogo" />
      <div className="two-col-layout statPageLayout">
        <div className="statLeftCol">
          <h2 className="statColHeading">Filters</h2>
          <DartStatFilter
            playerOptions={playerOptions}
            selectedDate={selectedDate}
            handleSelectedPlayerChange={handleSelectedPlayerChange}
            handleDateChange={handleDateChange}
          />
        </div>
        <div className="statRightCol">
          <h2 className="statColHeading">Stats</h2>
          <DartOverallStats
            filteredAllScoreData={filteredAllScoreData}
            allScoreData={allScoreData}
            selectedPlayer={selectedPlayer}
          />
        </div>
      </div>
    </div>
  );
};

export default DartStatPage;
