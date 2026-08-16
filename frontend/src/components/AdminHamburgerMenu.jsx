import { apiBaseUrl } from "../config/api.js";
import {
  useState,
} from "react";
import {
  useNavigate,
} from "react-router-dom";
import {
  CarFront,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  WalletCards,
  X,
} from "lucide-react";

import "./AdminHamburgerMenu.css";

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
  "velocityAdminActionContext",
  "velocityAdminNotice",
];

function readStoredValue(key) {
  return (
    sessionStorage.getItem(key) ||
    localStorage.getItem(key)
  );
}

function AdminHamburgerMenu() {
  const [open, setOpen] =
    useState(false);

  const navigate = useNavigate();

  const goTo = (
    path,
    mode = "ADMIN"
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
    const adminToken =
      readStoredValue(
        "adminToken"
      );

    fetch(
      `${apiBaseUrl}/auth-sessions/current`,
      {
        method: "DELETE",
        headers: adminToken
          ? {
              Authorization:
                `Bearer ${adminToken}`,
            }
          : undefined,
      }
    ).catch(() => {});

    sessionStorage.removeItem(
      "velocitySession"
    );

    localStorage.removeItem(
      "velocitySession"
    );

    AUTHENTICATED_SESSION_KEYS
      .forEach((key) => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
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
    <div className="admin-menu">
      <button
        type="button"
        className="admin-menu-button"
        aria-label={
          open
            ? "Close admin menu"
            : "Open admin menu"
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
        <>
          <button
            type="button"
            className="admin-menu-backdrop"
            aria-label="Close admin menu"
            onClick={() =>
              setOpen(false)
            }
          />

          <nav
            className="admin-menu-dropdown"
            aria-label="Admin navigation"
          >
            <button
              type="button"
              onClick={() =>
                goTo("/admin")
              }
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>

            <button
              type="button"
              onClick={() =>
                goTo(
                  "/admin/applications"
                )
              }
            >
              <ClipboardCheck size={18} />
              Driver Applications
            </button>

            <button
              type="button"
              onClick={() =>
                goTo(
                  "/admin/wallet-top-ups"
                )
              }
            >
              <WalletCards size={18} />
              Wallet Top-Ups
            </button>

            <button
              type="button"
              onClick={() =>
                goTo(
                  "/admin/feedback"
                )
              }
            >
              <MessageSquareText size={18} />
              Feedback
            </button>

            <button
              type="button"
              className="admin-menu-driver-mode"
              onClick={() =>
                goTo(
                  "/driver-dashboard",
                  "DRIVER"
                )
              }
            >
              <CarFront size={18} />
              Driver Mode
            </button>

            <button
              type="button"
              className="admin-menu-logout"
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

export default AdminHamburgerMenu;
