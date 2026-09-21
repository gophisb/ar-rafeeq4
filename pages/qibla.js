(() => {
  'use strict';

  const KAABA = { lat: 21.422487, lng: 39.826206 };
  const ALIGNMENT_TOLERANCE = 8;
  const REQUIRED_STABLE_READINGS = 3;
  let sensorHandler = null;
  let initialized = false;
  let qiblaBearing = null;
  let aligned = false;
  let stableReadings = 0;
  let lastHeading = null;
  let locationListener = null;

  function normalize(degrees) { return (Number(degrees) + 360) % 360; }
  function signedAngle(degrees) {
    const value = normalize(degrees);
    return value > 180 ? value - 360 : value;
  }
  function angularDistance(a, b) {
    const difference = Math.abs(normalize(a) - normalize(b));
    return Math.min(difference, 360 - difference);
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
  function setAlignmentState(isAligned, announce = true) {
    const compass = document.getElementById('qiblaCompass');
    const kaaba = document.getElementById('qiblaKaaba');
    const hint = document.getElementById('qiblaCenterHint');
    const alignmentStatus = document.getElementById('qiblaAlignmentStatus');
    if (compass) compass.classList.toggle('is-aligned', isAligned);
    if (kaaba) kaaba.hidden = !isAligned;
    if (hint) hint.hidden = isAligned;
    if (alignmentStatus) {
      alignmentStatus.classList.toggle('is-aligned', isAligned);
      alignmentStatus.textContent = isAligned
        ? 'تم اكتشاف اتجاه القبلة — الكعبة أمامك.'
        : 'صورة الكعبة تظهر عند اكتشاف اتجاه القبلة.';
    }
    if (isAligned && !aligned && announce) {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate([120, 80, 220]); } catch (_) {}
      }
      setText('qiblaStatus', 'تم اكتشاف اتجاه القبلة.');
    }
    aligned = isAligned;
  }
  function updateLocationUI(location) {
    if (!location) return;
    document.querySelectorAll('[data-location-name]').forEach(node => { node.textContent = location.name || '—'; });
    document.querySelectorAll('[data-location-source]').forEach(node => { node.textContent = location.source === 'gps' ? 'GPS' : 'الولاية'; });
    document.querySelectorAll('[data-location-lat]').forEach(node => { node.textContent = Number(location.lat).toFixed(4); });
    document.querySelectorAll('[data-location-lng]').forEach(node => { node.textContent = Number(location.lng).toFixed(4); });
  }
  function render(location) {
    if (!location) {
      setText('qiblaStatus', 'تعذر تحديد الموقع المحلي. اختر ولاية من الإعدادات.');
      return;
    }
    qiblaBearing = bearingFrom(location);
    stableReadings = 0;
    lastHeading = null;
    setAlignmentState(false, false);
    setText('qiblaStatus', `الموقع: ${location.name || 'الموقع المحفوظ'} — الاتجاه محسوب محليًا`);
    setText('qiblaBearing', `${Math.round(qiblaBearing)}° من الشمال الحقيقي`);
    updateLocationUI(location);
    const arrow = document.getElementById('qiblaArrow');
    if (arrow) arrow.style.transform = 'translate(-50%, -50%) rotate(0deg)';
  }
  function headingFromEvent(event) {
    let heading = null;
    if (typeof event.webkitCompassHeading === 'number' && Number.isFinite(event.webkitCompassHeading)) {
      heading = event.webkitCompassHeading;
    } else if (typeof event.alpha === 'number' && Number.isFinite(event.alpha)) {
      heading = 360 - event.alpha;
    }
    if (heading === null) return null;
    const orientation = typeof screen !== 'undefined' && screen.orientation && Number.isFinite(screen.orientation.angle)
      ? screen.orientation.angle : 0;
    return normalize(heading + orientation);
  }
  function updateHeading(heading) {
    if (heading === null || qiblaBearing === null) return;
    lastHeading = heading;
    const signedDifference = signedAngle(qiblaBearing - heading);
    const distance = Math.abs(signedDifference);
    setText('qiblaHeadingValue', `اتجاه الهاتف: ${Math.round(heading)}° من الشمال`);
    setText('qiblaDifference', `الفرق بين الهاتف والقبلة: ${Math.round(distance)}°`);
    setText('qiblaCalibration', 'المعايرة: مستشعر الاتجاه يعمل');
    const arrow = document.getElementById('qiblaArrow');
    if (arrow) arrow.style.transform = `translate(-50%, -50%) rotate(${signedDifference}deg)`;
    if (distance <= ALIGNMENT_TOLERANCE) {
      stableReadings += 1;
      if (stableReadings >= REQUIRED_STABLE_READINGS) setAlignmentState(true);
    } else {
      stableReadings = 0;
      if (aligned) setAlignmentState(false);
    }
  }
  function startSensor() {
    const status = document.getElementById('qiblaSensorStatus');
    const start = () => {
      if (sensorHandler) return;
      sensorHandler = event => updateHeading(headingFromEvent(event));
      window.addEventListener('deviceorientationabsolute', sensorHandler, true);
      window.addEventListener('deviceorientation', sensorHandler, true);
      setText('qiblaCalibration', 'المعايرة: حرّك الهاتف على شكل رقم 8 إذا كان الاتجاه غير مستقر.');
      if (status) status.textContent = 'تم تفعيل مستشعر الاتجاه؛ حرّك الهاتف حتى يتجه السهم إلى القبلة.';
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
    if (sensorHandler) {
      window.removeEventListener('deviceorientationabsolute', sensorHandler, true);
      window.removeEventListener('deviceorientation', sensorHandler, true);
      sensorHandler = null;
    }
    if (locationListener) {
      document.removeEventListener('rafeeq:locationChanged', locationListener);
      locationListener = null;
    }
    aligned = false;
    lastHeading = null;
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
    locationListener = event => render(event.detail);
    document.addEventListener('rafeeq:locationChanged', locationListener);
  }
  window.RafeeqPages = window.RafeeqPages || {};
  window.RafeeqPages.qibla = initialize;
  window.RafeeqPages['qibla:destroy'] = () => { stopSensor(); initialized = false; };
  initialize();
})();
