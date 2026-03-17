import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, Tab } from "@mui/material";
import { Firestore } from "firebase/firestore";
import { User } from "firebase/auth";
import { PlayerOptionType, CourseOptionType } from "../../types";
import StatPage from "./StatPage";
import DartStatPage from "./DartStatPage";
import Dashboard from "../Dashboard/Dashboard";

type Props = {
  playerOptions: PlayerOptionType[];
  courseOptions: CourseOptionType[];
  database: Firestore;
  currentUser: User | null;
  onSignIn: () => void;
  onUpdatePlayerAvatar: (userId: number, avatarId: string) => Promise<void>;
};

type TabValue = "golf" | "darts" | "personal";

const StatsHub = ({
  playerOptions,
  courseOptions,
  database,
  currentUser,
  onSignIn,
  onUpdatePlayerAvatar,
}: Props) => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabValue) ?? "golf";
  const [activeTab, setActiveTab] = useState<TabValue>(
    ["golf", "darts", "personal"].includes(initialTab) ? initialTab : "golf"
  );
  const [visitedTabs, setVisitedTabs] = useState<Set<TabValue>>(
    new Set([activeTab]),
  );

  useEffect(() => {
    const tab = searchParams.get("tab") as TabValue;
    if (tab && ["golf", "darts", "personal"].includes(tab)) {
      setActiveTab(tab);
      setVisitedTabs((prev) => new Set([...prev, tab]));
    }
  }, [searchParams]);

  const handleTabChange = (_: React.SyntheticEvent, value: TabValue) => {
    setActiveTab(value);
    setVisitedTabs((prev) => new Set([...prev, value]));
  };

  return (
    <div>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        textColor="inherit"
        TabIndicatorProps={{
          style: { backgroundColor: "var(--green-primary)" },
        }}
        sx={{
          borderBottom: "2px solid var(--green-primary)",
          maxWidth: "var(--page-max-width)",
          margin: "0 auto",
          paddingLeft: "var(--page-padding)",
          paddingRight: "var(--page-padding)",
          boxSizing: "border-box",
        }}
      >
        <Tab
          value="golf"
          label="Golf"
          sx={{ fontFamily: "'Fredoka One', cursive", fontSize: "16px" }}
        />
        <Tab
          value="darts"
          label="Darts"
          sx={{ fontFamily: "'Fredoka One', cursive", fontSize: "16px" }}
        />
        <Tab
          value="personal"
          label="Personal"
          sx={{ fontFamily: "'Fredoka One', cursive", fontSize: "16px" }}
        />
      </Tabs>

      <div style={{ display: activeTab === "golf" ? "block" : "none" }}>
        {visitedTabs.has("golf") && (
          <StatPage playerOptions={playerOptions} courseOptions={courseOptions} />
        )}
      </div>

      <div style={{ display: activeTab === "darts" ? "block" : "none" }}>
        {visitedTabs.has("darts") && (
          <DartStatPage playerOptions={playerOptions} />
        )}
      </div>

      <div style={{ display: activeTab === "personal" ? "block" : "none" }}>
        {visitedTabs.has("personal") && (
          <Dashboard
            database={database}
            playerOptions={playerOptions}
            currentUser={currentUser}
            onSignIn={onSignIn}
            onUpdatePlayerAvatar={onUpdatePlayerAvatar}
          />
        )}
      </div>
    </div>
  );
};

export default StatsHub;
