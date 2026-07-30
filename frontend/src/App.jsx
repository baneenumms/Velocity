import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import SplashScreen from "./pages/SplashScreen";
import RoleSelection from "./pages/RoleSelection";
import OTPSent from "./pages/OTPSent";
import OTPVerified from "./pages/OTPVerified";

/* Driver Authentication */
import DriverPhone from "./pages/DriverPhone";
import DriverOTP from "./pages/DriverOTP";
import DriverPassword from "./pages/DriverPassword";
import DriverSignUP from "./pages/DriverSignUP";

/* Driver Dashboard */
import DriverDashboard from "./pages/DriverDashboard";
import DriverProfile from "./pages/DriverProfile";
import DriverWallet from "./pages/DriverWallet";
import DriverWalletInfo from "./pages/DriverWalletInfo";
import DriverTripHistory from "./pages/DriverTripHistory";

/* Passenger Authentication */
import PassengerPhone from "./pages/PassengerPhone";
import PassengerOTP from "./pages/PassengerOTP";
import PassengerSignUP from "./pages/PassengerSignUP";
import PassengerSignupOTP from "./pages/PassengerSignupOTP";

/* Passenger Dashboard */
import PassengerDashboard from "./pages/PassengerDashboard";
import PassengerFare from "./pages/PassengerFare";

/* Passenger Menu Pages */
import PassengerProfile from "./pages/PassengerProfile";
import PassengerRideHistory from "./pages/PassengerRideHistory";
import PassengerSavedLocations from "./pages/PassengerSavedLocations";
import PassengerFeedback from "./pages/PassengerFeedback";
import TermsAndPolicy from "./pages/TermsAndPolicy";
import SearchingRide from "./pages/SearchingRide";
import DriverActiveRide from "./pages/DriverActiveRide";
import DriverFeedback from "./pages/DriverFeedback";
import PassengerActiveRide from "./pages/PassengerActiveRide";
import RideFeedback from "./pages/RideFeedback";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<SplashScreen />}
        />

        <Route
          path="/role"
          element={<RoleSelection />}
        />

        <Route
          path="/otp-sent"
          element={<OTPSent />}
        />

        <Route
          path="/otp-verified"
          element={<OTPVerified />}
        />

        {/* Driver Authentication */}
        <Route
          path="/driver-phone"
          element={<DriverPhone />}
        />

        <Route
          path="/driver-otp"
          element={<DriverOTP />}
        />

        <Route
          path="/driver-password"
          element={<DriverPassword />}
        />

        <Route
          path="/driver-signup"
          element={<DriverSignUP />}
        />

        {/* Driver Dashboard */}
        <Route
          path="/driver-dashboard"
          element={<DriverDashboard />}
        />

        <Route
          path="/driver-profile"
          element={<DriverProfile />}
        />

        <Route
          path="/driver-wallet"
          element={<DriverWallet />}
        />

        <Route
          path="/driver-wallet-info"
          element={<DriverWalletInfo />}
        />

        <Route
          path="/driver-trips"
          element={<DriverTripHistory />}
        />

        {/* Passenger Authentication */}
        <Route
          path="/passenger-phone"
          element={<PassengerPhone />}
        />

        <Route
          path="/passenger-otp"
          element={<PassengerOTP />}
        />

        <Route
          path="/passenger-signup"
          element={<PassengerSignUP />}
        />

        <Route
          path="/passenger-signup-otp"
          element={<PassengerSignupOTP />}
        />

        {/* Passenger Dashboard */}
        <Route
          path="/passenger-dashboard"
          element={<PassengerDashboard />}
        />

        <Route
          path="/passenger-fare"
          element={<PassengerFare />}
        />

        {/* Passenger Menu Pages */}
        <Route
          path="/passenger-profile"
          element={<PassengerProfile />}
        />

        <Route
          path="/passenger-ride-history"
          element={<PassengerRideHistory />}
        />

        <Route
          path="/passenger-saved-locations"
          element={<PassengerSavedLocations />}
        />

        <Route
          path="/passenger-feedback"
          element={<PassengerFeedback />}
        />

        <Route
          path="/terms-and-policy"
          element={<TermsAndPolicy />}
        />

        <Route
          path="/searching-ride"
          element={<SearchingRide />}
        />

        <Route
          path="/driver-active-ride"
          element={<DriverActiveRide />}
        />

        <Route
          path="/driver-feedback"
          element={<DriverFeedback />}
        />

        <Route
          path="/passenger-active-ride"
          element={<PassengerActiveRide />}
        />

        <Route
          path="/ride-feedback"
          element={<RideFeedback />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;