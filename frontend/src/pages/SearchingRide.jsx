import { apiBaseUrl } from "../config/api.js";
import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "./SearchingRide.css";

const BACKEND_URL =
  apiBaseUrl;

const POLL_MS = 3000;
const FIVE_MINUTES =
  5 * 60 * 1000;
const TEN_MINUTES =
  10 * 60 * 1000;
const FIFTEEN_MINUTES =
  15 * 60 * 1000;

function getRequestId() {
  const storedId =
    sessionStorage.getItem(
      "rideRequestId"
    );

  if (storedId) {
    return storedId;
  }

  for (const key of [
    "activeRideRequest",
    "passengerRideDraft",
  ]) {
    const value =
      sessionStorage.getItem(key);

    if (!value) {
      continue;
    }

    try {
      const parsed =
        JSON.parse(value);

      if (parsed?.requestId) {
        return String(
          parsed.requestId
        );
      }
    } catch {
      return value;
    }
  }

  return "";
}

function getSavedRide() {
  for (const key of [
    "activeRideRequest",
    "passengerRideDraft",
  ]) {
    const value =
      sessionStorage.getItem(key);

    if (!value) {
      continue;
    }

    try {
      return JSON.parse(value);
    } catch {
      // Check the next key.
    }
  }

  return null;
}

async function readResponse(response) {
  const text = await response.text();

  let data = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.details ||
        text ||
        `Request failed: HTTP ${response.status}`
    );
  }

  return data;
}

function formatFare(value) {
  const fare = Number(value);

  return Number.isFinite(fare)
    ? fare.toLocaleString(
        "en-US",
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }
      )
    : "0";
}

function formatPaymentMethod(value) {
  return value ===
    "DIGITAL_TRANSFER"
    ? "Digital Transfer"
    : "Cash";
}

function dateToMilliseconds(value) {
  if (!value) {
    return null;
  }

  const milliseconds =
    new Date(value).getTime();

  return Number.isFinite(
    milliseconds
  )
    ? milliseconds
    : null;
}

function clearRideStorage() {
  [
    "activeRideRequest",
    "passengerRideDraft",
    "acceptedRide",
    "ridePin",
    "rideRequestId",
    "rideStatus",
    "paymentMethod",
    "searchStartedAt",
    "rideId",
  ].forEach((key) => {
    sessionStorage.removeItem(key);
  });
}

function SearchingRide() {
  const navigate = useNavigate();
  const requestId = getRequestId();

  const passengerId = Number(
    sessionStorage.getItem(
      "passengerId"
    )
  );

  const [initialSavedRide] =
    useState(() => getSavedRide());

  const [
    rideRequest,
    setRideRequest,
  ] = useState(
    initialSavedRide
  );

  const [offers, setOffers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    acceptingOfferId,
    setAcceptingOfferId,
  ] = useState("");

  const [
    cancelling,
    setCancelling,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    currentTime,
    setCurrentTime,
  ] = useState(Date.now());

  const [
    fiveMinutePromptDismissed,
    setFiveMinutePromptDismissed,
  ] = useState(false);

  const createdAtValue =
    rideRequest?.createdAt ||
    initialSavedRide?.createdAt ||
    sessionStorage.getItem(
      "searchStartedAt"
    );

  const createdAtMilliseconds =
    dateToMilliseconds(
      createdAtValue
    );

  const elapsedMilliseconds =
    createdAtMilliseconds
      ? Math.max(
          0,
          currentTime -
            createdAtMilliseconds
        )
      : 0;

  const rideStatus =
    rideRequest?.status ||
    sessionStorage.getItem(
      "rideStatus"
    ) ||
    "SEARCHING";

  const timedOut =
    rideStatus === "EXPIRED" ||
    elapsedMilliseconds >=
      FIFTEEN_MINUTES;

  const requestFinished =
    rideStatus !== "SEARCHING";

  const noOffers =
    offers.length === 0;

  const showFiveMinutePrompt =
    noOffers &&
    elapsedMilliseconds >=
      FIVE_MINUTES &&
    elapsedMilliseconds <
      TEN_MINUTES &&
    !fiveMinutePromptDismissed &&
    !timedOut;

  const showPersistentReminder =
    noOffers &&
    elapsedMilliseconds >=
      FIVE_MINUTES &&
    elapsedMilliseconds <
      TEN_MINUTES &&
    fiveMinutePromptDismissed &&
    !timedOut;

  const showTenMinutePrompt =
    noOffers &&
    elapsedMilliseconds >=
      TEN_MINUTES &&
    elapsedMilliseconds <
      FIFTEEN_MINUTES &&
    !timedOut;

  const remainingMinutes =
    Math.max(
      0,
      Math.ceil(
        (
          FIFTEEN_MINUTES -
          elapsedMilliseconds
        ) / 60000
      )
    );

  useEffect(() => {
    const timerId =
      window.setInterval(
        () => {
          setCurrentTime(
            Date.now()
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        timerId
      );
    };
  }, []);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);

      setError(
        "Your ride request could not be found."
      );

      return undefined;
    }

    if (
      requestFinished ||
      timedOut
    ) {
      setLoading(false);
      return undefined;
    }

    let stopped = false;

    const loadRide = async () => {
      try {
        const [
          requestResponse,
          offersResponse,
        ] = await Promise.all([
          fetch(
            `${BACKEND_URL}/ride-requests/${requestId}`
          ),

          fetch(
            `${BACKEND_URL}/driver-offers/request/${requestId}`
          ),
        ]);

        const requestData =
          await readResponse(
            requestResponse
          );

        const offersData =
          await readResponse(
            offersResponse
          );

        if (stopped) {
          return;
        }

        setRideRequest(
          (current) => {
            const mergedRide = {
              ...initialSavedRide,
              ...current,
              ...requestData,
            };

            sessionStorage.setItem(
              "activeRideRequest",
              JSON.stringify(
                mergedRide
              )
            );

            return mergedRide;
          }
        );

        setOffers(
          Array.isArray(offersData)
            ? offersData
            : []
        );

        sessionStorage.setItem(
          "rideStatus",
          requestData.status ||
            "SEARCHING"
        );

        setError("");
      } catch (loadError) {
        console.error(
          "Searching ride error:",
          loadError
        );

        if (!stopped) {
          setError(
            loadError.message ||
              "Unable to refresh driver offers."
          );
        }
      } finally {
        if (!stopped) {
          setLoading(false);
        }
      }
    };

    loadRide();

    const intervalId =
      window.setInterval(
        loadRide,
        POLL_MS
      );

    return () => {
      stopped = true;

      window.clearInterval(
        intervalId
      );
    };
  }, [
    requestId,
    requestFinished,
    timedOut,
    initialSavedRide,
  ]);

  const handleAcceptOffer =
    async (offerId) => {
      setError("");

      if (
        !Number.isInteger(
          passengerId
        ) ||
        passengerId <= 0
      ) {
        setError(
          "Passenger login information was not found."
        );
        return;
      }

      try {
        setAcceptingOfferId(
          offerId
        );

        const response =
          await fetch(
            `${BACKEND_URL}/driver-offers/${offerId}/accept`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                passengerId,
              }),
            }
          );

        const data =
          await readResponse(
            response
          );

        const acceptedRide = {
          ...rideRequest,
          ...data,
          ridePin:
            data?.ridePin,
        };

        sessionStorage.setItem(
          "acceptedRide",
          JSON.stringify(
            acceptedRide
          )
        );

        sessionStorage.setItem(
          "ridePin",
          data?.ridePin || ""
        );

        sessionStorage.setItem(
          "rideId",
          String(data.rideId)
        );

        sessionStorage.setItem(
          "rideStatus",
          data.status ||
            "ACCEPTED"
        );

        navigate(
          "/passenger-active-ride",
          {
            replace: true,
          }
        );
      } catch (acceptError) {
        console.error(
          "Accept driver offer error:",
          acceptError
        );

        setError(
          acceptError.message ||
            "Unable to accept this offer."
        );
      } finally {
        setAcceptingOfferId("");
      }
    };

  const handleIncreaseFare = () => {
    const currentFare = Number(
      rideRequest?.passengerFare ??
        rideRequest?.requestedFare ??
        initialSavedRide
          ?.passengerFare ??
        initialSavedRide
          ?.requestedFare ??
        0
    );

    const savedRide = {
      ...initialSavedRide,
      ...rideRequest,

      requestedFare:
        currentFare,

      passengerFare:
        currentFare,
    };

    sessionStorage.setItem(
      "activeRideRequest",
      JSON.stringify(
        savedRide
      )
    );

    sessionStorage.setItem(
      "passengerRideDraft",
      JSON.stringify(
        savedRide
      )
    );

    navigate(
      "/passenger-fare",
      {
        state: {
          adjustFare: true,
          requestId,
        },
      }
    );
  };

  const handleKeepSearching = () => {
    setFiveMinutePromptDismissed(
      true
    );
  };

  const handleCancelRequest =
    async () => {
      setError("");

      const confirmed =
        window.confirm(
          "Cancel your ride search?\n\nNearby drivers will no longer be able to view or respond to this request."
        );

      if (!confirmed) {
        return;
      }

      if (
        !Number.isInteger(
          passengerId
        ) ||
        passengerId <= 0
      ) {
        setError(
          "Passenger login information was not found."
        );
        return;
      }

      if (!requestId) {
        setError(
          "Ride request ID was not found."
        );
        return;
      }

      try {
        setCancelling(true);

        const response =
          await fetch(
            `${BACKEND_URL}/ride-requests/${requestId}/cancel?passengerId=${passengerId}`,
            {
              method: "POST",
            }
          );

        await readResponse(
          response
        );

        clearRideStorage();

        navigate(
          "/passenger-dashboard",
          {
            replace: true,
          }
        );
      } catch (cancelError) {
        console.error(
          "Cancel ride request error:",
          cancelError
        );

        setError(
          cancelError.message ||
            "Unable to cancel your ride search."
        );
      } finally {
        setCancelling(false);
      }
    };

  const handleSearchAgain =
    async () => {
      if (
        requestId &&
        Number.isInteger(
          passengerId
        ) &&
        passengerId > 0 &&
        rideStatus === "SEARCHING"
      ) {
        try {
          await fetch(
            `${BACKEND_URL}/ride-requests/${requestId}/cancel?passengerId=${passengerId}`,
            {
              method: "POST",
            }
          );
        } catch {
          // Request may already be expired.
        }
      }

      clearRideStorage();

      navigate(
        "/passenger-dashboard",
        {
          replace: true,
        }
      );
    };

  const pickup =
    rideRequest?.pickupAddress ||
    rideRequest?.pickupName ||
    initialSavedRide
      ?.pickupAddress ||
    initialSavedRide
      ?.pickupName ||
    "Pickup location unavailable";

  const destination =
    rideRequest?.dropoffAddress ||
    rideRequest?.dropoffName ||
    initialSavedRide
      ?.dropoffAddress ||
    initialSavedRide
      ?.dropoffName ||
    "Destination unavailable";

  const requestedFare =
    rideRequest?.passengerFare ??
    rideRequest?.requestedFare ??
    initialSavedRide
      ?.passengerFare ??
    initialSavedRide
      ?.requestedFare ??
    0;

  const paymentMethod =
    rideRequest?.paymentMethod ||
    initialSavedRide
      ?.paymentMethod ||
    sessionStorage.getItem(
      "paymentMethod"
    ) ||
    "CASH";

  if (
    loading &&
    !rideRequest
  ) {
    return (
      <div className="searching-page">
        <main className="searching-card loading-card">
          <div className="searching-animation">
            <span />
            <span />
            <span />
          </div>

          <h1>
            Preparing Your Ride Search
          </h1>

          <p>
            We are loading your request
            and checking for nearby
            drivers.
          </p>
        </main>
      </div>
    );
  }

  if (
    timedOut ||
    rideStatus === "CANCELLED"
  ) {
    return (
      <div className="searching-page">
        <main className="searching-card timeout-card">
          <div className="timeout-icon">
            ⏱
          </div>

          <h1>
            No Driver Found This Time
          </h1>

          <p>
            Your 15-minute ride search
            has ended without a driver
            offer. You can return home
            and create a new ride
            request.
          </p>

          <div className="timeout-summary">
            <div>
              <span>
                Last offered fare
              </span>

              <strong>
                PKR{" "}
                {formatFare(
                  requestedFare
                )}
              </strong>
            </div>

            <div>
              <span>
                Preferred payment
              </span>

              <strong>
                {formatPaymentMethod(
                  paymentMethod
                )}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="search-again-button"
            onClick={
              handleSearchAgain
            }
          >
            Search for a Ride Again
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="searching-page">
      <main className="searching-card">
        <header className="searching-header">
          <div className="searching-animation">
            <span />
            <span />
            <span />
          </div>

          <h1>
            Searching for a Driver
          </h1>

          <p>
            Your request is visible
            to nearby drivers. Their
            fare offers will appear
            below.
          </p>

          <span className="search-time-remaining">
            Search ends in approximately{" "}
            {remainingMinutes}{" "}
            {remainingMinutes === 1
              ? "minute"
              : "minutes"}
          </span>
        </header>

        <section className="ride-summary">
          <div className="route-row">
            <span className="route-dot pickup" />

            <div className="route-text">
              <span className="route-label">
                Pickup
              </span>

              <strong>
                {pickup}
              </strong>
            </div>
          </div>

          <div className="route-line" />

          <div className="route-row">
            <span className="route-dot destination" />

            <div className="route-text">
              <span className="route-label">
                Destination
              </span>

              <strong>
                {destination}
              </strong>
            </div>
          </div>
        </section>

        <section className="request-details">
          <div className="request-detail">
            <span>
              Your Offered Fare
            </span>

            <strong>
              PKR{" "}
              {formatFare(
                requestedFare
              )}
            </strong>
          </div>

          <div className="request-detail">
            <span>
              Preferred Payment
            </span>

            <strong>
              {formatPaymentMethod(
                paymentMethod
              )}
            </strong>
          </div>
        </section>

        {showFiveMinutePrompt && (
          <section className="fare-guidance-card">
            <h2>
              Still waiting for an offer?
            </h2>

            <p>
              Higher fares may improve
              your chance of receiving
              a driver offer. You can
              increase your fare now
              or keep searching with
              your current offer.
            </p>

            <div className="fare-guidance-actions">
              <button
                type="button"
                className="increase-fare-button"
                onClick={
                  handleIncreaseFare
                }
              >
                Increase Fare
              </button>

              <button
                type="button"
                className="keep-searching-button"
                onClick={
                  handleKeepSearching
                }
              >
                Keep Searching
              </button>
            </div>
          </section>
        )}

        {showPersistentReminder && (
          <section className="persistent-fare-reminder">
            <div>
              <strong>
                Still no offers?
              </strong>

              <span>
                Try increasing your
                fare to improve your
                chances.
              </span>
            </div>

            <button
              type="button"
              onClick={
                handleIncreaseFare
              }
            >
              Adjust Fare
            </button>
          </section>
        )}

        {showTenMinutePrompt && (
          <section className="fare-guidance-card urgent">
            <h2>
              No drivers have responded yet
            </h2>

            <p>
              It has been some time
              and no drivers have
              accepted your current
              offer. Try raising your
              fare to improve your
              acceptance chances.
            </p>

            <div className="fare-guidance-actions">
              <button
                type="button"
                className="increase-fare-button"
                onClick={
                  handleIncreaseFare
                }
              >
                Increase Fare
              </button>

              <button
                type="button"
                className="keep-searching-button"
                onClick={
                  handleKeepSearching
                }
              >
                Keep Searching
              </button>
            </div>
          </section>
        )}

        <section className="driver-offers-section">
          <div className="offers-heading">
            <div>
              <h2>
                Driver Offers
              </h2>

              <p>
                Compare offers before
                choosing a driver.
              </p>
            </div>

            {offers.length > 0 && (
              <span className="offers-count">
                {offers.length}
              </span>
            )}
          </div>

          {offers.length === 0 ? (
            <div className="no-offers">
              <div className="small-loader" />

              <strong>
                Waiting for offers
              </strong>

              <p>
                Nearby drivers are
                reviewing your ride
                request. This page
                refreshes automatically.
              </p>
            </div>
          ) : (
            <div className="offers-list">
              {offers.map(
                (offer) => (
                  <article
                    className="driver-offer-card"
                    key={
                      offer.offerId
                    }
                  >
                    <div className="driver-offer-main">
                      <div className="driver-avatar">
                        {(offer.driverName ||
                          "D")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="driver-details">
                        <h3>
                          {offer.driverName ||
                            `Driver #${offer.driverId}`}
                        </h3>

                        <p>
                          {offer.vehicleDescription ||
                            "Vehicle details unavailable"}
                        </p>

                        <span>
                          Plate:{" "}
                          {offer.plateNumber ||
                            "Not available"}
                        </span>
                      </div>
                    </div>

                    <div className="offer-action">
                      <span>
                        Driver offer
                      </span>

                      <strong>
                        PKR{" "}
                        {formatFare(
                          offer.offeredFare
                        )}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          handleAcceptOffer(
                            offer.offerId
                          )
                        }
                        disabled={
                          Boolean(
                            acceptingOfferId
                          ) ||
                          cancelling
                        }
                      >
                        {acceptingOfferId ===
                        offer.offerId
                          ? "Accepting..."
                          : "Accept Offer"}
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        {error && (
          <p className="searching-error">
            {error}
          </p>
        )}

        <button
          type="button"
          className="cancel-search-button"
          onClick={
            handleCancelRequest
          }
          disabled={
            cancelling ||
            Boolean(
              acceptingOfferId
            )
          }
        >
          {cancelling
            ? "Cancelling Ride Search..."
            : "Cancel Ride Search"}
        </button>
      </main>
    </div>
  );
}

export default SearchingRide;