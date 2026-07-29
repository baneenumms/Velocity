import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";

import PassengerHamburgerMenu from "../components/PassengerHamburgerMenu";
import LocationAutocomplete from "./LocationAutocomplete";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import "leaflet/dist/leaflet.css";
import "./PassengerDashboard.css";

const GEOAPIFY_URL =
  "https://api.geoapify.com/v1/geocode/reverse";

const OSRM_URL =
  "https://router.project-osrm.org/route/v1/driving";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapController({ pickup, destination, route }) {
  const map = useMap();

  useEffect(() => {
    if (route.length > 1) {
      map.fitBounds(route, { padding: [40, 40] });
    } else if (pickup && destination) {
      map.fitBounds(
        [
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng],
        ],
        { padding: [40, 40] }
      );
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 15);
    }
  }, [map, pickup, destination, route]);

  return null;
}

function PassengerDashboard() {
  const navigate = useNavigate();

  const passengerName =
    sessionStorage.getItem("passengerName") || "Passenger";

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const [route, setRoute] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [estimatedMinutes, setEstimatedMinutes] =
    useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);

  const [locating, setLocating] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

  const mapCenter = pickup
    ? [Number(pickup.lat), Number(pickup.lng)]
    : currentLocation
      ? [
          Number(currentLocation.lat),
          Number(currentLocation.lng),
        ]
      : [24.8607, 67.0011];

  const clearRoute = () => {
    setRoute([]);
    setDistanceKm(null);
    setEstimatedMinutes(null);
    setEstimatedFare(null);
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("passengerRideDraft")
      );

      if (!saved) return;

      setPickup(saved.pickup || null);
      setDestination(saved.destination || null);
      setRoute(saved.routeCoordinates || []);
      setDistanceKm(
        saved.distanceKm ? Number(saved.distanceKm) : null
      );
      setEstimatedMinutes(
        saved.estimatedMinutes
          ? Number(saved.estimatedMinutes)
          : null
      );
      setEstimatedFare(
        saved.estimatedFare
          ? Number(saved.estimatedFare)
          : null
      );
    } catch {
      sessionStorage.removeItem("passengerRideDraft");
    }
  }, []);

  const reverseGeocode = async (lat, lng) => {
    if (!apiKey) return `${lat}, ${lng}`;

    const params = new URLSearchParams({
      lat,
      lon: lng,
      format: "json",
      apiKey,
    });

    const response = await fetch(
      `${GEOAPIFY_URL}?${params}`
    );

    if (!response.ok) return `${lat}, ${lng}`;

    const data = await response.json();

    return (
      data.results?.[0]?.formatted ||
      `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    );
  };

  const getCurrentLocation = () => {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = Number(coords.latitude);
        const lng = Number(coords.longitude);
        const address = await reverseGeocode(lat, lng);

        const location = {
          id: "current-location",
          title: "Current location",
          subtitle: address,
          address,
          lat,
          lng,
        };

        setCurrentLocation(location);
        setPickup(location);
        clearRoute();
        setMessage("Current location selected as pickup.");
        setLocating(false);
      },
      () => {
        setError(
          "Location could not be detected. Enter it manually."
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateRoute = async () => {
    setError("");
    setMessage("");

    if (!pickup || !destination) {
      setError("Select pickup and destination.");
      return;
    }

    const passengerId = Number(
      sessionStorage.getItem("passengerId")
    );

    if (!passengerId) {
      setError("Passenger login information was not found.");
      return;
    }

    setCalculating(true);
    clearRoute();

    try {
      const coordinates =
        `${pickup.lng},${pickup.lat};` +
        `${destination.lng},${destination.lat}`;

      const routeResponse = await fetch(
        `${OSRM_URL}/${coordinates}` +
          "?overview=full&geometries=geojson"
      );

      if (!routeResponse.ok) {
        throw new Error("Route could not be calculated.");
      }

      const routeData = await routeResponse.json();
      const routeResult = routeData.routes?.[0];

      if (!routeResult) {
        throw new Error("No route was found.");
      }

      const formattedRoute =
        routeResult.geometry.coordinates.map(
          ([lng, lat]) => [Number(lat), Number(lng)]
        );

      const estimateResponse = await fetch(
        "http://localhost:8080/rides/estimate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            passengerId,

            pickupName:
              pickup.address ||
              pickup.subtitle ||
              pickup.title,
            pickupLat: Number(pickup.lat),
            pickupLng: Number(pickup.lng),

            dropoffName:
              destination.address ||
              destination.subtitle ||
              destination.title,
            dropoffLat: Number(destination.lat),
            dropoffLng: Number(destination.lng),
          }),
        }
      );

      if (!estimateResponse.ok) {
        throw new Error("Fare estimate failed.");
      }

      const estimate = await estimateResponse.json();

      const distance = Number(estimate.distanceKm);
      const minutes = Number(routeResult.duration) / 60;
      const fare = Number(estimate.estimatedFare);

      const rideDraft = {
        pickup,
        destination,
        routeCoordinates: formattedRoute,
        estimatedMinutes: minutes,

        pickupName:
          pickup.address ||
          pickup.subtitle ||
          pickup.title,
        pickupLat: Number(pickup.lat),
        pickupLng: Number(pickup.lng),

        dropoffName:
          destination.address ||
          destination.subtitle ||
          destination.title,
        dropoffLat: Number(destination.lat),
        dropoffLng: Number(destination.lng),

        distanceKm: distance,
        estimatedFare: fare,
        minimumFare: Number(estimate.minimumFare),
        maximumFare: Number(estimate.maximumFare),
      };

      setRoute(formattedRoute);
      setDistanceKm(distance);
      setEstimatedMinutes(minutes);
      setEstimatedFare(fare);

      sessionStorage.setItem(
        "passengerRideDraft",
        JSON.stringify(rideDraft)
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Route calculation failed.");
    } finally {
      setCalculating(false);
    }
  };

  const handleChooseFare = () => {
    if (!sessionStorage.getItem("passengerRideDraft")) {
      setError("Calculate the route first.");
      return;
    }

    navigate("/passenger-fare");
  };

  return (
    <div className="passenger-dashboard-page">
      <header className="passenger-dashboard-header">
        <div>
          <h2>VELOCITY</h2>
          <p>Passenger</p>
        </div>

        <PassengerHamburgerMenu />
      </header>

      <main className="passenger-dashboard-content">
        <section className="passenger-dashboard-welcome">
          <p>Ready for your next journey?</p>
          <h1>Hello, {passengerName}</h1>
        </section>

        <section className="passenger-booking-layout">
          <div className="passenger-booking-panel">
            <section className="passenger-location-card">
              <div className="passenger-card-heading">
                <div>
                  <p>Book a ride</p>
                  <h2>Where are you going?</h2>
                </div>

                <button
                  type="button"
                  className="current-location-button"
                  onClick={getCurrentLocation}
                  disabled={locating}
                >
                  {locating
                    ? "Finding..."
                    : "Use my location"}
                </button>
              </div>

              <div className="passenger-location-fields">
                <LocationAutocomplete
                  label="Pickup location"
                  placeholder="Enter pickup location"
                  value={pickup}
                  nearbyLocation={currentLocation}
                  onSelect={(location) => {
                    setPickup(location);
                    clearRoute();
                    setError("");
                  }}
                />

                <LocationAutocomplete
                  label="Destination"
                  placeholder="Where are you going?"
                  value={destination}
                  nearbyLocation={
                    pickup || currentLocation
                  }
                  onSelect={(location) => {
                    setDestination(location);
                    clearRoute();
                    setError("");
                  }}
                />
              </div>

              {message && (
                <p className="passenger-location-message">
                  {message}
                </p>
              )}

              {error && (
                <p className="passenger-dashboard-error">
                  {error}
                </p>
              )}

              <button
                type="button"
                className="calculate-route-button"
                onClick={calculateRoute}
                disabled={
                  calculating ||
                  !pickup ||
                  !destination
                }
              >
                {calculating
                  ? "Calculating..."
                  : "Show Route"}
              </button>
            </section>

            {distanceKm &&
              estimatedMinutes &&
              estimatedFare && (
                <section className="passenger-route-summary">
                  <h2>Route Summary</h2>

                  <div className="passenger-summary-grid">
                    <div>
                      <span>Distance</span>
                      <strong>
                        {distanceKm.toFixed(1)} km
                      </strong>
                    </div>

                    <div>
                      <span>Estimated time</span>
                      <strong>
                        {Math.round(estimatedMinutes)} min
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="choose-fare-button"
                    onClick={handleChooseFare}
                  >
                    Choose Fare
                  </button>
                </section>
              )}
          </div>

          <section className="passenger-dashboard-map-card">
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom
              className="passenger-dashboard-map"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {pickup && (
                <Marker
                  position={[pickup.lat, pickup.lng]}
                />
              )}

              {destination && (
                <Marker
                  position={[
                    destination.lat,
                    destination.lng,
                  ]}
                />
              )}

              {route.length > 1 && (
                <Polyline positions={route} />
              )}

              <MapController
                pickup={pickup}
                destination={destination}
                route={route}
              />
            </MapContainer>
          </section>
        </section>
      </main>
    </div>
  );
}

export default PassengerDashboard;