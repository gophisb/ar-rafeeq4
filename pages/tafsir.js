(function () {
  'use strict';
  const surahSelect = document.getElementById('tafsirSurah');
  const search = document.getElementById('tafsirSearch');
  const list = document.getElementById('tafsirList');
  const status = document.getElementById('tafsirStatus');
  let quran = [];
  let tafsir = [];
  let bySurah = {};
  function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  function render() {
    const n = Number(surahSelect.value || 1);
    const q = search.value.trim().toLocaleLowerCase('ar');
    const qData = quran.find(s => s.i === n);
    const tData = bySurah[n] || {};
    const items = (qData?.a || []).filter(a => !q || String(a.n) === q || a.t.toLocaleLowerCase('ar').includes(q) || String(tData[a.n] || '').toLocaleLowerCase('ar').includes(q));
    status.textContent = `${items.length} آية معروضة — البيانات محلية`;
    list.innerHTML = items.map(a => `<article class="card ayah-tafsir-card"><div class="ayah-arabic">${escapeHtml(a.t)} <span class="badge">${a.n}</span></div>${tData[a.n] ? `<div class="tafsir-text open"><strong>تفسير السعدي</strong><p>${escapeHtml(tData[a.n])}</p></div>` : '<p class="muted">لا يوجد نص مستقل موثق لهذه الآية في ملف السعدي المحلي.</p>'}</article>`).join('') || '<div class="card"><p>لا توجد نتائج مطابقة.</p></div>';
  }
  Promise.all([fetch('./pages/quran-local.json').then(r => r.json()), fetch('./pages/tafsir-saadi-local.json').then(r => r.json())]).then(([q, t]) => {
    quran = q; tafsir = t;
    quran.forEach(s => { const option = document.createElement('option'); option.value = s.i; option.textContent = `${s.i}. ${s.name || `السورة ${s.i}`}`; surahSelect.appendChild(option); });
    tafsir.forEach(s => { bySurah[s.i] = {}; s.a.forEach(a => { bySurah[s.i][a.n] = a.t; }); });
    render();
  }).catch(() => { status.textContent = 'تعذر تحميل بيانات القرآن أو تفسير السعدي المحلية.'; });
  surahSelect.addEventListener('change', render); search.addEventListener('input', render);
})();
