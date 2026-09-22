/**
 * GeoGuessr Game Engine
 * Haversine distance, scoring math, and game state machine.
 */

// ─── Game State Machine ───────────────────────────────────────
export const GEO_STATES = {
  LOBBY: 'GEO_LOBBY',
  PANORAMA: 'GEO_PANORAMA',
  BUZZER_LOCKED: 'GEO_BUZZER_LOCKED',
  HOST_MIRROR: 'GEO_HOST_MIRROR',
  REVEAL: 'GEO_REVEAL',
  ROUND_WRAP: 'GEO_ROUND_WRAP',
  FINISHED: 'GEO_FINISHED',
};

// ─── Haversine Distance ───────────────────────────────────────
/**
 * Calculate the great-circle distance between two GPS coordinates.
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ─── Scoring ──────────────────────────────────────────────────
/**
 * Calculate GeoGuessr score using exponential decay.
 * Max 5000 points, decays with distance, penalized by buzzer rank.
 * If distanceKm exceeds toleranceKm, yields 0 points (guess failed).
 *
 * @param {number} distanceKm - Distance from guess to target in km
 * @param {number} buzzerRank - 0-indexed rank (0 = first buzzer, 1 = second, etc.)
 * @param {number|null} toleranceKm - Maximum acceptable radius in km for a valid guess
 * @returns {number} Points awarded (0–5000)
 */
export function calculateGeoScore(distanceKm, buzzerRank = 0, toleranceKm = null) {
  // If guess is outside the location's acceptable tolerance, award 0 points
  if (toleranceKm != null && distanceKm > toleranceKm) {
    return 0;
  }

  const MAX_POINTS = 5000;
  const DECAY_FACTOR = toleranceKm ? Math.max(250, toleranceKm * 1.5) : 400;
  const RANK_PENALTY = 50;  // points per rank position

  const baseScore = MAX_POINTS * Math.exp(-distanceKm / DECAY_FACTOR);
  const penalty = buzzerRank * RANK_PENALTY;
  const finalScore = Math.round(baseScore) - penalty;

  // Guesses inside tolerance receive at least 100 points
  return Math.max(toleranceKm ? 100 : 0, finalScore);
}

// ─── Timer Defaults (Deprecated: GeoGuessr operates without countdown limits) ───
export const GEO_TIMERS = {
  TAG_TIME_FIRST: 0,
  TAG_TIME_PASS: 0,
  REVEAL_DISPLAY: 5,
  ROUND_WRAP: 4,
};

// ─── Rank Labels ──────────────────────────────────────────────
export function getRankLabel(rank) {
  const labels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  return labels[rank] || `${rank + 1}th`;
}

// ─── Format Distance ─────────────────────────────────────────
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}

// ─── Format Points ────────────────────────────────────────────
export function formatPoints(pts) {
  return `+${pts.toLocaleString()} PTS`;
}
