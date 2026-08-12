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
  Car,
  Menu,
  User,
} from "lucide-react";

import HamburgerMenu from
  "../components/HamburgerMenu";
import VelocityMark from "../components/VelocityMark";

import "./DriverProfile.css";

const API =
  apiBaseUrl;

function DriverProfile() {
  const navigate = useNavigate();

  const driverId = Number(
    sessionStorage.getItem(
      "driverId"
    )
  );

  const [profile, setProfile] =
    useState(null);

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

    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${API}/drivers/${driverId}/profile`
        );

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
              text ||
              "Unable to load profile."
          );
        }

        if (!stopped) {
          setProfile(data);
          setError("");
        }
      } catch (profileError) {
        if (!stopped) {
          setError(
            profileError.message ||
              "Unable to connect to server."
          );
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
  }, [
    driverId,
    validDriver,
  ]);

  const vehicles =
    Array.isArray(
      profile?.vehicles
    )
      ? profile.vehicles
      : profile?.vehicle
        ? [profile.vehicle]
        : [];

  return (
    <div className="page profile-page">
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

        <VelocityMark className="driver-header-mark" />
      </div>

      <div className="card profile-card">
        <div className="profile-heading">
          <div className="icon-circle">
            <User
              size={36}
              color="white"
            />
          </div>

          <h1 className="title">
            My Profile
          </h1>
        </div>

        <div className="profile-scroll">
          {loading && (
            <p className="subtitle">
              Loading profile...
            </p>
          )}

          {!loading && error && (
            <p className="error">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            profile && (
              <>
                <div className="profile-section first-section">
                  <h2 className="section-label">
                    Personal Details
                  </h2>

                  <div className="info-row">
                    <span className="info-label">
                      Full Name
                    </span>

                    <span className="info-value">
                      {profile.fullName ||
                        "—"}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">
                      Phone
                    </span>

                    <span className="info-value">
                      {profile.phoneNumber ||
                        "—"}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">
                      Email
                    </span>

                    <span className="info-value email-value">
                      {profile.email ||
                        "—"}
                    </span>
                  </div>
                </div>

                <div className="profile-section">
                  <h2 className="section-label">
                    Account Details
                  </h2>

                  <div className="info-row">
                    <span className="info-label">
                      User ID
                    </span>

                    <span className="info-value">
                      {profile.userId ??
                        "—"}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">
                      Driver ID
                    </span>

                    <span className="info-value">
                      {profile.driverId ??
                        driverId}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">
                      Account Role
                    </span>

                    <span className="info-value role-value">
                      {profile.role ||
                        "Driver"}
                    </span>
                  </div>
                </div>

                <div className="profile-section">
                  <h2 className="section-label">
                    Driver Details
                  </h2>

                  <div className="info-row">
                    <span className="info-label">
                      License Number
                    </span>

                    <span className="info-value">
                      {profile.licenseNumber ||
                        "—"}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">
                      Current Status
                    </span>

                    <span
                      className={`status-pill ${
                        profile.driverStatus ===
                        "Online"
                          ? "on"
                          : "off"
                      }`}
                    >
                      {profile.driverStatus ||
                        "Offline"}
                    </span>
                  </div>
                </div>

                <div className="profile-section">
                  <h2 className="section-label">
                    Registered Vehicles
                  </h2>

                  {vehicles.length ===
                  0 ? (
                    <p className="subtitle">
                      No vehicle registered.
                    </p>
                  ) : (
                    vehicles.map(
                      (
                        vehicle,
                        index
                      ) => (
                        <div
                          className="vehicle-card"
                          key={
                            vehicle.vehicleId ??
                            index
                          }
                        >
                          <div className="vehicle-heading">
                            <Car
                              size={20}
                            />

                            <strong>
                              {vehicle.make ||
                                "Vehicle"}{" "}
                              {vehicle.model ||
                                ""}
                            </strong>
                          </div>

                          <div className="info-row">
                            <span className="info-label">
                              Vehicle ID
                            </span>

                            <span className="info-value">
                              {vehicle.vehicleId ??
                                "—"}
                            </span>
                          </div>

                          <div className="info-row">
                            <span className="info-label">
                              Year
                            </span>

                            <span className="info-value">
                              {vehicle.vehicleYear ??
                                "—"}
                            </span>
                          </div>

                          <div className="info-row">
                            <span className="info-label">
                              Color
                            </span>

                            <span className="info-value">
                              {vehicle.color ||
                                "—"}
                            </span>
                          </div>

                          <div className="info-row">
                            <span className="info-label">
                              Plate Number
                            </span>

                            <span className="info-value plate-value">
                              {vehicle.plateNumber ||
                                "—"}
                            </span>
                          </div>

                          <div className="info-row">
                            <span className="info-label">
                              Vehicle Type
                            </span>

                            <span className="info-value">
                              {vehicle.vehicleType ||
                                "—"}
                            </span>
                          </div>

                          <div className="info-row">
                            <span className="info-label">
                              Capacity
                            </span>

                            <span className="info-value">
                              {vehicle.capacity
                                ? `${vehicle.capacity} seats`
                                : "—"}
                            </span>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </>
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

export default DriverProfile;
