(() => {
  'use strict';

  let mounted = false;
  let locationListener = null;
  let gpsButton = null;
  let gpsHandler = null;

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function updateLocationDetails(location) {
    if (!location) return;
    document.querySelectorAll('[data-location-name]').forEach(node => {
      node.textContent = location.name || '—';
    });
    document.querySelectorAll('[data-location-source]').forEach(node => {
      node.textContent = location.source === 'gps' ? 'GPS' : 'الولاية';
    });
    document.querySelectorAll('[data-location-lat]').forEach(node => {
      node.textContent = Number(location.lat).toFixed(4);
    });
    document.querySelectorAll('[data-location-lng]').forEach(node => {
      node.textContent = Number(location.lng).toFixed(4);
    });
  }

  function applyLocation(location) {
    if (!mounted || !location) return;
    window.QiblaCompass.setLocation(Number(location.lat), Number(location.lng));
    updateLocationDetails(location);
    setText('qiblaLocationStatus',
      location.source === 'gps'
        ? 'يُستخدم موقع GPS الحالي لحساب اتجاه القبلة.'
        : 'يُستخدم موقع الولاية المحفوظ في الرفيق.');
  }

  function initialize() {
    if (mounted) return;
    const container = document.getElementById('qiblaCompassMount');
    if (!container || !window.QiblaCompass) {
      setText('qiblaLocationStatus', 'تعذر تحميل وحدة البوصلة. أعد فتح صفحة القبلة.');
      return;
    }

    const location = window.LocationManager
      ? (LocationManager.getCurrent() || LocationManager.init())
      : null;

    window.QiblaCompass.mount(container, {
      lat: location ? Number(location.lat) : null,
      lon: location ? Number(location.lng) : null,
      quality: 'auto',
      manual: true,
      vibrate: true
    });

    mounted = true;
    if (location) updateLocationDetails(location);
    setText('qiblaLocationStatus', location
      ? (location.source === 'gps'
        ? 'يُستخدم موقع GPS الحالي لحساب اتجاه القبلة.'
        : 'يُستخدم موقع الولاية المحفوظ في الرفيق.')
      : 'لا يوجد موقع صالح؛ اختر ولاية من إعدادات الرفيق أو استخدم GPS.');

    gpsButton = document.getElementById('qiblaUseGps');
    gpsHandler = () => {
      if (!window.LocationManager) {
        setText('qiblaLocationStatus', 'خدمة الموقع غير متاحة حاليًا.');
        return;
      }
      setText('qiblaLocationStatus', 'جارٍ طلب موقع GPS...');
      LocationManager.requestGPS()
        .then(applyLocation)
        .catch(() => {
          if (!mounted) return;
          setText('qiblaLocationStatus', 'تعذر الوصول إلى GPS؛ بقي الموقع المحفوظ دون تغيير.');
        });
    };
    if (gpsButton) gpsButton.addEventListener('click', gpsHandler);

    locationListener = event => applyLocation(event.detail);
    document.addEventListener('rafeeq:locationChanged', locationListener);
  }

  function destroy() {
    mounted = false;
    if (gpsButton && gpsHandler) gpsButton.removeEventListener('click', gpsHandler);
    if (locationListener) document.removeEventListener('rafeeq:locationChanged', locationListener);
    gpsButton = null;
    gpsHandler = null;
    locationListener = null;
    if (window.QiblaCompass) window.QiblaCompass.unmount();
  }

  window.RafeeqPages = window.RafeeqPages || {};
  window.RafeeqPages.qibla = initialize;
  window.RafeeqPages['qibla:destroy'] = destroy;
  initialize();
})();
