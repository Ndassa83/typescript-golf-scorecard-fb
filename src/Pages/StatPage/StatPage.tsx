import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CourseOptionType,
  PlayerOptionType,
  GolfRound,
  Course,
  FetchedPlayer,
  CourseRoundsMap,
  Tournament,
} from "../../types";
import {
  collection,
  getFirestore,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { Button } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
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
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatScoreToPar = (diff: number): { text: string; cls: string } => {
  if (diff === 0) return { text: "E", cls: "even" };
  if (diff > 0) return { text: `+${diff}`, cls: "positive" };
  return { text: `${diff}`, cls: "negative" };
};

type RoundGroup = { key: string; date: string; rounds: GolfRound[] };

const StatPage = ({ playerOptions, courseOptions }: StatPageProps) => {
  const [allScoreData, setAllScoreData] = useState<GolfRound[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredAllScoreData, setFilteredAllScoreData] = useState<
    GolfRound[][]
  >([]);
  const [selectedPlayer, setSelectedPlayer] = useState<FetchedPlayer | null>(
    null,
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [recentVisible, setRecentVisible] = useState(6);
  const [recentOpen, setRecentOpen] = useState(true);
  const [modalRounds, setModalRounds] = useState<GolfRound[] | null>(null);

  const database = getFirestore();
  const playerScoresCollectionRef = collection(database, "playerData");

  const handleSelectedPlayerChange = (
    _event: React.SyntheticEvent,
    newValue: PlayerOptionType | null,
  ) => {
    setSelectedPlayer(newValue?.value || null);
  };

  const handleClearFilters = () => {
    setSelectedPlayer(null);
    setSelectedCourse(null);
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = !!(
    selectedPlayer ||
    selectedCourse ||
    dateFrom ||
    dateTo
  );

  const getScoresData = async () => {
    const snapshot = await getDocs(
      query(
        playerScoresCollectionRef,
        orderBy("name", "asc"),
        orderBy("date", "desc"),
      ),
    );
    const newData: GolfRound[] = snapshot.docs.map(
      (doc) => doc.data() as GolfRound,
    );
    setAllScoreData(newData);
  };
  useEffect(() => {
    getScoresData();
  }, []);

  useEffect(() => {
    getDocs(
      query(collection(database, "tournaments"), orderBy("createdAt", "desc")),
    ).then((snap) =>
      setTournaments(snap.docs.map((d) => d.data() as Tournament)),
    );
  }, []);

  useEffect(() => {
    const filtered = allScoreData.filter((round: GolfRound) => {
      return (
        (selectedPlayer ? round.userId === selectedPlayer.userId : true) &&
        (selectedCourse
          ? round.currentCourse.courseId === selectedCourse.courseId
          : true) &&
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

  const tournamentMap = useMemo(
    () => Object.fromEntries(tournaments.map((t) => [t.tournamentId, t])),
    [tournaments],
  );

  const tournamentSessionMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    allScoreData.forEach((r) => {
      if (r.tournamentId) {
        if (!map[r.tournamentId]) map[r.tournamentId] = [];
        if (!map[r.tournamentId].includes(r.date))
          map[r.tournamentId].push(r.date);
      }
    });
    Object.values(map).forEach((dates) => dates.sort());
    return map;
  }, [allScoreData]);

  const groupedRecentRounds = useMemo((): RoundGroup[] => {
    const sorted = [...allScoreData].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
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

  const summaryStats = useMemo(() => {
    if (allScoreData.length === 0) return null;
    let bestScore = Infinity;
    let bestPlayer = "";
    const birdieMap: Record<string, { name: string; count: number }> = {};
    allScoreData.forEach((r) => {
      const total = r.scores.reduce((a, b) => a + b, 0);
      const diff = total - r.currentCourse.totalPar;
      if (diff < bestScore) { bestScore = diff; bestPlayer = r.name; }
      const key = String(r.userId);
      if (!birdieMap[key]) birdieMap[key] = { name: r.name, count: 0 };
      r.scores.forEach((score, i) => {
        const hole = r.currentCourse.holes[i];
        if (hole && score === hole.par - 1) birdieMap[key].count++;
      });
    });
    const topBirdie = Object.values(birdieMap).sort((a, b) => b.count - a.count)[0];
    return { totalRounds: allScoreData.length, bestScore, bestPlayer, topBirdie };
  }, [allScoreData]);

  return (
    <div className="page-container">
      <BackyardGolfLogo className="gameLogo" />

      {/* Summary stat cards */}
      {summaryStats && (
        <div className="statSummaryCards">
          <div className="statSummaryCard">
            <span className="statSummaryValue">{summaryStats.totalRounds}</span>
            <span className="statSummaryLabel">Total Rounds</span>
          </div>
          <div className="statSummaryCard">
            <span className="statSummaryValue">
              {summaryStats.bestScore === 0 ? "E" : summaryStats.bestScore > 0 ? `+${summaryStats.bestScore}` : summaryStats.bestScore}
            </span>
            <span className="statSummaryLabel">Best Round</span>
            <span className="statSummarySubLabel">{summaryStats.bestPlayer}</span>
          </div>
          <div className="statSummaryCard">
            <span className="statSummaryValue">{summaryStats.topBirdie?.count ?? 0}</span>
            <span className="statSummaryLabel">Most Birdies</span>
            <span className="statSummarySubLabel">{summaryStats.topBirdie?.name ?? "—"}</span>
          </div>
        </div>
      )}

      {/* Recent Rounds — full width */}
      <div className="statDashSection">
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
                  <div className="recentRoundsGrid">
                    {groupedRecentRounds
                      .slice(0, recentVisible)
                      .map((group) => (
                        <div
                          className="recentGroupCard"
                          key={group.key}
                          onClick={() => setModalRounds(group.rounds)}
                        >
                          <div className="recentGroupHeader">
                            <span className="recentRoundSub">
                              {group.rounds[0].currentCourse.courseName}
                            </span>
                            <span className="recentRoundDate">
                              {group.rounds[0].tournamentId &&
                                (() => {
                                  const tid = group.rounds[0].tournamentId!;
                                  const t = tournamentMap[tid];
                                  const sessions =
                                    tournamentSessionMap[tid] ?? [];
                                  const roundNum =
                                    sessions.indexOf(group.date) + 1;
                                  const target = t?.targetRounds ?? "?";
                                  const tName = t?.name ?? "Tournament";
                                  return (
                                    <span className="gameCardTournamentTag">
                                      {tName} {roundNum}/{target}{" "}
                                    </span>
                                  );
                                })()}
                              {formatDate(group.date)}
                            </span>
                          </div>
                          {group.rounds.map((r) => {
                            const total = r.scores.reduce((a, b) => a + b, 0);
                            const diff = total - r.currentCourse.totalPar;
                            const { text, cls } = formatScoreToPar(diff);
                            return (
                              <div
                                className="recentGroupPlayerRow"
                                key={r.userId}
                              >
                                <span className="recentRoundPlayer">
                                  {r.name}
                                </span>
                                <span className={`recentRoundScore ${cls}`}>
                                  {text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                  </div>
                  {recentVisible < groupedRecentRounds.length && (
                    <Button
                      className="loadMoreBtn"
                      variant="outlined"
                      onClick={() => setRecentVisible((v) => v + 6)}
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

      {/* Leaderboards — full width with category tabs */}
      <div className="statDashSection">
        <h2 className="statColHeading">Leaderboards</h2>
        <GolfLeaderboards allScoreData={allScoreData} />
      </div>

      {/* Tournament History */}
      {tournaments.length > 0 && (
        <div className="statPageDivider">
          <span className="statPageDividerLabel">Tournament History</span>
        </div>
      )}
      {tournaments.length > 0 && (
        <div className="tournamentHistoryGrid">
          {tournaments.map((t) => (
            <div
              key={t.tournamentId}
              className={`tournamentHistoryCard${t.status === "completed" ? " completed" : ""}`}
            >
              <div className="tournamentHistoryHeader">
                <span className="tournamentHistoryName">{t.name}</span>
                <span className={`tournamentStatusBadge ${t.status}`}>
                  {t.status}
                </span>
              </div>
              <div className="tournamentHistoryMeta">
                <span>
                  {t.roundCount} / {t.targetRounds} rounds
                </span>
                {t.completedAt && <span>{formatDate(t.completedAt)}</span>}
              </div>
              {t.winnerName && (
                <div className="tournamentHistoryWinner">
                  <EmojiEventsIcon fontSize="small" sx={{ color: "#d4af37" }} />
                  <span>{t.winnerName}</span>
                </div>
              )}
              <div className="tournamentHistoryPlayers">
                {t.participantIds
                  .map(
                    (id) =>
                      playerOptions.find((p) => p.value.userId === id)?.value
                        .userName ?? id,
                  )
                  .join(", ")}
              </div>
              <Button
                component={Link}
                to={`/Tournament/Standings/${t.tournamentId}`}
                size="small"
                variant="outlined"
                sx={{ mt: 1, alignSelf: "flex-start" }}
              >
                View Standings
              </Button>
            </div>
          ))}
        </div>
      )}

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
          selectedPlayer={selectedPlayer}
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
          <div className="statEmptyMsg">
            Select a player or course above to view stats.
          </div>
        ) : filteredAllScoreData.length === 0 ? (
          <div className="statEmptyMsg">
            No rounds match the current filters.
          </div>
        ) : (
          filteredAllScoreData.map((courseScores, i) => (
            <React.Fragment
              key={`${courseScores[0].currentCourse.courseId}-${i}`}
            >
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
