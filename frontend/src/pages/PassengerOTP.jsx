import {
    useRef,
    useState
} from "react";
import {
    useLocation,
    useNavigate
} from "react-router-dom";
import { Mail } from "lucide-react";
import "./OTP.css";

function PassengerOTP() {

    const navigate = useNavigate();
    const location = useLocation();

    const {
        phone,
        maskedEmail
    } = location.state || {};

    const [otp, setOtp] = useState([
        "",
        "",
        "",
        "",
        "",
        ""
    ]);

    const [error, setError] = useState("");
    const [otpFailed, setOtpFailed] =
        useState(false);
    const [loading, setLoading] =
        useState(false);

    const inputs = useRef([]);

    const handleChange = (value, index) => {

        if (!/^\d?$/.test(value)) {
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;

        setOtp(newOtp);

        if (value && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {

        if (
            e.key === "Backspace" &&
            otp[index] === "" &&
            index > 0
        ) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {

        setError("");

        if (!phone) {
            setError(
                "Phone number is missing. Please start again."
            );
            return;
        }

        const code = otp.join("");

        if (code.length !== 6) {
            setError(
                "Please enter the complete OTP."
            );
            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                "http://localhost:8080/passenger-auth/verify-otp",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        phoneNumber: phone,
                        otp: code,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                setError(
                    data.message ||
                    "Incorrect OTP. Please request a new code."
                );

                setOtpFailed(true);
                return;
            }

            localStorage.setItem(
                "userId",
                String(data.userId)
            );

            localStorage.setItem(
                "passengerId",
                String(data.passengerId)
            );

            localStorage.setItem(
                "passengerName",
                data.fullName || "Passenger"
            );

            localStorage.setItem(
                "passengerPhone",
                data.phoneNumber || phone
            );

            localStorage.setItem(
                "passengerEmail",
                data.email || ""
            );

            navigate("/otp-verified", {
                state: {
                    phone,
                    nextRoute:
                        "/passenger-dashboard",
                    verifiedMessage:
                        "Your passenger account has been verified successfully.",
                },
            });

        } catch (err) {

            console.error(err);
            setError(
                "Unable to connect to server."
            );

        } finally {

            setLoading(false);

        }
    };

    const handleTryAgain = () => {
        navigate("/passenger-phone");
    };

    return (

        <div className="page">

            <div className="velocity-title">
                <span className="velo">VEL</span>

                <span className="wheel">
                    <span className="hub"></span>
                </span>

                <span className="city">CITY</span>
            </div>

            <div className="card">

                <div className="icon-circle">
                    <Mail
                        size={36}
                        color="white"
                    />
                </div>

                <h1 className="title">
                    Email Verification
                </h1>

                <p className="subtitle">
                    Enter the 6-digit code sent to
                </p>

                <p className="email-text">
                    {maskedEmail ||
                        "your registered email"}
                </p>

                <div className="otp-container">

                    {otp.map((digit, index) => (

                        <input
                            key={index}
                            ref={(el) =>
                                inputs.current[index] = el
                            }
                            className="otp-box"
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            disabled={
                                otpFailed || loading
                            }
                            onChange={(e) =>
                                handleChange(
                                    e.target.value,
                                    index
                                )
                            }
                            onKeyDown={(e) =>
                                handleKeyDown(
                                    e,
                                    index
                                )
                            }
                        />

                    ))}

                </div>

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                {otpFailed ? (

                    <button
                        type="button"
                        className="primary-btn"
                        onClick={handleTryAgain}
                    >
                        Try Again
                    </button>

                ) : (

                    <button
                        type="button"
                        className="primary-btn"
                        onClick={handleVerify}
                        disabled={loading}
                    >
                        {loading
                            ? "Verifying..."
                            : "Verify OTP"
                        }
                    </button>

                )}

            </div>

        </div>

    );

}

export default PassengerOTP;