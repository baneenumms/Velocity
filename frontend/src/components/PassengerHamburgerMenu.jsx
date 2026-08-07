import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  History,
  Home,
  LogOut,
  MapPinned,
  Menu,
  MessageSquareText,
  ScrollText,
  UserRound,
  X,
} from "lucide-react";

import "./PassengerHamburgerMenu.css";

const AUTHENTICATED_SESSION_KEYS = [
  "activeMode",

  "userId",

  "passengerId",
  "passengerName",
  "passengerPhone",
  "passengerEmail",

  "driverId",
  "driverName",
  "vehicleId",

  "rideRequestId",
  "rideId",
  "rideStatus",
  "paymentMethod",
  "searchStartedAt",

  "passengerRideDraft",
  "activeRideRequest",
  "acceptedRide",
  "activePassengerRide",
  "activeDriverRide",
  "ridePin",

  "isAdmin",
  "adminToken",

  "applicantToken",
  "applicationStatus",
  "canGoOnline",
  "walletEnabled",
];

function PassengerHamburgerMenu() {
  const [
    open,
    setOpen,
  ] = useState(false);

  const navigate = useNavigate();

  const goToPage = (
    path
  ) => {
    sessionStorage.setItem(
      "activeMode",
      "PASSENGER"
    );

    localStorage.setItem(
      "activeMode",
      "PASSENGER"
    );

    setOpen(false);

    navigate(path);
  };

  const logout = () => {
    AUTHENTICATED_SESSION_KEYS
      .forEach((key) => {
        sessionStorage.removeItem(
          key
        );

        localStorage.removeItem(
          key
        );
      });

    setOpen(false);

    navigate(
      "/role",
      {
        replace: true,
      }
    );
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
            (current) =>
              !current
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
        <>
          <button
            type="button"
            className="passenger-menu-backdrop"
            aria-label="Close passenger menu"
            onClick={() =>
              setOpen(false)
            }
          />

          <nav className="menu-dropdown">
            <button
              type="button"
              onClick={() =>
                goToPage(
                  "/passenger-dashboard"
                )
              }
            >
              <Home size={18} />
              Home
            </button>

            <button
              type="button"
              onClick={() =>
                goToPage(
                  "/passenger-profile"
                )
              }
            >
              <UserRound
                size={18}
              />
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
              <History size={18} />
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
              <MapPinned
                size={18}
              />
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
              <ScrollText
                size={18}
              />
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
              <MessageSquareText
                size={18}
              />
              Feedback
            </button>

            <button
              type="button"
              className="logout-btn"
              onClick={logout}
            >
              <LogOut size={18} />
              Logout
            </button>
          </nav>
        </>
      )}
    </div>
  );
}

export default PassengerHamburgerMenu;