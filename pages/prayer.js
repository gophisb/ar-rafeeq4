(() => {
  'use strict';

  const select = document.getElementById('wilayaSelect');
  const list = document.getElementById('prayerTimesList');
  const locationStatus = document.getElementById('prayerLocationStatus');
  const currentTime = document.getElementById('currentTime');
  const nextName = document.getElementById('nextPrayerName');
  const nextTime = document.getElementById('nextPrayerTime');
  const countdown = document.getElementById('countdown');
  const audio = document.getElementById('adhanAudio');
  const testAdhan = document.getElementById('testAdhan');
  const adhanStatus = document.getElementById('adhanStatus');
  const adhanKey = 'rafeeq.adhan.enabled.v1';
  const names = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
  let location = null;
  let dailyTimes = null;
  let calculationDateKey = '';
  let timer = null;
  let initialized = false;
  let lastAnnounced = '';
  let locationListener = null;
  let adhanEnabled = localStorage.getItem(adhanKey) === 'true';

  function normalizeLocation(next) {
    if (!next) return null;
    return {
      ...next,
      latitude: Number(next.latitude ?? next.lat),
      longitude: Number(next.longitude ?? next.lng),
      timezone: Number(next.timezone ?? 1)
    };
  }

  function escapeHtml(v) { return String(v || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }
  function dateKey(date) { return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; }
  function updateAdhanStatus(text) { if (adhanStatus) adhanStatus.textContent = text; }
  function playAdhan(reason) {
    if (!audio) return;
    if (!adhanEnabled && reason !== 'test') {
      updateAdhanStatus('الأذان محفوظ محليًا، لكن التشغيل التلقائي متوقف من الإعدادات.');
      return;
    }
    audio.currentTime = 0;
    const result = audio.play();
    if (result && typeof result.catch === 'function') {
      result.then(() => updateAdhanStatus('يُشغّل الأذان المحلي الآن.')).catch(() => updateAdhanStatus('رفض المتصفح التشغيل التلقائي؛ اضغط «تجربة الأذان» للسماح بالصوت.'));
    } else {
      updateAdhanStatus('يُشغّل الأذان المحلي الآن.');
    }
  }
  function formatLocationStatus(next, source) {
    if (source === 'gps' || next.source === 'gps') {
      return `تم تحديد الموقع عبر GPS: ${next.lat.toFixed(4)}، ${next.lng.toFixed(4)}. المواقيت محسوبة من إحداثيات هاتفك.`;
    }
    return `تم اعتماد ولاية ${next.name} (${next.code}). المواقيت محسوبة من إحداثيات الولاية.`;
  }
  function setSelectForLocation(next) {
    if (!select) return;
    select.value = next && next.source !== 'gps' ? next.code : '';
  }
  function setLocation(next, source = next?.source || 'wilaya') {
    if (!next) return;
    location = normalizeLocation(next);
    if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
      if (locationStatus) locationStatus.textContent = 'إحداثيات الموقع غير صالحة؛ اختر ولاية أو أعد محاولة GPS.';
      return;
    }
    dailyTimes = null;
    calculationDateKey = '';
    setSelectForLocation(next);
    if (locationStatus) locationStatus.textContent = formatLocationStatus(next, source);
    calculateDay(new Date());
  }
  function calculateDay(now) {
    if (!location || !window.PrayerEngine) return null;
    const keyNow = dateKey(now);
    if (!dailyTimes || calculationDateKey !== keyNow) {
      try {
        dailyTimes = PrayerEngine.calculate(now, location, PrayerEngine.DEFAULT_SETTINGS);
        calculationDateKey = keyNow;
        renderTimes();
      } catch (error) {
        dailyTimes = null;
        calculationDateKey = '';
        if (locationStatus) locationStatus.textContent = 'تعذر حساب المواقيت لهذا الموقع.';
        console.error('Prayer calculation failed', error);
      }
    }
    return dailyTimes;
  }
  function renderTimes() {
    if (!dailyTimes || !list) return;
    list.innerHTML = Object.keys(names).map(name => `<article class="card prayer-time-row"><span>${names[name]}</span><strong>${escapeHtml(dailyTimes.formatted[name])}</strong></article>`).join('');
  }
  function maybeAnnounce(times, now) {
    if (!adhanEnabled || !times || !times.minutes) return;
    const minuteNow = now.getHours() * 60 + now.getMinutes();
    Object.keys(names).forEach(prayerKey => {
      const prayerMinutes = Number(times.minutes[prayerKey]);
      if (!Number.isFinite(prayerMinutes) || Math.floor(prayerMinutes) !== minuteNow) return;
      const announcementKey = `${dateKey(now)}-${prayerKey}`;
      if (announcementKey === lastAnnounced) return;
      lastAnnounced = announcementKey;
      playAdhan('automatic');
    });
  }
  function tick() {
    if (!location || !window.PrayerEngine || !currentTime) return;
    const now = new Date();
    currentTime.textContent = now.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const times = calculateDay(now);
    if (!times) return;
    let next = PrayerEngine.getNextPrayer(times);
    if (!next || next.minutesRemaining <= 0 || dateKey(now) !== calculationDateKey) {
      dailyTimes = null;
      const recalculated = calculateDay(now);
      next = recalculated ? PrayerEngine.getNextPrayer(recalculated) : null;
    }
    if (next) {
      nextName.textContent = next.title || '—';
      nextTime.textContent = `${next.formatted || '—'}${next.tomorrow ? ' — غدًا' : ''}`;
      countdown.textContent = PrayerEngine.formatCountdown(next.minutesRemaining);
    } else {
      nextName.textContent = '—';
      nextTime.textContent = '—';
      countdown.textContent = '--:--:--';
    }
    maybeAnnounce(times, now);
  }
  function refresh() {
    tick();
    window.clearTimeout(timer);
    timer = window.setTimeout(refresh, 1000);
  }
  function populateWilayas(current) {
    if (!select || !window.Locations) return;
    select.innerHTML = '<option value="" disabled>اختر ولاية جزائرية يدويًا</option>';
    Locations.all().forEach(w => {
      const option = document.createElement('option');
      option.value = w.code;
      option.textContent = `${w.code} — ${w.name}`;
      select.appendChild(option);
    });
    setSelectForLocation(current);
  }
  function destroy() {
    window.clearTimeout(timer);
    timer = null;
    if (locationListener) {
      document.removeEventListener('rafeeq:locationChanged', locationListener);
      locationListener = null;
    }
    initialized = false;
  }
  function initialize() {
    if (initialized) return;
    initialized = true;
    if (!window.Locations || !window.PrayerEngine || !window.LocationManager) {
      if (locationStatus) locationStatus.textContent = 'خدمات الموقع أو محرك الصلاة غير متاحة.';
      return;
    }
    const current = LocationManager.getCurrent() || LocationManager.init();
    populateWilayas(current);
    setLocation(current, current.source);
    updateAdhanStatus(adhanEnabled ? 'التشغيل التلقائي مفعّل من الإعدادات.' : 'التشغيل متوقف حتى تفعّله من الإعدادات.');
    document.getElementById('useWilaya').onclick = () => {
      const wilaya = Locations.getByCode(select?.value);
      if (!wilaya) {
        if (locationStatus) locationStatus.textContent = 'اختر ولاية من القائمة أولًا، ثم اضغط «اعتماد الولاية المختارة».';
        return;
      }
      LocationManager.setWilaya(wilaya.code);
      const selected = LocationManager.getCurrent() || Locations.toPrayerLocation(wilaya);
      setLocation(selected, 'wilaya');
      refresh();
    };
    document.getElementById('useGps').onclick = () => {
      if (locationStatus) locationStatus.textContent = 'جاري طلب إذن GPS... وافق على الوصول إلى موقعك ليتم الحساب تلقائيًا.';
      LocationManager.requestGPS().then(gps => setLocation(gps, 'gps')).catch(error => {
        if (locationStatus) locationStatus.textContent = error?.code === 1 ? 'لم تسمح بالوصول إلى GPS؛ اختر ولاية يدويًا من القائمة.' : 'تعذر استخدام GPS؛ اختر ولاية يدويًا من القائمة وحاول مرة أخرى.';
      });
    };
    if (testAdhan) testAdhan.onclick = () => playAdhan('test');
    locationListener = event => {
      if (event.detail) setLocation(event.detail, event.detail.source);
    };
    document.addEventListener('rafeeq:locationChanged', locationListener);
    refresh();
  }

  window.RafeeqPages = window.RafeeqPages || {};
  window.RafeeqPages.prayer = initialize;
  window.RafeeqPages['prayer:destroy'] = destroy;
  initialize();
})();
