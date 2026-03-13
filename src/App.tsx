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
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import ProfileDropdown from "./components/ProfileDropdown";
import {
  GolfRound,
  Course,
  PlayerOptionType,
  CourseOptionType,
  FetchedPlayer,
} from "./types";
import GolfHome from "./Pages/Home/GolfHome";
import ScoreCard from "./Pages/ScoreCard/ScoreCard";
import StatPage from "./Pages/StatPage/StatPage";
import NotFound from "./Pages/NotFound/NotFound";
import Dashboard from "./Pages/Dashboard/Dashboard";
import logo from "./images/products-products-AIMMG107.png";
import "./App.css";
import Home from "./Pages/Home/Home";
import DartHome from "./Pages/Home/DartHome";
import DartScoreCard from "./Pages/ScoreCard/DartScoreCard";
import DartStatPage from "./Pages/StatPage/DartStatPage";

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

const firebaseApp = getApp();
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const App = () => {
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
    );
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
    );
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
              <Link className="navOptions" to="/StatPage">
                Golf Stats
              </Link>
            </Button>
            <Button onClick={closeMenu}>
              <Link className="navOptions" to="/DartStatPage">
                Dart Stats
              </Link>
            </Button>
            <Button onClick={closeMenu}>
              <Link className="navOptions" to="/Dashboard">
                My Stats
              </Link>
            </Button>
            <Button disabled={!courseSelected} onClick={closeMenu}>
              <Link className="navOptions" to="/ScoreCard">
                ScoreCard
              </Link>
            </Button>
          </div>

          <div className="navAuth">
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
                {keepAwake ? (
                  <WbSunnyIcon fontSize="small" />
                ) : (
                  <WbSunnyOutlinedIcon fontSize="small" />
                )}
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
            element={
              <Home
                courseSelected={courseSelected}
                setCourseSelected={setCourseSelected}
                playerOptions={playerOptions}
                courseOptions={courseOptions}
                setCreatedPlayerName={setCreatedPlayerName}
                createdPlayerName={createdPlayerName}
                setCreatedPlayerId={setCreatedPlayerId}
                createdCourse={createdCourse}
                setCreatedCourse={setCreatedCourse}
                playerImage={playerImage}
                setPlayerImage={setPlayerImage}
                currentPlayers={currentPlayers}
                setCurrentPlayers={setCurrentPlayers}
              />
            }
          />
          <Route
            path="/Golf"
            element={
              <GolfHome
                courseSelected={courseSelected}
                setCourseSelected={setCourseSelected}
                courseOptions={courseOptions}
                createdCourse={createdCourse}
                setCreatedCourse={setCreatedCourse}
                currentPlayers={currentPlayers}
                setCurrentPlayers={setCurrentPlayers}
                playerRounds={playerRounds}
                setPlayerRounds={setPlayerRounds}
                onUpdateCourse={handleUpdateCourse}
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
              />
            }
          />
          <Route
            path="/StatPage"
            element={
              <StatPage
                playerOptions={playerOptions}
                courseOptions={courseOptions}
              />
            }
          />
          <Route
            path="/DartStatPage"
            element={<DartStatPage playerOptions={playerOptions} />}
          />
          <Route
            path="/Dashboard"
            element={
              <Dashboard
                database={database}
                playerOptions={playerOptions}
                currentUser={currentUser}
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
