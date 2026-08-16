import { apiBaseUrl } from "../config/api.js";
import {
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CircleDollarSign,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import "./CancellationConfirmation.css";

const API = apiBaseUrl;
const CONTEXT_KEY = "velocityCancellationContext";
const NOTICE_KEY = "velocityDashboardNotice";

const PASSENGER_RIDE_KEYS = [
  "activePassengerRide",
  "acceptedRide",
  "activeRideRequest",
  "passengerRideDraft",
  "ridePin",
  "rideRequestId",
  "rideId",
  "rideStatus",
  "paymentMethod",
  "searchStartedAt",
];

const DRIVER_RIDE_KEYS = [
  "activeDriverRide",
  "rideId",
  "rideStatus",
];

async function readResponse(response) {
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.details ||
        text ||
        `Cancellation failed: HTTP ${response.status}`
    );
  }

  return data;
}

function readSavedContext(kind) {
  const rawContext = sessionStorage.getItem(CONTEXT_KEY);

  if (!rawContext) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawContext);

    return parsed?.kind === kind ? parsed : null;
  } catch {
    sessionStorage.removeItem(CONTEXT_KEY);
    return null;
  }
}

function formatMoney(value) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? amount.toLocaleString("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
}

function clearKeys(keys) {
  keys.forEach((key) => sessionStorage.removeItem(key));
}

function CancellationConfirmation({ kind }) {
  const location = useLocation();
  const navigate = useNavigate();

  const context = useMemo(
    () => location.state || readSavedContext(kind) || {},
    [kind, location.state]
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isPassenger = kind.startsWith("PASSENGER_");
  const dashboard = isPassenger
    ? "/passenger-dashboard"
    : "/driver-dashboard";

  const keepDestination = {
    DRIVER_OFFER: "/driver-dashboard",
    DRIVER_RIDE: "/driver-active-ride",
    PASSENGER_SEARCH: "/searching-ride",
    PASSENGER_RIDE: "/passenger-active-ride",
  }[kind];

  const ride = context.ride || {};
  const request = context.request || {};
  const offer = context.offer || {};

  const fare = Number(
    offer.offeredFare ??
      ride.finalFare ??
      ride.acceptedFare ??
      ride.passengerFare ??
      request.passengerFare ??
      request.requestedFare ??
      0
  );

  const reservation = fare * 0.12;
  const cancellationFee = fare * 0.05;

  const pickup =
    request.pickupAddress ||
    request.pickupName ||
    ride.pickupAddress ||
    ride.pickupName ||
    context.pickup ||
    "Pickup location unavailable";

  const destination =
    request.dropoffAddress ||
    request.dropoffName ||
    ride.dropoffAddress ||
    ride.dropoffName ||
    context.destination ||
    "Destination unavailable";

  const copy = {
    DRIVER_OFFER: {
      eyebrow: "Pending driver offer",
      title: "Cancel this offer?",
      description:
        "The passenger will no longer be able to accept your offer.",
      assurance:
        "No cancellation fee applies because the passenger has not accepted this offer.",
      keep: "Keep Offer",
      confirm: "Cancel Offer",
      notice: "Your pending offer was cancelled. No fee was charged.",
    },
    DRIVER_RIDE: {
      eyebrow: "Accepted driver ride",
      title: "Cancel this accepted ride?",
      description:
        "The passenger will be notified and the ride will return to a cancelled state.",
      assurance:
        "Velocity will release the 12% reservation and deduct 5% of the agreed fare from your wallet.",
      keep: "Keep Ride",
      confirm: "Confirm Cancellation",
      notice:
        "The accepted ride was cancelled. The reservation was released and the 5% cancellation fee was applied.",
    },
    PASSENGER_SEARCH: {
      eyebrow: "Active ride search",
      title: "Cancel your ride search?",
      description:
        "Nearby drivers will no longer be able to view or respond to this request.",
      assurance:
        "Any pending driver offers will close with the request. No ride has started.",
      keep: "Keep Searching",
      confirm: "Cancel Request",
      notice: "Your ride search was cancelled.",
    },
    PASSENGER_RIDE: {
      eyebrow: "Accepted passenger ride",
      title: "Cancel this accepted ride?",
      description:
        "Your driver will be notified and the accepted ride will be cancelled before it starts.",
      assurance:
        "The driver's reserved platform fee will be released. No driver cancellation fee is charged.",
      keep: "Keep Ride",
      confirm: "Confirm Cancellation",
      notice: "Your accepted ride was cancelled.",
    },
  }[kind];

  const identifiersValid =
    kind === "DRIVER_OFFER"
      ? Boolean(offer.offerId)
      : kind === "PASSENGER_SEARCH"
        ? Boolean(context.requestId || request.requestId) &&
          Number(context.passengerId) > 0
        : Boolean(ride.rideId);

  const keepCurrent = () => {
    sessionStorage.removeItem(CONTEXT_KEY);
    navigate(keepDestination, {
      replace: true,
    });
  };

  const confirmCancellation = async () => {
    setError("");

    if (!identifiersValid) {
      setError(
        "The cancellation details are no longer available. Return to the dashboard and try again."
      );
      return;
    }

    try {
      setSubmitting(true);

      if (kind === "DRIVER_OFFER") {
        await readResponse(
          await fetch(
            `${API}/driver-offers/${offer.offerId}/cancel`,
            { method: "POST" }
          )
        );
      } else if (kind === "DRIVER_RIDE") {
        const reason = encodeURIComponent(
          "Driver cancelled before ride start"
        );

        await readResponse(
          await fetch(
            `${API}/rides/${ride.rideId}/cancel?reason=${reason}`,
            { method: "POST" }
          )
        );

        clearKeys(DRIVER_RIDE_KEYS);
      } else if (kind === "PASSENGER_SEARCH") {
        const requestId = context.requestId || request.requestId;

        await readResponse(
          await fetch(
            `${API}/ride-requests/${requestId}/cancel?passengerId=${context.passengerId}`,
            { method: "POST" }
          )
        );

        clearKeys(PASSENGER_RIDE_KEYS);
      } else if (kind === "PASSENGER_RIDE") {
        const reason = encodeURIComponent(
          "Passenger cancelled the ride"
        );

        await readResponse(
          await fetch(
            `${API}/rides/${ride.rideId}/cancel?cancelledBy=PASSENGER&reason=${reason}`,
            { method: "POST" }
          )
        );

        clearKeys(PASSENGER_RIDE_KEYS);
      }

      sessionStorage.removeItem(CONTEXT_KEY);
      sessionStorage.setItem(
        NOTICE_KEY,
        JSON.stringify({
          mode: isPassenger ? "PASSENGER" : "DRIVER",
          message: copy.notice,
        })
      );

      navigate(dashboard, { replace: true });
    } catch (cancelError) {
      setError(
        cancelError.message ||
          "Unable to complete the cancellation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cancellation-page">
      <main className="cancellation-card">
        <button
          type="button"
          className="cancellation-back"
          onClick={keepCurrent}
          disabled={submitting}
        >
          <ArrowLeft size={18} />
          {copy.keep}
        </button>

        <div className="cancellation-icon">
          <XCircle size={38} />
        </div>

        <p className="cancellation-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="cancellation-description">{copy.description}</p>

        <section className="cancellation-route">
          <div>
            <MapPin size={18} />
            <span>Pickup</span>
            <strong>{pickup}</strong>
          </div>

          <div>
            <MapPin size={18} />
            <span>Destination</span>
            <strong>{destination}</strong>
          </div>
        </section>

        <section className="cancellation-fare">
          <CircleDollarSign size={21} />

          <div>
            <span>
              {kind === "DRIVER_OFFER"
                ? "Your offered fare"
                : "Agreed fare"}
            </span>
            <strong>PKR {formatMoney(fare)}</strong>
          </div>
        </section>

        {kind === "PASSENGER_RIDE" && (
          <section className="cancellation-driver-details">
            <div>
              <span>Driver</span>
              <strong>
                {ride.driverName ||
                  ride.driver?.fullName ||
                  "Driver details unavailable"}
              </strong>
            </div>

            <div>
              <span>Vehicle</span>
              <strong>
                {ride.vehicleDescription ||
                  ride.vehicle?.model ||
                  "Vehicle details unavailable"}
              </strong>
            </div>

            <div>
              <span>Plate number</span>
              <strong>
                {ride.plateNumber ||
                  ride.vehicle?.plateNumber ||
                  "Unavailable"}
              </strong>
            </div>
          </section>
        )}

        {kind === "DRIVER_RIDE" && (
          <section className="cancellation-calculation">
            <div>
              <span>12% reservation released</span>
              <strong>PKR {formatMoney(reservation)}</strong>
            </div>

            <div>
              <span>5% cancellation fee</span>
              <strong>PKR {formatMoney(cancellationFee)}</strong>
            </div>
          </section>
        )}

        <div className="cancellation-assurance">
          <ShieldCheck size={21} />
          <span>{copy.assurance}</span>
        </div>

        {error && (
          <p className="cancellation-error" role="alert">
            <AlertCircle size={19} />
            <span>{error}</span>
          </p>
        )}

        <div className="cancellation-actions">
          <button
            type="button"
            className="cancellation-keep"
            onClick={keepCurrent}
            disabled={submitting}
          >
            {copy.keep}
          </button>

          <button
            type="button"
            className="cancellation-confirm"
            onClick={confirmCancellation}
            disabled={submitting || !identifiersValid}
          >
            {submitting ? "Cancelling..." : copy.confirm}
          </button>
        </div>
      </main>
    </div>
  );
}

export default CancellationConfirmation;
