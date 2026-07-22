import {
  useEffect,
  useRef,
  useState,
} from "react";
import "./LocationAutocomplete.css";

const AUTOCOMPLETE_URL =
  "https://api.geoapify.com/v1/geocode/autocomplete";

function LocationAutocomplete({
  label,
  placeholder,
  value,
  onSelect,
  nearbyLocation = null,
}) {
  const containerRef = useRef(null);

  const [searchText, setSearchText] = useState(
    value?.address || ""
  );

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] =
    useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] =
    useState(-1);

  const apiKey =
    import.meta.env.VITE_GEOAPIFY_API_KEY;

  useEffect(() => {
    setSearchText(value?.address || "");
  }, [value?.address]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowResults(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    const trimmedText = searchText.trim();

    if (
      !trimmedText ||
      trimmedText.length < 3 ||
      trimmedText === value?.address
    ) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (!apiKey) {
      setError(
        "Geoapify API key is missing from the .env file."
      );
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const parameters = new URLSearchParams({
          text: trimmedText,
          format: "json",
          limit: "6",
          filter: "countrycode:pk",
          lang: "en",
          apiKey,
        });

        if (
          nearbyLocation?.lat !== undefined &&
          nearbyLocation?.lng !== undefined
        ) {
          parameters.set(
            "bias",
            `proximity:${nearbyLocation.lng},${nearbyLocation.lat}`
          );
        }

        const response = await fetch(
          `${AUTOCOMPLETE_URL}?${parameters.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Location suggestions could not be loaded."
          );
        }

        const data = await response.json();

        const rawResults = Array.isArray(data.results)
          ? data.results
          : [];

        const formattedResults = rawResults
          .map((result, index) => ({
            id:
              result.place_id ||
              `${result.lat}-${result.lon}-${index}`,

            address:
              result.formatted ||
              [
                result.address_line1,
                result.address_line2,
              ]
                .filter(Boolean)
                .join(", "),

            title:
              result.name ||
              result.address_line1 ||
              result.city ||
              "Location",

            subtitle:
              result.address_line2 ||
              [
                result.city,
                result.state,
                result.country,
              ]
                .filter(Boolean)
                .join(", "),

            lat: Number(result.lat),
            lng: Number(result.lon),

            city: result.city || "",
            state: result.state || "",
            country: result.country || "",
            postcode: result.postcode || "",
          }))
          .filter(
            (location) =>
              location.address &&
              Number.isFinite(location.lat) &&
              Number.isFinite(location.lng)
          );

        setResults(formattedResults);
        setShowResults(true);
        setActiveIndex(-1);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          console.error(
            "Autocomplete error:",
            requestError
          );

          setError(
            requestError.message ||
              "Location suggestions could not be loaded."
          );

          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    searchText,
    value?.address,
    apiKey,
    nearbyLocation?.lat,
    nearbyLocation?.lng,
  ]);

  const selectLocation = (location) => {
    setSearchText(location.address);
    setResults([]);
    setShowResults(false);
    setActiveIndex(-1);
    setError("");

    onSelect(location);
  };

  const handleInputChange = (event) => {
    const newValue = event.target.value;

    setSearchText(newValue);
    setShowResults(true);
    setActiveIndex(-1);
    setError("");

    if (newValue !== value?.address) {
      onSelect(null);
    }
  };

  const handleKeyDown = (event) => {
    if (!showResults || results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((currentIndex) =>
        currentIndex < results.length - 1
          ? currentIndex + 1
          : 0
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((currentIndex) =>
        currentIndex > 0
          ? currentIndex - 1
          : results.length - 1
      );
    }

    if (
      event.key === "Enter" &&
      activeIndex >= 0
    ) {
      event.preventDefault();
      selectLocation(results[activeIndex]);
    }

    if (event.key === "Escape") {
      setShowResults(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div
      className="location-autocomplete"
      ref={containerRef}
    >
      {label && (
        <label className="location-autocomplete-label">
          {label}
        </label>
      )}

      <div className="location-autocomplete-input-wrapper">
        <input
          type="text"
          value={searchText}
          placeholder={placeholder}
          autoComplete="off"
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
        />

        {loading && (
          <span className="location-autocomplete-loading">
            Searching...
          </span>
        )}
      </div>

      {error && (
        <p className="location-autocomplete-error">
          {error}
        </p>
      )}

      {showResults &&
        !loading &&
        searchText.trim().length >= 3 && (
          <div className="location-autocomplete-results">
            {results.length > 0 ? (
              results.map((location, index) => (
                <button
                  key={location.id}
                  type="button"
                  className={
                    index === activeIndex
                      ? "location-autocomplete-option active"
                      : "location-autocomplete-option"
                  }
                  onMouseEnter={() =>
                    setActiveIndex(index)
                  }
                  onClick={() =>
                    selectLocation(location)
                  }
                >
                  <span className="location-option-icon">
                    ●
                  </span>

                  <span className="location-option-content">
                    <strong>{location.title}</strong>

                    <small>
                      {location.subtitle ||
                        location.address}
                    </small>
                  </span>
                </button>
              ))
            ) : (
              <div className="location-autocomplete-empty">
                No matching locations found.
              </div>
            )}
          </div>
        )}
    </div>
  );
}

export default LocationAutocomplete;