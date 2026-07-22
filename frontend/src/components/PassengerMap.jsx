import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [24.8607, 67.0011];

function MapController({ pickup, destination, routeCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates?.length > 1) {
      map.fitBounds(routeCoordinates, {
        padding: [40, 40],
      });

      return;
    }

    if (pickup) {
      map.setView([pickup.lat, pickup.lng], 15);
    }
  }, [map, pickup, destination, routeCoordinates]);

  return null;
}

function PassengerMap({
  pickup,
  destination,
  routeCoordinates = [],
}) {
  const initialCenter = pickup
    ? [pickup.lat, pickup.lng]
    : DEFAULT_CENTER;

  return (
    <MapContainer
      center={initialCenter}
      zoom={13}
      scrollWheelZoom
      className="passenger-map"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController
        pickup={pickup}
        destination={destination}
        routeCoordinates={routeCoordinates}
      />

      {pickup && (
        <CircleMarker
          center={[pickup.lat, pickup.lng]}
          radius={10}
          pathOptions={{
            color: "#1677ff",
            fillColor: "#1677ff",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>Pickup</strong>
            <br />
            {pickup.address}
          </Popup>
        </CircleMarker>
      )}

      {destination && (
        <CircleMarker
          center={[destination.lat, destination.lng]}
          radius={10}
          pathOptions={{
            color: "#d93025",
            fillColor: "#d93025",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>Destination</strong>
            <br />
            {destination.address}
          </Popup>
        </CircleMarker>
      )}

      {routeCoordinates.length > 1 && (
        <Polyline
          positions={routeCoordinates}
          pathOptions={{
            weight: 6,
            opacity: 0.85,
          }}
        />
      )}
    </MapContainer>
  );
}

export default PassengerMap;