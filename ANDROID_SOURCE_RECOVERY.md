# استعادة مصدر Android المطابق للـAPK الحالي

هذه النسخة تطابق هوية الـAPK الحالي المفكوك:

- الحزمة: `com.gophisb.houd11`
- الفرع المصدر: `houd11-android-offline`
- الفرع المستعاد: `recovery/android-source-houd11`
- مصدر Android: `android/`
- يتضمن: `MainActivity`, `AdhanService`, `AdhanReceiver`, `AlarmScheduler`, `PrayerNotificationReceiver`, وملفات Manifest/Gradle.

## تمييز مهم

توجد أيضاً حزمة أخرى باسم `com.gophisb.arrafeeq4` في ملف FDroid السابق. تلك ليست الحزمة المطابقة للـAPK الحالي `com.gophisb.houd11`، ولذلك بقيت منفصلة ولم تُخلط مع هذا المصدر.

## حالة البناء

المصدر مستعاد من Git، لكن Sandbox الحالية لا تحتوي Android SDK/Gradle؛ يلزم GitHub Actions أو بيئة Android مجهزة لإثبات البناء الكامل.
