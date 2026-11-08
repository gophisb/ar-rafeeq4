(() => {
  'use strict';

  const KAABA = { lat: 21.422487, lng: 39.826206 };
  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;
  const ALIGN_TOLERANCE = 5;

  const $ = id => document.getElementById(id);
  let qibla = null;
  let heading = null;
  let smooth = null;
  let wasAligned = false;
  let sensorOn = false;
  let sensorHandler = null;
  let sensorEventName = null;
  let locationListener = null;
  let initialized = false;

  function normalize(value) { return ((value % 360) + 360) % 360; }
  function angularDifference(target, current) { return ((target - current + 540) % 360) - 180; }

  function qiblaBearing(lat, lng) {
    const phi1 = lat * RAD;
    const phi2 = KAABA.lat * RAD;
    const deltaLambda = (KAABA.lng - lng) * RAD;
    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    return normalize(Math.atan2(y, x) * DEG);
  }

  function distanceKm(lat, lng) {
    const radius = 6371;
    const phi1 = lat * RAD;
    const phi2 = KAABA.lat * RAD;
    const deltaPhi = phi2 - phi1;
    const deltaLambda = (KAABA.lng - lng) * RAD;
    const a = Math.sin(deltaPhi / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    return 2 * radius * Math.asin(Math.sqrt(a));
  }

  function setStatus(message, type = '') {
    const node = $('rqStatus');
    if (!node) return;
    node.textContent = message;
    node.className = 'rq-pill' + (type ? ' ' + type : '');
  }

  function buildDial() {
    const svg = $('rqDialSvg');
    if (!svg || svg.childElementCount) return;
    const labels = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
    let markup = '';
    for (let angle = 0; angle < 360; angle += 5) {
      const major = angle % 30 === 0;
      const cardinal = angle % 90 === 0;
      const r1 = 176;
      const r2 = cardinal ? 160 : major ? 164 : 169;
      const x1 = Math.sin(angle * RAD) * r1;
      const y1 = -Math.cos(angle * RAD) * r1;
      const x2 = Math.sin(angle * RAD) * r2;
      const y2 = -Math.cos(angle * RAD) * r2;
      markup += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) +
        '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
        '" stroke="rgba(212,175,55,' + (major ? '.8' : '.4') +
        ')" stroke-width="' + (major ? '1.6' : '1') + '"/>';
    }
    for (let angle = 0; angle < 360; angle += 30) {
      const radius = 144;
      const x = Math.sin(angle * RAD) * radius;
      const y = -Math.cos(angle * RAD) * radius;
      const cls = angle === 0 ? 'rq-tick-label cardinal north' :
        (angle % 90 === 0 ? 'rq-tick-label cardinal' : 'rq-tick-label');
      const label = labels[angle] || String(angle);
      markup += '<text class="' + cls + '" x="' + x.toFixed(1) + '" y="' +
        y.toFixed(1) + '" text-anchor="middle" dominant-baseline="central" transform="rotate(' +
        angle + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' + label + '</text>';
    }
    markup += '<line x1="0" y1="-135" x2="0" y2="135" stroke="rgba(255,255,255,.07)"/>' +
      '<line x1="-135" y1="0" x2="135" y2="0" stroke="rgba(255,255,255,.07)"/>';
    svg.innerHTML = markup;
  }

  function updateLocation(location) {
    if (!location || !Number.isFinite(Number(location.lat)) || !Number.isFinite(Number(location.lng))) {
      qibla = null;
      setStatus('تعذر قراءة موقع الرفيق الحالي', 'warn');
      return;
    }
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      qibla = null;
      setStatus('إحداثيات الموقع غير صالحة', 'warn');
      return;
    }
    qibla = qiblaBearing(lat, lng);
    $('rqQibla').textContent = Math.round(qibla) + '°';
    $('rqDistance').textContent = Math.round(distanceKm(lat, lng)).toLocaleString('ar-DZ') + ' كم';
    $('rqLocation').textContent = 'الموقع المستخدم: ' + (location.name || 'الموقع المحفوظ') +
      ' — ' + (location.source === 'gps' ? 'GPS' : 'الولاية');
    $('rqTarget').style.transform = 'rotate(' + qibla + 'deg)';
    $('rqSub').textContent = 'اتجاه القبلة محسوب من موقع الرفيق الحالي';
    wasAligned = false;
    $('rqStage').classList.remove('is-aligned');
    render();
  }

  function headingFromEvent(event) {
    if (typeof event.webkitCompassHeading === 'number' && Number.isFinite(event.webkitCompassHeading)) {
      return normalize(event.webkitCompassHeading);
    }
    if (event.alpha == null) return null;

    const beta = (event.beta || 0) * RAD;
    const gamma = (event.gamma || 0) * RAD;
    const alpha = event.alpha * RAD;
    const cosA = Math.cos(alpha), sinA = Math.sin(alpha);
    const cosB = Math.cos(beta), sinB = Math.sin(beta);
    const cosG = Math.cos(gamma), sinG = Math.sin(gamma);
    const rA = -cosA * sinG - sinA * sinB * cosG;
    const rB = -sinA * sinG + cosA * sinB * cosG;
    return normalize(Math.atan2(rA, rB) * DEG);
  }

  function onOrientation(event) {
    if (event.type === 'deviceorientation' &&
        ('ondeviceorientationabsolute' in window) &&
        !event.webkitCompassHeading) return;
    const value = headingFromEvent(event);
    if (value == null || !Number.isFinite(value)) return;
    sensorOn = true;
    if (smooth == null) smooth = value;
    else {
      const delta = ((value - (smooth % 360) + 540) % 360) - 180;
      smooth += delta * 0.18;
    }
    heading = normalize(smooth);
    render();
  }

  function render() {
    if (qibla == null) return;
    if (heading == null) {
      setStatus('اضغط «تشغيل البوصلة» ثم أمسك الهاتف أفقيًا');
      return;
    }
    $('rqDial').style.transform = 'rotate(' + (-smooth) + 'deg)';
    $('rqHeading').textContent = Math.round(heading) + '°';
    const difference = angularDifference(qibla, heading);
    const aligned = Math.abs(difference) < ALIGN_TOLERANCE;
    $('rqStage').classList.toggle('is-aligned', aligned);
    if (aligned) {
      setStatus('أنت الآن في اتجاه القبلة ✓', 'ok');
      $('rqSub').textContent = 'اتجاه القبلة صحيح';
      $('rqHint').textContent = 'ثبّت الهاتف للحظة';
      if (!wasAligned && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate([200, 100, 200]); } catch (_) {}
      }
    } else {
      const side = difference > 0 ? 'يمينًا' : 'يسارًا';
      setStatus('أدر الهاتف ' + side + ' ' + Math.abs(Math.round(difference)) + '°');
      $('rqSub').textContent = 'اقترب من الاتجاه الصحيح';
      $('rqHint').textContent = 'عند المحاذاة: توهج البوصلة • تظهر الكعبة • يهتز الهاتف';
    }
    wasAligned = aligned;
  }

  async function startSensors() {
    if (sensorHandler) return;
    try {
      if (typeof DeviceOrientationEvent === 'undefined') {
        setStatus('هذا الجهاز لا يوفّر مستشعر اتجاه البوصلة', 'warn');
        $('rqSensorNote').textContent = 'يمكن عرض اتجاه القبلة المحسوب، لكن يلزم مستشعر اتجاه لقياس اتجاه الهاتف.';
        return;
      }
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          setStatus('لم يُمنح إذن مستشعر الاتجاه', 'warn');
          return;
        }
      }
      sensorEventName = ('ondeviceorientationabsolute' in window)
        ? 'deviceorientationabsolute' : 'deviceorientation';
      sensorHandler = onOrientation;
      window.addEventListener(sensorEventName, sensorHandler, true);
      $('rqStart').disabled = true;
      $('rqStart').textContent = 'البوصلة تعمل';
      $('rqSensorNote').textContent = 'المستشعر يعمل. أمسك الهاتف أفقيًا وحرّكه ببطء نحو القبلة.';
      window.setTimeout(() => {
        if (!sensorOn && sensorHandler) {
          setStatus('لم تصل قراءة من مستشعر الاتجاه', 'warn');
          $('rqSensorNote').textContent = 'تحقق من دعم الجهاز للمستشعر ومن أذوناته.';
          $('rqStart').disabled = false;
          $('rqStart').textContent = 'إعادة تشغيل البوصلة';
        }
      }, 3000);
    } catch (_) {
      setStatus('تعذر تشغيل مستشعر الاتجاه', 'warn');
      $('rqSensorNote').textContent = 'قد يمنع المتصفح أو نظام الجهاز تشغيل المستشعر.';
    }
  }

  function requestGps() {
    if (typeof LocationManager === 'undefined') {
      setStatus('مدير الموقع في الرفيق غير متاح', 'warn');
      return;
    }
    setStatus('جاري تحديث الموقع عبر GPS…');
    LocationManager.requestGPS().then(updateLocation).catch(() => {
      setStatus('تعذر تحديث GPS؛ بقي موقع الرفيق المحفوظ', 'warn');
      updateLocation(LocationManager.getCurrent());
    });
  }

  function stop() {
    if (sensorHandler && sensorEventName) {
      window.removeEventListener(sensorEventName, sensorHandler, true);
    }
    sensorHandler = null;
    sensorEventName = null;
    if (locationListener) {
      document.removeEventListener('rafeeq:locationChanged', locationListener);
      locationListener = null;
    }
    sensorOn = false;
    heading = null;
    smooth = null;
    wasAligned = false;
  }

  function initialize() {
    if (initialized) return;
    initialized = true;
    buildDial();
    if (typeof LocationManager === 'undefined') {
      setStatus('مدير الموقع في الرفيق غير متاح', 'warn');
    } else {
      updateLocation(LocationManager.getCurrent() || LocationManager.init());
      locationListener = event => updateLocation(event.detail);
      document.addEventListener('rafeeq:locationChanged', locationListener);
    }
    $('rqStart').addEventListener('click', startSensors);
    $('rqGps').addEventListener('click', requestGps);
  }

  window.RafeeqPages = window.RafeeqPages || {};
  window.RafeeqPages.qibla = initialize;
  window.RafeeqPages['qibla:destroy'] = () => {
    stop();
    initialized = false;
  };
  initialize();
})();