(function () {
  'use strict';
  const theme = document.getElementById('themeSelect');
  const font = document.getElementById('fontSizeSelect');
  const notifications = document.getElementById('notificationToggle');
  const request = document.getElementById('requestNotifications');
  const status = document.getElementById('settingsStatus');
  const key = 'rafeeq.settings.v1';
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  theme.value = saved.theme || 'dark'; font.value = saved.fontSize || 'medium'; notifications.checked = !!saved.notifications;
  function apply() {
    document.documentElement.dataset.theme = theme.value;
    document.documentElement.dataset.fontSize = font.value;
    localStorage.setItem(key, JSON.stringify({ theme: theme.value, fontSize: font.value, notifications: notifications.checked }));
    status.textContent = 'تم حفظ الإعدادات على جهازك.';
  }
  theme.addEventListener('change', apply); font.addEventListener('change', apply); notifications.addEventListener('change', apply);
  request.addEventListener('click', async () => {
    if (!('Notification' in window)) { status.textContent = 'هذا المتصفح لا يدعم التنبيهات.'; return; }
    const result = await Notification.requestPermission();
    status.textContent = result === 'granted' ? 'تم السماح بالتنبيهات.' : 'لم يتم السماح بالتنبيهات.';
    notifications.checked = result === 'granted'; apply();
  });
  apply();
})();
