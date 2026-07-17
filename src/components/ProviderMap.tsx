import { useEffect, useRef, useState } from "react";
import type { Provider } from "@/lib/mock-data";
import { DEFAULT_CENTRE, type LatLng } from "@/lib/use-user-location";

type MapsGlobal = {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap;
    Marker: new (opts: Record<string, unknown>) => GMarker;
    LatLngBounds: new () => { extend: (p: LatLng) => void };
    SymbolPath: { CIRCLE: number };
    Animation: { DROP: number };
  };
};
type GMap = { fitBounds: (b: { extend: (p: LatLng) => void }) => void; setCenter: (p: LatLng) => void; setZoom: (z: number) => void };
type GMarker = { setMap: (m: GMap | null) => void; addListener: (event: string, cb: () => void) => void };

declare global {
  interface Window {
    google?: MapsGlobal;
    __mediCareInitMap?: () => void;
  }
}

let loaderPromise: Promise<MapsGlobal> | null = null;
function loadMaps(): Promise<MapsGlobal> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loaderPromise) return loaderPromise;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;
  if (!key) return Promise.reject(new Error("Missing Google Maps browser key"));

  loaderPromise = new Promise((resolve, reject) => {
    window.__mediCareInitMap = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Maps loaded but google.maps missing"));
    };
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key,
      loading: "async",
      callback: "__mediCareInitMap",
    });
    if (channel) params.set("channel", channel);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(s);
  });
  return loaderPromise;
}

type Props = {
  providers: Provider[];
  userLocation?: LatLng | null;
  activeId?: string | null;
  height?: number;
  onMarkerClick?: (id: string) => void;
  className?: string;
};

export function ProviderMap({ providers, userLocation, activeId, height = 176, onMarkerClick, className = "" }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const mapRef = useRef<GMap | null>(null);
  const markersRef = useRef<GMarker[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then((g) => {
        if (cancelled || !ref.current) return;
        mapRef.current = new g.maps.Map(ref.current, {
          center: userLocation ?? DEFAULT_CENTRE,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
          styles: [
            { featureType: "poi.business", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        });
        setReady(true);
      })
      .catch((e: Error) => setError(e.message));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render markers whenever providers change.
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google?.maps) return;
    const g = window.google;
    for (const m of markersRef.current) m.setMap(null);
    markersRef.current = [];
    const bounds = new g.maps.LatLngBounds();

    for (const p of providers) {
      if (typeof p.lat !== "number" || typeof p.lng !== "number") continue;
      const marker = new g.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapRef.current,
        title: p.name,
        animation: activeId === p.id ? g.maps.Animation.DROP : undefined,
      });
      if (onMarkerClick) marker.addListener("click", () => onMarkerClick(p.id));
      markersRef.current.push(marker);
      bounds.extend({ lat: p.lat, lng: p.lng });
    }

    if (userLocation) {
      const you = new g.maps.Marker({
        position: userLocation,
        map: mapRef.current,
        title: "You are here",
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#0ea5b8",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
      markersRef.current.push(you);
      bounds.extend(userLocation);
    }

    if (providers.length + (userLocation ? 1 : 0) > 1) {
      mapRef.current.fitBounds(bounds);
    } else if (providers[0] && typeof providers[0].lat === "number" && typeof providers[0].lng === "number") {
      mapRef.current.setCenter({ lat: providers[0].lat, lng: providers[0].lng });
      mapRef.current.setZoom(16);
    }
  }, [ready, providers, userLocation, activeId, onMarkerClick]);

  if (error) {
    return (
      <div
        className={`relative grid place-items-center overflow-hidden rounded-3xl border border-border bg-muted/40 ${className}`}
        style={{ height }}
      >
        <p className="px-4 text-center text-[11px] text-muted-foreground">Map unavailable — {error}</p>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-3xl border border-border shadow-card ${className}`}
      style={{ height }}
    />
  );
}
