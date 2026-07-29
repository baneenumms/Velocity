import {
  useNavigate,
} from "react-router-dom";

import {
  X,
} from "lucide-react";

import "./HamburgerMenu.css";

const DRIVER_SESSION_KEYS = [
  "userId",
  "driverId",
  "driverName",
  "vehicleId",
  "rideId",
  "rideStatus",
  "activeDriverRide",
];

function HamburgerMenu({
  open,
  onClose,
}) {
  const navigate = useNavigate();

  const goTo = (path) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    DRIVER_SESSION_KEYS.forEach(
      (key) => {
        sessionStorage.removeItem(
          key
        );
      }
    );

    onClose();

    navigate("/", {
      replace: true,
    });
  };

  return (
    <>
      <div
        className={`menu-overlay ${
          open ? "open" : ""
        }`}
        onClick={onClose}
      />

      <div
        className={`menu-panel ${
          open ? "open" : ""
        }`}
      >
        <button
          type="button"
          className="menu-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={25} />
        </button>

        <nav className="menu-nav">
          <button
            type="button"
            onClick={() =>
              goTo(
                "/driver-dashboard"
              )
            }
          >
            Home
          </button>

          <button
            type="button"
            onClick={() =>
              goTo(
                "/driver-profile"
              )
            }
          >
            Profile
          </button>

          <button
            type="button"
            onClick={() =>
              goTo(
                "/driver-wallet"
              )
            }
          >
            My Wallet
          </button>

          <button
            type="button"
            onClick={() =>
              goTo(
                "/driver-trips"
              )
            }
          >
            Trip History
          </button>

          <button
            type="button"
            onClick={() =>
              goTo(
                "/driver-terms"
              )
            }
          >
            Terms &amp; Conditions
          </button>

          <button
            type="button"
            className="menu-logout"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>
        </nav>
      </div>
    </>
  );
}

export default HamburgerMenu;