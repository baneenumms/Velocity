import { apiBaseUrl } from "../config/api.js";
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
  Menu,
  ScrollText,
  ShieldCheck,
  UserRound,
  WalletCards,
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

function HamburgerMenu() {
  const [
    open,
    setOpen,
  ] = useState(false);

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

    setOpen(false);

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

    setOpen(false);

    navigate(
      "/role",
      {
        replace: true,
      }
    );
  };

  return (
    <div className="driver-menu">
      <button
        type="button"
        className="driver-menu-button"
        aria-label={
          open
            ? "Close driver menu"
            : "Open driver menu"
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
            className="driver-menu-backdrop"
            aria-label="Close driver menu"
            onClick={() =>
              setOpen(false)
            }
          />

          <nav className="driver-menu-dropdown">
            <button
              type="button"
              onClick={() =>
                goTo(
                  "/driver-dashboard"
                )
              }
            >
              <Home size={18} />
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
              <UserRound size={18} />
              My Profile
            </button>

            <button
              type="button"
              onClick={() =>
                goTo(
                  "/driver-wallet"
                )
              }
            >
              <WalletCards size={18} />
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
              <History size={18} />
              Trip History
            </button>

            {hasAdminAccess && (
              <button
                type="button"
                className="driver-admin-menu-button"
                onClick={() =>
                  goTo(
                    "/admin",
                    "ADMIN"
                  )
                }
              >
                <ShieldCheck
                  size={18}
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
              <ScrollText size={18} />
              Terms and Policy
            </button>

            <button
              type="button"
              className="driver-menu-logout"
              onClick={handleLogout}
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

export default HamburgerMenu;
