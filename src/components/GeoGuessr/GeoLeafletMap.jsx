import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (Leaflet CSS path issue with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons
const createIcon = (color, size = 28) => {
  return L.divIcon({
    className: 'geo-custom-marker',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 12px ${color}88, 0 2px 8px rgba(0,0,0,0.4);
      position: relative;
    "><div style="
      position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 8px solid ${color};
    "></div></div>`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
  });
};

const CROSSHAIR_ICON = L.divIcon({
  className: 'geo-crosshair-marker',
  html: `<div style="
    width: 40px; height: 40px;
    position: relative;
  ">
    <div style="position:absolute;top:50%;left:0;right:0;height:2px;background:#facc15;transform:translateY(-50%);"></div>
    <div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:#facc15;transform:translateX(-50%);"></div>
    <div style="position:absolute;top:50%;left:50%;width:12px;height:12px;background:#facc15;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 16px #facc1588;"></div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const CORRECT_ICON = createIcon('#ef4444', 24);
const MIRRORED_ICON = CROSSHAIR_ICON;

// Esri World Dark Gray Canvas — Free, zero API key, no watermark
const ESRI_BASE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const ESRI_REF_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';
const TILE_ATTR = '&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap contributors';

/**
 * Reusable Leaflet Map for GeoGuessr
 *
 * Props:
 *  - correctCoords: { lat, lon } — true location (host-only, red pin)
 *  - showCorrectPin: boolean — whether to show the secret correct pin
 *  - mirroredCoords: { lat, lon } — host's mirrored click (yellow crosshair)
 *  - onMapClick: (lat, lon) => void — called when map is clicked (host only)
 *  - revealLine: boolean — draw animated line between mirrored and correct
 *  - className: extra CSS classes
 *  - interactive: boolean — allow pan/zoom (default true)
 *  - center: [lat, lon] — initial center
 *  - zoom: number — initial zoom
 */
export function GeoLeafletMap({
  correctCoords = null,
  showCorrectPin = false,
  mirroredCoords = null,
  onMapClick = null,
  revealLine = false,
  className = '',
  interactive = true,
  center = [20, 0],
  zoom = 2,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const correctMarkerRef = useRef(null);
  const mirroredMarkerRef = useRef(null);
  const lineRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      minZoom: 1,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: false,
      boxZoom: interactive,
      keyboard: interactive,
      touchZoom: interactive,
    });

    // Dark base canvas
    L.tileLayer(ESRI_BASE_URL, {
      attribution: TILE_ATTR,
      maxZoom: 16,
      crossOrigin: true,
    }).addTo(map);

    // Reference labels & borders on top
    L.tileLayer(ESRI_REF_URL, {
      maxZoom: 16,
      crossOrigin: true,
      opacity: 0.85,
    }).addTo(map);

    // Add minimal attribution
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Click handler
  useEffect(() => {
    if (!mapRef.current || !onMapClick) return;

    const handler = (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };

    mapRef.current.on('click', handler);
    return () => mapRef.current?.off('click', handler);
  }, [onMapClick, mapReady]);

  // Correct pin (host only)
  useEffect(() => {
    if (!mapRef.current) return;

    if (correctMarkerRef.current) {
      mapRef.current.removeLayer(correctMarkerRef.current);
      correctMarkerRef.current = null;
    }

    if (showCorrectPin && correctCoords) {
      correctMarkerRef.current = L.marker(
        [correctCoords.lat, correctCoords.lon],
        { icon: CORRECT_ICON }
      ).addTo(mapRef.current);
    }
  }, [correctCoords, showCorrectPin, mapReady]);

  // Mirrored crosshair
  useEffect(() => {
    if (!mapRef.current) return;

    if (mirroredMarkerRef.current) {
      mapRef.current.removeLayer(mirroredMarkerRef.current);
      mirroredMarkerRef.current = null;
    }

    if (mirroredCoords) {
      mirroredMarkerRef.current = L.marker(
        [mirroredCoords.lat, mirroredCoords.lon],
        { icon: MIRRORED_ICON }
      ).addTo(mapRef.current);
    }
  }, [mirroredCoords, mapReady]);

  // Reveal line (animated geodesic between mirrored and correct)
  useEffect(() => {
    if (!mapRef.current) return;

    if (lineRef.current) {
      mapRef.current.removeLayer(lineRef.current);
      lineRef.current = null;
    }

    if (revealLine && mirroredCoords && correctCoords) {
      const latlngs = [
        [mirroredCoords.lat, mirroredCoords.lon],
        [correctCoords.lat, correctCoords.lon],
      ];

      lineRef.current = L.polyline(latlngs, {
        color: '#facc15',
        weight: 3,
        dashArray: '8, 12',
        className: 'geo-reveal-line',
      }).addTo(mapRef.current);

      // Fit bounds to show both points
      const bounds = L.latLngBounds(latlngs);
      mapRef.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 8 });

      // Show the correct pin on reveal
      if (!correctMarkerRef.current && correctCoords) {
        correctMarkerRef.current = L.marker(
          [correctCoords.lat, correctCoords.lon],
          { icon: CORRECT_ICON }
        ).addTo(mapRef.current);
      }
    }
  }, [revealLine, mirroredCoords, correctCoords, mapReady]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full ${className}`}
      style={{ background: '#09090b', minHeight: '300px' }}
    />
  );
}

export default GeoLeafletMap;
