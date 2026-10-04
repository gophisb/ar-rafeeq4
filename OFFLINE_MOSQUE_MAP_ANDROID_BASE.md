# قاعدة دمج خريطة المساجد Offline

هذا الفرع مبني على `feat/offline-mosque-map`، وتمت إضافة مصدر Android المطابق للـAPK الحالي Houd11.

## الثوابت

- الحزمة: `com.gophisb.houd11`
- مصدر Android: فرع `houd11-android-offline`
- لا يوجد مشروع Android جديد.
- لا يُسمح بتغيير `AdhanService` أو `AdhanReceiver` أو `AlarmScheduler` ضمن أول مرحلة للخريطة.
- الخريطة ستكون ميزة اختيارية ولا تمنع تشغيل القرآن أو الأذان أو الواجهة الأساسية.

## نقطة البدء التالية

1. إثبات بناء Android الحالي كما هو.
2. إضافة طبقة Capacitor/Native صغيرة للخريطة فقط.
3. عدم إدخال Mapsforge/BRouter قبل اختبار بناء APK الأساسي.
