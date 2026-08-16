import { apiBaseUrl } from "../config/api.js";
import { useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import { UserRoundPlus } from "lucide-react";
import "./Signup.css";
import VelocityMark from "../components/VelocityMark";
import { normalizePersonName } from "../utils/inputNormalization";

const API = apiBaseUrl;

async function readResponse(response) {
  const text = await response.text();

  try {
    return text
      ? JSON.parse(text)
      : {};
  } catch {
    return { message: text };
  }
}

function PassengerSignUP() {
  const location = useLocation();
  const navigate = useNavigate();

  const phone =
    location.state?.phone || "";

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleContinue = async () => {
    setError("");

    const cleanName =
      normalizePersonName(fullName);

    const cleanEmail =
      email.trim().toLowerCase();

    if (!phone) {
      setError(
        "Phone number is missing. Please start again."
      );
      return;
    }

    if (!cleanName) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/passenger-auth/signup/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            fullName: cleanName,
            phoneNumber: phone,
            email: cleanEmail,
          }),
        }
      );

      const data =
        await readResponse(response);

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            data.details ||
            "Unable to send OTP."
        );
        return;
      }

      navigate(
        "/passenger-signup-otp",
        {
          state: {
            fullName: cleanName,
            phone,
            email: cleanEmail,
            maskedEmail:
              data.maskedEmail,
          },
        }
      );
    } catch (requestError) {
      console.error(requestError);

      setError(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!phone) {
    return (
      <div className="page auth-page">
        <div className="card">
          <h1 className="title">
            Passenger Registration
          </h1>

          <p className="error">
            Phone number is missing.
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

      <div className="card signup-card">
        <div className="icon-circle">
          <UserRoundPlus
            size={36}
            color="white"
          />
        </div>

        <h1 className="title">
          Passenger Registration
        </h1>

        <p className="subtitle">
          Create your passenger account.
        </p>

        <div className="signup-phone">
          Phone Number

          <strong>{phone}</strong>

          <button
            type="button"
            className="change-phone-button"
            onClick={() =>
              navigate(
                "/passenger-phone"
              )
            }
            disabled={loading}
          >
            Change phone
          </button>
        </div>

        <div className="signup-form">
          <label className="signup-field">
            <span>Full Name</span>

            <input
              type="text"
              value={fullName}
              autoFocus
              maxLength={100}
              placeholder="Enter your full name"
              disabled={loading}
              onChange={(event) =>
                setFullName(
                  event.target.value
                )
              }
              onBlur={() =>
                setFullName(
                  normalizePersonName(fullName)
                )
              }
            />
          </label>

          <label className="signup-field">
            <span>
              Email Address
            </span>

            <input
              type="email"
              value={email}
              maxLength={100}
              placeholder="name@example.com"
              disabled={loading}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                    "Enter" &&
                  !loading
                ) {
                  handleContinue();
                }
              }}
            />
          </label>
        </div>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <button
          type="button"
          className="primary-btn"
          onClick={handleContinue}
          disabled={loading}
        >
          {loading
            ? "Sending OTP..."
            : "Continue"}
        </button>
      </div>
    </div>
  );
}

export default PassengerSignUP;
