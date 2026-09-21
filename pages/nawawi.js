(function () {
  'use strict';
  const list = document.getElementById('nawawiList');
  const search = document.getElementById('nawawiSearch');
  const status = document.getElementById('nawawiStatus');
  let data = [];
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }
  function render() {
    const q = search.value.trim().toLocaleLowerCase('ar');
    const items = data.filter(item => !q || String(item.id) === q || `${item.text} ${item.explanation}`.toLocaleLowerCase('ar').includes(q));
    status.textContent = `${items.length} حديثًا من أصل ${data.length} — محفوظة محليًا`;
    list.innerHTML = items.map(item => `<article class="card hadith-card">
      <div class="card-heading"><span class="badge">${item.id}</span><h2>${escapeHtml(item.title)}</h2></div>
      <p class="arabic-text">${escapeHtml(item.text).replace(/\n/g, '<br>')}</p>
      <details><summary>عرض الشرح والفوائد</summary><p class="explanation">${escapeHtml(item.explanation).replace(/\n/g, '<br>')}</p></details>
      <details><summary>المصدر</summary><p>${escapeHtml(item.source)}</p></details>
    </article>`).join('') || '<div class="card"><p>لا توجد نتائج مطابقة.</p></div>';
  }
  search.addEventListener('input', render);
  fetch('./pages/nawawi-data.json').then(r => { if (!r.ok) throw new Error('nawawi-data'); return r.json(); }).then(items => { data = items; render(); }).catch(() => { status.textContent = 'تعذر تحميل بيانات الأربعين النووية المحلية.'; });
})();
