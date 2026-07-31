import { useState } from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

import "./DriverPassword.css";

const SESSION_KEYS_TO_CLEAR = [
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
  "activeRideRequest",
  "passengerRideDraft",
  "acceptedRide",
  "activeDriverRide",
  "ridePin",
  "isAdmin",
  "adminToken",
];

function clearPreviousTabSession() {
  SESSION_KEYS_TO_CLEAR.forEach(
    (key) => {
      sessionStorage.removeItem(
        key
      );

      localStorage.removeItem(
        key
      );
    }
  );
}

function DriverPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const { phone } =
    location.state || {};

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {
    setError("");

    if (!phone) {
      setError(
        "Phone number is missing. Please start again."
      );
      return;
    }

    if (password.trim() === "") {
      setError(
        "Please enter your password."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/driver-auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            phoneNumber: phone,
            password,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            "Login failed. Please try again."
        );
        return;
      }

      clearPreviousTabSession();

      sessionStorage.setItem(
        "driverId",
        String(data.driverId)
      );

      sessionStorage.setItem(
        "userId",
        String(data.userId)
      );

      sessionStorage.setItem(
        "driverName",
        data.fullName || "Driver"
      );

      const isAdmin =
        data.isAdmin === true;

      sessionStorage.setItem(
        "isAdmin",
        String(isAdmin)
      );

      if (
        isAdmin &&
        data.adminToken
      ) {
        sessionStorage.setItem(
          "adminToken",
          data.adminToken
        );
      }

      navigate(
        "/driver-dashboard",
        {
          replace: true,
        }
      );
    } catch (loginError) {
      console.error(loginError);

      setError(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="velocity-title">
        <span className="velo">
          VEL
        </span>

        <span className="wheel">
          <span className="hub" />
        </span>

        <span className="city">
          CITY
        </span>
      </div>

      <div className="card">
        <div className="icon-circle">
          <Lock
            size={36}
            color="white"
          />
        </div>

        <h1 className="title">
          Enter your password
        </h1>

        <p className="subtitle">
          Welcome back! Enter your
          password to continue.
        </p>

        <div className="password-input">
          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder="Password"
            value={password}
            disabled={loading}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                  "Enter" &&
                !loading
              ) {
                handleLogin();
              }
            }}
          />

          <button
            type="button"
            className="eye-btn"
            disabled={loading}
            onClick={() =>
              setShowPassword(
                (current) =>
                  !current
              )
            }
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <button
          type="button"
          className="primary-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>
      </div>
    </div>
  );
}

export default DriverPassword;