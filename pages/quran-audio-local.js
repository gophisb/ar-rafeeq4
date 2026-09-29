/* Ar-Rafeeq 4 — Local Quran Audio Proof Layer
 * Non-invasive pilot: manifest validation + local storage adapter boundary.
 * Does not replace RafeeqRecitation and does not download audio yet.
 */
(function (root) {
  'use strict';

  const MANIFEST_PATH = '../assets/audio/minshawy-proof-manifest.json';

  function isCapacitorAndroid() {
    return !!(
      root.Capacitor &&
      typeof root.Capacitor.isNativePlatform === 'function' &&
      root.Capacitor.isNativePlatform() &&
      root.Capacitor.getPlatform &&
      root.Capacitor.getPlatform() === 'android'
    );
  }

  function validateManifest(manifest) {
    const errors = [];
    if (!manifest || typeof manifest !== 'object') errors.push('manifest');
    if (manifest?.schemaVersion !== 1) errors.push('schemaVersion');
    if (manifest?.feature !== 'quran-audio') errors.push('feature');
    if (manifest?.audioBytesIncluded !== false) errors.push('audioBytesIncluded');
    if (!Array.isArray(manifest?.pilotSurahs) || manifest.pilotSurahs.length !== 2) {
      errors.push('pilotSurahs');
    }

    for (const item of manifest?.pilotSurahs || []) {
      if (!Number.isInteger(item.surah) || item.surah < 1 || item.surah > 114) errors.push('surah');
      if (!Number.isInteger(item.ayahs) || item.ayahs < 1) errors.push('ayahs');
      if (!Array.isArray(item.sources) || item.sources.length < 1) errors.push('sources');
      if (!item.timing || !item.timing.source) errors.push('timing');
    }
    return { valid: errors.length === 0, errors };
  }

  async function loadManifest() {
    const response = await fetch(MANIFEST_PATH, { cache: 'no-store' });
    if (!response.ok) throw new Error('تعذّر تحميل مخطط صوت القرآن');
    const manifest = await response.json();
    const check = validateManifest(manifest);
    if (!check.valid) throw new Error('مخطط صوت القرآن غير صالح: ' + check.errors.join(','));
    return manifest;
  }

  async function getFilesystem() {
    if (!isCapacitorAndroid()) return null;
    if (!root.Capacitor.Plugins?.Filesystem) return null;
    return root.Capacitor.Plugins.Filesystem;
  }

  async function localFileExists(path) {
    const fs = await getFilesystem();
    if (!fs) return false;
    try {
      await fs.stat({ path, directory: 'DATA' });
      return true;
    } catch (_) {
      return false;
    }
  }

  async function removeLocalFile(path) {
    const fs = await getFilesystem();
    if (!fs) return false;
    try {
      await fs.deleteFile({ path, directory: 'DATA' });
      return true;
    } catch (_) {
      return false;
    }
  }

  root.RafeeqQuranAudioLocal = Object.freeze({
    isCapacitorAndroid,
    validateManifest,
    loadManifest,
    localFileExists,
    removeLocalFile
  });
})(window);
