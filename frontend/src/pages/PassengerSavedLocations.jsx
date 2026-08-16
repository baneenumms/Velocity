import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bookmark,
  Briefcase,
  GraduationCap,
  House,
  MapPin,
  Navigation,
  Route,
  Search,
  Trash2,
} from "lucide-react";
import "./PassengerSavedLocations.css";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

function SavedLocationIcon({ label }) {
  if (label === "Home") return <House size={23} />;
  if (label === "Work") return <Briefcase size={23} />;
  if (label === "University") return <GraduationCap size={23} />;
  return <Bookmark size={23} />;
}

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
      const savedData = localStorage.getItem("passengerSavedLocations");
      const parsedLocations = savedData ? JSON.parse(savedData) : [];
      setSavedLocations(Array.isArray(parsedLocations) ? parsedLocations : []);
    } catch (storageError) {
      console.error("Could not read saved locations:", storageError);
      setSavedLocations([]);
    }
  }, []);

  const saveLocationsToStorage = (locations) => {
    setSavedLocations(locations);
    localStorage.setItem("passengerSavedLocations", JSON.stringify(locations));
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

      const response = await fetch(`${NOMINATIM_URL}/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Location search failed. Please try again.");
      }

      const results = await response.json();

      if (!Array.isArray(results) || results.length === 0) {
        throw new Error(
          "No matching locations were found. Try entering a more detailed address."
        );
      }

      setSearchResults(
        results.map((result) => ({
          placeId: result.place_id,
          lat: Number(result.lat),
          lng: Number(result.lon),
          address: result.display_name,
        }))
      );
      setMessage("Select one of the locations below.");
    } catch (searchError) {
      console.error("Location search error:", searchError);
      setError(searchError.message || "Could not search for the location.");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    setSearchText(location.address);
    setMessage("Location selected. You can now save it.");
    setError("");
  };

  const handleSaveLocation = () => {
    setError("");
    setMessage("");

    if (!selectedLocation) {
      setError("Search for a location and select one of the results first.");
      return;
    }

    const finalLabel = label === "Other" ? customLabel.trim() : label;

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

    saveLocationsToStorage([...savedLocations, newLocation]);
    setLabel("Home");
    setCustomLabel("");
    setSearchText("");
    setSearchResults([]);
    setSelectedLocation(null);
    setMessage("Location saved successfully.");
  };

  const handleDeleteLocation = (locationId) => {
    saveLocationsToStorage(
      savedLocations.filter((location) => location.id !== locationId)
    );
  };

  const useLocationForRide = (location, type) => {
    let rideDraft = {};

    try {
      const savedDraft = sessionStorage.getItem("passengerRideDraft");
      rideDraft = savedDraft ? JSON.parse(savedDraft) : {};
    } catch (storageError) {
      console.error("Could not read ride draft:", storageError);
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

    sessionStorage.setItem("passengerRideDraft", JSON.stringify(updatedDraft));
    navigate("/passenger-dashboard");
  };

  return (
    <div className="saved-locations-page">
      <main className="saved-locations-content">
        <section className="saved-locations-title">
          <p>Your favourite places</p>
          <h1>Saved Locations</h1>
        </section>

        <section className="add-location-card">
          <header className="add-location-card-header">
            <div className="add-location-header-icon" aria-hidden="true">
              <MapPin size={27} />
            </div>
            <div>
              <span>Create a shortcut</span>
              <h2>Add a Location</h2>
              <p>Search for a place, select the correct result, and give it a useful label.</p>
            </div>
          </header>

          <div className="add-location-form-grid">
            <label className="saved-location-field">
              <span>Location label</span>
              <select
                value={label}
                onChange={(event) => {
                  setLabel(event.target.value);
                  setMessage("");
                  setError("");
                }}
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="University">University</option>
                <option value="Other">Other</option>
              </select>
            </label>

            {label === "Other" && (
              <label className="saved-location-field">
                <span>Custom label</span>
                <input
                  type="text"
                  placeholder="For example: Gym"
                  value={customLabel}
                  onChange={(event) => setCustomLabel(event.target.value)}
                />
              </label>
            )}

            <label className="saved-location-field saved-location-search-field">
              <span>Search address</span>
              <div className="saved-location-search-row">
                <input
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
                  disabled={searching || !searchText.trim()}
                >
                  <Search size={19} />
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>
            </label>
          </div>

          {error && <p className="saved-location-error">{error}</p>}
          {message && <p className="saved-location-message">{message}</p>}

          {searchResults.length > 0 && (
            <div className="saved-location-results">
              {searchResults.map((location) => (
                <button
                  key={location.placeId}
                  type="button"
                  className={
                    selectedLocation?.placeId === location.placeId
                      ? "saved-location-result selected"
                      : "saved-location-result"
                  }
                  onClick={() => handleSelectLocation(location)}
                >
                  <MapPin size={18} />
                  <span>{location.address}</span>
                </button>
              ))}
            </div>
          )}

          {selectedLocation && (
            <div className="selected-location-preview">
              <span>Selected location</span>
              <strong>{selectedLocation.address}</strong>
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
          <header>
            <div>
              <span>Ready for your next ride</span>
              <h2>Your Saved Locations</h2>
            </div>
            <strong>{savedLocations.length}</strong>
          </header>

          {savedLocations.length === 0 ? (
            <div className="no-saved-locations">
              <MapPin size={34} />
              <h3>No saved locations yet</h3>
              <p>Your saved shortcuts will appear here.</p>
            </div>
          ) : (
            <div className="saved-location-list">
              {savedLocations.map((location) => (
                <article className="saved-location-card" key={location.id}>
                  <div className="saved-location-information">
                    <div className="saved-location-icon" aria-hidden="true">
                      <SavedLocationIcon label={location.label} />
                    </div>
                    <div>
                      <h3>{location.label}</h3>
                      <p>{location.address}</p>
                    </div>
                  </div>

                  <div className="saved-location-actions">
                    <button
                      type="button"
                      className="saved-location-pickup"
                      onClick={() => useLocationForRide(location, "pickup")}
                    >
                      <Navigation size={18} />
                      Use as Pickup
                    </button>
                    <button
                      type="button"
                      className="saved-location-destination"
                      onClick={() => useLocationForRide(location, "destination")}
                    >
                      <Route size={18} />
                      Use as Destination
                    </button>
                    <button
                      type="button"
                      className="delete-saved-location"
                      onClick={() => handleDeleteLocation(location.id)}
                      aria-label={`Delete ${location.label}`}
                    >
                      <Trash2 size={18} />
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