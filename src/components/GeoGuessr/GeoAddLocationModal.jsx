import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, MapPin, Upload, AlertCircle,
  Plus, Compass, Key, Sparkles,
  ExternalLink, Search, Loader2, CheckCircle2,
  Edit3, Check
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { compressImageFile } from '../../services/storage.js';
import { haversineDistance } from '../../services/geoEngine.js';

// Map tile layers
const ESRI_BASE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const ESRI_REF_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';

const PICKER_PIN_ICON = L.divIcon({
  className: 'geo-picker-marker',
  html: `<div style="
    width: 24px; height: 24px;
    background: #f59e0b;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 16px #f59e0b, 0 2px 8px rgba(0,0,0,0.5);
    position: relative;
  "><div style="
    position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
    width: 0; height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 8px solid #f59e0b;
  "></div></div>`,
  iconSize: [24, 32],
  iconAnchor: [12, 32],
});



// Popular verified 360 spots with guaranteed Google Street View coverage
const POPULAR_360_SPOTS = [
  { label: '🗽 Times Square', name: 'Times Square, New York, USA', lat: 40.7580, lon: -73.9855 },
  { label: '🗼 Eiffel Tower', name: 'Eiffel Tower, Paris, France', lat: 48.8584, lon: 2.2945 },
  { label: '⛩️ Shibuya', name: 'Shibuya Crossing, Tokyo, Japan', lat: 35.6595, lon: 139.7005 },
  { label: '🎡 London Eye', name: 'London Eye, London, UK', lat: 51.5033, lon: -0.1195 },
  { label: '🏛️ Colosseum', name: 'Colosseum, Rome, Italy', lat: 41.8902, lon: 12.4922 },
  { label: '🌉 Golden Gate', name: 'Golden Gate Bridge, San Francisco, USA', lat: 37.8199, lon: -122.4783 },
  { label: '🏙️ Burj Khalifa', name: 'Burj Khalifa, Dubai, UAE', lat: 25.1972, lon: 55.2744 },
  { label: '🏖️ Sydney Opera', name: 'Sydney Opera House, Australia', lat: -33.8568, lon: 151.2153 },
  { label: '🌊 Marine Drive', name: 'Marine Drive, Mumbai, India', lat: 18.9438, lon: 72.8234 },
];

export function GeoAddLocationModal({
  isOpen,
  onClose,
  onAddLocation,
  editLocation = null,
  onUpdateLocation = null,
}) {
  // Mode selection: 'google' | 'curated' | 'custom'
  const [activeTab, setActiveTab] = useState('google');

  const [name, setName] = useState('');
  const [clue, setClue] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [toleranceKm, setToleranceKm] = useState(150);

  // Search places
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Google Maps API Key
  const [googleKey, setGoogleKey] = useState(() => {
    return localStorage.getItem('pulse_google_maps_key') || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Real-time Street View metadata verification
  const [streetViewStatus, setStreetViewStatus] = useState({
    checking: false,
    checked: false,
    available: null,
    snappedCoords: null,
    panoId: null,
    date: null,
    nearby: false,
    distanceKm: 0,
    reason: null,
    message: null,
  });

  // Custom image inputs
  const [customUrl, setCustomUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when editLocation or isOpen changes
  useEffect(() => {
    if (isOpen && editLocation) {
      setName(editLocation.name || '');
      setClue(editLocation.clue || '');
      setLat(editLocation.lat != null ? editLocation.lat.toString() : '');
      setLon(editLocation.lon != null ? editLocation.lon.toString() : '');
      setToleranceKm(editLocation.toleranceKm || 150);
      setPreviewUrl(editLocation.panoramaUrl || '');
      setCustomUrl(editLocation.panoramaUrl || '');
      setErrorMsg('');
      if (editLocation.type === 'custom' || (editLocation.panoramaUrl && !editLocation.googleStreetView && !editLocation.type)) {
        setActiveTab('custom');
      } else {
        setActiveTab('google');
      }
    } else if (isOpen && !editLocation) {
      setName('');
      setClue('');
      setLat('');
      setLon('');
      setToleranceKm(150);
      setCustomUrl('');
      setPreviewUrl('');
      setErrorMsg('');
      setActiveTab('google');
    }
  }, [isOpen, editLocation]);

  // Mini Map refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Auto-reverse geocode coordinates to fill name
  const reverseGeocode = useCallback(async (clickedLat, clickedLon) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickedLat}&lon=${clickedLon}&zoom=10`,
        { headers: { 'User-Agent': 'PulseQuiz-GeoGuessr/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const parts = [
          address.city || address.town || address.village || address.county || data.name,
          address.state || address.region,
          address.country,
        ].filter(Boolean);

        if (parts.length > 0 && !name) {
          setName(parts.join(', '));
        }
      }
    } catch {
      // ignore
    } finally {
      setIsGeocoding(false);
    }
  }, [name]);



  // Check Google Street View metadata
  const checkStreetViewCoverage = useCallback(async (checkLat, checkLon, apiKey) => {
    if (!apiKey || isNaN(checkLat) || isNaN(checkLon)) return;

    setStreetViewStatus(prev => ({ ...prev, checking: true, checked: true }));

    try {
      // 1. Check with 1000m radius
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/streetview/metadata?location=${checkLat},${checkLon}&radius=1000&key=${apiKey}`
      );
      const data = await res.json();

      if (data.status === 'OK' && data.location) {
        setStreetViewStatus({
          checking: false,
          checked: true,
          available: true,
          snappedCoords: data.location,
          panoId: data.pano_id,
          date: data.date,
          nearby: false,
          distanceKm: 0,
          reason: null,
          message: null,
        });
        return;
      }

      if (data.status === 'ZERO_RESULTS') {
        // 2. Try wider radius 5000m to see if a street is close
        const wideRes = await fetch(
          `https://maps.googleapis.com/maps/api/streetview/metadata?location=${checkLat},${checkLon}&radius=5000&key=${apiKey}`
        );
        const wideData = await wideRes.json();

        if (wideData.status === 'OK' && wideData.location) {
          const dist = haversineDistance(checkLat, checkLon, wideData.location.lat, wideData.location.lng);
          setStreetViewStatus({
            checking: false,
            checked: true,
            available: true,
            snappedCoords: wideData.location,
            panoId: wideData.pano_id,
            date: wideData.date,
            nearby: true,
            distanceKm: dist,
            reason: null,
            message: null,
          });
          return;
        }

        // Still zero coverage
        setStreetViewStatus({
          checking: false,
          checked: true,
          available: false,
          snappedCoords: null,
          panoId: null,
          date: null,
          nearby: false,
          distanceKm: 0,
          reason: 'ZERO_RESULTS',
          message: 'No Google Street View car coverage at this point.',
        });
        return;
      }

      // Other API status (REQUEST_DENIED, etc.)
      setStreetViewStatus({
        checking: false,
        checked: true,
        available: false,
        snappedCoords: null,
        panoId: null,
        date: null,
        nearby: false,
        distanceKm: 0,
        reason: data.status,
        message: data.error_message || 'Google Street View API returned ' + data.status,
      });
    } catch {
      // Network failure or CORS fallback
      setStreetViewStatus({
        checking: false,
        checked: true,
        available: null,
        snappedCoords: null,
        panoId: null,
        date: null,
        nearby: false,
        distanceKm: 0,
        reason: 'FETCH_ERROR',
        message: null,
      });
    }
  }, []);

  // Debounce check Street View coverage when coordinates or key change
  useEffect(() => {
    if (activeTab !== 'google' || !googleKey) return;
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    if (isNaN(parsedLat) || isNaN(parsedLon)) return;

    const timer = setTimeout(() => {
      checkStreetViewCoverage(parsedLat, parsedLon, googleKey);
    }, 400);

    return () => clearTimeout(timer);
  }, [lat, lon, googleKey, activeTab, checkStreetViewCoverage]);

  // Snap to nearest covered street
  const handleSnapToRoad = () => {
    if (!streetViewStatus?.snappedCoords) return;
    const sLat = parseFloat(streetViewStatus.snappedCoords.lat.toFixed(4));
    const sLng = parseFloat(streetViewStatus.snappedCoords.lng.toFixed(4));
    setLat(sLat.toString());
    setLon(sLng.toString());

    if (mapRef.current) {
      mapRef.current.setView([sLat, sLng], 15);
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([sLat, sLng]);
      }
    }
    reverseGeocode(sLat, sLng);
  };

  // Search places via Nominatim
  const handleSearchPlace = async (query) => {
    setSearchQuery(query);
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
        { headers: { 'User-Agent': 'PulseQuiz-GeoGuessr/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data || []);
        setShowSearchDropdown(true);
      }
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item) => {
    const itemLat = parseFloat(parseFloat(item.lat).toFixed(4));
    const itemLon = parseFloat(parseFloat(item.lon).toFixed(4));
    setLat(itemLat.toString());
    setLon(itemLon.toString());

    const title = item.display_name.split(',').slice(0, 3).join(',');
    setName(title);
    setSearchQuery('');
    setShowSearchDropdown(false);

    if (mapRef.current) {
      mapRef.current.setView([itemLat, itemLon], 15);
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([itemLat, itemLon]);
      } else {
        userMarkerRef.current = L.marker([itemLat, itemLon], { icon: PICKER_PIN_ICON }).addTo(mapRef.current);
      }
    }
  };

  const handleSelectPopularSpot = (spot) => {
    setLat(spot.lat.toString());
    setLon(spot.lon.toString());
    setName(spot.name);
    setSearchQuery('');
    setShowSearchDropdown(false);

    if (mapRef.current) {
      mapRef.current.setView([spot.lat, spot.lon], 15);
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([spot.lat, spot.lon]);
      } else {
        userMarkerRef.current = L.marker([spot.lat, spot.lon], { icon: PICKER_PIN_ICON }).addTo(mapRef.current);
      }
    }
  };

  // Initialize mini Leaflet map when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const targetLat = editLocation && editLocation.lat != null ? Number(editLocation.lat) : (parseFloat(lat) || null);
      const targetLon = editLocation && editLocation.lon != null ? Number(editLocation.lon) : (parseFloat(lon) || null);
      const hasInitialCoords = targetLat != null && targetLon != null && !isNaN(targetLat) && !isNaN(targetLon);

      const map = L.map(mapContainerRef.current, {
        center: hasInitialCoords ? [targetLat, targetLon] : [20, 0],
        zoom: hasInitialCoords ? 12 : 2,
        minZoom: 1,
        maxZoom: 16,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer(ESRI_BASE_URL, { maxZoom: 16, crossOrigin: true }).addTo(map);
      L.tileLayer(ESRI_REF_URL, { maxZoom: 16, crossOrigin: true, opacity: 0.85 }).addTo(map);

      if (hasInitialCoords) {
        userMarkerRef.current = L.marker([targetLat, targetLon], { icon: PICKER_PIN_ICON }).addTo(map);
      }

      // Handle map click to drop pin & update lat/lon
      map.on('click', (e) => {
        const clickedLat = parseFloat(e.latlng.lat.toFixed(4));
        const clickedLon = parseFloat(e.latlng.lng.toFixed(4));
        setLat(clickedLat.toString());
        setLon(clickedLon.toString());

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([clickedLat, clickedLon]);
        } else {
          userMarkerRef.current = L.marker([clickedLat, clickedLon], { icon: PICKER_PIN_ICON }).addTo(map);
        }

        reverseGeocode(clickedLat, clickedLon);
      });

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      userMarkerRef.current = null;
    };
  }, [isOpen, editLocation, reverseGeocode]);

  // Sync marker when manual lat/lon changes
  useEffect(() => {
    if (!mapRef.current) return;
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    if (!isNaN(parsedLat) && !isNaN(parsedLon) && parsedLat >= -90 && parsedLat <= 90 && parsedLon >= -180 && parsedLon <= 180) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([parsedLat, parsedLon]);
      } else {
        userMarkerRef.current = L.marker([parsedLat, parsedLon], { icon: PICKER_PIN_ICON }).addTo(mapRef.current);
      }
    }
  }, [lat, lon]);

  // Save Google Key
  const handleSaveGoogleKey = (keyVal) => {
    const trimmed = keyVal.trim();
    setGoogleKey(trimmed);
    if (trimmed) {
      localStorage.setItem('pulse_google_maps_key', trimmed);
    } else {
      localStorage.removeItem('pulse_google_maps_key');
    }
    setShowKeyInput(false);
  };

  // Handle local file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setErrorMsg('');

    try {
      const compressed = await compressImageFile(file, 2048, 0.85);
      setPreviewUrl(compressed.url);
      setCustomUrl(compressed.url);
    } catch (err) {
      console.error('Failed to process image:', err);
      setErrorMsg('Failed to process image file. Please try another image.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Submit new location
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter a location name (or click on the map / search a city).');
      return;
    }

    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setErrorMsg('Please click on the map or enter a valid Latitude (-90 to 90).');
      return;
    }

    if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180) {
      setErrorMsg('Please click on the map or enter a valid Longitude (-180 to 180).');
      return;
    }

    let finalLocation = {
      id: editLocation?.id || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      clue: clue.trim(),
      lat: parsedLat,
      lon: parsedLon,
      toleranceKm: Number(toleranceKm) || 150,
      isCustom: editLocation ? editLocation.isCustom : true,
    };

    if (activeTab === 'google') {
      finalLocation.type = 'google';
      finalLocation.googleStreetView = true;
      // If we have snapped road coordinates, save them to avoid black screens!
      if (streetViewStatus?.snappedCoords) {
        finalLocation.lat = parseFloat(streetViewStatus.snappedCoords.lat.toFixed(4));
        finalLocation.lon = parseFloat(streetViewStatus.snappedCoords.lng.toFixed(4));
      }
      if (streetViewStatus?.panoId) {
        finalLocation.panoId = streetViewStatus.panoId;
      }
      finalLocation.panoramaUrl = previewUrl || undefined;
    } else {
      finalLocation.panoramaUrl = customUrl.trim() || previewUrl;
      if (!finalLocation.panoramaUrl) {
        setErrorMsg('Please select a landmark from the map or provide a 360° image.');
        return;
      }
    }

    if (editLocation && onUpdateLocation) {
      onUpdateLocation(finalLocation);
    } else if (onAddLocation) {
      onAddLocation(finalLocation);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              {editLocation ? <Edit3 className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editLocation ? 'Edit Geo Question & Location' : 'Add 360° Location'}
              </h2>
              <p className="text-xs text-zinc-400">
                {editLocation ? 'Update clue, coordinates, scoring tolerance, or 360° panorama' : 'Pick any spot on Google Street View or upload a 360° panorama'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-zinc-800 text-xs font-semibold gap-2 bg-zinc-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'google'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Google 360 Street View (Click Map)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'custom'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload 360 Image</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Place Search Bar & Quick Chips */}
          <div className="space-y-2">
            <div className="relative">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 focus-within:border-amber-500 transition">
                <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchPlace(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
                  placeholder="Search city, street, or landmark (e.g. Times Square, Paris, Mumbai)..."
                  className="bg-transparent border-0 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none flex-1"
                />
                {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 flex-shrink-0" />}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false); }}
                    className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search results dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-[2000] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-zinc-800">
                  {searchResults.map((item) => (
                    <button
                      key={item.place_id}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left px-3.5 py-2 hover:bg-zinc-800/80 transition flex items-start gap-2 text-xs cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-200 line-clamp-2">{item.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Popular 360 Spots */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold flex-shrink-0 mr-1">
                Popular 360:
              </span>
              {POPULAR_360_SPOTS.map((spot) => (
                <button
                  key={spot.label}
                  type="button"
                  onClick={() => handleSelectPopularSpot(spot)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 text-[11px] text-zinc-300 hover:text-white font-medium whitespace-nowrap transition cursor-pointer flex-shrink-0"
                >
                  {spot.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Map */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Click Map to Place Location</span>
                {isGeocoding && <span className="text-[10px] text-amber-400 font-normal lowercase">(detecting city...)</span>}
              </label>
              {(lat || lon) && (
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {lat ? `${parseFloat(lat).toFixed(4)}°` : '0°'}, {lon ? `${parseFloat(lon).toFixed(4)}°` : '0°'}
                </span>
              )}
            </div>

            <div className="relative rounded-xl overflow-hidden border border-zinc-700 h-48 bg-zinc-950">
              <div ref={mapContainerRef} className="w-full h-full" />
              <div className="absolute bottom-2 left-2 z-[1000] px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-md text-[10px] text-zinc-300 border border-zinc-800 flex items-center gap-2 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Zoom in to street level so pin lands on a public road with Street View cars</span>
              </div>
            </div>
          </div>

          {/* Location Name & Clue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Location Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Times Square, New York"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Clue / Trivia Hint
              </label>
              <input
                type="text"
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                placeholder="e.g. Famous illuminated commercial intersection."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition text-sm"
              />
            </div>
          </div>

          {/* ─── TAB 1: GOOGLE 360 STREET VIEW ────────────────────────── */}
          {activeTab === 'google' && (
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-zinc-200">Google 360 Street View Mode</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeyInput(prev => !prev)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{googleKey ? 'Change Google Key' : 'Configure Google Key'}</span>
                </button>
              </div>

              {/* API Key Box */}
              {(showKeyInput || !googleKey) && (
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-300">
                      Google Maps API Key (100% Free Unlimited Embeds)
                    </span>
                    <a
                      href="https://console.cloud.google.com/google/maps-apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>Get Key from Google Cloud</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      defaultValue={googleKey}
                      placeholder="Paste your AIzaSy... key"
                      onBlur={(e) => handleSaveGoogleKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(false)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold"
                    >
                      Save Key
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Note: Google provides the <b>Maps Embed API</b> completely free with unlimited usage.
                  </p>
                </div>
              )}

              {/* Street View Live Preview with Real-Time Coverage Detection */}
              {lat && lon && googleKey && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-semibold">Street View Live Preview:</span>
                    {streetViewStatus.checking && (
                      <span className="text-[11px] text-amber-400 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Verifying Street View coverage...</span>
                      </span>
                    )}
                    {!streetViewStatus.checking && streetViewStatus.available === true && (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>360° Street View Active {streetViewStatus.nearby ? `(snapped ${streetViewStatus.distanceKm.toFixed(1)}km)` : ''}</span>
                      </span>
                    )}
                    {!streetViewStatus.checking && streetViewStatus.available === false && (
                      <span className="text-[11px] text-red-400 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>No Coverage (Black Screen)</span>
                      </span>
                    )}
                  </div>

                  {/* Black Screen Warning and Fix Actions */}
                  {!streetViewStatus.checking && streetViewStatus.available === false && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 space-y-2 animate-fade-in">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold text-red-300">Why is the preview black?</p>
                          <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                            Google has no 360° Street View camera cars at these exact coordinates. Street View only exists on paved public roads and major tourist areas.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-red-500/20">
                        <span className="text-[11px] text-zinc-400 font-medium">Quick fixes:</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (mapRef.current) mapRef.current.setZoom(15);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 border border-zinc-700 cursor-pointer"
                        >
                          🔍 Zoom in to a Road
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('curated')}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[11px] text-amber-300 border border-amber-500/40 font-semibold cursor-pointer"
                        >
                          🏛️ Pick Curated Landmark (Guaranteed 360°)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Nearby road found prompt */}
                  {streetViewStatus.nearby && streetViewStatus.snappedCoords && (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between animate-fade-in">
                      <span>Found covered street ~{streetViewStatus.distanceKm.toFixed(1)} km away.</span>
                      <button
                        type="button"
                        onClick={handleSnapToRoad}
                        className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer transition shadow"
                      >
                        📍 Snap to Road
                      </button>
                    </div>
                  )}

                  <div className="relative rounded-xl overflow-hidden border border-zinc-700 h-44 bg-black shadow-inner">
                    <iframe
                      title="Street View Preview"
                      src={`https://www.google.com/maps/embed/v1/streetview?key=${googleKey}&${
                        streetViewStatus.snappedCoords
                          ? `location=${streetViewStatus.snappedCoords.lat},${streetViewStatus.snappedCoords.lng}`
                          : `location=${lat},${lon}`
                      }&heading=0&pitch=0&fov=90`}
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {lat && lon && !googleKey && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <span>Point chosen! Enter your free Google key above, or switch to the <b>World Landmarks</b> tab to play without any key.</span>
                </div>
              )}
            </div>
          )}



          {/* ─── TAB 3: CUSTOM 360 IMAGE UPLOAD ───────────────────────── */}
          {activeTab === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Direct 360 Image URL
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setPreviewUrl(e.target.value);
                  }}
                  placeholder="https://.../equirectangular.jpg"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-700 hover:border-amber-500 rounded-xl bg-zinc-800/40 cursor-pointer transition">
                  <Upload className="w-6 h-6 text-amber-400 mb-1" />
                  <span className="text-xs font-semibold text-zinc-200">
                    {isProcessingImage ? 'Compressing...' : 'Upload 360 Panorama File (.jpg, .png)'}
                  </span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Tolerance Radius */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Scoring Tolerance
              </label>
              <span className="text-xs font-bold text-amber-400">±{toleranceKm} km</span>
            </div>
            <div className="flex items-center gap-2">
              {[50, 100, 150, 200, 500].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setToleranceKm(km)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    toleranceKm === km
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {km}km
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessingImage}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
          >
            {editLocation ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editLocation ? 'Save Changes' : 'Add Location'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GeoAddLocationModal;
