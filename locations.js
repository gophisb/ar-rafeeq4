/* ==========================================================
   الرفيق | locations.js
   الإصدار: 1.1.0

   المسؤولية:
   - بيانات الولايات الجزائرية الـ 69.
   - الأسماء العربية والفرنسية.
   - إحداثيات المقر المرجعي لكل ولاية.
   - المنطقة الزمنية.
   - تحويل بيانات الولاية إلى Location متوافق مع PrayerEngine.
   - لا يحتوي على بيانات دينية.

   مبدأ الموقع:
   - الولاية المختارة يدويًا هي الموقع المرجعي.
   - GPS الحقيقي يمكن استخدامه كخيار أدق.
   - لا يستبدل GPS الاختيار اليدوي تلقائيًا دون موافقة المستخدم.
========================================================== */

"use strict";


/* ==========================================================
   ثوابت الجزائر
========================================================== */

const ALGERIA_TIMEZONE = 1;


/* ==========================================================
   بيانات الولايات الجزائرية الـ 69
========================================================== */

const ALGERIA_WILAYAS = Object.freeze([

    /* 01 — 10 */

    {
        code: "01",
        name: "أدرار",
        nameFr: "Adrar",
        lat: 27.8743,
        lng: -0.2939
    },

    {
        code: "02",
        name: "الشلف",
        nameFr: "Chlef",
        lat: 36.1653,
        lng: 1.3345
    },

    {
        code: "03",
        name: "الأغواط",
        nameFr: "Laghouat",
        lat: 33.8000,
        lng: 2.8651
    },

    {
        code: "04",
        name: "أم البواقي",
        nameFr: "Oum El Bouaghi",
        lat: 35.8754,
        lng: 7.1135
    },

    {
        code: "05",
        name: "باتنة",
        nameFr: "Batna",
        lat: 35.5559,
        lng: 6.1741
    },

    {
        code: "06",
        name: "بجاية",
        nameFr: "Béjaïa",
        lat: 36.7525,
        lng: 5.0567
    },

    {
        code: "07",
        name: "بسكرة",
        nameFr: "Biskra",
        lat: 34.8500,
        lng: 5.7281
    },

    {
        code: "08",
        name: "بشار",
        nameFr: "Béchar",
        lat: 31.6167,
        lng: -2.2167
    },

    {
        code: "09",
        name: "البليدة",
        nameFr: "Blida",
        lat: 36.4700,
        lng: 2.8277
    },

    {
        code: "10",
        name: "البويرة",
        nameFr: "Bouira",
        lat: 36.3749,
        lng: 3.9020
    },


    /* 11 — 20 */

    {
        code: "11",
        name: "تمنراست",
        nameFr: "Tamanrasset",
        lat: 22.7850,
        lng: 5.5228
    },

    {
        code: "12",
        name: "تبسة",
        nameFr: "Tébessa",
        lat: 35.4042,
        lng: 8.1242
    },

    {
        code: "13",
        name: "تلمسان",
        nameFr: "Tlemcen",
        lat: 34.8783,
        lng: -1.3150
    },

    {
        code: "14",
        name: "تيارت",
        nameFr: "Tiaret",
        lat: 35.3711,
        lng: 1.3160
    },

    {
        code: "15",
        name: "تيزي وزو",
        nameFr: "Tizi Ouzou",
        lat: 36.7118,
        lng: 4.0459
    },

    {
        code: "16",
        name: "الجزائر",
        nameFr: "Alger",
        lat: 36.7538,
        lng: 3.0588
    },

    {
        code: "17",
        name: "الجلفة",
        nameFr: "Djelfa",
        lat: 34.6728,
        lng: 3.2630
    },

    {
        code: "18",
        name: "جيجل",
        nameFr: "Jijel",
        lat: 36.8206,
        lng: 5.7667
    },

    {
        code: "19",
        name: "سطيف",
        nameFr: "Sétif",
        lat: 36.1900,
        lng: 5.4108
    },

    {
        code: "20",
        name: "سعيدة",
        nameFr: "Saïda",
        lat: 34.8303,
        lng: 0.1517
    },


    /* 21 — 30 */

    {
        code: "21",
        name: "سكيكدة",
        nameFr: "Skikda",
        lat: 36.8762,
        lng: 6.9092
    },

    {
        code: "22",
        name: "سيدي بلعباس",
        nameFr: "Sidi Bel Abbès",
        lat: 35.1899,
        lng: -0.6309
    },

    {
        code: "23",
        name: "عنابة",
        nameFr: "Annaba",
        lat: 36.9000,
        lng: 7.7667
    },

    {
        code: "24",
        name: "قالمة",
        nameFr: "Guelma",
        lat: 36.4621,
        lng: 7.4261
    },

    {
        code: "25",
        name: "قسنطينة",
        nameFr: "Constantine",
        lat: 36.3650,
        lng: 6.6147
    },

    {
        code: "26",
        name: "المدية",
        nameFr: "Médéa",
        lat: 36.2675,
        lng: 2.7500
    },

    {
        code: "27",
        name: "مستغانم",
        nameFr: "Mostaganem",
        lat: 35.9312,
        lng: 0.0892
    },

    {
        code: "28",
        name: "المسيلة",
        nameFr: "M'Sila",
        lat: 35.7058,
        lng: 4.5413
    },

    {
        code: "29",
        name: "معسكر",
        nameFr: "Mascara",
        lat: 35.3966,
        lng: 0.1403
    },

    {
        code: "30",
        name: "ورقلة",
        nameFr: "Ouargla",
        lat: 31.9500,
        lng: 5.3333
    },


    /* 31 — 40 */

    {
        code: "31",
        name: "وهران",
        nameFr: "Oran",
        lat: 35.6969,
        lng: -0.6331
    },

    {
        code: "32",
        name: "البيض",
        nameFr: "El Bayadh",
        lat: 33.6833,
        lng: 1.0193
    },

    {
        code: "33",
        name: "إليزي",
        nameFr: "Illizi",
        lat: 26.4833,
        lng: 8.4667
    },

    {
        code: "34",
        name: "برج بوعريريج",
        nameFr: "Bordj Bou Arréridj",
        lat: 36.0736,
        lng: 4.7611
    },

    {
        code: "35",
        name: "بومرداس",
        nameFr: "Boumerdès",
        lat: 36.7667,
        lng: 3.4667
    },

    {
        code: "36",
        name: "الطارف",
        nameFr: "El Tarf",
        lat: 36.7672,
        lng: 8.3138
    },

    {
        code: "37",
        name: "تندوف",
        nameFr: "Tindouf",
        lat: 27.6711,
        lng: -8.1474
    },

    {
        code: "38",
        name: "تيسمسيلت",
        nameFr: "Tissemsilt",
        lat: 35.6072,
        lng: 1.8108
    },

    {
        code: "39",
        name: "الوادي",
        nameFr: "El Oued",
        lat: 33.3564,
        lng: 6.8631
    },

    {
        code: "40",
        name: "خنشلة",
        nameFr: "Khenchela",
        lat: 35.4358,
        lng: 7.1433
    },


    /* 41 — 48 */

    {
        code: "41",
        name: "سوق أهراس",
        nameFr: "Souk Ahras",
        lat: 36.2864,
        lng: 7.9511
    },

    {
        code: "42",
        name: "تيبازة",
        nameFr: "Tipaza",
        lat: 36.5897,
        lng: 2.4470
    },

    {
        code: "43",
        name: "ميلة",
        nameFr: "Mila",
        lat: 36.4503,
        lng: 6.2644
    },

    {
        code: "44",
        name: "عين الدفلى",
        nameFr: "Aïn Defla",
        lat: 36.2641,
        lng: 1.9679
    },

    {
        code: "45",
        name: "النعامة",
        nameFr: "Naâma",
        lat: 33.2667,
        lng: -0.3167
    },

    {
        code: "46",
        name: "عين تموشنت",
        nameFr: "Aïn Témouchent",
        lat: 35.2975,
        lng: -1.1404
    },

    {
        code: "47",
        name: "غرداية",
        nameFr: "Ghardaïa",
        lat: 32.4900,
        lng: 3.6700
    },

    {
        code: "48",
        name: "غليزان",
        nameFr: "Relizane",
        lat: 35.7373,
        lng: 0.5559
    },


    /* 49 — 58 */

    {
        code: "49",
        name: "تيميمون",
        nameFr: "Timimoun",
        lat: 29.2600,
        lng: 0.2300
    },

    {
        code: "50",
        name: "برج باجي مختار",
        nameFr: "Bordj Badji Mokhtar",
        lat: 21.3289,
        lng: 0.9500
    },

    {
        code: "51",
        name: "أولاد جلال",
        nameFr: "Ouled Djellal",
        lat: 34.4170,
        lng: 5.0670
    },

    {
        code: "52",
        name: "بني عباس",
        nameFr: "Béni Abbès",
        lat: 30.1333,
        lng: -2.1667
    },

    {
        code: "53",
        name: "عين صالح",
        nameFr: "In Salah",
        lat: 27.1930,
        lng: 2.4607
    },

    {
        code: "54",
        name: "عين قزام",
        nameFr: "In Guezzam",
        lat: 19.5667,
        lng: 5.7667
    },

    {
        code: "55",
        name: "تقرت",
        nameFr: "Touggourt",
        lat: 33.1000,
        lng: 6.0667
    },

    {
        code: "56",
        name: "جانت",
        nameFr: "Djanet",
        lat: 24.5547,
        lng: 9.4840
    },

    {
        code: "57",
        name: "المغير",
        nameFr: "El Meghaïer",
        lat: 33.9500,
        lng: 5.9240
    },

    {
        code: "58",
        name: "المنيعة",
        nameFr: "El Meniaa",
        lat: 30.5833,
        lng: 2.8833
    },


    /* 59 — 69 */

    {
        code: "59",
        name: "آفلو",
        nameFr: "Aflou",
        lat: 34.11279,
        lng: 2.10228
    },

    {
        code: "60",
        name: "بريكة",
        nameFr: "Barika",
        lat: 35.3890,
        lng: 5.3658
    },

    {
        code: "61",
        name: "القنطرة",
        nameFr: "El Kantara",
        lat: 35.221944,
        lng: 5.7075
    },

    {
        code: "62",
        name: "بئر العاتر",
        nameFr: "Bir El Ater",
        lat: 34.7485,
        lng: 8.0580
    },

    {
        code: "63",
        name: "العريشة",
        nameFr: "El Aricha",
        lat: 34.222661,
        lng: -1.255703
    },

    {
        code: "64",
        name: "قصر الشلالة",
        nameFr: "Ksar Chellala",
        lat: 35.21222,
        lng: 2.31889
    },

    {
        code: "65",
        name: "عين وسارة",
        nameFr: "Aïn Oussera",
        lat: 35.4489,
        lng: 2.9044
    },

    {
        code: "66",
        name: "مسعد",
        nameFr: "Messaad",
        lat: 34.15429,
        lng: 3.50309
    },

    {
        code: "67",
        name: "قصر البخاري",
        nameFr: "Ksar El Boukhari",
        lat: 35.88889,
        lng: 2.74905
    },

    {
        code: "68",
        name: "بوسعادة",
        nameFr: "Bou Saâda",
        lat: 35.2083,
        lng: 4.1749
    },

    {
        code: "69",
        name: "الأبيض سيدي الشيخ",
        nameFr: "El Abiodh Sidi Cheikh",
        lat: 32.8930,
        lng: 0.54839
    }

]);


/* ==========================================================
   أدوات داخلية
========================================================== */

function normalizeCode(code) {

    return String(code ?? "")
        .trim()
        .padStart(2, "0");

}


function normalizeName(value) {

    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

}


function isValidCoordinates(lat, lng) {

    return (

        Number.isFinite(Number(lat)) &&

        Number.isFinite(Number(lng)) &&

        Number(lat) >= -90 &&

        Number(lat) <= 90 &&

        Number(lng) >= -180 &&

        Number(lng) <= 180

    );

}


/* ==========================================================
   تحويل الولاية إلى موقع PrayerEngine
========================================================== */

function toPrayerLocation(wilaya) {

    if (!wilaya) {

        return null;

    }

    return Object.freeze({

        code:
            wilaya.code,

        name:
            wilaya.name,

        nameFr:
            wilaya.nameFr,

        latitude:
            wilaya.lat,

        longitude:
            wilaya.lng,

        timezone:
            ALGERIA_TIMEZONE,

        source:
            "wilaya"

    });

}


/* ==========================================================
   واجهة Locations
========================================================== */

const Locations = Object.freeze({

    VERSION:
        "1.1.0",


    /* --------------------------------------------------------
       جميع الولايات
    -------------------------------------------------------- */

    all() {

        return ALGERIA_WILAYAS;

    },


    /* --------------------------------------------------------
       عدد الولايات
    -------------------------------------------------------- */

    count() {

        return ALGERIA_WILAYAS.length;

    },


    /* --------------------------------------------------------
       البحث بالكود
    -------------------------------------------------------- */

    getByCode(code) {

        const normalized =
            normalizeCode(code);

        return (
            ALGERIA_WILAYAS.find(
                wilaya =>
                    wilaya.code === normalized
            ) || null
        );

    },


    /* --------------------------------------------------------
       البحث بالاسم العربي
    -------------------------------------------------------- */

    getByName(name) {

        const normalized =
            normalizeName(name);

        if (!normalized) {

            return null;

        }

        return (
            ALGERIA_WILAYAS.find(
                wilaya =>
                    normalizeName(
                        wilaya.name
                    ) === normalized
            ) || null
        );

    },


    /* --------------------------------------------------------
       البحث بالاسم الفرنسي
    -------------------------------------------------------- */

    getByFrenchName(name) {

        const normalized =
            normalizeName(name);

        if (!normalized) {

            return null;

        }

        return (
            ALGERIA_WILAYAS.find(
                wilaya =>
                    normalizeName(
                        wilaya.nameFr
                    ) === normalized
            ) || null
        );

    },


    /* --------------------------------------------------------
       الولاية الافتراضية
       الجزائر — 16
    -------------------------------------------------------- */

    getDefault() {

        return this.getByCode("16");

    },


    /* --------------------------------------------------------
       الموقع الافتراضي لـ PrayerEngine
    -------------------------------------------------------- */

    getDefaultPrayerLocation() {

        return toPrayerLocation(
            this.getDefault()
        );

    },


    /* --------------------------------------------------------
       تحويل أي ولاية إلى موقع PrayerEngine
    -------------------------------------------------------- */

    toPrayerLocation(wilaya) {

        return toPrayerLocation(
            wilaya
        );

    },


    /* --------------------------------------------------------
       التحقق من الإحداثيات
    -------------------------------------------------------- */

    isValidCoordinates,


    /* --------------------------------------------------------
       التحقق من بيانات ولاية كاملة
    -------------------------------------------------------- */

    isValid(wilaya) {

        return (

            !!wilaya &&

            typeof wilaya.code === "string" &&

            typeof wilaya.name === "string" &&

            typeof wilaya.nameFr === "string" &&

            isValidCoordinates(
                wilaya.lat,
                wilaya.lng
            )

        );

    }

});


/* ==========================================================
   فحص قاعدة البيانات
========================================================== */

(function validateLocations() {

    /* عدد الولايات */

    if (
        ALGERIA_WILAYAS.length !== 69
    ) {

        console.error(
            "الرفيق: خطأ — قاعدة الولايات يجب أن تحتوي على 69 ولاية."
        );

        return;

    }


    /* منع تكرار الأكواد */

    const codes =
        new Set(
            ALGERIA_WILAYAS.map(
                wilaya => wilaya.code
            )
        );


    if (
        codes.size !== 69
    ) {

        console.error(
            "الرفيق: توجد رموز ولايات مكررة."
        );

        return;

    }


    /* فحص البيانات */

    const invalid =
        ALGERIA_WILAYAS.filter(
            wilaya =>
                !Locations.isValid(
                    wilaya
                )
        );


    if (
        invalid.length
    ) {

        console.error(
            "الرفيق: توجد بيانات ولاية غير صحيحة.",
            invalid
        );

        return;

    }


    console.log(
        `Rafeeq Locations v${Locations.VERSION} ready — ${Locations.count()} wilayas`
    );

})();


/* ==========================================================
   التصدير العام
========================================================== */

window.ALGERIA_WILAYAS =
    ALGERIA_WILAYAS;

window.Locations =
    Locations;