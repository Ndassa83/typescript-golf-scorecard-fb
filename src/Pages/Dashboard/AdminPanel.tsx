import { useState, useCallback, Dispatch, SetStateAction } from "react";
import {
  Firestore,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Modal } from "@mui/material";
import { GolfRound, DartRound, FetchedPlayer, Course, Tournament } from "../../types";
import "./AdminPanel.css";

type WithDocId<T> = { id: string; data: T };

type Props = {
  database: Firestore;
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

const toggleAll = (
  ids: string[],
  selected: Record<string, boolean>,
  setSelected: Dispatch<SetStateAction<Record<string, boolean>>>,
) => {
  const allSelected = ids.length > 0 && ids.every((id) => selected[id]);
  if (allSelected) {
    const next = { ...selected };
    ids.forEach((id) => delete next[id]);
    setSelected(next);
  } else {
    const next = { ...selected };
    ids.forEach((id) => {
      next[id] = true;
    });
    setSelected(next);
  }
};

export const AdminPanel = ({ database }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [golfRounds, setGolfRounds] = useState<WithDocId<GolfRound>[] | null>(null);
  const [dartRounds, setDartRounds] = useState<WithDocId<DartRound>[] | null>(null);
  const [players, setPlayers] = useState<WithDocId<FetchedPlayer>[] | null>(null);
  const [courses, setCourses] = useState<WithDocId<Course>[] | null>(null);
  const [tournaments, setTournaments] = useState<WithDocId<Tournament>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  const [selectedGolf, setSelectedGolf] = useState<Record<string, boolean>>({});
  const [selectedDarts, setSelectedDarts] = useState<Record<string, boolean>>({});
  const [selectedPlayers, setSelectedPlayers] = useState<Record<string, boolean>>({});
  const [selectedCourses, setSelectedCourses] = useState<Record<string, boolean>>({});
  const [selectedTournaments, setSelectedTournaments] = useState<Record<string, boolean>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setFetchErr(null);
    setGolfRounds(null);
    setDartRounds(null);
    setPlayers(null);
    setCourses(null);
    setTournaments(null);
    setSelectedGolf({});
    setSelectedDarts({});
    setSelectedPlayers({});
    setSelectedCourses({});
    setSelectedTournaments({});

    Promise.all([
      getDocs(query(collection(database, "playerData"), orderBy("date", "desc"))),
      getDocs(query(collection(database, "dartRounds"), orderBy("date", "desc"))),
      getDocs(query(collection(database, "userList"), orderBy("userName", "asc"))),
      getDocs(query(collection(database, "courseData"), orderBy("courseName", "asc"))),
      getDocs(query(collection(database, "tournaments"), orderBy("createdAt", "desc"))),
    ])
      .then(([golfSnap, dartSnap, playerSnap, courseSnap, tournSnap]) => {
        setGolfRounds(golfSnap.docs.map((d) => ({ id: d.id, data: d.data() as GolfRound })));
        setDartRounds(dartSnap.docs.map((d) => ({ id: d.id, data: d.data() as DartRound })));
        setPlayers(playerSnap.docs.map((d) => ({ id: d.id, data: d.data() as FetchedPlayer })));
        setCourses(courseSnap.docs.map((d) => ({ id: d.id, data: d.data() as Course })));
        setTournaments(tournSnap.docs.map((d) => ({ id: d.id, data: d.data() as Tournament })));
      })
      .catch(() => setFetchErr("Failed to load data. Check your connection and try again."))
      .finally(() => setLoading(false));
  }, [database]);

  const selectedCount =
    Object.values(selectedGolf).filter(Boolean).length +
    Object.values(selectedDarts).filter(Boolean).length +
    Object.values(selectedPlayers).filter(Boolean).length +
    Object.values(selectedCourses).filter(Boolean).length +
    Object.values(selectedTournaments).filter(Boolean).length;

  const handleDeleteConfirm = async () => {
    if (confirmInput !== "DELETE") return;
    setDeleteInProgress(true);
    setDeleteError(null);

    type DeleteItem = { col: string; id: string };
    const toDelete: DeleteItem[] = [
      ...Object.entries(selectedGolf)
        .filter(([, v]) => v)
        .map(([id]) => ({ col: "playerData", id })),
      ...Object.entries(selectedDarts)
        .filter(([, v]) => v)
        .map(([id]) => ({ col: "dartRounds", id })),
      ...Object.entries(selectedPlayers)
        .filter(([, v]) => v)
        .map(([id]) => ({ col: "userList", id })),
      ...Object.entries(selectedCourses)
        .filter(([, v]) => v)
        .map(([id]) => ({ col: "courseData", id })),
      ...Object.entries(selectedTournaments)
        .filter(([, v]) => v)
        .map(([id]) => ({ col: "tournaments", id })),
    ];

    const results = await Promise.allSettled(
      toDelete.map((item) => deleteDoc(doc(database, item.col, item.id))),
    );

    const failedIds = new Set<string>();
    results.forEach((result, idx) => {
      if (result.status === "rejected") {
        failedIds.add(toDelete[idx].id);
      }
    });

    const successGolf = new Set(
      Object.entries(selectedGolf)
        .filter(([, v]) => v)
        .map(([id]) => id)
        .filter((id) => !failedIds.has(id)),
    );
    const successDarts = new Set(
      Object.entries(selectedDarts)
        .filter(([, v]) => v)
        .map(([id]) => id)
        .filter((id) => !failedIds.has(id)),
    );
    const successPlayers = new Set(
      Object.entries(selectedPlayers)
        .filter(([, v]) => v)
        .map(([id]) => id)
        .filter((id) => !failedIds.has(id)),
    );
    const successCourses = new Set(
      Object.entries(selectedCourses)
        .filter(([, v]) => v)
        .map(([id]) => id)
        .filter((id) => !failedIds.has(id)),
    );

    if (successGolf.size > 0) {
      setGolfRounds((prev) => prev?.filter((r) => !successGolf.has(r.id)) ?? null);
      setSelectedGolf((prev) => {
        const next = { ...prev };
        successGolf.forEach((id) => delete next[id]);
        return next;
      });
    }
    if (successDarts.size > 0) {
      setDartRounds((prev) => prev?.filter((r) => !successDarts.has(r.id)) ?? null);
      setSelectedDarts((prev) => {
        const next = { ...prev };
        successDarts.forEach((id) => delete next[id]);
        return next;
      });
    }
    if (successPlayers.size > 0) {
      setPlayers((prev) => prev?.filter((r) => !successPlayers.has(r.id)) ?? null);
      setSelectedPlayers((prev) => {
        const next = { ...prev };
        successPlayers.forEach((id) => delete next[id]);
        return next;
      });
    }
    if (successCourses.size > 0) {
      setCourses((prev) => prev?.filter((r) => !successCourses.has(r.id)) ?? null);
      setSelectedCourses((prev) => {
        const next = { ...prev };
        successCourses.forEach((id) => delete next[id]);
        return next;
      });
    }
    const successTournaments = new Set(
      Object.entries(selectedTournaments)
        .filter(([, v]) => v)
        .map(([id]) => id)
        .filter((id) => !failedIds.has(id)),
    );
    if (successTournaments.size > 0) {
      setTournaments((prev) => prev?.filter((r) => !successTournaments.has(r.id)) ?? null);
      setSelectedTournaments((prev) => {
        const next = { ...prev };
        successTournaments.forEach((id) => delete next[id]);
        return next;
      });
    }

    setDeleteInProgress(false);
    if (failedIds.size > 0) {
      setDeleteError(
        `Failed to delete ${failedIds.size} item(s). IDs: ${Array.from(failedIds).join(", ")}`,
      );
    } else {
      setConfirmOpen(false);
      setConfirmInput("");
    }
  };

  const closeConfirm = () => {
    if (deleteInProgress) return;
    setConfirmOpen(false);
    setConfirmInput("");
    setDeleteError(null);
  };

  const dataLoaded =
    golfRounds !== null &&
    dartRounds !== null &&
    players !== null &&
    courses !== null &&
    tournaments !== null;

  const playerUserIdsWithRounds = new Set<number>();
  if (golfRounds) golfRounds.forEach((r) => playerUserIdsWithRounds.add(r.data.userId));
  if (dartRounds) dartRounds.forEach((r) => playerUserIdsWithRounds.add(r.data.userId));

  const courseNamesWithRounds = new Set<string>();
  if (golfRounds)
    golfRounds.forEach((r) => courseNamesWithRounds.add(r.data.currentCourse.courseName));

  const golfSelectedCount = Object.values(selectedGolf).filter(Boolean).length;
  const dartsSelectedCount = Object.values(selectedDarts).filter(Boolean).length;
  const playersSelectedCount = Object.values(selectedPlayers).filter(Boolean).length;
  const coursesSelectedCount = Object.values(selectedCourses).filter(Boolean).length;
  const tournamentsSelectedCount = Object.values(selectedTournaments).filter(Boolean).length;

  return (
    <div className="adminPanel">
      <div className="adminPanelHeader">
        <div className="adminPanelHeading">Admin Panel</div>
        <button className="adminToggleBtn" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Hide" : "Show Admin Panel"}
        </button>
      </div>

      {expanded && (
        <>
          <div className="adminLoadBar">
            <button className="adminLoadBtn" onClick={fetchAll} disabled={loading}>
              {loading ? "Loading..." : dataLoaded ? "Refresh Data" : "Load Data"}
            </button>
            {loading && (
              <span className="adminLoadingText">Fetching all records...</span>
            )}
          </div>

          {fetchErr && <div className="adminFetchErr">{fetchErr}</div>}

          {dataLoaded && (
            <>
              {/* Golf Rounds */}
              <div className="adminSection">
                <div className="adminSectionHeader">
                  <span className="adminSectionTitle">
                    Golf Rounds ({golfRounds.length})
                  </span>
                  {golfRounds.length > 0 && (
                    <button
                      className="adminSelectAllBtn"
                      onClick={() =>
                        toggleAll(
                          golfRounds.map((r) => r.id),
                          selectedGolf,
                          setSelectedGolf,
                        )
                      }
                    >
                      {golfRounds.every((r) => selectedGolf[r.id])
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>
                {golfRounds.length === 0 ? (
                  <div className="adminEmptyState">No golf rounds.</div>
                ) : (
                  golfRounds.map((r) => {
                    const total = r.data.scores.reduce((a, b) => a + b, 0);
                    const diff = total - r.data.currentCourse.totalPar;
                    const { text, cls } = formatScoreToPar(diff);
                    return (
                      <div key={r.id} className="adminRecordRow">
                        <input
                          type="checkbox"
                          checked={!!selectedGolf[r.id]}
                          onChange={(e) =>
                            setSelectedGolf((prev) => ({
                              ...prev,
                              [r.id]: e.target.checked,
                            }))
                          }
                        />
                        <div className="adminRecordMain">
                          <span className="adminRecordPrimary">{r.data.name}</span>
                          <span className="adminRecordSecondary">
                            {r.data.currentCourse.courseName} —{" "}
                            {formatDate(r.data.date)}
                          </span>
                        </div>
                        <span className={`adminRecordRight ${cls}`}>{text}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dart Rounds */}
              <div className="adminSection">
                <div className="adminSectionHeader">
                  <span className="adminSectionTitle">
                    Dart Rounds ({dartRounds.length})
                  </span>
                  {dartRounds.length > 0 && (
                    <button
                      className="adminSelectAllBtn"
                      onClick={() =>
                        toggleAll(
                          dartRounds.map((r) => r.id),
                          selectedDarts,
                          setSelectedDarts,
                        )
                      }
                    >
                      {dartRounds.every((r) => selectedDarts[r.id])
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>
                {dartRounds.length === 0 ? (
                  <div className="adminEmptyState">No dart rounds.</div>
                ) : (
                  dartRounds.map((r) => {
                    const total = r.data.scores
                      .flatMap((s) => s.values)
                      .reduce((a, b) => a + b, 0);
                    return (
                      <div key={r.id} className="adminRecordRow">
                        <input
                          type="checkbox"
                          checked={!!selectedDarts[r.id]}
                          onChange={(e) =>
                            setSelectedDarts((prev) => ({
                              ...prev,
                              [r.id]: e.target.checked,
                            }))
                          }
                        />
                        <div className="adminRecordMain">
                          <span className="adminRecordPrimary">{r.data.name}</span>
                          <span className="adminRecordSecondary">
                            {r.data.gameType} — {formatDate(r.data.date)}
                          </span>
                        </div>
                        <span className="adminRecordRight">{total} pts</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Players */}
              <div className="adminSection">
                <div className="adminSectionHeader">
                  <span className="adminSectionTitle">Players ({players.length})</span>
                  {players.length > 0 && (
                    <button
                      className="adminSelectAllBtn"
                      onClick={() =>
                        toggleAll(
                          players.map((r) => r.id),
                          selectedPlayers,
                          setSelectedPlayers,
                        )
                      }
                    >
                      {players.every((r) => selectedPlayers[r.id])
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>
                {players.length === 0 ? (
                  <div className="adminEmptyState">No players.</div>
                ) : (
                  players.map((r) => {
                    const hasRounds = playerUserIdsWithRounds.has(r.data.userId);
                    return (
                      <div key={r.id} className="adminRecordRow">
                        <input
                          type="checkbox"
                          checked={!!selectedPlayers[r.id]}
                          onChange={(e) =>
                            setSelectedPlayers((prev) => ({
                              ...prev,
                              [r.id]: e.target.checked,
                            }))
                          }
                        />
                        <div className="adminRecordMain">
                          <span className="adminRecordPrimary">
                            {r.data.userName}
                          </span>
                          <span className="adminRecordSecondary">
                            userId: {r.data.userId}
                          </span>
                        </div>
                        {hasRounds && (
                          <span className="adminRecordBadge">has rounds</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Courses */}
              <div className="adminSection">
                <div className="adminSectionHeader">
                  <span className="adminSectionTitle">Courses ({courses.length})</span>
                  {courses.length > 0 && (
                    <button
                      className="adminSelectAllBtn"
                      onClick={() =>
                        toggleAll(
                          courses.map((r) => r.id),
                          selectedCourses,
                          setSelectedCourses,
                        )
                      }
                    >
                      {courses.every((r) => selectedCourses[r.id])
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>
                {courses.length === 0 ? (
                  <div className="adminEmptyState">No courses.</div>
                ) : (
                  courses.map((r) => {
                    const hasRounds = courseNamesWithRounds.has(r.data.courseName);
                    return (
                      <div key={r.id} className="adminRecordRow">
                        <input
                          type="checkbox"
                          checked={!!selectedCourses[r.id]}
                          onChange={(e) =>
                            setSelectedCourses((prev) => ({
                              ...prev,
                              [r.id]: e.target.checked,
                            }))
                          }
                        />
                        <div className="adminRecordMain">
                          <span className="adminRecordPrimary">
                            {r.data.courseName}
                          </span>
                          <span className="adminRecordSecondary">
                            {r.data.holes.length} holes, par {r.data.totalPar}
                          </span>
                        </div>
                        {hasRounds && (
                          <span className="adminRecordBadge">has rounds</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Tournaments */}
              <div className="adminSection">
                <div className="adminSectionHeader">
                  <span className="adminSectionTitle">Tournaments ({tournaments!.length})</span>
                  {tournaments!.length > 0 && (
                    <button
                      className="adminSelectAllBtn"
                      onClick={() =>
                        toggleAll(
                          tournaments!.map((r) => r.id),
                          selectedTournaments,
                          setSelectedTournaments,
                        )
                      }
                    >
                      {tournaments!.every((r) => selectedTournaments[r.id])
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>
                {tournaments!.length === 0 ? (
                  <div className="adminEmptyState">No tournaments.</div>
                ) : (
                  tournaments!.map((r) => (
                    <div key={r.id} className="adminRecordRow">
                      <input
                        type="checkbox"
                        checked={!!selectedTournaments[r.id]}
                        onChange={(e) =>
                          setSelectedTournaments((prev) => ({
                            ...prev,
                            [r.id]: e.target.checked,
                          }))
                        }
                      />
                      <div className="adminRecordMain">
                        <span className="adminRecordPrimary">{r.data.name}</span>
                        <span className="adminRecordSecondary">
                          {r.data.status} · {r.data.roundCount}/{r.data.targetRounds} rounds
                          {r.data.winnerName ? ` · Winner: ${r.data.winnerName}` : ""}
                        </span>
                      </div>
                      <span className={`adminRecordBadge ${r.data.status}`}>
                        {r.data.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Delete bar */}
              <div className="adminDeleteBar">
                <span className="adminSelectedCount">
                  {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
                </span>
                <button
                  className="adminDeleteBtn"
                  disabled={selectedCount === 0}
                  onClick={() => {
                    setConfirmInput("");
                    setDeleteError(null);
                    setConfirmOpen(true);
                  }}
                >
                  Delete Selected ({selectedCount})
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Confirm modal */}
      <Modal open={confirmOpen} onClose={closeConfirm}>
        <div className="adminConfirmModal">
          <div className="adminConfirmTitle">Confirm Deletion</div>
          <div className="adminConfirmSummary">
            You are about to permanently delete:
            <br />
            {golfSelectedCount > 0 && (
              <>
                &bull; {golfSelectedCount} golf round
                {golfSelectedCount !== 1 ? "s" : ""}
                <br />
              </>
            )}
            {dartsSelectedCount > 0 && (
              <>
                &bull; {dartsSelectedCount} dart round
                {dartsSelectedCount !== 1 ? "s" : ""}
                <br />
              </>
            )}
            {playersSelectedCount > 0 && (
              <>
                &bull; {playersSelectedCount} player
                {playersSelectedCount !== 1 ? "s" : ""}
                <br />
              </>
            )}
            {coursesSelectedCount > 0 && (
              <>
                &bull; {coursesSelectedCount} course
                {coursesSelectedCount !== 1 ? "s" : ""}
                <br />
              </>
            )}
            {tournamentsSelectedCount > 0 && (
              <>
                &bull; {tournamentsSelectedCount} tournament
                {tournamentsSelectedCount !== 1 ? "s" : ""}
                <br />
              </>
            )}
          </div>
          <div className="adminConfirmWarning">This cannot be undone.</div>
          <input
            className={`adminConfirmInput${confirmInput === "DELETE" ? " valid" : ""}`}
            type="text"
            placeholder="Type DELETE to confirm"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            disabled={deleteInProgress}
            autoComplete="off"
          />
          {deleteError && <div className="adminErrorBanner">{deleteError}</div>}
          <div className="adminConfirmActions">
            <button
              className="adminCancelBtn"
              onClick={closeConfirm}
              disabled={deleteInProgress}
            >
              Cancel
            </button>
            <button
              className="adminConfirmDeleteBtn"
              disabled={confirmInput !== "DELETE" || deleteInProgress}
              onClick={handleDeleteConfirm}
            >
              {deleteInProgress ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
