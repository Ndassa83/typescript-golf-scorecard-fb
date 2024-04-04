import { useState, useEffect } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import "firebase/firestore";
import { getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { Button } from "@mui/material";
import {
  Player,
  Course,
  PlayerOptionType,
  CourseOptionType,
  FetchedPlayer,
} from "./types";
import Home from "./Pages/Home/Home";
import ScoreCard from "./Pages/ScoreCard/ScoreCard";
import StatPage from "./Pages/StatPage/StatPage";
import NotFound from "./Pages/NotFound/NotFound";
import logo from "./images/products-products-AIMMG107.png";
import "./App.css";

const firebaseConfig = {
  apiKey: "AIzaSyCDdERZLE_JqpdqT7sIYpeEWAS6p83JQoI",
  authDomain: "golf-scorecard-8602a.firebaseapp.com",
  projectId: "golf-scorecard-8602a",
  storageBucket: "golf-scorecard-8602a.appspot.com",
  messagingSenderId: "168934969477",
  appId: "1:168934969477:web:66b4256c161a55698cd9ec",
  measurementId: "G-3K13Y12CKY",
};

initializeApp(firebaseConfig);

const database = getFirestore();
const collectionRef = collection(database, "playerData");

const firebaseApp = getApp();
const storage = getStorage(firebaseApp, "gs://my-custom-bucket");

const App = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [courseSelected, setCourseSelected] = useState<Course | null>(null);
  const [playerOptions, setPlayerOptions] = useState<PlayerOptionType[]>([]);
  const [courseOptions, setCourseOptions] = useState<CourseOptionType[]>([]);
  const [createdPlayerId, setCreatedPlayerId] = useState<number | undefined>();
  const [createdPlayerName, setCreatedPlayerName] = useState<string>("");
  const [createdCourse, setCreatedCourse] = useState<Course | null>(null);

  const playerCollectionRef = collection(database, "userList");
  const courseCollectionRef = collection(database, "courseData");

  console.log(createdCourse);

  //fetch users
  useEffect(() => {
    getDocs(query(playerCollectionRef, orderBy("userName", "asc"))).then(
      (snapshot) => {
        snapshot.docs.forEach((doc: any) => {
          setPlayerOptions((prev: PlayerOptionType[] | any) => [
            ...prev,
            {
              value: { ...doc.data() },
              label: doc.data().userName,
            },
          ]);
        });
      }
    );
  }, [database]);

  //fetch courses
  useEffect(() => {
    getDocs(query(courseCollectionRef, orderBy("courseName", "asc"))).then(
      (snapshot) => {
        snapshot.docs.forEach((doc: any) => {
          setCourseOptions((prev: CourseOptionType[] | any) => [
            ...prev,
            {
              value: { ...doc.data() },
              label: doc.data().courseName,
            },
          ]);
        });
      }
    );
  }, [database]);

  //create player

  useEffect(() => {
    if (createdPlayerId) {
      const newPlayer = {
        userId: createdPlayerId,
        userName: createdPlayerName,
      };
      setDoc(doc(database, `userList/${createdPlayerId}`), newPlayer).then(
        () => {
          setPlayerOptions((prev) => [
            ...prev,
            { label: createdPlayerName, value: newPlayer },
          ]);
        }
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

  return (
    <div className="background">
      <div className="App">
        <nav className="navContainer">
          <div className="logo">
            <Button>
              <Link to="/">
                <img className="homeImg" src={logo} alt="logo" />
              </Link>
            </Button>
          </div>
          <div className="navLinks">
            <Button disabled={!courseSelected}>
              <Link className="navOptions" to="/ScoreCard">
                ScoreCard
              </Link>
            </Button>
            <Button>
              <Link className="navOptions" to="/StatPage">
                StatPage
              </Link>
            </Button>
          </div>
        </nav>
        <Routes>
          <Route
            path="/"
            element={
              <Home
                players={players}
                setPlayers={setPlayers}
                courseSelected={courseSelected}
                setCourseSelected={setCourseSelected}
                playerOptions={playerOptions}
                courseOptions={courseOptions}
                setCreatedPlayerName={setCreatedPlayerName}
                createdPlayerName={createdPlayerName}
                setCreatedPlayerId={setCreatedPlayerId}
                createdCourse={createdCourse}
                setCreatedCourse={setCreatedCourse}
              />
            }
          />
          <Route
            path="/ScoreCard"
            element={
              <ScoreCard
                players={players}
                setPlayers={setPlayers}
                courseSelected={courseSelected}
                setCourseSelected={setCourseSelected}
                database={database}
                collectionRef={collectionRef}
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
