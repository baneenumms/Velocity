import { apiBaseUrl } from "../config/api.js";
import { useEffect, useState } from "react";
import { Car, ChevronDown, UserRound } from "lucide-react";

import "./DriverProfile.css";

const API = apiBaseUrl;

function DetailRow({ label, value, valueClass = "" }) {
  return (
    <div className="driver-profile-detail-row">
      <span>{label}</span>
      <strong className={valueClass}>{value ?? "—"}</strong>
    </div>
  );
}

function DriverProfile() {
  const driverId = Number(sessionStorage.getItem("driverId"));
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const validDriver = Number.isInteger(driverId) && driverId > 0;

  useEffect(() => {
    if (!validDriver) {
      setError("No driver session found. Please log in again.");
      setLoading(false);
      return undefined;
    }

    let stopped = false;

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API}/drivers/${driverId}/profile`);
        const text = await response.text();
        let data = null;

        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw new Error(data?.message || text || "Unable to load profile.");
        }

        if (!stopped) {
          setProfile(data);
          setError("");
        }
      } catch (profileError) {
        if (!stopped) {
          setError(profileError.message || "Unable to connect to server.");
        }
      } finally {
        if (!stopped) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      stopped = true;
    };
  }, [driverId, validDriver]);

  const vehicles = Array.isArray(profile?.vehicles)
    ? profile.vehicles
    : profile?.vehicle
      ? [profile.vehicle]
      : [];

  const initials = (profile?.fullName || "Driver")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="driver-profile-page">
      <main className="driver-profile-content">
        <section className="driver-profile-title">
          <p>Your account</p>
          <h1>My Profile</h1>
        </section>

        {loading && (
          <section className="driver-profile-state-card">
            <p>Loading your profile...</p>
          </section>
        )}

        {!loading && error && (
          <section className="driver-profile-state-card">
            <UserRound size={46} />
            <h2>Profile unavailable</h2>
            <p>{error}</p>
          </section>
        )}

        {!loading && !error && profile && (
          <section className="driver-profile-card">
            <header className="driver-profile-identity">
              <div className="driver-profile-avatar" aria-hidden="true">
                {initials}
              </div>
              <div>
                <span>Driver Account</span>
                <h2>{profile.fullName || "Driver"}</h2>
                <p>Driver #{profile.driverId ?? driverId}</p>
              </div>
            </header>

            <div className="driver-profile-sections">
              <details className="driver-profile-section" open>
                <summary>
                  <span>Personal Details</span>
                  <ChevronDown size={21} />
                </summary>
                <div className="driver-profile-detail-grid">
                  <DetailRow label="Full name" value={profile.fullName} />
                  <DetailRow label="Phone number" value={profile.phoneNumber} />
                  <DetailRow label="Email address" value={profile.email} />
                </div>
              </details>

              <details className="driver-profile-section">
                <summary>
                  <span>Account Details</span>
                  <ChevronDown size={21} />
                </summary>
                <div className="driver-profile-detail-grid">
                  <DetailRow label="User ID" value={profile.userId} />
                  <DetailRow label="Driver ID" value={profile.driverId ?? driverId} />
                  <DetailRow label="Account role" value="Driver" />
                </div>
              </details>

              <details className="driver-profile-section">
                <summary>
                  <span>Driver Details</span>
                  <ChevronDown size={21} />
                </summary>
                <div className="driver-profile-detail-grid">
                  <DetailRow label="Licence number" value={profile.licenseNumber} />
                  <DetailRow
                    label="Current status"
                    value={profile.driverStatus || "Offline"}
                    valueClass={`driver-profile-status ${
                      profile.driverStatus === "Online" ? "online" : "offline"
                    }`}
                  />
                </div>
              </details>

              <details className="driver-profile-section">
                <summary>
                  <span>Registered Vehicles</span>
                  <span className="driver-profile-summary-meta">
                    {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}
                    <ChevronDown size={21} />
                  </span>
                </summary>

                {vehicles.length === 0 ? (
                  <p className="driver-profile-empty">No vehicle registered.</p>
                ) : (
                  <div className="driver-profile-vehicles">
                    {vehicles.map((vehicle, index) => (
                      <article
                        className="driver-profile-vehicle-card"
                        key={vehicle.vehicleId ?? index}
                      >
                        <header>
                          <Car size={22} />
                          <div>
                            <strong>
                              {vehicle.make || "Vehicle"} {vehicle.model || ""}
                            </strong>
                            <span>{vehicle.plateNumber || "Plate unavailable"}</span>
                          </div>
                        </header>
                        <div className="driver-profile-detail-grid compact">
                          <DetailRow label="Vehicle ID" value={vehicle.vehicleId} />
                          <DetailRow label="Year" value={vehicle.vehicleYear} />
                          <DetailRow label="Colour" value={vehicle.color} />
                          <DetailRow label="Vehicle type" value={vehicle.vehicleType} />
                          <DetailRow
                            label="Capacity"
                            value={vehicle.capacity ? `${vehicle.capacity} seats` : "—"}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </details>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default DriverProfile;
