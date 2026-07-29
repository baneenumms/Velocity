import {
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  AlertCircle,
  CheckCircle2,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";

import "./DriverFeedback.css";

const CATEGORIES = [
  {
    value: "PASSENGER_BEHAVIOUR",
    label: "Passenger behaviour",
  },
  {
    value: "RIDE_ENVIRONMENT",
    label: "Ride environment or safety",
  },
  {
    value: "PAYMENT_RECEIVING",
    label: "Payment receiving",
  },
  {
    value: "APP_FEEDBACK",
    label: "App feedback",
  },
  {
    value: "OTHER",
    label: "Other concern",
  },
];

function DriverFeedback() {
  const navigate = useNavigate();
  const location = useLocation();

  const driverId = Number(
    sessionStorage.getItem(
      "driverId"
    )
  );

  const rideId = Number(
    location.state?.rideId ||
      sessionStorage.getItem(
        "lastCompletedRideId"
      )
  );

  const [category, setCategory] =
    useState("");

  const [details, setDetails] =
    useState("");

  const [error, setError] =
    useState("");

  const clearCompletedRide = () => {
    sessionStorage.removeItem(
      "lastCompletedRideId"
    );

    sessionStorage.removeItem(
      "lastCompletedRide"
    );
  };

  const continueToRequests = () => {
    clearCompletedRide();

    navigate(
      "/driver-dashboard",
      {
        replace: true,
      }
    );
  };

  const submitFeedback = () => {
    setError("");

    if (!category) {
      setError(
        "Select the type of concern."
      );
      return;
    }

    if (
      !Number.isInteger(driverId) ||
      driverId <= 0
    ) {
      setError(
        "Driver information was not found."
      );
      return;
    }

    const storageKey =
      `velocityDriverFeedback:${driverId}`;

    let previousFeedback = [];

    try {
      const saved =
        localStorage.getItem(
          storageKey
        );

      previousFeedback = saved
        ? JSON.parse(saved)
        : [];

      if (
        !Array.isArray(
          previousFeedback
        )
      ) {
        previousFeedback = [];
      }
    } catch {
      previousFeedback = [];
    }

    previousFeedback.push({
      rideId:
        Number.isInteger(rideId) &&
        rideId > 0
          ? rideId
          : null,

      driverId,
      category,
      details: details.trim(),
      submittedAt:
        new Date().toISOString(),
    });

    localStorage.setItem(
      storageKey,
      JSON.stringify(
        previousFeedback
      )
    );

    continueToRequests();
  };

  return (
    <div className="driver-feedback-page">
      <main className="driver-feedback-card">
        <div className="driver-feedback-complete-icon">
          <CheckCircle2 size={38} />
        </div>

        <p className="driver-feedback-eyebrow">
          Ride completed
        </p>

        <h1>
          Do you have any concerns?
        </h1>

        <p className="driver-feedback-description">
          Tell us about passenger
          behaviour, the ride environment,
          app performance, payment
          receiving, or anything else.
          Velocity will acknowledge and
          address your concerns.
        </p>

        <div className="driver-feedback-assurance">
          <ShieldCheck size={22} />

          <span>
            Your concern will be connected
            to this completed ride.
          </span>
        </div>

        <section className="driver-feedback-categories">
          {CATEGORIES.map(
            (option) => (
              <button
                key={option.value}
                type="button"
                className={
                  category ===
                  option.value
                    ? "selected"
                    : ""
                }
                onClick={() => {
                  setCategory(
                    option.value
                  );

                  setError("");
                }}
              >
                {option.label}
              </button>
            )
          )}
        </section>

        <label className="driver-feedback-label">
          <span>
            Describe your concern
          </span>

          <div className="driver-feedback-textarea">
            <MessageSquareText
              size={22}
            />

            <textarea
              value={details}
              maxLength={1000}
              placeholder="Provide any useful details..."
              onChange={(event) =>
                setDetails(
                  event.target.value
                )
              }
            />
          </div>

          <small>
            {details.length}/1000
          </small>
        </label>

        {error && (
          <p className="driver-feedback-error">
            <AlertCircle size={18} />
            {error}
          </p>
        )}

        <button
          type="button"
          className="driver-feedback-submit"
          onClick={submitFeedback}
        >
          Submit Concern
        </button>

        <button
          type="button"
          className="driver-feedback-continue"
          onClick={
            continueToRequests
          }
        >
          Continue to Ride Requests
        </button>
      </main>
    </div>
  );
}

export default DriverFeedback;
