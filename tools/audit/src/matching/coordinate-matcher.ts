const EARTH_RADIUS_KM = 6371.0;

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Haversine distance between two points in km (ported from GeoUtils.cs) */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** Returns true if two coordinates are within thresholdKm of each other */
export function coordinatesMatch(
  lat1: number,
  lon1: number,
  lat2: number | null,
  lon2: number | null,
  thresholdKm = 0.5
): boolean {
  if (lat2 === null || lon2 === null) return false;
  return haversineDistance(lat1, lon1, lat2, lon2) < thresholdKm;
}
