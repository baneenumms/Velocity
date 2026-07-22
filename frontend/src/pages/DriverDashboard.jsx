import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HamburgerMenu from "../components/HamburgerMenu";
import "./DriverDashboard.css";

function DriverDashboard() {
    const navigate = useNavigate();

    const [isOnline, setIsOnline] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    const driverId =
        localStorage.getItem("driverId");

    const driverName =
        localStorage.getItem("driverName") ||
        "Driver";

    const handleToggle = async () => {
        setError("");
        setUpdating(true);

        const newStatus =
            isOnline ? "Offline" : "Online";

        try {
            const response = await fetch(
                "http://localhost:8080/drivers/status",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        driverId: Number(driverId),
                        status: newStatus,
                    }),
                }
            );

            if (!response.ok) {
                const text = await response.text();

                console.error(
                    "Server error:",
                    text
                );

                setError(
                    "Unable to update status. Please try again."
                );

                return;
            }

            const data = await response.json();

            if (data && data.status) {
                setIsOnline(
                    data.status === "Online"
                );
            } else {
                setIsOnline(
                    newStatus === "Online"
                );
            }

        } catch (err) {
            console.error(err);
            setError(
                "Unable to connect to server."
            );

        } finally {
            setUpdating(false);
        }
    };

    if (!driverId) {
        return (
            <div className="page dashboard-page">

                <div className="card dashboard-card">

                    <h1 className="title">
                        No driver session
                    </h1>

                    <p className="subtitle">
                        Please log in again.
                    </p>

                    <button
                        className="primary-btn"
                        onClick={() =>
                            navigate("/driver-phone")
                        }
                    >
                        Driver Login
                    </button>

                </div>

            </div>
        );
    }

    return (
        <div className="page dashboard-page">

            <HamburgerMenu
                open={menuOpen}
                onClose={() =>
                    setMenuOpen(false)
                }
            />

            <div className="dashboard-header">

                <button
                    className="menu-btn"
                    onClick={() =>
                        setMenuOpen(true)
                    }
                    aria-label="Open menu"
                >
                    ☰
                </button>

                <div className="velocity-title small">

                    <span className="velo">
                        VEL
                    </span>

                    <span className="wheel">
                        <span className="hub"></span>
                    </span>

                    <span className="city">
                        CITY
                    </span>

                </div>

            </div>

            <div className="card dashboard-card">

                <h1 className="title">
                    Welcome back, {driverName}
                </h1>

                <p className="subtitle">
                    {isOnline
                        ? "You're online and visible to riders."
                        : "You're offline. Go online to start receiving rides."}
                </p>

                <div className="status-toggle-row">

                    <span
                        className={
                            `status-label ${
                                isOnline ? "on" : "off"
                            }`
                        }
                    >
                        {isOnline
                            ? "Online"
                            : "Offline"}
                    </span>

                    <button
                        type="button"
                        className={
                            `toggle-switch ${
                                isOnline ? "on" : "off"
                            }`
                        }
                        onClick={handleToggle}
                        disabled={updating}
                        aria-pressed={isOnline}
                        aria-label="Toggle online status"
                    >
                        <span className="toggle-knob"></span>
                    </button>

                </div>

                {updating && (
                    <p className="subtitle">
                        Updating status...
                    </p>
                )}

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                {isOnline && (
                    <button
                        className="primary-btn"
                        onClick={() =>
                            navigate("/available-rides")
                        }
                    >
                        View Available Rides
                    </button>
                )}

            </div>

        </div>
    );
}

export default DriverDashboard;