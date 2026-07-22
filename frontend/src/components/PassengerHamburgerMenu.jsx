import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PassengerHamburgerMenu.css";

function PassengerHamburgerMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const goToPage = (path) => {
    setOpen(false);
    navigate(path);
  };

  const logout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("passengerId");
    localStorage.removeItem("passengerName");
    localStorage.removeItem("passengerPhone");
    localStorage.removeItem("passengerEmail");

    sessionStorage.removeItem("passengerRideDraft");

    navigate("/");
  };

  return (
    <div className="passenger-menu">
      <button
        type="button"
        className="menu-button"
        aria-label="Open passenger menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        ☰
      </button>

      {open && (
        <div className="menu-dropdown">
          <button
            type="button"
            onClick={() =>
              goToPage("/passenger-profile")
            }
          >
            My Profile
          </button>

          <button
            type="button"
            onClick={() =>
              goToPage("/passenger-ride-history")
            }
          >
            Ride History
          </button>

          <button
            type="button"
            onClick={() =>
              goToPage("/passenger-saved-locations")
            }
          >
            Saved Locations
          </button>

          <button
            type="button"
            onClick={() =>
              goToPage("/terms-and-policy")
            }
          >
            Terms and Policy
          </button>

          <button
            type="button"
            onClick={() =>
              goToPage("/passenger-feedback")
            }
          >
            Feedback
          </button>

          <button
            type="button"
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default PassengerHamburgerMenu;