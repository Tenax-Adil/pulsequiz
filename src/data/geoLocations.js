/**
 * GeoGuessr Verified 360° Panorama Locations
 * Each location features a true 2:1 equirectangular panorama bundled locally in /panoramas/,
 * exact GPS coordinates, and clue text.
 */

export const GEO_LOCATIONS = [
  {
    id: 'loc_chile_alma',
    name: 'ALMA Observatory, Atacama Desert',
    clue: 'High on an arid plateau 5,000m above sea level, gigantic radio dish antennas scan the deep cosmos.',
    panoramaUrl: '/panoramas/atacama.jpg',
    lat: -23.029,
    lon: -67.755,
    toleranceKm: 200,
  },
  {
    id: 'loc_chile_cerro_toco',
    name: 'Cerro Toco Volcano, Andes Mountains',
    clue: 'A towering stratovolcano ridge overlooking salt flats in one of the driest places on Earth.',
    panoramaUrl: '/panoramas/cerro_toco.jpg',
    lat: -22.956,
    lon: -67.778,
    toleranceKm: 200,
  },
  {
    id: 'loc_boston_jfk',
    name: 'JFK Presidential Pavilion, Boston Harbor',
    clue: 'A geometric glass and steel monument designed by I.M. Pei overlooking the Atlantic shore.',
    panoramaUrl: '/panoramas/boston_jfk.jpg',
    lat: 42.3164,
    lon: -71.0345,
    toleranceKm: 150,
  },
  {
    id: 'loc_baltimore_art',
    name: 'Baltimore Museum of Art, Maryland',
    clue: 'Historic gallery pavilions housing renowned collections of post-impressionist and modern sculpture.',
    panoramaUrl: '/panoramas/baltimore_art.jpg',
    lat: 39.3262,
    lon: -76.6205,
    toleranceKm: 150,
  },
  {
    id: 'loc_tree_canopy',
    name: 'Primeval Beech Forest, Hainich Park',
    clue: 'A UNESCO World Heritage ancient forest canopy walkway high above the German woodland floor.',
    panoramaUrl: '/panoramas/tree_canopy.jpg',
    lat: 51.1657,
    lon: 10.4515,
    toleranceKm: 200,
  },
];

export default GEO_LOCATIONS;

