import { useNavigate } from "react-router-dom";
import { CarFront, User } from "lucide-react";
import "./RoleSelection.css";

function RoleSelection() {

  const navigate = useNavigate();

  return (

    <div className="page">

      <div className="glow glow-blue"></div>
      <div className="glow glow-pink"></div>

      <div className="velocity-title">
        <span className="velo">VEL</span>
        <span className="wheel">
          <span className="hub"></span>
        </span>
        <span className="city">CITY</span>
      </div>

      <div className="card">

        <h1 className="title">
          Choose your role
        </h1>

        <p className="subtitle">
          Select how you'd like to use Velocity.
        </p>

        <button
          className="role-btn"
          onClick={() => navigate("/driver-phone")}
        >
          <CarFront size={26} />
          Driver
        </button>

        <button
          className="role-btn disabled"
          disabled
        >
          <User size={26} />
          Passenger
          <span className="coming-soon">
            Coming Soon
          </span>
        </button>

      </div>

    </div>

  );

}

export default RoleSelection;