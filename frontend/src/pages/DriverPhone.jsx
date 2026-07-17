import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";
import "./DriverPhone.css";

function DriverPhone() {

    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleContinue = async () => {

        setError("");

        if (phone.length !== 10) {
            setError("Please enter a valid phone number.");
            return;
        }

        const formattedPhone = "0" + phone;

        try {

            // Check if phone exists
            const checkResponse = await fetch(
                "http://localhost:8080/driver-auth/check-phone",
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

            const checkData = await checkResponse.json();

            if (!checkData.exists) {

                navigate("/driver-signup", {
                    state: {
                        phone: formattedPhone,
                    },
                });

                return;
            }

            // Send OTP
            const otpResponse = await fetch(
                "http://localhost:8080/driver-auth/send-otp",
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

            const otpData = await otpResponse.json();

            if (!otpData.success) {
                setError(otpData.message);
                return;
            }

            navigate("/otp-sent", {
                state: {
                    phone: formattedPhone,
                    maskedEmail: otpData.maskedEmail,
                },
            });

        } catch (err) {

            console.error(err);
            setError("Unable to connect to server.");

        }
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
                        placeholder="3001234567"
                        value={phone}
                        maxLength={10}
                        onChange={(e) =>
                            setPhone(
                                e.target.value.replace(/\D/g, "")
                            )
                        }
                    />

                </div>

                {error && (
                    <p className="error">{error}</p>
                )}

                <button
                    className="primary-btn"
                    onClick={handleContinue}
                >
                    Continue
                </button>

            </div>

        </div>

    );

}

export default DriverPhone;