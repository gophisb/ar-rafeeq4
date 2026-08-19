(function () {
  'use strict';

  const KAABA = { lat: 21.422487, lng: 39.826206 };
  let sensorHandler = null;
  let sensorActive = false;

  function normalize(degrees) {
    return (degrees + 360) % 360;
  }

  function bearingFrom(location) {
    const lat1 = Number(location.lat) * Math.PI / 180;
    const lat2 = KAABA.lat * Math.PI / 180;
    const deltaLng = (KAABA.lng - Number(location.lng)) * Math.PI / 180;
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    return normalize(Math.atan2(y, x) * 180 / Math.PI);
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function render(location) {
    if (!location) {
      setText('qiblaStatus', 'تعذر تحديد الموقع المحلي. اختر ولاية من الإعدادات.');
      return;
    }
    const bearing = bearingFrom(location);
    const rounded = Math.round(bearing);
    setText('qiblaStatus', `الموقع: ${location.name} — الاتجاه محسوب محليًا`);
    document.querySelectorAll('[data-location-name]').forEach(node => { node.textContent = location.name || '—'; });
    document.querySelectorAll('[data-location-source]').forEach(node => { node.textContent = location.source === 'gps' ? 'GPS' : 'الولاية'; });
    document.querySelectorAll('[data-location-lat]').forEach(node => { node.textContent = Number(location.lat).toFixed(4); });
    document.querySelectorAll('[data-location-lng]').forEach(node => { node.textContent = Number(location.lng).toFixed(4); });
    setText('qiblaBearing', `${rounded}° من الشمال الحقيقي`);
    const arrow = document.getElementById('qiblaArrow');
    if (arrow) arrow.style.transform = `translate(-50%, -50%) rotate(${bearing}deg)`;
  }

  function sensorHeading(event) {
    if (typeof event.webkitCompassHeading === 'number') return event.webkitCompassHeading;
    if (typeof event.alpha === 'number') return normalize(360 - event.alpha);
    return null;
  }

  function startSensor() {
    const status = document.getElementById('qiblaSensorStatus');
    const start = () => {
      sensorHandler = event => {
        const location = LocationManager && LocationManager.getCurrent();
        const heading = sensorHeading(event);
        if (!location || heading === null) return;
        const arrow = document.getElementById('qiblaArrow');
        const bearing = bearingFrom(location);
        if (arrow) arrow.style.transform = `translate(-50%, -50%) rotate(${normalize(bearing - heading)}deg)`;
      };
      window.addEventListener('deviceorientationabsolute', sensorHandler, true);
      window.addEventListener('deviceorientation', sensorHandler, true);
      sensorActive = true;
      if (status) status.textContent = 'تم تفعيل البوصلة. حرّك الجهاز على شكل رقم 8 لمعايرة المستشعر.';
    };

    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(result => {
          if (result === 'granted') start();
          else if (status) status.textContent = 'لم يُمنح إذن مستشعر الاتجاه؛ سيبقى الاتجاه المحسوب متاحًا.';
        }).catch(() => { if (status) status.textContent = 'تعذر طلب إذن المستشعر؛ سيبقى الاتجاه المحسوب متاحًا.'; });
      } else if ('DeviceOrientationEvent' in window) {
        start();
      } else if (status) {
        status.textContent = 'هذا الجهاز لا يدعم مستشعر الاتجاه؛ استخدم الزاوية المحسوبة.';
      }
    } catch (_) {
      if (status) status.textContent = 'تعذر تشغيل المستشعر؛ سيبقى الاتجاه المحسوب متاحًا.';
    }
  }

  function stopSensor() {
    if (!sensorHandler) return;
    window.removeEventListener('deviceorientationabsolute', sensorHandler, true);
    window.removeEventListener('deviceorientation', sensorHandler, true);
    sensorHandler = null;
    sensorActive = false;
  }

  function init() {
    stopSensor();
    const location = typeof LocationManager !== 'undefined' ? (LocationManager.getCurrent() || LocationManager.init()) : null;
    render(location);
    setTimeout(() => {
      const latest = typeof LocationManager !== 'undefined' ? LocationManager.getCurrent() : location;
      render(latest);
    }, 0);
    const gps = document.getElementById('qiblaUseGps');
    const calibrate = document.getElementById('qiblaCalibrate');
    if (gps) gps.onclick = () => {
      setText('qiblaStatus', 'جاري طلب الموقع...');
      LocationManager.requestGPS().then(render).catch(() => {
        setText('qiblaStatus', 'تعذر الوصول إلى GPS؛ استُخدم الموقع المحفوظ محليًا.');
        render(LocationManager.getCurrent());
      });
    };
    if (calibrate) calibrate.onclick = startSensor;
    document.addEventListener('rafeeq:locationChanged', event => render(event.detail), { once: true });
  }

  window.RafeeqPages = window.RafeeqPages || {};
  window.RafeeqPages.qibla = init;
  window.RafeeqPages['qibla:destroy'] = stopSensor;
  init();
})();
