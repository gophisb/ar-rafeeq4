import { nearestPlace, timesFor } from 'mihrab-methods/algeria';

const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function algeriaDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Algiers',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const part = key => parts.find(item => item.type === key)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function toMinutes(label) {
  if (typeof label !== 'string' || !/^[0-9]{2}:[0-9]{2}$/.test(label)) return NaN;
  const [hours, minutes] = label.split(':').map(Number);
  if (hours > 23 || minutes > 59) return NaN;
  return hours * 60 + minutes;
}

function calculate(date, location) {
  const latitude = Number(location?.latitude ?? location?.lat);
  const longitude = Number(location?.longitude ?? location?.lng);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new TypeError('Invalid coordinates for Algeria prayer-time calculation.');
  }

  const nearest = nearestPlace('algeria', latitude, longitude);
  if (!nearest?.place) throw new Error('No Algeria authority reference point is available.');
  const day = timesFor(nearest.place, algeriaDateKey(date));
  if (!day?.times) throw new Error('The Algeria prayer-time method returned no times.');

  const formatted = {};
  const minutes = {};
  for (const key of PRAYER_KEYS) {
    const label = day.times[key]?.printed;
    const minuteValue = toMinutes(label);
    if (!Number.isFinite(minuteValue)) throw new Error(`Invalid printed time for ${key}.`);
    formatted[key] = label;
    minutes[key] = minuteValue;
  }

  return Object.freeze({
    formatted,
    minutes,
    source: 'mihrab-methods/algeria',
    status: day.status,
    referencePlace: nearest.place.name,
    distanceKm: nearest.distanceKm,
    date: day.date,
    certifiedFrom: day.certifiedFrom,
    certifiedUntil: day.certifiedUntil,
    correctionRevision: day.revision,
    clock: day.clock?.label || 'Africa/Algiers'
  });
}

window.RafeeqAlgeriaPrayer = Object.freeze({
  calculate,
  version: 'mihrab-methods@1.0.2'
});
