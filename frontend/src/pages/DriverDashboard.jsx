import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import HamburgerMenu from
  "../components/HamburgerMenu";

import markerIcon2x from
  "leaflet/dist/images/marker-icon-2x.png";

import markerIcon from
  "leaflet/dist/images/marker-icon.png";

import markerShadow from
  "leaflet/dist/images/marker-shadow.png";

import "leaflet/dist/leaflet.css";
import "./DriverDashboard.css";

const API =
  "http://localhost:8080";

const POLL_MS = 3000;

const DEFAULT_CENTER = [
  24.8607,
  67.0011,
];

delete L.Icon.Default.prototype
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

async function getJson(response) {
  const text =
    await response.text();

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
        `HTTP ${response.status}`
    );
  }

  return data;
}

function getVehicleId(profile) {
  const values = [
    profile?.vehicleId,
    profile?.vehicle?.vehicleId,
    profile?.vehicle?.id,
    profile?.vehicles?.[0]
      ?.vehicleId,
    profile?.vehicles?.[0]?.id,
    sessionStorage.getItem(
      "vehicleId"
    ),
  ];

  return (
    values
      .map(Number)
      .find(
        (id) =>
          Number.isInteger(id) &&
          id > 0
      ) || null
  );
}

function formatFare(value) {
  const fare = Number(value);

  return Number.isFinite(fare)
    ? fare.toFixed(0)
    : "0";
}

function formatPaymentMethod(value) {
  return value ===
    "DIGITAL_TRANSFER"
    ? "Digital Transfer"
    : "Cash";
}

function MapController({
  location,
}) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.setView(
        [
          location.latitude,
          location.longitude,
        ],
        16
      );
    }
  }, [
    location,
    map,
  ]);

  return null;
}

function DriverDashboard() {
  const navigate = useNavigate();

  const driverId = Number(
    sessionStorage.getItem(
      "driverId"
    )
  );

  const driverName =
    sessionStorage.getItem(
      "driverName"
    ) || "Driver";

  const geoapifyKey =
    import.meta.env
      .VITE_GEOAPIFY_API_KEY;

  const [profile, setProfile] =
    useState(null);

  const [online, setOnline] =
    useState(false);

  const [location, setLocation] =
    useState(null);

  const [address, setAddress] =
    useState("");

  const [requests, setRequests] =
    useState([]);

  const [
    offerFares,
    setOfferFares,
  ] = useState({});

  const [
    offerMessages,
    setOfferMessages,
  ] = useState({});

  const [
    loadingRequests,
    setLoadingRequests,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState("");

  const [locating, setLocating] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [error, setError] =
    useState("");

  const validDriver =
    Number.isInteger(driverId) &&
    driverId > 0;

  useEffect(() => {
    if (!validDriver) {
      return undefined;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const data =
          await getJson(
            await fetch(
              `${API}/drivers/${driverId}/profile`
            )
          );

        if (cancelled) {
          return;
        }

        setProfile(data);

        const status =
          data?.driverStatus ||
          data?.status ||
          data?.driver
            ?.driverStatus ||
          "Offline";

        setOnline(
          status === "Online"
        );

        const vehicleId =
          getVehicleId(data);

        if (vehicleId) {
          sessionStorage.setItem(
            "vehicleId",
            String(vehicleId)
          );
        }
      } catch (profileError) {
        console.error(
          profileError
        );
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [
    driverId,
    validDriver,
  ]);

  useEffect(() => {
    if (!validDriver) {
      return undefined;
    }

    const checkActiveRide =
      async () => {
        try {
          const data =
            await getJson(
              await fetch(
                `${API}/driver-rides/${driverId}/active`
              )
            );

          if (
            !data?.active ||
            !data?.rideId
          ) {
            return;
          }

          sessionStorage.setItem(
            "activeDriverRide",
            JSON.stringify(data)
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
            "/driver-active-ride",
            {
              replace: true,
            }
          );
        } catch (
          activeRideError
        ) {
          console.error(
            activeRideError
          );
        }
      };

    checkActiveRide();

    const interval =
      window.setInterval(
        checkActiveRide,
        POLL_MS
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    driverId,
    navigate,
    validDriver,
  ]);

  useEffect(() => {
    if (!online) {
      setRequests([]);
      return undefined;
    }

    let firstLoad = true;
    let stopped = false;

    const loadRequests =
      async () => {
        if (firstLoad) {
          setLoadingRequests(
            true
          );
        }

        try {
          const data =
            await getJson(
              await fetch(
                `${API}/ride-requests/available`
              )
            );

          if (stopped) {
            return;
          }

          const available =
            Array.isArray(data)
              ? data.filter(
                  (request) =>
                    request.status ===
                    "SEARCHING"
                )
              : [];

          setRequests(
            available
          );

          setOfferFares(
            (current) => {
              const updated = {
                ...current,
              };

              available.forEach(
                (request) => {
                  if (
                    updated[
                      request
                        .requestId
                    ] === undefined
                  ) {
                    updated[
                      request
                        .requestId
                    ] = formatFare(
                      request
                        .passengerFare
                    );
                  }
                }
              );

              return updated;
            }
          );

          setError("");
        } catch (requestError) {
          if (!stopped) {
            setError(
              requestError.message
            );
          }
        } finally {
          if (!stopped) {
            setLoadingRequests(
              false
            );
          }

          firstLoad = false;
        }
      };

    loadRequests();

    const interval =
      window.setInterval(
        loadRequests,
        POLL_MS
      );

    return () => {
      stopped = true;

      window.clearInterval(
        interval
      );
    };
  }, [online]);

  const reverseGeocode = async (
    latitude,
    longitude
  ) => {
    const fallback =
      `${latitude.toFixed(6)}, ` +
      `${longitude.toFixed(6)}`;

    if (!geoapifyKey) {
      return fallback;
    }

    try {
      const params =
        new URLSearchParams({
          lat: latitude,
          lon: longitude,
          format: "json",
          apiKey:
            geoapifyKey,
        });

      const data =
        await getJson(
          await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?${params}`
          )
        );

      return (
        data?.results?.[0]
          ?.formatted ||
        fallback
      );
    } catch {
      return fallback;
    }
  };

  const getCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError(
        "Location is not supported."
      );
      return;
    }

    setLocating(true);

    navigator.geolocation
      .getCurrentPosition(
        async ({ coords }) => {
          const current = {
            latitude: Number(
              coords.latitude
            ),

            longitude: Number(
              coords.longitude
            ),
          };

          setLocation(current);

          setAddress(
            await reverseGeocode(
              current.latitude,
              current.longitude
            )
          );

          setLocating(false);
        },
        () => {
          setLocating(false);

          setError(
            "Allow location access to go online."
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
        }
      );
  };

  const toggleStatus = async () => {
    setError("");

    if (
      !location &&
      !online
    ) {
      setError(
        "Turn on your location before going online."
      );
      return;
    }

    const status = online
      ? "Offline"
      : "Online";

    try {
      setUpdating(true);

      const data =
        await getJson(
          await fetch(
            `${API}/drivers/status`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                driverId,
                status,
                latitude:
                  location?.latitude,
                longitude:
                  location?.longitude,
              }),
            }
          )
        );

      setOnline(
        (data?.status ||
          status) === "Online"
      );
    } catch (statusError) {
      setError(
        statusError.message
      );
    } finally {
      setUpdating(false);
    }
  };

  const sendOffer =
    async (request) => {
      const requestId =
        request.requestId;

      const vehicleId =
        getVehicleId(
          profile
        );

      const offeredFare =
        Number(
          offerFares[
            requestId
          ]
        );

      if (!vehicleId) {
        setOfferMessages(
          (current) => ({
            ...current,
            [requestId]:
              "Vehicle not found.",
          })
        );
        return;
      }

      if (
        !Number.isFinite(
          offeredFare
        ) ||
        offeredFare <= 0
      ) {
        setOfferMessages(
          (current) => ({
            ...current,
            [requestId]:
              "Enter a valid fare.",
          })
        );
        return;
      }

      try {
        setSubmitting(
          requestId
        );

        const data =
          await getJson(
            await fetch(
              `${API}/driver-offers`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  requestId,
                  driverId,
                  vehicleId,
                  offeredFare,
                }),
              }
            )
          );

        setOfferMessages(
          (current) => ({
            ...current,
            [requestId]:
              `Offer sent: PKR ${formatFare(
                data?.offeredFare ||
                  offeredFare
              )}`,
          })
        );
      } catch (offerError) {
        setOfferMessages(
          (current) => ({
            ...current,
            [requestId]:
              offerError.message,
          })
        );
      } finally {
        setSubmitting("");
      }
    };

  if (!validDriver) {
    return (
      <div className="page dashboard-page">
        <div className="card dashboard-card">
          <h1>
            No driver session
          </h1>

          <button
            className="primary-btn"
            onClick={() =>
              navigate(
                "/driver-phone"
              )
            }
          >
            Driver Login
          </button>
        </div>
      </div>
    );
  }

  const mapCenter = location
    ? [
        location.latitude,
        location.longitude,
      ]
    : DEFAULT_CENTER;

  return (
    <div className="page dashboard-page">
      <HamburgerMenu
        open={menuOpen}
        onClose={() =>
          setMenuOpen(false)
        }
      />

      <header className="dashboard-header">
        <button
          className="menu-btn"
          onClick={() =>
            setMenuOpen(true)
          }
        >
          ☰
        </button>

        <div className="velocity-title small">
          <span className="velo">
            VEL
          </span>

          <span className="wheel">
            <span className="hub" />
          </span>

          <span className="city">
            CITY
          </span>
        </div>
      </header>

      <main className="driver-dashboard-content">
        <section className="card dashboard-card">
          <h1>
            Welcome back,{" "}
            {driverName}
          </h1>

          <p>
            {online
              ? "You are ready to receive requests."
              : "Turn on your location and go online."}
          </p>

          <div className="status-toggle-row">
            <span
              className={`status-label ${
                online
                  ? "on"
                  : "off"
              }`}
            >
              {online
                ? "Online"
                : "Offline"}
            </span>

            <button
              className={`toggle-switch ${
                online
                  ? "on"
                  : "off"
              }`}
              onClick={
                toggleStatus
              }
              disabled={updating}
            >
              <span className="toggle-knob" />
            </button>
          </div>

          {!location && (
            <button
              className="location-button"
              onClick={
                getCurrentLocation
              }
              disabled={locating}
            >
              {locating
                ? "Finding Location..."
                : "Turn On Location"}
            </button>
          )}

          {location && (
            <div className="driver-location-info">
              <span>
                Current location
              </span>

              <strong>
                {address}
              </strong>
            </div>
          )}

          {error && (
            <p className="error">
              {error}
            </p>
          )}
        </section>

        <section className="driver-map-card">
          <MapContainer
            center={mapCenter}
            zoom={
              location
                ? 16
                : 12
            }
            className="driver-map"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {location && (
              <Marker
                position={
                  mapCenter
                }
              />
            )}

            <MapController
              location={
                location
              }
            />
          </MapContainer>
        </section>

        <section className="card requests-placeholder">
          <div className="requests-heading-row">
            <div>
              <h2>
                Available Ride Requests
              </h2>

              <p>
                {online
                  ? "Requests refresh every 3 seconds."
                  : "Go online to receive requests."}
              </p>
            </div>

            {online && (
              <span className="requests-live-indicator">
                Online
              </span>
            )}
          </div>

          {loadingRequests && (
            <p>
              Loading requests...
            </p>
          )}

          {online &&
            !loadingRequests &&
            requests.length ===
              0 && (
              <p>
                No requests available.
              </p>
            )}

          <div className="ride-request-list">
            {requests.map(
              (request) => (
                <article
                  className="ride-request-card"
                  key={
                    request.requestId
                  }
                >
                  <div className="ride-request-card-header">
                    <strong>
                      Passenger #
                      {
                        request.passengerId
                      }
                    </strong>

                    <div className="request-fare">
                      <span>
                        Passenger fare
                      </span>

                      <strong>
                        PKR{" "}
                        {formatFare(
                          request.passengerFare
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="request-payment">
                    Preferred payment:{" "}
                    <strong>
                      {formatPaymentMethod(
                        request.paymentMethod
                      )}
                    </strong>
                  </div>

                  <div className="request-route">
                    <p>
                      <strong>
                        Pickup:
                      </strong>{" "}
                      {
                        request.pickupAddress
                      }
                    </p>

                    <p>
                      <strong>
                        Destination:
                      </strong>{" "}
                      {
                        request.dropoffAddress
                      }
                    </p>
                  </div>

                  <div className="driver-offer-controls">
                    <input
                      type="number"
                      min="1"
                      step="5"
                      value={
                        offerFares[
                          request.requestId
                        ] || ""
                      }
                      onChange={(
                        event
                      ) =>
                        setOfferFares(
                          (
                            current
                          ) => ({
                            ...current,

                            [request.requestId]:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />

                    <button
                      onClick={() =>
                        sendOffer(
                          request
                        )
                      }
                      disabled={
                        submitting ===
                        request.requestId
                      }
                    >
                      {submitting ===
                      request.requestId
                        ? "Sending..."
                        : "Send Offer"}
                    </button>
                  </div>

                  {offerMessages[
                    request.requestId
                  ] && (
                    <p className="driver-offer-message success">
                      {
                        offerMessages[
                          request
                            .requestId
                        ]
                      }
                    </p>
                  )}
                </article>
              )
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default DriverDashboard;