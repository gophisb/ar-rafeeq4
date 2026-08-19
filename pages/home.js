"use strict";

(function () {
  const prayerKey = 'rafeeq.prayer.manualWilaya.v1';
  const names = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
  let timer = null;
  let location = null;
  let dailyTimes = null;
  let calculationDateKey = '';

  function dateKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function formatClock(date) {
    return date.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  function formatHijri(date) {
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    } catch (_) {
      return 'التاريخ الهجري غير متاح';
    }
  }

  function resolveLocation() {
    if (!window.Locations || typeof Locations.toPrayerLocation !== 'function') return null;
    const saved = localStorage.getItem(prayerKey) || '16';
    const wilaya = Locations.getByCode(saved) || Locations.getDefault();
    return Locations.toPrayerLocation(wilaya);
  }

  function calculate(now) {
    if (!location || !window.PrayerEngine) return null;
    const key = dateKey(now);
    if (!dailyTimes || calculationDateKey !== key) {
      dailyTimes = PrayerEngine.calculate(now, location, PrayerEngine.DEFAULT_SETTINGS);
      calculationDateKey = key;
    }
    return dailyTimes;
  }

  function render(now) {
    setText('home-current-time', formatClock(now));
    setText('home-hijri-date', formatHijri(now));
    const times = calculate(now);
    if (!times || !window.PrayerEngine) {
      setText('home-next-prayer', 'تعذر الحساب');
      setText('home-next-prayer-time', '--:--');
      setText('home-prayer-countdown', '--:--:--');
      return;
    }
    let next = PrayerEngine.getNextPrayer(times);
    if (!next || next.minutesRemaining <= 0 || calculationDateKey !== dateKey(now)) {
      dailyTimes = null;
      next = PrayerEngine.getNextPrayer(calculate(now));
    }
    if (!next) {
      setText('home-next-prayer', 'لا توجد صلاة قادمة');
      setText('home-next-prayer-time', '--:--');
      setText('home-prayer-countdown', '--:--:--');
      return;
    }
    setText('home-next-prayer', next.title || names[next.name] || 'الصلاة القادمة');
    setText('home-next-prayer-time', `${next.formatted || '--:--'}${next.tomorrow ? ' — غدًا' : ''}`);
    setText('home-prayer-countdown', PrayerEngine.formatCountdown(next.minutesRemaining));
  }

  function refresh() {
    render(new Date());
    window.clearTimeout(timer);
    timer = window.setTimeout(refresh, 1000);
  }

  function destroy() {
    window.clearTimeout(timer);
    timer = null;
    dailyTimes = null;
    calculationDateKey = '';
  }

  function initialize() {
    destroy();
    location = resolveLocation();
    if (location && window.PrayerEngine) refresh();
    else {
      setText('home-current-time', formatClock(new Date()));
      setText('home-hijri-date', formatHijri(new Date()));
      setText('home-next-prayer', 'محرك الصلاة غير متاح');
    }
  }

  window.RafeeqPages = window.RafeeqPages || {};
  window.RafeeqPages.home = initialize;
  window.RafeeqPages['home:destroy'] = destroy;
})();
