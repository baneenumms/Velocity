import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PassengerHamburgerMenu from "../components/PassengerHamburgerMenu";
import "./PassengerRideHistory.css";

function PassengerRideHistory() {
  const navigate = useNavigate();

  const rides = useMemo(() => {
    try {
      const savedRides = localStorage.getItem(
        "passengerRideHistory"
      );

      return savedRides ? JSON.parse(savedRides) : [];
    } catch (error) {
      console.error("Could not read ride history:", error);
      return [];
    }
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString();
  };

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
          onClick={() => navigate("/passenger-dashboard")}
        >
          ← Back to dashboard
        </button>

        <section className="ride-history-title">
          <p>Your journeys</p>
          <h1>Ride History</h1>
        </section>

        {rides.length === 0 ? (
          <section className="empty-ride-history">
            <div className="empty-ride-icon">🚗</div>
            <h2>No rides yet</h2>
            <p>
              Your completed and cancelled rides will appear here.
            </p>

            <button
              type="button"
              onClick={() => navigate("/passenger-dashboard")}
            >
              Book your first ride
            </button>
          </section>
        ) : (
          <div className="ride-history-list">
            {rides.map((ride, index) => (
              <article
                className="ride-history-card"
                key={ride.rideId || `${ride.date}-${index}`}
              >
                <div className="ride-history-card-header">
                  <div>
                    <span>Ride #{ride.rideId || index + 1}</span>
                    <strong>{formatDate(ride.date)}</strong>
                  </div>

                  <span
                    className={`ride-status ride-status-${(
                      ride.status || "completed"
                    ).toLowerCase()}`}
                  >
                    {ride.status || "Completed"}
                  </span>
                </div>

                <div className="ride-location">
                  <span className="history-pickup-dot" />

                  <div>
                    <small>Pickup</small>
                    <p>
                      {ride.pickup?.address ||
                        ride.pickupAddress ||
                        "Pickup unavailable"}
                    </p>
                  </div>
                </div>

                <div className="history-route-line" />

                <div className="ride-location">
                  <span className="history-destination-dot" />

                  <div>
                    <small>Destination</small>
                    <p>
                      {ride.destination?.address ||
                        ride.destinationAddress ||
                        "Destination unavailable"}
                    </p>
                  </div>
                </div>

                <div className="ride-history-details">
                  <div>
                    <span>Distance</span>
                    <strong>
                      {ride.distanceKm
                        ? `${ride.distanceKm} km`
                        : "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Fare</span>
                    <strong>
                      {ride.selectedFare || ride.fare
                        ? `PKR ${
                            ride.selectedFare || ride.fare
                          }`
                        : "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Driver</span>
                    <strong>{ride.driverName || "—"}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default PassengerRideHistory;