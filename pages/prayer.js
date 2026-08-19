(function () {
  'use strict';
  const select = document.getElementById('wilayaSelect');
  const list = document.getElementById('prayerTimesList');
  const locationStatus = document.getElementById('prayerLocationStatus');
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
  let timer = null;
  let lastAnnounced = '';
  let adhanEnabled = localStorage.getItem(adhanKey) === 'true';

  function escapeHtml(v) { return String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  function updateAdhanStatus(text) { if (adhanStatus) adhanStatus.textContent = text; }
  function playAdhan(reason) {
    if (!audio) return;
    if (!adhanEnabled && reason !== 'test') { updateAdhanStatus('الأذان محفوظ محليًا، لكن التشغيل التلقائي متوقف من الإعدادات.'); return; }
    audio.currentTime = 0;
    const result = audio.play();
    if (result && typeof result.catch === 'function') result.catch(() => updateAdhanStatus('اضغط «تجربة الأذان» مرة واحدة للسماح بالتشغيل في هذا المتصفح.'));
    else updateAdhanStatus('يُشغّل الأذان المحلي الآن.');
  }
  function setLocation(next, source) {
    if (!next) return;
    location = next;
    locationStatus.textContent = source === 'gps' ? `تم استخدام GPS: ${next.name || 'الموقع الحالي'}` : `الموقع اليدوي ثابت: ${next.name}`;
    render();
  }
  function render() {
    if (!location || !window.PrayerEngine) return;
    const times = PrayerEngine.calculate(new Date(), location, PrayerEngine.DEFAULT_SETTINGS);
    const rows = Object.keys(names).map(keyName => `<article class="card prayer-time-row"><span>${names[keyName]}</span><strong>${escapeHtml(times.formatted[keyName])}</strong></article>`).join('');
    list.innerHTML = rows;
    tick(times);
  }
  function maybeAnnounce(times) {
    if (!adhanEnabled) return;
    const now = new Date();
    const dayKey = now.toISOString().slice(0, 10);
    Object.keys(names).forEach(prayerKey => {
      const formatted = String(times.formatted[prayerKey] || '');
      const match = formatted.match(/(\d{1,2}):(\d{2})/);
      if (!match) return;
      if (Number(match[1]) === now.getHours() && Number(match[2]) === now.getMinutes()) {
        const announcementKey = `${dayKey}-${prayerKey}`;
        if (announcementKey !== lastAnnounced) { lastAnnounced = announcementKey; playAdhan('automatic'); }
      }
    });
  }
  function tick(times) {
    const next = PrayerEngine.getNextPrayer(times);
    if (!next) return;
    nextName.textContent = next.title;
    nextTime.textContent = `${next.formatted}${next.tomorrow ? ' — غدًا' : ''}`;
    countdown.textContent = PrayerEngine.formatCountdown(next.minutesRemaining);
    maybeAnnounce(times);
  }
  function refresh() {
    if (!location) return;
    const times = PrayerEngine.calculate(new Date(), location, PrayerEngine.DEFAULT_SETTINGS);
    tick(times);
    window.clearTimeout(timer);
    timer = window.setTimeout(refresh, 1000);
  }
  function initialize() {
    if (!window.Locations || !window.PrayerEngine) { locationStatus.textContent = 'محرك الصلاة غير متاح.'; return; }
    Locations.all().forEach(w => { const option = document.createElement('option'); option.value = w.code; option.textContent = `${w.code} — ${w.name}`; select.appendChild(option); });
    const saved = localStorage.getItem(key) || '16';
    select.value = saved;
    setLocation(Locations.toPrayerLocation(Locations.getByCode(saved) || Locations.getDefault()), 'manual');
    updateAdhanStatus(adhanEnabled ? 'التشغيل التلقائي مفعّل من الإعدادات.' : 'التشغيل متوقف حتى تفعّله من الإعدادات.');
    refresh();
  }
  document.getElementById('useWilaya').addEventListener('click', () => { const w = Locations.getByCode(select.value); if (!w) return; localStorage.setItem(key, w.code); setLocation(Locations.toPrayerLocation(w), 'manual'); refresh(); });
  document.getElementById('useGps').addEventListener('click', () => { locationStatus.textContent = 'جاري طلب إذن GPS...'; PrayerEngine.getGPSLocation({ timeout: 15000 }).then(gps => setLocation(gps, 'gps')).catch(() => { locationStatus.textContent = 'تعذر استخدام GPS؛ بقي الاختيار اليدوي محفوظًا.'; }); });
  if (testAdhan) testAdhan.addEventListener('click', () => playAdhan('test'));
  initialize();
})();
