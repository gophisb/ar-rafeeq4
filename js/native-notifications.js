(() => {
  'use strict';

  const ADHAN_KEY = 'rafeeq.adhan.enabled.v1';
  const CHANNEL_ID = 'rafeeq_adhan_v2';
  const BASE_ID = 41000;
  const PRAYER_NAMES = {
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء'
  };
  const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  let lastSignature = '';
  let channelReady = false;

  function nativePlugin() {
    const capacitor = window.Capacitor;
    if (!capacitor || (typeof capacitor.isNativePlatform === 'function' && !capacitor.isNativePlatform())) return null;
    return capacitor.Plugins && capacitor.Plugins.LocalNotifications ? capacitor.Plugins.LocalNotifications : null;
  }

  function enabled() {
    try { return localStorage.getItem(ADHAN_KEY) === 'true'; } catch (_) { return false; }
  }

  function dateAt(date, minutes) {
    const hour = Math.floor(Number(minutes) / 60);
    const minute = Number(minutes) % 60;
    const value = new Date(date);
    value.setHours(hour, minute, 0, 0);
    return value;
  }

  function numericMinutes(times, key) {
    const value = Number(times && times.minutes && times.minutes[key]);
    return Number.isFinite(value) ? value : null;
  }

  async function prepareChannel(plugin) {
    if (channelReady) return;
    await plugin.createChannel({
      id: CHANNEL_ID,
      name: 'أوقات الصلاة',
      description: 'تنبيهات أوقات الصلاة والأذان المحلي',
      sound: 'adhan',
      importance: 5,
      visibility: 1,
      vibration: true
    });
    channelReady = true;
  }

  async function cancelManaged(plugin) {
    const notifications = [];
    for (let i = 0; i < 20; i += 1) notifications.push({ id: BASE_ID + i });
    try { await plugin.cancel({ notifications }); } catch (_) {}
  }

  function buildNotifications(location, todayTimes) {
    if (!location || !todayTimes || !window.PrayerEngine || typeof window.PrayerEngine.calculate !== 'function') return [];
    const now = new Date();
    const days = [new Date(now), new Date(now.getTime() + 86400000)];
    return days.flatMap((day, dayOffset) => {
      const times = dayOffset === 0 ? todayTimes : window.PrayerEngine.calculate(day, location, window.PrayerEngine.DEFAULT_SETTINGS);
      return PRAYER_KEYS.map((key, index) => {
        const minutes = numericMinutes(times, key);
        if (minutes === null) return null;
        const at = dateAt(day, minutes);
        if (at.getTime() <= Date.now() + 5000) return null;
        return {
          id: BASE_ID + (dayOffset * 10) + index,
          title: `حان وقت صلاة ${PRAYER_NAMES[key]}`,
          body: 'الرفيق — الأذان المحلي',
          channelId: CHANNEL_ID,
          schedule: { at, allowWhileIdle: true, isExactNotification: true },
          sound: 'adhan',
          smallIcon: 'ic_launcher'
        };
      }).filter(Boolean);
    });
  }

  async function schedule(location, todayTimes, force = false) {
    const plugin = nativePlugin();
    if (!plugin) return { native: false, scheduled: 0 };
    if (!enabled()) {
      await cancelManaged(plugin);
      lastSignature = '';
      return { native: true, scheduled: 0, disabled: true };
    }
    const signature = JSON.stringify({
      source: location && location.source,
      code: location && location.code,
      lat: location && location.latitude,
      lng: location && location.longitude,
      day: new Date().toDateString(),
      times: todayTimes && todayTimes.minutes
    });
    if (!force && signature === lastSignature) return { native: true, scheduled: 0, unchanged: true };
    const permission = await plugin.requestPermissions();
    if (permission && permission.display && permission.display !== 'granted') return { native: true, scheduled: 0, denied: true };
    await prepareChannel(plugin);
    await cancelManaged(plugin);
    const notifications = buildNotifications(location, todayTimes);
    if (notifications.length) await plugin.schedule({ notifications });
    lastSignature = signature;
    return { native: true, scheduled: notifications.length };
  }

  async function requestPermission() {
    const plugin = nativePlugin();
    if (!plugin) return { native: false, display: 'unsupported' };
    return plugin.requestPermissions();
  }

  async function refreshFromApp() {
    lastSignature = '';
    const location = window.LocationManager && window.LocationManager.getCurrent ? window.LocationManager.getCurrent() : null;
    if (!location || !window.PrayerEngine || typeof window.PrayerEngine.calculate !== 'function') return;
    const times = window.PrayerEngine.calculate(new Date(), location, window.PrayerEngine.DEFAULT_SETTINGS);
    return schedule(location, times, true);
  }

  document.addEventListener('rafeeq:adhanChanged', () => { refreshFromApp().catch(error => console.warn('Native adhan refresh failed', error)); });
  document.addEventListener('rafeeq:locationChanged', () => { refreshFromApp().catch(error => console.warn('Native location refresh failed', error)); });

  window.RafeeqNativeNotifications = {
    schedule,
    requestPermission,
    refresh: () => { lastSignature = ''; },
    refreshFromApp
  };
})();
