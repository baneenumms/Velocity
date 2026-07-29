import { useNavigate } from "react-router-dom";
import {
  CarFront,
  ChevronRight,
  UserRound,
} from "lucide-react";

import "./RoleSelection.css";

function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="role-page">
      <div className="velocity-title role-logo">
        <span className="velo">VEL</span>

        <span className="wheel">
          <span className="hub" />
        </span>

        <span className="city">CITY</span>
      </div>

      <main className="role-card">
        <h1>Choose your role</h1>

        <p className="role-subtitle">
          Select how you would like to use Velocity.
        </p>

        <div className="role-options">
          <button
            type="button"
            className="role-option driver-option"
            onClick={() => navigate("/driver-phone")}
          >
            <span className="role-icon driver-icon">
              <CarFront size={27} strokeWidth={2} />
            </span>

            <span className="role-content">
              <strong>Driver</strong>

              <small>
                Accept rides and earn by driving.
              </small>
            </span>

            <ChevronRight
              className="role-arrow"
              size={22}
              strokeWidth={2.2}
            />
          </button>

          <button
            type="button"
            className="role-option passenger-option"
            onClick={() => navigate("/passenger-phone")}
          >
            <span className="role-icon passenger-icon">
              <UserRound size={27} strokeWidth={2} />
            </span>

            <span className="role-content">
              <strong>Passenger</strong>

              <small>Book a ride.</small>
            </span>

            <ChevronRight
              className="role-arrow"
              size={22}
              strokeWidth={2.2}
            />
          </button>
        </div>
      </main>
    </div>
  );
}

export default RoleSelection;