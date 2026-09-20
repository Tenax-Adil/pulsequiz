import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'pannellum/build/pannellum.css';
import 'pannellum/build/pannellum.js';
import {
  Globe, AlertCircle, Loader2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  RotateCcw, ZoomIn, ZoomOut, Compass, Footprints, Key, ExternalLink
} from 'lucide-react';

/**
 * Enhanced 360° Panorama & Google Street View Viewer
 *
 * Supports:
 *  1. Native Google Maps Street View Embed (real 360° street view with road walking)
 *  2. Equirectangular 360° Panorama Viewer with custom Street View navigation
 */
export function GeoPanorama({
  panoramaUrl,
  viewpoints = null,
  location = null,
  googleApiKey: propGoogleApiKey = '',
  autoRotate = false,
  showControls = true,
  className = '',
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  // Check if this location is configured for Google Street View
  const isGoogleStreetView = Boolean(
    location?.googleStreetView ||
    location?.type === 'google' ||
    (location?.lat && location?.lon && !panoramaUrl && !viewpoints?.length)
  );

  const googleApiKey = propGoogleApiKey ||
    localStorage.getItem('pulse_google_maps_key') ||
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Normalize viewpoints array
  const allViewpoints = viewpoints && viewpoints.length > 0
    ? viewpoints
    : (panoramaUrl ? [panoramaUrl] : (location?.panoramaUrl ? [location.panoramaUrl] : []));

  const [currentVpIdx, setCurrentVpIdx] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stepDolly, setStepDolly] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const activeUrl = allViewpoints[currentVpIdx] || panoramaUrl || location?.panoramaUrl;
  const lastOrientation = useRef({ yaw: 0, pitch: 0 });

  // Reset index when viewpoints list changes
  useEffect(() => {
    setCurrentVpIdx(0);
    setStepDolly(0);
  }, [panoramaUrl, JSON.stringify(viewpoints), location?.id]);

  // Step Forward
  const handleStepForward = useCallback(() => {
    if (isTransitioning) return;

    if (allViewpoints.length > 1 && currentVpIdx < allViewpoints.length - 1) {
      setIsTransitioning(true);
      if (viewerRef.current) {
        try {
          const curHfov = viewerRef.current.getHfov();
          viewerRef.current.setHfov(Math.max(40, curHfov - 25), 250);
        } catch { /* ignore */ }
      }
      setTimeout(() => {
        setCurrentVpIdx(prev => Math.min(allViewpoints.length - 1, prev + 1));
      }, 200);
      return;
    }

    if (viewerRef.current) {
      try {
        const curHfov = viewerRef.current.getHfov();
        const nextHfov = Math.max(38, curHfov - 18);
        viewerRef.current.setHfov(nextHfov, 350);
        setStepDolly(prev => Math.min(3, prev + 1));
      } catch { /* ignore */ }
    }
  }, [allViewpoints.length, currentVpIdx, isTransitioning]);

  // Step Backward
  const handleStepBackward = useCallback(() => {
    if (isTransitioning) return;

    if (allViewpoints.length > 1 && currentVpIdx > 0) {
      setIsTransitioning(true);
      setCurrentVpIdx(prev => Math.max(0, prev - 1));
      return;
    }

    if (viewerRef.current) {
      try {
        const curHfov = viewerRef.current.getHfov();
        const nextHfov = Math.min(115, curHfov + 18);
        viewerRef.current.setHfov(nextHfov, 350);
        setStepDolly(prev => Math.max(0, prev - 1));
      } catch { /* ignore */ }
    }
  }, [allViewpoints.length, currentVpIdx, isTransitioning]);

  // Rotate Left
  const handleRotateLeft = useCallback(() => {
    if (!viewerRef.current) return;
    try {
      const cur = viewerRef.current.getYaw();
      viewerRef.current.setYaw(cur - 30, 300);
    } catch { /* ignore */ }
  }, []);

  // Rotate Right
  const handleRotateRight = useCallback(() => {
    if (!viewerRef.current) return;
    try {
      const cur = viewerRef.current.getYaw();
      viewerRef.current.setYaw(cur + 30, 300);
    } catch { /* ignore */ }
  }, []);

  // Reset View
  const handleResetView = useCallback(() => {
    if (!viewerRef.current) return;
    try {
      viewerRef.current.lookAt(0, 0, 100, 400);
      setStepDolly(0);
    } catch { /* ignore */ }
  }, []);

  // Zoom In / Out
  const handleZoomIn = useCallback(() => {
    if (!viewerRef.current) return;
    try {
      viewerRef.current.setHfov(Math.max(35, viewerRef.current.getHfov() - 15), 250);
    } catch { /* ignore */ }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!viewerRef.current) return;
    try {
      viewerRef.current.setHfov(Math.min(120, viewerRef.current.getHfov() + 15), 250);
    } catch { /* ignore */ }
  }, []);

  // Keyboard Shortcuts (W/S/A/D and Arrow Keys)
  useEffect(() => {
    if (isGoogleStreetView) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleStepForward();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleStepBackward();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleRotateLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleRotateRight();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResetView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGoogleStreetView, handleStepForward, handleStepBackward, handleRotateLeft, handleRotateRight, handleResetView]);

  // Pannellum initialization effect
  useEffect(() => {
    if (isGoogleStreetView) return;
    if (!containerRef.current || !activeUrl) return;

    let destroyed = false;
    setIsLoading(true);
    setLoadError(false);

    const initViewer = () => {
      if (destroyed) return;

      const pnlm = window.pannellum;
      if (!pnlm || !pnlm.viewer) {
        setLoadError(true);
        setIsLoading(false);
        return;
      }

      if (viewerRef.current) {
        try {
          lastOrientation.current = {
            yaw: viewerRef.current.getYaw() || 0,
            pitch: viewerRef.current.getPitch() || 0,
          };
          viewerRef.current.destroy();
        } catch { /* ignore */ }
        viewerRef.current = null;
      }

      try {
        const initialHfov = Math.max(40, 100 - stepDolly * 20);

        viewerRef.current = pnlm.viewer(containerRef.current, {
          type: 'equirectangular',
          panorama: activeUrl,
          autoLoad: true,
          autoRotate: autoRotate ? -1.5 : 0,
          autoRotateInactivityDelay: 2000,
          showControls: false,
          showZoomCtrl: false,
          showFullscreenCtrl: false,
          mouseZoom: true,
          keyboardZoom: false,
          friction: 0.15,
          minHfov: 35,
          maxHfov: 120,
          compass: false,
          hotSpotDebug: false,
          hfov: initialHfov,
          pitch: lastOrientation.current.pitch,
          yaw: lastOrientation.current.yaw,
        });

        viewerRef.current.on('load', () => {
          if (!destroyed) {
            setIsLoading(false);
            setIsTransitioning(false);
          }
        });

        viewerRef.current.on('error', (err) => {
          console.warn('Pannellum viewer load error:', err);
          if (!destroyed) {
            setLoadError(true);
            setIsLoading(false);
            setIsTransitioning(false);
          }
        });
      } catch (err) {
        console.warn('Pannellum WebGL init error, using fallback:', err);
        if (!destroyed) {
          setLoadError(true);
          setIsLoading(false);
          setIsTransitioning(false);
        }
      }
    };

    const timer = setTimeout(initViewer, 40);

    return () => {
      destroyed = true;
      clearTimeout(timer);
      if (viewerRef.current) {
        try {
          lastOrientation.current = {
            yaw: viewerRef.current.getYaw() || 0,
            pitch: viewerRef.current.getPitch() || 0,
          };
          viewerRef.current.destroy();
        } catch { /* ignore */ }
        viewerRef.current = null;
      }
    };
  }, [activeUrl, isGoogleStreetView]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── RENDER: GOOGLE STREET VIEW EMBED ──────────────────────────────────
  if (isGoogleStreetView && location?.lat && location?.lon) {
    if (!googleApiKey) {
      return (
        <div className={`relative w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 text-center ${className}`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
            <Key className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Google 360 Street View Key Required</h3>
          <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
            Google Maps Embed API provides 100% free, unlimited Street View embedding across the globe.
            Please configure your free API key in the Setup screen or settings to view this location in native Google 360.
          </p>
          <a
            href="https://console.cloud.google.com/google/maps-apis/credentials"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-2"
          >
            <span>Get Free Google Maps API Key</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      );
    }

    const embedUrl = location.panoId
      ? `https://www.google.com/maps/embed/v1/streetview?key=${googleApiKey}&pano=${location.panoId}&heading=${location.heading || 0}&pitch=${location.pitch || 0}&fov=${location.fov || 90}`
      : `https://www.google.com/maps/embed/v1/streetview?key=${googleApiKey}&location=${location.lat},${location.lon}&heading=${location.heading || 0}&pitch=${location.pitch || 0}&fov=${location.fov || 90}`;

    return (
      <div className={`relative w-full h-full bg-zinc-950 overflow-hidden ${className}`}>
        <iframe
          title={`Street View: ${location.name || 'Location'}`}
          src={embedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Google 360° Street View Live</span>
        </div>
      </div>
    );
  }

  // ─── RENDER: PANNELLUM EQUIRTECTANGULAR VIEWER ─────────────────────────
  return (
    <div className={`relative w-full h-full overflow-hidden bg-zinc-950 select-none group ${className}`}>
      {/* 360 WebGL Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full h-full ${loadError ? 'hidden' : 'block'} ${
          isTransitioning ? 'opacity-40 scale-105 filter blur-sm' : 'opacity-100 scale-100'
        } transition-all duration-300`}
        style={{ background: '#09090b' }}
      />

      {/* Loading Overlay */}
      {isLoading && !loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-20">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3" />
          <p className="text-sm font-medium text-zinc-300">Loading 360° Panorama...</p>
        </div>
      )}

      {/* Street View Transition Flash */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-white/10 pointer-events-none animate-ping z-10" />
      )}

      {/* Fallback if WebGL/Pannellum fails */}
      {loadError && (
        <div
          className="absolute inset-0 bg-cover bg-center animate-pan-panorama"
          style={{
            backgroundImage: `url(${activeUrl})`,
            backgroundSize: 'auto 100%',
          }}
        >
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2 pointer-events-none">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>360° Panorama View</span>
          </div>
        </div>
      )}

      {/* ─── GOOGLE STREET VIEW GROUND CHEVRON (Step Forward) ─── */}
      {showControls && !isLoading && !loadError && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
          <button
            onClick={handleStepForward}
            title="Step Forward [W / ↑]"
            className="pointer-events-auto group/chevron flex flex-col items-center p-3 rounded-full bg-black/50 hover:bg-amber-500/80 backdrop-blur-md border border-white/20 hover:border-amber-300 text-white transition-all transform hover:scale-110 active:scale-95 shadow-2xl cursor-pointer"
          >
            <div className="flex flex-col items-center -space-y-2">
              <ChevronUp className="w-6 h-6 text-amber-300 group-hover/chevron:text-black animate-pulse" />
              <ChevronUp className="w-5 h-5 text-white/80 group-hover/chevron:text-black" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 group-hover/chevron:text-black mt-1 px-2">
              Move Forward
            </span>
          </button>
        </div>
      )}

      {/* ─── STREET VIEW HUD CONTROLS ─── */}
      {showControls && !isLoading && !loadError && (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          {/* Viewpoint Indicator */}
          {allViewpoints.length > 1 && (
            <div className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-zinc-800 text-xs text-amber-400 font-semibold flex items-center gap-1.5 self-end">
              <Footprints className="w-3.5 h-3.5" />
              <span>Position {currentVpIdx + 1} / {allViewpoints.length}</span>
            </div>
          )}

          {/* Controls Cluster */}
          <div className="p-1.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-md shadow-xl flex flex-col items-center gap-1">
            {/* Step Forward */}
            <button
              onClick={handleStepForward}
              title="Move Forward (W / ↑)"
              className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition cursor-pointer"
            >
              <ChevronUp className="w-5 h-5" />
            </button>

            {/* Left / Right Rotate */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleRotateLeft}
                title="Rotate Left (A / ←)"
                className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleResetView}
                title="Reset View (R)"
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <Compass className="w-4 h-4" />
              </button>

              <button
                onClick={handleRotateRight}
                title="Rotate Right (D / →)"
                className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Step Backward */}
            <button
              onClick={handleStepBackward}
              title="Step Backward (S / ↓)"
              className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition cursor-pointer"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            <div className="w-full h-px bg-zinc-800 my-0.5" />

            {/* Zoom In / Zoom Out */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomIn}
                title="Zoom In (+)"
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                title="Zoom Out (-)"
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick keyboard hint */}
          <div className="text-[10px] text-zinc-400 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-center pointer-events-none">
            [W/S] Move &bull; Drag to look
          </div>
        </div>
      )}
    </div>
  );
}

export default GeoPanorama;
