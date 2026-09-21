/* ==========================================================
   الرفيق | config.js
   الإصدار: 2.0.0

   المسؤولية:
   - الإعدادات المركزية للتطبيق.
   - معلومات التطبيق.
   - اللغة والاتجاه.
   - إعدادات الواجهة.
   - مفاتيح التخزين المحلي.
   - مسارات الصفحات.
   - إعدادات PWA و Offline.
   - إعدادات الموقع.
   - إعدادات مواقيت الصلاة.
   - إعدادات الأذان.

   مبدأ معماري:
   هذا الملف يحتوي على الإعدادات فقط.
   لا يحتوي على القرآن أو الأحاديث أو الأذكار
   أو التفسير أو أي محتوى ديني.
   ========================================================== */

"use strict";


/* ==========================================================
   CONFIG
   ========================================================== */

const CONFIG = Object.freeze({

    /* ========================================================
       معلومات التطبيق
       ======================================================== */

    APP_NAME: "الرفيق",

    APP_SLOGAN:
        "رفيقك إلى الطمأنينة",

    VERSION:
        "2.0.0",

    AUTHOR:
        "فريق الرفيق",


    /* ========================================================
       اللغة والاتجاه
       ======================================================== */

    LANG:
        "ar",

    DIR:
        "rtl",


    /* ========================================================
       إعدادات الواجهة
       ======================================================== */

    UI: Object.freeze({

        DEFAULT_THEME:
            "dark",

        MAX_APP_WIDTH:
            480,

        BORDER_RADIUS:
            22,

        DEFAULT_FONT_SIZE:
            "medium"

    }),


    /* ========================================================
       التخزين المحلي
       ======================================================== */

    STORAGE_KEYS: Object.freeze({

        THEME:
            "ar_rafeeq_theme",

        FONT_SIZE:
            "ar_rafeeq_font_size",

        LAST_PAGE:
            "ar_rafeeq_last_page",

        LOCATION:
            "ar_rafeeq_location",

        PRAYER_SETTINGS:
            "ar_rafeeq_prayer_settings",

        APP_SETTINGS:
            "ar_rafeeq_app_settings"

    }),


    /* ========================================================
       مسارات التطبيق
       ======================================================== */

    PAGES: Object.freeze({

        HOME:
            "home",

        QURAN:
            "quran",

        TAFSIR:
            "tafsir",

        AZKAR:
            "azkar",

        PRAYER:
            "prayer",

        QIBLA:
            "qibla",

        NAWAWI:
            "nawawi",

        SETTINGS:
            "settings"

    }),


    /* ========================================================
       مسارات الملفات
       ======================================================== */

    PATHS: Object.freeze({

        PAGES:
            "pages/",

        JS:
            "js/",

        ASSETS:
            "assets/",

        DATA:
            "data/"

    }),


    /* ========================================================
       الموقع الجغرافي
       ======================================================== */

    LOCATION: Object.freeze({

        DEFAULT_COUNTRY:
            "الجزائر",

        DEFAULT_TIMEZONE:
            1,

        USE_MANUAL_LOCATION:
            true,

        USE_GPS:
            true,

        GPS_TIMEOUT:
            15000,

        GPS_MAXIMUM_AGE:
            300000

    }),


    /* ========================================================
       مواقيت الصلاة
       ======================================================== */

    PRAYER: Object.freeze({

        CALCULATION_METHOD:
            "local",

        FAJR_ANGLE:
            18,

        ISHA_ANGLE:
            17,

        ASR_FACTOR:
            1,

        ELEVATION:
            0,

        PRESSURE:
            1010,

        TEMPERATURE:
            10,

        ADJUSTMENTS: Object.freeze({

            fajr:
                0,

            sunrise:
                0,

            dhuhr:
                0,

            asr:
                0,

            maghrib:
                0,

            isha:
                0

        })

    }),


    /* ========================================================
       الأذان والتنبيهات
       ======================================================== */

    ADHAN: Object.freeze({

        ENABLED:
            true,

        NOTIFICATION_ENABLED:
            false,

        AUDIO_ENABLED:
            true,

        MINUTES_BEFORE:
            0

    }),


    /* ========================================================
       PWA
       ======================================================== */

    PWA: Object.freeze({

        ENABLED:
            true,

        OFFLINE_SUPPORT:
            true,

        SERVICE_WORKER:
            true,

        UPDATE_NOTIFICATION:
            true

    }),


    /* ========================================================
       الميزات
       ======================================================== */

    FEATURES: Object.freeze({

        QURAN:
            true,

        TAFSIR:
            true,

        AZKAR:
            true,

        PRAYER:
            true,

        QIBLA:
            true,

        NAWAWI:
            true,

        SETTINGS:
            true,

        DARK_MODE:
            true,

        AUDIO_PLAYER:
            true,

        PRAYER_NOTIFICATIONS:
            false

    })

});


/* ==========================================================
   التحقق من الإعدادات الأساسية
   ========================================================== */

function validateConfig() {

    if (!CONFIG.APP_NAME) {

        throw new Error(
            "CONFIG: APP_NAME غير محدد."
        );

    }


    if (!CONFIG.LANG) {

        throw new Error(
            "CONFIG: LANG غير محدد."
        );

    }


    if (!CONFIG.DIR) {

        throw new Error(
            "CONFIG: DIR غير محدد."
        );

    }


    if (
        CONFIG.PRAYER.FAJR_ANGLE <= 0 ||
        CONFIG.PRAYER.FAJR_ANGLE >= 90
    ) {

        throw new Error(
            "CONFIG: زاوية الفجر غير صحيحة."
        );

    }


    if (
        CONFIG.PRAYER.ISHA_ANGLE <= 0 ||
        CONFIG.PRAYER.ISHA_ANGLE >= 90
    ) {

        throw new Error(
            "CONFIG: زاوية العشاء غير صحيحة."
        );

    }


    if (
        CONFIG.LOCATION.DEFAULT_TIMEZONE < -12 ||
        CONFIG.LOCATION.DEFAULT_TIMEZONE > 14
    ) {

        throw new Error(
            "CONFIG: المنطقة الزمنية غير صحيحة."
        );

    }


    return true;

}


/* ==========================================================
   تنفيذ التحقق
   ========================================================== */

validateConfig();


/* ==========================================================
   التصدير العام
   ========================================================== */

window.CONFIG = CONFIG;


/* ==========================================================
   رسالة التطوير
   ========================================================== */

console.log(
    `الرفيق | CONFIG v${CONFIG.VERSION} ready`
);