import {
  useNavigate,
} from "react-router-dom";

import {
  House,
} from "lucide-react";

import "./VelocityHomeButton.css";

function VelocityHomeButton({
  mode,
}) {
  const navigate = useNavigate();

  const normalizedMode =
    String(mode || "")
      .trim()
      .toUpperCase();

  const handleHome = () => {
    if (normalizedMode) {
      sessionStorage.setItem(
        "activeMode",
        normalizedMode
      );

      localStorage.setItem(
        "activeMode",
        normalizedMode
      );
    }

    let destination = "/role";

    if (
      normalizedMode ===
      "PASSENGER"
    ) {
      destination =
        "/passenger-dashboard";
    } else if (
      normalizedMode ===
      "DRIVER"
    ) {
      destination =
        "/driver-dashboard";
    } else if (
      normalizedMode ===
      "ADMIN"
    ) {
      destination = "/admin";
    }

    navigate(destination, {
      replace: true,
    });
  };

  return (
    <button
      type="button"
      className={
        `velocity-home-button ${
          normalizedMode.toLowerCase()
        }`
      }
      onClick={handleHome}
      aria-label="Go to Velocity home"
      title="Home"
    >
      <House size={19} />

      <span>
        VELOCITY
      </span>
    </button>
  );
}

export default VelocityHomeButton;