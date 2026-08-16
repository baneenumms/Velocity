import { apiBaseUrl } from "../config/api.js";
import {
  useEffect,
  useState,
} from "react";

import {
  CarFront,
} from "lucide-react";

import "./DriverTripHistory.css";

const API =
  apiBaseUrl;

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
        "Unable to load trip history."
    );
  }

  return data;
}

function DriverTripHistory() {
  const driverId = Number(
    sessionStorage.getItem(
      "driverId"
    )
  );

  const [trips, setTrips] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const validDriver =
    Number.isInteger(driverId) &&
    driverId > 0;

  useEffect(() => {
    if (!validDriver) {
      setError(
        "No driver session found. Please log in again."
      );

      setLoading(false);
      return undefined;
    }

    let stopped = false;

    const fetchTrips = async () => {
      try {
        const response = await fetch(
          `${API}/drivers/${driverId}/trips`
        );

        const data =
          await readResponse(
            response
          );

        if (!stopped) {
          setTrips(
            Array.isArray(data)
              ? data
              : []
          );

          setError("");
        }
      } catch (tripError) {
        if (!stopped) {
          setError(
            tripError.message ||
              "Unable to load trip history."
          );
        }
      } finally {
        if (!stopped) {
          setLoading(false);
        }
      }
    };

    fetchTrips();

    return () => {
      stopped = true;
    };
  }, [
    driverId,
    validDriver,
  ]);

  const formatMoney = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "—";
    }

    return `PKR ${value.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatDate = (trip) => {
    const value =
      trip.completedAt ??
      trip.cancelledAt ??
      trip.startedAt ??
      trip.acceptedAt ??
      trip.requestedAt;

    if (!value) {
      return "Date unavailable";
    }

    const date = new Date(value);

    return Number.isNaN(
      date.getTime()
    )
      ? String(value)
      : date.toLocaleString();
  };

  const getPickup = (trip) =>
    trip.pickupLocation ||
    trip.pickupAddress ||
    trip.pickupName ||
    "Pickup unavailable";

  const getDestination = (trip) =>
    trip.dropoffLocation ||
    trip.dropoffAddress ||
    trip.dropoffName ||
    "Destination unavailable";

  return (
    <div className="driver-trip-history-page">
      <main className="driver-trip-history-content">
        <section className="driver-trip-history-title">
          <p>Your journeys</p>
          <h1>Trip History</h1>
        </section>

        {loading && (
          <section className="driver-trip-state-card">
            <p>Loading your trip history...</p>
          </section>
        )}

        {!loading && error && (
          <section className="driver-trip-state-card">
            <CarFront size={50} />
            <h2>Trip history unavailable</h2>
            <p>{error}</p>
          </section>
        )}

        {!loading &&
          !error &&
          trips.length === 0 && (
            <section className="driver-trip-state-card">
              <CarFront size={50} />
              <h2>No trips found</h2>
              <p>
                Completed and cancelled
                rides linked to this driver
                will appear here.
              </p>
            </section>
          )}

        {!loading &&
          !error &&
          trips.length > 0 && (
            <div className="driver-trip-history-list">
              {trips.map(
                (trip, index) => {
                  const fare = Number(
                    trip.finalFare ??
                      trip.acceptedFare ??
                      0
                  );

                  const platformFee =
                    fare * 0.12;

                  const netEarnings =
                    fare - platformFee;

                  const distance = Number(
                    trip.distanceKm
                  );

                  const status =
                    trip.rideStatus ||
                    "Completed";

                  const statusClass =
                    String(status)
                      .toLowerCase()
                      .replaceAll("_", "-");

                  return (
                    <article
                      className="driver-trip-history-card"
                      key={
                        trip.rideId ??
                        index
                      }
                    >
                      <div className="driver-trip-card-header">
                        <div>
                          <span>
                            Ride #{
                              trip.rideId ??
                              index + 1
                            }
                          </span>

                          <strong>
                            {formatDate(trip)}
                          </strong>
                        </div>

                        <span
                          className={`driver-trip-status driver-trip-status-${statusClass}`}
                        >
                          {String(status)
                            .replaceAll("_", " ")}
                        </span>
                      </div>

                      <div className="driver-trip-location">
                        <span className="driver-trip-pickup-dot" />

                        <div>
                          <small>Pickup</small>
                          <p>{getPickup(trip)}</p>
                        </div>
                      </div>

                      <div className="driver-trip-route-line" />

                      <div className="driver-trip-location">
                        <span className="driver-trip-destination-dot" />

                        <div>
                          <small>Destination</small>
                          <p>{getDestination(trip)}</p>
                        </div>
                      </div>

                      <div className="driver-trip-details">
                        <div>
                          <span>Distance</span>
                          <strong>
                            {Number.isFinite(distance)
                              ? `${distance.toFixed(2)} km`
                              : "—"}
                          </strong>
                        </div>

                        <div>
                          <span>Trip Fare</span>
                          <strong>
                            {formatMoney(fare)}
                          </strong>
                        </div>

                        <div>
                          <span>Platform Fee</span>
                          <strong className="driver-trip-fee">
                            -{formatMoney(platformFee)}
                          </strong>
                        </div>

                        <div>
                          <span>Net Earnings</span>
                          <strong>
                            {formatMoney(netEarnings)}
                          </strong>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
      </main>
    </div>
  );
}

export default DriverTripHistory;
