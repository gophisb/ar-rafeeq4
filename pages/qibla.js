(() => {
  'use strict';

  const KAABA = Object.freeze({ lat: 21.422487, lng: 39.826206 });
  const ALIGNMENT_ENTER_TOLERANCE = 8;
  const ALIGNMENT_EXIT_TOLERANCE = 12;
  const REQUIRED_STABLE_READINGS = 5;
  const FILTER_SLOW = 0.14;
  const FILTER_FAST = 0.32;
  const ABSOLUTE_PRIORITY_MS = 1200;
  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;

  let initialized = false;
  let sensorHandler = null;
  let sensorFallbackTimer = null;
  let sensorTimeoutTimer = null;
  let locationListener = null;
  let qiblaBearing = null;
  let filteredHeading = null;
  let lastSampleAt = 0;
  let lastAbsoluteAt = 0;
  let sensorActive = false;
  let aligned = false;
  let stableReadings = 0;
  let permissionPending = false;
  let torchBusy = false;

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

  function wait(milliseconds) {
    return new Promise(resolve => window.setTimeout(resolve, milliseconds));
  }

  async function flashTorchTwice() {
    let stream = null;
    let track = null;
    try {
      if (!navigator.mediaDevices ||
          typeof navigator.mediaDevices.getUserMedia !== 'function') return false;

      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } }
      });
      track = stream.getVideoTracks()[0];
      if (!track || typeof track.applyConstraints !== 'function') return false;

      const capabilities = typeof track.getCapabilities === 'function'
        ? track.getCapabilities() : null;
      if (capabilities && capabilities.torch === false) return false;

      const setTorch = enabled =>
        track.applyConstraints({ advanced: [{ torch: enabled }] });

      await setTorch(true);
      await wait(180);
      await setTorch(false);
      await wait(160);
      await setTorch(true);
      await wait(180);
      await setTorch(false);
      return true;
    } catch (_) {
      return false;
    } finally {
      if (track) {
        try { await track.applyConstraints({ advanced: [{ torch: false }] }); } catch (_) {}
      }
      if (stream) {
        stream.getTracks().forEach(videoTrack => {
          try { videoTrack.stop(); } catch (_) {}
        });
      }
    }
  }

  function triggerAlignmentAlert() {
    try {
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate([600, 120, 600]);
      }
    } catch (_) {}

    if (torchBusy) return;
    torchBusy = true;
    flashTorchTwice().then(available => {
      torchBusy = false;
      setText('qiblaSensorStatus', available
        ? 'تم تثبيت اتجاه القبلة: اهتزاز وتنبيهان ضوئيان.'
        : 'تم تثبيت اتجاه القبلة والاهتزاز؛ الفلاش غير مدعوم أو لم يُسمح باستخدام الكاميرا.');
    }).catch(() => {
      torchBusy = false;
      setText('qiblaSensorStatus', 'تم تثبيت اتجاه القبلة والاهتزاز؛ تعذر تشغيل الفلاش على هذا الجهاز.');
    });
  }

  function updateAlignment(isAligned, announce = true) {
    const stage = byId('qiblaStage');
    if (stage) stage.classList.toggle('aligned', isAligned);
    if (isAligned && !aligned && announce) triggerAlignmentAlert();
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
    setText('qiblaDistanceValue',
      Math.round(distanceKm(location)).toLocaleString('ar-DZ') + ' كم');
    setText('qiblaStatus', 'اتجاه القبلة محسوب من موقع الرفيق.');
    const status = byId('qiblaStatus');
    if (status) status.className = 'qibla-status';
    updateLocationDetails(location);

    filteredHeading = null;
    lastSampleAt = 0;
    stableReadings = 0;
    updateAlignment(false, false);
    updateCompass();
  }

  function screenRotation() {
    if (typeof screen !== 'undefined' && screen.orientation &&
        Number.isFinite(screen.orientation.angle)) {
      return screen.orientation.angle;
    }
    return 0;
  }

  function headingFromEvent(event) {
    if (typeof event.webkitCompassHeading === 'number' &&
        Number.isFinite(event.webkitCompassHeading)) {
      return normalize(event.webkitCompassHeading);
    }

    if (!Number.isFinite(event.alpha)) return null;

    const isAbsolute = event.absolute === true ||
      event.type === 'deviceorientationabsolute';
    const rotation = screenRotation();

    if (isAbsolute && Number.isFinite(event.beta) &&
        Number.isFinite(event.gamma)) {
      const alpha = event.alpha * RAD;
      const beta = event.beta * RAD;
      const gamma = event.gamma * RAD;
      const cA = Math.cos(alpha);
      const sA = Math.sin(alpha);
      const cB = Math.cos(beta);
      const sB = Math.sin(beta);
      const cG = Math.cos(gamma);
      const sG = Math.sin(gamma);

      const east = -cA * sG - sA * sB * cG;
      const north = -sA * sG + cA * sB * cG;
      const horizontal = Math.hypot(east, north);

      if (horizontal >= 0.55) {
        return normalize(Math.atan2(east, north) * DEG + rotation);
      }
    }

    // Fallback for level phones and browsers that expose alpha without the
    // absolute event. In the latter case the browser may not provide true north.
    return normalize(360 - event.alpha + rotation);
  }

  function smoothHeading(rawHeading, now) {
    if (filteredHeading === null || !lastSampleAt) {
      filteredHeading = rawHeading;
      lastSampleAt = now;
      return filteredHeading;
    }

    const difference = signedAngle(rawHeading - filteredHeading);
    const factor = Math.abs(difference) > 25 ? FILTER_FAST : FILTER_SLOW;
    const currentRad = filteredHeading * RAD;
    const targetRad = rawHeading * RAD;
    const x = (1 - factor) * Math.cos(currentRad) + factor * Math.cos(targetRad);
    const y = (1 - factor) * Math.sin(currentRad) + factor * Math.sin(targetRad);
    filteredHeading = normalize(Math.atan2(y, x) * DEG);
    lastSampleAt = now;
    return filteredHeading;
  }

  function updateCompass() {
    if (qiblaBearing === null) return;

    const target = byId('qiblaTarget');
    const dial = byId('qiblaDial');
    if (target) target.style.transform = 'rotate(' + qiblaBearing + 'deg)';
    if (dial && filteredHeading !== null) {
      dial.style.transform = 'rotate(' + (-filteredHeading) + 'deg)';
    }

    if (filteredHeading === null) {
      setText('qiblaHint', 'اضغط تشغيل البوصلة، ثم أمسك الهاتف أفقيًا أو عموديًا.');
      return;
    }

    const difference = signedAngle(qiblaBearing - filteredHeading);
    const distance = Math.abs(difference);
    setText('qiblaHeadingValue', Math.round(filteredHeading) + '°');

    if (aligned) {
      if (distance > ALIGNMENT_EXIT_TOLERANCE) {
        stableReadings = 0;
        updateAlignment(false);
      }
    } else if (distance <= ALIGNMENT_ENTER_TOLERANCE) {
      stableReadings += 1;
      if (stableReadings >= REQUIRED_STABLE_READINGS) {
        updateAlignment(true);
        setText('qiblaStatus', 'تم تثبيت اتجاه القبلة ✓');
      }
    } else {
      stableReadings = 0;
    }

    const isAligned = aligned;
    const status = byId('qiblaStatus');
    if (status && !isAligned) {
      status.className = 'qibla-status';
      status.textContent = 'أدر الهاتف ' +
        (difference > 0 ? 'يمينًا ' : 'يسارًا ') +
        Math.round(distance) + '°';
    } else if (status) {
      status.className = 'qibla-status ok';
      status.textContent = 'أنت الآن في اتجاه القبلة ✓';
    }

    setText('qiblaHint', isAligned
      ? 'أحسنت؛ ثبّت الهاتف للحظة.'
      : 'حرّك الهاتف ببطء حتى يتجه المؤشر إلى علامة الشمال.');
  }

  function onOrientation(event) {
    const now = Date.now();
    const isAbsolute = event.type === 'deviceorientationabsolute' ||
      event.absolute === true;

    if (!isAbsolute && now - lastAbsoluteAt < ABSOLUTE_PRIORITY_MS) return;
    if (isAbsolute) lastAbsoluteAt = now;

    const heading = headingFromEvent(event);
    if (heading === null) return;

    sensorActive = true;
    if (sensorFallbackTimer) {
      clearTimeout(sensorFallbackTimer);
      sensorFallbackTimer = null;
    }

    smoothHeading(heading, now);
    if (!isAbsolute && typeof event.webkitCompassHeading !== 'number') {
      setText('qiblaCalibration',
        'المعايرة: قراءة اتجاه متاحة، لكن الشمال الحقيقي غير مؤكد في هذا المتصفح.');
    } else {
      setText('qiblaCalibration',
        'المعايرة: مستشعر الاتجاه يعمل؛ أبعد الهاتف عن المعادن والمغناطيس.');
    }
    updateCompass();
  }

  function attachSensors() {
    if (sensorHandler) return;

    sensorHandler = onOrientation;
    window.addEventListener('deviceorientationabsolute', sensorHandler, true);
    window.addEventListener('deviceorientation', sensorHandler, true);

    const button = byId('qiblaStart');
    if (button) button.textContent = 'البوصلة تعمل';

    setText('qiblaSensorStatus',
      'تم تشغيل مستشعر الاتجاه. أبعد الهاتف عن المعادن والمغناطيس، وحرّكه ببطء للمعايرة.');

    sensorFallbackTimer = window.setTimeout(() => {
      if (!sensorActive) {
        setText('qiblaSensorStatus',
          'لم تصل قراءة مطلقة؛ نجرّب قراءة الاتجاه المتاحة على هذا الجهاز.');
      }
      sensorFallbackTimer = null;
    }, 2500);

    sensorTimeoutTimer = window.setTimeout(() => {
      if (!sensorActive && sensorHandler) {
        setText('qiblaSensorStatus',
          'لم تصل قراءة من المستشعر. تحقق من دعم البوصلة وأذونات الحركة، ثم أعد المحاولة.');
      }
      sensorTimeoutTimer = null;
    }, 5000);
  }

  function startSensors() {
    if (sensorHandler || permissionPending) return;

    if (typeof DeviceOrientationEvent === 'undefined') {
      setText('qiblaSensorStatus',
        'هذا الجهاز أو المتصفح لا يوفّر مستشعر اتجاه؛ تبقى زاوية القبلة والمسافة متاحتين.');
      return;
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      permissionPending = true;
      DeviceOrientationEvent.requestPermission().then(result => {
        permissionPending = false;
        if (result === 'granted') attachSensors();
        else setText('qiblaSensorStatus',
          'لم يُمنح إذن مستشعر الاتجاه؛ اسمح بالوصول إلى الحركة والاتجاه ثم حاول مجددًا.');
      }).catch(() => {
        permissionPending = false;
        setText('qiblaSensorStatus',
          'تعذر طلب إذن المستشعر؛ تحقق من إعدادات المتصفح وحاول مجددًا.');
      });
    } else {
      attachSensors();
    }
  }

  function stopSensors() {
    if (sensorFallbackTimer) {
      clearTimeout(sensorFallbackTimer);
      sensorFallbackTimer = null;
    }
    if (sensorTimeoutTimer) {
      clearTimeout(sensorTimeoutTimer);
      sensorTimeoutTimer = null;
    }
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
    sensorActive = false;
    filteredHeading = null;
    lastSampleAt = 0;
    lastAbsoluteAt = 0;
    stableReadings = 0;
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

    const location = window.LocationManager.getCurrent() ||
      window.LocationManager.init();
    renderLocation(location);

    const gpsButton = byId('qiblaUseGps');
    if (gpsButton) {
      gpsButton.addEventListener('click', () => {
        gpsButton.disabled = true;
        setText('qiblaSensorStatus', 'جارٍ طلب إحداثيات GPS…');
        window.LocationManager.requestGPS().then(renderLocation).catch(() => {
          setText('qiblaSensorStatus',
            'تعذر الحصول على GPS؛ بقي موقع الولاية/الموقع المحفوظ دون تغيير.');
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
