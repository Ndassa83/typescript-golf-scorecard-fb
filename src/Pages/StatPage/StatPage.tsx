import React, { useState, useEffect, useMemo } from "react";
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
import { Button } from "@mui/material";
import StatFilter from "./StatFilter";
import OverallStats from "./OverallStats";
import GolfLeaderboards from "./GolfLeaderboards";
import { GolfRoundModal } from "../Dashboard/GolfRoundModal";
import { BackyardGolfLogo } from "../../components/BackyardGolfLogo";
import { ScoreCardTable } from "../ScoreCard/ScoreCardTable";
import "./StatPage.css";

type StatPageProps = {
  playerOptions: PlayerOptionType[];
  courseOptions: CourseOptionType[];
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatScoreToPar = (diff: number): { text: string; cls: string } => {
  if (diff === 0) return { text: "E", cls: "even" };
  if (diff > 0) return { text: `+${diff}`, cls: "positive" };
  return { text: `${diff}`, cls: "negative" };
};

type RoundGroup = { key: string; date: string; rounds: GolfRound[] };

const StatPage = ({ playerOptions, courseOptions }: StatPageProps) => {
  const [allScoreData, setAllScoreData] = useState<GolfRound[]>([]);
  const [filteredAllScoreData, setFilteredAllScoreData] = useState<GolfRound[][]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<FetchedPlayer | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [recentVisible, setRecentVisible] = useState(5);
  const [recentOpen, setRecentOpen] = useState(true);
  const [modalRounds, setModalRounds] = useState<GolfRound[] | null>(null);

  const database = getFirestore();
  const playerScoresCollectionRef = collection(database, "playerData");

  const handleSelectedPlayerChange = (
    _event: React.SyntheticEvent,
    newValue: PlayerOptionType | null
  ) => {
    setSelectedPlayer(newValue?.value || null);
  };

  const handleClearFilters = () => {
    setSelectedPlayer(null);
    setSelectedCourse(null);
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = !!(selectedPlayer || selectedCourse || dateFrom || dateTo);

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

  useEffect(() => {
    const filtered = allScoreData.filter((round: GolfRound) => {
      return (
        (selectedPlayer ? round.userId === selectedPlayer.userId : true) &&
        (selectedCourse ? round.currentCourse.courseId === selectedCourse.courseId : true) &&
        (dateFrom ? round.date >= dateFrom : true) &&
        (dateTo ? round.date <= dateTo : true)
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

    setFilteredAllScoreData(Object.values(courseRoundsMap));
  }, [selectedPlayer, selectedCourse, dateFrom, dateTo, allScoreData]);

  const groupedRecentRounds = useMemo((): RoundGroup[] => {
    const sorted = [...allScoreData].sort((a, b) => b.date.localeCompare(a.date));
    const groupMap: Record<string, GolfRound[]> = {};
    const groupOrder: string[] = [];
    sorted.forEach((r) => {
      const key = `${r.date}__${r.currentCourse.courseId}`;
      if (!groupMap[key]) {
        groupMap[key] = [];
        groupOrder.push(key);
      }
      groupMap[key].push(r);
    });
    return groupOrder.map((key) => ({
      key,
      date: groupMap[key][0].date,
      rounds: groupMap[key],
    }));
  }, [allScoreData]);

  return (
    <div className="page-container">
      <BackyardGolfLogo className="gameLogo" />

      {/* Top section: Recent Rounds + Leaderboards */}
      <div className="two-col-layout statPageLayout">
        <div className="statLeftCol">
          <h2 className="statColHeading">Recent Rounds</h2>
          <div className="recentRoundsCard">
            <div className="recentRoundsHeaderRow">
              <span className="recentRoundsTitle">Recent Rounds</span>
              <button
                className="recentToggleBtn"
                onClick={() => setRecentOpen((o) => !o)}
                aria-label="Toggle recent rounds"
              >
                {recentOpen ? "▲" : "▼"}
              </button>
            </div>
            {recentOpen && (
              <>
                {groupedRecentRounds.length === 0 ? (
                  <div className="recentEmpty">No rounds recorded yet.</div>
                ) : (
                  <>
                    {groupedRecentRounds.slice(0, recentVisible).map((group) => (
                      <div
                        className="recentGroupCard"
                        key={group.key}
                        onClick={() => setModalRounds(group.rounds)}
                      >
                        <div className="recentGroupHeader">
                          <span className="recentRoundSub">
                            {group.rounds[0].currentCourse.courseName}
                          </span>
                          <span className="recentRoundDate">{formatDate(group.date)}</span>
                        </div>
                        {group.rounds.map((r) => {
                          const total = r.scores.reduce((a, b) => a + b, 0);
                          const diff = total - r.currentCourse.totalPar;
                          const { text, cls } = formatScoreToPar(diff);
                          return (
                            <div className="recentGroupPlayerRow" key={r.userId}>
                              <span className="recentRoundPlayer">{r.name}</span>
                              <span className={`recentRoundScore ${cls}`}>{text}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {recentVisible < groupedRecentRounds.length && (
                      <Button
                        className="loadMoreBtn"
                        variant="outlined"
                        onClick={() => setRecentVisible((v) => v + 5)}
                      >
                        Load More
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="statRightCol">
          <h2 className="statColHeading">Leaderboards</h2>
          <GolfLeaderboards allScoreData={allScoreData} />
        </div>
      </div>

      {/* Page break divider */}
      <div className="statPageDivider">
        <span className="statPageDividerLabel">Course & Player Stats</span>
      </div>

      {/* Filter + Stats section */}
      <div className="statFilterSection">
        <StatFilter
          playerOptions={playerOptions}
          courseOptions={courseOptions}
          selectedCourse={selectedCourse}
          dateFrom={dateFrom}
          dateTo={dateTo}
          hasActiveFilters={hasActiveFilters}
          handleSelectedPlayerChange={handleSelectedPlayerChange}
          onCourseChange={setSelectedCourse}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onClearFilters={handleClearFilters}
        />
      </div>

      <div className="statStatsSection">
        {!hasActiveFilters ? (
          <div className="statEmptyMsg">Select a player or course above to view stats.</div>
        ) : filteredAllScoreData.length === 0 ? (
          <div className="statEmptyMsg">No rounds match the current filters.</div>
        ) : (
          filteredAllScoreData.map((courseScores, i) => (
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
          ))
        )}
      </div>

      <GolfRoundModal
        open={modalRounds !== null}
        onClose={() => setModalRounds(null)}
        rounds={modalRounds ?? []}
      />
    </div>
  );
};
export default StatPage;
