import { useEffect, useMemo, useState } from "react";
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
import LocationAutocomplete from "../components/LocationAutocomplete";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import "leaflet/dist/leaflet.css";
import "./PassengerDashboard.css";

const GEOAPIFY_REVERSE_URL =
  "https://api.geoapify.com/v1/geocode/reverse";

const OSRM_ROUTE_URL =
  "https://router.project-osrm.org/route/v1/driving";

/*
  Fixes missing Leaflet marker icons inside Vite.
*/
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapController({
  pickup,
  destination,
  routeCoordinates,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      Array.isArray(routeCoordinates) &&
      routeCoordinates.length > 1
    ) {
      map.fitBounds(routeCoordinates, {
        padding: [45, 45],
      });

      return;
    }

    if (pickup && destination) {
      map.fitBounds(
        [
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng],
        ],
        {
          padding: [45, 45],
        }
      );

      return;
    }

    if (pickup) {
      map.setView(
        [pickup.lat, pickup.lng],
        15
      );
    }
  }, [
    map,
    pickup,
    destination,
    routeCoordinates,
  ]);

  return null;
}

function PassengerDashboard() {
  const navigate = useNavigate();

  const passengerName =
    localStorage.getItem("passengerName") ||
    "Passenger";

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] =
    useState(null);

  const [currentLocation, setCurrentLocation] =
    useState(null);

  const [routeCoordinates, setRouteCoordinates] =
    useState([]);

  const [distanceKm, setDistanceKm] =
    useState(null);

  const [
    estimatedMinutes,
    setEstimatedMinutes,
  ] = useState(null);

  const [baseFare, setBaseFare] =
    useState(null);

  const [locating, setLocating] =
    useState(false);

  const [calculatingRoute, setCalculatingRoute] =
    useState(false);

  const [locationMessage, setLocationMessage] =
    useState("");

  const [error, setError] = useState("");

  const apiKey =
    import.meta.env.VITE_GEOAPIFY_API_KEY;

  /*
    Default map centre is Karachi.

    As soon as the passenger's location or pickup
    becomes available, the map moves there.
  */
  const mapCenter = useMemo(() => {
    if (pickup) {
      return [
        Number(pickup.lat),
        Number(pickup.lng),
      ];
    }

    if (currentLocation) {
      return [
        Number(currentLocation.lat),
        Number(currentLocation.lng),
      ];
    }

    return [24.8607, 67.0011];
  }, [pickup, currentLocation]);

  /*
    Restore an unfinished ride when the passenger
    returns from another page.
  */
  useEffect(() => {
    try {
      const storedDraft = sessionStorage.getItem(
        "passengerRideDraft"
      );

      if (!storedDraft) {
        return;
      }

      const parsedDraft = JSON.parse(storedDraft);

      if (parsedDraft.pickup) {
        setPickup(parsedDraft.pickup);
      }

      if (parsedDraft.destination) {
        setDestination(parsedDraft.destination);
      }

      if (
        Array.isArray(
          parsedDraft.routeCoordinates
        )
      ) {
        setRouteCoordinates(
          parsedDraft.routeCoordinates
        );
      }

      if (parsedDraft.distanceKm) {
        setDistanceKm(
          Number(parsedDraft.distanceKm)
        );
      }

      if (parsedDraft.estimatedMinutes) {
        setEstimatedMinutes(
          Number(parsedDraft.estimatedMinutes)
        );
      }

      if (parsedDraft.baseFare) {
        setBaseFare(
          Number(parsedDraft.baseFare)
        );
      }
    } catch (storageError) {
      console.error(
        "Could not restore ride draft:",
        storageError
      );
    }
  }, []);

  /*
    Attempt to get the passenger's current location
    when the dashboard first opens.
  */
  useEffect(() => {
    getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
    Clear the route whenever pickup or destination
    changes. The passenger must calculate the route again.
  */
  const clearCalculatedRoute = () => {
    setRouteCoordinates([]);
    setDistanceKm(null);
    setEstimatedMinutes(null);
    setBaseFare(null);
  };

  const reverseGeocode = async (lat, lng) => {
    if (!apiKey) {
      throw new Error(
        "Geoapify API key is missing from the .env file."
      );
    }

    const parameters = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: "json",
      lang: "en",
      apiKey,
    });

    const response = await fetch(
      `${GEOAPIFY_REVERSE_URL}?${parameters.toString()}`
    );

    if (!response.ok) {
      throw new Error(
        "Your address could not be identified."
      );
    }

    const data = await response.json();

    const firstResult = Array.isArray(data.results)
      ? data.results[0]
      : null;

    return (
      firstResult?.formatted ||
      `${Number(lat).toFixed(6)}, ${Number(
        lng
      ).toFixed(6)}`
    );
  };

  const getCurrentLocation = () => {
    setError("");
    setLocationMessage("");

    if (!navigator.geolocation) {
      setError(
        "Location access is not supported by this browser."
      );
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(
          position.coords.latitude
        );

        const lng = Number(
          position.coords.longitude
        );

        try {
          const address = await reverseGeocode(
            lat,
            lng
          );

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

          clearCalculatedRoute();

          setLocationMessage(
            "Your current location has been selected as the pickup."
          );
        } catch (reverseError) {
          console.error(
            "Reverse geocoding failed:",
            reverseError
          );

          const fallbackLocation = {
            id: "current-location",
            title: "Current location",
            subtitle: `${lat}, ${lng}`,
            address: `${lat.toFixed(
              6
            )}, ${lng.toFixed(6)}`,
            lat,
            lng,
          };

          setCurrentLocation(fallbackLocation);
          setPickup(fallbackLocation);

          clearCalculatedRoute();

          setLocationMessage(
            "Your current coordinates have been selected as the pickup."
          );
        } finally {
          setLocating(false);
        }
      },
      (locationError) => {
        console.error(
          "Browser location error:",
          locationError
        );

        setLocating(false);

        if (
          locationError.code ===
          locationError.PERMISSION_DENIED
        ) {
          setError(
            "Location permission was denied. You can search for your pickup manually."
          );

          return;
        }

        if (
          locationError.code ===
          locationError.POSITION_UNAVAILABLE
        ) {
          setError(
            "Your current location is unavailable. Enter the pickup manually."
          );

          return;
        }

        if (
          locationError.code ===
          locationError.TIMEOUT
        ) {
          setError(
            "Location detection took too long. Please try again."
          );

          return;
        }

        setError(
          "Your current location could not be detected."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  };

  const calculateSuggestedFare = (
    distance,
    durationMinutes
  ) => {
    const startingFare = 80;
    const distanceCharge = distance * 35;
    const timeCharge = durationMinutes * 3;

    const calculatedFare =
      startingFare +
      distanceCharge +
      timeCharge;

    return (
      Math.round(calculatedFare / 5) * 5
    );
  };

  const calculateRoute = async () => {
    setError("");
    setLocationMessage("");

    if (!pickup) {
      setError(
        "Select your pickup location first."
      );
      return;
    }

    if (!destination) {
      setError(
        "Select your destination first."
      );
      return;
    }

    const pickupLat = Number(pickup.lat);
    const pickupLng = Number(pickup.lng);

    const destinationLat = Number(
      destination.lat
    );

    const destinationLng = Number(
      destination.lng
    );

    if (
      !Number.isFinite(pickupLat) ||
      !Number.isFinite(pickupLng) ||
      !Number.isFinite(destinationLat) ||
      !Number.isFinite(destinationLng)
    ) {
      setError(
        "The selected location coordinates are invalid."
      );
      return;
    }

    setCalculatingRoute(true);
    clearCalculatedRoute();

    try {
      const coordinates =
        `${pickupLng},${pickupLat};` +
        `${destinationLng},${destinationLat}`;

      const parameters = new URLSearchParams({
        overview: "full",
        geometries: "geojson",
        steps: "false",
      });

      const response = await fetch(
        `${OSRM_ROUTE_URL}/${coordinates}?${parameters.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          "The route could not be calculated."
        );
      }

      const data = await response.json();

      const route = data.routes?.[0];

      if (
        !route ||
        !route.geometry ||
        !Array.isArray(
          route.geometry.coordinates
        )
      ) {
        throw new Error(
          "No driving route was found between these locations."
        );
      }

      /*
        OSRM gives each coordinate as:
        [longitude, latitude]

        Leaflet requires:
        [latitude, longitude]
      */
      const formattedCoordinates =
        route.geometry.coordinates.map(
          ([lng, lat]) => [
            Number(lat),
            Number(lng),
          ]
        );

      const calculatedDistanceKm =
        Number(route.distance) / 1000;

      const calculatedMinutes =
        Number(route.duration) / 60;

      const calculatedFare =
        calculateSuggestedFare(
          calculatedDistanceKm,
          calculatedMinutes
        );

      setRouteCoordinates(
        formattedCoordinates
      );

      setDistanceKm(calculatedDistanceKm);

      setEstimatedMinutes(
        calculatedMinutes
      );

      setBaseFare(calculatedFare);

      const rideDraft = {
        pickup,
        destination,
        routeCoordinates:
          formattedCoordinates,
        distanceKm:
          calculatedDistanceKm,
        estimatedMinutes:
          calculatedMinutes,
        baseFare: calculatedFare,
        selectedFare: calculatedFare,
      };

      sessionStorage.setItem(
        "passengerRideDraft",
        JSON.stringify(rideDraft)
      );
    } catch (routeError) {
      console.error(
        "Route calculation error:",
        routeError
      );

      setError(
        routeError.message ||
          "The route could not be calculated."
      );
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handleChooseFare = () => {
    setError("");

    if (!pickup || !destination) {
      setError(
        "Select both pickup and destination."
      );
      return;
    }

    if (
      routeCoordinates.length < 2 ||
      !distanceKm ||
      !estimatedMinutes ||
      !baseFare
    ) {
      setError(
        "Calculate the route before choosing your fare."
      );
      return;
    }

    const rideDraft = {
      pickup,
      destination,
      routeCoordinates,
      distanceKm,
      estimatedMinutes,
      baseFare,
      selectedFare: baseFare,
    };

    sessionStorage.setItem(
      "passengerRideDraft",
      JSON.stringify(rideDraft)
    );

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

          <h1>
            Hello, {passengerName}
          </h1>
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
                  placeholder="Enter your pickup location"
                  value={pickup}
                  nearbyLocation={
                    currentLocation
                  }
                  onSelect={(location) => {
                    setPickup(location);
                    clearCalculatedRoute();
                    setLocationMessage("");
                    setError("");
                  }}
                />

                <LocationAutocomplete
                  label="Destination"
                  placeholder="Where are you going?"
                  value={destination}
                  nearbyLocation={
                    pickup ||
                    currentLocation
                  }
                  onSelect={(location) => {
                    setDestination(location);
                    clearCalculatedRoute();
                    setLocationMessage("");
                    setError("");
                  }}
                />
              </div>

              {locationMessage && (
                <p className="passenger-location-message">
                  {locationMessage}
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
                  calculatingRoute ||
                  !pickup ||
                  !destination
                }
              >
                {calculatingRoute
                  ? "Calculating Route..."
                  : "Show Route"}
              </button>
            </section>

            {distanceKm &&
              estimatedMinutes &&
              baseFare && (
                <section className="passenger-route-summary">
                  <h2>Route Summary</h2>

                  <div className="passenger-summary-grid">
                    <div>
                      <span>Distance</span>

                      <strong>
                        {distanceKm.toFixed(
                          1
                        )}{" "}
                        km
                      </strong>
                    </div>

                    <div>
                      <span>
                        Estimated time
                      </span>

                      <strong>
                        {Math.round(
                          estimatedMinutes
                        )}{" "}
                        min
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="choose-fare-button"
                    onClick={
                      handleChooseFare
                    }
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
                  position={[
                    Number(pickup.lat),
                    Number(pickup.lng),
                  ]}
                />
              )}

              {destination && (
                <Marker
                  position={[
                    Number(
                      destination.lat
                    ),
                    Number(
                      destination.lng
                    ),
                  ]}
                />
              )}

              {routeCoordinates.length >
                1 && (
                <Polyline
                  positions={
                    routeCoordinates
                  }
                />
              )}

              <MapController
                pickup={pickup}
                destination={destination}
                routeCoordinates={
                  routeCoordinates
                }
              />
            </MapContainer>
          </section>
        </section>
      </main>
    </div>
  );
}

export default PassengerDashboard;