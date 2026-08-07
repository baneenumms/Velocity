import {
  House,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./GlobalHomeButton.css";

const PUBLIC_PATHS = new Set([
  "/",
  "/role",
  "/otp-sent",
  "/otp-verified",

  "/driver-phone",
  "/driver-otp",
  "/driver-password",
  "/driver-signup",
  "/driver-signup-otp",
  "/driver-application-status",
  "/driver-signup-corrections",

  "/passenger-phone",
  "/passenger-otp",
  "/passenger-signup",
  "/passenger-signup-otp",
]);

function readStoredValue(key) {
  return (
    sessionStorage.getItem(key) ||
    localStorage.getItem(key)
  );
}

function hasValidId(key) {
  const value = Number(
    readStoredValue(key)
  );

  return (
    Number.isInteger(value) &&
    value > 0
  );
}

function GlobalHomeButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const pathname =
    location.pathname;

  if (
    PUBLIC_PATHS.has(pathname)
  ) {
    return null;
  }

  const activeMode = (
    readStoredValue("activeMode") ||
    ""
  ).toUpperCase();

  const hasDriverSession =
    hasValidId("driverId");

  const hasPassengerSession =
    hasValidId("passengerId");

  const hasAdminSession =
    readStoredValue("isAdmin") ===
      "true" &&
    Boolean(
      readStoredValue("adminToken")
    );

  let homePath = null;
  let homeLabel = "Dashboard";

  /*
   * Admin URLs always return to the
   * admin dashboard.
   */
  if (
    pathname.startsWith(
      "/admin"
    ) &&
    hasAdminSession
  ) {
    homePath = "/admin";
    homeLabel =
      "Admin Dashboard";
  } else if (
    activeMode === "ADMIN" &&
    hasAdminSession
  ) {
    homePath = "/admin";
    homeLabel =
      "Admin Dashboard";
  } else if (
    activeMode === "PASSENGER" &&
    hasPassengerSession
  ) {
    homePath =
      "/passenger-dashboard";

    homeLabel =
      "Passenger Home";
  } else if (
    activeMode === "DRIVER" &&
    hasDriverSession
  ) {
    homePath =
      "/driver-dashboard";

    homeLabel =
      "Driver Home";
  } else if (
    hasPassengerSession &&
    !hasDriverSession
  ) {
    homePath =
      "/passenger-dashboard";

    homeLabel =
      "Passenger Home";
  } else if (
    hasDriverSession
  ) {
    homePath =
      "/driver-dashboard";

    homeLabel =
      "Driver Home";
  }

  if (
    !homePath ||
    pathname === homePath
  ) {
    return null;
  }

  const goHome = () => {
    if (
      homePath === "/admin"
    ) {
      sessionStorage.setItem(
        "activeMode",
        "ADMIN"
      );

      localStorage.setItem(
        "activeMode",
        "ADMIN"
      );
    }

    if (
      homePath ===
      "/driver-dashboard"
    ) {
      sessionStorage.setItem(
        "activeMode",
        "DRIVER"
      );

      localStorage.setItem(
        "activeMode",
        "DRIVER"
      );
    }

    if (
      homePath ===
      "/passenger-dashboard"
    ) {
      sessionStorage.setItem(
        "activeMode",
        "PASSENGER"
      );

      localStorage.setItem(
        "activeMode",
        "PASSENGER"
      );
    }

    navigate(homePath, {
      replace: true,
    });
  };

  return (
    <button
      type="button"
      className="global-home-button"
      onClick={goHome}
      aria-label={homeLabel}
      title={homeLabel}
    >
      <House size={21} />

      <span>Home</span>
    </button>
  );
}

export default GlobalHomeButton;