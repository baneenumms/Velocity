import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import "./App.css";

/* General */
import SplashScreen from "./pages/SplashScreen";
import RoleSelection from "./pages/RoleSelection";
import OTPSent from "./pages/OTPSent";
import OTPVerified from "./pages/OTPVerified";

/* Driver Authentication */
import DriverPhone from "./pages/DriverPhone";
import DriverOTP from "./pages/DriverOTP";
import DriverPassword from "./pages/DriverPassword";
import DriverSignUP from "./pages/DriverSignUP";
import DriverSignupOTP from "./pages/DriverSignupOTP";
import DriverApplicationStatus from "./pages/DriverApplicationStatus";
import DriverSignupCorrections from "./pages/DriverSignupCorrections";

/* Driver Dashboard */
import DriverDashboard from "./pages/DriverDashboard";
import DriverProfile from "./pages/DriverProfile";
import DriverWallet from "./pages/DriverWallet";
import DriverWalletInfo from "./pages/DriverWalletInfo";
import DriverTripHistory from "./pages/DriverTripHistory";
import DriverActiveRide from "./pages/DriverActiveRide";
import DriverFeedback from "./pages/DriverFeedback";

/* Passenger Authentication */
import PassengerPhone from "./pages/PassengerPhone";
import PassengerOTP from "./pages/PassengerOTP";
import PassengerSignUP from "./pages/PassengerSignUP";
import PassengerSignupOTP from "./pages/PassengerSignupOTP";

/* Passenger Dashboard */
import PassengerDashboard from "./pages/PassengerDashboard";
import PassengerFare from "./pages/PassengerFare";
import PassengerProfile from "./pages/PassengerProfile";
import PassengerRideHistory from "./pages/PassengerRideHistory";
import PassengerSavedLocations from "./pages/PassengerSavedLocations";
import PassengerFeedback from "./pages/PassengerFeedback";
import SearchingRide from "./pages/SearchingRide";
import PassengerActiveRide from "./pages/PassengerActiveRide";
import RideFeedback from "./pages/RideFeedback";
import CancellationConfirmation from "./pages/CancellationConfirmation";

/* Shared */
import TermsAndPolicy from "./pages/TermsAndPolicy";
import AuthenticatedAppHeader from "./components/AuthenticatedAppHeader";

/* Admin */
import AdminDashboard from "./pages/AdminDashboard";
import AdminDriverApplications from "./pages/AdminDriverApplications";
import AdminFeedback from "./pages/AdminFeedback";
import AdminWalletTopUps from "./pages/AdminWalletTopUps";
import AdminAccountAction from "./pages/AdminAccountAction";
import AdminAppHeader from "./components/AdminAppHeader";

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

function getAuthenticatedHome() {
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

  const hasApplicantSession =
    activeMode === "DRIVER_APPLICANT" &&
    Boolean(
      readStoredValue("applicantToken")
    );

  /*
   * activeMode is set after the user
   * reaches a dashboard.
   *
   * This prevents signup OTP pages
   * from being blocked if an ID is
   * created before verification.
   */

  if (
    activeMode === "ADMIN" &&
    hasAdminSession
  ) {
    return "/admin";
  }

  if (hasApplicantSession) {
    return "/driver-application-status";
  }

  if (
    activeMode === "DRIVER" &&
    hasDriverSession
  ) {
    return "/driver-dashboard";
  }

  if (
    activeMode === "PASSENGER" &&
    hasPassengerSession
  ) {
    return "/passenger-dashboard";
  }

  return null;
}

function PublicOnlyRoute({
  children,
}) {
  const authenticatedHome =
    getAuthenticatedHome();

  if (authenticatedHome) {
    return (
      <Navigate
        to={authenticatedHome}
        replace
      />
    );
  }

  return children;
}

function DriverRoute({
  children,
  homeOnly = false,
}) {
  if (!hasValidId("driverId")) {
    const authenticatedHome =
      getAuthenticatedHome();

    return (
      <Navigate
        to={
          authenticatedHome ||
          "/role"
        }
        replace
      />
    );
  }

  return (
    <div className="velocity-authenticated-layout">
      <AuthenticatedAppHeader
        mode="DRIVER"
        homeOnly={homeOnly}
      />

      <div className="velocity-authenticated-content">
        {children}
      </div>
    </div>
  );
}

function ApplicantRoute({
  children,
}) {
  const activeMode = (
    readStoredValue("activeMode") ||
    ""
  ).toUpperCase();

  const applicantToken =
    readStoredValue("applicantToken");

  if (
    activeMode !== "DRIVER_APPLICANT" ||
    !applicantToken
  ) {
    return (
      <Navigate
        to={
          getAuthenticatedHome() ||
          "/driver-phone"
        }
        replace
      />
    );
  }

  return children;
}

function PassengerRoute({
  children,
  homeOnly = false,
}) {
  if (
    !hasValidId("passengerId")
  ) {
    const authenticatedHome =
      getAuthenticatedHome();

    return (
      <Navigate
        to={
          authenticatedHome ||
          "/role"
        }
        replace
      />
    );
  }

  return (
    <div className="velocity-authenticated-layout">
      <AuthenticatedAppHeader
        mode="PASSENGER"
        homeOnly={homeOnly}
      />

      <div className="velocity-authenticated-content">
        {children}
      </div>
    </div>
  );
}

function AdminRoute({
  children,
}) {
  const isAdmin =
    readStoredValue("isAdmin") ===
    "true";

  const adminToken =
    readStoredValue("adminToken");

  if (!isAdmin || !adminToken) {
    const authenticatedHome =
      getAuthenticatedHome();

    return (
      <Navigate
        to={
          authenticatedHome ||
          "/role"
        }
        replace
      />
    );
  }

  return (
    <div className="admin-authenticated-layout">
      <AdminAppHeader />

      <div className="admin-authenticated-content">
        {children}
      </div>
    </div>
  );
}

function AuthenticatedRoute({
  children,
}) {
  const authenticatedHome =
    getAuthenticatedHome();

  const hasSession =
    Boolean(authenticatedHome) ||
    hasValidId("driverId") ||
    hasValidId("passengerId");

  if (!hasSession) {
    return (
      <Navigate
        to="/role"
        replace
      />
    );
  }

  const activeMode = (
    readStoredValue("activeMode") ||
    (hasValidId("driverId")
      ? "DRIVER"
      : "PASSENGER")
  ).toUpperCase();

  return (
    <div className="velocity-authenticated-layout">
      <AuthenticatedAppHeader
        mode={
          activeMode === "DRIVER"
            ? "DRIVER"
            : "PASSENGER"
        }
      />

      <div className="velocity-authenticated-content">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>

      <Routes>
        {/* Public authentication pages */}

        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <SplashScreen />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/role"
          element={
            <PublicOnlyRoute>
              <RoleSelection />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/otp-sent"
          element={
            <PublicOnlyRoute>
              <OTPSent />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/otp-verified"
          element={
            <PublicOnlyRoute>
              <OTPVerified />
            </PublicOnlyRoute>
          }
        />

        {/* Driver Authentication */}

        <Route
          path="/driver-phone"
          element={
            <PublicOnlyRoute>
              <DriverPhone />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/driver-otp"
          element={
            <PublicOnlyRoute>
              <DriverOTP />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/driver-password"
          element={
            <PublicOnlyRoute>
              <DriverPassword />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/driver-signup"
          element={
            <PublicOnlyRoute>
              <DriverSignUP />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/driver-signup-otp"
          element={
            <PublicOnlyRoute>
              <DriverSignupOTP />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/driver-application-status"
          element={
            <ApplicantRoute>
              <DriverApplicationStatus />
            </ApplicantRoute>
          }
        />

        <Route
          path="/driver-signup-corrections"
          element={
            <ApplicantRoute>
              <DriverSignupCorrections />
            </ApplicantRoute>
          }
        />

        {/* Driver protected pages */}

        <Route
          path="/driver-dashboard"
          element={
            <DriverRoute>
              <DriverDashboard />
            </DriverRoute>
          }
        />

        <Route
          path="/driver-profile"
          element={
            <DriverRoute>
              <DriverProfile />
            </DriverRoute>
          }
        />

        <Route
          path="/driver-wallet"
          element={
            <DriverRoute>
              <DriverWallet />
            </DriverRoute>
          }
        />

        <Route
          path="/driver-wallet-info"
          element={
            <DriverRoute>
              <DriverWalletInfo />
            </DriverRoute>
          }
        />

        <Route
          path="/driver-trips"
          element={
            <DriverRoute>
              <DriverTripHistory />
            </DriverRoute>
          }
        />

        <Route
          path="/driver-active-ride"
          element={
            <DriverRoute>
              <DriverActiveRide />
            </DriverRoute>
          }
        />

        <Route
          path="/driver-feedback"
          element={
            <DriverRoute>
              <DriverFeedback />
            </DriverRoute>
          }
        />

        <Route
          path="/driver-cancel-offer"
          element={
            <DriverRoute>
              <CancellationConfirmation kind="DRIVER_OFFER" />
            </DriverRoute>
          }
        />

        <Route
          path="/driver-cancel-ride"
          element={
            <DriverRoute>
              <CancellationConfirmation kind="DRIVER_RIDE" />
            </DriverRoute>
          }
        />

        {/* Passenger Authentication */}

        <Route
          path="/passenger-phone"
          element={
            <PublicOnlyRoute>
              <PassengerPhone />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/passenger-otp"
          element={
            <PublicOnlyRoute>
              <PassengerOTP />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/passenger-signup"
          element={
            <PublicOnlyRoute>
              <PassengerSignUP />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/passenger-signup-otp"
          element={
            <PublicOnlyRoute>
              <PassengerSignupOTP />
            </PublicOnlyRoute>
          }
        />

        {/* Passenger protected pages */}

        <Route
          path="/passenger-dashboard"
          element={
            <PassengerRoute>
              <PassengerDashboard />
            </PassengerRoute>
          }
        />

        <Route
          path="/passenger-fare"
          element={
            <PassengerRoute>
              <PassengerFare />
            </PassengerRoute>
          }
        />

        <Route
          path="/passenger-profile"
          element={
            <PassengerRoute>
              <PassengerProfile />
            </PassengerRoute>
          }
        />

        <Route
          path="/passenger-ride-history"
          element={
            <PassengerRoute>
              <PassengerRideHistory />
            </PassengerRoute>
          }
        />

        <Route
          path="/passenger-saved-locations"
          element={
            <PassengerRoute>
              <PassengerSavedLocations />
            </PassengerRoute>
          }
        />

        <Route
          path="/passenger-feedback"
          element={
            <PassengerRoute>
              <PassengerFeedback />
            </PassengerRoute>
          }
        />

        <Route
          path="/searching-ride"
          element={
            <PassengerRoute homeOnly>
              <SearchingRide />
            </PassengerRoute>
          }
        />

        <Route
          path="/passenger-active-ride"
          element={
            <PassengerRoute>
              <PassengerActiveRide />
            </PassengerRoute>
          }
        />

        <Route
          path="/ride-feedback"
          element={
            <PassengerRoute>
              <RideFeedback />
            </PassengerRoute>
          }
        />

        <Route
          path="/passenger-cancel-search"
          element={
            <PassengerRoute>
              <CancellationConfirmation kind="PASSENGER_SEARCH" />
            </PassengerRoute>
          }
        />

        <Route
          path="/passenger-cancel-ride"
          element={
            <PassengerRoute>
              <CancellationConfirmation kind="PASSENGER_RIDE" />
            </PassengerRoute>
          }
        />

        {/* Shared authenticated page */}

        <Route
          path="/terms-and-policy"
          element={
            <AuthenticatedRoute>
              <TermsAndPolicy />
            </AuthenticatedRoute>
          }
        />

        {/* Admin protected pages */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/applications"
          element={
            <AdminRoute>
              <AdminDriverApplications />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/wallet-top-ups"
          element={
            <AdminRoute>
              <AdminWalletTopUps />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/feedback"
          element={
            <AdminRoute>
              <AdminFeedback />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/account-action"
          element={
            <AdminRoute>
              <AdminAccountAction />
            </AdminRoute>
          }
        />

        {/* Unknown URLs */}

        <Route
          path="*"
          element={
            <Navigate
              to={
                getAuthenticatedHome() ||
                "/"
              }
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
