import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SplashScreen.css";
import VelocityMark from "../components/VelocityMark";

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/role");
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="velocity-splash">
      <div className="splash-orb splash-orb-one" />
      <div className="splash-orb splash-orb-two" />
      <VelocityMark className="splash-mark" />
      <p className="splash-tagline">Your city, in motion.</p>

      <svg className="splash-car" viewBox="0 0 380 190" aria-label="Pink car with blinking headlights" role="img">
        <path className="splash-road-bed" d="M0 151H380V190H0Z" />
        <path className="splash-road-edge" d="M0 151H380" />
        <path className="splash-road" d="M0 173H380" />
        <path className="splash-car-body" d="M66 140c4-26 20-40 51-44l38-29h86l39 29c31 4 48 18 53 44H66Z" />
        <path className="splash-car-roof" d="M134 96l26-22h70l29 22Z" />
        <path className="splash-window" d="M161 78h31v18h-50Z" />
        <path className="splash-window" d="M197 78h29l23 18h-52Z" />
        <path className="splash-bumper" d="M58 137h282v12H58Z" />
        <circle className="splash-wheel" cx="118" cy="142" r="26" />
        <circle className="splash-wheel-hub" cx="118" cy="142" r="10" />
        <circle className="splash-wheel" cx="282" cy="142" r="26" />
        <circle className="splash-wheel-hub" cx="282" cy="142" r="10" />
        <circle className="splash-headlight splash-headlight-left" cx="74" cy="116" r="9" />
        <circle className="splash-headlight splash-headlight-right" cx="326" cy="116" r="9" />
      </svg>
    </main>
  );
}

export default SplashScreen;
