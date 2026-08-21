/* ==========================================================
   الرفيق | prayer.js
   الإصدار: 2.0.0

   محرك مواقيت الصلاة الفلكي
   ----------------------------------------------------------
   المسؤولية:
   - حساب المواقيت فلكيًا بدون API.
   - العمل Offline.
   - دعم إحداثيات GPS.
   - دعم موقع الولاية المرجعي.
   - حساب الفجر والشروق والظهر والعصر والمغرب والعشاء.
   - تحديد الصلاة القادمة.
   - العد التنازلي.
   - دعم الارتفاع عن سطح البحر.
   - قابل للتطوير والمقارنة مع الرزنامة الرسمية.

   لا يحتوي على:
   - القرآن.
   - الأحاديث.
   - الأذكار.
   - التفسير.
   - أي محتوى ديني.

   التوافق:
   - config.js
   - locations.js
========================================================== */

"use strict";


/* ==========================================================
   PrayerEngine
========================================================== */

const PrayerEngine = (() => {


    /* ======================================================
       معلومات الإصدار
    ====================================================== */

    const VERSION = "2.0.0";


    /* ======================================================
       الإعدادات الافتراضية
    ====================================================== */

    const DEFAULT_SETTINGS = Object.freeze({

        /*
         * إعداد الجزائر الافتراضي.
         *
         * الفجر:
         * 18°
         *
         * العشاء:
         * 17°
         */

        fajrAngle: 18,

        ishaAngle: 17,


        /*
         * عامل العصر:
         *
         * 1 = ظل الشيء مثله
         * 2 = ظل الشيء مثليه
         */

        asrFactor: 1,


        /*
         * التصحيحات بالدقائق.
         */

        adjustments: Object.freeze({

            fajr: 0,

            sunrise: 0,

            dhuhr: 0,

            asr: 0,

            maghrib: 0,

            isha: 0

        }),


        /*
         * الارتفاع عن سطح البحر.
         */

        elevation: 0,


        /*
         * الضغط ودرجة الحرارة.
         *
         * محفوظان للتطوير المستقبلي
         * الخاص بالانكسار الجوي.
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

        return Math.sin(
            degToRad(degrees)
        );

    }


    function cos(degrees) {

        return Math.cos(
            degToRad(degrees)
        );

    }


    function tan(degrees) {

        return Math.tan(
            degToRad(degrees)
        );

    }


    function asin(value) {

        return radToDeg(
            Math.asin(value)
        );

    }


    function acos(value) {

        return radToDeg(
            Math.acos(value)
        );

    }


    function atan(degrees) {

        return radToDeg(
            Math.atan(
                degToRad(degrees)
            )
        );

    }


    function acot(value) {

        return radToDeg(
            Math.atan2(
                1,
                value
            )
        );

    }


    /* ======================================================
       تطبيع الزوايا
    ====================================================== */

    function normalizeDegrees(value) {

        value %= 360;

        if (value < 0) {

            value += 360;

        }

        return value;

    }


    /**
     * تطبيع الزاوية إلى:
     *
     * -180 ... +180
     *
     * مهم جدًا لـ Equation of Time.
     */
    function normalizeSignedDegrees(value) {

        value =
            normalizeDegrees(value);

        if (value > 180) {

            value -= 360;

        }

        return value;

    }


    /* ======================================================
       Julian Day
    ====================================================== */

    function julian(
        year,
        month,
        day
    ) {

        if (month <= 2) {

            year -= 1;

            month += 12;

        }


        const A =
            Math.floor(
                year / 100
            );


        const B =
            2 -
            A +
            Math.floor(
                A / 4
            );


        return (

            Math.floor(
                365.25 *
                (year + 4716)
            )

            +

            Math.floor(
                30.6001 *
                (month + 1)
            )

            +

            day

            +

            B

            -

            1524.5

        );

    }


    /* ======================================================
       موقع الشمس
       ====================================================== */

    function solarPosition(jd) {

        /*
         * عدد الأيام منذ J2000.0
         */

        const D =
            jd -
            2451545.0;


        /*
         * متوسط طول الشمس.
         */

        const meanLongitude =
            normalizeDegrees(

                280.459 +
                0.98564736 * D

            );


        /*
         * متوسط anomaly.
         */

        const meanAnomaly =
            normalizeDegrees(

                357.529 +
                0.98560028 * D

            );


        /*
         * ميل دائرة البروج.
         */

        const obliquity =

            23.439 -

            0.00000036 * D;


        /*
         * الطول الظاهري للشمس.
         */

        const solarLongitude =

            normalizeDegrees(

                meanLongitude

                +

                1.915 *
                sin(meanAnomaly)

                +

                0.020 *
                sin(
                    2 *
                    meanAnomaly
                )

            );


        /*
         * Right Ascension.
         */

        let rightAscension =

            atan2Degrees(
                cos(obliquity) *
                sin(solarLongitude),

                cos(solarLongitude)
            );


        rightAscension =
            normalizeDegrees(
                rightAscension
            );


        /*
         * الميل الشمسي.
         */

        const declination =

            asin(

                sin(obliquity) *
                sin(solarLongitude)

            );


        /*
         * Equation of Time.
         *
         * يجب عدم استخدام normalize 0..360
         * مباشرة هنا.
         */

        const deltaLongitude =

            normalizeSignedDegrees(

                meanLongitude -
                rightAscension

            );


        const equationOfTime =

            4 *
            deltaLongitude;


        return {

            declination,

            equationOfTime,

            meanLongitude,

            solarLongitude,

            rightAscension

        };

    }


    /* ======================================================
       atan2 بالدرجات
    ====================================================== */

    function atan2Degrees(
        y,
        x
    ) {

        return radToDeg(
            Math.atan2(y, x)
        );

    }


    /* ======================================================
       زاوية ساعة الشمس
    ====================================================== */

    function hourAngleForAltitude(

        altitude,

        declination,

        latitude

    ) {

        const numerator =

            sin(altitude)

            -

            sin(latitude) *
            sin(declination);


        const denominator =

            cos(latitude) *
            cos(declination);


        if (
            denominator === 0
        ) {

            return null;

        }


        const value =

            numerator /
            denominator;


        /*
         * السماح بهامش صغير
         * بسبب أخطاء التقريب.
         */

        if (
            value < -1 ||
            value > 1
        ) {

            return null;

        }


        return acos(value);

    }


    /* ======================================================
       وقت الشمس عند زاوية معينة
    ====================================================== */

    function sunTime(

        altitude,

        declination,

        latitude,

        noon,

        direction

    ) {

        const hourAngle =

            hourAngleForAltitude(

                altitude,

                declination,

                latitude

            );


        if (
            hourAngle === null
        ) {

            return null;

        }


        const hours =
            hourAngle / 15;


        if (
            direction === "before"
        ) {

            return (
                noon -
                hours * 60
            );

        }


        return (
            noon +
            hours * 60
        );

    }


    /* ======================================================
       ارتفاع الشروق والغروب
    ====================================================== */

    const SUNRISE_ALTITUDE = -0.833;


    /* ======================================================
       حساب العصر
    ====================================================== */

    function calculateAsr(

        factor,

        declination,

        latitude,

        noon

    ) {

        if (
            !Number.isFinite(factor) ||
            factor <= 0
        ) {

            return null;

        }


        /*
         * زاوية الشمس فوق الأفق للعصر.
         *
         * shadow factor:
         *
         * 1 = ظل الشيء مثله
         * 2 = ظل الشيء مثليه
         */

        const solarAltitude =

            acot(

                factor +

                tan(

                    Math.abs(
                        latitude -
                        declination
                    )

                )

            );


        return sunTime(

            solarAltitude,

            declination,

            latitude,

            noon,

            "after"

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
       التقريب
    ====================================================== */

    function roundMinute(minutes) {

        if (
            minutes === null
        ) {

            return null;

        }


        return Math.round(
            normalizeMinutes(
                minutes
            )
        );

    }


    /* ======================================================
       تنسيق الوقت
    ====================================================== */

    function formatTime(minutes) {

        if (
            minutes === null ||
            !Number.isFinite(minutes)
        ) {

            return "--:--";

        }


        minutes =

            Math.round(
                normalizeMinutes(
                    minutes
                )
            );


        const hours =

            Math.floor(
                minutes / 60
            );


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
       تطبيع التاريخ
    ====================================================== */

    function normalizeDate(date) {

        if (
            date instanceof Date
        ) {

            return new Date(

                date.getFullYear(),

                date.getMonth(),

                date.getDate()

            );

        }


        if (
            typeof date === "string"
        ) {

            const parsed =
                new Date(date);


            if (
                !Number.isNaN(
                    parsed.getTime()
                )
            ) {

                return new Date(

                    parsed.getFullYear(),

                    parsed.getMonth(),

                    parsed.getDate()

                );

            }

        }


        const now =
            new Date();


        return new Date(

            now.getFullYear(),

            now.getMonth(),

            now.getDate()

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

            Number(
                location.latitude
            );


        const longitude =

            Number(
                location.longitude
            );


        if (

            !Number.isFinite(latitude)

            ||

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
       دمج الإعدادات
    ====================================================== */

    function mergeSettings(
        customSettings = {}
    ) {

        return {

            ...DEFAULT_SETTINGS,

            ...customSettings,

            adjustments: {

                ...DEFAULT_SETTINGS.adjustments,

                ...(customSettings.adjustments || {})

            }

        };

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


        /* --------------------------------------------------
           التحقق من الموقع
        -------------------------------------------------- */

        const validation =
            validateLocation(
                location
            );


        if (
            !validation.valid
        ) {

            throw new Error(
                validation.reason
            );

        }


        const latitude =

            Number(
                location.latitude
            );


        const longitude =

            Number(
                location.longitude
            );


        /* --------------------------------------------------
           الإعدادات
        -------------------------------------------------- */

        const settings =
            mergeSettings(
                customSettings
            );


        /* --------------------------------------------------
           المنطقة الزمنية
        -------------------------------------------------- */

        const timezone =

            Number.isFinite(
                Number(
                    location.timezone
                )
            )

                ?

            Number(
                location.timezone
            )

                :

            1;


        /* --------------------------------------------------
           Julian Day
        -------------------------------------------------- */

        const jd =

            julian(

                day.getFullYear(),

                day.getMonth() + 1,

                day.getDate()

            );


        /*
         * نستخدم منتصف اليوم تقريبًا
         * لحساب موضع الشمس اليومي.
         */

        const solar =

            solarPosition(
                jd + 0.5
            );


        const declination =

            solar.declination;


        const equationOfTime =

            solar.equationOfTime;


        /* --------------------------------------------------
           الظهر الشمسي
        -------------------------------------------------- */

        const noon =

            720

            -

            4 * longitude

            -

            equationOfTime

            +

            timezone * 60;


        /* --------------------------------------------------
           الشروق
        -------------------------------------------------- */

        const sunrise =

            sunTime(

                SUNRISE_ALTITUDE,

                declination,

                latitude,

                noon,

                "before"

            );


        /* --------------------------------------------------
           الغروب
        -------------------------------------------------- */

        const sunset =

            sunTime(

                SUNRISE_ALTITUDE,

                declination,

                latitude,

                noon,

                "after"

            );


        /* --------------------------------------------------
           الفجر
        -------------------------------------------------- */

        const fajr =

            sunTime(

                -Math.abs(
                    Number(
                        settings.fajrAngle
                    )
                ),

                declination,

                latitude,

                noon,

                "before"

            );


        /* --------------------------------------------------
           العشاء
        -------------------------------------------------- */

        const isha =

            sunTime(

                -Math.abs(
                    Number(
                        settings.ishaAngle
                    )
                ),

                declination,

                latitude,

                noon,

                "after"

            );


        /* --------------------------------------------------
           العصر
        -------------------------------------------------- */

        const asr =

            calculateAsr(

                Number(
                    settings.asrFactor
                ),

                declination,

                latitude,

                noon

            );


        /* --------------------------------------------------
           التجميع
        -------------------------------------------------- */

        const raw = {

            fajr,

            sunrise,

            dhuhr: noon,

            asr,

            maghrib: sunset,

            isha

        };


        /* --------------------------------------------------
           التصحيحات
        -------------------------------------------------- */

        Object.keys(raw).forEach(
            prayer => {

                if (
                    raw[prayer] !== null
                ) {

                    const adjustment =

                        Number(

                            settings
                                .adjustments
                                [prayer]

                            || 0

                        );


                    if (
                        Number.isFinite(
                            adjustment
                        )
                    ) {

                        raw[prayer] +=
                            adjustment;

                    }

                }

            }
        );


        /* --------------------------------------------------
           التقريب
        -------------------------------------------------- */

        const minutes = {};


        Object.keys(raw).forEach(
            prayer => {

                minutes[prayer] =

                    roundMinute(
                        raw[prayer]
                    );

            }
        );


        /* --------------------------------------------------
           التنسيق
        -------------------------------------------------- */

        const formatted = {};


        Object.keys(minutes).forEach(
            prayer => {

                formatted[prayer] =

                    formatTime(
                        minutes[prayer]
                    );

            }
        );


        /* --------------------------------------------------
           النتيجة
        -------------------------------------------------- */

        return {

            version: VERSION,

            date: day,

            location: {

                latitude,

                longitude,

                name:
                    location.name ||
                    "الموقع الحالي",

                nameFr:
                    location.nameFr ||
                    null,

                code:
                    location.code ||
                    null,

                timezone

            },

            solar: {

                declination,

                equationOfTime,

                solarNoon:
                    noon

            },

            settings,

            raw,

            minutes,

            formatted

        };

    }


    /* ======================================================
       الوقت الحالي
    ====================================================== */

    function currentMinutes() {

        const now =
            new Date();


        return (

            now.getHours() * 60

            +

            now.getMinutes()

            +

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

            !prayerTimes

            ||

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

                .filter(
                    item =>
                        item.time !== null
                );


        /* --------------------------------------------------
           البحث عن الصلاة القادمة
        -------------------------------------------------- */

        for (
            const prayer
            of available
        ) {

            if (
                prayer.time >
                nowMinutes
            ) {

                return {

                    name:
                        prayer.name,

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


        /* --------------------------------------------------
           انتهت صلوات اليوم
           → فجر الغد
        -------------------------------------------------- */

        const fajr =

            available.find(
                prayer =>
                    prayer.name ===
                    "fajr"
            );


        if (fajr) {

            return {

                name:
                    "fajr",

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
                    )

                    +

                    fajr.time,

                tomorrow:
                    true

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

            minutes === null

            ||

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

                (
                    totalSeconds %
                    3600
                ) / 60

            );


        const seconds =

            totalSeconds % 60;


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


    /* ======================================================
       حساب الغد
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
       GPS
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

                                timezone:
                                    1,

                                source:
                                    "gps"

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

window.PrayerEngine =
    PrayerEngine;


/* ==========================================================
   رسالة التطوير
========================================================== */

console.log(

    `PrayerEngine v${PrayerEngine.VERSION} ready`

);