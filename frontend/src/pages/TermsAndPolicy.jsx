import { useNavigate } from "react-router-dom";
import PassengerHamburgerMenu from "../components/PassengerHamburgerMenu";
import "./TermsAndPolicy.css";

function TermsAndPolicy() {
  const navigate = useNavigate();

  return (
    <div className="terms-page">
      <header className="terms-header">
        <h2>VELOCITY</h2>
        <PassengerHamburgerMenu />
      </header>

      <main className="terms-content">
        <button
          type="button"
          className="terms-back-button"
          onClick={() => navigate("/passenger-dashboard")}
        >
          ← Back to dashboard
        </button>

        <section className="terms-title">
          <p>Velocity passenger application</p>
          <h1>Terms and Policy</h1>
        </section>

        <section className="terms-card">
          <article>
            <h2>1. Using Velocity</h2>
            <p>
              Velocity allows passengers to request rides from
              available drivers. Passengers must provide accurate
              account, pickup and destination information when
              using the application.
            </p>
          </article>

          <article>
            <h2>2. Passenger account</h2>
            <p>
              Passengers are responsible for protecting access to
              their account and for ensuring that their registered
              phone number and email address remain accurate.
            </p>
          </article>

          <article>
            <h2>3. Ride requests</h2>
            <p>
              A ride request is not confirmed until a driver
              accepts it. Pickup times, routes, estimated travel
              times and fares may change because of traffic, road
              conditions or location accuracy.
            </p>
          </article>

          <article>
            <h2>4. Fare offers</h2>
            <p>
              The application may provide a suggested fare based
              on route distance and estimated travel time. The
              passenger may choose from the available fare
              options before requesting a ride.
            </p>
          </article>

          <article>
            <h2>5. Cancellations</h2>
            <p>
              Passengers should cancel unwanted rides as early as
              possible. Repeated misuse, false requests or
              intentional disruption may result in account
              restrictions.
            </p>
          </article>

          <article>
            <h2>6. Safety</h2>
            <p>
              Passengers should confirm the driver's name,
              vehicle and plate number before entering a vehicle.
              Passengers must not use the application for illegal,
              dangerous or abusive activities.
            </p>
          </article>

          <article>
            <h2>7. Location information</h2>
            <p>
              Velocity requests location access to select the
              passenger's current pickup point, display maps,
              calculate routes and estimate distance. Passengers
              may deny location access and enter their pickup
              manually.
            </p>
          </article>

          <article>
            <h2>8. Saved locations</h2>
            <p>
              Locations saved through the current prototype are
              stored in the passenger's browser. They may be lost
              if browser data is cleared or the application is
              opened on another device.
            </p>
          </article>

          <article>
            <h2>9. Privacy</h2>
            <p>
              Passenger information should only be used for
              account authentication, ride booking, communication,
              safety and application improvement. Sensitive
              information should not be shared unnecessarily.
            </p>
          </article>

          <article>
            <h2>10. Prototype notice</h2>
            <p>
              Velocity is currently an internship prototype.
              Features, pricing logic, policies and data storage
              may change as development continues.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}

export default TermsAndPolicy;