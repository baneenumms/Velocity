import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Menu,
  X,
} from "lucide-react";

import "./PassengerHamburgerMenu.css";

const PASSENGER_SESSION_KEYS = [
  "userId",
  "passengerId",
  "passengerName",
  "passengerPhone",
  "passengerEmail",
  "rideRequestId",
  "rideId",
  "rideStatus",
  "paymentMethod",
  "searchStartedAt",
  "passengerRideDraft",
  "activeRideRequest",
  "acceptedRide",
  "activePassengerRide",
  "ridePin",
];

function PassengerHamburgerMenu() {
  const [open, setOpen] =
    useState(false);

  const navigate = useNavigate();

  const goToPage = (path) => {
    setOpen(false);
    navigate(path);
  };

  const logout = () => {
    PASSENGER_SESSION_KEYS.forEach(
      (key) => {
        sessionStorage.removeItem(
          key
        );
      }
    );

    setOpen(false);

    navigate("/", {
      replace: true,
    });
  };

  return (
    <div className="passenger-menu">
      <button
        type="button"
        className="menu-button"
        aria-label={
          open
            ? "Close passenger menu"
            : "Open passenger menu"
        }
        aria-expanded={open}
        onClick={() =>
          setOpen(
            (current) => !current
          )
        }
      >
        {open ? (
          <X size={25} />
        ) : (
          <Menu size={25} />
        )}
      </button>

      {open && (
        <div className="menu-dropdown">
          <button
            type="button"
            onClick={() =>
              goToPage(
                "/passenger-profile"
              )
            }
          >
            My Profile
          </button>

          <button
            type="button"
            onClick={() =>
              goToPage(
                "/passenger-ride-history"
              )
            }
          >
            Ride History
          </button>

          <button
            type="button"
            onClick={() =>
              goToPage(
                "/passenger-saved-locations"
              )
            }
          >
            Saved Locations
          </button>

          <button
            type="button"
            onClick={() =>
              goToPage(
                "/terms-and-policy"
              )
            }
          >
            Terms and Policy
          </button>

          <button
            type="button"
            onClick={() =>
              goToPage(
                "/passenger-feedback"
              )
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