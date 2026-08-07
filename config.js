/* ==========================================================
   الرفيق | router.js
   الإصدار: 1.0.0

   المسؤولية:
   - إدارة التنقل بين الصفحات.
   - تحميل الصفحات ديناميكيًا.
   - تحديث حالة التطبيق.
   - لا يحتوي على بيانات دينية.
   ========================================================== */

"use strict";

const Router = (() => {

    /* ========= المسارات ========= */
    const routes = new Map([
        [CONFIG.PAGES.HOME, { file: "pages/home.html", title: "الرئيسية" }],
        [CONFIG.PAGES.QURAN, { file: "pages/quran.html", title: "القرآن الكريم" }],
        [CONFIG.PAGES.AZKAR, { file: "pages/azkar.html", title: "الأذكار" }],
        [CONFIG.PAGES.PRAYER, { file: "pages/prayer.html", title: "مواقيت الصلاة" }],
        [CONFIG.PAGES.QIBLA, { file: "pages/qibla.html", title: "القبلة" }],
        [CONFIG.PAGES.NAWAWI, { file: "pages/nawawi.html", title: "الأربعين النووية" }],
        [CONFIG.PAGES.SETTINGS, { file: "pages/settings.html", title: "الإعدادات" }]
    ]);

    /* ========= الصفحة الحالية ========= */
    let currentPage = null;

    /* ========= العناصر ========= */
    const mainContent = document.getElementById("main-content");
    const bottomNav = document.getElementById("bottom-navigation");

    /* ========= تهيئة الروتر ========= */
    function init() {
        if (!mainContent) {
            console.error("العنصر #main-content غير موجود");
            return;
        }

        // تحميل الصفحة الافتراضية
        navigate(CONFIG.PAGES.HOME, false);

        // ربط أحداث التنقل
        bindNavigationEvents();
    }

    /* ========= التنقل إلى صفحة ========= */
    async function navigate(pageName, addToHistory = true) {
        const route = routes.get(pageName);

        if (!route) {
            console.error(`المسار غير موجود: ${pageName}`);
            return;
        }

        try {
            // عرض التحميل
            showLoader();

            // جلب محتوى الصفحة
            const html = await fetchPage(route.file);

            // تحديث المحتوى الرئيسي
            mainContent.innerHTML = html;

            // تحديث العنوان
            document.title = `${route.title} | ${CONFIG.APP_NAME}`;

            // تحديث حالة التطبيق
            currentPage = pageName;
            State.currentPage = pageName;

            // تحديث التنقل السفلي
            updateActiveNav(pageName);

            // إضافة إلى السجل
            if (addToHistory) {
                window.history.pushState({ page: pageName }, "", `#${pageName}`);
            }

            // إخفاء التحميل
            hideLoader();

        } catch (error) {
            console.error(`فشل تحميل الصفحة: ${route.file}`, error);
            hideLoader();
            showError("فشل تحميل الصفحة، يرجى المحاولة مرة أخرى");
        }
    }

    /* ========= جلب الصفحة ========= */
    async function fetchPage(file) {
        const response = await fetch(file);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.text();
    }

    /* ========= ربط أحداث التنقل ========= */
    function bindNavigationEvents() {
        // التنقل من الشريط السفلي
        if (bottomNav) {
            bottomNav.addEventListener("click", (e) => {
                const link = e.target.closest("a");
                if (link && link.dataset.page) {
                    e.preventDefault();
                    navigate(link.dataset.page);
                }
            });
        }

        // التنقل من داخل الصفحات (تفويض الأحداث)
        if (mainContent) {
            mainContent.addEventListener("click", (e) => {
                const link = e.target.closest("[data-navigate]");
                if (link) {
                    e.preventDefault();
                    const page = link.dataset.navigate;
                    if (page) {
                        navigate(page);
                    }
                }
            });
        }

        // زر الرجوع في المتصفح
        window.addEventListener("popstate", (e) => {
            if (e.state && e.state.page) {
                navigate(e.state.page, false);
            }
        });

        // التحميل الأولي من الرابط
        const hash = window.location.hash.replace("#", "");
        if (hash && routes.has(hash)) {
            navigate(hash, false);
        }
    }

    /* ========= تحديث حالة التنقل النشط ========= */
    function updateActiveNav(pageName) {
        if (!bottomNav) return;

        const links = bottomNav.querySelectorAll("a");
        links.forEach(link => {
            if (link.dataset.page === pageName) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }

    /* ========= عرض/إخفاء التحميل ========= */
    function showLoader() {
        const loaderRoot = document.getElementById("loader-root");
        if (loaderRoot) {
            loaderRoot.innerHTML = '<div class="loader"></div>';
            loaderRoot.style.display = "flex";
        }
    }

    function hideLoader() {
        const loaderRoot = document.getElementById("loader-root");
        if (loaderRoot) {
            loaderRoot.style.display = "none";
            loaderRoot.innerHTML = "";
        }
    }

    /* ========= عرض خطأ ========= */
    function showError(message) {
        const toastRoot = document.getElementById("toast-root");
        if (toastRoot) {
            const toast = document.createElement("div");
            toast.className = "toast";
            toast.textContent = message;
            toastRoot.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }

    /* ========= الحصول على الصفحة الحالية ========= */
    function getCurrentPage() {
        return currentPage;
    }

    /* ========= واجهة عامة ========= */
    return Object.freeze({
        init,
        navigate,
        getCurrentPage
    });

})();

/* ========= بدء تشغيل الروتر عند تحميل الصفحة ========= */
document.addEventListener("DOMContentLoaded", () => {
    Router.init();
});
