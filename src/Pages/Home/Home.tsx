import { Link } from "react-router-dom";
import { BackyardGolfLogo } from "../../components/BackyardGolfLogo";
import { GarageDartsLogo } from "../../components/GarageDartsLogo";
import "./Home.css";

const Home = () => {
  return (
    <div className="page-container">
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
  );
};

export default Home;
