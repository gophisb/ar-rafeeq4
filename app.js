/* ==========================================================
   الرفيق | app.js
   الإصدار: 3.0.0

   المسؤولية:
   - تشغيل التطبيق.
   - تهيئة البيئة العامة.
   - تطبيق اللغة والاتجاه والثيم.
   - تشغيل Router.
   - إدارة حالة التطبيق.
   - إدارة الاتصال Offline / Online.
   - إدارة الصفحة الحالية.
   - ربط الأحداث العامة.
   - توفير واجهة آمنة لبقية وحدات الرفيق.

   لا يحتوي هذا الملف على:
   - بيانات القرآن.
   - بيانات التفسير.
   - بيانات الأحاديث.
   - مواقيت الصلاة.
   - بيانات الولايات.

   هذه البيانات تبقى في وحداتها المستقلة.
========================================================== */

"use strict";


/* ==========================================================
   RafeeqApp
========================================================== */

const RafeeqApp = (() => {

    /* ======================================================
       معلومات الإصدار
    ====================================================== */

    const VERSION = "3.0.0";


    /* ======================================================
       حالة التطبيق
    ====================================================== */

    const state = {

        initialized: false,

        started: false,

        online:
            typeof navigator !== "undefined"
                ? navigator.onLine
                : true,

        currentPage: null,

        previousPage: null,

        theme: null,

        language: null,

        direction: null,

        bootTime: null

    };


    /* ======================================================
       عناصر الواجهة
    ====================================================== */

    const elements = {

        app: null,

        header: null,

        main: null,

        navigation: null,

        dialog: null,

        toast: null,

        loader: null,

        offline: null

    };


    /* ======================================================
       أدوات مساعدة
    ====================================================== */

    function getElement(id) {

        return document.getElementById(id);

    }


    function safeString(value, fallback = "") {

        if (
            value === null ||
            value === undefined
        ) {

            return fallback;

        }

        return String(value);

    }


    /* ======================================================
       اكتشاف CONFIG
    ====================================================== */

    function getConfig() {

        if (
            typeof CONFIG !== "undefined"
        ) {

            return CONFIG;

        }

        return {

            APP_NAME: "الرفيق",

            VERSION,

            LANG: "ar",

            DIR: "rtl",

            DEFAULT_THEME: "dark"

        };

    }


    /* ======================================================
       تطبيق اللغة
    ====================================================== */

    function applyLanguage() {

        const config = getConfig();

        const language =
            config.LANG || "ar";

        state.language = language;

        document.documentElement.lang =
            language;

    }


    /* ======================================================
       تطبيق الاتجاه
    ====================================================== */

    function applyDirection() {

        const config = getConfig();

        const direction =
            config.DIR || "rtl";

        state.direction = direction;

        document.documentElement.dir =
            direction;

    }


    /* ======================================================
       تطبيق الثيم
    ====================================================== */

    function applyTheme() {

        const config = getConfig();

        let theme =
            config.DEFAULT_THEME || "dark";

        /*
         * القيم المسموحة:
         *
         * dark
         * light
         * auto
         */

        if (
            ![
                "dark",
                "light",
                "auto"
            ].includes(theme)
        ) {

            theme = "dark";

        }


        state.theme = theme;

        document.documentElement
            .setAttribute(
                "data-theme",
                theme
            );

    }


    /* ======================================================
       اكتشاف عناصر التطبيق
    ====================================================== */

    function cacheElements() {

        elements.app =
            getElement("app");

        elements.header =
            getElement("app-header");

        elements.main =
            getElement("main-content");

        elements.navigation =
            getElement(
                "bottom-navigation"
            );

        elements.dialog =
            getElement("dialog-root");

        elements.toast =
            getElement("toast-root");

        elements.loader =
            getElement("loader-root");

        elements.offline =
            getElement("offline-banner");

    }


    /* ======================================================
       حالة الاتصال
    ====================================================== */

    function updateConnectionState(
        online
    ) {

        state.online = Boolean(online);

        if (
            elements.offline
        ) {

            elements.offline
                .classList
                .toggle(
                    "visible",
                    !state.online
                );

            elements.offline
                .textContent =
                state.online
                    ? ""
                    : "أنت الآن تعمل دون اتصال بالإنترنت";

        }


        document.documentElement
            .classList
            .toggle(
                "is-offline",
                !state.online
            );


        document.documentElement
            .classList
            .toggle(
                "is-online",
                state.online
            );

    }


    /* ======================================================
       أحداث الاتصال
    ====================================================== */

    function bindConnectionEvents() {

        window.addEventListener(
            "online",
            () => {

                updateConnectionState(
                    true
                );

            }
        );


        window.addEventListener(
            "offline",
            () => {

                updateConnectionState(
                    false
                );

            }
        );

    }


    /* ======================================================
       شاشة التحميل
    ====================================================== */

    function showLoader(
        message = "جارٍ التحميل..."
    ) {

        if (
            !elements.loader
        ) {

            return;

        }


        elements.loader
            .setAttribute(
                "aria-busy",
                "true"
            );


        elements.loader
            .classList
            .add("visible");


        elements.loader
            .innerHTML = `

                <div
                    class="loader"
                    role="status"
                    aria-label="${message}">
                </div>

            `;

    }


    function hideLoader() {

        if (
            !elements.loader
        ) {

            return;

        }


        elements.loader
            .setAttribute(
                "aria-busy",
                "false"
            );


        elements.loader
            .classList
            .remove("visible");


        elements.loader.innerHTML = "";

    }


    /* ======================================================
       Toast
    ====================================================== */

    function toast(
        message,
        type = "info"
    ) {

        if (
            !elements.toast
        ) {

            return;

        }


        const item =
            document.createElement(
                "div"
            );


        item.className =
            `toast toast-${type}`;


        item.setAttribute(
            "role",
            "status"
        );


        item.textContent =
            safeString(message);


        elements.toast.appendChild(
            item
        );


        window.setTimeout(
            () => {

                item.classList.add(
                    "is-hiding"
                );


                window.setTimeout(
                    () => {

                        item.remove();

                    },
                    250
                );

            },
            3500
        );

    }


    /* ======================================================
       Router
    ====================================================== */

    function initializeRouter() {

        if (
            typeof Router === "undefined"
        ) {

            console.warn(
                "RafeeqApp: Router غير متاح."
            );

            return false;

        }


        try {

            Router.init();

            return true;

        } catch (error) {

            console.error(
                "RafeeqApp: فشل تشغيل Router",
                error
            );

            toast(
                "تعذر تشغيل نظام التنقل",
                "error"
            );

            return false;

        }

    }


    /* ======================================================
       معرفة الصفحة الحالية
    ====================================================== */

    function detectCurrentPage() {

        const active =
            document.querySelector(
                "[data-page].active, " +
                ".page.active"
            );


        if (active) {

            state.currentPage =
                active.dataset.page ||
                active.id ||
                null;

        }

    }


    /* ======================================================
       مراقبة تغيّر الصفحة
    ====================================================== */

    function observePageChanges() {

        if (
            !elements.main
        ) {

            return;

        }


        const observer =
            new MutationObserver(
                () => {

                    detectCurrentPage();

                }
            );


        observer.observe(
            elements.main,
            {

                childList: true,

                subtree: true,

                attributes: true,

                attributeFilter: [
                    "class",
                    "data-page"
                ]

            }
        );

    }


    /* ======================================================
       الأحداث العامة
    ====================================================== */

    function bindGlobalEvents() {

        document.addEventListener(
            "click",
            handleGlobalClick
        );


        document.addEventListener(
            "keydown",
            handleGlobalKeyboard
        );

    }


    /* ======================================================
       النقر العام
    ====================================================== */

    function handleGlobalClick(
        event
    ) {

        const target =
            event.target.closest(
                "[data-action]"
            );


        if (!target) {

            return;

        }


        const action =
            target.dataset.action;


        switch (action) {

            case "theme":

                toggleTheme();

                break;


            case "toast":

                toast(
                    target.dataset.message ||
                    "تم التنفيذ"
                );

                break;


            case "reload":

                window.location.reload();

                break;

        }

    }


    /* ======================================================
       لوحة المفاتيح
    ====================================================== */

    function handleGlobalKeyboard(
        event
    ) {

        /*
         * دعم Enter و Space للعناصر
         * التي تحمل data-navigate.
         */

        if (
            event.key !== "Enter" &&
            event.key !== " "
        ) {

            return;

        }


        const target =
            event.target.closest(
                "[data-navigate]"
            );


        if (!target) {

            return;

        }


        if (
            target.tagName === "A" ||
            target.tagName === "BUTTON"
        ) {

            return;

        }


        event.preventDefault();

        target.click();

    }


    /* ======================================================
       تغيير الثيم
    ====================================================== */

    function toggleTheme() {

        const current =
            document.documentElement
                .getAttribute(
                    "data-theme"
                );


        const next =
            current === "dark"
                ? "light"
                : "dark";


        setTheme(next);

    }


    function setTheme(theme) {

        if (
            ![
                "dark",
                "light",
                "auto"
            ].includes(theme)
        ) {

            return false;

        }


        state.theme = theme;


        document.documentElement
            .setAttribute(
                "data-theme",
                theme
            );


        try {

            localStorage.setItem(
                "ar_rafeeq_theme",
                theme
            );

        } catch (error) {

            console.warn(
                "تعذر حفظ الثيم",
                error
            );

        }


        return true;

    }


    /* ======================================================
       استرجاع الثيم المحفوظ
    ====================================================== */

    function restoreTheme() {

        let saved = null;


        try {

            saved =
                localStorage.getItem(
                    "ar_rafeeq_theme"
                );

        } catch (error) {

            saved = null;

        }


        if (
            saved &&
            [
                "dark",
                "light",
                "auto"
            ].includes(saved)
        ) {

            setTheme(saved);

        } else {

            applyTheme();

        }

    }


    /* ======================================================
       تهيئة الوصول
    ====================================================== */

    function prepareAccessibility() {

        if (
            elements.main &&
            !elements.main.hasAttribute(
                "tabindex"
            )
        ) {

            elements.main.setAttribute(
                "tabindex",
                "-1"
            );

        }


        if (
            elements.navigation
        ) {

            elements.navigation
                .setAttribute(
                    "role",
                    "navigation"
                );

        }

    }


    /* ======================================================
       فحص البيئة
    ====================================================== */

    function environmentCheck() {

        const required =
            [

                "app",

                "main"

            ];


        const missing =
            required.filter(
                key =>
                    !elements[key]
            );


        if (
            missing.length
        ) {

            console.warn(
                "RafeeqApp: عناصر مفقودة:",
                missing
            );

        }


        return missing.length === 0;

    }


    /* ======================================================
       تشغيل Service Worker
    ====================================================== */

    async function registerServiceWorker() {

        if (
            !("serviceWorker" in navigator)
        ) {

            return null;

        }


        try {

            const registration =
                await navigator
                    .serviceWorker
                    .register(
                        "sw.js"
                    );


            console.log(
                "RafeeqApp: Service Worker registered.",
                registration.scope
            );


            return registration;

        } catch (error) {

            console.warn(
                "RafeeqApp: تعذر تسجيل Service Worker.",
                error
            );


            return null;

        }

    }


    /* ======================================================
       أحداث Service Worker
    ====================================================== */

    function bindServiceWorkerEvents() {

        if (
            !navigator.serviceWorker
        ) {

            return;

        }


        navigator.serviceWorker
            .addEventListener(
                "controllerchange",
                () => {

                    console.log(
                        "RafeeqApp: Service Worker controller changed."
                    );

                }
            );

    }


    /* ======================================================
       تشغيل الوحدات الاختيارية
    ====================================================== */

    function initializeModules() {

        /*
         * لا نفترض وجود الوحدات.
         *
         * إذا كانت موجودة يمكنها تهيئة نفسها.
         */

        const modules = [

            "PrayerEngine",

            "Locations",

            "Quran",

            "Tafsir",

            "Azkar",

            "Nawawi"

        ];


        modules.forEach(
            name => {

                if (
                    window[name] &&
                    typeof window[name].init ===
                    "function"
                ) {

                    try {

                        window[name].init();

                    } catch (error) {

                        console.warn(
                            `RafeeqApp: فشل تهيئة ${name}`,
                            error
                        );

                    }

                }

            }
        );

    }


    /* ======================================================
       boot
    ====================================================== */

    async function boot() {

        if (
            state.started
        ) {

            return getState();

        }


        state.started = true;

        state.bootTime =
            new Date();


        cacheElements();


        environmentCheck();


        applyLanguage();

        applyDirection();

        restoreTheme();


        updateConnectionState(
            navigator.onLine
        );


        prepareAccessibility();


        bindConnectionEvents();

        bindGlobalEvents();

        bindServiceWorkerEvents();


        initializeRouter();

        observePageChanges();

        initializeModules();


        /*
         * تسجيل Service Worker
         * بعد تشغيل الواجهة.
         */

        if (
            "serviceWorker" in navigator
        ) {

            registerServiceWorker();

        }


        state.initialized = true;


        const config =
            getConfig();


        console.log(
            `${config.APP_NAME} | ` +
            `v${VERSION} | ` +
            `تم تشغيل التطبيق بنجاح`
        );


        return getState();

    }


    /* ======================================================
       init
    ====================================================== */

    function init() {

        return boot();

    }


    /* ======================================================
       destroy
    ====================================================== */

    function destroy() {

        state.initialized = false;

        state.started = false;

        state.currentPage = null;

        state.previousPage = null;


        /*
         * لا نحذف DOM.
         *
         * لأن Router مسؤول عن إدارة الصفحات.
         */

        console.log(
            "RafeeqApp: destroyed"
        );

    }


    /* ======================================================
       restart
    ====================================================== */

    async function restart() {

        destroy();

        return boot();

    }


    /* ======================================================
       حالة التطبيق
    ====================================================== */

    function getState() {

        return Object.freeze({

            version: VERSION,

            initialized:
                state.initialized,

            started:
                state.started,

            online:
                state.online,

            currentPage:
                state.currentPage,

            previousPage:
                state.previousPage,

            theme:
                state.theme,

            language:
                state.language,

            direction:
                state.direction,

            bootTime:
                state.bootTime

        });

    }


    /* ======================================================
       الحصول على العنصر الرئيسي
    ====================================================== */

    function getMainElement() {

        return elements.main;

    }


    /* ======================================================
       تغيير الصفحة داخليًا
    ====================================================== */

    function setCurrentPage(
        page
    ) {

        state.previousPage =
            state.currentPage;

        state.currentPage =
            page || null;

    }


    /* ======================================================
       الواجهة العامة
    ====================================================== */

    return Object.freeze({

        VERSION,

        boot,

        init,

        destroy,

        restart,

        getState,

        getMainElement,

        setCurrentPage,

        showLoader,

        hideLoader,

        toast,

        toggleTheme,

        setTheme,

        updateConnectionState

    });

})();


/* ==========================================================
   تصدير التطبيق
========================================================== */

window.RafeeqApp =
    RafeeqApp;


/* ==========================================================
   بدء التشغيل
========================================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            RafeeqApp.boot();

        },
        {
            once: true
        }
    );

} else {

    RafeeqApp.boot();

}


/* ==========================================================
   رسالة التطوير
========================================================== */

console.log(
    "الرفيق | RafeeqApp v3.0.0 loaded"
);