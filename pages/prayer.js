(function () {
  'use strict';
  const select = document.getElementById('wilayaSelect');
  const list = document.getElementById('prayerTimesList');
  const locationStatus = document.getElementById('prayerLocationStatus');
  const nextName = document.getElementById('nextPrayerName');
  const nextTime = document.getElementById('nextPrayerTime');
  const countdown = document.getElementById('countdown');
  const key = 'rafeeq.prayer.manualWilaya.v1';
  let location = null;
  let timer = null;
  const names = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
  function escapeHtml(v) { return String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
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
  function tick(times) {
    const next = PrayerEngine.getNextPrayer(times);
    if (!next) return;
    nextName.textContent = next.title;
    nextTime.textContent = `${next.formatted}${next.tomorrow ? ' — غدًا' : ''}`;
    countdown.textContent = PrayerEngine.formatCountdown(next.minutesRemaining);
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
    refresh();
  }
  document.getElementById('useWilaya').addEventListener('click', () => { const w = Locations.getByCode(select.value); if (!w) return; localStorage.setItem(key, w.code); setLocation(Locations.toPrayerLocation(w), 'manual'); refresh(); });
  document.getElementById('useGps').addEventListener('click', () => { locationStatus.textContent = 'جاري طلب إذن GPS...'; PrayerEngine.getGPSLocation({ timeout: 15000 }).then(gps => setLocation(gps, 'gps')).catch(() => { locationStatus.textContent = 'تعذر استخدام GPS؛ بقي الاختيار اليدوي محفوظًا.'; }); });
  initialize();
})();
