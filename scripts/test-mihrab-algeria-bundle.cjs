const assert = require('node:assert/strict');

global.window = globalThis;
require('../vendor/mihrab-algeria.js');

assert.ok(global.RafeeqAlgeriaPrayer, 'offline Algeria engine must be exposed');

const result = global.RafeeqAlgeriaPrayer.calculate(
  new Date('2026-10-24T12:00:00+01:00'),
  { latitude: 36.19, longitude: 5.4108 }
);

assert.equal(result.source, 'mihrab-methods/algeria');
assert.equal(result.date, '2026-10-24');
assert.equal(result.status, 'certified', 'test date must be within upstream certification');
assert.ok(result.referencePlace, 'a reference city must be reported');
assert.ok(Number.isFinite(result.distanceKm), 'reference distance must be numeric');

for (const key of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
  assert.match(result.formatted[key], /^[0-9]{2}:[0-9]{2}$/, key + ' must be HH:MM');
  assert.ok(Number.isInteger(result.minutes[key]), key + ' must expose integer minutes');
}

console.log(JSON.stringify({
  status: result.status,
  date: result.date,
  referencePlace: result.referencePlace,
  distanceKm: result.distanceKm,
  formatted: result.formatted
}, null, 2));
