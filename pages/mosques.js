"use strict";

(function () {
  const state = { mosques: [], filtered: [], loaded: false, gps: null };

  const $ = (id) => document.getElementById(id);
  const status = (value) => { const el = $("mosques-status"); if (el) el.textContent = value; };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[ch]));
  }

  function distanceMeters(a, b) {
    const R = 6371000;
    const p1 = Number(a.lat) * Math.PI / 180;
    const p2 = Number(b.lat) * Math.PI / 180;
    const dp = (Number(b.lat) - Number(a.lat)) * Math.PI / 180;
    const dl = (Number(b.lng) - Number(a.lng)) * Math.PI / 180;
    const h = Math.sin(dp/2)**2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2)**2;
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
  }

  function displayName(m) {
    return m.name_ar || m.name || m.name_fr || "مسجد بدون اسم";
  }

  function render(list) {
    const root = $("mosques-results");
    if (!root) return;
    if (!list.length) {
      root.innerHTML = '<div class="card-premium">لا توجد نتائج مطابقة.</div>';
      return;
    }
    root.innerHTML = list.slice(0, 50).map(m => {
      const d = Number.isFinite(m._distance) ? `<div>المسافة: ${(m._distance/1000).toFixed(2)} كم</div>` : "";
      return `<article class="card-premium" style="margin-bottom:10px">
        <h3>${escapeHtml(displayName(m))}</h3>
        <div>${escapeHtml(m.commune || "بلدية غير محددة")} — ولاية ${escapeHtml(m.wilaya_code || "—")}</div>
        <button type="button" class="text-button mosque-open-map" data-lat="${Number(m.lat)}" data-lng="${Number(m.lng)}">عرض الموقع</button>
        ${d}
      </article>`;
    }).join("");
  }

  function populateWilayas() {
    const select = $("mosques-wilaya");
    if (!select) return;
    const codes = [...new Set(state.mosques.map(m => String(m.wilaya_code || "")).filter(Boolean))].sort((a,b) => Number(a)-Number(b));
    select.innerHTML = '<option value="">كل الولايات</option>' +
      codes.map(c => `<option value="${escapeHtml(c)}">ولاية ${escapeHtml(c)}</option>`).join("");
  }

  function applyFilters() {
    const q = ($("mosques-search")?.value || "").trim().toLowerCase();
    const w = $("mosques-wilaya")?.value || "";
    let list = state.mosques.filter(m => {
      if (w && String(m.wilaya_code) !== w) return false;
      if (!q) return true;
      return [m.name_ar, m.name, m.name_fr, m.commune].some(v => String(v || "").toLowerCase().includes(q));
    });
    if (state.gps) list = list.map(m => ({...m, _distance: distanceMeters(state.gps, m)})).sort((a,b) => a._distance - b._distance);
    state.filtered = list;
    render(list);
    status(`${list.length.toLocaleString("ar-DZ")} نتيجة محلية — لا حاجة للإنترنت`);
  }

  function nearest() {
    if (!navigator.geolocation) {
      status("GPS غير متاح في هذه البيئة.");
      return;
    }
    status("جارٍ تحديد موقعك...");
    navigator.geolocation.getCurrentPosition(
      pos => {
        state.gps = {lat: pos.coords.latitude, lng: pos.coords.longitude};
        applyFilters();
      },
      () => status("تعذر الحصول على موقع GPS. فعّل الموقع وامنح الإذن للتطبيق."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  }

  async function load() {
    try {
      const response = await fetch("./mosquees-data.json", { cache: "force-cache" });
      if (!response.ok) throw new Error("mosquees-data.json");
      const data = await response.json();
      if (!Array.isArray(data) || !data.length) throw new Error("empty-dataset");
      state.mosques = data;
      state.loaded = true;
      populateWilayas();
      applyFilters();
    } catch (error) {
      console.error("Mosques dataset unavailable", error);
      status("بيانات المساجد المحلية لم تُضمّن في هذه النسخة بعد.");
      render([]);
    }
  }

  function showMosqueOnMap(m) {
    const lat = Number(m.lat), lng = Number(m.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const url = "geo:" + lat + "," + lng + "?q=" + lat + "," + lng + "(" + encodeURIComponent(displayName(m)) + ")";
    window.location.href = url;
  }

  function initialize() {
    $("mosques-search")?.addEventListener("input", applyFilters);
    $("mosques-wilaya")?.addEventListener("change", applyFilters);
    $("mosques-nearest")?.addEventListener("click", nearest);
    $("mosques-map")?.addEventListener("click", () => {
      if (window.HoudAndroid && typeof window.HoudAndroid.openMosqueMap === "function") {
        window.HoudAndroid.openMosqueMap();
      } else {
        status("خريطة Android متاحة داخل نسخة APK فقط.");
      }
    });
    $("mosques-results")?.addEventListener("click", (event) => {
      const button = event.target.closest(".mosque-open-map");
      if (!button) return;
      const card = button.closest("article");
      const index = [...$("mosques-results").children].indexOf(card);
      const mosque = state.filtered[index];
      if (mosque) showMosqueOnMap(mosque);
    });
    load();
  }

  window.RafeeqPages = window.RafeeqPages || {};
  window.RafeeqPages.mosques = initialize;
  window.RafeeqPages["mosques:destroy"] = function () {};
})();
