import { useState, useEffect } from "react";
import {
  saveToStorage,
  loadFromStorage,
  STORAGE_KEYS,
} from "./utils/localStorage";
import { Link, Route, Routes } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import "firebase/firestore";
import { getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { Button, IconButton, Tooltip } from "@mui/material";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import LightModeIcon from "@mui/icons-material/LightMode";
import ProfileDropdown from "./components/ProfileDropdown";
import {
  GolfRound,
  Course,
  PlayerOptionType,
  CourseOptionType,
  FetchedPlayer,
  Tournament,
} from "./types";
import GolfHome from "./Pages/Home/GolfHome";
import ScoreCard from "./Pages/ScoreCard/ScoreCard";
import StatsHub from "./Pages/StatPage/StatsHub";
import NotFound from "./Pages/NotFound/NotFound";
import logo from "./images/products-products-AIMMG107.png";
import "./App.css";
import Home from "./Pages/Home/Home";
import DartHome from "./Pages/Home/DartHome";
import DartScoreCard from "./Pages/ScoreCard/DartScoreCard";
import TournamentHome from "./Pages/Tournament/TournamentHome";
import TournamentStandings from "./Pages/Tournament/TournamentStandings";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

initializeApp(firebaseConfig);

const database = getFirestore();
const collectionRef = collection(database, "playerData");
const tournamentCollection = collection(database, "tournaments");

const firebaseApp = getApp();
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const App = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  useEffect(() => {
    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const [keepAwake, setKeepAwake] = useState(true);

  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    if (!keepAwake) return;
    let lock: any = null;
    let cancelled = false;
    const acquire = () => {
      if (cancelled) return;
      (navigator as any).wakeLock
        .request("screen")
        .then((l: any) => {
          if (cancelled) {
            l.release();
            return;
          }
          lock = l;
          document.addEventListener(
            "visibilitychange",
            () => {
              if (document.visibilityState === "visible") acquire();
            },
            { once: true },
          );
        })
        .catch(() => {});
    };
    acquire();
    return () => {
      cancelled = true;
      lock?.release();
    };
  }, [keepAwake]);

  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);

  const [courseSelected, setCourseSelected] = useState<Course | null>(() =>
    loadFromStorage<Course>(STORAGE_KEYS.COURSE_SELECTED),
  );
  const [playerOptions, setPlayerOptions] = useState<PlayerOptionType[]>([]);
  const [courseOptions, setCourseOptions] = useState<CourseOptionType[]>([]);
  const [createdPlayerId, setCreatedPlayerId] = useState<number | undefined>();
  const [createdPlayerName, setCreatedPlayerName] = useState<string>("");
  const [createdCourse, setCreatedCourse] = useState<Course | null>(null);
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  const [currentPlayers, setCurrentPlayers] = useState<FetchedPlayer[]>(
    () => loadFromStorage<FetchedPlayer[]>(STORAGE_KEYS.CURRENT_PLAYERS) ?? [],
  );

  const [playerRounds, setPlayerRounds] = useState<GolfRound[]>(
    () => loadFromStorage<GolfRound[]>(STORAGE_KEYS.GOLF_PLAYER_ROUNDS) ?? [],
  );

  const [activeTournament, setActiveTournament] = useState<Tournament | null>(
    () => loadFromStorage<Tournament>(STORAGE_KEYS.TOURNAMENT_ACTIVE),
  );
  const [dartGameActive, setDartGameActive] = useState<boolean>(
    () => loadFromStorage<boolean>(STORAGE_KEYS.DARTS_GAME_ACTIVE) ?? false,
  );
  // Persist state to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CURRENT_PLAYERS, currentPlayers);
  }, [currentPlayers]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.COURSE_SELECTED, courseSelected);
  }, [courseSelected]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.GOLF_PLAYER_ROUNDS, playerRounds);
  }, [playerRounds]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TOURNAMENT_ACTIVE, activeTournament);
  }, [activeTournament]);

  // Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser || playerOptions.length === 0) return;
    const linkedPlayer = playerOptions.find(
      (opt) => opt.value.googleUid === currentUser.uid,
    )?.value;
    if (!linkedPlayer) return;
    setCurrentPlayers((prev) => {
      if (prev.some((p) => p.userId === linkedPlayer.userId)) return prev;
      return [...prev, linkedPlayer];
    });
  }, [currentUser, playerOptions]);

  const handleSignIn = () =>
    signInWithPopup(auth, googleProvider).catch(() => {});
  const handleSignOut = () => signOut(auth);

  const handleUpdatePlayerAvatar = async (userId: number, avatarId: string) => {
    const q = query(
      collection(database, "userList"),
      where("userId", "==", userId),
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { avatar: avatarId });
      setPlayerOptions((prev) =>
        prev.map((opt) =>
          opt.value.userId === userId
            ? { ...opt, value: { ...opt.value, avatar: avatarId } }
            : opt,
        ),
      );
    }
  };

  const linkPlayerToGoogle = async (userId: number, googleUid: string) => {
    const q = query(
      collection(database, "userList"),
      where("userId", "==", userId),
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { googleUid });
      setPlayerOptions((prev) =>
        prev.map((opt) =>
          opt.value.userId === userId
            ? { ...opt, value: { ...opt.value, googleUid } }
            : opt,
        ),
      );
    }
  };

  const dartRoundCollection = collection(database, "dartRounds");
  const playerCollectionRef = collection(database, "userList");
  const courseCollectionRef = collection(database, "courseData");
  //fetch users
  useEffect(() => {
    getDocs(query(playerCollectionRef, orderBy("userName", "asc"))).then(
      (snapshot) => {
        setPlayerOptions(
          snapshot.docs.map((doc: any) => ({
            value: { ...doc.data() },
            label: doc.data().userName,
          }))
        );
      },
    ).catch((err) => {
      console.error("Failed to fetch players:", err);
    });
  }, [database]);

  //fetch courses
  useEffect(() => {
    getDocs(query(courseCollectionRef, orderBy("courseName", "asc"))).then(
      (snapshot) => {
        setCourseOptions(
          snapshot.docs.map((doc: any) => ({
            value: { ...doc.data() },
            label: doc.data().courseName,
          }))
        );
      },
    ).catch((err) => {
      console.error("Failed to fetch courses:", err);
    });
  }, [database]);

  //create player

  useEffect(() => {
    if (createdPlayerId) {
      const newPlayer = {
        userId: createdPlayerId,
        userName: createdPlayerName,
        avatar: playerImage,
      };
      setDoc(doc(database, `userList/${createdPlayerId}`), newPlayer).then(
        () => {
          setPlayerOptions((prev) => [
            ...prev,
            { label: createdPlayerName, value: newPlayer },
          ]);
        },
      );
    }
  }, [createdPlayerId]);

  //create course
  useEffect(() => {
    if (createdCourse)
      setDoc(doc(database, `courseData/${createdCourse?.courseId}`), {
        courseId: createdCourse.courseId,
        courseName: createdCourse.courseName,
        holes: createdCourse.holes,
        totalPar: createdCourse.totalPar,
        totalYards: createdCourse.totalYards,
      }).then(() => {
        setCourseOptions((prev) => [
          ...prev,
          { label: createdCourse.courseName, value: createdCourse },
        ]);
      });
  }, [createdCourse]);

  const handleUpdateCourse = (updatedCourse: Course) => {
    setDoc(doc(database, `courseData/${updatedCourse.courseId}`), {
      courseId: updatedCourse.courseId,
      courseName: updatedCourse.courseName,
      holes: updatedCourse.holes,
      totalPar: updatedCourse.totalPar,
      totalYards: updatedCourse.totalYards,
    }).then(() => {
      setCourseOptions((prev) =>
        prev.map((opt) =>
          opt.value.courseId === updatedCourse.courseId
            ? { label: updatedCourse.courseName, value: updatedCourse }
            : opt
        )
      );
      setCourseSelected(updatedCourse);
    });
  };

  return (
    <div className="background">
      <div className="App">
        <nav className="navContainer">
          <div className="logo">
            <Button onClick={closeMenu}>
              <Link to="/">
                <img className="homeImg" src={logo} alt="logo" />
              </Link>
            </Button>
          </div>
          <div className={`navLinks${menuOpen ? " open" : ""}`}>
            <Button onClick={closeMenu}>
              <Link className="navOptions" to="/">
                New Game
              </Link>
            </Button>

            <Button onClick={closeMenu}>
              <Link className="navOptions" to="/Stats">
                Stats
              </Link>
            </Button>
            <Button onClick={closeMenu}>
              <Link className="navOptions" to="/Tournament">
                Tournament
              </Link>
            </Button>
            {courseSelected && playerRounds.length > 0 && (
              <Button onClick={closeMenu}>
                <Link className="navOptions navOptionsActive" to="/ScoreCard">
                  <span className="navActiveDot" />
                  Golf Round
                </Link>
              </Button>
            )}
            {dartGameActive && (
              <Button onClick={closeMenu}>
                <Link className="navOptions navOptionsActive" to="/DartScoreCard">
                  <span className="navActiveDot" />
                  Dart Match
                </Link>
              </Button>
            )}
          </div>

          <div className="navAuth">
            <Tooltip title={darkMode ? "Dark mode: on" : "Dark mode: off"}>
              <IconButton
                onClick={() => setDarkMode((v) => !v)}
                size="small"
                sx={{ color: "white" }}
              >
                {darkMode ? (
                  <NightsStayIcon fontSize="small" />
                ) : (
                  <LightModeIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.6)" }} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                keepAwake ? "Screen stay-awake: on" : "Screen stay-awake: off"
              }
            >
              <IconButton
                onClick={() => setKeepAwake((v) => !v)}
                size="small"
                sx={{ color: keepAwake ? "white" : "rgba(255,255,255,0.4)" }}
              >
                <LocalCafeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {currentUser ? (
              <button
                className="navAvatar"
                onClick={(e) => setProfileAnchor(e.currentTarget)}
                title={
                  currentUser.displayName ?? currentUser.email ?? "Profile"
                }
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="avatar"
                    className="navAvatarImg"
                  />
                ) : (
                  <span className="navAvatarInitial">
                    {(currentUser.displayName ??
                      currentUser.email ??
                      "?")[0].toUpperCase()}
                  </span>
                )}
              </button>
            ) : (
              <Button className="navSignIn" onClick={handleSignIn}>
                <span className="navOptions">Sign In</span>
              </Button>
            )}
            <button
              className={`hamburger${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
          {currentUser && (
            <ProfileDropdown
              anchorEl={profileAnchor}
              onClose={() => setProfileAnchor(null)}
              currentUser={currentUser}
              playerOptions={playerOptions}
              onSignOut={handleSignOut}
              onLinkPlayer={linkPlayerToGoogle}
            />
          )}
        </nav>
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />
          <Route
            path="/Golf"
            element={
              <GolfHome
                courseSelected={courseSelected}
                setCourseSelected={setCourseSelected}
                courseOptions={courseOptions}
                playerOptions={playerOptions}
                createdCourse={createdCourse}
                setCreatedCourse={setCreatedCourse}
                currentPlayers={currentPlayers}
                setCurrentPlayers={setCurrentPlayers}
                playerRounds={playerRounds}
                setPlayerRounds={setPlayerRounds}
                onUpdateCourse={handleUpdateCourse}
                activeTournament={activeTournament}
                setCreatedPlayerId={setCreatedPlayerId}
                setCreatedPlayerName={setCreatedPlayerName}
                createdPlayerName={createdPlayerName}
                playerImage={playerImage}
                setPlayerImage={setPlayerImage}
                database={database}
              />
            }
          />
          <Route
            path="/Darts"
            element={
              <DartHome
                currentPlayers={currentPlayers}
                setCurrentPlayers={setCurrentPlayers}
                dartRoundCollection={dartRoundCollection}
                currentUserEmail={currentUser?.email ?? null}
                playerOptions={playerOptions}
                setCreatedPlayerId={setCreatedPlayerId}
                setCreatedPlayerName={setCreatedPlayerName}
                createdPlayerName={createdPlayerName}
                playerImage={playerImage}
                setPlayerImage={setPlayerImage}
                setDartGameActive={setDartGameActive}
              />
            }
          />

          <Route
            path="/DartScoreCard"
            element={
              <DartScoreCard
                dartRoundCollection={dartRoundCollection}
                currentUserEmail={currentUser?.email ?? null}
                playerOptions={playerOptions}
              />
            }
          />

          <Route
            path="/ScoreCard"
            element={
              <ScoreCard
                courseSelected={courseSelected}
                setCourseSelected={setCourseSelected}
                database={database}
                collectionRef={collectionRef}
                playerRounds={playerRounds}
                setPlayerRounds={setPlayerRounds}
                currentUserEmail={currentUser?.email ?? null}
                activeTournament={activeTournament}
                setActiveTournament={setActiveTournament}
                playerOptions={playerOptions}
              />
            }
          />
          <Route
            path="/Stats"
            element={
              <StatsHub
                playerOptions={playerOptions}
                courseOptions={courseOptions}
                database={database}
                currentUser={currentUser}
                onSignIn={handleSignIn}
                onUpdatePlayerAvatar={handleUpdatePlayerAvatar}
              />
            }
          />
          <Route
            path="/Tournament"
            element={
              <TournamentHome
                activeTournament={activeTournament}
                setActiveTournament={setActiveTournament}
                tournamentCollection={tournamentCollection}
                playerOptions={playerOptions}
                courseOptions={courseOptions}
                currentUser={currentUser}
                database={database}
              />
            }
          />
          <Route
            path="/Tournament/Standings/:tournamentId"
            element={
              <TournamentStandings
                database={database}
                playerOptions={playerOptions}
              />
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
