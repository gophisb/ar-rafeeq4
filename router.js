/* ==========================================================
   الرفيق | router.js
   الإصدار: 1.0.1

   المسؤولية:
   - إدارة التنقل بين الصفحات.
   - تحميل الصفحات ديناميكيًا.
   - تحديث حالة التطبيق.
   - لا يحتوي على بيانات دينية.
   ========================================================== */

"use strict";

const Router = (() => {

    /* ==========================================================
       المسارات
    ========================================================== */

    const routes = new Map([
        [CONFIG.PAGES.HOME, {
            file: "pages/home.html",
            title: "الرئيسية"
        }],

        [CONFIG.PAGES.QURAN, {
            file: "pages/quran.html",
            title: "القرآن الكريم"
        }],

        [CONFIG.PAGES.AZKAR, {
            file: "pages/azkar.html",
            title: "الأذكار"
        }],

        [CONFIG.PAGES.PRAYER, {
            file: "pages/prayer.html",
            title: "مواقيت الصلاة"
        }],

        [CONFIG.PAGES.QIBLA, {
            file: "pages/qibla.html",
            title: "القبلة"
        }],

        [CONFIG.PAGES.NAWAWI, {
            file: "pages/nawawi.html",
            title: "الأربعين النووية"
        }],

        [CONFIG.PAGES.SETTINGS, {
            file: "pages/settings.html",
            title: "الإعدادات"
        }]
    ]);


    /* ==========================================================
       حالة الروتر
    ========================================================== */

    let currentPage = null;
    let initialized = false;


    /* ==========================================================
       عناصر الواجهة
    ========================================================== */

    function getMainContent() {
        return document.getElementById("main-content");
    }

    function getBottomNavigation() {
        return document.getElementById("bottom-navigation");
    }


    /* ==========================================================
       تهيئة الروتر
    ========================================================== */

    function init() {

        if (initialized) {
            return;
        }

        const mainContent = getMainContent();

        if (!mainContent) {
            console.error(
                "الرفيق: العنصر #main-content غير موجود."
            );
            return;
        }

        initialized = true;

        bindNavigationEvents();

        const hash = window.location.hash
            .replace(/^#/, "")
            .trim();

        if (hash && routes.has(hash)) {

            navigate(hash, false);

        } else {

            navigate(CONFIG.PAGES.HOME, false);

        }
    }


    /* ==========================================================
       التنقل
    ========================================================== */

    async function navigate(
        pageName,
        addToHistory = true
    ) {

        const route = routes.get(pageName);

        if (!route) {

            console.error(
                `الرفيق: المسار غير موجود: ${pageName}`
            );

            return;
        }

        const mainContent = getMainContent();

        if (!mainContent) {

            console.error(
                "الرفيق: العنصر #main-content غير موجود."
            );

            return;
        }

        try {

            showLoader();

            const html = await fetchPage(route.file);

            mainContent.innerHTML = html;

            document.title =
                `${route.title} | ${CONFIG.APP_NAME}`;

            currentPage = pageName;

            if (
                typeof State !== "undefined" &&
                State
            ) {

                State.currentPage = pageName;
            }

            updateActiveNav(pageName);

            if (addToHistory) {

                const newUrl =
                    `${window.location.pathname}#${pageName}`;

                window.history.pushState(
                    { page: pageName },
                    "",
                    newUrl
                );
            }

        } catch (error) {

            console.error(
                `الرفيق: فشل تحميل الصفحة: ${route.file}`,
                error
            );

            showError(
                "تعذر تحميل الصفحة، يرجى المحاولة مرة أخرى."
            );

        } finally {

            hideLoader();
        }
    }


    /* ==========================================================
       تحميل الصفحة
    ========================================================== */

    async function fetchPage(file) {

        const response = await fetch(file, {
            cache: "no-cache"
        });

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }

        return await response.text();
    }


    /* ==========================================================
       أحداث التنقل
    ========================================================== */

    function bindNavigationEvents() {

        const bottomNav = getBottomNavigation();
        const mainContent = getMainContent();


        /* ---------- الشريط السفلي ---------- */

        if (bottomNav) {

            bottomNav.addEventListener(
                "click",
                (event) => {

                    const link =
                        event.target.closest(
                            "[data-page]"
                        );

                    if (!link) {
                        return;
                    }

                    event.preventDefault();

                    const page =
                        link.dataset.page;

                    if (page) {
                        navigate(page);
                    }
                }
            );
        }


        /* ---------- التنقل داخل الصفحات ---------- */

        if (mainContent) {

            mainContent.addEventListener(
                "click",
                (event) => {

                    const link =
                        event.target.closest(
                            "[data-navigate]"
                        );

                    if (!link) {
                        return;
                    }

                    event.preventDefault();

                    const page =
                        link.dataset.navigate;

                    if (page) {
                        navigate(page);
                    }
                }
            );


            /* دعم لوحة المفاتيح */

            mainContent.addEventListener(
                "keydown",
                (event) => {

                    if (
                        event.key !== "Enter" &&
                        event.key !== " "
                    ) {
                        return;
                    }

                    const link =
                        event.target.closest(
                            "[data-navigate]"
                        );

                    if (!link) {
                        return;
                    }

                    event.preventDefault();

                    const page =
                        link.dataset.navigate;

                    if (page) {
                        navigate(page);
                    }
                }
            );
        }


        /* ---------- زر الرجوع ---------- */

        window.addEventListener(
            "popstate",
            (event) => {

                if (
                    event.state &&
                    event.state.page &&
                    routes.has(event.state.page)
                ) {

                    navigate(
                        event.state.page,
                        false
                    );

                    return;
                }

                const hash =
                    window.location.hash
                        .replace(/^#/, "")
                        .trim();

                if (
                    hash &&
                    routes.has(hash)
                ) {

                    navigate(
                        hash,
                        false
                    );

                } else {

                    navigate(
                        CONFIG.PAGES.HOME,
                        false
                    );
                }
            }
        );
    }


    /* ==========================================================
       تحديث التنقل النشط
    ========================================================== */

    function updateActiveNav(pageName) {

        const bottomNav =
            getBottomNavigation();

        if (!bottomNav) {
            return;
        }

        const links =
            bottomNav.querySelectorAll(
                "[data-page]"
            );

        links.forEach((link) => {

            const isActive =
                link.dataset.page === pageName;

            link.classList.toggle(
                "active",
                isActive
            );

            link.setAttribute(
                "aria-current",
                isActive
                    ? "page"
                    : "false"
            );
        });
    }


    /* ==========================================================
       Loader
    ========================================================== */

    function showLoader() {

        const loaderRoot =
            document.getElementById(
                "loader-root"
            );

        if (!loaderRoot) {
            return;
        }

        loaderRoot.innerHTML =
            '<div class="loader" aria-label="جارٍ التحميل"></div>';

        loaderRoot.style.display = "flex";

        loaderRoot.setAttribute(
            "aria-busy",
            "true"
        );
    }


    function hideLoader() {

        const loaderRoot =
            document.getElementById(
                "loader-root"
            );

        if (!loaderRoot) {
            return;
        }

        loaderRoot.style.display = "none";

        loaderRoot.innerHTML = "";

        loaderRoot.setAttribute(
            "aria-busy",
            "false"
        );
    }


    /* ==========================================================
       رسالة الخطأ
    ========================================================== */

    function showError(message) {

        const toastRoot =
            document.getElementById(
                "toast-root"
            );

        if (!toastRoot) {

            console.error(message);

            return;
        }

        const toast =
            document.createElement("div");

        toast.className = "toast";

        toast.setAttribute(
            "role",
            "alert"
        );

        toast.textContent = message;

        toastRoot.appendChild(toast);

        window.setTimeout(() => {

            toast.remove();

        }, 3000);
    }


    /* ==========================================================
       الصفحة الحالية
    ========================================================== */

    function getCurrentPage() {

        return currentPage;
    }


    /* ==========================================================
       الواجهة العامة
    ========================================================== */

    return Object.freeze({

        init,

        navigate,

        getCurrentPage

    });

})();