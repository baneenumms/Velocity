import { ChevronDown } from "lucide-react";
import "./PassengerProfile.css";

function PassengerProfile() {
  const passengerName = sessionStorage.getItem("passengerName") || "Passenger";
  const passengerPhone = sessionStorage.getItem("passengerPhone") || "Not available";
  const passengerEmail = sessionStorage.getItem("passengerEmail") || "Not available";
  const passengerId = sessionStorage.getItem("passengerId") || "Not available";

  const initials = passengerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="passenger-profile-page">
      <main className="passenger-profile-content">
        <section className="passenger-profile-title">
          <p>Your account</p>
          <h1>My Profile</h1>
        </section>

        <section className="passenger-profile-card">
          <header className="passenger-profile-identity">
            <div className="passenger-profile-avatar" aria-hidden="true">
              {initials}
            </div>
            <div>
              <span>Passenger Account</span>
              <h2>{passengerName}</h2>
              <p>Passenger #{passengerId}</p>
            </div>
          </header>

          <details className="passenger-profile-section" open>
            <summary>
              <span>Personal Details</span>
              <ChevronDown size={21} />
            </summary>

            <div className="passenger-profile-information">
              <div>
                <span>Passenger ID</span>
                <strong>{passengerId}</strong>
              </div>
              <div>
                <span>Full name</span>
                <strong>{passengerName}</strong>
              </div>
              <div>
                <span>Phone number</span>
                <strong>{passengerPhone}</strong>
              </div>
              <div>
                <span>Email address</span>
                <strong>{passengerEmail}</strong>
              </div>
            </div>
          </details>
        </section>
      </main>
    </div>
  );
}

export default PassengerProfile;