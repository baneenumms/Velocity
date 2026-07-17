import { BrowserRouter, Routes, Route } from "react-router-dom";

import SplashScreen from "./pages/SplashScreen";
import RoleSelection from "./pages/RoleSelection";

import DriverPhone from "./pages/DriverPhone";
import OTPSent from "./pages/OTPSent";
import DriverOTP from "./pages/DriverOTP";
import OTPVerified from "./pages/OTPVerified";

import DriverPassword from "./pages/DriverPassword";
import DriverSignUP from "./pages/DriverSignUP";

import DriverDashboard from "./pages/DriverDashboard";


function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Authentication */}

        <Route path="/" element={<SplashScreen />} />

        <Route path="/role" element={<RoleSelection />} />

        <Route 
          path="/driver-phone" 
          element={<DriverPhone />} 
        />


        <Route 
          path="/otp-sent" 
          element={<OTPSent />} 
        />


        <Route 
          path="/driver-otp" 
          element={<DriverOTP />} 
        />


        <Route 
          path="/otp-verified" 
          element={<OTPVerified />} 
        />


        <Route 
          path="/driver-password" 
          element={<DriverPassword />} 
        />


        <Route 
          path="/driver-signup" 
          element={<DriverSignUP />} 
        />


        {/* Dashboard */}

        <Route 
          path="/driver-dashboard" 
          element={<DriverDashboard />} 
        />


      </Routes>

    </BrowserRouter>

  );

}

export default App;