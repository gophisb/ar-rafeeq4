# خطة الإغلاق والتدقيق

## ترتيب التنفيذ

يبدأ التدقيق بجرد الملفات والمسارات ثم فحص الصياغة والبيانات، ثم تشغيل خادم محلي نظيف، ثم اختبار الصفحات والتفاعل، ثم فحص Service Worker وCache، ثم اختبار الرابط العام.

## ملفات التدقيق

| المجموعة | الملفات |
|---|---|
| الراوتر والتطبيق | `index.html`, `router.js`, `app.js`, `js/page-modules.js` |
| الصلاة والموقع | `prayer.js`, `pages/prayer.js`, `js/location-manager.js`, `locations.js`, `pages/home.js` |
| القبلة | `pages/qibla.html`, `pages/qibla.js`, `assets/icons/kaaba.svg` |
| المحتوى | `pages/quran-local.json`, `pages/tafsir-saadi-local.json`, `pages/azkar-data.json`, `pages/nawawi-data.json` |
| الصفحات | ملفات `pages/*.html` و`pages/*.js` |
| Offline | `sw.js`, `manifest.json`, الأصول المحلية و`assets/audio/adhan.mp3` |

## أوامر الفحص

يُستخدم `node --check` لكل ملف JavaScript، وفحص JSON لكل بيانات JSON، و`git diff --check`، وفحص آلي للمراجع المحلية، ثم اختبارات المتصفح على المسارات الرئيسية مع تسجيل Console وNetwork.

## بوابة التنفيذ

لا تُعدّل ملفات المشروع في مرحلتي Plan وTasks وAnalyze. إذا كشف Analyze خطرًا مؤكدًا، يُقترح إصلاحه في التقرير فقط إلى أن يوافق المستخدم.
