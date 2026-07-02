"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { NEIGHBORHOOD_COORDS, type BusinessData } from "@/lib/data/businesses";

const TBILISI: [number, number] = [41.7151, 44.8271];

// Resolve a business to coordinates: explicit lat/lng → neighborhood → city.
function coordsFor(b: BusinessData): [number, number] {
  if (typeof b.lat === "number" && typeof b.lng === "number") return [b.lat, b.lng];
  return NEIGHBORHOOD_COORDS[b.neighborhood] ?? NEIGHBORHOOD_COORDS[b.city] ?? TBILISI;
}

// Teal pin drawn inline so no marker-image assets need bundling.
function pinIcon(indoor?: boolean) {
  const fill = indoor ? "#059669" : "#0E4A5C"; // emerald = indoor allowed, teal = outdoor
  return L.divIcon({
    className: "",
    html: `
      <svg width="30" height="40" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.4 18.6 0 12 0z" fill="${fill}"/>
        <circle cx="12" cy="12" r="4.5" fill="#fff"/>
      </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36],
  });
}

// Zoom/pan so every pin is visible.
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48] });
  }, [map, points]);
  return null;
}

export default function PetFriendlyMap({ businesses }: { businesses: BusinessData[] }) {
  const located = businesses.map((b) => ({ business: b, pos: coordsFor(b) }));
  const points = located.map((l) => l.pos);

  return (
    <MapContainer
      center={TBILISI}
      zoom={12}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ background: "#DDECF2" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {located.map(({ business, pos }) => (
        <Marker key={business._id} position={pos} icon={pinIcon(business.indoorAllowed)}>
          <Popup>
            <div className="space-y-0.5">
              <p className="font-bold text-[#0F2830]">{business.name}</p>
              <p className="text-xs text-stone-500">
                {business.address}, {business.neighborhood}
              </p>
              <p className="text-xs text-stone-400">
                {business.indoorAllowed ? "Indoor Allowed" : "Outdoor Only"}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
