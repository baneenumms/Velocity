import { apiBaseUrl } from "../config/api.js";
import {
  useNavigate,
} from "react-router-dom";

import {
  ShieldCheck,
  X,
} from "lucide-react";

import "./HamburgerMenu.css";

const AUTHENTICATED_SESSION_KEYS = [
  "activeMode",

  "userId",

  "driverId",
  "driverName",
  "fullName",
  "vehicleId",

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
  "activeDriverRide",
  "ridePin",

  "isAdmin",
  "adminToken",

  "applicantToken",
  "applicationStatus",
  "canGoOnline",
  "walletEnabled",
];

function readStoredValue(key) {
  return (
    sessionStorage.getItem(key) ||
    localStorage.getItem(key)
  );
}

function HamburgerMenu({
  open,
  onClose,
}) {
  const navigate = useNavigate();

  const isAdmin =
    readStoredValue(
      "isAdmin"
    ) === "true";

  const adminToken =
    readStoredValue(
      "adminToken"
    );

  const hasAdminAccess =
    isAdmin &&
    Boolean(adminToken);

  const goTo = (
    path,
    mode = "DRIVER"
  ) => {
    sessionStorage.setItem(
      "activeMode",
      mode
    );

    localStorage.setItem(
      "activeMode",
      mode
    );

    onClose();

    navigate(path);
  };

  const handleLogout = () => {
    fetch(`${apiBaseUrl}/auth-sessions/current`, {
      method: "DELETE",
    }).catch(() => {});

    sessionStorage.removeItem("velocitySession");
    AUTHENTICATED_SESSION_KEYS
      .forEach((key) => {
        sessionStorage.removeItem(
          key
        );

        localStorage.removeItem(
          key
        );
      });

    onClose();

    navigate(
      "/role",
      {
        replace: true,
      }
    );
  };

  return (
    <>
      <div
        className={
          `menu-overlay ${
            open ? "open" : ""
          }`
        }
        onClick={onClose}
      />

      <aside
        className={
          `menu-panel ${
            open ? "open" : ""
          }`
        }
        aria-hidden={!open}
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

          {hasAdminAccess && (
            <button
              type="button"
              className="admin-menu-button"
              onClick={() =>
                goTo(
                  "/admin",
                  "ADMIN"
                )
              }
            >
              <ShieldCheck
                size={19}
              />

              Admin Panel
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              goTo(
                "/terms-and-policy"
              )
            }
          >
            Terms &amp; Policy
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
      </aside>
    </>
  );
}

export default HamburgerMenu;
