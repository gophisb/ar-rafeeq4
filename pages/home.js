"use strict";

(function () {
  const prayerKey = 'rafeeq.prayer.manualWilaya.v1';
  const names = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
  let timer = null;
  let location = null;
  let dailyTimes = null;
  let calculationDateKey = '';
  let dailyVerse = null;
  let versePromise = null;
  let dhikrPromise = null;
  let ramadanTimes = null;
  let ramadanDateKey = '';
  const verseRequestKey = 'rafeeq.quran.openVerse.v1';

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
    if (window.LocationManager) {
      const current = LocationManager.getCurrent() || LocationManager.init();
      if (current) {
        return {
          ...current,
          latitude: Number(current.latitude ?? current.lat),
          longitude: Number(current.longitude ?? current.lng),
          timezone: Number(current.timezone ?? 1)
        };
      }
    }
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

  function getHijriParts(date) {
    try {
      const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(date);
      return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
    } catch (_) {
      return null;
    }
  }

  function isRamadan(date) {
    return getHijriParts(date)?.month === 9;
  }

  function formatDuration(milliseconds) {
    const total = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
  }

  function dateAtMinutes(baseDate, minutes) {
    const target = new Date(baseDate);
    target.setHours(0, 0, 0, 0);
    target.setMinutes(Math.round(minutes));
    return target;
  }

  function updateRamadan(now, times) {
    const card = document.getElementById('ramadan-card');
    if (!card) return;
    if (!isRamadan(now) || !times?.minutes) {
      card.hidden = true;
      ramadanTimes = null;
      ramadanDateKey = '';
      return;
    }
    card.hidden = false;
    const key = dateKey(now);
    if (!ramadanTimes || ramadanDateKey !== key) {
      const imsakOffset = 10;
      const todayImsak = Number(times.minutes.fajr) - imsakOffset;
      const todayIftar = Number(times.minutes.maghrib);
      const tomorrow = PrayerEngine.calculateTomorrow(now, location, PrayerEngine.DEFAULT_SETTINGS);
      const tomorrowImsak = Number(tomorrow?.minutes?.fajr) - imsakOffset;
      ramadanTimes = { todayImsak, todayIftar, tomorrowImsak };
      ramadanDateKey = key;
    }
    const imsak = dateAtMinutes(now, ramadanTimes.todayImsak);
    const iftar = dateAtMinutes(now, ramadanTimes.todayIftar);
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    let target = iftar;
    let label = 'متبقي على الإفطار';
    if (nowMinutes < ramadanTimes.todayImsak) {
      target = imsak;
      label = 'متبقي على الإمساك';
    } else if (nowMinutes >= ramadanTimes.todayIftar) {
      target = dateAtMinutes(now, ramadanTimes.tomorrowImsak);
      target.setDate(target.getDate() + 1);
      label = 'متبقي على الإمساك';
    }
    setText('ramadan-suhoor-time', formatTimeFromMinutes(ramadanTimes.todayImsak));
    setText('ramadan-iftar-time', formatTimeFromMinutes(ramadanTimes.todayIftar));
    setText('ramadan-countdown-label', label);
    setText('ramadan-countdown', formatDuration(target.getTime() - now.getTime()));
    const hijri = getHijriParts(now);
    setText('ramadan-day-label', `اليوم ${hijri?.day || '—'} من رمضان — حسب ${location.source === 'gps' ? 'موقع GPS' : (location.name || 'الولاية')}`);
  }

  function formatTimeFromMinutes(minutes) {
    if (!Number.isFinite(minutes)) return '--:--';
    const normalized = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const mins = Math.round(normalized % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  function render(now) {
    setText('home-current-time', formatClock(now));
    setText('home-hijri-date', formatHijri(now));
    const times = calculate(now);
    updateRamadan(now, times);
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

  function loadDailyVerse() {
    if (versePromise) return versePromise;
    versePromise = fetch('./pages/quran-local.json')
      .then(response => { if (!response.ok) throw new Error('quran-local.json'); return response.json(); })
      .then(surahs => {
        const verses = [];
        surahs.forEach(surah => (surah.a || []).forEach(ayah => verses.push({ surah: Number(surah.i), ayah: Number(ayah.n), text: ayah.t })));
        if (!verses.length) throw new Error('empty-quran');
        const day = Math.floor(Date.now() / 86400000);
        dailyVerse = verses[day % verses.length];
        setText('home-verse', dailyVerse.text);
        setText('home-verse-reference', `سورة رقم ${dailyVerse.surah} — الآية ${dailyVerse.ayah}`);
        return dailyVerse;
      })
      .catch(() => {
        setText('home-verse', 'تعذر تحميل آية اليوم من الملف المحلي.');
        setText('home-verse-reference', 'القرآن المحلي غير متاح مؤقتًا');
        return null;
      });
    return versePromise;
  }

  function bindVerseReading() {
    const button = document.querySelector('.verse-actions [data-navigate="quran"]');
    if (!button || button.dataset.verseBound === 'true') return;
    button.dataset.verseBound = 'true';
    button.addEventListener('click', () => {
      if (dailyVerse) localStorage.setItem(verseRequestKey, JSON.stringify(dailyVerse));
    });
  }

  function loadDailyDhikr() {
    if (dhikrPromise) return dhikrPromise;
    dhikrPromise = fetch('./pages/azkar-data.json')
      .then(response => { if (!response.ok) throw new Error('azkar-data.json'); return response.json(); })
      .then(items => {
        if (!Array.isArray(items) || !items.length) throw new Error('empty-azkar');
        const day = Math.floor(Date.now() / 86400000);
        const item = items[day % items.length];
        setText('home-dhikr', item.text || 'ذكر محفوظ محليًا');
        setText('home-dhikr-count', `${item.countDescription || `التكرار: ${item.count}`} — ${item.type === 2 ? 'ذكر المساء' : 'ذكر الصباح والمساء'}`);
        return item;
      })
      .catch(() => {
        setText('home-dhikr', 'تعذر تحميل الذكر المحلي.');
        setText('home-dhikr-count', 'بيانات الأذكار غير متاحة مؤقتًا');
        return null;
      });
    return dhikrPromise;
  }

  function destroy() {
    window.clearTimeout(timer);
    timer = null;
    dailyTimes = null;
    calculationDateKey = '';
    ramadanTimes = null;
    ramadanDateKey = '';
  }

  function initialize() {
    destroy();
    location = resolveLocation();
    loadDailyVerse();
    loadDailyDhikr();
    bindVerseReading();
    if (location) {
      setText('home-location', location.source === 'gps' ? 'موقعك عبر GPS' : (location.name || '—'));
    }
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
