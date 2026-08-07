/* ==========================================================
   الرفيق | config.js
   الإصدار: 1.0.0

   المسؤولية:
   - جميع إعدادات المشروع الأساسية.
   - ثوابت التطبيق العامة.
   - إعدادات اللغة والاتجاه والثيم.
   - لا يحتوي على بيانات دينية.
========================================================== */

"use strict";

const CONFIG = Object.freeze({

    /* ========= معلومات التطبيق ========= */
    APP_NAME: "الرفيق",
    APP_SLOGAN: "تطبيق إسلامي متكامل",
    VERSION: "1.0.0",
    AUTHOR: "فريق الرفيق",

    /* ========= اللغة والاتجاه ========= */
    LANG: "ar",
    DIR: "rtl",

    /* ========= الثيم ========= */
    DEFAULT_THEME: "dark",

    /* ========= الواجهة ========= */
    MAX_APP_WIDTH: 480,
    BORDER_RADIUS: 22,

    /* ========= مفاتيح التخزين ========= */
    STORAGE_KEYS: Object.freeze({
        THEME: "ar_rafeeq_theme",
        FONT_SIZE: "ar_rafeeq_font_size",
        LAST_PAGE: "ar_rafeeq_last_page",
        LOCATION: "ar_rafeeq_location"
    }),

    /* ========= أسماء الصفحات ========= */
    PAGES: Object.freeze({
        HOME: "home",
        QURAN: "quran",
        AZKAR: "azkar",
        PRAYER: "prayer",
        QIBLA: "qibla",
        NAWAWI: "nawawi",
        SETTINGS: "settings"
    }),

    /* ========= الميزات ========= */
    FEATURES: Object.freeze({
        PWA: true,
        OFFLINE_SUPPORT: true,
        PRAYER_NOTIFICATIONS: false,
        AUDIO_PLAYER: false,
        DARK_MODE_TOGGLE: true
    })

});