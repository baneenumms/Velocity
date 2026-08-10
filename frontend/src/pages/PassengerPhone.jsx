import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";
import "./Phone.css";
import VelocityMark from "../components/VelocityMark";

function PassengerPhone() {

    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleContinue = async () => {

        setError("");

        if (phone.length !== 10) {
            setError("Please enter a valid phone number.");
            return;
        }

        const formattedPhone = "0" + phone;

        setLoading(true);

        try {

            const response = await fetch(
                "http://localhost:8080/passenger-auth/check-phone",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        phoneNumber: formattedPhone,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message || "Unable to check phone number."
                );
                return;
            }

            if (!data.exists) {

                navigate("/passenger-signup", {
                    state: {
                        phone: formattedPhone,
                    },
                });

                return;
            }

            if (!data.success) {
                setError(
                    data.message || "Unable to send OTP."
                );
                return;
            }

            navigate("/otp-sent", {
                state: {
                    phone: formattedPhone,
                    maskedEmail: data.maskedEmail,
                    nextRoute: "/passenger-otp",
                },
            });

        } catch (err) {

            console.error(err);
            setError("Unable to connect to server.");

        } finally {

            setLoading(false);

        }
    };

    return (

        <div className="page auth-page">
            <VelocityMark className="auth-logo" />

            <div className="card">

                <div className="icon-circle">
                    <Phone size={36} color="white" />
                </div>

                <h1 className="title">
                    Enter your phone number
                </h1>

                <p className="subtitle">
                    We'll check if you're already registered.
                </p>

                <div className="phone-input">

                    <span className="country-code">
                        🇵🇰 +92
                    </span>

                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="3001234567"
                        value={phone}
                        maxLength={10}
                        autoFocus
                        disabled={loading}
                        onChange={(e) =>
                            setPhone(
                                e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 10)
                            )
                        }
                        onKeyDown={(e) => {
                            if (
                                e.key === "Enter" &&
                                !loading
                            ) {
                                handleContinue();
                            }
                        }}
                    />

                </div>

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                <button
                    type="button"
                    className="primary-btn"
                    onClick={handleContinue}
                    disabled={loading}
                >
                    {loading
                        ? "Sending OTP..."
                        : "Continue"
                    }
                </button>

            </div>

        </div>

    );

}

export default PassengerPhone;
