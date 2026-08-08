/* ==========================================================
   الرفيق | app.js
   الإصدار: 2.0.0

   المسؤولية:
   - تشغيل التطبيق.
   - تهيئة الإعدادات العامة.
   - تهيئة Router مرة واحدة فقط.
   - إدارة دورة حياة التطبيق.
   - لا يحتوي على بيانات دينية.
   ========================================================== */

"use strict";


/* ==========================================================
   App
   ========================================================== */

const App = (() => {

    /* ========================================================
       حالة التطبيق
       ======================================================== */

    let initialized = false;


    /* ========================================================
       تشغيل التطبيق
       ======================================================== */

    function init() {

        /* منع التشغيل المكرر */
        if (initialized) {
            return;
        }

        /* التأكد من وجود CONFIG */
        if (typeof CONFIG === "undefined") {

            console.error(
                "الرفيق: CONFIG غير موجود."
            );

            return;
        }


        /* تطبيق اللغة */
        applyLanguage();


        /* تطبيق الاتجاه */
        applyDirection();


        /* تطبيق الثيم */
        applyTheme();


        /* تطبيق عرض التطبيق */
        applyAppWidth();


        /* تشغيل Router */
        if (typeof Router !== "undefined") {

            Router.init();

        } else {

            console.error(
                "الرفيق: Router غير موجود."
            );

            return;
        }


        /* أصبح التطبيق جاهزًا */
        initialized = true;


        /* رسالة تشخيص */
        console.log(
            `${CONFIG.APP_NAME} v${CONFIG.VERSION} started successfully`
        );

    }


    /* ========================================================
       اللغة
       ======================================================== */

    function applyLanguage() {

        if (!CONFIG.LANG) {
            return;
        }

        document.documentElement.lang =
            CONFIG.LANG;

    }


    /* ========================================================
       الاتجاه
       ======================================================== */

    function applyDirection() {

        if (!CONFIG.DIR) {
            return;
        }

        document.documentElement.dir =
            CONFIG.DIR;

    }


    /* ========================================================
       الثيم
       ======================================================== */

    function applyTheme() {

        const theme =
            CONFIG.DEFAULT_THEME || "dark";


        document.documentElement.setAttribute(
            "data-theme",
            theme
        );

    }


    /* ========================================================
       عرض التطبيق
       ======================================================== */

    function applyAppWidth() {

        if (!CONFIG.MAX_APP_WIDTH) {
            return;
        }


        document.documentElement.style.setProperty(
            "--app-max-width",
            `${CONFIG.MAX_APP_WIDTH}px`
        );

    }


    /* ========================================================
       إعادة تشغيل التطبيق
       ======================================================== */

    function restart() {

        initialized = false;

        init();

    }


    /* ========================================================
       حالة التطبيق
       ======================================================== */

    function isInitialized() {

        return initialized;

    }


    /* ========================================================
       معلومات التطبيق
       ======================================================== */

    function getInfo() {

        return Object.freeze({

            name: CONFIG.APP_NAME,

            version: CONFIG.VERSION,

            language: CONFIG.LANG,

            direction: CONFIG.DIR,

            theme: CONFIG.DEFAULT_THEME

        });

    }


    /* ========================================================
       الواجهة العامة
       ======================================================== */

    return Object.freeze({

        init,

        restart,

        isInitialized,

        getInfo

    });

})();


/* ==========================================================
   بدء تشغيل الرفيق
   ========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        App.init();

    },
    {
        once: true
    }
);