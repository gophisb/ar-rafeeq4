/* ==========================================================
   الرفيق | prayer-times.js
   الإصدار: 1.0.0

   المسؤولية:
   - حساب أوقات الصلاة بواسطة Adhan.js
   - دعم الموقع اليدوي أو GPS
   - الصلاة القادمة
   - الصلاة الحالية
   - العد التنازلي
   - حساب القبلة
   - إعدادات طريقة الحساب والمذهب
   - لا يعتمد على API خارجي لحساب الصلاة

   ملاحظة:
   هذا الملف مستقل.
   لا تعدّل app.js / router.js / sw.js في هذه المرحلة.
   ========================================================== */

"use strict";

/* ==========================================================
   Adhan
   ========================================================== */

import {
    Coordinates,
    CalculationMethod,
    PrayerTimes,
    Madhab,
    Qibla
} from "adhan";


/* ==========================================================
   الثوابت
   ========================================================== */

const PRAYER_ENGINE_VERSION = "1.0.0";

const PRAYERS = Object.freeze([
    {
        key: "fajr",
        name: "الفجر",
        icon: "🌙",
        obligatory: true
    },

    {
        key: "sunrise",
        name: "الشروق",
        icon: "🌅",
        obligatory: false
    },

    {
        key: "dhuhr",
        name: "الظهر",
        icon: "☀️",
        obligatory: true
    },

    {
        key: "asr",
        name: "العصر",
        icon: "🌤️",
        obligatory: true
    },

    {
        key: "maghrib",
        name: "المغرب",
        icon: "🌇",
        obligatory: true
    },

    {
        key: "isha",
        name: "العشاء",
        icon: "🌌",
        obligatory: true
    }
]);


/* ==========================================================
   الإعدادات الافتراضية
   ========================================================== */

const DEFAULT_SETTINGS = Object.freeze({

    /*
     * الجزائر
     */
    timezone: "Africa/Algiers",

    /*
     * طريقة الحساب الأولية.
     *
     * سنقارن لاحقًا النتائج مع المرجع المحلي
     * قبل اعتمادها نهائيًا في الرفيق.
     */
    calculationMethod: "MuslimWorldLeague",

    /*
     * الشافعي هو الافتراضي التقني.
     *
     * يمكن للمستخدم تغيير المذهب إلى Hanafi.
     */
    madhab: "Shafi",

    /*
     * تعديلات الدقائق.
     *
     * تبقى صفرًا حتى نعتمد قيمًا موثقة.
     */
    adjustments: Object.freeze({
        fajr: 0,
        sunrise: 0,
        dhuhr: 0,
        asr: 0,
        sunset: 0,
        maghrib: 0,
        isha: 0
    })

});


/* ==========================================================
   الحالة الداخلية
   ========================================================== */

let settings = {
    ...DEFAULT_SETTINGS,
    adjustments: {
        ...DEFAULT_SETTINGS.adjustments
    }
};

let currentLocation = null;


/* ==========================================================
   أدوات التحقق
   ========================================================== */

function validateNumber(value, name) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new TypeError(
            `${name} يجب أن يكون رقمًا صالحًا.`
        );
    }

    return number;
}


function validateCoordinates(latitude, longitude) {

    latitude = validateNumber(
        latitude,
        "خط العرض"
    );

    longitude = validateNumber(
        longitude,
        "خط الطول"
    );


    if (latitude < -90 || latitude > 90) {

        throw new RangeError(
            "خط العرض يجب أن يكون بين -90 و90."
        );

    }


    if (longitude < -180 || longitude > 180) {

        throw new RangeError(
            "خط الطول يجب أن يكون بين -180 و180."
        );

    }


    return {
        latitude,
        longitude
    };
}


/* ==========================================================
   الموقع
   ========================================================== */

function setLocation({
    latitude,
    longitude,
    name = "موقع مخصص",
    source = "manual"
}) {

    const coordinates = validateCoordinates(
        latitude,
        longitude
    );


    currentLocation = {

        latitude: coordinates.latitude,

        longitude: coordinates.longitude,

        name,

        source

    };


    return getLocation();
}


function getLocation() {

    if (!currentLocation) {
        return null;
    }

    return {
        ...currentLocation
    };
}


/* ==========================================================
   GPS
   ========================================================== */

function getCurrentLocation(options = {}) {

    if (!navigator.geolocation) {

        return Promise.reject(
            new Error(
                "المتصفح لا يدعم تحديد الموقع."
            )
        );

    }


    return new Promise(
        (resolve, reject) => {

            navigator.geolocation.getCurrentPosition(

                position => {

                    const location = setLocation({

                        latitude:
                            position.coords.latitude,

                        longitude:
                            position.coords.longitude,

                        name:
                            options.name ||
                            "موقعي الحالي",

                        source: "gps"

                    });


                    resolve(location);

                },

                error => {

                    reject(error);

                },

                {

                    enableHighAccuracy:
                        options.enableHighAccuracy ??
                        false,

                    timeout:
                        options.timeout ??
                        10000,

                    maximumAge:
                        options.maximumAge ??
                        300000

                }

            );

        }
    );
}


/* ==========================================================
   طريقة الحساب
   ========================================================== */

function createCalculationParameters() {

    let params;


    switch (settings.calculationMethod) {

        case "MuslimWorldLeague":

            params =
                CalculationMethod.MuslimWorldLeague();

            break;


        case "Egyptian":

            params =
                CalculationMethod.Egyptian();

            break;


        case "Karachi":

            params =
                CalculationMethod.Karachi();

            break;


        case "UmmAlQura":

            params =
                CalculationMethod.UmmAlQura();

            break;


        case "Dubai":

            params =
                CalculationMethod.Dubai();

            break;


        case "MoonsightingCommittee":

            params =
                CalculationMethod.MoonsightingCommittee();

            break;


        case "NorthAmerica":

            params =
                CalculationMethod.NorthAmerica();

            break;


        case "Kuwait":

            params =
                CalculationMethod.Kuwait();

            break;


        case "Qatar":

            params =
                CalculationMethod.Qatar();

            break;


        case "Singapore":

            params =
                CalculationMethod.Singapore();

            break;


        default:

            throw new Error(
                `طريقة الحساب غير مدعومة: ${settings.calculationMethod}`
            );

    }


    /* ======================================================
       المذهب
       ====================================================== */

    if (settings.madhab === "Hanafi") {

        params.madhab = Madhab.Hanafi;

    } else {

        params.madhab = Madhab.Shafi;

    }


    /* ======================================================
       التعديلات
       ====================================================== */

    if (params.adjustments) {

        Object.entries(
            settings.adjustments
        ).forEach(
            ([key, value]) => {

                if (key in params.adjustments) {

                    params.adjustments[key] =
                        Number(value) || 0;

                }

            }
        );

    }


    return params;
}


/* ==========================================================
   حساب أوقات الصلاة
   ========================================================== */

function calculate(date = new Date()) {

    if (!currentLocation) {

        throw new Error(
            "لم يتم تحديد موقع الصلاة."
        );

    }


    if (!(date instanceof Date)) {

        throw new TypeError(
            "التاريخ يجب أن يكون Date."
        );

    }


    const coordinates = new Coordinates(

        currentLocation.latitude,

        currentLocation.longitude

    );


    const params =
        createCalculationParameters();


    const prayerTimes =
        new PrayerTimes(

            coordinates,

            date,

            params

        );


    return prayerTimes;
}


/* ==========================================================
   تحويل الوقت
   ========================================================== */

function formatTime(
    date,
    options = {}
) {

    if (!date) {
        return "--:--";
    }


    return new Intl.DateTimeFormat(

        options.locale ||
        "ar-DZ",

        {

            timeZone:
                options.timezone ||
                settings.timezone,

            hour: "2-digit",

            minute: "2-digit",

            hour12:
                options.hour12 ??
                false

        }

    ).format(date);
}


/* ==========================================================
   جدول اليوم
   ========================================================== */

function getTodaySchedule(
    date = new Date()
) {

    const times =
        calculate(date);


    return PRAYERS.map(
        prayer => {

            const time =
                times[prayer.key];


            return {

                key:
                    prayer.key,

                name:
                    prayer.name,

                icon:
                    prayer.icon,

                obligatory:
                    prayer.obligatory,

                date:
                    time,

                time:
                    formatTime(time)

            };

        }
    );

}


/* ==========================================================
   الصلاة القادمة
   ========================================================== */

function getNextPrayer(
    date = new Date()
) {

    const times =
        calculate(date);


    const next =
        times.nextPrayer();


    if (!next) {

        return null;

    }


    const time =
        times.timeForPrayer(next);


    const prayer =
        PRAYERS.find(
            item =>
                item.key === next
        );


    return {

        key:
            next,

        name:
            prayer?.name ||
            next,

        icon:
            prayer?.icon ||
            "🕌",

        date:
            time,

        time:
            formatTime(time)

    };

}


/* ==========================================================
   الصلاة الحالية
   ========================================================== */

function getCurrentPrayer(
    date = new Date()
) {

    const times =
        calculate(date);


    const current =
        times.currentPrayer();


    if (!current) {

        return null;

    }


    const prayer =
        PRAYERS.find(
            item =>
                item.key === current
        );


    return {

        key:
            current,

        name:
            prayer?.name ||
            current,

        icon:
            prayer?.icon ||
            "🕌"

    };

}


/* ==========================================================
   العد التنازلي
   ========================================================== */

function getCountdown(
    date = new Date()
) {

    const next =
        getNextPrayer(date);


    if (
        !next ||
        !next.date
    ) {

        return null;

    }


    const difference =
        Math.max(

            0,

            next.date.getTime() -
            date.getTime()

        );


    let totalSeconds =
        Math.floor(
            difference / 1000
        );


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    totalSeconds %= 3600;


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    return {

        prayer:
            next,

        hours,

        minutes,

        seconds,

        totalMilliseconds:
            difference,

        text:

            `${String(hours).padStart(2, "0")}:` +
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`

    };

}


/* ==========================================================
   القبلة
   ========================================================== */

function getQiblaDirection() {

    if (!currentLocation) {

        throw new Error(
            "حدد الموقع أولًا."
        );

    }


    const coordinates =
        new Coordinates(

            currentLocation.latitude,

            currentLocation.longitude

        );


    return Qibla(coordinates);

}


/* ==========================================================
   الإعدادات
   ========================================================== */

function configure(options = {}) {

    settings = {

        ...settings,

        ...options,

        adjustments: {

            ...settings.adjustments,

            ...(options.adjustments || {})

        }

    };


    return getSettings();

}


function getSettings() {

    return {

        ...settings,

        adjustments: {

            ...settings.adjustments

        }

    };

}


/* ==========================================================
   إعادة الإعدادات
   ========================================================== */

function resetSettings() {

    settings = {

        ...DEFAULT_SETTINGS,

        adjustments: {

            ...DEFAULT_SETTINGS.adjustments

        }

    };


    return getSettings();

}


/* ==========================================================
   معلومات المحرك
   ========================================================== */

function getEngineInfo() {

    return {

        name:
            "Rafeeq Prayer Engine",

        version:
            PRAYER_ENGINE_VERSION,

        provider:
            "Adhan.js",

        offlineCalculation:
            true,

        timezone:
            settings.timezone,

        location:
            getLocation(),

        calculationMethod:
            settings.calculationMethod,

        madhab:
            settings.madhab

    };

}


/* ==========================================================
   API العامة
   ========================================================== */

const PrayerEngine = Object.freeze({

    version:
        PRAYER_ENGINE_VERSION,

    prayers:
        PRAYERS,

    setLocation,

    getLocation,

    getCurrentLocation,

    calculate,

    getTodaySchedule,

    getNextPrayer,

    getCurrentPrayer,

    getCountdown,

    getQiblaDirection,

    formatTime,

    configure,

    getSettings,

    resetSettings,

    getEngineInfo

});


/* ==========================================================
   التصدير
   ========================================================== */

export default PrayerEngine;

export {

    PrayerEngine,

    PRAYERS

};
