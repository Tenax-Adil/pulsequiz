import { calculateGeoScore, haversineDistance, getRankLabel } from '../src/services/geoEngine.js';

console.log('Testing Geo Scoring & Tolerance Logic...');

// Location: Paris (48.8566, 2.3522) with tolerance of 100km
const targetLat = 48.8566;
const targetLng = 2.3522;
const toleranceKm = 100;

// Guess 1: London (51.5074, -0.1278) -> ~340 km away
const distLondon = haversineDistance(targetLat, targetLng, 51.5074, -0.1278);
const scoreLondon = calculateGeoScore(distLondon, 0, toleranceKm);
console.log(`London dist: ${distLondon.toFixed(1)} km, score: ${scoreLondon}`);
if (scoreLondon !== 0) {
  console.error('FAIL: Guess outside tolerance should score 0 points!');
  process.exit(1);
}

// Guess 2: Versailles (48.8049, 2.1204) -> ~17 km away
const distVersailles = haversineDistance(targetLat, targetLng, 48.8049, 2.1204);
const scoreVersailles = calculateGeoScore(distVersailles, 0, toleranceKm);
console.log(`Versailles dist: ${distVersailles.toFixed(1)} km, score: ${scoreVersailles}`);
if (scoreVersailles <= 0) {
  console.error('FAIL: Guess inside tolerance should score > 0 points!');
  process.exit(1);
}

// Guess 3: 2nd buzzer in Versailles
const scoreVersailles2nd = calculateGeoScore(distVersailles, 1, toleranceKm);
console.log(`Versailles 2nd buzzer score: ${scoreVersailles2nd}`);
if (scoreVersailles2nd <= 0 || scoreVersailles2nd > scoreVersailles) {
  console.error('FAIL: 2nd buzzer should score slightly fewer points than 1st buzzer');
  process.exit(1);
}

// Queue labels
console.log('Testing rank labels:');
console.log(`Rank 0: ${getRankLabel(0)}`);
console.log(`Rank 1: ${getRankLabel(1)}`);
console.log(`Rank 2: ${getRankLabel(2)}`);
if (getRankLabel(0) !== '1st' || getRankLabel(1) !== '2nd' || getRankLabel(2) !== '3rd') {
  console.error('FAIL: Rank labels incorrect');
  process.exit(1);
}

console.log('All Geo Scoring & Tolerance unit checks PASSED! ✅');
