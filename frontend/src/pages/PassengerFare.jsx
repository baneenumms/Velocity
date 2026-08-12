import { apiBaseUrl } from "../config/api.js";
import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./PassengerFare.css";

const BACKEND_URL =
  apiBaseUrl;

const MINIMUM_FARE_FACTOR = 0.9;
const MAXIMUM_FARE_FACTOR = 2;

const numberFrom = (...values) => {
  const value = values.find(
    (item) =>
      item !== undefined &&
      item !== null
  );

  return Number(value);
};

async function readResponse(response) {
  const text = await response.text();

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
        `Request failed: HTTP ${response.status}`
    );
  }

  return data;
}

function PassengerFare() {
  const navigate = useNavigate();
  const location = useLocation();

  const adjustingFare =
    location.state?.adjustFare === true;

  const adjustmentRequestId =
    location.state?.requestId || "";

  const [ride, setRide] =
    useState(null);

  const [fare, setFare] =
    useState(0);

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("CASH");

  const [searching, setSearching] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    try {
      const activeRequest =
        sessionStorage.getItem(
          "activeRideRequest"
        );

      const rideDraft =
        sessionStorage.getItem(
          "passengerRideDraft"
        );

      const savedText =
        adjustingFare
          ? activeRequest ||
            rideDraft
          : rideDraft ||
            activeRequest;

      const saved = savedText
        ? JSON.parse(savedText)
        : null;

      if (!saved) {
        throw new Error(
          "Ride information was not found."
        );
      }

      const estimatedFare =
        numberFrom(
          saved.estimatedFare,
          saved.baseFare,
          saved.fare
        );

      const minimumFare =
        estimatedFare *
        MINIMUM_FARE_FACTOR;

      const maximumFare =
        estimatedFare *
        MAXIMUM_FARE_FACTOR;

      const currentFare =
        numberFrom(
          saved.passengerFare,
          saved.requestedFare,
          estimatedFare
        );

      const normalized = {
        requestId:
          saved.requestId ||
          adjustmentRequestId,

        pickupName:
          saved.pickupName ||
          saved.pickupAddress ||
          "Selected pickup",

        pickupLat: numberFrom(
          saved.pickupLat,
          saved.pickupLatitude,
          saved.pickup?.lat
        ),

        pickupLng: numberFrom(
          saved.pickupLng,
          saved.pickupLongitude,
          saved.pickup?.lng,
          saved.pickup?.lon
        ),

        dropoffName:
          saved.dropoffName ||
          saved.destinationName ||
          saved.dropoffAddress ||
          "Selected destination",

        dropoffLat: numberFrom(
          saved.dropoffLat,
          saved.dropoffLatitude,
          saved.destinationLat,
          saved.dropoff?.lat
        ),

        dropoffLng: numberFrom(
          saved.dropoffLng,
          saved.dropoffLongitude,
          saved.destinationLng,
          saved.dropoff?.lng,
          saved.dropoff?.lon
        ),

        distanceKm: numberFrom(
          saved.distanceKm,
          saved.distance,
          0
        ),

        estimatedFare,
        minimumFare,
        maximumFare,
      };

      const requiredNumbers = [
        normalized.pickupLat,
        normalized.pickupLng,
        normalized.dropoffLat,
        normalized.dropoffLng,
        normalized.estimatedFare,
      ];

      if (
        requiredNumbers.some(
          (value) =>
            !Number.isFinite(value)
        ) ||
        normalized.estimatedFare <= 0
      ) {
        throw new Error(
          "Route or fare information is incomplete."
        );
      }

      const validCurrentFare =
        Number.isFinite(
          currentFare
        )
          ? currentFare
          : estimatedFare;

      const safeCurrentFare =
        Math.min(
          maximumFare,
          Math.max(
            minimumFare,
            validCurrentFare
          )
        );

      const savedPaymentMethod =
        saved.paymentMethod ||
        sessionStorage.getItem(
          "paymentMethod"
        );

      setRide(normalized);
      setFare(safeCurrentFare);

      setPaymentMethod(
        savedPaymentMethod ===
          "DIGITAL_TRANSFER"
          ? "DIGITAL_TRANSFER"
          : "CASH"
      );
    } catch (loadError) {
      setError(
        loadError.message ||
          "Please select your route again."
      );
    }
  }, [
    adjustingFare,
    adjustmentRequestId,
  ]);

  const changeFare = (amount) => {
    if (!ride) {
      return;
    }

    setFare((current) =>
      Math.min(
        ride.maximumFare,
        Math.max(
          ride.minimumFare,
          Number(current) +
            amount
        )
      )
    );
  };

  const handleBack = () => {
    if (adjustingFare) {
      navigate(
        "/searching-ride"
      );
      return;
    }

    navigate(
      "/passenger-dashboard"
    );
  };

  const handleSearch = async () => {
    setError("");

    const passengerId = Number(
      sessionStorage.getItem(
        "passengerId"
      )
    );

    if (!ride) {
      setError(
        "Ride information was not found."
      );
      return;
    }

    if (
      !Number.isInteger(
        passengerId
      ) ||
      passengerId <= 0
    ) {
      setError(
        "Please log in again."
      );
      return;
    }

    try {
      setSearching(true);

      let response;

      if (adjustingFare) {
        const requestId =
          adjustmentRequestId ||
          ride.requestId ||
          sessionStorage.getItem(
            "rideRequestId"
          );

        if (!requestId) {
          throw new Error(
            "Ride request ID was not found."
          );
        }

        response = await fetch(
          `${BACKEND_URL}/ride-requests/${requestId}/fare`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              passengerId,
              passengerFare:
                Number(fare),
            }),
          }
        );
      } else {
        const body = {
          passengerId,

          pickupLatitude:
            ride.pickupLat,

          pickupLongitude:
            ride.pickupLng,

          pickupAddress:
            ride.pickupName,

          dropoffLatitude:
            ride.dropoffLat,

          dropoffLongitude:
            ride.dropoffLng,

          dropoffAddress:
            ride.dropoffName,

          distanceKm:
            ride.distanceKm,

          estimatedFare:
            ride.estimatedFare,

          estimatedDurationMinutes:
            Math.max(
              1,
              Math.round(
                Number(
                  ride.estimatedMinutes
                ) || 1
              )
            ),

          requestedFare:
            Number(fare),

          passengerFare:
            Number(fare),

          paymentMethod,
        };

        response = await fetch(
          `${BACKEND_URL}/ride-requests`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              body
            ),
          }
        );
      }

      const data =
        await readResponse(
          response
        );

      if (!data?.requestId) {
        throw new Error(
          "Ride request ID was not returned."
        );
      }

      const finalEstimatedFare =
        Number(
          data.estimatedFare ??
            ride.estimatedFare
        );

      const savedRide = {
        ...ride,
        ...data,

        pickupName:
          data.pickupAddress ||
          ride.pickupName,

        pickupLat:
          data.pickupLatitude ??
          ride.pickupLat,

        pickupLng:
          data.pickupLongitude ??
          ride.pickupLng,

        dropoffName:
          data.dropoffAddress ||
          ride.dropoffName,

        dropoffLat:
          data.dropoffLatitude ??
          ride.dropoffLat,

        dropoffLng:
          data.dropoffLongitude ??
          ride.dropoffLng,

        estimatedFare:
          finalEstimatedFare,

        passengerFare:
          Number(fare),

        requestedFare:
          Number(fare),

        paymentMethod:
          data.paymentMethod ||
          paymentMethod,

        minimumFare:
          finalEstimatedFare *
          MINIMUM_FARE_FACTOR,

        maximumFare:
          finalEstimatedFare *
          MAXIMUM_FARE_FACTOR,
      };

      sessionStorage.setItem(
        "activeRideRequest",
        JSON.stringify(
          savedRide
        )
      );

      sessionStorage.setItem(
        "passengerRideDraft",
        JSON.stringify(
          savedRide
        )
      );

      sessionStorage.setItem(
        "rideRequestId",
        String(
          data.requestId
        )
      );

      sessionStorage.setItem(
        "rideStatus",
        data.status ||
          "SEARCHING"
      );

      sessionStorage.setItem(
        "paymentMethod",
        data.paymentMethod ||
          paymentMethod
      );

      if (!adjustingFare) {
        sessionStorage.setItem(
          "searchStartedAt",
          data.createdAt ||
            new Date()
              .toISOString()
        );

        sessionStorage.removeItem(
          "rideId"
        );
      }

      navigate(
        "/searching-ride",
        {
          replace: true,
        }
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          (adjustingFare
            ? "Unable to update your fare."
            : "Unable to create your ride request.")
      );
    } finally {
      setSearching(false);
    }
  };

  const paymentLabel =
    paymentMethod ===
    "DIGITAL_TRANSFER"
      ? "DIGITAL TRANSFER"
      : "CASH";

  if (!ride) {
    return (
      <div className="passenger-fare-page">
        <div className="fare-card">
          <h1>
            {adjustingFare
              ? "Increase Your Fare"
              : "Choose Your Fare"}
          </h1>

          <p className="fare-error">
            {error || "Loading..."}
          </p>

          <button
            className="fare-back-button"
            onClick={handleBack}
          >
            {adjustingFare
              ? "Back to Search"
              : "Back to Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="passenger-fare-page">
      <div className="fare-card">
        <button
          type="button"
          className="fare-back-arrow"
          onClick={handleBack}
          disabled={searching}
          aria-label={
            adjustingFare
              ? "Back to ride search"
              : "Back to passenger dashboard"
          }
        >
          ←
        </button>

        <h1>
          {adjustingFare
            ? "Increase Your Fare"
            : "Choose Your Fare"}
        </h1>

        {adjustingFare && (
          <p className="fare-adjustment-message">
            Higher fares may improve your
            chance of receiving a driver
            offer.
          </p>
        )}

        <div className="fare-route-section">
          <div className="fare-location">
            <span className="fare-location-dot pickup-dot" />

            <div>
              <span className="fare-location-label">
                Pickup
              </span>

              <p>
                {ride.pickupName}
              </p>
            </div>
          </div>

          <div className="fare-location">
            <span className="fare-location-dot destination-dot" />

            <div>
              <span className="fare-location-label">
                Destination
              </span>

              <p>
                {ride.dropoffName}
              </p>
            </div>
          </div>
        </div>

        <p className="fare-distance">
          Distance:{" "}
          {ride.distanceKm.toFixed(
            2
          )}{" "}
          km
        </p>

        <div className="fare-selector">
          <button
            type="button"
            onClick={() =>
              changeFare(-5)
            }
            disabled={
              searching ||
              fare <=
                ride.minimumFare
            }
          >
            −
          </button>

          <div className="selected-fare">
            <span>PKR</span>

            <strong>
              {fare.toFixed(0)}
            </strong>
          </div>

          <button
            type="button"
            onClick={() =>
              changeFare(5)
            }
            disabled={
              searching ||
              fare >=
                ride.maximumFare
            }
          >
            +
          </button>
        </div>

        <p className="fare-range">
          Allowed: PKR{" "}
          {ride.minimumFare.toFixed(
            0
          )}
          {" – "}
          PKR{" "}
          {ride.maximumFare.toFixed(
            0
          )}
        </p>

        <p className="fare-limit-note">
          You can reduce the estimated fare
          by up to 10% or increase it up to
          200%.
        </p>

        <section className="payment-section">
          <h2>
            Preferred Payment Method
          </h2>

          <p className="payment-description">
            {adjustingFare
              ? "Your existing payment preference will remain unchanged."
              : "This only tells the driver how you plan to pay. Velocity does not process the ride payment."}
          </p>

          <div className="payment-options">
            <button
              type="button"
              className={
                paymentMethod ===
                "CASH"
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setPaymentMethod(
                  "CASH"
                )
              }
              disabled={
                searching ||
                adjustingFare
              }
            >
              <strong>
                Cash
              </strong>

              <span>
                Pay the driver directly
                in cash
              </span>
            </button>

            <button
              type="button"
              className={
                paymentMethod ===
                "DIGITAL_TRANSFER"
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setPaymentMethod(
                  "DIGITAL_TRANSFER"
                )
              }
              disabled={
                searching ||
                adjustingFare
              }
            >
              <strong>
                Digital Transfer
              </strong>

              <span>
                Transfer payment directly
                to the driver
              </span>
            </button>
          </div>
        </section>

        {error && (
          <p className="fare-error">
            {error}
          </p>
        )}

        <button
          className="search-ride-button"
          onClick={handleSearch}
          disabled={searching}
        >
          {searching
            ? adjustingFare
              ? "Updating Fare..."
              : "Searching..."
            : adjustingFare
              ? `Update Fare · ${paymentLabel}`
              : `Search Ride · ${paymentLabel}`}
        </button>
      </div>
    </div>
  );
}

export default PassengerFare;