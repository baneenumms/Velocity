import { apiBaseUrl } from "../config/api.js";
import {
  useEffect,
  useRef,
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

import DashboardNotice from
  "../components/DashboardNotice";

import DashboardRideState from
  "../components/DashboardRideState";

import markerIcon2x from
  "leaflet/dist/images/marker-icon-2x.png";

import markerIcon from
  "leaflet/dist/images/marker-icon.png";

import markerShadow from
  "leaflet/dist/images/marker-shadow.png";

import "leaflet/dist/leaflet.css";
import "./DriverDashboard.css";

const API =
  apiBaseUrl;

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
    const requestError =
      new Error(
        data?.message ||
          data?.details ||
          data?.error ||
          text ||
          `HTTP ${response.status}`
      );

    requestError.status =
      response.status;

    throw requestError;
  }

  return data;
}

function readStoredValue(key) {
  return (
    sessionStorage.getItem(key) ||
    localStorage.getItem(key)
  );
}

function getVehicleId(profile) {
  const values = [
    profile?.vehicleId,
    profile?.vehicle?.vehicleId,
    profile?.vehicle?.id,
    profile?.vehicles?.[0]
      ?.vehicleId,
    profile?.vehicles?.[0]?.id,
    readStoredValue(
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

function formatPaymentMethod(
  value
) {
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
  const navigate =
    useNavigate();

  const dashboardScrollRef =
    useRef(null);

  const driverId =
    Number(
      readStoredValue(
        "driverId"
      )
    );

  const driverName =
    readStoredValue(
      "driverName"
    ) ||
    readStoredValue(
      "fullName"
    ) ||
    "Driver";

  const geoapifyKey =
    import.meta.env
      .VITE_GEOAPIFY_API_KEY;

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    online,
    setOnline,
  ] = useState(false);

  const [
    location,
    setLocation,
  ] = useState(null);

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    requests,
    setRequests,
  ] = useState([]);

  const [
    offerFares,
    setOfferFares,
  ] = useState({});

  const [
    offerMessages,
    setOfferMessages,
  ] = useState({});

  const [
    pendingOffers,
    setPendingOffers,
  ] = useState({});

  const [
    loadingRequests,
    setLoadingRequests,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState("");

  const [
    locating,
    setLocating,
  ] = useState(false);

  const [
    updating,
    setUpdating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * Start busy so requests never
   * flash before the server checks
   * the active ride.
   */
  const [
    hasActiveRide,
    setHasActiveRide,
  ] = useState(true);

  const validDriver =
    Number.isInteger(
      driverId
    ) &&
    driverId > 0;

  useEffect(() => {
    if (!validDriver) {
      return;
    }

    sessionStorage.setItem(
      "activeMode",
      "DRIVER"
    );

    localStorage.setItem(
      "activeMode",
      "DRIVER"
    );
  }, [validDriver]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    dashboardScrollRef.current
      ?.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
  }, []);

  useEffect(() => {
    if (!validDriver) {
      return undefined;
    }

    let cancelled = false;

    const loadProfile =
      async () => {
        try {
          const response =
            await fetch(
              `${API}/drivers/${driverId}/profile`,
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await getJson(
              response
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
        } catch (
          profileError
        ) {
          console.error(
            "Driver profile:",
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

  /*
   * Retrieve ride requests only when:
   *
   * 1. Driver is online.
   * 2. Active-ride check completed.
   * 3. Driver has no ACCEPTED or
   *    IN_PROGRESS ride.
   */
  useEffect(() => {
    if (
      !validDriver ||
      !online ||
      hasActiveRide
    ) {
      setRequests([]);
      setLoadingRequests(false);

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
          const [
            requestsResponse,
            offersResponse,
          ] = await Promise.all([
            fetch(
              `${API}/ride-requests/available?driverId=${driverId}`,
              {
                cache:
                  "no-store",
              }
            ),
            fetch(
              `${API}/driver-offers/driver/${driverId}/pending`,
              {
                cache:
                  "no-store",
              }
            ),
          ]);

          const [
            data,
            offersData,
          ] = await Promise.all([
            getJson(requestsResponse),
            getJson(offersResponse),
          ]);

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

          const offersByRequest =
            (Array.isArray(offersData)
              ? offersData
              : []
            ).reduce(
              (current, offer) => {
                if (offer?.requestId) {
                  current[offer.requestId] =
                    offer;
                }

                return current;
              },
              {}
            );

          setRequests(
            available
          );

          setPendingOffers(
            offersByRequest
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
                      request.requestId
                    ] === undefined
                  ) {
                    const existingOffer =
                      offersByRequest[
                        request.requestId
                      ];

                    updated[
                      request.requestId
                    ] = formatFare(
                      existingOffer
                        ?.offeredFare ??
                        request
                          .passengerFare
                    );
                  }
                }
              );

              return updated;
            }
          );

          setOfferMessages(
            (current) => {
              const updated = {
                ...current,
              };

              Object.values(
                offersByRequest
              ).forEach((offer) => {
                updated[offer.requestId] =
                  `Offer sent: PKR ${formatFare(
                    offer.offeredFare
                  )}`;
              });

              return updated;
            }
          );
        } catch (
          requestError
        ) {
          if (!stopped) {
            setRequests([]);

            setError(
              requestError.message ||
                "Unable to load ride requests."
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
  }, [
    driverId,
    hasActiveRide,
    online,
    validDriver,
  ]);

  const reverseGeocode =
    async (
      latitude,
      longitude
    ) => {
      const fallback =
        `${latitude.toFixed(
          6
        )}, ` +
        `${longitude.toFixed(
          6
        )}`;

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

        const response =
          await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?${params}`
          );

        const data =
          await getJson(
            response
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

  const getCurrentLocation =
    () => {
      setError("");

      if (
        !navigator.geolocation
      ) {
        setError(
          "Location is not supported."
        );

        return;
      }

      setLocating(true);

      navigator.geolocation
        .getCurrentPosition(
          async ({
            coords,
          }) => {
            const current = {
              latitude:
                Number(
                  coords.latitude
                ),

              longitude:
                Number(
                  coords.longitude
                ),
            };

            setLocation(
              current
            );

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
            enableHighAccuracy:
              true,
            timeout: 20000,
          }
        );
    };

  const toggleStatus =
    async () => {
      setError("");

      if (hasActiveRide) {
        setError(
          "Complete or cancel your current ride before changing availability."
        );

        return;
      }

      if (
        !location &&
        !online
      ) {
        setError(
          "Turn on your location before going online."
        );

        return;
      }

      const status =
        online
          ? "Offline"
          : "Online";

      try {
        setUpdating(true);

        const response =
          await fetch(
            `${API}/drivers/status`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  driverId,
                  status,

                  latitude:
                    location
                      ?.latitude,

                  longitude:
                    location
                      ?.longitude,
                }),
            }
          );

        const data =
          await getJson(
            response
          );

        setOnline(
          (
            data?.status ||
            status
          ) === "Online"
        );
      } catch (
        statusError
      ) {
        setError(
          statusError.message ||
            "Unable to update driver status."
        );
      } finally {
        setUpdating(false);
      }
    };

  const sendOffer =
    async (request) => {
      const requestId =
        request.requestId;

      if (hasActiveRide) {
        setOfferMessages(
          (current) => ({
            ...current,

            [requestId]:
              "Complete or cancel your current ride before sending another offer.",
          })
        );

        return;
      }

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

        const response =
          await fetch(
            `${API}/driver-offers`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  requestId,
                  driverId,
                  vehicleId,
                  offeredFare,
                }),
            }
          );

        const data =
          await getJson(
            response
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

        setPendingOffers(
          (current) => ({
            ...current,
            [requestId]: data,
          })
        );
      } catch (
        offerError
      ) {
        const originalMessage =
          offerError?.message ||
          "";

        const activeRideError =
          /active ride|complete or cancel|already.*ride/i.test(
            originalMessage
          );

        const walletBalanceError =
          originalMessage === "HTTP 400" ||
          /wallet|balance|top.?up|insufficient/i.test(
            originalMessage
          );

        let displayMessage =
          originalMessage ||
          "Unable to send offer.";

        if (activeRideError) {
          displayMessage =
            "Complete or cancel your current ride before sending another offer.";
        } else if (
          walletBalanceError
        ) {
          displayMessage =
            "Your wallet needs to have at least 12% of the ride fare available before you can send an offer. Top up your wallet to continue.";
        }

        setOfferMessages(
          (current) => ({
            ...current,

            [requestId]:
              displayMessage,
          })
        );
      } finally {
        setSubmitting("");
      }
    };

  const cancelOffer =
    (request) => {
      const requestId =
        request.requestId;
      const offer =
        pendingOffers[requestId];

      if (!offer?.offerId) {
        setOfferMessages(
          (current) => ({
            ...current,
            [requestId]:
              "No pending offer was found.",
          })
        );
        return;
      }

      const cancellationContext = {
        kind: "DRIVER_OFFER",
        request,
        offer,
      };

      sessionStorage.setItem(
        "velocityCancellationContext",
        JSON.stringify(cancellationContext)
      );

      navigate(
        "/driver-cancel-offer",
        {
          state: cancellationContext,
        }
      );
    };

  if (!validDriver) {
    return (
      <div
        className="dashboard-page"
        ref={
          dashboardScrollRef
        }
      >
        <div className="card dashboard-card">
          <h1>
            No driver session
          </h1>

          <button
            type="button"
            className="primary-btn"
            onClick={() =>
              navigate(
                "/driver-phone",
                {
                  replace: true,
                }
              )
            }
          >
            Driver Login
          </button>
        </div>
      </div>
    );
  }

  const mapCenter =
    location
      ? [
          location.latitude,
          location.longitude,
        ]
      : DEFAULT_CENTER;

  const mobileViewport =
    window.matchMedia(
      "(max-width: 600px)"
    ).matches;

  return (
    <div className="driver-dashboard-shell">
      <div
        className="dashboard-page"
        ref={
          dashboardScrollRef
        }
      >
        <DashboardRideState
          mode="DRIVER"
          driverId={driverId}
          onBusyChange={
            setHasActiveRide
          }
        />

        <main className="driver-dashboard-content">
          <section className="driver-dashboard-welcome">
            <p>Ready to receive requests?</p>

            <h1>
              Welcome back, {driverName}
            </h1>
          </section>

          <DashboardNotice mode="DRIVER" />

          <section className="card dashboard-card">
            {hasActiveRide ? (
              <div className="status-toggle-row">
                <span className="status-label on">
                  ACTIVE RIDE
                </span>
              </div>
            ) : (
              <>
                <p className="driver-status-copy">
                  {online
                    ? "You are ready to receive requests."
                    : "Turn on your location and go online."}
                </p>

                <div className="status-toggle-row">
                  <span
                    className={
                      `status-label ${
                        online
                          ? "on"
                          : "off"
                      }`
                    }
                  >
                    {online
                      ? "Online"
                      : "Offline"}
                  </span>

                  <button
                    type="button"
                    className={
                      `toggle-switch ${
                        online
                          ? "on"
                          : "off"
                      }`
                    }
                    onClick={
                      toggleStatus
                    }
                    disabled={updating}
                    aria-label={
                      online
                        ? "Go offline"
                        : "Go online"
                    }
                  >
                    <span className="toggle-knob" />
                  </button>
                </div>

                {!location && (
                  <button
                    type="button"
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
              </>
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
              dragging={!mobileViewport}
              touchZoom={!mobileViewport}
              scrollWheelZoom={!mobileViewport}
              doubleClickZoom={!mobileViewport}
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

          {!hasActiveRide && (
            <section className="card requests-placeholder">
              <div className="requests-heading-row">
                <div>
                  <h2>
                    Available Ride
                    Requests
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
                    No requests
                    available.
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
                                  event.target.value,
                              })
                            )
                          }
                        />

                        <button
                          type="button"
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
                            ? pendingOffers[
                                request.requestId
                              ]
                              ? "Updating..."
                              : "Sending..."
                            : pendingOffers[
                                  request.requestId
                                ]
                              ? "Update Offer"
                              : "Send Offer"}
                        </button>

                        {pendingOffers[
                          request.requestId
                        ] && (
                          <button
                            type="button"
                            className="cancel-offer-button"
                            onClick={() =>
                              cancelOffer(request)
                            }
                            disabled={
                              submitting ===
                                request.requestId
                            }
                          >
                            Cancel Offer
                          </button>
                        )}
                      </div>

                      {offerMessages[
                        request.requestId
                      ] && (
                        <p
                          className={
                            `driver-offer-message ${
                              offerMessages[
                                request.requestId
                              ]?.startsWith(
                                "Offer sent:"
                              ) ||
                              offerMessages[
                                request.requestId
                              ]?.startsWith(
                                "Offer cancelled."
                              )
                                ? "success"
                                : "error"
                            }`
                          }
                        >
                          {
                            offerMessages[
                              request.requestId
                            ]
                          }
                        </p>
                      )}
                    
                    {offerMessages[
                      request.requestId
                    ]?.includes(
                      "12% of the ride fare"
                    ) && (
                      <button
                        type="button"
                        className="wallet-topup-inline-button"
                        onClick={() =>
                          navigate("/driver-wallet")
                        }
                      >
                        Top Up My Wallet
                      </button>
                    )}

                    </article>
                  )
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default DriverDashboard;

