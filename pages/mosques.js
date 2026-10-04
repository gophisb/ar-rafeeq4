"use strict";

(function () {
  const DATA_URL = "./mosquees-data.json";
  const EXPECTED_COUNT = 20759;
  const DEFAULT_RADIUS = 2000;
  const SEARCH_LIMIT = 50;
  const NEAREST_LIMIT = 10;
  const RADIUS_STEPS = [500, 1000, 2000, 5000, 10000];

  const state = {
    mosques: [],
    filtered: [],
    loaded: false,
    loading: null,
    gps: null,
    reference: null,
    radius: DEFAULT_RADIUS
  };

  const $ = (id) => document.getElementById(id);
  const status = (value) => {
    const el = $("mosques-status");
    if (el) el.textContent = value;
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[ch]));
  }

  function validCoordinate(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  function distanceMeters(a, b) {
    const R = 6371000;
    const p1 = Number(a.lat) * Math.PI / 180;
    const p2 = Number(b.lat) * Math.PI / 180;
    const dp = (Number(b.lat) - Number(a.lat)) * Math.PI / 180;
    const dl = (Number(b.lng) - Number(a.lng)) * Math.PI / 180;
    const h = Math.sin(dp / 2) ** 2 +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
  }

  function bearingDegrees(a, b) {
    const p1 = Number(a.lat) * Math.PI / 180;
    const p2 = Number(b.lat) * Math.PI / 180;
    const dl = (Number(b.lng) - Number(a.lng)) * Math.PI / 180;
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) -
      Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  function bearingLabel(deg) {
    const dirs = ["شمال", "شمال شرقي", "شرق", "جنوب شرقي",
      "جنوب", "جنوب غربي", "غرب", "شمال غربي"];
    return dirs[Math.round(deg / 45) % 8];
  }

  function formatDistance(meters) {
    if (!Number.isFinite(meters)) return "—";
    if (meters < 1000) return Math.round(meters) + " م";
    return (meters / 1000).toFixed(meters < 10000 ? 1 : 0) + " كم";
  }

  function displayName(m) {
    return m.name_ar || m.name || m.name_fr || "مسجد بدون اسم";
  }

  function referenceLabel(ref) {
    if (!ref) return "موقع غير محدد";
    if (ref.source === "gps") return "موقعك الحالي عبر GPS";
    return ref.name || ("ولاية " + (ref.code || "—"));
  }

  function setReference(ref) {
    if (!ref || !validCoordinate(Number(ref.lat), Number(ref.lng))) return false;
    state.reference = {
      lat: Number(ref.lat),
      lng: Number(ref.lng),
      source: ref.source || "manual",
      code: ref.code || "",
      name: ref.name || ""
    };
    return true;
  }

  function buildRadiusOptions() {
    const select = $("mosques-radius");
    if (!select) return;
    select.innerHTML = RADIUS_STEPS.map(r =>
      `<option value="${r}" ${r === state.radius ? "selected" : ""}>${r < 1000 ? r + " م" : (r / 1000) + " كم"}</option>`
    ).join("") + '<option value="0">توسّع تلقائيًا حتى 10 كم</option>';
  }

  function getRadius() {
    const value = Number($("mosques-radius")?.value);
    return Number.isFinite(value) ? value : DEFAULT_RADIUS;
  }

  function normalizeSearchValue(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase("ar-DZ")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه");
  }

  function matchesText(m, q) {
    if (!q) return true;
    return [m.name_ar, m.name, m.name_fr, m.commune]
      .filter(Boolean)
      .some(v => normalizeSearchValue(v).includes(q));
  }

  function bboxForRadius(ref, radius) {
    const lat = Number(ref.lat);
    const lng = Number(ref.lng);
    const latDelta = radius / 111320;
    const cosLat = Math.max(0.1, Math.cos(lat * Math.PI / 180));
    const lngDelta = radius / (111320 * cosLat);
    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta
    };
  }

  function inBbox(m, box) {
    const lat = Number(m.lat);
    const lng = Number(m.lng);
    return validCoordinate(lat, lng) &&
      lat >= box.minLat && lat <= box.maxLat &&
      lng >= box.minLng && lng <= box.maxLng;
  }

  function nearestWithin(ref, radius, limit) {
    const box = bboxForRadius(ref, radius);
    const candidates = [];

    for (const mosque of state.mosques) {
      if (!inBbox(mosque, box)) continue;
      const distance = distanceMeters(ref, mosque);
      if (distance <= radius) {
        candidates.push({ ...mosque, _distance: distance });
      }
    }

    candidates.sort((a, b) => a._distance - b._distance);
    return candidates.slice(0, limit);
  }

  function nearestWithExpansion(ref, selectedRadius) {
    const steps = selectedRadius > 0 ? [selectedRadius] : RADIUS_STEPS;
    for (const radius of steps) {
      const result = nearestWithin(ref, radius, NEAREST_LIMIT);
      if (result.length) return { result, radius };
    }
    return { result: [], radius: steps[steps.length - 1] || DEFAULT_RADIUS };
  }

  function render(list, nearestMode = false) {
    const root = $("mosques-results");
    if (!root) return;

    if (!list.length) {
      root.innerHTML = '<div class="card-premium">لا توجد نتائج في النطاق المحدد. جرّب نطاقًا أوسع أو اختر موقعًا آخر.</div>';
      return;
    }

    root.innerHTML = list.slice(0, SEARCH_LIMIT).map((m, index) => {
      const hasDistance = Number.isFinite(m._distance);
      const distance = hasDistance ? `<div>المسافة: <strong>${formatDistance(m._distance)}</strong></div>` : "";
      const direction = hasDistance && state.reference
        ? `<div>الاتجاه التقريبي: ${Math.round(bearingDegrees(state.reference, m))}° — ${bearingLabel(bearingDegrees(state.reference, m))}</div>`
        : "";
      const primary = nearestMode && index === 0
        ? '<div class="section-kicker" style="margin-bottom:6px">أقرب مسجد</div>'
        : "";

      return `<article class="card-premium" style="margin-bottom:10px">
        ${primary}
        <h3>🕌 ${escapeHtml(displayName(m))}</h3>
        <div>${escapeHtml(m.commune || "بلدية غير محددة")} — ولاية ${escapeHtml(m.wilaya_code || "—")}</div>
        ${distance}
        ${direction}
        <button type="button" class="text-button mosque-open-map"
          data-lat="${Number(m.lat)}" data-lng="${Number(m.lng)}"
          data-name="${escapeHtml(displayName(m))}">عرض على الخريطة Offline</button>
      </article>`;
    }).join("");
  }

  function populateWilayas() {
    const select = $("mosques-wilaya");
    if (!select) return;
    const codes = [...new Set(
      state.mosques.map(m => String(m.wilaya_code || "")).filter(Boolean)
    )].sort((a, b) => Number(a) - Number(b));

    select.innerHTML = '<option value="">كل الولايات</option>' +
      codes.map(c => `<option value="${escapeHtml(c)}">ولاية ${escapeHtml(c)}</option>`).join("");
  }

  function applyFilters() {
    if (!state.loaded) return;

    const q = normalizeSearchValue($("mosques-search")?.value || "");
    const wilaya = $("mosques-wilaya")?.value || "";

    if (state.reference && !q && !wilaya) {
      const radius = getRadius();
      const nearest = nearestWithExpansion(state.reference, radius);
      state.filtered = nearest.result;
      render(state.filtered, true);
      const expansion = radius === 0
        ? ` — النطاق المستخدم: ${nearest.radius / 1000} كم`
        : ` — ضمن ${radius < 1000 ? radius + " م" : radius / 1000 + " كم"}`;
      status(`${state.filtered.length.toLocaleString("ar-DZ")} مساجد قريبة من ${referenceLabel(state.reference)}${expansion} — Offline`);
      return;
    }

    let list = state.mosques.filter(m => {
      if (wilaya && String(m.wilaya_code) !== wilaya) return false;
      return matchesText(m, q);
    });

    if (state.reference) {
      const radius = getRadius() || 10000;
      const box = bboxForRadius(state.reference, radius);
      list = list.filter(m => inBbox(m, box))
        .map(m => ({ ...m, _distance: distanceMeters(state.reference, m) }))
        .filter(m => m._distance <= radius)
        .sort((a, b) => a._distance - b._distance);
    }

    state.filtered = list;
    render(list, false);
    status(`${list.length.toLocaleString("ar-DZ")} نتيجة محلية — لا حاجة للإنترنت`);
  }

  async function ensureLoaded() {
    if (state.loaded) return state.mosques;
    if (state.loading) return state.loading;

    state.loading = fetch(DATA_URL, { cache: "force-cache" })
      .then(response => {
        if (!response.ok) throw new Error("mosquees-data.json HTTP " + response.status);
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data) || !data.length) throw new Error("empty-dataset");
        if (data.length < EXPECTED_COUNT) {
          throw new Error("dataset incomplete: " + data.length + "/" + EXPECTED_COUNT);
        }
        state.mosques = data.filter(m => validCoordinate(Number(m.lat), Number(m.lng)));
        state.loaded = true;
        populateWilayas();
        buildRadiusOptions();
        status(`${state.mosques.length.toLocaleString("ar-DZ")} مسجد محلي جاهز — Offline`);
        applyFilters();
        return state.mosques;
      })
      .catch(error => {
        console.error("Mosques dataset unavailable", error);
        state.loaded = false;
        status("بيانات المساجد المحلية غير متاحة في هذه النسخة.");
        render([]);
        throw error;
      })
      .finally(() => {
        state.loading = null;
      });

    return state.loading;
  }

  async function nearest() {
    try {
      await ensureLoaded();

      if (window.LocationManager?.requestGPS) {
        status("جارٍ تحديد موقعك عبر GPS...");
        const location = await LocationManager.requestGPS();
        setReference(location);
      } else if (navigator.geolocation) {
        status("جارٍ تحديد موقعك عبر GPS...");
        const position = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true, timeout: 15000, maximumAge: 300000
          })
        );
        setReference({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: "gps",
          name: "موقع GPS الحالي"
        });
      } else {
        throw new Error("GPS_NOT_SUPPORTED");
      }

      state.gps = state.reference;
      const radius = getRadius();
      const nearestResult = nearestWithExpansion(state.reference, radius);
      state.filtered = nearestResult.result;
      render(state.filtered, true);

      if (!state.filtered.length) {
        status("لم نجد مسجدًا في نطاق 10 كم من موقعك.");
      } else {
        status(`أقرب مسجد: ${formatDistance(state.filtered[0]._distance)} — ${referenceLabel(state.reference)} — Offline`);
      }
    } catch (error) {
      console.error("Nearest mosque lookup failed", error);
      status("تعذر تحديد موقعك. فعّل الموقع وامنح التطبيق إذن الوصول للموقع، أو اختر ولاية يدويًا.");
    }
  }

  function useSelectedWilaya() {
    const code = $("mosques-wilaya")?.value || "";
    if (!code || !window.Locations) {
      status("اختر ولاية أولًا.");
      return;
    }
    const wilaya = Locations.getByCode(code);
    if (!wilaya) return;
    setReference({
      lat: Number(wilaya.lat), lng: Number(wilaya.lng),
      source: "manual", code: wilaya.code, name: wilaya.name
    });
    state.gps = null;
    applyFilters();
    status(`تم اختيار ${wilaya.name} كموقع بحث يدوي — Offline`);
  }

  function showMosqueOnMap(lat, lng, name) {
    if (!validCoordinate(lat, lng)) return;
    if (window.HoudAndroid && typeof window.HoudAndroid.openMosqueMapAt === "function") {
      window.HoudAndroid.openMosqueMapAt(lat, lng, name || "المسجد");
      return;
    }
    status("خريطة Android Offline متاحة داخل نسخة APK.");
  }

  function initialize() {
    const search = $("mosques-search");
    const wilaya = $("mosques-wilaya");
    const radius = $("mosques-radius");
    const nearestButton = $("mosques-nearest");
    const manualButton = $("mosques-manual");
    const mapButton = $("mosques-map");
    const results = $("mosques-results");

    if (search && !search.dataset.bound) {
      search.dataset.bound = "true";
      search.addEventListener("input", applyFilters);
    }
    if (wilaya && !wilaya.dataset.bound) {
      wilaya.dataset.bound = "true";
      wilaya.addEventListener("change", applyFilters);
    }
    if (radius && !radius.dataset.bound) {
      radius.dataset.bound = "true";
      radius.addEventListener("change", () => {
        state.radius = getRadius();
        applyFilters();
      });
    }
    if (nearestButton && !nearestButton.dataset.bound) {
      nearestButton.dataset.bound = "true";
      nearestButton.addEventListener("click", nearest);
    }
    if (manualButton && !manualButton.dataset.bound) {
      manualButton.dataset.bound = "true";
      manualButton.addEventListener("click", useSelectedWilaya);
    }
    if (mapButton && !mapButton.dataset.bound) {
      mapButton.dataset.bound = "true";
      mapButton.addEventListener("click", () => {
        if (window.HoudAndroid && typeof window.HoudAndroid.openMosqueMap === "function") {
          window.HoudAndroid.openMosqueMap();
        } else {
          status("خريطة Android Offline متاحة داخل نسخة APK.");
        }
      });
    }
    if (results && !results.dataset.bound) {
      results.dataset.bound = "true";
      results.addEventListener("click", event => {
        const button = event.target.closest(".mosque-open-map");
        if (!button) return;
        showMosqueOnMap(
          Number(button.dataset.lat),
          Number(button.dataset.lng),
          button.dataset.name
        );
      });
    }

    buildRadiusOptions();
    ensureLoaded().catch(() => {});
  }

  window.RafeeqPages = window.RafeeqPages || {};
  window.RafeeqPages.mosques = initialize;
  window.RafeeqPages["mosques:destroy"] = function () {};
})();
