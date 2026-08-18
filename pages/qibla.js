(function () {
  'use strict';
  const KAABA = { latitude: 21.4225, longitude: 39.8262 };
  const select = document.getElementById('qiblaWilaya');
  const status = document.getElementById('qiblaStatus');
  const degrees = document.getElementById('qiblaDegrees');
  const direction = document.getElementById('qiblaDirection');
  const arrow = document.getElementById('qiblaArrow');
  let location = null;
  function bearing(from, to) { const r=Math.PI/180, p1=from.latitude*r, p2=to.latitude*r, d=(to.longitude-from.longitude)*r; const y=Math.sin(d)*Math.cos(p2); const x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(d); return (Math.atan2(y,x)/r+360)%360; }
  function render() { if(!location) return; const b=bearing(location,KAABA); degrees.textContent=`${b.toFixed(1)}°`; direction.textContent=`اتجه نحو القبلة من ${location.name || 'موقعك'}`; arrow.style.transform=`rotate(${b}deg)`; }
  function setLocation(loc, source) { location=loc; status.textContent=source==='gps'?`تم استخدام GPS: ${loc.name || 'الموقع الحالي'}`:`الموقع اليدوي ثابت: ${loc.name}`; render(); }
  Locations.all().forEach(w=>{const o=document.createElement('option');o.value=w.code;o.textContent=`${w.code} — ${w.name}`;select.appendChild(o);});
  const saved=localStorage.getItem('rafeeq.qibla.wilaya.v1')||'16';select.value=saved;setLocation(Locations.toPrayerLocation(Locations.getByCode(saved)||Locations.getDefault()),'manual');
  document.getElementById('qiblaManual').addEventListener('click',()=>{const w=Locations.getByCode(select.value);if(!w)return;localStorage.setItem('rafeeq.qibla.wilaya.v1',w.code);setLocation(Locations.toPrayerLocation(w),'manual');});
  document.getElementById('qiblaGps').addEventListener('click',()=>{status.textContent='جاري طلب إذن GPS...';PrayerEngine.getGPSLocation({timeout:15000}).then(g=>setLocation(g,'gps')).catch(()=>{status.textContent='تعذر استخدام GPS؛ بقي الاختيار اليدوي محفوظًا.';});});
})();
