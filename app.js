import PrayerEngine from './prayer-engine.js';
import { NativeAlarmBridge } from './native-alarm.js';

class AppController {
  constructor() {
    this.initPWA();
    this.initApp();
  }

  initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch(error => {
            console.error('ServiceWorker registration failed: ', error);
          });
      });
    }
  }

  async initApp() {
    console.log('Ar-Rafeeq 4 Initializing...');

    // إحداثيات افتراضية أو جلبها من نظام تحديد الموقع الجغرافي (Geolocation)
    const coordinates = { lat: 36.365, lng: 6.614 }; // مثال: إحداثيات الجزائر

    // ✅ الإصلاح: تمرير اسم المنهج مباشرة بدلاً من كائن
    const prayerEngine = new PrayerEngine(coordinates, "MWL");
    const todayTimes = prayerEngine.calculateTimes(new Date());

    this.renderPrayerTimes(todayTimes);

    // جدولة تنبيه تجريبي للأذان عبر الجسر الأصلي لأندرويد
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // بعد دقيقة كمثال
    await NativeAlarmBridge.scheduleAdhanAlert('الفجر', now.getTime());
  }

  renderPrayerTimes(times) {
    const timesContainer = document.getElementById('times-list');
    if (!timesContainer) return;

    timesContainer.innerHTML = `
      <ul style="list-style: none; padding: 0; font-size: 1.1rem; line-height: 2;">
        <li><strong>الفجر:</strong> ${times.fajr}</li>
        <li><strong>الظهر:</strong> ${times.dhuhr}</li>
        <li><strong>العصر:</strong> ${times.asr}</li>
        <li><strong>المغرب:</strong> ${times.maghrib}</li>
        <li><strong>العشاء:</strong> ${times.isha}</li>
      </ul>
    `;
  }
}

// تشغيل التطبيق عند تحميل المستند
document.addEventListener('DOMContentLoaded', () => {
  new AppController();
});
