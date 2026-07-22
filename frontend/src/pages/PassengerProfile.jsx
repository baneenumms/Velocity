import { useNavigate } from "react-router-dom";
import PassengerHamburgerMenu from "../components/PassengerHamburgerMenu";
import "./PassengerProfile.css";

function PassengerProfile() {
  const navigate = useNavigate();

  const passengerName =
    localStorage.getItem("passengerName") || "Passenger";

  const passengerPhone =
    localStorage.getItem("passengerPhone") || "Not available";

  const passengerEmail =
    localStorage.getItem("passengerEmail") || "Not available";

  const passengerId =
    localStorage.getItem("passengerId") || "Not available";

  return (
    <div className="passenger-profile-page">
      <header className="passenger-profile-header">
        <h2>VELOCITY</h2>
        <PassengerHamburgerMenu />
      </header>

      <main className="passenger-profile-content">
        <button
          type="button"
          className="profile-back-button"
          onClick={() => navigate("/passenger-dashboard")}
        >
          ← Back to dashboard
        </button>

        <section className="passenger-profile-card">
          <div className="profile-avatar">
            {passengerName.charAt(0).toUpperCase()}
          </div>

          <h1>{passengerName}</h1>
          <p className="profile-role">Passenger Account</p>

          <div className="profile-information">
            <div className="profile-information-row">
              <span>Passenger ID</span>
              <strong>{passengerId}</strong>
            </div>

            <div className="profile-information-row">
              <span>Full name</span>
              <strong>{passengerName}</strong>
            </div>

            <div className="profile-information-row">
              <span>Phone number</span>
              <strong>{passengerPhone}</strong>
            </div>

            <div className="profile-information-row">
              <span>Email address</span>
              <strong>{passengerEmail}</strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PassengerProfile;