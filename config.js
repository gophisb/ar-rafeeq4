/* ==========================================================
   الرفيق | config.js
   الإصدار: 2.0.0

   المسؤولية:
   - الإعدادات المركزية للتطبيق.
   - معلومات التطبيق.
   - اللغة والاتجاه والثيم.
   - التخزين المحلي.
   - مسارات الصفحات.
   - إعدادات الموقع والولايات.
   - إعدادات مواقيت الصلاة.
   - إعدادات الأذان.
   - إعدادات PWA و Offline.
   - لا يحتوي على المحتوى الديني نفسه.
========================================================== */

"use strict";


const CONFIG = Object.freeze({

    /* ======================================================
       معلومات التطبيق
    ====================================================== */

    APP_NAME: "الرفيق",

    APP_SLOGAN:
        "رفيقك إلى الطمأنينة",

    VERSION:
        "2.0.0",

    AUTHOR:
        "فريق الرفيق",


    /* ======================================================
       اللغة والاتجاه
    ====================================================== */

    LANG: "ar",

    DIR: "rtl",


    /* ======================================================
       الثيم
    ====================================================== */

    DEFAULT_THEME: "dark",

    THEMES: Object.freeze({

        DARK: "dark",

        LIGHT: "light",

        AUTO: "auto"

    }),


    /* ======================================================
       إعدادات الواجهة
    ====================================================== */

    UI: Object.freeze({

        MAX_APP_WIDTH: 480,

        BORDER_RADIUS: 22,

        MOBILE_FIRST: true,

        REDUCED_MOTION_SUPPORT: true

    }),


    /* ======================================================
       التخزين المحلي
    ====================================================== */

    STORAGE_KEYS: Object.freeze({

        THEME:
            "ar_rafeeq_theme",

        FONT_SIZE:
            "ar_rafeeq_font_size",

        LAST_PAGE:
            "ar_rafeeq_last_page",

        LOCATION:
            "ar_rafeeq_location",

        LOCATION_MODE:
            "ar_rafeeq_location_mode",

        SELECTED_WILAYA:
            "ar_rafeeq_selected_wilaya",

        PRAYER_SETTINGS:
            "ar_rafeeq_prayer_settings",

        PRAYER_ADJUSTMENTS:
            "ar_rafeeq_prayer_adjustments",

        ADHAN_SETTINGS:
            "ar_rafeeq_adhan_settings",

        QURAN_PROGRESS:
            "ar_rafeeq_quran_progress",

        QURAN_BOOKMARKS:
            "ar_rafeeq_quran_bookmarks",

        AZKAR_PROGRESS:
            "ar_rafeeq_azkar_progress",

        NAWAWI_PROGRESS:
            "ar_rafeeq_nawawi_progress"

    }),


    /* ======================================================
       صفحات التطبيق
    ====================================================== */

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

        ADHAN:
            "adhan",

        QIBLA:
            "qibla",

        NAWAWI:
            "nawawi",

        SETTINGS:
            "settings"

    }),


    /* ======================================================
       الموقع والجزائر
    ====================================================== */

    LOCATION: Object.freeze({

        COUNTRY_CODE:
            "DZ",

        COUNTRY_NAME:
            "الجزائر",

        WILAYAS_COUNT:
            69,

        DEFAULT_WILAYA_CODE:
            "16",

        DEFAULT_TIMEZONE:
            1,

        USE_GPS:
            true,

        USE_GPS_FIRST:
            true,

        ALLOW_MANUAL_WILAYA:
            true,

        GPS_HIGH_ACCURACY:
            true,

        GPS_TIMEOUT:
            15000,

        GPS_MAXIMUM_AGE:
            300000

    }),


    /* ======================================================
       مواقيت الصلاة
    ====================================================== */

    PRAYER: Object.freeze({

        ENABLED:
            true,

        OFFLINE:
            true,

        CALCULATION_MODE:
            "astronomical",

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

        ROUNDING:
            "nearest-minute",

        SHOW_SUNRISE:
            true,

        SHOW_SUNSET:
            true,

        SHOW_NEXT_PRAYER:
            true,

        SHOW_COUNTDOWN:
            true,

        ADJUSTMENTS: Object.freeze({

            fajr: 0,

            sunrise: 0,

            dhuhr: 0,

            asr: 0,

            maghrib: 0,

            isha: 0

        })

    }),


    /* ======================================================
       الأذان
    ====================================================== */

    ADHAN: Object.freeze({

        ENABLED:
            true,

        AUDIO:
            true,

        NOTIFICATIONS:
            true,

        VIBRATION:
            true,

        FAJR:
            true,

        DHUHR:
            true,

        ASR:
            true,

        MAGHRIB:
            true,

        ISHA:
            true

    }),


    /* ======================================================
       PWA / Offline
    ====================================================== */

    PWA: Object.freeze({

        ENABLED:
            true,

        OFFLINE_SUPPORT:
            true,

        SERVICE_WORKER:
            "sw.js",

        MANIFEST:
            "manifest.json"

    }),


    /* ======================================================
       الميزات
    ====================================================== */

    FEATURES: Object.freeze({

        PWA:
            true,

        OFFLINE_SUPPORT:
            true,

        PRAYER_TIMES:
            true,

        ADHAN:
            true,

        PRAYER_NOTIFICATIONS:
            true,

        GPS:
            true,

        WILAYAS_69:
            true,

        QURAN:
            true,

        TAFSIR_SAADI:
            true,

        AZKAR:
            true,

        QIBLA:
            true,

        NAWAWI:
            true,

        DARK_MODE_TOGGLE:
            true,

        AUDIO_PLAYER:
            true

    })

});


/* ==========================================================
   فحص سلامة الإعدادات
========================================================== */

if (
    CONFIG.LOCATION.WILAYAS_COUNT !== 69
) {

    console.error(
        "الرفيق: خطأ في عدد الولايات. يجب أن يكون 69."
    );

}


if (
    CONFIG.LANG !== "ar" ||
    CONFIG.DIR !== "rtl"
) {

    console.warn(
        "الرفيق: تحقق من إعداد اللغة والاتجاه."
    );

}


/* ==========================================================
   معلومات التطوير
========================================================== */

console.log(
    `الرفيق | CONFIG v${CONFIG.VERSION} loaded`
);