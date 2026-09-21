(function () {
  'use strict';

  const FONT_KEY = (window.CONFIG && CONFIG.STORAGE_KEYS && CONFIG.STORAGE_KEYS.FONT_SIZE) || 'ar_rafeeq_font_size';
  const ADHAN_KEY = 'rafeeq.adhan.enabled.v1';
  const validFonts = ['small', 'medium', 'large'];

  function setStatus(id, text) {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  }

  function applyFontSize(value) {
    const size = validFonts.includes(value) ? value : 'medium';
    document.documentElement.setAttribute('data-font-size', size);
    try { localStorage.setItem(FONT_KEY, size); } catch (_) {}
    const select = document.getElementById('settingsFontSize');
    if (select) select.value = size;
    setStatus('settingsAppearanceStatus', `تم تطبيق حجم الخط: ${size === 'small' ? 'صغير' : size === 'large' ? 'كبير' : 'متوسط'}.`);
  }

  function init() {
    const theme = document.getElementById('settingsTheme');
    const font = document.getElementById('settingsFontSize');
    const wilaya = document.getElementById('settingsWilaya');
    const saveWilaya = document.getElementById('settingsUseWilaya');
    const useGps = document.getElementById('settingsUseGps');
    const notify = document.getElementById('settingsNotification');
    const adhan = document.getElementById('settingsAdhanEnabled');
    const adhanStatus = document.getElementById('settingsAdhanStatus');

    if (theme) {
      theme.value = document.documentElement.getAttribute('data-theme') || 'dark';
      theme.onchange = () => {
        const applied = window.RafeeqApp && RafeeqApp.setTheme ? RafeeqApp.setTheme(theme.value) : false;
        if (applied) setStatus('settingsAppearanceStatus', 'تم حفظ نمط الواجهة.');
      };
    }

    let savedFont = 'medium';
    try { savedFont = localStorage.getItem(FONT_KEY) || 'medium'; } catch (_) {}
    applyFontSize(savedFont);
    if (font) font.onchange = () => applyFontSize(font.value);

    if (typeof LocationManager !== 'undefined') {
      LocationManager.init();
      LocationManager.populateSelect(wilaya);
      const current = LocationManager.getCurrent();
      if (current && wilaya) wilaya.value = current.code;
      if (current) setStatus('settingsLocationStatus', `الموقع الحالي: ${current.name} (${current.source === 'gps' ? 'GPS' : 'الولاية'}).`);
    }

    if (saveWilaya) saveWilaya.onclick = () => {
      if (!wilaya || typeof LocationManager === 'undefined' || !LocationManager.setWilaya(wilaya.value)) return;
      const current = LocationManager.getCurrent();
      setStatus('settingsLocationStatus', `تم حفظ ${current.name} محليًا وستُستخدم في مواقيت الصلاة والقبلة.`);
    };

    if (useGps) useGps.onclick = () => {
      if (typeof LocationManager === 'undefined') return;
      setStatus('settingsLocationStatus', 'جاري طلب إذن الموقع...');
      LocationManager.requestGPS().then(location => {
        if (wilaya) wilaya.value = location.code || '';
        setStatus('settingsLocationStatus', `تم استخدام الموقع: ${location.name || 'موقع GPS'}، وحُفظ محليًا.`);
      }).catch(() => setStatus('settingsLocationStatus', 'تعذر الوصول إلى GPS؛ يمكنك اختيار الولاية يدويًا.'));
    };

    if (adhan) {
      adhan.checked = localStorage.getItem(ADHAN_KEY) === 'true';
      if (adhanStatus) adhanStatus.textContent = adhan.checked ? 'الأذان مفعّل وسيُجدول Native عند أوقات الصلاة.' : 'الأذان متوقف.';
      adhan.onchange = async () => {
        localStorage.setItem(ADHAN_KEY, String(adhan.checked));
        if (adhanStatus) adhanStatus.textContent = adhan.checked ? 'تم تفعيل الأذان المحلي وجدولة التنبيهات.' : 'تم إيقاف الأذان المحلي.';
        if (window.RafeeqNativeNotifications) {
          window.RafeeqNativeNotifications.refresh();
          if (adhan.checked) await window.RafeeqNativeNotifications.requestPermission();
        }
        document.dispatchEvent(new CustomEvent('rafeeq:adhanChanged', { detail: { enabled: adhan.checked } }));
      };
    }

    if (notify) notify.onclick = async () => {
      if (window.RafeeqNativeNotifications) {
        const status = await window.RafeeqNativeNotifications.requestPermission();
        setStatus('settingsNotificationStatus', status?.display === 'granted' ? 'تم السماح بإشعارات Android المحلية.' : 'لم يتم السماح بإشعارات Android المحلية.');
      } else if (!('Notification' in window)) {
        setStatus('settingsNotificationStatus', 'الإشعارات غير مدعومة في هذا المتصفح.');
      } else {
        setStatus('settingsNotificationStatus', `دعم الإشعارات متاح. الحالة الحالية: ${Notification.permission}.`);
      }
    };

    const offline = document.getElementById('settingsOfflineState');
    if (offline) offline.textContent = navigator.onLine ? 'متصل مع دعم محلي' : 'دون اتصال';
  }

  window.RafeeqPages = window.RafeeqPages || {};
  window.RafeeqPages.settings = init;
  window.RafeeqPages['settings:destroy'] = function () {};
  init();
})();
