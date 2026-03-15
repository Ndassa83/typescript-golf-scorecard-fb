import React, { useState, useEffect, useMemo } from "react";
import { PlayerOptionType, FetchedPlayer, DartRound } from "../../types";
import { getTossHighScore, tossSum } from "../../utils/dartStatHelpers";
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
  const [filteredAllScoreData, setFilteredAllScoreData] = useState<DartRound[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<FetchedPlayer | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const database = getFirestore();
  const dartRoundsCollectionRef = collection(database, "dartRounds");

  const handleSelectedPlayerChange = (
    _event: React.SyntheticEvent,
    newValue: PlayerOptionType | null
  ) => {
    setSelectedPlayer(newValue?.value || null);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const handleClearFilters = () => {
    setSelectedPlayer(null);
    setSelectedDate(null);
  };

  const hasActiveFilters = !!(selectedPlayer || selectedDate);

  const summaryStats = useMemo(() => {
    if (allScoreData.length === 0) return null;
    const bestToss = getTossHighScore(allScoreData);
    const playerMap: Record<string, { name: string; tosses: number[]; matchWins: number }> = {};
    allScoreData.forEach((r) => {
      const key = String(r.userId);
      if (!playerMap[key]) playerMap[key] = { name: r.name, tosses: [], matchWins: 0 };
      r.scores.forEach((t) => playerMap[key].tosses.push(tossSum(t)));
      if (r.matchWinner === true) playerMap[key].matchWins++;
    });
    let bestTossPlayer = "";
    let bestAvg = 0;
    let bestAvgPlayer = "";
    let mostWins = 0;
    let winsLeader = "";
    Object.values(playerMap).forEach((p) => {
      if (p.tosses.includes(bestToss)) bestTossPlayer = p.name;
      const avg = p.tosses.length > 0 ? p.tosses.reduce((a, b) => a + b, 0) / p.tosses.length : 0;
      if (avg > bestAvg) { bestAvg = avg; bestAvgPlayer = p.name; }
      if (p.matchWins > mostWins) { mostWins = p.matchWins; winsLeader = p.name; }
    });
    return { bestToss, bestTossPlayer, bestAvg, bestAvgPlayer, mostWins, winsLeader };
  }, [allScoreData]);

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

      {/* Summary stat cards */}
      {summaryStats && (
        <div className="statSummaryCards">
          <div className="statSummaryCard">
            <span className="statSummaryValue">{summaryStats.bestToss}</span>
            <span className="statSummaryLabel">Best Single Toss</span>
            <span className="statSummarySubLabel">{summaryStats.bestTossPlayer}</span>
          </div>
          <div className="statSummaryCard">
            <span className="statSummaryValue">{summaryStats.bestAvg.toFixed(1)}</span>
            <span className="statSummaryLabel">Best Avg Toss</span>
            <span className="statSummarySubLabel">{summaryStats.bestAvgPlayer}</span>
          </div>
          <div className="statSummaryCard">
            <span className="statSummaryValue">{summaryStats.mostWins}</span>
            <span className="statSummaryLabel">Match Wins</span>
            <span className="statSummarySubLabel">{summaryStats.winsLeader}</span>
          </div>
        </div>
      )}

      {/* Leaderboards */}
      <div className="statDashSection">
        <h2 className="statColHeading">Leaderboards</h2>
        <DartOverallStats
          filteredAllScoreData={allScoreData}
          allScoreData={allScoreData}
          selectedPlayer={null}
        />
      </div>

      {/* Page break divider */}
      <div className="statPageDivider">
        <span className="statPageDividerLabel">Player Stats</span>
      </div>

      {/* Filter */}
      <div className="statFilterSection">
        <DartStatFilter
          playerOptions={playerOptions}
          selectedDate={selectedDate}
          hasActiveFilters={hasActiveFilters}
          handleSelectedPlayerChange={handleSelectedPlayerChange}
          handleDateChange={handleDateChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Player stats */}
      <div className="statStatsSection">
        {!hasActiveFilters ? (
          <div className="statEmptyMsg">Select a player above to view their stats.</div>
        ) : (
          <DartOverallStats
            filteredAllScoreData={filteredAllScoreData}
            allScoreData={allScoreData}
            selectedPlayer={selectedPlayer}
          />
        )}
      </div>
    </div>
  );
};

export default DartStatPage;
