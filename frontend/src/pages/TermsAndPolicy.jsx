import { ChevronDown, FileCheck2, ShieldCheck } from "lucide-react";
import "./TermsAndPolicy.css";

const policies = [
  {
    title: "Accounts, eligibility, and authentication",
    content: (
      <>
        <p>
          Use accurate contact and identity information and keep access to your account,
          password, verification codes, and active session secure. Do not let another
          person use your account or impersonate a passenger, driver, or administrator.
        </p>
        <p>
          Drivers must submit accurate CNIC, driving-licence, and vehicle information.
          A driver account can only provide rides after its application has been approved.
        </p>
      </>
    ),
  },
  {
    title: "Ride requests and driver offers",
    content: (
      <>
        <p>
          A passenger publishes a ride request with pickup, destination, payment preference,
          and proposed fare. Eligible nearby drivers can view that request and submit their
          own fare offers. A ride is confirmed only when the passenger accepts an offer.
        </p>
        <p>
          Route distance, travel time, and suggested pricing are estimates. Traffic, road
          conditions, GPS accuracy, and changes to the journey can affect the real trip.
        </p>
      </>
    ),
  },
  {
    title: "Ride confirmation and start PIN",
    content: (
      <>
        <p>
          Before entering the vehicle, the passenger should verify the driver, vehicle,
          and plate number shown in Velocity. The passenger should share the ride-start PIN
          only after meeting the correct driver and being ready to begin the trip.
        </p>
        <p>
          The ride starts only after the driver enters the correct PIN. Users must not ask
          for, disclose, or reuse a PIN outside its intended ride.
        </p>
      </>
    ),
  },
  {
    title: "Driver wallet and platform-fee reservations",
    content: (
      <>
        <p>
          When a passenger accepts an offer, Velocity temporarily reserves 12% of the agreed
          fare in the driver wallet. The reserved amount is not available for another ride
          while that reservation is active, and insufficient available balance can prevent
          a new offer from being accepted.
        </p>
        <p>
          Once a ride is in progress or completed, the platform fee becomes payable according
          to the trip schedule shown by the service. Wallet screens distinguish total,
          reserved, and available balances so drivers can see what may currently be used.
        </p>
      </>
    ),
  },
  {
    title: "Cancellations and the 5% driver fee",
    content: (
      <>
        <p>
          A driver can withdraw a pending offer before the passenger accepts it without a
          cancellation fee. If a driver cancels an accepted ride before it starts, Velocity
          releases the 12% platform-fee reservation and deducts 5% of the agreed fare from
          the driver wallet as a cancellation fee.
        </p>
        <p>
          If the passenger cancels before the ride starts, the driver reservation is released
          without charging that driver cancellation fee. Normal pre-start cancellation is not
          available after a ride has begun.
        </p>
      </>
    ),
  },
  {
    title: "Payments and wallet top-ups",
    content: (
      <>
        <p>
          Drivers must submit genuine payment details and a unique reference when requesting
          a wallet top-up. A top-up affects the wallet only after the applicable approval flow
          succeeds. Duplicate, inaccurate, reversed, or suspicious payment information may be
          rejected and reviewed by an administrator.
        </p>
        <p>
          Passengers and drivers remain responsible for any cash or external payment they
          exchange. Velocity records the selected payment preference but does not guarantee
          an external payment provider or cash settlement.
        </p>
      </>
    ),
  },
  {
    title: "Safety, conduct, and account review",
    content: (
      <>
        <p>
          Do not use Velocity for unlawful, dangerous, discriminatory, abusive, fraudulent,
          or disruptive activity. Avoid false ride requests, unsafe driving, harassment, and
          attempts to manipulate fares, wallets, feedback, or account status.
        </p>
        <p>
          Administrators may review driver applications, corrections, wallet top-ups, ride
          feedback, and related account information. Accounts may be suspended or reactivated
          when needed for safety, integrity, or policy enforcement. Administrators are not
          shown user passwords or one-time verification codes through the review panels.
        </p>
      </>
    ),
  },
  {
    title: "Location, saved places, feedback, and privacy",
    content: (
      <>
        <p>
          Velocity uses entered or device-provided location data to show maps, create routes,
          estimate distance, and match ride requests. Location permission can be denied and
          an address entered manually. Saved places in this prototype may be stored only in
          the current browser and can disappear when browser data is cleared or devices change.
        </p>
        <p>
          Ride feedback is private rather than a public review. It can be viewed by authorized
          administrators for support and moderation together with relevant ride and account
          context. Never place passwords, PINs, banking credentials, or other unnecessary
          sensitive data in feedback or notes.
        </p>
      </>
    ),
  },
  {
    title: "Availability, records, and prototype notice",
    content: (
      <>
        <p>
          Network access, maps, GPS, external services, and device settings can affect service
          availability. Ride, offer, wallet, and application statuses may update as the backend
          processes an action. Users should refresh or reconnect before repeating a payment or
          other sensitive operation.
        </p>
        <p>
          Velocity is an evolving internship prototype. Features, pricing logic, fees, storage,
          and these operating terms may change before a public launch. This page explains the
          current product behaviour and is not a substitute for review by qualified legal,
          privacy, payments, and transportation advisers before deployment.
        </p>
      </>
    ),
  },
];

function TermsAndPolicy() {
  const activeMode = (
    sessionStorage.getItem("activeMode") ||
    localStorage.getItem("activeMode") ||
    "PASSENGER"
  ).toUpperCase();

  return (
    <div className="terms-page">
      <main className="terms-content">
        <section className="terms-title">
          <p>Velocity policies</p>
          <h1>Terms and Policy</h1>
        </section>

        <section className="terms-intro-card">
          <div className="terms-intro-icon" aria-hidden="true">
            <ShieldCheck size={28} />
          </div>
          <div>
            <span>{activeMode === "DRIVER" ? "Driver" : "Passenger"} guidance</span>
            <h2>Know how the current Velocity model works</h2>
            <p>
              These sections explain ride offers, confirmations, wallet reservations,
              cancellations, safety, data use, and administrative review in the current build.
            </p>
          </div>
        </section>

        <section className="terms-policy-list" aria-label="Velocity terms and policies">
          {policies.map((policy, index) => (
            <details className="terms-policy-card" key={policy.title} open={index === 0}>
              <summary>
                <span className="terms-policy-number">
                  <FileCheck2 size={19} />
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{policy.title}</strong>
                <ChevronDown size={22} />
              </summary>
              <div className="terms-policy-copy">{policy.content}</div>
            </details>
          ))}
        </section>

        <p className="terms-version-note">
          Current product-policy summary · Review before public deployment
        </p>
      </main>
    </div>
  );
}

export default TermsAndPolicy;