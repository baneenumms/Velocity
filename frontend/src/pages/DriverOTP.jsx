import { apiBaseUrl } from "../config/api.js";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import "./OTP.css";
import VelocityMark from "../components/VelocityMark";
import OtpInputGroup from "../components/OtpInputGroup";

function DriverOTP() {

    const navigate = useNavigate();
    const location = useLocation();

    const { phone, maskedEmail } = location.state || {};

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [otpFailed, setOtpFailed] = useState(false);

    const handleVerify = async () => {

        setError("");

        const code = otp.join("");

        if (code.length !== 6) {
            setError("Please enter the complete OTP.");
            return;
        }

        try {

            const response = await fetch(
                `${apiBaseUrl}/driver-auth/verify-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        phoneNumber: phone,
                        otp: code,
                    }),
                }
            );

            const data = await response.json();

            if (!data.success) {
                setError("Incorrect OTP. Please request a new code.");
                setOtpFailed(true);
                return;
            }

            navigate("/otp-verified", {
                state: {
                    phone,
                },
            });

        } catch (err) {

            console.error(err);
            setError("Unable to connect to server.");

        }
    };

    const handleTryAgain = () => {
        navigate("/driver-phone");
    };

    return (

        <div className="page auth-page">
            <VelocityMark className="auth-logo" />

            <div className="card">

                <div className="icon-circle">
                    <Mail size={36} color="white" />
                </div>

                <h1 className="title">
                    Email Verification
                </h1>

                <p className="subtitle">
                    Enter the 6-digit code sent to
                </p>

                <p className="email-text">
                    {maskedEmail}
                </p>

                <OtpInputGroup
                    value={otp}
                    onChange={(nextOtp) => {
                        setOtp(nextOtp);
                        setError("");
                    }}
                    onSubmit={handleVerify}
                    disabled={otpFailed}
                />

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                {otpFailed ? (
                    <button
                        className="primary-btn"
                        onClick={handleTryAgain}
                    >
                        Try Again
                    </button>
                ) : (
                    <button
                        className="primary-btn"
                        onClick={handleVerify}
                    >
                        Verify OTP
                    </button>
                )}

            </div>

        </div>

    );

}

export default DriverOTP;
