import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  History,
  Menu,
} from "lucide-react";

import HamburgerMenu from
  "../components/HamburgerMenu";

import "./DriverTripHistory.css";

const API =
  "http://localhost:8080";

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
  const navigate = useNavigate();

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

  const [menuOpen, setMenuOpen] =
    useState(false);

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

  const formatMoney = (amount) =>
    Number(
      amount ?? 0
    ).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  return (
    <div className="page trips-page">
      <HamburgerMenu
        open={menuOpen}
        onClose={() =>
          setMenuOpen(false)
        }
      />

      <div className="dashboard-header">
        <button
          type="button"
          className="menu-btn"
          onClick={() =>
            setMenuOpen(true)
          }
          aria-label="Open menu"
        >
          <Menu size={25} />
        </button>

        <div className="velocity-title small">
          <span className="velo">
            VEL
          </span>

          <span className="wheel">
            <span className="hub" />
          </span>

          <span className="city">
            CITY
          </span>
        </div>
      </div>

      <div className="card trips-card">
        <div className="trips-heading">
          <div className="icon-circle">
            <History
              size={36}
              color="white"
            />
          </div>

          <h1 className="title">
            Trip History
          </h1>
        </div>

        <div className="trips-content">
          {loading && (
            <p className="subtitle">
              Loading trips...
            </p>
          )}

          {!loading && error && (
            <p className="error">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            trips.length === 0 && (
              <p className="subtitle">
                No trips were found for
                this driver.
              </p>
            )}

          {!loading &&
            !error &&
            trips.length > 0 && (
              <div className="trip-list">
                {trips.map(
                  (trip, index) => {
                    const fare =
                      Number(
                        trip.finalFare ??
                          0
                      );

                    const platformFee =
                      fare * 0.12;

                    const netEarnings =
                      fare -
                      platformFee;

                    const tripDate =
                      trip.completedAt ??
                      trip.cancelledAt ??
                      trip.requestedAt;

                    const status =
                      trip.rideStatus ||
                      "Completed";

                    return (
                      <div
                        className="trip-item"
                        key={
                          trip.rideId ??
                          index
                        }
                      >
                        <div className="trip-top-row">
                          <span className="trip-date">
                            {tripDate
                              ? new Date(
                                  tripDate
                                ).toLocaleString()
                              : "—"}
                          </span>

                          <span
                            className={`trip-status ${String(
                              status
                            ).toLowerCase()}`}
                          >
                            {status}
                          </span>
                        </div>

                        <div className="trip-route">
                          <div>
                            <span className="route-label">
                              Pickup
                            </span>

                            <p>
                              {trip.pickupLocation ||
                                trip.pickupAddress ||
                                trip.pickupName ||
                                "—"}
                            </p>
                          </div>

                          <ArrowRight
                            className="trip-arrow"
                            size={20}
                          />

                          <div>
                            <span className="route-label">
                              Drop-off
                            </span>

                            <p>
                              {trip.dropoffLocation ||
                                trip.dropoffAddress ||
                                trip.dropoffName ||
                                "—"}
                            </p>
                          </div>
                        </div>

                        <div className="earnings-box">
                          <div>
                            <span>
                              Trip Fare
                            </span>

                            <strong>
                              Rs{" "}
                              {formatMoney(
                                fare
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Platform Fee
                              (12%)
                            </span>

                            <strong className="fee">
                              -Rs{" "}
                              {formatMoney(
                                platformFee
                              )}
                            </strong>
                          </div>

                          <div className="net-row">
                            <span>
                              Net Earnings
                            </span>

                            <strong>
                              Rs{" "}
                              {formatMoney(
                                netEarnings
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
        </div>

        <button
          type="button"
          className="primary-btn back-btn"
          onClick={() =>
            navigate(
              "/driver-dashboard"
            )
          }
        >
          <ArrowLeft size={18} />
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default DriverTripHistory;