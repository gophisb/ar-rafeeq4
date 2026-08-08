/* ==========================================================
   الرفيق | router.js
   الإصدار: 2.0.0

   المسؤولية:
   - إدارة التنقل.
   - تحميل الصفحات ديناميكيًا.
   - إدارة History / Hash.
   - تحديث الصفحة النشطة.
   - لا يحتوي على بيانات دينية.
   ========================================================== */

"use strict";


const Router = (() => {

    /* ========================================================
       المسارات
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
       الحالة
       ======================================================== */

    let initialized = false;

    let currentPage = null;


    /* ========================================================
       العناصر
       ======================================================== */

    let mainContent = null;

    let bottomNavigation = null;


    /* ========================================================
       تهيئة Router
       ======================================================== */

    function init() {

        /* منع التهيئة المكررة */
        if (initialized) {
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
                "الرفيق: #main-content غير موجود."
            );

            return;
        }


        /* إنشاء شريط التنقل */
        renderBottomNavigation();


        /* ربط الأحداث */
        bindEvents();


        /* قراءة الصفحة من الرابط */
        const hash =
            window.location.hash
                .replace("#", "")
                .trim();


        if (hash && routes.has(hash)) {

            navigate(hash, false);

        } else {

            navigate(
                CONFIG.PAGES.HOME,
                false
            );

        }


        initialized = true;

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
                href="#home"
                data-page="home"
                aria-label="الرئيسية"
            >
                <span class="nav-icon">⌂</span>
                <span>الرئيسية</span>
            </a>


            <a
                href="#quran"
                data-page="quran"
                aria-label="القرآن الكريم"
            >
                <span class="nav-icon">📖</span>
                <span>القرآن</span>
            </a>


            <a
                href="#prayer"
                data-page="prayer"
                aria-label="مواقيت الصلاة"
            >
                <span class="nav-icon">🕌</span>
                <span>الصلاة</span>
            </a>


            <a
                href="#azkar"
                data-page="azkar"
                aria-label="الأذكار"
            >
                <span class="nav-icon">🤲</span>
                <span>الأذكار</span>
            </a>


            <a
                href="#settings"
                data-page="settings"
                aria-label="الإعدادات"
            >
                <span class="nav-icon">⚙</span>
                <span>الإعدادات</span>
            </a>

        `;

    }


    /* ========================================================
       التنقل
       ======================================================== */

    async function navigate(
        pageName,
        addToHistory = true
    ) {

        const route =
            routes.get(pageName);


        if (!route) {

            console.error(
                `الرفيق: المسار غير موجود: ${pageName}`
            );

            return;
        }


        try {

            showLoader();


            const html =
                await fetchPage(
                    route.file
                );


            if (!mainContent) {
                return;
            }


            mainContent.innerHTML =
                html;


            currentPage =
                pageName;


            /* تحديث العنوان */
            document.title =
                `${route.title} | ${CONFIG.APP_NAME}`;


            /* تحديث التنقل */
            updateActiveNavigation(
                pageName
            );


            /* History */
            if (addToHistory) {

                window.history.pushState(
                    {
                        page: pageName
                    },
                    "",
                    `#${pageName}`
                );

            }


            hideLoader();


        } catch (error) {

            console.error(
                "الرفيق: فشل تحميل الصفحة",
                error
            );


            hideLoader();


            showError(
                "تعذر تحميل الصفحة"
            );

        }

    }


    /* ========================================================
       تحميل الصفحة
       ======================================================== */

    async function fetchPage(file) {

        const response =
            await fetch(file, {
                cache: "no-cache"
            });


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        return await response.text();

    }


    /* ========================================================
       الأحداث
       ======================================================== */

    function bindEvents() {


        /* Bottom Navigation */

        if (bottomNavigation) {

            bottomNavigation.addEventListener(
                "click",
                event => {

                    const link =
                        event.target.closest(
                            "a[data-page]"
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


        /* روابط الصفحات الداخلية */

        if (mainContent) {

            mainContent.addEventListener(
                "click",
                event => {

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
                        page &&
                        routes.has(page)
                    ) {

                        event.preventDefault();

                        navigate(page);

                    }

                }
            );

        }


        /* زر الرجوع */

        window.addEventListener(
            "popstate",
            event => {

                if (
                    event.state &&
                    event.state.page
                ) {

                    navigate(
                        event.state.page,
                        false
                    );

                } else {

                    const hash =
                        window.location.hash
                            .replace("#", "")
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

            }
        );

    }


    /* ========================================================
       تحديث التنقل النشط
       ======================================================== */

    function updateActiveNavigation(
        pageName
    ) {

        if (!bottomNavigation) {
            return;
        }


        const links =
            bottomNavigation.querySelectorAll(
                "a[data-page]"
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


        loader.innerHTML =
            '<div class="loader" aria-label="جار التحميل"></div>';


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


        loader.style.display =
            "none";


        loader.innerHTML =
            "";

    }


    /* ========================================================
       رسالة الخطأ
       ======================================================== */

    function showError(message) {

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


        toast.textContent =
            message;


        toastRoot.appendChild(
            toast
        );


        setTimeout(() => {

            toast.remove();

        }, 3500);

    }


    /* ========================================================
       الصفحة الحالية
       ======================================================== */

    function getCurrentPage() {

        return currentPage;

    }


    /* ========================================================
       التحقق من التهيئة
       ======================================================== */

    function isInitialized() {

        return initialized;

    }


    /* ========================================================
       الواجهة العامة
       ======================================================== */

    return Object.freeze({

        init,

        navigate,

        getCurrentPage,

        isInitialized

    });

})();