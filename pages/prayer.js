(function () {
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
  const key = 'rafeeq.prayer.manualWilaya.v1';
  const adhanKey = 'rafeeq.adhan.enabled.v1';
  const names = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
  let location = null;
  let dailyTimes = null;
  let calculationDateKey = '';
  let timer = null;
  let initialized = false;
  let lastAnnounced = '';
  let adhanEnabled = localStorage.getItem(adhanKey) === 'true';

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
  function setLocation(next, source) {
    if (!next) return;
    location = next;
    dailyTimes = null;
    calculationDateKey = '';
    locationStatus.textContent = source === 'gps' ? `تم استخدام GPS: ${next.name || 'الموقع الحالي'}` : `الموقع اليدوي ثابت: ${next.name}`;
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
        locationStatus.textContent = 'تعذر حساب المواقيت لهذا الموقع.';
        console.error('Prayer calculation failed', error);
      }
    }
    return dailyTimes;
  }
  function renderTimes() {
    if (!dailyTimes) return;
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
    if (!location || !window.PrayerEngine) return;
    const now = new Date();
    if (!currentTime) return;
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
  function destroy() {
    window.clearTimeout(timer);
    timer = null;
    initialized = false;
  }
  function initialize() {
    if (initialized) return;
    initialized = true;
    if (!window.Locations || !window.PrayerEngine) {
      locationStatus.textContent = 'محرك الصلاة غير متاح.';
      return;
    }
    select.innerHTML = '';
    Locations.all().forEach(w => {
      const option = document.createElement('option');
      option.value = w.code;
      option.textContent = `${w.code} — ${w.name}`;
      select.appendChild(option);
    });
    const saved = localStorage.getItem(key) || '16';
    select.value = saved;
    setLocation(Locations.toPrayerLocation(Locations.getByCode(saved) || Locations.getDefault()), 'manual');
    updateAdhanStatus(adhanEnabled ? 'التشغيل التلقائي مفعّل من الإعدادات.' : 'التشغيل متوقف حتى تفعّله من الإعدادات.');
    document.getElementById('useWilaya').onclick = () => {
      const w = Locations.getByCode(select.value);
      if (!w) return;
      localStorage.setItem(key, w.code);
      setLocation(Locations.toPrayerLocation(w), 'manual');
      refresh();
    };
    document.getElementById('useGps').onclick = () => {
      locationStatus.textContent = 'جاري طلب إذن GPS...';
      PrayerEngine.getGPSLocation({ timeout: 15000 }).then(gps => setLocation(gps, 'gps')).catch(() => {
        locationStatus.textContent = 'تعذر استخدام GPS؛ بقي الاختيار اليدوي محفوظًا.';
      });
    };
    if (testAdhan) testAdhan.onclick = () => playAdhan('test');
    refresh();
  }

  window.RafeeqPages = window.RafeeqPages || {};
  window.RafeeqPages.prayer = initialize;
  window.RafeeqPages['prayer:destroy'] = destroy;
  initialize();
})();
