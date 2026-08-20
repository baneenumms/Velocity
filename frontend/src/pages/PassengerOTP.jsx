import { apiBaseUrl } from "../config/api.js";
import {
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { Mail } from "lucide-react";
import "./OTP.css";
import VelocityMark from "../components/VelocityMark";
import OtpInputGroup from "../components/OtpInputGroup";

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
];

function clearPreviousTabSession() {
  SESSION_KEYS_TO_CLEAR.forEach((key) => {
    sessionStorage.removeItem(key);

    /*
     * Remove old values left from the previous
     * localStorage implementation.
     */
    localStorage.removeItem(key);
  });
}

function PassengerOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    phone,
    maskedEmail,
  } = location.state || {};

  const [otp, setOtp] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [error, setError] = useState("");
  const [otpFailed, setOtpFailed] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const requestInFlight = useRef(false);

  const handleVerify = async () => {
    if (requestInFlight.current) return;
    setError("");

    if (!phone) {
      setError(
        "Phone number is missing. Please start again."
      );
      return;
    }

    const code = otp.join("");

    if (code.length !== 6) {
      setError(
        "Please enter the complete OTP."
      );
      return;
    }

    requestInFlight.current = true;
    setLoading(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}/passenger-auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            phoneNumber: phone,
            otp: code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Incorrect OTP. Please request a new code."
        );

        setOtpFailed(true);
        return;
      }

      clearPreviousTabSession();

      sessionStorage.setItem(
        "velocitySession",
        JSON.stringify({
          token: data.sessionToken,
          userId: data.userId,
          activeMode: data.activeMode,
          passengerId: data.passengerId,
          expiresAt: data.sessionExpiresAt,
        })
      );

      sessionStorage.setItem(
        "userId",
        String(data.userId)
      );

      sessionStorage.setItem(
        "activeMode",
        data.activeMode || "PASSENGER"
      );

      sessionStorage.setItem(
        "passengerId",
        String(data.passengerId)
      );

      sessionStorage.setItem(
        "passengerName",
        data.fullName || "Passenger"
      );

      sessionStorage.setItem(
        "passengerPhone",
        data.phoneNumber || phone
      );

      sessionStorage.setItem(
        "passengerEmail",
        data.email || ""
      );

      navigate("/otp-verified", {
        state: {
          phone,
          nextRoute:
            "/passenger-dashboard",
          verifiedMessage:
            "Your passenger account has been verified successfully.",
        },
      });
    } catch (err) {
      console.error(err);

      setError(
        "Unable to connect to server."
      );
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    navigate("/passenger-phone");
  };

  return (
    <div className="page auth-page">
      <VelocityMark className="auth-logo" />

      <div className="card">
        <div className="icon-circle">
          <Mail
            size={36}
            color="white"
          />
        </div>

        <h1 className="title">
          Email Verification
        </h1>

        <p className="subtitle">
          Enter the 6-digit code sent to
        </p>

        <p className="email-text">
          {maskedEmail ||
            "your registered email"}
        </p>

        <OtpInputGroup
          value={otp}
          onChange={(nextOtp) => {
            setOtp(nextOtp);
            setError("");
          }}
          onSubmit={handleVerify}
          disabled={otpFailed || loading}
        />

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {otpFailed ? (
          <button
            type="button"
            className="primary-btn"
            onClick={handleTryAgain}
          >
            Try Again
          </button>
        ) : (
          <button
            type="button"
            className="primary-btn"
            onClick={handleVerify}
            disabled={loading}
          >
            {loading
              ? "Verifying..."
              : "Verify OTP"}
          </button>
        )}
      </div>
    </div>
  );
}

export default PassengerOTP;
