/* ==========================================================
   الرفيق | router.js
   الإصدار: 3.0.0

   المسؤولية:
   - إدارة التنقل داخل التطبيق.
   - تحميل الصفحات ديناميكيًا.
   - إدارة Hash / History.
   - تحديث الصفحة النشطة.
   - دعم GitHub Pages.
   - دعم الروابط الداخلية data-navigate.
   - دعم lifecycle للصفحات.
   - حماية التطبيق من التنقلات المكررة.
   - إدارة Loader والأخطاء.
   - لا يحتوي على بيانات دينية.
========================================================== */

"use strict";


/* ==========================================================
   Router
========================================================== */

const Router = (() => {

    /* ========================================================
       معلومات الإصدار
    ======================================================== */

    const VERSION = "3.0.0";


    /* ========================================================
       الحالة الداخلية
    ======================================================== */

    let initialized = false;

    let navigating = false;

    let currentPage = null;

    let currentRoute = null;

    let mainContent = null;

    let bottomNavigation = null;

    let abortController = null;


    /* ========================================================
       تعريف المسارات
    ======================================================== */

    const routes = new Map([

        [
            CONFIG.PAGES.HOME,
            {
                file: "pages/home.html",
                title: "الرئيسية"
            }
        ],

        [
            CONFIG.PAGES.QURAN,
            {
                file: "pages/quran.html",
                title: "القرآن الكريم"
            }
        ],

        [
            CONFIG.PAGES.TAFSIR,
            {
                file: "pages/tafsir.html",
                title: "التفسير"
            }
        ],

        [
            CONFIG.PAGES.AZKAR,
            {
                file: "pages/azkar.html",
                title: "الأذكار"
            }
        ],

        [
            CONFIG.PAGES.PRAYER,
            {
                file: "pages/prayer.html",
                title: "مواقيت الصلاة"
            }
        ],

        [
            CONFIG.PAGES.QIBLA,
            {
                file: "pages/qibla.html",
                title: "القبلة"
            }
        ],

        [
            CONFIG.PAGES.NAWAWI,
            {
                file: "pages/nawawi.html",
                title: "الأربعون النووية"
            }
        ],

        [
            CONFIG.PAGES.SETTINGS,
            {
                file: "pages/settings.html",
                title: "الإعدادات"
            }
        ]

    ]);


    /* ========================================================
       التحقق من CONFIG
    ======================================================== */

    function validateDependencies() {

        if (
            typeof CONFIG === "undefined"
        ) {

            console.error(
                "الرفيق: CONFIG غير متاح. تأكد من تحميل config.js قبل router.js."
            );

            return false;
        }


        return true;

    }


    /* ========================================================
       استخراج الصفحة من Hash
    ======================================================== */

    function getHashPage() {

        const hash =
            window.location.hash
                .replace(/^#/, "")
                .trim();


        if (
            hash &&
            routes.has(hash)
        ) {

            return hash;

        }


        return null;

    }


    /* ========================================================
       الحصول على الصفحة الافتراضية
    ======================================================== */

    function getDefaultPage() {

        return CONFIG.PAGES.HOME;

    }


    /* ========================================================
       تهيئة Router
    ======================================================== */

    function init() {

        if (initialized) {

            return;

        }


        if (!validateDependencies()) {

            return;

        }


        mainContent =
            document.getElementById(
                "main-content"
            );


        bottomNavigation =
            document.getElementById(
                "bottom-navigation"
            );


        if (!mainContent) {

            console.error(
                "الرفيق: العنصر #main-content غير موجود."
            );

            return;

        }


        renderBottomNavigation();

        bindEvents();


        const initialPage =
            getHashPage() ||
            getDefaultPage();


        initialized = true;


        navigate(
            initialPage,
            {
                history: false,
                replace: true,
                force: true
            }
        );


        console.log(
            `Router v${VERSION} initialized`
        );

    }


    /* ========================================================
       إنشاء Bottom Navigation
    ======================================================== */

    function renderBottomNavigation() {

        if (!bottomNavigation) {

            return;

        }


        bottomNavigation.innerHTML = `

            <a
                href="#${CONFIG.PAGES.HOME}"
                data-page="${CONFIG.PAGES.HOME}"
                aria-label="الرئيسية"
            >
                <span
                    class="nav-icon"
                    aria-hidden="true">
                    ⌂
                </span>

                <span>
                    الرئيسية
                </span>
            </a>


            <a
                href="#${CONFIG.PAGES.QURAN}"
                data-page="${CONFIG.PAGES.QURAN}"
                aria-label="القرآن الكريم"
            >
                <span
                    class="nav-icon"
                    aria-hidden="true">
                    <img src="assets/icons/icon-quran.png" width="24" height="24" alt="">
                </span>

                <span>
                    القرآن
                </span>
            </a>


            <a
                href="#${CONFIG.PAGES.PRAYER}"
                data-page="${CONFIG.PAGES.PRAYER}"
                aria-label="مواقيت الصلاة"
            >
                <span
                    class="nav-icon"
                    aria-hidden="true">
                    <img src="assets/icons/icon-192.png" width="24" height="24" alt="">
                </span>

                <span>
                    الصلاة
                </span>
            </a>


            <a
                href="#${CONFIG.PAGES.AZKAR}"
                data-page="${CONFIG.PAGES.AZKAR}"
                aria-label="الأذكار"
            >
                <span
                    class="nav-icon"
                    aria-hidden="true">
                    <img src="assets/icons/icon-azkar.png" width="24" height="24" alt="">
                </span>

                <span>
                    الأذكار
                </span>
            </a>


            <a
                href="#${CONFIG.PAGES.SETTINGS}"
                data-page="${CONFIG.PAGES.SETTINGS}"
                aria-label="الإعدادات"
            >
                <span
                    class="nav-icon"
                    aria-hidden="true">
                    ⚙
                </span>

                <span>
                    الإعدادات
                </span>
            </a>

        `;

    }


    /* ========================================================
       ربط الأحداث
    ======================================================== */

    function bindEvents() {


        /* ----------------------------------------------------
           Bottom Navigation
        ---------------------------------------------------- */

        if (bottomNavigation) {

            bottomNavigation.addEventListener(
                "click",
                handleNavigationClick
            );

        }


        /* ----------------------------------------------------
           روابط داخل المحتوى
        ---------------------------------------------------- */

        if (mainContent) {

            mainContent.addEventListener(
                "click",
                handleNavigationClick
            );

            mainContent.addEventListener(
                "keydown",
                handleKeyboardNavigation
            );

        }


        /* ----------------------------------------------------
           Hash
        ---------------------------------------------------- */

        window.addEventListener(
            "hashchange",
            handleHashChange
        );


        /* ----------------------------------------------------
           History
        ---------------------------------------------------- */

        window.addEventListener(
            "popstate",
            handlePopState
        );

    }


    /* ========================================================
       معالجة الضغط على روابط التنقل
    ======================================================== */

    function handleNavigationClick(event) {

        const target =
            event.target.closest(
                "[data-navigate], [data-page]"
            );


        if (!target) {

            return;

        }


        const page =
            target.dataset.navigate ||
            target.dataset.page;


        if (
            !page ||
            !routes.has(page)
        ) {

            return;

        }


        event.preventDefault();


        navigate(page);

    }


    /* ========================================================
       دعم لوحة المفاتيح
    ======================================================== */

    function handleKeyboardNavigation(event) {

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


        const page =
            target.dataset.navigate;


        if (
            !page ||
            !routes.has(page)
        ) {

            return;

        }


        event.preventDefault();

        navigate(page);

    }


    /* ========================================================
       Hash Change
    ======================================================== */

    function handleHashChange() {

        const page =
            getHashPage();


        if (page) {

            navigate(
                page,
                {
                    history: false
                }
            );

            return;

        }


        navigate(
            getDefaultPage(),
            {
                history: false,
                replace: true
            }
        );

    }


    /* ========================================================
       Pop State
    ======================================================== */

    function handlePopState(event) {

        const page =
            event.state &&
            event.state.page
                ? event.state.page
                : getHashPage();


        if (
            page &&
            routes.has(page)
        ) {

            navigate(
                page,
                {
                    history: false
                }
            );

            return;

        }


        navigate(
            getDefaultPage(),
            {
                history: false,
                replace: true
            }
        );

    }


    /* ========================================================
       التنقل
    ======================================================== */

    async function navigate(
        pageName,
        options = {}
    ) {

        const {

            history = true,

            replace = false,

            force = false

        } = options;


        /* ----------------------------------------------------
           التحقق من المسار
        ---------------------------------------------------- */

        const route =
            routes.get(pageName);


        if (!route) {

            console.error(
                `الرفيق: المسار غير موجود: ${pageName}`
            );

            return false;

        }


        /* ----------------------------------------------------
           منع إعادة تحميل الصفحة نفسها
        ---------------------------------------------------- */

        if (
            !force &&
            currentPage === pageName &&
            mainContent &&
            mainContent.children.length > 0
        ) {

            return true;

        }


        /* ----------------------------------------------------
           منع التنقل المتزامن
        ---------------------------------------------------- */

        if (navigating) {

            return false;

        }


        navigating = true;


        try {

            showLoader();


            /* ----------------------------------------------
               إلغاء طلب سابق
            ---------------------------------------------- */

            if (abortController) {

                abortController.abort();

            }


            abortController =
                new AbortController();


            /* ----------------------------------------------
               تحميل الصفحة
            ---------------------------------------------- */

            const html =
                await fetchPage(
                    route.file,
                    abortController.signal
                );


            if (!mainContent) {

                throw new Error(
                    "#main-content غير موجود"
                );

            }


            /* ----------------------------------------------
               تنظيف الصفحة السابقة
            ---------------------------------------------- */

            destroyCurrentPage();


            /* ----------------------------------------------
               إدخال الصفحة الجديدة
            ---------------------------------------------- */

                        mainContent.innerHTML =
                html;

            await executePageScripts(mainContent);

            currentPage =
                pageName;


            currentRoute =
                route;


            /* ----------------------------------------------
               تحديث العنوان
            ---------------------------------------------- */

            updateDocumentTitle(
                route.title
            );


            /* ----------------------------------------------
               تحديث Navigation
            ---------------------------------------------- */

            updateActiveNavigation(
                pageName
            );


            /* ----------------------------------------------
               تحديث Hash / History
            ---------------------------------------------- */

            if (history) {

                updateHistory(
                    pageName,
                    replace
                );

            }


            /* ----------------------------------------------
               تشغيل Lifecycle الصفحة
            ---------------------------------------------- */

            await initializeCurrentPage(
                pageName
            );


            hideLoader();


            return true;

        } catch (error) {


            /* ----------------------------------------------
               تجاهل Abort
            ---------------------------------------------- */

            if (
                error &&
                error.name === "AbortError"
            ) {

                return false;

            }


            console.error(
                "الرفيق: فشل تحميل الصفحة.",
                error
            );


            hideLoader();


            showError(
                "تعذر تحميل الصفحة. حاول مرة أخرى."
            );


            return false;

        } finally {

            navigating = false;

        }

    }


    /* ========================================================
       تحميل الصفحة
    ======================================================== */

    async function fetchPage(
        file,
        signal
    ) {

        const response =
            await fetch(
                file,
                {
                    method: "GET",
                    cache: "no-cache",
                    signal
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}: ${file}`
            );

        }


        return await response.text();

    }


    /* ========================================================
       تشغيل سكربتات الصفحة المحملة ديناميكيًا
    ======================================================== */

    async function executePageScripts(container) {

        const scripts = Array.from(
            container.querySelectorAll("script")
        );

        for (const oldScript of scripts) {

            const newScript = document.createElement("script");

            for (const attribute of oldScript.attributes) {
                newScript.setAttribute(
                    attribute.name,
                    attribute.value
                );
            }

            if (oldScript.src) {
                await new Promise((resolve, reject) => {
                    newScript.onload = resolve;
                    newScript.onerror = reject;
                    document.head.appendChild(newScript);
                    oldScript.remove();
                });
            } else {
                newScript.textContent = oldScript.textContent;
                document.head.appendChild(newScript);
                oldScript.remove();
            }
        }
    }


    /* ========================================================
       تحديث History
    ======================================================== */

    function updateHistory(
        pageName,
        replace = false
    ) {

        const url =
            `#${pageName}`;


        const state = {

            page: pageName

        };


        if (replace) {

            window.history.replaceState(
                state,
                "",
                url
            );

        } else {

            window.history.pushState(
                state,
                "",
                url
            );

        }

    }


    /* ========================================================
       تحديث عنوان الصفحة
    ======================================================== */

    function updateDocumentTitle(
        title
    ) {

        document.title =
            `${title} | ${CONFIG.APP_NAME}`;

    }


    /* ========================================================
       تحديث Navigation النشط
    ======================================================== */

    function updateActiveNavigation(
        pageName
    ) {

        if (!bottomNavigation) {

            return;

        }


        const links =
            bottomNavigation.querySelectorAll(
                "[data-page]"
            );


        links.forEach(link => {

            const active =
                link.dataset.page === pageName;


            link.classList.toggle(
                "active",
                active
            );


            if (active) {

                link.setAttribute(
                    "aria-current",
                    "page"
                );

            } else {

                link.removeAttribute(
                    "aria-current"
                );

            }

        });

    }


    /* ========================================================
       Lifecycle الصفحة الحالية
    ======================================================== */

    async function initializeCurrentPage(
        pageName
    ) {

        /*
         * يمكن لكل صفحة لاحقًا تعريف:
         *
         * window.RafeeqPages = {
         *
         *     prayer() {},
         *     quran() {},
         *     azkar() {}
         *
         * };
         */


        if (
            window.RafeeqPages &&
            typeof
            window.RafeeqPages[pageName] ===
            "function"
        ) {

            try {

                await window.RafeeqPages[
                    pageName
                ]();

            } catch (error) {

                console.error(
                    `الرفيق: فشل تهيئة الصفحة ${pageName}`,
                    error
                );

            }

        }


        /* ----------------------------------------------
           حدث عام بعد تحميل الصفحة
        ---------------------------------------------- */

        document.dispatchEvent(

            new CustomEvent(
                "rafeeq:page-loaded",
                {
                    detail: {
                        page: pageName,
                        route: currentRoute
                    }
                }
            )

        );

    }


    /* ========================================================
       تنظيف الصفحة الحالية
    ======================================================== */

    function destroyCurrentPage() {

        const previousPage =
            currentPage;


        if (
            previousPage &&
            window.RafeeqPages &&
            typeof
            window.RafeeqPages[
                `${previousPage}:destroy`
            ] ===
            "function"
        ) {

            try {

                window.RafeeqPages[
                    `${previousPage}:destroy`
                ]();

            } catch (error) {

                console.error(
                    `الرفيق: خطأ أثناء تنظيف الصفحة ${previousPage}`,
                    error
                );

            }

        }


        if (mainContent) {

            mainContent.innerHTML = "";

        }

    }


    /* ========================================================
       Loader
    ======================================================== */

    function showLoader() {

        const loader =
            document.getElementById(
                "loader-root"
            );


        if (!loader) {

            return;

        }


        loader.setAttribute(
            "aria-busy",
            "true"
        );


        loader.innerHTML = `

            <div
                class="loader"
                role="status"
                aria-label="جار التحميل">
            </div>

        `;


        loader.style.display =
            "flex";

    }


    function hideLoader() {

        const loader =
            document.getElementById(
                "loader-root"
            );


        if (!loader) {

            return;

        }


        loader.setAttribute(
            "aria-busy",
            "false"
        );


        loader.style.display =
            "none";


        loader.innerHTML =
            "";

    }


    /* ========================================================
       رسالة الخطأ
    ======================================================== */

    function showError(
        message
    ) {

        const toastRoot =
            document.getElementById(
                "toast-root"
            );


        if (!toastRoot) {

            return;

        }


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            "toast";


        toast.setAttribute(
            "role",
            "alert"
        );


        toast.textContent =
            message;


        toastRoot.appendChild(
            toast
        );


        window.setTimeout(
            () => {

                toast.remove();

            },
            4000
        );

    }


    /* ========================================================
       الصفحة الحالية
    ======================================================== */

    function getCurrentPage() {

        return currentPage;

    }


    /* ========================================================
       المسار الحالي
    ======================================================== */

    function getCurrentRoute() {

        return currentRoute;

    }


    /* ========================================================
       الحصول على المسارات
    ======================================================== */

    function getRoutes() {

        return new Map(routes);

    }


    /* ========================================================
       التحقق من وجود مسار
    ======================================================== */

    function hasRoute(
        pageName
    ) {

        return routes.has(
            pageName
        );

    }


    /* ========================================================
       حالة Router
    ======================================================== */

    function isInitialized() {

        return initialized;

    }


    function isNavigating() {

        return navigating;

    }


    /* ========================================================
       تدمير Router
    ======================================================== */

    function destroy() {

        if (!initialized) {

            return;

        }


        if (bottomNavigation) {

            bottomNavigation.removeEventListener(
                "click",
                handleNavigationClick
            );

        }


        if (mainContent) {

            mainContent.removeEventListener(
                "click",
                handleNavigationClick
            );


            mainContent.removeEventListener(
                "keydown",
                handleKeyboardNavigation
            );

        }


        window.removeEventListener(
            "hashchange",
            handleHashChange
        );


        window.removeEventListener(
            "popstate",
            handlePopState
        );


        if (abortController) {

            abortController.abort();

            abortController = null;

        }


        destroyCurrentPage();


        initialized = false;

        navigating = false;

        currentPage = null;

        currentRoute = null;

        mainContent = null;

        bottomNavigation = null;

    }


    /* ========================================================
       الواجهة العامة
    ======================================================== */

    return Object.freeze({

        VERSION,

        init,

        navigate,

        destroy,

        getCurrentPage,

        getCurrentRoute,

        getRoutes,

        hasRoute,

        isInitialized,

        isNavigating

    });

})();


/* ==========================================================
   تصدير Router
========================================================== */

window.Router = Router;


/* ==========================================================
   رسالة التطوير
========================================================== */

console.log(
    `Rafeeq Router v${Router.VERSION} ready`
);