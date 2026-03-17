import { Link } from "react-router-dom";
import { BackyardGolfLogo } from "../../components/BackyardGolfLogo";
import { GarageDartsLogo } from "../../components/GarageDartsLogo";
import "./Home.css";

const Home = () => {
  return (
    <div className="homeWrapper">
      <div className="cloudLayer" aria-hidden="true">
        <div className="cloud cloud1" />
        <div className="cloud cloud2" />
        <div className="cloud cloud3" />
      </div>
      <div className="page-container homeContent_z">
        <div className="homeHero">
          <img src="/Backyard_Sports_logo.png" className="homeLogoImg" alt="Backyard Sports" />
          <p className="homeSubtitle">Track scores for Golf and Darts</p>
        </div>
        <div className="homeGameCards">
          <Link to="/Golf" className="homeGameCard homeGameCardGolf">
            <BackyardGolfLogo className="homeGameCardLogo" />
          </Link>
          <Link to="/Darts" className="homeGameCard homeGameCardDarts">
            <GarageDartsLogo className="homeGameCardLogo" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
