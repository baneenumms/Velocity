import { apiBaseUrl } from "../config/api.js";
import { useEffect, useRef, useState } from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";
import { Mail } from "lucide-react";
import "./OTP.css";
import VelocityMark from "../components/VelocityMark";

const API = apiBaseUrl;

function DriverSignupOTP() {

    const location = useLocation();
    const navigate = useNavigate();

    const {
        phone,
        maskedEmail,
        registrationToken,
    } = location.state || {};

    const [otp, setOtp] =
        useState(["", "", "", "", "", ""]);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const inputs = useRef([]);

    useEffect(() => { inputs.current[0]?.focus(); }, []);

    const handleChange = (value, index) => {

        if (!/^\d?$/.test(value)) {
            return;
        }

        const nextOtp = [...otp];
        nextOtp[index] = value;

        setOtp(nextOtp);

        if (value && index < nextOtp.length - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (event, index) => {

        if (event.key === "Enter") {
            handleVerify();
            return;
        }

        if (
            event.key === "Backspace"
            && !otp[index]
            && index > 0
        ) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (event) => {

        const pastedCode = event.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pastedCode) {
            return;
        }

        event.preventDefault();

        const nextOtp = Array(6).fill("");

        pastedCode.split("").forEach((digit, index) => {
            nextOtp[index] = digit;
        });

        setOtp(nextOtp);

        const focusIndex = Math.min(
            pastedCode.length,
            5
        );

        inputs.current[focusIndex]?.focus();
    };

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

    const clearOtherModes = () => {

        localStorage.removeItem("passengerId");
        localStorage.removeItem("driverId");

        localStorage.removeItem("isAdmin");
        localStorage.removeItem("adminToken");
    };

    const handleVerify = async () => {

        setError("");

        if (!registrationToken) {
            setError(
                "Registration session is missing. Please start again."
            );
            return;
        }

        const code = otp.join("");

        if (!/^\d{6}$/.test(code)) {
            setError("Please enter the complete 6-digit OTP.");
            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                `${API}/driver-registration/signup/verify-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        registrationToken,
                        otp: code,
                    }),
                }
            );

            const data = await readResponse(response);

            if (!response.ok || !data.success) {
                setError(
                    data.message
                    || data.details
                    || "Incorrect or expired OTP."
                );
                return;
            }

            if (!data.applicantToken) {
                setError(
                    "Applicant session was not created."
                );
                return;
            }

            clearOtherModes();

            localStorage.setItem(
                "activeMode",
                "DRIVER_APPLICANT"
            );

            localStorage.setItem(
                "applicantToken",
                data.applicantToken
            );

            localStorage.setItem(
                "userId",
                String(data.userId)
            );

            localStorage.setItem(
                "applicationStatus",
                data.applicationStatus
            );

            localStorage.setItem(
                "canGoOnline",
                String(data.canGoOnline)
            );

            localStorage.setItem(
                "walletEnabled",
                String(data.walletEnabled)
            );

            navigate(
                "/driver-application-status",
                {
                    replace: true,
                    state: {
                        phone,
                    },
                }
            );

        } catch (requestError) {

            console.error(requestError);

            setError(
                "Unable to connect to the verification server."
            );

        } finally {

            setLoading(false);

        }
    };

    const handleStartAgain = () => {

        navigate(
            "/driver-phone",
            {
                replace: true,
            }
        );

    };

    if (!registrationToken) {

        return (

            <div className="page">

                <div className="card">

                    <h1 className="title">
                        Registration session unavailable
                    </h1>

                    <p className="subtitle">
                        Please begin driver registration again.
                    </p>

                    <button
                        className="primary-btn"
                        onClick={handleStartAgain}
                    >
                        Start Again
                    </button>

                </div>

            </div>

        );

    }

    return (

        <div className="page auth-page">
            <VelocityMark className="auth-logo" />

            <div className="card">

                <div className="icon-circle">
                    <Mail size={36} color="white" />
                </div>

                <h1 className="title">
                    Verify your email
                </h1>

                <p className="subtitle">
                    Enter the 6-digit registration code sent to
                </p>

                <p className="email-text">
                    {maskedEmail || "your email address"}
                </p>

                <div
                    className="otp-container"
                    onPaste={handlePaste}
                >

                    {otp.map((digit, index) => (

                        <input
                            key={index}
                            ref={(element) => {
                                inputs.current[index] = element;
                            }}
                            className="otp-box"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete={
                                index === 0
                                    ? "one-time-code"
                                    : "off"
                            }
                            maxLength={1}
                            value={digit}
                            disabled={loading}
                            onChange={(event) =>
                                handleChange(
                                    event.target.value,
                                    index
                                )
                            }
                            onKeyDown={(event) =>
                                handleKeyDown(event, index)
                            }
                        />

                    ))}

                </div>

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                <button
                    className="primary-btn"
                    onClick={handleVerify}
                    disabled={loading}
                >
                    {
                        loading
                            ? "Verifying..."
                            : "Verify and Continue"
                    }
                </button>

            </div>

        </div>

    );

}

export default DriverSignupOTP;
