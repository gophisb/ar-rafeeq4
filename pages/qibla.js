(() => {
  'use strict';

  const KAABA = { lat: 21.422487, lng: 39.826206 };
  const ALIGNMENT_TOLERANCE = 8;
  const REQUIRED_STABLE_READINGS = 5;
  const FILTER_SLOW = 0.14;
  const FILTER_FAST = 0.32;
  const ABSOLUTE_FALLBACK_WINDOW_MS = 1200;

  let sensorHandler = null;
  let initialized = false;
  let qiblaBearing = null;
  let aligned = false;
  let stableReadings = 0;
  let filteredHeading = null;
  let lastSampleAt = 0;
  let lastAbsoluteAt = 0;
  let permissionPending = false;
  let locationListener = null;

  function normalize(degrees) { return ((Number(degrees) % 360) + 360) % 360; }
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
    filteredHeading = null;
    lastSampleAt = 0;
    setAlignmentState(false, false);
    setText('qiblaStatus', `الموقع: ${location.name || 'الموقع المحفوظ'} — الاتجاه محسوب محليًا`);
    setText('qiblaBearing', `${Math.round(qiblaBearing)}° من الشمال الحقيقي`);
    updateLocationUI(location);
    const arrow = document.getElementById('qiblaArrow');
    if (arrow) arrow.style.transform = 'translate(-50%, -50%) rotate(0deg)';
  }

  function headingFromEvent(event) {
    if (typeof event.webkitCompassHeading === 'number' && Number.isFinite(event.webkitCompassHeading)) {
      return normalize(event.webkitCompassHeading);
    }

    // لا نستخدم alpha النسبي على أنه شمال حقيقي؛ لا يصلح لحساب القبلة.
    const isAbsolute = event.absolute === true || event.type === 'deviceorientationabsolute';
    if (!isAbsolute || typeof event.alpha !== 'number' || !Number.isFinite(event.alpha)) return null;

    const screenAngle = typeof screen !== 'undefined' && screen.orientation &&
      Number.isFinite(screen.orientation.angle) ? screen.orientation.angle : 0;
    return normalize(360 - event.alpha + screenAngle);
  }

  function smoothHeading(rawHeading, now) {
    if (filteredHeading === null || !lastSampleAt) {
      filteredHeading = rawHeading;
      lastSampleAt = now;
      return filteredHeading;
    }

    const delta = angularDistance(filteredHeading, rawHeading);
    // استجابة أسرع عند تدوير الهاتف فعليًا، وتنعيم أقوى للاهتزازات الصغيرة.
    const factor = delta > 25 ? FILTER_FAST : FILTER_SLOW;
    const currentRad = filteredHeading * Math.PI / 180;
    const targetRad = rawHeading * Math.PI / 180;
    const x = (1 - factor) * Math.cos(currentRad) + factor * Math.cos(targetRad);
    const y = (1 - factor) * Math.sin(currentRad) + factor * Math.sin(targetRad);
    filteredHeading = normalize(Math.atan2(y, x) * 180 / Math.PI);
    lastSampleAt = now;
    return filteredHeading;
  }

  function updateHeading(rawHeading) {
    if (rawHeading === null || qiblaBearing === null) return;

    const heading = smoothHeading(rawHeading, Date.now());
    const signedDifference = signedAngle(qiblaBearing - heading);
    const distance = Math.abs(signedDifference);

    setText('qiblaHeadingValue', `اتجاه الهاتف: ${Math.round(heading)}° من الشمال`);
    setText('qiblaDifference', `الفرق بين الهاتف والقبلة: ${Math.round(distance)}°`);
    setText('qiblaCalibration', 'المعايرة: مستشعر الاتجاه يعمل');

    const arrow = document.getElementById('qiblaArrow');
    if (arrow) arrow.style.transform = `translate(-50%, -50%) rotate(${signedDifference.toFixed(1)}deg)`;

    if (distance <= ALIGNMENT_TOLERANCE) {
      stableReadings += 1;
      if (stableReadings >= REQUIRED_STABLE_READINGS) setAlignmentState(true);
    } else {
      stableReadings = 0;
      if (aligned) setAlignmentState(false);
    }
  }

  function onOrientation(event) {
    const now = Date.now();
    const isAbsoluteEvent = event.type === 'deviceorientationabsolute' || event.absolute === true;

    // بعض المتصفحات تطلق الحدثين معًا؛ لا نسمح للقراءة النسبية بإفساد القراءة المطلقة.
    if (!isAbsoluteEvent && now - lastAbsoluteAt < ABSOLUTE_FALLBACK_WINDOW_MS) return;
    if (isAbsoluteEvent) lastAbsoluteAt = now;

    const heading = headingFromEvent(event);
    if (heading === null) {
      setText('qiblaCalibration', 'المعايرة: ننتظر قراءة شمال حقيقي من المستشعر.');
      return;
    }
    updateHeading(heading);
  }

  function startListening() {
    if (sensorHandler) return;
    filteredHeading = null;
    lastSampleAt = 0;
    lastAbsoluteAt = 0;
    sensorHandler = onOrientation;
    window.addEventListener('deviceorientationabsolute', sensorHandler, true);
    window.addEventListener('deviceorientation', sensorHandler, true);

    setText('qiblaCalibration', 'المعايرة: جارٍ انتظار قراءة المستشعر...');
    const status = document.getElementById('qiblaSensorStatus');
    if (status) status.textContent = 'تم طلب تشغيل البوصلة. أبقِ الهاتف بعيدًا عن المعادن والمغناطيس.';
    window.setTimeout(() => {
      if (sensorHandler && !lastSampleAt && status) {
        status.textContent = 'لم تصل قراءة بوصلة صالحة. تحقق من دعم المستشعر وأذوناته، ثم أعد المحاولة.';
      }
    }, 2500);
  }

  function startSensor() {
    const status = document.getElementById('qiblaSensorStatus');
    if (sensorHandler || permissionPending) return;

    try {
      if (typeof DeviceOrientationEvent === 'undefined') {
        if (status) status.textContent = 'هذا الجهاز أو المتصفح لا يوفّر مستشعر اتجاه صالحًا.';
        return;
      }

      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        permissionPending = true;
        DeviceOrientationEvent.requestPermission().then(result => {
          permissionPending = false;
          if (result === 'granted') startListening();
          else if (status) status.textContent = 'لم يُمنح إذن المستشعر. اسمح بالوصول إلى الحركة والاتجاه من إعدادات المتصفح.';
        }).catch(() => {
          permissionPending = false;
          if (status) status.textContent = 'تعذر طلب إذن المستشعر. تحقق من إعدادات المتصفح وحاول مجددًا.';
        });
      } else {
        startListening();
      }
    } catch (_) {
      permissionPending = false;
      if (status) status.textContent = 'تعذر تشغيل المستشعر؛ تحقق من دعم الجهاز وإعدادات الأذونات.';
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
    permissionPending = false;
    aligned = false;
    filteredHeading = null;
    lastSampleAt = 0;
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
