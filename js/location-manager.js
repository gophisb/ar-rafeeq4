/* ==========================================================
   الرفيق | location-manager.js
   الإصدار: 1.0.0

   المسؤولية:
   - إدارة موقع المستخدم.
   - إدارة الولاية المختارة.
   - دعم GPS.
   - دعم الولايات الجزائرية الـ69.
   - حفظ الموقع محليًا.
   - إرسال تغييرات الموقع إلى التطبيق.
   - لا يحتوي على بيانات دينية.
========================================================== */

"use strict";

const LocationManager = (() => {

    /* ======================================================
       الإعدادات
    ====================================================== */

    const STORAGE_KEY = "rafeeq_location_v1";

    const DEFAULT_WILAYA_CODE = "16";

    const EVENT_NAME = "rafeeq:locationChanged";


    /* ======================================================
       الحالة الداخلية
    ====================================================== */

    let currentLocation = null;

    let gpsActive = false;


    /* ======================================================
       أدوات مساعدة
    ====================================================== */

    function normalizeCode(code) {

        if (code === null || code === undefined) {
            return null;
        }

        return String(code).padStart(2, "0");
    }


    function cloneLocation(location) {

        if (!location) {
            return null;
        }

        return Object.freeze({
            code: location.code,
            name: location.name,
            nameFr: location.nameFr,
            lat: Number(location.lat),
            lng: Number(location.lng),
            source: location.source || "wilaya"
        });
    }


    function isValidLocation(location) {

        return Boolean(
            location &&
            Locations.isValidCoordinates(
                Number(location.lat),
                Number(location.lng)
            )
        );
    }


    /* ======================================================
       إنشاء موقع من ولاية
    ====================================================== */

    function createFromWilaya(wilaya) {

        if (!wilaya) {
            return null;
        }

        return cloneLocation({
            code: wilaya.code,
            name: wilaya.name,
            nameFr: wilaya.nameFr,
            lat: wilaya.lat,
            lng: wilaya.lng,
            source: "wilaya"
        });
    }


    /* ======================================================
       اختيار ولاية
    ====================================================== */

    function setWilaya(code, options = {}) {

        const normalized = normalizeCode(code);

        const wilaya = Locations.getByCode(normalized);

        if (!wilaya) {

            console.error(
                "LocationManager: ولاية غير موجودة:",
                code
            );

            return false;
        }


        const location = createFromWilaya(wilaya);

        currentLocation = location;

        gpsActive = false;


        if (options.save !== false) {

            saveLocation(location);

        }


        updateUI(location);

        emitChange(location);


        return true;
    }


    /* ======================================================
       استخدام GPS
    ====================================================== */

    function requestGPS() {

        if (!("geolocation" in navigator)) {

            console.warn(
                "LocationManager: GPS غير مدعوم."
            );

            return Promise.reject(
                new Error("GPS_NOT_SUPPORTED")
            );
        }


        return new Promise((resolve, reject) => {

            navigator.geolocation.getCurrentPosition(

                position => {

                    const lat =
                        Number(position.coords.latitude);

                    const lng =
                        Number(position.coords.longitude);


                    if (
                        !Locations.isValidCoordinates(
                            lat,
                            lng
                        )
                    ) {

                        reject(
                            new Error("INVALID_GPS")
                        );

                        return;
                    }


                    /*
                     * عند GPS الحقيقي لا نغير اسم الولاية
                     * إلى نتيجة تخمينية هنا.
                     *
                     * الإحداثيات الحقيقية هي المرجع الأدق
                     * لمواقيت الصلاة والقبلة.
                     */

                    const gpsLocation = cloneLocation({

                        code: currentLocation
                            ? currentLocation.code
                            : DEFAULT_WILAYA_CODE,

                        name: currentLocation
                            ? currentLocation.name
                            : "موقعك الحالي",

                        nameFr: currentLocation
                            ? currentLocation.nameFr
                            : "Current location",

                        lat,
                        lng,

                        source: "gps"

                    });


                    currentLocation =
                        gpsLocation;

                    gpsActive = true;


                    saveLocation(gpsLocation);

                    updateUI(gpsLocation);

                    emitChange(gpsLocation);


                    resolve(gpsLocation);

                },

                error => {

                    console.warn(
                        "LocationManager GPS error:",
                        error
                    );

                    reject(error);

                },

                {
                    enableHighAccuracy: true,

                    timeout: 15000,

                    maximumAge: 300000

                }

            );

        });

    }


    /* ======================================================
       حفظ الموقع
    ====================================================== */

    function saveLocation(location) {

        if (!isValidLocation(location)) {
            return false;
        }


        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(location)
            );

            return true;

        } catch (error) {

            console.warn(
                "LocationManager: تعذر حفظ الموقع.",
                error
            );

            return false;

        }

    }


    /* ======================================================
       تحميل الموقع المحفوظ
    ====================================================== */

    function loadSavedLocation() {

        try {

            const raw =
                localStorage.getItem(STORAGE_KEY);


            if (!raw) {
                return null;
            }


            const saved =
                JSON.parse(raw);


            if (!isValidLocation(saved)) {
                return null;
            }


            return cloneLocation(saved);

        } catch (error) {

            console.warn(
                "LocationManager: بيانات الموقع المحفوظ غير صالحة.",
                error
            );

            return null;

        }

    }


    /* ======================================================
       الموقع الافتراضي
    ====================================================== */

    function getDefaultLocation() {

        const wilaya =
            Locations.getByCode(
                DEFAULT_WILAYA_CODE
            );


        return createFromWilaya(wilaya);

    }


    /* ======================================================
       تهيئة النظام
    ====================================================== */

    function init() {

        if (currentLocation) {
            return currentLocation;
        }


        const saved =
            loadSavedLocation();


        if (saved) {

            currentLocation = saved;

            gpsActive =
                saved.source === "gps";

        } else {

            currentLocation =
                getDefaultLocation();

            gpsActive = false;

            saveLocation(
                currentLocation
            );

        }


        updateUI(currentLocation);

        emitChange(currentLocation);


        return currentLocation;

    }


    /* ======================================================
       تحديث الواجهة
    ====================================================== */

    function updateUI(location) {

        if (!location) {
            return;
        }


        /*
         * اسم الموقع الرئيسي
         */

        const locationElements =
            document.querySelectorAll(
                "[data-location-name]"
            );


        locationElements.forEach(element => {

            element.textContent =
                location.name;

        });


        /*
         * رقم الولاية
         */

        const codeElements =
            document.querySelectorAll(
                "[data-location-code]"
            );


        codeElements.forEach(element => {

            element.textContent =
                location.code;

        });


        /*
         * خط العرض
         */

        const latElements =
            document.querySelectorAll(
                "[data-location-lat]"
            );


        latElements.forEach(element => {

            element.textContent =
                location.lat.toFixed(4);

        });


        /*
         * خط الطول
         */

        const lngElements =
            document.querySelectorAll(
                "[data-location-lng]"
            );


        lngElements.forEach(element => {

            element.textContent =
                location.lng.toFixed(4);

        });


        /*
         * مؤشر GPS
         */

        const gpsElements =
            document.querySelectorAll(
                "[data-location-source]"
            );


        gpsElements.forEach(element => {

            element.textContent =
                location.source === "gps"
                    ? "GPS"
                    : "الولاية";

        });


        /*
         * قائمة الولايات إن وجدت
         */

        const selector =
            document.querySelector(
                "#wilaya-select"
            );


        if (selector) {

            selector.value =
                location.code;

        }

    }


    /* ======================================================
       إرسال حدث تغيير الموقع
    ====================================================== */

    function emitChange(location) {

        document.dispatchEvent(

            new CustomEvent(
                EVENT_NAME,
                {
                    detail: cloneLocation(location)
                }
            )

        );

    }


    /* ======================================================
       الحصول على الموقع الحالي
    ====================================================== */

    function getCurrent() {

        return cloneLocation(
            currentLocation
        );

    }


    /* ======================================================
       هل GPS مستخدم؟
    ====================================================== */

    function isGPSActive() {

        return gpsActive;

    }


    /* ======================================================
       إعادة الموقع إلى الولاية
    ====================================================== */

    function useWilayaLocation() {

        const code =
            currentLocation
                ? currentLocation.code
                : DEFAULT_WILAYA_CODE;


        return setWilaya(code);

    }


    /* ======================================================
       إنشاء قائمة الولايات
    ====================================================== */

    function populateSelect(selector) {

        const select =
            typeof selector === "string"
                ? document.querySelector(selector)
                : selector;


        if (!select) {
            return false;
        }


        select.innerHTML = "";


        const fragment =
            document.createDocumentFragment();


        Locations.all().forEach(wilaya => {

            const option =
                document.createElement("option");


            option.value =
                wilaya.code;


            option.textContent =
                `${wilaya.code} — ${wilaya.name}`;


            option.dataset.lat =
                wilaya.lat;


            option.dataset.lng =
                wilaya.lng;


            fragment.appendChild(option);

        });


        select.appendChild(fragment);


        const current =
            getCurrent();


        if (current) {

            select.value =
                current.code;

        }


        select.addEventListener(
            "change",
            event => {

                setWilaya(
                    event.target.value
                );

            }
        );


        return true;

    }


    /* ======================================================
       API العامة
    ====================================================== */

    return Object.freeze({

        init,

        getCurrent,

        setWilaya,

        requestGPS,

        useWilayaLocation,

        populateSelect,

        isGPSActive,

        updateUI

    });

})();


/* ==========================================================
   تشغيل تلقائي
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        LocationManager.init();

    }
);


/* توافق الصفحات الديناميكية: إبقاء API نفسه متاحًا على window */
window.LocationManager = LocationManager;
