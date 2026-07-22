import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import HamburgerMenu from "../components/HamburgerMenu";
import "./DriverProfile.css";

function DriverProfile() {

    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    const driverId = localStorage.getItem("driverId");

    useEffect(() => {

        const fetchProfile = async () => {

            try {

                const response = await fetch(
                    `http://localhost:8080/drivers/profile/${driverId}`
                );

                if (!response.ok) {
                    setError("Unable to load profile.");
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                setProfile(data);
                setLoading(false);

            } catch (err) {

                console.error(err);
                setError("Unable to connect to server.");
                setLoading(false);

            }
        };

        if (driverId) {
            fetchProfile();
        } else {
            setError("No driver session found. Please log in again.");
            setLoading(false);
        }

    }, [driverId]);

    const vehicle = profile?.vehicles?.[0];

    return (

        <div className="page profile-page">

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

            <div className="card profile-card">

                <div className="icon-circle">
                    <User size={36} color="white" />
                </div>

                <h1 className="title">My Profile</h1>

                {loading && (
                    <p className="subtitle">Loading profile...</p>
                )}

                {error && (
                    <p className="error">{error}</p>
                )}

                {!loading && !error && profile && (

                    <>

                        <div className="profile-section">

                            <h2 className="section-label">Personal Details</h2>

                            <div className="info-row">
                                <span className="info-label">Full Name</span>
                                <span className="info-value">{profile.fullName}</span>
                            </div>

                            <div className="info-row">
                                <span className="info-label">Phone</span>
                                <span className="info-value">{profile.phoneNumber}</span>
                            </div>

                            <div className="info-row">
                                <span className="info-label">Email</span>
                                <span className="info-value">{profile.email}</span>
                            </div>

                        </div>

                        <div className="profile-section">

                            <h2 className="section-label">Driver Details</h2>

                            <div className="info-row">
                                <span className="info-label">License Number</span>
                                <span className="info-value">{profile.licenseNumber}</span>
                            </div>

                            <div className="info-row">
                                <span className="info-label">Status</span>
                                <span
                                    className={`status-pill ${
                                        profile.driverStatus === "Online" ? "on" : "off"
                                    }`}
                                >
                                    {profile.driverStatus}
                                </span>
                            </div>

                        </div>

                        {vehicle ? (

                            <div className="profile-section">

                                <h2 className="section-label">Vehicle</h2>

                                <div className="info-row">
                                    <span className="info-label">Make &amp; Model</span>
                                    <span className="info-value">
                                        {vehicle.make} {vehicle.model} ({vehicle.vehicleYear})
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label">Color</span>
                                    <span className="info-value">{vehicle.color}</span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label">Plate Number</span>
                                    <span className="info-value">{vehicle.plateNumber}</span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label">Type</span>
                                    <span className="info-value">{vehicle.vehicleType}</span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label">Capacity</span>
                                    <span className="info-value">{vehicle.capacity} seats</span>
                                </div>

                            </div>

                        ) : (

                            <p className="subtitle">No vehicle registered.</p>

                        )}

                    </>

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

export default DriverProfile;