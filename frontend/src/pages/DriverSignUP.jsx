import { useLocation } from "react-router-dom";
import { UserRoundPlus } from "lucide-react";
import "./DriverSignUP.css";

function DriverSignUP() {

    const location = useLocation();

    const { phone } = location.state || {};

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
                    <UserRoundPlus size={36} color="white" />
                </div>

                <h1 className="title">
                    Driver Registration
                </h1>

                <p className="subtitle">
                    No driver account was found for this phone number.
                </p>

                <div className="signup-phone">

                    Registered Phone

                    <strong>{phone}</strong>

                </div>

                <p className="coming-text">
                    Driver registration will be available soon.
                </p>

            </div>

        </div>

    );

}

export default DriverSignUP;