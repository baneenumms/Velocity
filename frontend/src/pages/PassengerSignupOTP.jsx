import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Mail,
} from "lucide-react";

import "./OTP.css";
import VelocityMark from "../components/VelocityMark";

const API =
  "http://localhost:8080";

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

function clearPreviousSession() {
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

async function readResponse(
  response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

function PassengerSignupOTP() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    fullName,
    phone,
    email,
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

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const inputs = useRef([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const validState =
    Boolean(
      fullName &&
      phone &&
      email
    );

  const handleChange = (
    value,
    index
  ) => {
    if (!/^\d?$/.test(value)) {
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = value;

    setOtp(nextOtp);
    setError("");

    if (
      value &&
      index < 5
    ) {
      inputs.current[
        index + 1
      ]?.focus();
    }
  };

  const handleKeyDown = (
    event,
    index
  ) => {
    if (event.key === "Enter") {
      handleVerify();
      return;
    }
    if (
      event.key ===
        "Backspace" &&
      otp[index] === "" &&
      index > 0
    ) {
      inputs.current[
        index - 1
      ]?.focus();
    }
  };

  const handleVerify = async () => {
    setError("");

    if (!validState) {
      setError(
        "Signup information is missing. Please start again."
      );
      return;
    }

    const code =
      otp.join("");

    if (code.length !== 6) {
      setError(
        "Please enter the complete OTP."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/passenger-auth/signup/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            fullName,
            phoneNumber: phone,
            email,
            otp: code,
          }),
        }
      );

      const data =
        await readResponse(
          response
        );

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            data.details ||
            "Incorrect OTP."
        );

        setOtp([
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        window.setTimeout(() => {
          inputs.current[
            0
          ]?.focus();
        }, 0);

        return;
      }

      clearPreviousSession();

      sessionStorage.setItem(
        "userId",
        String(data.userId)
      );

      sessionStorage.setItem(
        "passengerId",
        String(
          data.passengerId
        )
      );

      sessionStorage.setItem(
        "passengerName",
        data.fullName ||
          fullName
      );

      sessionStorage.setItem(
        "passengerPhone",
        data.phoneNumber ||
          phone
      );

      sessionStorage.setItem(
        "passengerEmail",
        data.email ||
          email
      );

      navigate(
        "/otp-verified",
        {
          replace: true,
          state: {
            phone,
            nextRoute:
              "/passenger-dashboard",
            verifiedMessage:
              "Your passenger account has been created successfully.",
          },
        }
      );
    } catch (verifyError) {
      console.error(
        verifyError
      );

      setError(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartAgain = () => {
    navigate(
      "/passenger-signup",
      {
        replace: true,
        state: {
          phone,
        },
      }
    );
  };

  if (!validState) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">
            Passenger Registration
          </h1>

          <p className="error">
            Signup information is
            missing.
          </p>

          <button
            type="button"
            className="primary-btn"
            onClick={() =>
              navigate(
                "/passenger-phone"
              )
            }
          >
            Start Again
          </button>
        </div>
      </div>
    );
  }

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
          Verify Your Email
        </h1>

        <p className="subtitle">
          Enter the 6-digit code
          sent to
        </p>

        <p className="email-text">
          {maskedEmail || email}
        </p>

        <div className="otp-container">
          {otp.map(
            (digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputs.current[
                    index
                  ] = element;
                }}
                className="otp-box"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={
                  index === 0
                    ? "one-time-code"
                    : "off"
                }
                maxLength={1}
                value={digit}
                disabled={loading}
                onChange={(
                  event
                ) =>
                  handleChange(
                    event.target
                      .value,
                    index
                  )
                }
                onKeyDown={(
                  event
                ) =>
                  handleKeyDown(
                    event,
                    index
                  )
                }
              />
            )
          )}
        </div>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <button
          type="button"
          className="primary-btn"
          onClick={handleVerify}
          disabled={loading}
        >
          {loading
            ? "Creating Account..."
            : "Verify and Create Account"}
        </button>

        <button
          type="button"
          className="change-phone-button"
          onClick={
            handleStartAgain
          }
          disabled={loading}
        >
          Change signup details
        </button>
      </div>
    </div>
  );
}

export default PassengerSignupOTP;
