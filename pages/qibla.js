(() => {
  'use strict';

  const KAABA = Object.freeze({ lat: 21.422487, lng: 39.826206 });
  const ALIGNMENT_TOLERANCE = 5;
  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;

  let initialized = false;
  let sensorHandler = null;
  let locationListener = null;
  let qiblaBearing = null;
  let currentHeading = null;
  let smoothedHeading = null;
  let sensorActive = false;
  let aligned = false;

  const byId = id => document.getElementById(id);
  const normalize = value => ((value % 360) + 360) % 360;
  const signedAngle = value => {
    const angle = normalize(value);
    return angle > 180 ? angle - 360 : angle;
  };

  function setText(id, value) {
    const node = byId(id);
    if (node) node.textContent = value;
  }

  function bearingFrom(location) {
    const lat1 = Number(location.lat) * RAD;
    const lat2 = KAABA.lat * RAD;
    const deltaLng = (KAABA.lng - Number(location.lng)) * RAD;
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    return normalize(Math.atan2(y, x) * DEG);
  }

  function distanceKm(location) {
    const lat1 = Number(location.lat) * RAD;
    const lat2 = KAABA.lat * RAD;
    const deltaLat = lat2 - lat1;
    const deltaLng = (KAABA.lng - Number(location.lng)) * RAD;
    const a = Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
  }

  function buildDial() {
    const group = byId('qiblaTicks');
    if (!group || group.childElementCount) return;
    const lines = [];
    for (let degree = 0; degree < 360; degree += 5) {
      const major = degree % 30 === 0;
      const r1 = 178;
      const r2 = degree % 90 === 0 ? 158 : (major ? 164 : 170);
      const angle = degree * RAD;
      const x1 = Math.sin(angle) * r1;
      const y1 = -Math.cos(angle) * r1;
      const x2 = Math.sin(angle) * r2;
      const y2 = -Math.cos(angle) * r2;
      lines.push('<line' + (major ? ' class="major"' : '') +
        ' x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) +
        '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>');
    }
    group.innerHTML = lines.join('');
  }

  function updateLocationDetails(location) {
    if (!location) return;
    document.querySelectorAll('[data-location-name]').forEach(node => {
      node.textContent = location.name || '—';
    });
    document.querySelectorAll('[data-location-source]').forEach(node => {
      node.textContent = location.source === 'gps' ? 'GPS' : 'الولاية المختارة';
    });
    document.querySelectorAll('[data-location-lat]').forEach(node => {
      node.textContent = Number(location.lat).toFixed(5);
    });
    document.querySelectorAll('[data-location-lng]').forEach(node => {
      node.textContent = Number(location.lng).toFixed(5);
    });
  }

  function updateAlignment(isAligned) {
    const stage = byId('qiblaStage');
    if (stage) stage.classList.toggle('aligned', isAligned);
    if (isAligned && !aligned && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate([180, 90, 180]); } catch (_) {}
    }
    aligned = isAligned;
  }

  function renderLocation(location) {
    if (!location || !Number.isFinite(Number(location.lat)) ||
        !Number.isFinite(Number(location.lng)) ||
        Math.abs(Number(location.lat)) > 90 ||
        Math.abs(Number(location.lng)) > 180) {
      qiblaBearing = null;
      setText('qiblaStatus', 'تعذر قراءة موقع الرفيق. اختر ولاية من الإعدادات.');
      const status = byId('qiblaStatus');
      if (status) status.className = 'qibla-status warn';
      return;
    }

    qiblaBearing = bearingFrom(location);
    setText('qiblaBearingValue', Math.round(qiblaBearing) + '°');
    setText('qiblaDistanceValue', Math.round(distanceKm(location)).toLocaleString('ar-DZ') + ' كم');
    setText('qiblaStatus', 'اتجاه القبلة محسوب من موقع الرفيق.');
    const status = byId('qiblaStatus');
    if (status) status.className = 'qibla-status';
    updateLocationDetails(location);
    updateCompass();
  }

  function headingFromEvent(event) {
    if (typeof event.webkitCompassHeading === 'number' &&
        Number.isFinite(event.webkitCompassHeading)) {
      return normalize(event.webkitCompassHeading);
    }
    if (typeof event.alpha !== 'number' || !Number.isFinite(event.alpha)) return null;

    // The page is calibrated for a level phone: alpha is the Z-axis rotation.
    // Using a tilt matrix here can collapse to atan2(0, 0) when beta/gamma are zero.
    const screenAngle = typeof screen !== 'undefined' && screen.orientation &&
      Number.isFinite(screen.orientation.angle) ? screen.orientation.angle : 0;
    return normalize(360 - event.alpha + screenAngle);
  }

  function updateCompass() {
    if (qiblaBearing === null) return;
    const target = byId('qiblaTarget');
    const dial = byId('qiblaDial');
    if (target) target.style.transform = 'rotate(' + qiblaBearing + 'deg)';
    if (dial && currentHeading !== null) {
      dial.style.transform = 'rotate(' + (-currentHeading) + 'deg)';
    }
    if (currentHeading === null) {
      setText('qiblaHint', 'اضغط تشغيل البوصلة، ثم أمسك الهاتف أفقيًا.');
      return;
    }

    const difference = signedAngle(qiblaBearing - currentHeading);
    const distance = Math.abs(difference);
    setText('qiblaHeadingValue', Math.round(currentHeading) + '°');
    const isAligned = distance <= ALIGNMENT_TOLERANCE;
    updateAlignment(isAligned);

    const status = byId('qiblaStatus');
    if (status) {
      status.className = isAligned ? 'qibla-status ok' : 'qibla-status';
      status.textContent = isAligned
        ? 'أنت الآن في اتجاه القبلة ✓'
        : 'أدر الهاتف ' + (difference > 0 ? 'يمينًا ' : 'يسارًا ') +
          Math.round(distance) + '°';
    }
    setText('qiblaHint', isAligned
      ? 'أحسنت؛ ثبّت الهاتف للحظة.'
      : 'حرّك الهاتف ببطء حتى يتجه المؤشر إلى علامة الشمال.');
  }

  function onOrientation(event) {
    const heading = headingFromEvent(event);
    if (heading === null) return;
    sensorActive = true;
    if (smoothedHeading === null) {
      smoothedHeading = heading;
    } else {
      const delta = signedAngle(heading - normalize(smoothedHeading));
      smoothedHeading += delta * 0.2;
    }
    currentHeading = normalize(smoothedHeading);
    setText('qiblaCalibration', 'المعايرة: مستشعر الاتجاه يعمل؛ إذا تذبذب الاتجاه حرّك الهاتف على شكل رقم 8.');
    updateCompass();
  }

  function startSensors() {
    if (sensorHandler) return;
    const status = byId('qiblaSensorStatus');

    if (typeof DeviceOrientationEvent === 'undefined') {
      if (status) status.textContent = 'هذا الجهاز لا يوفّر مستشعر اتجاه؛ تبقى زاوية القبلة والمسافة متاحتين.';
      return;
    }

    const attach = () => {
      sensorHandler = onOrientation;
      const supportsAbsolute = 'ondeviceorientationabsolute' in window;
      if (supportsAbsolute) {
        window.addEventListener('deviceorientationabsolute', sensorHandler, true);
      } else {
        window.addEventListener('deviceorientation', sensorHandler, true);
      }
      if (status) {
        status.textContent = supportsAbsolute
          ? 'تم تشغيل مستشعر الاتجاه المطلق.'
          : 'تم تشغيل مستشعر الاتجاه المتاح؛ قد تختلف دقته حسب الجهاز.';
      }
      const button = byId('qiblaStart');
      if (button) button.textContent = 'البوصلة تعمل';
      setTimeout(() => {
        if (!sensorActive && status) {
          status.textContent = 'لم تصل قراءة من المستشعر. تحقق من دعم البوصلة وجرّب معايرة الهاتف.';
        }
      }, 3000);
    };

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(result => {
        if (result === 'granted') attach();
        else if (status) status.textContent = 'لم يُمنح إذن المستشعر؛ زاوية القبلة المحسوبة ما زالت متاحة.';
      }).catch(() => {
        if (status) status.textContent = 'تعذر طلب إذن المستشعر؛ زاوية القبلة المحسوبة ما زالت متاحة.';
      });
    } else {
      attach();
    }
  }

  function stopSensors() {
    if (sensorHandler) {
      window.removeEventListener('deviceorientationabsolute', sensorHandler, true);
      window.removeEventListener('deviceorientation', sensorHandler, true);
      sensorHandler = null;
    }
    if (locationListener) {
      document.removeEventListener('rafeeq:locationChanged', locationListener);
      locationListener = null;
    }
    currentHeading = null;
    smoothedHeading = null;
    sensorActive = false;
    aligned = false;
  }

  function initialize() {
    if (initialized) return;
    initialized = true;
    buildDial();

    if (typeof window.LocationManager === 'undefined') {
      setText('qiblaStatus', 'مدير الموقع غير متاح؛ أعد تشغيل التطبيق.');
      return;
    }

    const location = window.LocationManager.getCurrent() || window.LocationManager.init();
    renderLocation(location);

    const gpsButton = byId('qiblaUseGps');
    if (gpsButton) {
      gpsButton.addEventListener('click', () => {
        gpsButton.disabled = true;
        setText('qiblaSensorStatus', 'جارٍ طلب إحداثيات GPS…');
        window.LocationManager.requestGPS().then(renderLocation).catch(() => {
          setText('qiblaSensorStatus', 'تعذر الحصول على GPS؛ بقي موقع الولاية/الموقع المحفوظ دون تغيير.');
          renderLocation(window.LocationManager.getCurrent());
        }).finally(() => { gpsButton.disabled = false; });
      });
    }

    const startButton = byId('qiblaStart');
    if (startButton) startButton.addEventListener('click', startSensors);

    locationListener = event => renderLocation(event.detail);
    document.addEventListener('rafeeq:locationChanged', locationListener);
  }

  window.RafeeqPages = window.RafeeqPages || {};
  window.RafeeqPages.qibla = initialize;
  window.RafeeqPages['qibla:destroy'] = () => {
    stopSensors();
    initialized = false;
  };
  initialize();
})();