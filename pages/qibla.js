(() => {
  'use strict';

  const KAABA = { lat: 21.422487, lng: 39.826206 };
  const ALIGNMENT_TOLERANCE = 8;
  const ALIGNMENT_EXIT_TOLERANCE = 12;
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
  let torchBusy = false;

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

  function wait(milliseconds) {
    return new Promise(resolve => window.setTimeout(resolve, milliseconds));
  }

  async function flashTorchTwice() {
    let stream = null;
    let track = null;
    try {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') return false;
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } }
      });
      track = stream.getVideoTracks()[0];
      if (!track || typeof track.applyConstraints !== 'function') return false;

      const capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : null;
      if (capabilities && capabilities.torch === false) return false;

      const setTorch = enabled => track.applyConstraints({ advanced: [{ torch: enabled }] });
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
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([600, 120, 600]);
      }
    } catch (_) {}

    if (torchBusy) return;
    torchBusy = true;
    flashTorchTwice().then(available => {
      torchBusy = false;
      setText('qiblaSensorStatus', available
        ? 'تم اكتشاف القبلة: اهتزاز وتنبيهان ضوئيان.'
        : 'تم اكتشاف القبلة والاهتزاز؛ الفلاش غير متاح أو لم يُمنح إذن الكاميرا.');
    }).catch(() => {
      torchBusy = false;
      setText('qiblaSensorStatus', 'تم اكتشاف القبلة والاهتزاز؛ تعذر تشغيل الفلاش على هذا الجهاز.');
    });
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
      triggerAlignmentAlert();
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
    const hasEulerAngles = Number.isFinite(event.alpha) &&
      Number.isFinite(event.beta) && Number.isFinite(event.gamma);
    const isAbsolute = event.absolute === true || event.type === 'deviceorientationabsolute';
    if (!isAbsolute || !hasEulerAngles) return null;

    const radians = Math.PI / 180;
    const alpha = event.alpha * radians;
    const beta = event.beta * radians;
    const gamma = event.gamma * radians;
    const cA = Math.cos(alpha);
    const sA = Math.sin(alpha);
    const cB = Math.cos(beta);
    const sB = Math.sin(beta);
    const cG = Math.cos(gamma);
    const sG = Math.sin(gamma);

    // الإسقاط الأفقي للمتجه العمودي على الشاشة؛ يصبح صالحًا عند حمل الهاتف عموديًا.
    const normalEast = -cA * sG - sA * sB * cG;
    const normalNorth = -sA * sG + cA * sB * cG;
    const normalHorizontal = Math.hypot(normalEast, normalNorth);

    const screenAngle = typeof screen !== 'undefined' && screen.orientation &&
      Number.isFinite(screen.orientation.angle) ? screen.orientation.angle : 0;

    // عندما تكون الشاشة شبه أفقية، يكون أعلى الشاشة هو محور الاتجاه الأنسب.
    if (normalHorizontal < 0.55) {
      if (typeof event.webkitCompassHeading === 'number' && Number.isFinite(event.webkitCompassHeading)) {
        return normalize(event.webkitCompassHeading + screenAngle);
      }
      return normalize(360 - event.alpha + screenAngle);
    }

    // عند حمل الهاتف عموديًا، نحسب اتجاه واجهة الشاشة بعد تعويض الميل ثلاثي الأبعاد.
    return normalize(Math.atan2(normalEast, normalNorth) / radians);
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

    if (aligned) {
      if (distance > ALIGNMENT_EXIT_TOLERANCE) {
        stableReadings = 0;
        setAlignmentState(false);
      }
    } else if (distance <= ALIGNMENT_TOLERANCE) {
      stableReadings += 1;
      if (stableReadings >= REQUIRED_STABLE_READINGS) setAlignmentState(true);
    } else {
      stableReadings = 0;
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
    if (status) status.textContent = 'تم تشغيل البوصلة. عند اكتشاف القبلة سيهتز الهاتف؛ وقد يطلب إذن الكاميرا لتشغيل الفلاش مرتين. أبقِ الهاتف بعيدًا عن المعادن والمغناطيس.';
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
