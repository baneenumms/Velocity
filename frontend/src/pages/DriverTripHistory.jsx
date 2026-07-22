import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { History } from "lucide-react";
import HamburgerMenu from "../components/HamburgerMenu";
import "./DriverTripHistory.css";

function DriverTripHistory() {

    const navigate = useNavigate();

    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    const driverId = localStorage.getItem("driverId");

    useEffect(() => {

        const fetchTrips = async () => {

            try {

                const response = await fetch(
                    `http://localhost:8080/drivers/trips/${driverId}`
                );

                if (!response.ok) {
                    setError("Unable to load trip history.");
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                setTrips(Array.isArray(data) ? data : []);
                setLoading(false);

            } catch (err) {

                console.error(err);
                setError("Unable to connect to server.");
                setLoading(false);

            }
        };

        if (driverId) {
            fetchTrips();
        } else {
            setError("No driver session found. Please log in again.");
            setLoading(false);
        }

    }, [driverId]);

    return (

        <div className="page trips-page">

            <HamburgerMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
            />

            <div className="dashboard-header">

                <button
                    className="menu-btn"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                >
                    ☰
                </button>

                <div className="velocity-title small">
                    <span className="velo">VEL</span>
                    <span className="wheel">
                        <span className="hub"></span>
                    </span>
                    <span className="city">CITY</span>
                </div>

            </div>

            <div className="card trips-card">

                <div className="icon-circle">
                    <History size={36} color="white" />
                </div>

                <h1 className="title">Trip History</h1>

                {loading && (
                    <p className="subtitle">Loading trips...</p>
                )}

                {error && (
                    <p className="error">{error}</p>
                )}

                {!loading && !error && trips.length === 0 && (
                    <p className="subtitle">No ride history yet</p>
                )}

                {!loading && !error && trips.length > 0 && (

                    <div className="trip-list">

                        {trips.map((trip, index) => (

                            <div className="trip-item" key={trip.tripId || index}>

                                <div className="trip-row">
                                    <span className="trip-date">
                                        {trip.date || trip.tripDate || "—"}
                                    </span>
                                    <span className="trip-fare">
                                        Rs {trip.fare ?? "—"}
                                    </span>
                                </div>

                                <div className="trip-route">
                                    <span>{trip.pickup || trip.pickupLocation || "Pickup"}</span>
                                    <span className="trip-arrow">→</span>
                                    <span>{trip.dropoff || trip.dropoffLocation || "Drop-off"}</span>
                                </div>

                                {trip.status && (
                                    <span className={`trip-status ${trip.status.toLowerCase()}`}>
                                        {trip.status}
                                    </span>
                                )}

                            </div>

                        ))}

                    </div>

                )}

                <button
                    className="primary-btn back-btn"
                    onClick={() => navigate("/driver-dashboard")}
                >
                    Back to Home
                </button>

            </div>

        </div>

    );

}

export default DriverTripHistory;