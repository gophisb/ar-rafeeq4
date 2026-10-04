/* Offline Algeria mosque data access.
 * The JSON is generated during the Android build from the pinned
 * @geoalgeria/mosquees@2.0.4 dataset.
 */
const MOSQUE_DATA_URL = "./mosquees-data.json";
let mosqueCache = null;

export async function loadMosques() {
  if (mosqueCache) return mosqueCache;
  const response = await fetch(MOSQUE_DATA_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("offline mosque dataset unavailable");
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("invalid offline mosque dataset");
  mosqueCache = data;
  return data;
}

export function distanceMeters(lat1, lng1, lat2, lng2) {
  const rad = Math.PI / 180;
  const p1 = lat1 * rad, p2 = lat2 * rad;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function nearestMosques(lat, lng, limit = 10) {
  const data = await loadMosques();
  return data.map(m => ({
    ...m,
    distance_m: distanceMeters(lat, lng, Number(m.lat), Number(m.lng))
  })).sort((a, b) => a.distance_m - b.distance_m).slice(0, limit);
}

export async function searchMosques(query = "", wilayaCode = "") {
  const data = await loadMosques();
  const q = String(query).trim().toLocaleLowerCase();
  return data.filter(m => {
    if (wilayaCode && String(m.wilaya_code) !== String(wilayaCode)) return false;
    if (!q) return true;
    return [m.name, m.name_ar, m.name_fr, m.commune]
      .filter(Boolean)
      .some(v => String(v).toLocaleLowerCase().includes(q));
  });
}
