import { apiBaseUrl } from "../config/api.js";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Banknote,
  CarFront,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  CreditCard,
  MapPin,
  Navigation,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import "./PassengerActiveRide.css";

const API = apiBaseUrl;
const POLL_MS = 3000;

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

function readStoredRide() {
  const keys = [
    "activePassengerRide",
    "acceptedRide",
    "activeRideRequest",
  ];

  for (const key of keys) {
    const value =
      sessionStorage.getItem(key);

    if (!value) {
      continue;
    }

    try {
      return JSON.parse(value);
    } catch {
      // Try the next stored ride value.
    }
  }

  return null;
}

function formatFare(value) {
  const fare = Number(value);

  if (!Number.isFinite(fare)) {
    return "0";
  }

  return fare.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatPaymentMethod(value) {
  return value === "DIGITAL_TRANSFER"
    ? "Digital Transfer"
    : "Cash";
}

function formatStatus(value) {
  return String(value || "ACCEPTED")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function clearActiveRideStorage() {
  [
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
  ].forEach((key) => {
    sessionStorage.removeItem(key);
  });
}

function PassengerActiveRide() {
  const navigate = useNavigate();

  const passengerId = Number(
    sessionStorage.getItem(
      "passengerId"
    )
  );

  const [ride, setRide] = useState(
    () => readStoredRide()
  );

  const rideRef = useRef(ride);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const validPassenger =
    Number.isInteger(passengerId) &&
    passengerId > 0;

  useEffect(() => {
    rideRef.current = ride;
  }, [ride]);

  useEffect(() => {
    if (!validPassenger) {
      setError(
        "Passenger login information was not found."
      );

      setLoading(false);
      return undefined;
    }

    let stopped = false;

    const loadLatestRide = async () => {
      try {
        const response = await fetch(
          `${API}/passenger-rides/${passengerId}/latest`,
          {
            cache: "no-store",
          }
        );

        const data =
          await readResponse(response);

        if (stopped) {
          return;
        }

        /*
         * Use found instead of active.
         *
         * active becomes false when the ride is
         * COMPLETED or CANCELLED, but the passenger
         * screen still needs those status updates.
         */
        if (
          data?.found &&
          data?.rideId
        ) {
          setRide((currentRide) => {
            const updatedRide = {
              ...currentRide,
              ...data,
            };

            rideRef.current =
              updatedRide;

            sessionStorage.setItem(
              "activePassengerRide",
              JSON.stringify(
                updatedRide
              )
            );

            sessionStorage.setItem(
              "rideId",
              String(data.rideId)
            );

            sessionStorage.setItem(
              "rideStatus",
              data.status ||
                "ACCEPTED"
            );

            if (data.paymentMethod) {
              sessionStorage.setItem(
                "paymentMethod",
                data.paymentMethod
              );
            }

            /*
             * PassengerRideResponse currently does
             * not return the PIN, so preserve the
             * PIN stored when the offer was accepted.
             */
            if (data.ridePin) {
              sessionStorage.setItem(
                "ridePin",
                String(data.ridePin)
              );
            }

            return updatedRide;
          });

          setError("");
        } else if (!rideRef.current) {
          setError(
            "No ride was found for this passenger."
          );
        }
      } catch (loadError) {
        console.error(
          "Passenger ride refresh error:",
          loadError
        );

        if (!rideRef.current) {
          setError(
            loadError.message ||
              "Unable to load the ride."
          );
        }
      } finally {
        if (!stopped) {
          setLoading(false);
        }
      }
    };

    loadLatestRide();

    const intervalId =
      window.setInterval(
        loadLatestRide,
        POLL_MS
      );

    return () => {
      stopped = true;

      window.clearInterval(
        intervalId
      );
    };
  }, [
    passengerId,
    validPassenger,
  ]);

  const openMap = (
    latitude,
    longitude
  ) => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      setError(
        "Location coordinates are unavailable."
      );
      return;
    }

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleCancelRide =
    () => {
      setError("");

      if (!ride?.rideId) {
        setError(
          "Ride ID was not found."
        );
        return;
      }

      const cancellationContext = {
        kind: "PASSENGER_RIDE",
        ride,
      };

      sessionStorage.setItem(
        "velocityCancellationContext",
        JSON.stringify(cancellationContext)
      );

      navigate(
        "/passenger-cancel-ride",
        {
          state: cancellationContext,
        }
      );
    };

  const handleCompletedRide = () => {
    const completedRideId =
      ride?.rideId;

    clearActiveRideStorage();

    navigate(
      "/ride-feedback",
      {
        replace: true,
        state: {
          rideId:
            completedRideId,
          role: "PASSENGER",
        },
      }
    );
  };

  if (
    loading &&
    !ride
  ) {
    return (
      <div className="passenger-active-page">
        <main className="passenger-active-card">
          <Clock3
            className="passenger-active-loading-icon"
            size={44}
          />

          <h1>
            Loading Ride Details
          </h1>

          <p>
            We are retrieving your driver
            and trip information.
          </p>
        </main>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="passenger-active-page">
        <main className="passenger-active-card">
          <XCircle
            className="passenger-active-error-icon"
            size={48}
          />

          <h1>
            Ride Not Found
          </h1>

          <p>
            {error ||
              "No ride was found for this passenger."}
          </p>

          <button
            type="button"
            className="passenger-active-primary"
            onClick={() =>
              navigate(
                "/passenger-dashboard",
                {
                  replace: true,
                }
              )
            }
          >
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  const status = String(
    ride.status ||
      ride.rideStatus ||
      sessionStorage.getItem(
        "rideStatus"
      ) ||
      "ACCEPTED"
  ).toUpperCase();

  const completed =
    status === "COMPLETED";

  const cancelled =
    status === "CANCELLED";

  const inProgress =
    status === "IN_PROGRESS";

  const accepted =
    status === "ACCEPTED";

  const acceptedFare =
    ride.finalFare ??
    ride.acceptedFare ??
    ride.offeredFare ??
    ride.passengerFare ??
    ride.requestedFare ??
    0;

  const ridePin =
    ride.ridePin ||
    sessionStorage.getItem(
      "ridePin"
    ) ||
    "----";

  const pickupName =
    ride.pickupName ||
    ride.pickupAddress ||
    "Pickup unavailable";

  const dropoffName =
    ride.dropoffName ||
    ride.dropoffAddress ||
    "Destination unavailable";

  const driverName =
    ride.driverName ||
    ride.driver?.fullName ||
    (ride.driverId
      ? `Driver #${ride.driverId}`
      : "Driver details unavailable");

  const vehicleDescription =
    ride.vehicleDescription ||
    [
      ride.vehicleMake,
      ride.vehicleModel,
    ]
      .filter(Boolean)
      .join(" ") ||
    ride.vehicle?.description ||
    ride.vehicle?.model ||
    "Vehicle details unavailable";

  const plateNumber =
    ride.plateNumber ||
    ride.vehicle?.plateNumber ||
    "Unavailable";

  const paymentMethod =
    ride.paymentMethod ||
    sessionStorage.getItem(
      "paymentMethod"
    ) ||
    "CASH";

  return (
    <div className="passenger-active-page">
      <main className="passenger-active-card">
        <header className="passenger-active-header">
          <div className="passenger-active-success-icon">
            {completed ? (
              <CheckCircle2 size={36} />
            ) : inProgress ? (
              <Navigation size={36} />
            ) : cancelled ? (
              <XCircle size={36} />
            ) : (
              <ShieldCheck size={36} />
            )}
          </div>

          <div>
            <p>
              Current ride
            </p>

            <h1>
              {completed
                ? "Ride Completed"
                : cancelled
                  ? "Ride Cancelled"
                  : inProgress
                    ? "Ride in Progress"
                    : "Driver Confirmed"}
            </h1>
          </div>

          <span
            className={`passenger-active-status status-${status.toLowerCase()}`}
          >
            {formatStatus(status)}
          </span>
        </header>

        <section className="passenger-driver-card">
          <div className="passenger-driver-avatar">
            <CircleUserRound
              size={34}
            />
          </div>

          <div className="passenger-driver-information">
            <span>
              Your driver
            </span>

            <h2>
              {driverName}
            </h2>

            <p>
              Driver ID:{" "}
              {ride.driverId || "—"}
            </p>
          </div>
        </section>

        <section className="passenger-vehicle-card">
          <div>
            <CarFront size={24} />

            <span>
              Vehicle
            </span>

            <strong>
              {vehicleDescription}
            </strong>
          </div>

          <div>
            <span>
              Plate number
            </span>

            <strong>
              {plateNumber}
            </strong>
          </div>
        </section>

        <section className="passenger-active-route">
          <div className="passenger-active-route-row">
            <span className="passenger-active-dot pickup" />

            <div>
              <span>
                Pickup
              </span>

              <strong>
                {pickupName}
              </strong>
            </div>
          </div>

          <div className="passenger-active-route-line" />

          <div className="passenger-active-route-row">
            <span className="passenger-active-dot destination" />

            <div>
              <span>
                Destination
              </span>

              <strong>
                {dropoffName}
              </strong>
            </div>
          </div>
        </section>

        <section className="passenger-active-details">
          <div>
            <span>
              Accepted Fare
            </span>

            <strong>
              PKR{" "}
              {formatFare(
                acceptedFare
              )}
            </strong>
          </div>

          <div>
            <span>
              Payment
            </span>

            <strong className="payment-detail">
              {paymentMethod ===
              "DIGITAL_TRANSFER" ? (
                <CreditCard size={18} />
              ) : (
                <Banknote size={18} />
              )}

              {formatPaymentMethod(
                paymentMethod
              )}
            </strong>
          </div>
        </section>

        {accepted && (
          <section className="passenger-pin-card">
            <div>
              <ShieldCheck
                size={24}
              />

              <div>
                <span>
                  Your Ride PIN
                </span>

                <p>
                  Tell this PIN to the
                  driver only after the
                  driver arrives.
                </p>
              </div>
            </div>

            <strong>
              {ridePin}
            </strong>
          </section>
        )}

        {accepted && (
          <button
            type="button"
            className="passenger-map-button"
            onClick={() =>
              openMap(
                ride.pickupLat ??
                  ride.pickupLatitude,
                ride.pickupLng ??
                  ride.pickupLongitude
              )
            }
          >
            <MapPin size={19} />
            View Pickup Location
          </button>
        )}

        {inProgress && (
          <button
            type="button"
            className="passenger-map-button"
            onClick={() =>
              openMap(
                ride.dropoffLat ??
                  ride.dropoffLatitude,
                ride.dropoffLng ??
                  ride.dropoffLongitude
              )
            }
          >
            <Navigation size={19} />
            View Destination
          </button>
        )}

        {completed && (
          <button
            type="button"
            className="passenger-active-primary"
            onClick={
              handleCompletedRide
            }
          >
            <CheckCircle2 size={19} />
            Continue to Feedback
          </button>
        )}

        {accepted && (
          <button
            type="button"
            className="passenger-cancel-ride-button"
            onClick={
              handleCancelRide
            }
          >
            <XCircle size={19} />
            Cancel Ride
          </button>
        )}

        {cancelled && (
          <button
            type="button"
            className="passenger-active-primary"
            onClick={() => {
              clearActiveRideStorage();

              navigate(
                "/passenger-dashboard",
                {
                  replace: true,
                }
              );
            }}
          >
            Back to Dashboard
          </button>
        )}

        {error && (
          <p className="passenger-active-error">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}

export default PassengerActiveRide;