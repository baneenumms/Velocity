import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PassengerHamburgerMenu from "../components/PassengerHamburgerMenu";
import "./PassengerSavedLocations.css";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

function PassengerSavedLocations() {
  const navigate = useNavigate();

  const [savedLocations, setSavedLocations] = useState([]);
  const [label, setLabel] = useState("Home");
  const [customLabel, setCustomLabel] = useState("");

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(
        "passengerSavedLocations"
      );

      const parsedLocations = savedData
        ? JSON.parse(savedData)
        : [];

      setSavedLocations(
        Array.isArray(parsedLocations)
          ? parsedLocations
          : []
      );
    } catch (storageError) {
      console.error(
        "Could not read saved locations:",
        storageError
      );

      setSavedLocations([]);
    }
  }, []);

  const saveLocationsToStorage = (locations) => {
    setSavedLocations(locations);

    localStorage.setItem(
      "passengerSavedLocations",
      JSON.stringify(locations)
    );
  };

  const searchLocation = async () => {
    const query = searchText.trim();

    if (!query) {
      setError("Enter an address or place name.");
      return;
    }

    setError("");
    setMessage("");
    setSelectedLocation(null);
    setSearchResults([]);
    setSearching(true);

    try {
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "6",
        countrycodes: "pk",
        addressdetails: "1",
      });

      const response = await fetch(
        `${NOMINATIM_URL}/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          "Location search failed. Please try again."
        );
      }

      const results = await response.json();

      if (!Array.isArray(results) || results.length === 0) {
        throw new Error(
          "No matching locations were found. Try entering a more detailed address."
        );
      }

      const formattedResults = results.map((result) => ({
        placeId: result.place_id,
        lat: Number(result.lat),
        lng: Number(result.lon),
        address: result.display_name,
      }));

      setSearchResults(formattedResults);
      setMessage("Select one of the locations below.");
    } catch (searchError) {
      console.error("Location search error:", searchError);

      setError(
        searchError.message ||
          "Could not search for the location."
      );

      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    setSearchText(location.address);
    setMessage(
      "Location selected. You can now save it."
    );
    setError("");
  };

  const handleSaveLocation = () => {
    setError("");
    setMessage("");

    if (!selectedLocation) {
      setError(
        "Search for a location and select one of the results first."
      );
      return;
    }

    const finalLabel =
      label === "Other"
        ? customLabel.trim()
        : label;

    if (!finalLabel) {
      setError("Enter a label for this location.");
      return;
    }

    const newLocation = {
      id: Date.now(),
      label: finalLabel,
      placeId: selectedLocation.placeId,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address: selectedLocation.address,
    };

    const updatedLocations = [
      ...savedLocations,
      newLocation,
    ];

    saveLocationsToStorage(updatedLocations);

    setLabel("Home");
    setCustomLabel("");
    setSearchText("");
    setSearchResults([]);
    setSelectedLocation(null);
    setMessage("Location saved successfully.");
  };

  const handleDeleteLocation = (locationId) => {
    const updatedLocations = savedLocations.filter(
      (location) => location.id !== locationId
    );

    saveLocationsToStorage(updatedLocations);
  };

  const useLocationForRide = (location, type) => {
    let rideDraft = {};

    try {
      const savedDraft = sessionStorage.getItem(
        "passengerRideDraft"
      );

      rideDraft = savedDraft
        ? JSON.parse(savedDraft)
        : {};
    } catch (storageError) {
      console.error(
        "Could not read ride draft:",
        storageError
      );

      rideDraft = {};
    }

    const updatedDraft = {
      ...rideDraft,

      [type]: {
        lat: Number(location.lat),
        lng: Number(location.lng),
        address: location.address,
      },

      routeCoordinates: [],
      distanceKm: null,
      estimatedMinutes: null,
      baseFare: null,
      selectedFare: null,
    };

    sessionStorage.setItem(
      "passengerRideDraft",
      JSON.stringify(updatedDraft)
    );

    navigate("/passenger-dashboard");
  };

  return (
    <div className="saved-locations-page">
      <header className="saved-locations-header">
        <h2>VELOCITY</h2>

        <PassengerHamburgerMenu />
      </header>

      <main className="saved-locations-content">
        <button
          type="button"
          className="saved-locations-back"
          onClick={() =>
            navigate("/passenger-dashboard")
          }
        >
          ← Back to dashboard
        </button>

        <section className="saved-locations-title">
          <p>Your favourite places</p>
          <h1>Saved Locations</h1>
        </section>

        <section className="add-location-card">
          <h2>Add a location</h2>

          <label htmlFor="location-label">
            Location label
          </label>

          <select
            id="location-label"
            value={label}
            onChange={(event) => {
              setLabel(event.target.value);
              setMessage("");
              setError("");
            }}
          >
            <option value="Home">Home</option>
            <option value="Work">Work</option>
            <option value="University">
              University
            </option>
            <option value="Other">Other</option>
          </select>

          {label === "Other" && (
            <>
              <label htmlFor="custom-label">
                Custom label
              </label>

              <input
                id="custom-label"
                type="text"
                placeholder="For example: Gym"
                value={customLabel}
                onChange={(event) =>
                  setCustomLabel(event.target.value)
                }
              />
            </>
          )}

          <label htmlFor="saved-location-search">
            Search address
          </label>

          <div className="saved-location-search-row">
            <input
              id="saved-location-search"
              type="text"
              placeholder="Enter an address or place"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                setSelectedLocation(null);
                setSearchResults([]);
                setMessage("");
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  searchLocation();
                }
              }}
            />

            <button
              type="button"
              onClick={searchLocation}
              disabled={
                searching || !searchText.trim()
              }
            >
              {searching
                ? "Searching..."
                : "Search"}
            </button>
          </div>

          {error && (
            <p className="saved-location-error">
              {error}
            </p>
          )}

          {message && (
            <p className="saved-location-message">
              {message}
            </p>
          )}

          {searchResults.length > 0 && (
            <div className="saved-location-results">
              {searchResults.map((location) => (
                <button
                  key={location.placeId}
                  type="button"
                  className={
                    selectedLocation?.placeId ===
                    location.placeId
                      ? "saved-location-result selected"
                      : "saved-location-result"
                  }
                  onClick={() =>
                    handleSelectLocation(location)
                  }
                >
                  {location.address}
                </button>
              ))}
            </div>
          )}

          {selectedLocation && (
            <div className="selected-location-preview">
              <span>Selected location</span>

              <strong>
                {selectedLocation.address}
              </strong>
            </div>
          )}

          <button
            type="button"
            className="save-location-button"
            onClick={handleSaveLocation}
            disabled={!selectedLocation}
          >
            Save Location
          </button>
        </section>

        <section className="saved-location-list-section">
          <h2>Your saved locations</h2>

          {savedLocations.length === 0 ? (
            <div className="no-saved-locations">
              <p>
                You have not saved any locations yet.
              </p>
            </div>
          ) : (
            <div className="saved-location-list">
              {savedLocations.map((location) => (
                <article
                  className="saved-location-card"
                  key={location.id}
                >
                  <div className="saved-location-information">
                    <div className="saved-location-icon">
                      {location.label === "Home"
                        ? "⌂"
                        : location.label === "Work"
                        ? "▣"
                        : location.label ===
                          "University"
                        ? "U"
                        : "●"}
                    </div>

                    <div>
                      <h3>{location.label}</h3>
                      <p>{location.address}</p>
                    </div>
                  </div>

                  <div className="saved-location-actions">
                    <button
                      type="button"
                      onClick={() =>
                        useLocationForRide(
                          location,
                          "pickup"
                        )
                      }
                    >
                      Use as pickup
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        useLocationForRide(
                          location,
                          "destination"
                        )
                      }
                    >
                      Use as destination
                    </button>

                    <button
                      type="button"
                      className="delete-saved-location"
                      onClick={() =>
                        handleDeleteLocation(
                          location.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default PassengerSavedLocations;