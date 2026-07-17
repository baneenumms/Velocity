import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SplashScreen.css";

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/role");
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="page">
      <div className="glow glow-blue"></div>
      <div className="glow glow-pink"></div>

      <div className="velocity-title">
        <span className="velo">VEL</span>

        <span className="wheel">
          <span className="hub"></span>
        </span>

        <span className="city-wrap">
          <span className="city">CITY</span>
          <span className="city city-reflect" aria-hidden="true">CITY</span>
        </span>
      </div>

      <div className="tagline">Ride smarter. Move faster.</div>
    </div>
  );
}

export default SplashScreen;