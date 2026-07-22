import { useEffect } from "react";
import {
    useLocation,
    useNavigate
} from "react-router-dom";
import { CircleCheckBig } from "lucide-react";
import "./OTPVerified.css";

function OTPVerified() {

    const navigate = useNavigate();
    const location = useLocation();

    const {
        phone,
        nextRoute = "/driver-password",
        verifiedMessage =
            "Your email has been verified successfully."
    } = location.state || {};

    useEffect(() => {

        if (!phone) {
            navigate("/");
            return;
        }

        const timer = setTimeout(() => {

            navigate(nextRoute, {
                state: {
                    phone
                }
            });

        }, 2000);

        return () => clearTimeout(timer);

    }, [
        navigate,
        phone,
        nextRoute
    ]);

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

                <div className="success-circle">
                    <CircleCheckBig
                        size={42}
                        color="white"
                    />
                </div>

                <h1 className="title">
                    OTP Verified
                </h1>

                <p className="subtitle">
                    {verifiedMessage}
                </p>

            </div>

        </div>

    );

}

export default OTPVerified;