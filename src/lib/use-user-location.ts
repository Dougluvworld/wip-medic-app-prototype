import { useEffect, useState } from "react";

export type LatLng = { lat: number; lng: number };
export type LocationState = {
  coords: LatLng | null;
  status: "idle" | "prompt" | "granted" | "denied" | "unavailable";
  request: () => void;
};

// Dublin city centre — fallback / default map centre for the prototype.
export const DEFAULT_CENTRE: LatLng = { lat: 53.3498, lng: -6.2603 };

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function useUserLocation(): LocationState {
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<LocationState["status"]>("idle");

  const request = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("prompt");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { timeout: 8000, maximumAge: 60_000 },
    );
  };

  useEffect(() => {
    // Auto-request once on mount; browsers will show the permission prompt.
    request();
  }, []);

  return { coords, status, request };
}
