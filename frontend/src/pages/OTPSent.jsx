import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./OTPSent.css";

function OTPSent() {

    const navigate = useNavigate();
    const location = useLocation();

    const { phone, maskedEmail } = location.state || {};

    useEffect(() => {

        const timer = setTimeout(() => {

            navigate("/driver-otp", {
                state: {
                    phone,
                    maskedEmail
                }
            });

        }, 2000);

        return () => clearTimeout(timer);

    }, [navigate, phone, maskedEmail]);

    return (

        <div className="page">

            <div className="velocity-title">
                <span className="velo">VEL</span>
                <span className="wheel">
                    <span className="hub"></span>
                </span>
                <span className="city">CITY</span>
            </div>

            <div className="card status-card">

                <div className="status-circle">
                    ✉
                </div>

                <h1 className="title">
                    Email Verification
                </h1>

                <p className="subtitle">
                    We've sent a 6-digit verification code to
                </p>

                <h2 className="email">
                    {maskedEmail}
                </h2>

            </div>

        </div>

    );

}

export default OTPSent;