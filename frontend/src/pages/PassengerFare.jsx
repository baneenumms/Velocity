import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import PassengerHamburgerMenu from "../components/PassengerHamburgerMenu";
import "leaflet/dist/leaflet.css";
import "./PassengerFare.css";

function MapController({ pickup, destination }) {
  const map = useMap();

  useEffect(() => {
    if (!pickup || !destination) {
      return;
    }

    map.fitBounds(
      [
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng],
      ],
      {
        padding: [45, 45],
      }
    );
  }, [map, pickup, destination]);

  return null;
}

function PassengerFare() {
  const navigate = useNavigate();

  const [rideDraft, setRideDraft] = useState(null);
  const [selectedFare, setSelectedFare] = useState(0);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    try {
      const storedDraft = sessionStorage.getItem(
        "passengerRideDraft"
      );

      if (!storedDraft) {
        setError(
          "No ride information was found. Please select your route again."
        );
        return;
      }

      const parsedDraft = JSON.parse(storedDraft);

      if (!parsedDraft.pickup || !parsedDraft.destination) {
        setError(
          "Pickup or destination is missing. Please select your route again."
        );
        return;
      }

      const originalFare = Number(
        parsedDraft.baseFare ||
          parsedDraft.suggestedFare ||
          0
      );

      if (!Number.isFinite(originalFare) || originalFare <= 0) {
        setError(
          "The suggested fare could not be calculated. Please calculate your route again."
        );
        return;
      }

      const roundedFare = Math.round(originalFare / 5) * 5;

      setRideDraft({
        ...parsedDraft,
        baseFare: roundedFare,
      });

      setSelectedFare(
        Number(parsedDraft.selectedFare) > 0
          ? Number(parsedDraft.selectedFare)
          : roundedFare
      );
    } catch (storageError) {
      console.error(
        "Could not read passenger ride draft:",
        storageError
      );

      setError(
        "The ride information could not be opened. Please select your route again."
      );
    }
  }, []);

  const suggestedFare = Number(rideDraft?.baseFare || 0);

  const minimumFare = useMemo(() => {
    return suggestedFare * 0.9;
  }, [suggestedFare]);

  const maximumFare = useMemo(() => {
    return suggestedFare * 1.1;
  }, [suggestedFare]);

  const canDecrease =
    selectedFare - 5 >= minimumFare;

  const canIncrease =
    selectedFare + 5 <= maximumFare;

  const decreaseFare = () => {
    if (!canDecrease) {
      return;
    }

    setSelectedFare((currentFare) => currentFare - 5);
  };

  const increaseFare = () => {
    if (!canIncrease) {
      return;
    }

    setSelectedFare((currentFare) => currentFare + 5);
  };

  const handleRequestRide = () => {
    if (!rideDraft) {
      setError(
        "Ride information is missing. Please return to the dashboard."
      );
      return;
    }

    setRequesting(true);
    setError("");

    const requestedRide = {
      ...rideDraft,
      selectedFare,
      passengerId:
        localStorage.getItem("passengerId") || null,
      passengerName:
        localStorage.getItem("passengerName") ||
        "Passenger",
      status: "Requested",
      requestedAt: new Date().toISOString(),
    };

    sessionStorage.setItem(
      "passengerRideDraft",
      JSON.stringify(requestedRide)
    );

    /*
      Later, this is where we will call the Quarkus backend:

      POST http://localhost:8080/rides

      For now, the requested ride remains stored in sessionStorage.
    */

    setTimeout(() => {
      setRequesting(false);

      alert(
        `Ride requested for PKR ${selectedFare}.`
      );
    }, 400);
  };

  if (error && !rideDraft) {
    return (
      <div className="passenger-fare-page">
        <header className="passenger-fare-header">
          <h2>VELOCITY</h2>
          <PassengerHamburgerMenu />
        </header>

        <main className="passenger-fare-content">
          <section className="fare-missing-card">
            <h1>Ride information unavailable</h1>

            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                navigate("/passenger-dashboard")
              }
            >
              Return to Dashboard
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (!rideDraft) {
    return (
      <div className="passenger-fare-loading">
        Loading ride information...
      </div>
    );
  }

  const pickup = rideDraft.pickup;
  const destination = rideDraft.destination;

  const routeCoordinates = Array.isArray(
    rideDraft.routeCoordinates
  )
    ? rideDraft.routeCoordinates
        .map((coordinate) => {
          if (Array.isArray(coordinate)) {
            return [
              Number(coordinate[0]),
              Number(coordinate[1]),
            ];
          }

          if (
            coordinate &&
            coordinate.lat !== undefined &&
            coordinate.lng !== undefined
          ) {
            return [
              Number(coordinate.lat),
              Number(coordinate.lng),
            ];
          }

          return null;
        })
        .filter(Boolean)
    : [];

  const mapCenter = [
    Number(pickup.lat),
    Number(pickup.lng),
  ];

  return (
    <div className="passenger-fare-page">
      <header className="passenger-fare-header">
        <h2>VELOCITY</h2>
        <PassengerHamburgerMenu />
      </header>

      <main className="passenger-fare-content">
        <button
          type="button"
          className="passenger-fare-back"
          onClick={() =>
            navigate("/passenger-dashboard")
          }
        >
          ← Back to route
        </button>

        <section className="passenger-fare-title">
          <p>Confirm your ride</p>
          <h1>Choose Your Fare</h1>
        </section>

        <section className="passenger-fare-layout">
          <div className="fare-route-column">
            <section className="fare-route-card">
              <div className="fare-location-row">
                <span className="fare-pickup-dot" />

                <div>
                  <small>Pickup</small>
                  <p>{pickup.address}</p>
                </div>
              </div>

              <div className="fare-location-line" />

              <div className="fare-location-row">
                <span className="fare-destination-dot" />

                <div>
                  <small>Destination</small>
                  <p>{destination.address}</p>
                </div>
              </div>
            </section>

            <section className="fare-map-card">
              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom
                className="passenger-fare-map"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                  position={[
                    Number(pickup.lat),
                    Number(pickup.lng),
                  ]}
                />

                <Marker
                  position={[
                    Number(destination.lat),
                    Number(destination.lng),
                  ]}
                />

                {routeCoordinates.length > 1 && (
                  <Polyline
                    positions={routeCoordinates}
                  />
                )}

                <MapController
                  pickup={pickup}
                  destination={destination}
                />
              </MapContainer>
            </section>
          </div>

          <div className="fare-selection-column">
            <section className="fare-summary-card">
              <h2>Route Summary</h2>

              <div className="fare-summary-grid">
                <div>
                  <span>Distance</span>
                  <strong>
                    {rideDraft.distanceKm
                      ? `${Number(
                          rideDraft.distanceKm
                        ).toFixed(1)} km`
                      : "Unavailable"}
                  </strong>
                </div>

                <div>
                  <span>Estimated time</span>
                  <strong>
                    {rideDraft.estimatedMinutes
                      ? `${Math.round(
                          Number(
                            rideDraft.estimatedMinutes
                          )
                        )} min`
                      : "Unavailable"}
                  </strong>
                </div>
              </div>
            </section>

            <section className="fare-selector-card">
              <p className="fare-selector-label">
                Your fare offer
              </p>

              <div className="fare-selector">
                <button
                  type="button"
                  className="fare-adjust-button"
                  onClick={decreaseFare}
                  disabled={!canDecrease}
                  aria-label="Decrease fare by five rupees"
                >
                  −
                </button>

                <div className="selected-fare">
                  <span>PKR</span>
                  <strong>{selectedFare}</strong>
                </div>

                <button
                  type="button"
                  className="fare-adjust-button"
                  onClick={increaseFare}
                  disabled={!canIncrease}
                  aria-label="Increase fare by five rupees"
                >
                  +
                </button>
              </div>

              <p className="fare-selector-note">
                Adjust your offer using the buttons.
              </p>
            </section>

            {error && (
              <p className="passenger-fare-error">
                {error}
              </p>
            )}

            <button
              type="button"
              className="request-ride-button"
              onClick={handleRequestRide}
              disabled={requesting}
            >
              {requesting
                ? "Requesting Ride..."
                : `Request Ride · PKR ${selectedFare}`}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PassengerFare;