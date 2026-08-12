import { apiBaseUrl } from "../config/api.js";
import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  CarFront,
  Clock3,
  MapPin,
  Navigation,
  RefreshCw,
} from "lucide-react";

import "./DashboardRideState.css";

const API =
  apiBaseUrl;

const POLL_MS = 3000;

const ACTIVE_RIDE_STATUSES =
  new Set([
    "ACCEPTED",
    "DRIVER_ARRIVING",
    "DRIVER_ARRIVED",
    "ARRIVING",
    "ARRIVED",
    "IN_PROGRESS",
  ]);

function saveSessionValue(
  key,
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return;
  }

  sessionStorage.setItem(
    key,
    String(value)
  );
}

function removeSessionValues(
  keys
) {
  keys.forEach((key) => {
    sessionStorage.removeItem(
      key
    );
  });
}

async function readResponse(
  response
) {
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
    const error =
      new Error(
        data?.message ||
          data?.details ||
          data?.error ||
          text ||
          `HTTP ${response.status}`
      );

    error.status =
      response.status;

    throw error;
  }

  return data;
}

function formatStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatFare(value) {
  const amount =
    Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount.toLocaleString(
    "en-PK",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  );
}

function DashboardRideState({
  mode,
  driverId,
  passengerId,
  onBusyChange,
}) {
  const navigate = useNavigate();

  const normalizedMode =
    String(mode || "")
      .toUpperCase();

  const [
    rideState,
    setRideState,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    stateError,
    setStateError,
  ] = useState("");

  const publishState = (
    nextState
  ) => {
    setRideState(nextState);

    if (
      typeof onBusyChange ===
      "function"
    ) {
      onBusyChange(
        Boolean(nextState)
      );
    }
  };

  const loadDriverState =
    async () => {
      const response =
        await fetch(
          `${API}/driver-rides/${driverId}/active`,
          {
            cache: "no-store",
          }
        );

      const data =
        await readResponse(
          response
        );

      if (
        data?.active &&
        data?.rideId
      ) {
        sessionStorage.setItem(
          "activeDriverRide",
          JSON.stringify(data)
        );

        saveSessionValue(
          "rideId",
          data.rideId
        );

        saveSessionValue(
          "rideStatus",
          data.status ||
            "ACCEPTED"
        );

        return {
          kind: "ACTIVE",
          ride: data,
          offersCount: 0,
        };
      }

      removeSessionValues([
        "activeDriverRide",
        "rideId",
        "rideStatus",
      ]);

      return null;
    };

  const loadPassengerState =
    async () => {
      /*
       * Check persisted ACCEPTED or
       * IN_PROGRESS rides first.
       */
      const latestResponse =
        await fetch(
          `${API}/passenger-rides/${passengerId}/latest`,
          {
            cache: "no-store",
          }
        );

      const latestRide =
        await readResponse(
          latestResponse
        );

      const latestStatus =
        String(
          latestRide?.status || ""
        ).toUpperCase();

      if (
        latestRide?.found &&
        latestRide?.rideId &&
        ACTIVE_RIDE_STATUSES.has(
          latestStatus
        )
      ) {
        sessionStorage.setItem(
          "activePassengerRide",
          JSON.stringify(
            latestRide
          )
        );

        saveSessionValue(
          "rideId",
          latestRide.rideId
        );

        saveSessionValue(
          "rideStatus",
          latestStatus
        );

        if (
          latestRide.paymentMethod
        ) {
          saveSessionValue(
            "paymentMethod",
            latestRide.paymentMethod
          );
        }

        return {
          kind: "ACTIVE",
          ride: latestRide,
          offersCount: 0,
        };
      }

      /*
       * If no persisted active ride
       * exists, check the server for
       * an active SEARCHING request.
       *
       * This does not rely only on
       * browser storage.
       */
      const requestResponse =
        await fetch(
          `${API}/ride-requests/passenger/${passengerId}/active`,
          {
            cache: "no-store",
          }
        );

      const requestData =
        await readResponse(
          requestResponse
        );

      const requestStatus =
        String(
          requestData?.status || ""
        ).toUpperCase();

      if (
        requestData?.requestId &&
        requestStatus ===
          "SEARCHING"
      ) {
        let offersCount = 0;

        try {
          const offersResponse =
            await fetch(
              `${API}/driver-offers/request/${requestData.requestId}`,
              {
                cache:
                  "no-store",
              }
            );

          const offersData =
            await readResponse(
              offersResponse
            );

          offersCount =
            Array.isArray(
              offersData
            )
              ? offersData.length
              : 0;
        } catch (
          offersError
        ) {
          console.error(
            "Driver offers:",
            offersError
          );
        }

        sessionStorage.setItem(
          "activeRideRequest",
          JSON.stringify(
            requestData
          )
        );

        saveSessionValue(
          "rideRequestId",
          requestData.requestId
        );

        saveSessionValue(
          "rideStatus",
          "SEARCHING"
        );

        return {
          kind: "SEARCHING",
          ride: requestData,
          offersCount,
        };
      }

      /*
       * No active search and no
       * active persisted ride.
       */
      removeSessionValues([
        "activePassengerRide",
        "activeRideRequest",
        "acceptedRide",
        "rideRequestId",
        "rideId",
        "rideStatus",
        "ridePin",
      ]);

      return null;
    };

  const loadState =
    async (
      manualRefresh = false
    ) => {
      if (manualRefresh) {
        setRefreshing(true);
      }

      try {
        let nextState = null;

        if (
          normalizedMode ===
            "DRIVER" &&
          Number.isInteger(
            Number(driverId)
          ) &&
          Number(driverId) > 0
        ) {
          nextState =
            await loadDriverState();
        }

        if (
          normalizedMode ===
            "PASSENGER" &&
          Number.isInteger(
            Number(passengerId)
          ) &&
          Number(passengerId) > 0
        ) {
          nextState =
            await loadPassengerState();
        }

        publishState(nextState);
        setStateError("");
      } catch (loadError) {
        console.error(
          "Dashboard ride state:",
          loadError
        );

        /*
         * Fail closed. If the server
         * cannot verify availability,
         * do not expose another booking
         * or offer interface.
         */
        if (
          typeof onBusyChange ===
          "function"
        ) {
          onBusyChange(true);
        }

        setStateError(
          loadError.message ||
            "Unable to refresh your current ride."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    let stopped = false;

    const refresh =
      async () => {
        if (stopped) {
          return;
        }

        await loadState(false);
      };

    refresh();

    const timer =
      window.setInterval(
        refresh,
        POLL_MS
      );

    return () => {
      stopped = true;

      window.clearInterval(
        timer
      );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    driverId,
    normalizedMode,
    passengerId,
  ]);

  if (
    loading &&
    !rideState
  ) {
    return (
      <section className="dashboard-ride-state loading">
        <RefreshCw
          size={21}
          className="dashboard-ride-spinner"
        />

        Checking your current
        ride...
      </section>
    );
  }

  if (
    !rideState &&
    !stateError
  ) {
    return null;
  }

  if (
    !rideState &&
    stateError
  ) {
    return (
      <section className="dashboard-ride-state error">
        <div>
          <strong>
            Ride status unavailable
          </strong>

          <p>{stateError}</p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadState(true)
          }
          disabled={refreshing}
        >
          <RefreshCw size={17} />

          {refreshing
            ? "Checking..."
            : "Retry"}
        </button>
      </section>
    );
  }

  const ride =
    rideState.ride || {};

  const status =
    rideState.kind ===
    "SEARCHING"
      ? "SEARCHING"
      : String(
          ride.status ||
            "ACCEPTED"
        ).toUpperCase();

  const pickup =
    ride.pickupAddress ||
    ride.pickupName ||
    "Pickup location";

  const destination =
    ride.dropoffAddress ||
    ride.dropoffName ||
    "Destination";

  const fare =
    formatFare(
      ride.acceptedFare ??
        ride.offeredFare ??
        ride.passengerFare ??
        ride.requestedFare
    );

  const resumeRide = () => {
    if (
      normalizedMode ===
      "DRIVER"
    ) {
      navigate(
        "/driver-active-ride"
      );

      return;
    }

    if (
      rideState.kind ===
      "SEARCHING"
    ) {
      navigate(
        "/searching-ride"
      );

      return;
    }

    navigate(
      "/passenger-active-ride"
    );
  };

  let title =
    "Current Ride";

  let description =
    "Your ride is active.";

  if (
    rideState.kind ===
    "SEARCHING"
  ) {
    title =
      rideState.offersCount > 0
        ? `${rideState.offersCount} Driver ${
            rideState.offersCount ===
            1
              ? "Offer"
              : "Offers"
          } Available`
        : "Searching for Drivers";

    description =
      rideState.offersCount > 0
        ? "Review the available offers and choose your driver."
        : "Your request is live. Drivers can currently send offers.";
  } else if (
    status === "IN_PROGRESS"
  ) {
    title = "Ride in Progress";

    description =
      "Return to your active ride for its current status and controls.";
  } else if (
    status.includes("ARRIVED")
  ) {
    title =
      "Driver Has Arrived";

    description =
      "Open your active ride to view the start PIN and ride details.";
  } else if (
    status.includes("ARRIVING")
  ) {
    title =
      "Driver Is Arriving";

    description =
      "Open your active ride to follow the current pickup status.";
  } else if (
    status === "ACCEPTED"
  ) {
    title = "Ride Accepted";

    description =
      "Your driver and vehicle are confirmed.";
  }

  return (
    <section className="dashboard-ride-state active">
      <div className="dashboard-ride-state-top">
        <div className="dashboard-ride-state-icon">
          {rideState.kind ===
          "SEARCHING" ? (
            <Clock3 size={25} />
          ) : (
            <CarFront size={25} />
          )}
        </div>

        <div>
          <span className="dashboard-ride-eyebrow">
            Current status
          </span>

          <h2>{title}</h2>

          <p>{description}</p>
        </div>

        <span
          className={
            `dashboard-ride-badge ${
              status.toLowerCase()
            }`
          }
        >
          {formatStatus(status)}
        </span>
      </div>

      <div className="dashboard-ride-route">
        <div>
          <MapPin size={18} />

          <span>
            <small>Pickup</small>

            <strong>
              {pickup}
            </strong>
          </span>
        </div>

        <div>
          <Navigation size={18} />

          <span>
            <small>
              Destination
            </small>

            <strong>
              {destination}
            </strong>
          </span>
        </div>
      </div>

      <div className="dashboard-ride-state-footer">
        {fare && (
          <span>
            Fare:{" "}
            <strong>
              Rs {fare}
            </strong>
          </span>
        )}

        <button
          type="button"
          onClick={resumeRide}
        >
          {rideState.kind ===
          "SEARCHING"
            ? "View Search"
            : "Resume Ride"}
        </button>
      </div>
    </section>
  );
}

export default DashboardRideState;