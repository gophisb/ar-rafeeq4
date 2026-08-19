(function () {
  'use strict';

  const KAABA = { lat: 21.422487, lng: 39.826206 };
  let sensorHandler = null;
  let initialized = false;
  let qiblaBearing = null;

  function normalize(degrees) { return (Number(degrees) + 360) % 360; }
  function bearingFrom(location) {
    const lat1 = Number(location.lat) * Math.PI / 180;
    const lat2 = KAABA.lat * Math.PI / 180;
    const deltaLng = (KAABA.lng - Number(location.lng)) * Math.PI / 180;
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    return normalize(Math.atan2(y, x) * 180 / Math.PI);
  }
  function setText(id, value) { const node = document.getElementById(id); if (node) node.textContent = value; }
  function updateLocationUI(location) {
    if (!location) return;
    document.querySelectorAll('[data-location-name]').forEach(node => { node.textContent = location.name || '—'; });
    document.querySelectorAll('[data-location-source]').forEach(node => { node.textContent = location.source === 'gps' ? 'GPS' : 'الولاية'; });
    document.querySelectorAll('[data-location-lat]').forEach(node => { node.textContent = Number(location.lat).toFixed(4); });
    document.querySelectorAll('[data-location-lng]').forEach(node => { node.textContent = Number(location.lng).toFixed(4); });
  }
  function render(location) {
    if (!location) { setText('qiblaStatus', 'تعذر تحديد الموقع المحلي. اختر ولاية من الإعدادات.'); return; }
    qiblaBearing = bearingFrom(location);
    setText('qiblaStatus', `الموقع: ${location.name} — الاتجاه محسوب محليًا`);
    setText('qiblaBearing', `${Math.round(qiblaBearing)}° من الشمال الحقيقي`);
    updateLocationUI(location);
    const arrow = document.getElementById('qiblaArrow');
    if (arrow) arrow.style.transform = `translate(-50%, -50%) rotate(${qiblaBearing}deg)`;
  }
  function headingFromEvent(event) {
    if (typeof event.webkitCompassHeading === 'number' && Number.isFinite(event.webkitCompassHeading)) return normalize(event.webkitCompassHeading);
    if (typeof event.alpha === 'number' && Number.isFinite(event.alpha)) return normalize(360 - event.alpha);
    return null;
  }
  function updateHeading(heading) {
    if (heading === null || qiblaBearing === null) return;
    const difference = normalize(qiblaBearing - heading);
    setText('qiblaHeadingValue', `اتجاه الهاتف: ${Math.round(heading)}° من الشمال`);
    setText('qiblaDifference', `الفرق بين الهاتف والقبلة: ${Math.round(difference)}°`);
    setText('qiblaCalibration', 'المعايرة: مستشعر الاتجاه يعمل');
    const arrow = document.getElementById('qiblaArrow');
    if (arrow) arrow.style.transform = `translate(-50%, -50%) rotate(${difference}deg)`;
  }
  function startSensor() {
    const status = document.getElementById('qiblaSensorStatus');
    const start = () => {
      if (sensorHandler) return;
      sensorHandler = event => updateHeading(headingFromEvent(event));
      window.addEventListener('deviceorientationabsolute', sensorHandler, true);
      window.addEventListener('deviceorientation', sensorHandler, true);
      setText('qiblaCalibration', 'المعايرة: حرّك الهاتف على شكل رقم 8 إذا كان الاتجاه غير مستقر.');
      if (status) status.textContent = 'تم تفعيل مستشعر الاتجاه.';
    };
    try {
      if (typeof DeviceOrientationEvent === 'undefined') {
        if (status) status.textContent = 'هذا الجهاز لا يدعم مستشعر الاتجاه؛ الزاوية المحسوبة ما زالت متاحة.';
        return;
      }
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(result => {
          if (result === 'granted') start();
          else if (status) status.textContent = 'لم يُمنح إذن المستشعر؛ الزاوية المحسوبة ما زالت متاحة.';
        }).catch(() => { if (status) status.textContent = 'تعذر طلب إذن المستشعر؛ الزاوية المحسوبة ما زالت متاحة.'; });
      } else {
        start();
      }
    } catch (_) {
      if (status) status.textContent = 'تعذر تشغيل المستشعر؛ الزاوية المحسوبة ما زالت متاحة.';
    }
  }
  function stopSensor() {
    if (!sensorHandler) return;
    window.removeEventListener('deviceorientationabsolute', sensorHandler, true);
    window.removeEventListener('deviceorientation', sensorHandler, true);
    sensorHandler = null;
  }
  function initialize() {
    if (initialized) return;
    initialized = true;
    const location = typeof LocationManager !== 'undefined' ? (LocationManager.getCurrent() || LocationManager.init()) : null;
    render(location);
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
  window.RafeeqPages.qibla = initialize;
  window.RafeeqPages['qibla:destroy'] = () => { stopSensor(); initialized = false; };
  initialize();
})();
