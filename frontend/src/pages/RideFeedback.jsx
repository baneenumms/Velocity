import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  AlertCircle,
  Star,
} from "lucide-react";

import "./RideFeedback.css";

const API = "http://localhost:8080";

async function readResponse(response) {
  const text =
    await response.text();

  let data = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.details ||
        text ||
        `Unable to submit feedback. HTTP ${response.status}`
    );
  }

  return data;
}

function RideFeedback() {
  const navigate = useNavigate();
  const { state } = useLocation();

  /*
   * This generic feedback page is now used
   * primarily for passengers. The driver has
   * a separate /driver-feedback page.
   */
  const role =
    state?.role ||
    "PASSENGER";

  const stateRideId =
    Number(state?.rideId);

  const storedRideId =
    Number(
      sessionStorage.getItem(
        "passengerFeedbackRideId"
      )
    );

  const rideId =
    Number.isInteger(stateRideId) &&
    stateRideId > 0
      ? stateRideId
      : storedRideId;

  const passengerId = Number(
    sessionStorage.getItem(
      "passengerId"
    )
  );

  const driverId = Number(
    sessionStorage.getItem(
      "driverId"
    )
  );

  const [rating, setRating] =
    useState(null);

  const [comment, setComment] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (
      Number.isInteger(
        stateRideId
      ) &&
      stateRideId > 0
    ) {
      sessionStorage.setItem(
        "passengerFeedbackRideId",
        String(stateRideId)
      );
    }
  }, [stateRideId]);

  const dashboard =
    role === "DRIVER"
      ? "/driver-dashboard"
      : "/passenger-dashboard";

  const reports =
    role === "DRIVER"
      ? [
          "PASSENGER_BEHAVIOUR",
          "PAYMENT_DISAGREEMENT",
          "INCORRECT_PICKUP",
          "DAMAGE_OR_CLEANLINESS",
          "OTHER",
        ]
      : [
          "DRIVER_BEHAVIOUR",
          "UNSAFE_DRIVING",
          "INCORRECT_ROUTE",
          "PAYMENT_DISAGREEMENT",
          "VEHICLE_PROBLEM",
          "OTHER",
        ];

  const clearFeedbackSession =
    () => {
      sessionStorage.removeItem(
        "passengerFeedbackRideId"
      );
    };

  const goToDashboard = () => {
    clearFeedbackSession();

    navigate(
      dashboard,
      {
        replace: true,
      }
    );
  };

  const submit = async () => {
    setError("");

    if (
      !Number.isInteger(rideId) ||
      rideId <= 0
    ) {
      setError(
        "Ride information was not found. Please open feedback from the completed ride screen."
      );
      return;
    }

    if (
      role === "PASSENGER" &&
      (
        !Number.isInteger(
          passengerId
        ) ||
        passengerId <= 0
      )
    ) {
      setError(
        "Passenger login information was not found. Please log in again."
      );
      return;
    }

    if (
      role === "DRIVER" &&
      (
        !Number.isInteger(
          driverId
        ) ||
        driverId <= 0
      )
    ) {
      setError(
        "Driver login information was not found. Please log in again."
      );
      return;
    }

    if (
      !rating &&
      !comment.trim() &&
      !category
    ) {
      setError(
        "Add a rating, comment, or issue before submitting."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API}/ride-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            rideId,

            submittedBy:
              role,

            passengerId:
              role === "PASSENGER"
                ? passengerId
                : null,

            driverId:
              role === "DRIVER"
                ? driverId
                : null,

            rating,

            comment:
              comment.trim() ||
              null,

            reportCategory:
              category || null,
          }),
        }
      );

      await readResponse(
        response
      );

      goToDashboard();
    } catch (requestError) {
      console.error(
        "Feedback submission error:",
        requestError
      );

      if (
        requestError instanceof
        TypeError
      ) {
        setError(
          "Unable to connect to the backend server."
        );
      } else {
        setError(
          requestError.message ||
            "Unable to submit feedback."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-card">
        <h1>
          How was your ride?
        </h1>

        <p>
          Feedback is optional.
        </p>

        <div className="rating-row">
          {[1, 2, 3, 4, 5].map(
            (value) => (
              <button
                key={value}
                type="button"
                className={
                  rating >= value
                    ? "selected"
                    : ""
                }
                onClick={() => {
                  setRating(value);
                  setError("");
                }}
                aria-label={`Rate ${value} out of 5`}
              >
                <Star
                  size={31}
                  fill={
                    rating >= value
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
            )
          )}
        </div>

        <textarea
          maxLength={500}
          placeholder="Optional comment"
          value={comment}
          onChange={(event) => {
            setComment(
              event.target.value
            );

            setError("");
          }}
        />

        <select
          value={category}
          onChange={(event) => {
            setCategory(
              event.target.value
            );

            setError("");
          }}
        >
          <option value="">
            Report an issue (optional)
          </option>

          {reports.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item.replaceAll(
                "_",
                " "
              )}
            </option>
          ))}
        </select>

        {error && (
          <p className="feedback-error">
            <AlertCircle size={18} />
            {error}
          </p>
        )}

        <button
          type="button"
          className="feedback-submit"
          onClick={submit}
          disabled={
            saving ||
            (
              !rating &&
              !comment.trim() &&
              !category
            )
          }
        >
          {saving
            ? "Submitting..."
            : "Submit Feedback"}
        </button>

        <button
          type="button"
          className="feedback-skip"
          onClick={
            goToDashboard
          }
          disabled={saving}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

export default RideFeedback;
