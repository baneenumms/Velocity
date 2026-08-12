import { apiBaseUrl } from "../config/api.js";
import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  AlertCircle,
  CheckCircle2,
  Flag,
  MapPinned,
  Navigation,
  Play,
  RotateCcw,
} from "lucide-react";

import "./DriverActiveRide.css";

const API =
  apiBaseUrl;

async function getData(response) {
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
    const requestError =
      new Error(
        data?.message ||
          data?.details ||
          data?.error ||
          text ||
          `Request failed: HTTP ${response.status}`
      );

    requestError.status =
      response.status;

    throw requestError;
  }

  return data;
}

function getPinErrorMessage(error) {
  const message =
    error?.message || "";

  const normalized =
    message.toLowerCase();

  const incorrectPin =
    error?.status === 400 ||
    error?.status === 401 ||
    error?.status === 403 ||
    error?.status === 422 ||
    normalized.includes(
      "incorrect pin"
    ) ||
    normalized.includes(
      "invalid pin"
    ) ||
    normalized.includes(
      "ride pin"
    ) ||
    normalized.includes(
      "pin does not match"
    );

  if (incorrectPin) {
    return (
      "Incorrect ride PIN. Ask the " +
      "passenger to check the PIN and try again."
    );
  }

  if (
    normalized.includes(
      "failed to fetch"
    ) ||
    normalized.includes(
      "network"
    ) ||
    normalized.includes(
      "connection"
    )
  ) {
    return (
      "Unable to verify the ride PIN. " +
      "Please check your connection and try again."
    );
  }

  return (
    message ||
    "Unable to verify the ride PIN. Please try again."
  );
}

function DriverActiveRide() {
  const navigate = useNavigate();

  const driverId = Number(
    sessionStorage.getItem(
      "driverId"
    ) ||
      localStorage.getItem(
        "driverId"
      )
  );

  const [ride, setRide] =
    useState(() => {
      try {
        const saved =
          sessionStorage.getItem(
            "activeDriverRide"
          );

        return saved
          ? JSON.parse(saved)
          : null;
      } catch {
        return null;
      }
    });

  const [arrived, setArrived] =
    useState(false);

  const [pin, setPin] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [pinError, setPinError] =
    useState("");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, []);

  useEffect(() => {
    if (
      !Number.isInteger(
        driverId
      ) ||
      driverId <= 0 ||
      busy
    ) {
      return undefined;
    }

    let stopped = false;

    const loadRide = async () => {
      try {
        const response =
          await fetch(
            `${API}/driver-rides/${driverId}/active`
          );

        const data =
          await getData(response);

        if (stopped) {
          return;
        }

        if (
          !data?.active ||
          !data?.rideId
        ) {
          sessionStorage.removeItem(
            "activeDriverRide"
          );

          sessionStorage.removeItem(
            "rideId"
          );

          sessionStorage.removeItem(
            "rideStatus"
          );

          navigate(
            "/driver-dashboard",
            {
              replace: true,
            }
          );

          return;
        }

        setRide(data);

        sessionStorage.setItem(
          "activeDriverRide",
          JSON.stringify(data)
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

        setError("");
      } catch (rideError) {
        if (!stopped) {
          setError(
            rideError.message ||
              "Unable to load the active ride."
          );
        }
      }
    };

    loadRide();

    const timer =
      window.setInterval(
        loadRide,
        3000
      );

    return () => {
      stopped = true;

      window.clearInterval(
        timer
      );
    };
  }, [
    driverId,
    navigate,
    busy,
  ]);

  const openMap = (
    latitude,
    longitude
  ) => {
    const lat =
      Number(latitude);

    const lng =
      Number(longitude);

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

  const showPinSection = () => {
    setError("");
    setPinError("");
    setArrived(true);

    window.setTimeout(() => {
      document
        .getElementById(
          "driver-ride-pin"
        )
        ?.focus();
    }, 0);
  };

  const handlePinChange = (
    event
  ) => {
    const nextPin =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 4);

    setPin(nextPin);

    if (pinError) {
      setPinError("");
    }
  };

  const startRide = async () => {
    setError("");
    setPinError("");

    if (!/^\d{4}$/.test(pin)) {
      setPinError(
        "Enter the complete 4-digit ride PIN."
      );

      return;
    }

    if (!ride?.rideId) {
      setPinError(
        "Ride information could not be found. Refresh and try again."
      );

      return;
    }

    try {
      setBusy(true);

      const response =
        await fetch(
          `${API}/rides/${ride.rideId}/start`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              driverId,
              ridePin: pin,
            }),
          }
        );

      const data =
        await getData(response);

      const updatedRide = {
        ...ride,
        ...data,
        status:
          data.status ||
          "IN_PROGRESS",
      };

      setRide(updatedRide);

      sessionStorage.setItem(
        "activeDriverRide",
        JSON.stringify(
          updatedRide
        )
      );

      sessionStorage.setItem(
        "rideStatus",
        updatedRide.status
      );

      setArrived(false);
      setPin("");
      setPinError("");
      setError("");

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    } catch (startError) {
      setPinError(
        getPinErrorMessage(
          startError
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const completeRide =
    async () => {
      setError("");

      if (!ride?.rideId) {
        setError(
          "Ride ID was not found."
        );

        return;
      }

      try {
        setBusy(true);

        const completedRideId =
          ride.rideId;

        const response =
          await fetch(
            `${API}/rides/${completedRideId}/complete`,
            {
              method: "POST",
            }
          );

        await getData(response);

        sessionStorage.setItem(
          "lastCompletedRideId",
          String(
            completedRideId
          )
        );

        sessionStorage.setItem(
          "lastCompletedRide",
          JSON.stringify({
            ...ride,
            status: "COMPLETED",
          })
        );

        sessionStorage.removeItem(
          "activeDriverRide"
        );

        sessionStorage.removeItem(
          "rideId"
        );

        sessionStorage.removeItem(
          "rideStatus"
        );

        navigate(
          "/driver-feedback",
          {
            replace: true,
            state: {
              rideId:
                completedRideId,
            },
          }
        );
      } catch (completeError) {
        setError(
          completeError.message ||
            "Unable to complete the ride."
        );
      } finally {
        setBusy(false);
      }
    };

  if (!ride) {
    return (
      <div className="driver-active-page">
        <div className="driver-active-card">
          <p className="driver-active-loading">
            {error ||
              "Loading ride..."}
          </p>
        </div>
      </div>
    );
  }

  const inProgress =
    ride.status ===
    "IN_PROGRESS";

  const payment =
    ride.paymentMethod ===
    "DIGITAL_TRANSFER"
      ? "Digital Transfer"
      : "Cash";

  const fare = Number(
    ride.finalFare ??
      ride.acceptedFare ??
      ride.passengerFare ??
      0
  );

  return (
    <div className="driver-active-page">
      <main className="driver-active-card">
        <div
          className={
            `driver-active-success ${
              inProgress
                ? "in-progress"
                : ""
            }`
          }
        >
          {inProgress ? (
            <Navigation size={34} />
          ) : (
            <CheckCircle2
              size={34}
            />
          )}
        </div>

        <h1>
          {inProgress
            ? "Ride in Progress"
            : "Offer Accepted"}
        </h1>

        <p className="driver-active-subtitle">
          {inProgress
            ? "Follow the destination route and complete the ride when the passenger arrives safely."
            : "Travel to the pickup location and verify the passenger's ride PIN before starting."}
        </p>

        <div
          className={
            `driver-active-status ${
              inProgress
                ? "in-progress"
                : ""
            }`
          }
        >
          <span>Status</span>

          <strong>
            {ride.status}
          </strong>
        </div>

        <section className="driver-active-route">
          <div className="driver-active-route-row">
            <span className="driver-active-dot pickup" />

            <div>
              <span>Pickup</span>

              <strong>
                {ride.pickupName ||
                  ride.pickupAddress ||
                  "Pickup unavailable"}
              </strong>
            </div>
          </div>

          <div className="driver-active-route-line" />

          <div className="driver-active-route-row">
            <span className="driver-active-dot destination" />

            <div>
              <span>
                Destination
              </span>

              <strong>
                {ride.dropoffName ||
                  ride.dropoffAddress ||
                  "Destination unavailable"}
              </strong>
            </div>
          </div>
        </section>

        <section className="driver-active-details">
          <div>
            <span>Fare</span>

            <strong>
              PKR{" "}
              {Number.isFinite(fare)
                ? fare.toFixed(0)
                : "0"}
            </strong>
          </div>

          <div>
            <span>Payment</span>
            <strong>{payment}</strong>
          </div>

          <div>
            <span>Vehicle</span>

            <strong>
              {ride.vehicleDescription ||
                "Vehicle"}
            </strong>
          </div>

          <div>
            <span>Plate</span>

            <strong>
              {ride.plateNumber ||
                "Unavailable"}
            </strong>
          </div>
        </section>

        {!inProgress && (
          <>
            <button
              type="button"
              className="driver-active-primary"
              onClick={() =>
                openMap(
                  ride.pickupLat,
                  ride.pickupLng
                )
              }
            >
              <MapPinned size={19} />
              Open Pickup Map
            </button>

            {!arrived ? (
              <button
                type="button"
                className="driver-arrived-button"
                onClick={
                  showPinSection
                }
              >
                <CheckCircle2
                  size={19}
                />
                I Have Arrived
              </button>
            ) : (
              <section className="driver-pin-section">
                <div className="driver-pin-heading">
                  <span>
                    Passenger Verification
                  </span>

                  <h2>
                    Enter Ride PIN
                  </h2>

                  <p>
                    Ask the passenger
                    for their four-digit
                    ride PIN.
                  </p>
                </div>

                <input
                  id="driver-ride-pin"
                  className={
                    `driver-pin-input ${
                      pinError
                        ? "invalid"
                        : ""
                    }`
                  }
                  value={pin}
                  maxLength={4}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="0000"
                  aria-invalid={
                    Boolean(
                      pinError
                    )
                  }
                  aria-describedby={
                    pinError
                      ? "driver-pin-error"
                      : undefined
                  }
                  onChange={
                    handlePinChange
                  }
                />

                {pinError && (
                  <p
                    id="driver-pin-error"
                    className="driver-pin-error"
                    role="alert"
                    aria-live="assertive"
                  >
                    <AlertCircle
                      size={18}
                    />

                    <span>
                      {pinError}
                    </span>
                  </p>
                )}

                <button
                  type="button"
                  className="driver-start-ride-button"
                  onClick={startRide}
                  disabled={busy}
                >
                  <Play size={18} />

                  {busy
                    ? "Verifying PIN..."
                    : "Start Ride"}
                </button>

                <button
                  type="button"
                  className="driver-not-arrived-button"
                  onClick={() => {
                    setArrived(false);
                    setPin("");
                    setPinError("");
                  }}
                  disabled={busy}
                >
                  <RotateCcw
                    size={18}
                  />
                  Go Back
                </button>
              </section>
            )}
          </>
        )}

        {inProgress && (
          <>
            <button
              type="button"
              className="driver-active-primary"
              onClick={() =>
                openMap(
                  ride.dropoffLat,
                  ride.dropoffLng
                )
              }
            >
              <MapPinned size={19} />
              Open Destination Map
            </button>

            <button
              type="button"
              className="driver-complete-ride-button"
              onClick={
                completeRide
              }
              disabled={busy}
            >
              <Flag size={18} />

              {busy
                ? "Completing..."
                : "Complete Ride"}
            </button>
          </>
        )}

        {error && (
          <p
            className="driver-active-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </main>
    </div>
  );
}

export default DriverActiveRide;