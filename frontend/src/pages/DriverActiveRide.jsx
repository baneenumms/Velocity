import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  CheckCircle2,
  Flag,
  MapPinned,
  Navigation,
  Play,
  RotateCcw,
} from "lucide-react";

import "./DriverActiveRide.css";

const API =
  "http://localhost:8080";

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
    throw new Error(
      data?.message ||
        data?.details ||
        text ||
        "Request failed"
    );
  }

  return data;
}

function DriverActiveRide() {
  const navigate = useNavigate();

  const driverId = Number(
    sessionStorage.getItem(
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

  useEffect(() => {
    if (
      !Number.isInteger(driverId) ||
      driverId <= 0 ||
      busy
    ) {
      return undefined;
    }

    let stopped = false;

    const loadRide = async () => {
      try {
        const data = await getData(
          await fetch(
            `${API}/driver-rides/${driverId}/active`
          )
        );

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

  const openMap = (lat, lng) => {
    if (
      !Number.isFinite(
        Number(lat)
      ) ||
      !Number.isFinite(
        Number(lng)
      )
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

  const startRide = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setError(
        "Enter the passenger's 4-digit PIN."
      );
      return;
    }

    try {
      setBusy(true);

      const data = await getData(
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
        )
      );

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
      setError("");
    } catch (startError) {
      setError(
        startError.message ||
          "Unable to start the ride."
      );
    } finally {
      setBusy(false);
    }
  };

  const completeRide = async () => {
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

      await getData(
        await fetch(
          `${API}/rides/${completedRideId}/complete`,
          {
            method: "POST",
          }
        )
      );

      sessionStorage.setItem(
        "lastCompletedRideId",
        String(completedRideId)
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
          <p>
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
      <div className="driver-active-card">
        <div className="driver-active-success">
          {inProgress ? (
            <Navigation size={34} />
          ) : (
            <CheckCircle2 size={34} />
          )}
        </div>

        <h1>
          {inProgress
            ? "Ride in Progress"
            : "Offer Accepted"}
        </h1>

        <div className="driver-active-status">
          <span>Status</span>
          <strong>
            {ride.status}
          </strong>
        </div>

        <div className="driver-active-route">
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
        </div>

        <div className="driver-active-details">
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
        </div>

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
                onClick={() =>
                  setArrived(true)
                }
              >
                <CheckCircle2
                  size={19}
                />
                I Have Arrived
              </button>
            ) : (
              <section className="driver-pin-section">
                <h2>
                  Enter Ride PIN
                </h2>

                <input
                  className="driver-pin-input"
                  value={pin}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="0000"
                  onChange={(
                    event
                  ) =>
                    setPin(
                      event.target
                        .value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(0, 4)
                    )
                  }
                />

                <button
                  type="button"
                  className="driver-start-ride-button"
                  onClick={startRide}
                  disabled={busy}
                >
                  <Play size={18} />

                  {busy
                    ? "Starting..."
                    : "Start Ride"}
                </button>

                <button
                  type="button"
                  className="driver-not-arrived-button"
                  onClick={() =>
                    setArrived(false)
                  }
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
          <p className="driver-active-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default DriverActiveRide;