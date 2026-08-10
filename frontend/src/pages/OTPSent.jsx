import { useEffect } from "react";
import {
    useLocation,
    useNavigate
} from "react-router-dom";
import "./OTPSent.css";
import VelocityMark from "../components/VelocityMark";

function OTPSent() {

    const navigate = useNavigate();
    const location = useLocation();

    const {
        phone,
        maskedEmail,
        nextRoute = "/driver-otp"
    } = location.state || {};

    useEffect(() => {

        if (!phone) {
            navigate("/");
            return;
        }

        const timer = setTimeout(() => {

            navigate(nextRoute, {
                state: {
                    phone,
                    maskedEmail,
                },
            });

        }, 2000);

        return () => clearTimeout(timer);

    }, [
        navigate,
        phone,
        maskedEmail,
        nextRoute
    ]);

    return (

        <div className="page auth-page">
            <VelocityMark className="auth-logo" />

            <div className="card status-card">

                <div className="status-circle">
                    ✉
                </div>

                <h1 className="title">
                    Email Verification
                </h1>

                <p className="subtitle">
                    We've sent a 6-digit verification
                    code to
                </p>

                <h2 className="email">
                    {maskedEmail ||
                        "your registered email"}
                </h2>

            </div>

        </div>

    );

}

export default OTPSent;
