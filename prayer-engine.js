/**
 * PrayerEngine - محرك حساب مواقيت الصلاة
 * خوارزمية فلكية معتمدة (ISNA / أم القرى / رابطة العالم الإسلامي)
 * تعمل بدون أي مكتبات خارجية - Vanilla JS
 */

const CalculationMethod = {
  MWL: { fajrAngle: 18, ishaAngle: 17, name: "رابطة العالم الإسلامي" },
  ISNA: { fajrAngle: 15, ishaAngle: 15, name: "ISNA" },
  Egypt: { fajrAngle: 19.5, ishaAngle: 17.5, name: "مصر" },
  Makkah: { fajrAngle: 18.5, ishaInterval: 90, name: "أم القرى" },
  Karachi: { fajrAngle: 18, ishaAngle: 18, name: "كراتشي" },
  Algeria: { fajrAngle: 18, ishaAngle: 17, name: "الجزائر" },
};

const AsrMethod = {
  Standard: 1,  // الشافعي، المالكي، الحنبلي
  Hanafi: 2,    // الحنفي
};

class PrayerEngine {
  constructor(coordinates, method = "MWL", asrMethod = AsrMethod.Standard) {
    this.latitude = coordinates.lat;
    this.longitude = coordinates.lng;
    this.timezone = coordinates.timezone ?? this._guessTimezone();
    this.method = CalculationMethod[method] ?? CalculationMethod.MWL;
    this.asrMethod = asrMethod;
  }

  // ─── الدالة الرئيسية ───────────────────────────────────────────────────────
  calculateTimes(date = new Date()) {
    const jd = this._julianDay(date);
    const { declination, equation } = this._sunPosition(jd);
    const transit = this._transitTime(jd, equation);

    const fajr    = this._angleTime(transit, declination, this.method.fajrAngle, true);
    const sunrise = this._angleTime(transit, declination, 0.833, true);
    const dhuhr   = transit;
    const asr     = this._asrTime(transit, declination);
    const sunset  = this._angleTime(transit, declination, 0.833, false);
    const maghrib = sunset;
    const isha    = this.method.ishaInterval
      ? sunset + this.method.ishaInterval / 60
      : this._angleTime(transit, declination, this.method.ishaAngle, false);

    return {
      fajr:    this._formatTime(fajr),
      sunrise: this._formatTime(sunrise),
      dhuhr:   this._formatTime(dhuhr),
      asr:     this._formatTime(asr),
      maghrib: this._formatTime(maghrib),
      isha:    this._formatTime(isha),
    };
  }

  // ─── اليوم الجولياني ────────────────────────────────────────────────────────
  _julianDay(date) {
    let Y = date.getFullYear();
    let M = date.getMonth() + 1;
    const D = date.getDate();
    if (M <= 2) { Y--; M += 12; }
    const A = Math.floor(Y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
  }

  // ─── موقع الشمس ─────────────────────────────────────────────────────────────
  _sunPosition(jd) {
    const D = jd - 2451545.0;
    const g = this._rad(357.529 + 0.98560028 * D);
    const q = 280.459 + 0.98564736 * D;
    const L = this._rad(q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
    const e = this._rad(23.439 - 0.00000036 * D);
    const declination = this._deg(Math.asin(Math.sin(e) * Math.sin(L)));
    const RA = this._deg(Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L))) / 15;
    const equation = q / 15 - this._fixHour(RA);
    return { declination, equation };
  }

  // ─── وقت العبور (الظهر) ─────────────────────────────────────────────────────
  _transitTime(jd, equation) {
    const lngHour = this.longitude / 15;
    return 12 + this.timezone - lngHour - equation;
  }

  // ─── وقت زاوية الشمس ────────────────────────────────────────────────────────
  _angleTime(transit, declination, angle, before) {
    const lat = this._rad(this.latitude);
    const dec = this._rad(declination);
    const ang = this._rad(angle);
    const cosH = (Math.cos(Math.PI / 2 + ang) - Math.sin(lat) * Math.sin(dec))
               / (Math.cos(lat) * Math.cos(dec));
    if (cosH < -1 || cosH > 1) return NaN; // لا تشرق/تغرب في القطبين
    const H = this._deg(Math.acos(cosH)) / 15;
    return before ? transit - H : transit + H;
  }

  // ─── وقت العصر ──────────────────────────────────────────────────────────────
  _asrTime(transit, declination) {
    const lat = this._rad(this.latitude);
    const dec = this._rad(declination);
    const target = Math.atan(1 / (this.asrMethod + Math.tan(Math.abs(lat - dec))));
    const cosH = (Math.sin(target) - Math.sin(lat) * Math.sin(dec))
               / (Math.cos(lat) * Math.cos(dec));
    if (cosH < -1 || cosH > 1) return NaN;
    return transit + this._deg(Math.acos(cosH)) / 15;
  }

  // ─── تنسيق الوقت ────────────────────────────────────────────────────────────
  _formatTime(time) {
    if (isNaN(time)) return "--:--";
    time = this._fixHour(time);
    const h = Math.floor(time);
    const m = Math.round((time - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // ─── مساعدات رياضية ─────────────────────────────────────────────────────────
  _rad(deg) { return deg * Math.PI / 180; }
  _deg(rad) { return rad * 180 / Math.PI; }
  _fixHour(h) { return h - 24 * Math.floor(h / 24); }

  _guessTimezone() {
    return -new Date().getTimezoneOffset() / 60;
  }
}

export { PrayerEngine, CalculationMethod, AsrMethod };
export default PrayerEngine;
