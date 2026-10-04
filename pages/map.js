(() => {
  'use strict';
  const ALGERIA = { center:[28.0339, 1.6596], zoom:5, bounds:[[18.9,-8.7],[37.1,12.1]] };
  const CACHE_KEY = 'rafeeq.algeria.mosques.v1';
  const map = L.map('algeriaMap', { zoomControl:true, minZoom:4, maxZoom:19 }).setView(ALGERIA.center, ALGERIA.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'© OpenStreetMap contributors' }).addTo(map);
  const status = document.getElementById('mapStatus');
  const results = document.getElementById('mosqueResults');
  let userMarker = null;
  let mosqueLayer = L.layerGroup().addTo(map);
  let mosques = [];
  const setStatus = text => { status.textContent = text; };
  const distanceKm = (a,b) => { const r=6371, dLat=(b.lat-a.lat)*Math.PI/180, dLon=(b.lon-a.lon)*Math.PI/180; const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2; return 2*r*Math.asin(Math.sqrt(x)); };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function drawMosques() {
    mosqueLayer.clearLayers();
    mosques.forEach(m => L.marker([m.lat,m.lon]).bindPopup(`<strong>${esc(m.name)}</strong><br>${m.distance ? `${m.distance.toFixed(2)} كم` : 'مسجد من بيانات OSM'}`).addTo(mosqueLayer));
  }
  function renderResults(origin) {
    const sorted = mosques.map(m => ({...m, distance: origin ? distanceKm(origin,m) : null})).sort((a,b) => (a.distance ?? 0)-(b.distance ?? 0)).slice(0,20);
    results.innerHTML = sorted.length ? sorted.map((m,i) => `<button class="map-result" data-lat="${m.lat}" data-lon="${m.lon}" type="button"><strong>${i+1}. ${esc(m.name)}</strong><span>${m.distance != null ? `${m.distance.toFixed(2)} كم` : 'بيانات محلية محفوظة'}</span></button>`).join('') : '<p class="muted">لم تُعثر على مساجد في البيانات المتاحة.</p>';
    results.querySelectorAll('[data-lat]').forEach(btn => btn.addEventListener('click', () => { map.setView([Number(btn.dataset.lat),Number(btn.dataset.lon)],16); }));
  }
  function save() { try { localStorage.setItem(CACHE_KEY, JSON.stringify(mosques)); } catch (_) {} }
  function loadCache() { try { const data=JSON.parse(localStorage.getItem(CACHE_KEY)||'[]'); if(Array.isArray(data)) { mosques=data; drawMosques(); renderResults(); } } catch (_) {} }
  async function findNearby(lat,lon) {
    const query=`[out:json][timeout:20];(node[amenity=place_of_worship](around:15000,${lat},${lon});way[amenity=place_of_worship](around:15000,${lat},${lon}););out center tags;`;
    const response=await fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query), { headers:{Accept:'application/json'} });
    if(!response.ok) throw new Error(`overpass-${response.status}`);
    const json=await response.json();
    return (json.elements||[]).map(e => ({ lat:e.lat ?? e.center?.lat, lon:e.lon ?? e.center?.lon, name:e.tags?.name || e.tags?.['name:ar'] || 'مسجد — اسم غير متوفر' })).filter(m => Number.isFinite(m.lat)&&Number.isFinite(m.lon));
  }
  function locate() {
    if (!navigator.geolocation) { setStatus('تحديد الموقع غير متاح على هذا الجهاز.'); return; }
    setStatus('جارٍ تحديد موقعك…');
    navigator.geolocation.getCurrentPosition(async pos => {
      const origin={lat:pos.coords.latitude,lon:pos.coords.longitude};
      if (userMarker) userMarker.remove();
      userMarker=L.marker([origin.lat,origin.lon]).addTo(map).bindPopup('موقعك الحالي').openPopup();
      map.setView([origin.lat,origin.lon],14);
      try { mosques=await findNearby(origin.lat,origin.lon); save(); setStatus(`تم العثور على ${mosques.length} موقعاً من بيانات OpenStreetMap.`); }
      catch (_) { setStatus('لا يوجد اتصال؛ أعرض آخر بيانات محفوظة محلياً.'); }
      drawMosques(); renderResults(origin);
    }, () => setStatus('تعذر تحديد الموقع. فعّل GPS ومنح الإذن للتطبيق.'), { enableHighAccuracy:true, timeout:15000, maximumAge:300000 });
  }
  document.getElementById('mapLocate').addEventListener('click', locate);
  document.getElementById('mapNearest').addEventListener('click', locate);
  document.getElementById('mapReset').addEventListener('click', () => { map.fitBounds(ALGERIA.bounds); setStatus('تم عرض الجزائر كاملة.'); });
  loadCache();
  map.fitBounds(ALGERIA.bounds);
})();
