import { apiBaseUrl } from "../config/api.js";
import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  CarFront,
} from "lucide-react";

import PassengerHamburgerMenu from
  "../components/PassengerHamburgerMenu";

import "./PassengerRideHistory.css";

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
    if (response.status === 404) {
      throw new Error(
        "Passenger ride-history endpoint has not been added to the backend yet."
      );
    }

    throw new Error(
      data?.message ||
        data?.details ||
        text ||
        "Unable to load ride history."
    );
  }

  return data;
}

function PassengerRideHistory() {
  const navigate = useNavigate();

  const passengerId = Number(
    sessionStorage.getItem(
      "passengerId"
    )
  );

  const [rides, setRides] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const validPassenger =
    Number.isInteger(passengerId) &&
    passengerId > 0;

  useEffect(() => {
    if (!validPassenger) {
      setError(
        "No passenger session found. Please log in again."
      );

      setLoading(false);
      return undefined;
    }

    let stopped = false;

    const loadHistory = async () => {
      try {
        const response = await fetch(
          `${API}/rides/passenger/${passengerId}/history`
        );

        const data =
          await readResponse(
            response
          );

        if (stopped) {
          return;
        }

        setRides(
          Array.isArray(data)
            ? data
            : []
        );

        setError("");
      } catch (historyError) {
        if (!stopped) {
          setError(
            historyError.message ||
              "Unable to load ride history."
          );
        }
      } finally {
        if (!stopped) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      stopped = true;
    };
  }, [
    passengerId,
    validPassenger,
  ]);

  const formatDate = (ride) => {
    const value =
      ride.completedAt ||
      ride.cancelledAt ||
      ride.startedAt ||
      ride.acceptedAt ||
      ride.requestedAt ||
      ride.date;

    if (!value) {
      return "Date unavailable";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleString();
  };

  const formatMoney = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return "—";
    }

    return `PKR ${amount.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const getPickup = (ride) =>
    ride.pickupLocation ||
    ride.pickupAddress ||
    ride.pickupName ||
    ride.pickup?.address ||
    "Pickup unavailable";

  const getDestination = (ride) =>
    ride.dropoffLocation ||
    ride.dropoffAddress ||
    ride.dropoffName ||
    ride.destinationAddress ||
    ride.destination?.address ||
    "Destination unavailable";

  const getFare = (ride) =>
    ride.finalFare ??
    ride.acceptedFare ??
    ride.selectedFare ??
    ride.passengerFare ??
    ride.requestedFare ??
    ride.fare;

  return (
    <div className="ride-history-page">
      <header className="ride-history-header">
        <h2>VELOCITY</h2>

        <PassengerHamburgerMenu />
      </header>

      <main className="ride-history-content">
        <button
          type="button"
          className="ride-history-back"
          onClick={() =>
            navigate(
              "/passenger-dashboard"
            )
          }
        >
          <ArrowLeft size={18} />
          Back to dashboard
        </button>

        <section className="ride-history-title">
          <p>Your journeys</p>
          <h1>Ride History</h1>
        </section>

        {loading && (
          <section className="empty-ride-history">
            <p>
              Loading your ride history...
            </p>
          </section>
        )}

        {!loading && error && (
          <section className="empty-ride-history">
            <CarFront
              className="empty-ride-icon"
              size={50}
            />

            <h2>
              Ride history unavailable
            </h2>

            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/passenger-dashboard"
                )
              }
            >
              Back to dashboard
            </button>
          </section>
        )}

        {!loading &&
          !error &&
          rides.length === 0 && (
            <section className="empty-ride-history">
              <CarFront
                className="empty-ride-icon"
                size={50}
              />

              <h2>
                No rides found
              </h2>

              <p>
                Completed and cancelled
                rides linked to this
                passenger will appear
                here.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/passenger-dashboard"
                  )
                }
              >
                Book a ride
              </button>
            </section>
          )}

        {!loading &&
          !error &&
          rides.length > 0 && (
            <div className="ride-history-list">
              {rides.map(
                (ride, index) => {
                  const status =
                    ride.rideStatus ||
                    ride.status ||
                    "Completed";

                  const distance =
                    Number(
                      ride.distanceKm
                    );

                  return (
                    <article
                      className="ride-history-card"
                      key={
                        ride.rideId ??
                        index
                      }
                    >
                      <div className="ride-history-card-header">
                        <div>
                          <span>
                            Ride #
                            {ride.rideId ??
                              index + 1}
                          </span>

                          <strong>
                            {formatDate(
                              ride
                            )}
                          </strong>
                        </div>

                        <span
                          className={`ride-status ride-status-${String(
                            status
                          ).toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="ride-location">
                        <span className="history-pickup-dot" />

                        <div>
                          <small>
                            Pickup
                          </small>

                          <p>
                            {getPickup(
                              ride
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="history-route-line" />

                      <div className="ride-location">
                        <span className="history-destination-dot" />

                        <div>
                          <small>
                            Destination
                          </small>

                          <p>
                            {getDestination(
                              ride
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="ride-history-details">
                        <div>
                          <span>
                            Distance
                          </span>

                          <strong>
                            {Number.isFinite(
                              distance
                            )
                              ? `${distance.toFixed(
                                  2
                                )} km`
                              : "—"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Fare
                          </span>

                          <strong>
                            {formatMoney(
                              getFare(
                                ride
                              )
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Driver
                          </span>

                          <strong>
                            {ride.driverName ||
                              ride.driver
                                ?.fullName ||
                              "—"}
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

export default PassengerRideHistory;