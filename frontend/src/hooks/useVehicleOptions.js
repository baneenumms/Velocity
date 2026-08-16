import { useEffect, useMemo, useState } from "react";
import { apiBaseUrl } from "../config/api.js";

function useVehicleOptions(selectedMake = "") {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/driver-registration/vehicle-options`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Vehicle options are unavailable.");
        }

        if (active) {
          setCatalog(data);
          setError("");
        }
      } catch (loadError) {
        console.error(loadError);

        if (active) {
          setError(
            "Approved vehicle options could not be loaded. Please refresh and try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  const makeOptions = useMemo(
    () => catalog?.makes?.map((item) => item.make) || [],
    [catalog]
  );

  const modelOptions = useMemo(() => {
    const make = catalog?.makes?.find(
      (item) => item.make.toLowerCase() === selectedMake.trim().toLowerCase()
    );

    return make?.models || [];
  }, [catalog, selectedMake]);

  const yearOptions = useMemo(() => {
    if (!catalog) {
      return [];
    }

    const years = [];

    for (
      let year = catalog.maximumYear;
      year >= catalog.minimumYear;
      year -= 1
    ) {
      years.push(String(year));
    }

    return years;
  }, [catalog]);

  return {
    catalog,
    loading,
    error,
    makeOptions,
    modelOptions,
    yearOptions,
    colorOptions: catalog?.colors || [],
    capacityOptions:
      catalog?.capacities?.map(String) || [],
  };
}

export default useVehicleOptions;
