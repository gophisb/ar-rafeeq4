/* ==========================================================
   الرفيق | prayer.js
   الإصدار: 1.0.0

   محرك مواقيت الصلاة
   ----------------------------------------------------------
   المسؤولية:
   - حساب مواقيت الصلاة فلكيًا.
   - لا يعتمد على API.
   - يعمل Offline.
   - يدعم الإحداثيات الجغرافية.
   - يدعم الولاية المختارة أو GPS.
   - تحديد الصلاة القادمة.
   - العد التنازلي.
   - قابل للتطوير وربطه بقاعدة الولايات.
   - لا يحتوي على بيانات دينية.
   ========================================================== */

"use strict";


/* ==========================================================
   PrayerEngine
   ========================================================== */

const PrayerEngine = (() => {

    /* ======================================================
       الثوابت
    ====================================================== */

    const VERSION = "1.0.0";

    const DEFAULT_SETTINGS = Object.freeze({

        /*
         * إعداد الجزائر الافتراضي
         *
         * Fajr  = 18°
         * Isha  = 17°
         *
         * يمكن تغييرهما لاحقًا من الإعدادات.
         */

        fajrAngle: 18,

        ishaAngle: 17,

        /*
         * العصر:
         * 1 = ظل الشيء مثله
         * 2 = ظل الشيء مثليه
         *
         * الافتراضي:
         * مالكي / شافعي / حنبلي
         */

        asrFactor: 1,

        /*
         * تصحيح احتياطي اختياري بالدقائق.
         * يبقى 0 حتى نقارن مع الرزنامة الرسمية.
         */

        adjustments: {
            fajr: 0,
            sunrise: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0
        },

        /*
         * ارتفاع الموقع بالمتر.
         */

        elevation: 0,

        /*
         * الضغط ودرجة الحرارة
         * للاستخدام المستقبلي في تحسين refraction.
         */

        pressure: 1010,

        temperature: 10

    });


    /* ======================================================
       أسماء الصلوات
    ====================================================== */

    const PRAYER_NAMES = Object.freeze({

        fajr: "الفجر",
        sunrise: "الشروق",
        dhuhr: "الظهر",
        asr: "العصر",
        maghrib: "المغرب",
        isha: "العشاء"

    });


    /* ======================================================
       ترتيب الصلوات
    ====================================================== */

    const PRAYER_ORDER = Object.freeze([

        "fajr",
        "sunrise",
        "dhuhr",
        "asr",
        "maghrib",
        "isha"

    ]);


    /* ======================================================
       أدوات رياضية
    ====================================================== */

    function degToRad(degrees) {

        return degrees * Math.PI / 180;

    }


    function radToDeg(radians) {

        return radians * 180 / Math.PI;

    }


    function sin(degrees) {

        return Math.sin(degToRad(degrees));

    }


    function cos(degrees) {

        return Math.cos(degToRad(degrees));

    }


    function tan(degrees) {

        return Math.tan(degToRad(degrees));

    }


    function acos(value) {

        return radToDeg(Math.acos(value));

    }


    function asin(value) {

        return radToDeg(Math.asin(value));

    }


    function atan2(y, x) {

        return radToDeg(Math.atan2(y, x));

    }


    /* ======================================================
       تطبيع الزاوية
       ====================================================== */

    function normalizeDegrees(value) {

        value %= 360;

        if (value < 0) {
            value += 360;
        }

        return value;

    }


    /* ======================================================
       Julian Day
       ====================================================== */

    function julian(year, month, day) {

        if (month <= 2) {

            year -= 1;
            month += 12;

        }

        const A = Math.floor(year / 100);

        const B =
            2 -
            A +
            Math.floor(A / 4);

        return (
            Math.floor(365.25 * (year + 4716)) +
            Math.floor(30.6001 * (month + 1)) +
            day +
            B -
            1524.5
        );

    }


    /* ======================================================
       موقع الشمس
       ====================================================== */

    function solarPosition(jd) {

        const D =
            jd -
            2451545.0;

        const g =
            normalizeDegrees(
                357.529 +
                0.98560028 * D
            );

        const q =
            normalizeDegrees(
                280.459 +
                0.98564736 * D
            );

        const L =
            normalizeDegrees(
                q +
                1.915 * sin(g) +
                0.020 * sin(2 * g)
            );

        const e =
            23.439 -
            0.00000036 * D;

        const RA =
            atan2(
                cos(e) * sin(L),
                cos(L)
            ) / 15;

        const declination =
            asin(
                sin(e) * sin(L)
            );

        const equationOfTime =
            q / 15 -
            normalizeDegrees(RA * 15) / 15;

        return {

            declination,

            equationOfTime

        };

    }


    /* ======================================================
       ارتفاع الشمس
       ====================================================== */

    function sunAngleTime(

        angle,

        declination,

        latitude

    ) {

        const numerator =
            -sin(angle) -
            sin(latitude) *
            sin(declination);

        const denominator =
            cos(latitude) *
            cos(declination);

        const value =
            numerator /
            denominator;

        if (value < -1 || value > 1) {

            return null;

        }

        return acos(value) / 15;

    }


    /* ======================================================
       حساب العصر
       ====================================================== */

    function asrTime(

        factor,
        declination,
        latitude

    ) {

        const angle =
            -atan2(
                1,
                factor +
                tan(
                    Math.abs(
                        latitude -
                        declination
                    )
                )
            );

        return sunAngleTime(
            angle,
            declination,
            latitude
        );

    }


    /* ======================================================
       تحويل الوقت إلى دقائق
       ====================================================== */

    function timeToMinutes(time) {

        if (
            typeof time !== "number" ||
            !Number.isFinite(time)
        ) {

            return null;

        }

        return time * 60;

    }


    /* ======================================================
       تطبيع الدقائق
       ====================================================== */

    function normalizeMinutes(minutes) {

        if (
            minutes === null ||
            !Number.isFinite(minutes)
        ) {

            return null;

        }

        minutes %= 1440;

        if (minutes < 0) {

            minutes += 1440;

        }

        return minutes;

    }


    /* ======================================================
       تقريب إلى أقرب دقيقة
       ====================================================== */

    function roundMinute(minutes) {

        if (minutes === null) {

            return null;

        }

        return Math.round(
            normalizeMinutes(minutes)
        );

    }


    /* ======================================================
       تنسيق الوقت
       ====================================================== */

    function formatTime(minutes) {

        if (minutes === null) {

            return "--:--";

        }

        minutes =
            Math.round(
                normalizeMinutes(minutes)
            );

        const hours =
            Math.floor(minutes / 60);

        const mins =
            minutes % 60;

        return (

            String(hours)
                .padStart(2, "0")

            +

            ":"

            +

            String(mins)
                .padStart(2, "0")

        );

    }


    /* ======================================================
       إنشاء تاريخ اليوم
       ====================================================== */

    function normalizeDate(date) {

        if (date instanceof Date) {

            return new Date(

                date.getFullYear(),
                date.getMonth(),
                date.getDate()

            );

        }

        if (typeof date === "string") {

            const parsed =
                new Date(date);

            if (!Number.isNaN(
                parsed.getTime()
            )) {

                return new Date(

                    parsed.getFullYear(),
                    parsed.getMonth(),
                    parsed.getDate()

                );

            }

        }

        return new Date(

            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate()

        );

    }


    /* ======================================================
       حساب مواقيت اليوم
       ====================================================== */

    function calculate(

        date,
        location,
        customSettings = {}

    ) {

        const day =
            normalizeDate(date);

        /* ----------------------------------------------
           التحقق من الموقع
           ---------------------------------------------- */

        if (!location) {

            throw new Error(
                "موقع الصلاة غير محدد"
            );

        }


        const latitude =
            Number(location.latitude);

        const longitude =
            Number(location.longitude);


        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {

            throw new Error(
                "إحداثيات الموقع غير صحيحة"
            );

        }


        if (
            latitude < -90 ||
            latitude > 90
        ) {

            throw new Error(
                "خط العرض خارج النطاق"
            );

        }


        if (
            longitude < -180 ||
            longitude > 180
        ) {

            throw new Error(
                "خط الطول خارج النطاق"
            );

        }


        /* ----------------------------------------------
           دمج الإعدادات
           ---------------------------------------------- */

        const settings = {

            ...DEFAULT_SETTINGS,

            ...customSettings,

            adjustments: {

                ...DEFAULT_SETTINGS.adjustments,

                ...(customSettings.adjustments || {})

            }

        };


        /* ----------------------------------------------
           Julian Day
           ---------------------------------------------- */

        const jd =
            julian(

                day.getFullYear(),

                day.getMonth() + 1,

                day.getDate()

            );


        /*
         * حساب موقع الشمس حول الظهر.
         */

        const solar =
            solarPosition(
                jd + 0.5
            );


        const declination =
            solar.declination;


        const equationOfTime =
            solar.equationOfTime;


        /*
         * تصحيح خط الطول.
         *
         * الجزائر:
         * UTC+1
         */

        const timezone =
            Number.isFinite(
                Number(location.timezone)
            )
                ? Number(location.timezone)
                : 1;


        /*
         * الظهر الشمسي بالدقائق المحلية.
         */

        const noon =
            720 -
            4 * longitude -
            equationOfTime +
            timezone * 60;


        /* ----------------------------------------------
           الشروق والغروب
           ---------------------------------------------- */

        const sunriseAngle =
            sunAngleTime(
                0.833,
                declination,
                latitude
            );


        const sunrise =
            sunriseAngle === null
                ? null
                : noon - sunriseAngle * 60;


        const sunset =
            sunriseAngle === null
                ? null
                : noon + sunriseAngle * 60;


        /* ----------------------------------------------
           الفجر
           ---------------------------------------------- */

        const fajrAngle =
            sunAngleTime(
                settings.fajrAngle,
                declination,
                latitude
            );


        const fajr =
            fajrAngle === null
                ? null
                : noon - fajrAngle * 60;


        /* ----------------------------------------------
           العشاء
           ---------------------------------------------- */

        const ishaAngle =
            sunAngleTime(
                settings.ishaAngle,
                declination,
                latitude
            );


        const isha =
            ishaAngle === null
                ? null
                : noon + ishaAngle * 60;


        /* ----------------------------------------------
           العصر
           ---------------------------------------------- */

        const asrAngle =
            asrTime(
                settings.asrFactor,
                declination,
                latitude
            );


        const asr =
            asrAngle === null
                ? null
                : noon + asrAngle * 60;


        /* ----------------------------------------------
           تجميع المواقيت
           ---------------------------------------------- */

        const raw = {

            fajr,

            sunrise,

            dhuhr: noon,

            asr,

            maghrib: sunset,

            isha

        };


        /* ----------------------------------------------
           التصحيحات
           ---------------------------------------------- */

        Object.keys(raw).forEach(
            prayer => {

                if (
                    raw[prayer] !== null
                ) {

                    raw[prayer] +=
                        Number(
                            settings
                                .adjustments
                                [prayer] || 0
                        );

                }

            }
        );


        /* ----------------------------------------------
           التقريب
           ---------------------------------------------- */

        const times = {};

        Object.keys(raw).forEach(
            prayer => {

                times[prayer] =
                    roundMinute(
                        raw[prayer]
                    );

            }
        );


        /* ----------------------------------------------
           النتيجة
           ---------------------------------------------- */

        return {

            version: VERSION,

            date: day,

            location: {

                latitude,

                longitude,

                name:
                    location.name ||
                    "الموقع الحالي",

                timezone

            },

            settings,

            raw,

            minutes: times,

            formatted: {

                fajr:
                    formatTime(times.fajr),

                sunrise:
                    formatTime(times.sunrise),

                dhuhr:
                    formatTime(times.dhuhr),

                asr:
                    formatTime(times.asr),

                maghrib:
                    formatTime(times.maghrib),

                isha:
                    formatTime(times.isha)

            }

        };

    }


    /* ======================================================
       الحصول على الوقت الحالي بالدقائق
       ====================================================== */

    function currentMinutes() {

        const now = new Date();

        return (

            now.getHours() * 60 +

            now.getMinutes() +

            now.getSeconds() / 60

        );

    }


    /* ======================================================
       الصلاة القادمة
       ====================================================== */

    function getNextPrayer(

        prayerTimes,

        nowMinutes =
            currentMinutes()

    ) {

        if (
            !prayerTimes ||
            !prayerTimes.minutes
        ) {

            return null;

        }


        const available =
            PRAYER_ORDER

                .map(name => ({

                    name,

                    time:
                        prayerTimes
                            .minutes[name]

                }))

                .filter(item =>
                    item.time !== null
                );


        /*
         * الصلاة القادمة اليوم
         */

        for (
            const prayer of available
        ) {

            if (
                prayer.time >
                nowMinutes
            ) {

                return {

                    name: prayer.name,

                    title:
                        PRAYER_NAMES[
                            prayer.name
                        ],

                    time:
                        prayer.time,

                    formatted:
                        formatTime(
                            prayer.time
                        ),

                    minutesRemaining:
                        prayer.time -
                        nowMinutes,

                    tomorrow: false

                };

            }

        }


        /*
         * إذا انتهت العشاء:
         * الصلاة القادمة هي فجر الغد.
         */

        const fajr =
            available.find(
                prayer =>
                    prayer.name === "fajr"
            );


        if (fajr) {

            return {

                name: "fajr",

                title:
                    PRAYER_NAMES.fajr,

                time:
                    fajr.time,

                formatted:
                    formatTime(
                        fajr.time
                    ),

                minutesRemaining:
                    (
                        1440 -
                        nowMinutes
                    ) +
                    fajr.time,

                tomorrow: true

            };

        }


        return null;

    }


    /* ======================================================
       العد التنازلي
       ====================================================== */

    function formatCountdown(
        minutes
    ) {

        if (
            minutes === null ||
            !Number.isFinite(minutes)
        ) {

            return "--:--";

        }


        const totalSeconds =
            Math.max(
                0,
                Math.round(
                    minutes * 60
                )
            );


        const hours =
            Math.floor(
                totalSeconds / 3600
            );


        const mins =
            Math.floor(
                (totalSeconds % 3600) /
                60
            );


        const seconds =
            totalSeconds % 60;


        if (hours > 0) {

            return (

                String(hours)
                    .padStart(2, "0")

                +

                ":"

                +

                String(mins)
                    .padStart(2, "0")

                +

                ":"

                +

                String(seconds)
                    .padStart(2, "0")

            );

        }


        return (

            String(mins)
                .padStart(2, "0")

            +

            ":"

            +

            String(seconds)
                .padStart(2, "0")

        );

    }


    /* ======================================================
       حساب أوقات الغد
       ====================================================== */

    function calculateTomorrow(

        date,
        location,
        settings

    ) {

        const tomorrow =
            normalizeDate(date);

        tomorrow.setDate(
            tomorrow.getDate() + 1
        );


        return calculate(

            tomorrow,

            location,

            settings

        );

    }


    /* ======================================================
       التحقق من الموقع
       ====================================================== */

    function validateLocation(
        location
    ) {

        if (!location) {

            return {

                valid: false,

                reason:
                    "الموقع غير موجود"

            };

        }


        const latitude =
            Number(location.latitude);

        const longitude =
            Number(location.longitude);


        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {

            return {

                valid: false,

                reason:
                    "الإحداثيات غير صحيحة"

            };

        }


        if (
            latitude < -90 ||
            latitude > 90
        ) {

            return {

                valid: false,

                reason:
                    "خط العرض غير صحيح"

            };

        }


        if (
            longitude < -180 ||
            longitude > 180
        ) {

            return {

                valid: false,

                reason:
                    "خط الطول غير صحيح"

            };

        }


        return {

            valid: true,

            reason: null

        };

    }


    /* ======================================================
       الحصول على الموقع عبر GPS
       ====================================================== */

    function getGPSLocation(
        options = {}
    ) {

        return new Promise(
            (resolve, reject) => {

                if (
                    !navigator.geolocation
                ) {

                    reject(
                        new Error(
                            "GPS غير مدعوم في هذا الجهاز"
                        )
                    );

                    return;

                }


                navigator.geolocation
                    .getCurrentPosition(

                        position => {

                            resolve({

                                latitude:
                                    position
                                        .coords
                                        .latitude,

                                longitude:
                                    position
                                        .coords
                                        .longitude,

                                accuracy:
                                    position
                                        .coords
                                        .accuracy,

                                altitude:
                                    position
                                        .coords
                                        .altitude,

                                name:
                                    "الموقع الحالي",

                                timezone: 1

                            });

                        },

                        error => {

                            reject(error);

                        },

                        {

                            enableHighAccuracy:
                                options
                                    .enableHighAccuracy
                                    !== false,

                            timeout:
                                options.timeout ||
                                15000,

                            maximumAge:
                                options.maximumAge ||
                                300000

                        }

                    );

            }
        );

    }


    /* ======================================================
       الواجهة العامة
       ====================================================== */

    return Object.freeze({

        VERSION,

        DEFAULT_SETTINGS,

        PRAYER_NAMES,

        PRAYER_ORDER,

        calculate,

        calculateTomorrow,

        getNextPrayer,

        formatTime,

        formatCountdown,

        validateLocation,

        getGPSLocation

    });

})();


/* ==========================================================
   التصدير العام
   ========================================================== */

window.PrayerEngine = PrayerEngine;


/* ==========================================================
   رسالة التطوير
   ========================================================== */

console.log(
    `PrayerEngine v${PrayerEngine.VERSION} ready`
);
