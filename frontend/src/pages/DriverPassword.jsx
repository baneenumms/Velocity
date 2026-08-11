import { useState } from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";
import {
    Eye,
    EyeOff,
    Lock,
} from "lucide-react";
import "./DriverPassword.css";
import VelocityMark from "../components/VelocityMark";

const API = "http://localhost:8080";

const SESSION_KEYS = [
    "activeMode",
    "userId",
    "passengerId",
    "passengerName",
    "passengerPhone",
    "passengerEmail",
    "driverId",
    "driverName",
    "fullName",
    "vehicleId",
    "isAdmin",
    "adminToken",
    "applicantToken",
    "applicationStatus",
    "canGoOnline",
    "walletEnabled",
    "canViewRideOffers",
    "rideRequestId",
    "rideId",
    "rideStatus",
    "paymentMethod",
    "searchStartedAt",
    "activeRideRequest",
    "passengerRideDraft",
    "acceptedRide",
    "activeDriverRide",
    "ridePin",
];

function clearPreviousSession() {
    SESSION_KEYS.forEach((key) => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
    });
    sessionStorage.removeItem("velocitySession");
}

function saveSessionValue(key, value) {
    if (value === null || value === undefined) {
        return;
    }

    const storedValue = String(value);

    sessionStorage.setItem(key, storedValue);
}

function DriverPassword() {

    const navigate = useNavigate();
    const location = useLocation();

    const { phone } = location.state || {};

    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] =
        useState(false);
    const [loading, setLoading] = useState(false);

    const readResponse = async (response) => {
        const responseText = await response.text();

        if (!responseText) {
            return {};
        }

        try {
            return JSON.parse(responseText);
        } catch {
            return {
                message: responseText,
            };
        }
    };

    const handleLogin = async () => {
        setError("");

        if (!phone) {
            setError(
                "Phone number is missing. Please start again."
            );
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API}/driver-auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        phoneNumber: phone,
                        password,
                    }),
                }
            );

            const data = await readResponse(response);

            if (!response.ok || !data.success) {
                setError(
                    data.message
                    || data.details
                    || "Login failed. Please try again."
                );
                return;
            }

            clearPreviousSession();

            saveSessionValue("userId", data.userId);

            saveSessionValue(
                "driverName",
                data.fullName || "Driver"
            );

            saveSessionValue(
                "fullName",
                data.fullName || "Driver"
            );

            if (
                data.nextStep === "APPLICATION_STATUS"
            ) {
                if (!data.applicantToken) {
                    setError(
                        "Applicant session was not created."
                    );
                    return;
                }

                saveSessionValue(
                    "activeMode",
                    "DRIVER_APPLICANT"
                );

                saveSessionValue(
                    "applicantToken",
                    data.applicantToken
                );

                saveSessionValue(
                    "applicationStatus",
                    data.applicationStatus
                );

                saveSessionValue(
                    "canGoOnline",
                    data.canGoOnline
                );

                saveSessionValue(
                    "walletEnabled",
                    data.walletEnabled
                );

                saveSessionValue(
                    "canViewRideOffers",
                    data.canViewRideOffers
                );

                navigate(
                    "/driver-application-status",
                    {
                        replace: true,
                    }
                );

                return;
            }

            if (!data.driverId) {
                setError(
                    "Approved driver record was not found."
                );
                return;
            }

            sessionStorage.setItem(
                "velocitySession",
                JSON.stringify({
                    token: data.sessionToken,
                    userId: data.userId,
                    activeMode: data.activeMode,
                    driverId: data.driverId,
                    expiresAt: data.sessionExpiresAt,
                })
            );

            saveSessionValue(
                "activeMode",
                "DRIVER"
            );

            saveSessionValue(
                "driverId",
                data.driverId
            );

            saveSessionValue(
                "canGoOnline",
                data.canGoOnline
            );

            saveSessionValue(
                "walletEnabled",
                data.walletEnabled
            );

            saveSessionValue(
                "canViewRideOffers",
                data.canViewRideOffers
            );

            saveSessionValue(
                "isAdmin",
                data.isAdmin
            );

            if (data.isAdmin && data.adminToken) {
                saveSessionValue(
                    "adminToken",
                    data.adminToken
                );
            }

            navigate(
                "/driver-dashboard",
                {
                    replace: true,
                }
            );

        } catch (requestError) {
            console.error(requestError);

            setError(
                "Unable to connect to server."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page auth-page">
            <VelocityMark className="auth-logo" />

            <div className="card">

                <div className="icon-circle">
                    <Lock size={36} color="white" />
                </div>

                <h1 className="title">
                    Enter your password
                </h1>

                <p className="subtitle">
                    Welcome back! Enter your password
                    to continue.
                </p>

                <div className="password-input">

                    <input
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        placeholder="Password"
                        autoFocus
                        value={password}
                        disabled={loading}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (
                                event.key === "Enter"
                                && !loading
                            ) {
                                handleLogin();
                            }
                        }}
                    />

                    <button
                        type="button"
                        className="eye-btn"
                        disabled={loading}
                        onClick={() =>
                            setShowPassword(
                                (current) => !current
                            )
                        }
                        aria-label={
                            showPassword
                                ? "Hide password"
                                : "Show password"
                        }
                    >
                        {
                            showPassword
                                ? <EyeOff size={20} />
                                : <Eye size={20} />
                        }
                    </button>

                </div>

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                <button
                    className="primary-btn"
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {
                        loading
                            ? "Logging in..."
                            : "Login"
                    }
                </button>

            </div>

        </div>
    );
}

export default DriverPassword;
