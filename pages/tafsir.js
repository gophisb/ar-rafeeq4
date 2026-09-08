(function () {
  'use strict';
  const surahSelect = document.getElementById('tafsirSurah');
  const search = document.getElementById('tafsirSearch');
  const status = document.getElementById('tafsirStatus');
  const list = document.getElementById('tafsirList');
  let quran = [];
  let tafsir = [];
  let current = 1;

  function esc(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  }
  function makeSurahOptions() {
    surahSelect.innerHTML = Array.from({ length: 114 }, (_, i) => `<option value="${i + 1}">السورة ${i + 1}</option>`).join('');
    surahSelect.value = String(current);
  }
  function render() {
    const qSurah = quran.find(s => Number(s.i) === current);
    const tSurah = tafsir.find(s => Number(s.i) === current);
    if (!qSurah || !tSurah) { list.innerHTML = ''; status.textContent = 'بيانات السورة غير متاحة محليًا.'; return; }
    const tByAyah = new Map((tSurah.a || []).map(a => [Number(a.n), a.t]));
    const term = search.value.trim().toLocaleLowerCase('ar');
    const rows = (qSurah.a || []).filter(a => !term || String(a.n) === term || String(a.t).toLocaleLowerCase('ar').includes(term) || String(tByAyah.get(Number(a.n)) || '').toLocaleLowerCase('ar').includes(term));
    list.innerHTML = rows.map(a => `<article class="card tafsir-ayah"><div class="muted">الآية ${a.n}</div><p class="quran-text">${esc(a.t)}</p><h3>تفسير السعدي</h3><p>${esc(tByAyah.get(Number(a.n)) || 'لا يتوفر نص مستقل لهذه الآية في البيانات المحلية.')}</p></article>`).join('');
    status.textContent = `${rows.length} آية معروضة — السورة ${current}`;
  }
  Promise.all([fetch('./pages/quran-local.json').then(r => { if (!r.ok) throw new Error('quran'); return r.json(); }), fetch('./pages/tafsir-saadi-local.json').then(r => { if (!r.ok) throw new Error('tafsir'); return r.json(); })]).then(([q, t]) => { quran = q; tafsir = t; makeSurahOptions(); render(); }).catch(() => { status.textContent = 'تعذّر تحميل بيانات القرآن أو تفسير السعدي المحلية.'; });
  surahSelect.addEventListener('change', () => { current = Number(surahSelect.value); search.value = ''; render(); });
  search.addEventListener('input', render);
})();
