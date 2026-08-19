(function () {
  'use strict';
  const list = document.getElementById('azkarList');
  const status = document.getElementById('azkarStatus');
  const search = document.getElementById('azkarSearch');
  let data = [];
  let filter = 'all';
  const progressKey = 'rafeeq.azkar.progress.v1';
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }
  function visibleItems() {
    const q = search.value.trim().toLocaleLowerCase('ar');
    return data.filter(item => {
      const type = String(item.type || '').toLowerCase();
      const matchesFilter = filter === 'all' || (filter === 'morning' && /صباح/.test(type)) || (filter === 'evening' && /مساء/.test(type));
      const matchesSearch = !q || `${item.text} ${item.source} ${item.benefit}`.toLocaleLowerCase('ar').includes(q);
      return matchesFilter && matchesSearch;
    });
  }
  function save() { localStorage.setItem(progressKey, JSON.stringify(progress)); }
  function render() {
    const items = visibleItems();
    status.textContent = `${items.length} ذكرًا متاحًا — النصوص محفوظة محليًا`;
    list.innerHTML = items.map(item => {
      const done = Math.min(Number(progress[item.id] || 0), item.count);
      const remaining = item.count - done;
      return `<article class="card dhikr-card" data-id="${item.id}">
        <div class="card-heading"><span class="badge">${item.id}</span><h2>${escapeHtml(item.title)}</h2></div>
        <p class="arabic-text">${escapeHtml(item.text)}</p>
        <div class="dhikr-meta"><span>المطلوب: ${item.count} — ${escapeHtml(item.countDescription)}</span><span class="dhikr-progress">المتبقي: ${remaining}</span></div>
        <div class="dhikr-actions"><button class="btn primary dhikr-count" type="button">تسبيح / عدّ</button><button class="btn dhikr-reset" type="button">إعادة</button></div>
        ${item.benefit ? `<details><summary>الفضل أو الفائدة</summary><p>${escapeHtml(item.benefit)}</p></details>` : ''}
        ${item.source ? `<details><summary>المصدر</summary><p>${escapeHtml(item.source)}</p></details>` : ''}
      </article>`;
    }).join('') || '<div class="card"><p>لا توجد نتائج مطابقة.</p></div>';
  }
  list.addEventListener('click', event => {
    const card = event.target.closest('.dhikr-card');
    if (!card) return;
    const id = card.dataset.id;
    const item = data.find(x => String(x.id) === id);
    if (event.target.closest('.dhikr-count')) {
      progress[id] = (Number(progress[id] || 0) + 1) % (item.count + 1);
      save(); render();
    }
    if (event.target.closest('.dhikr-reset')) {
      delete progress[id]; save(); render();
    }
  });
  document.querySelectorAll('.azkar-filter').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.azkar-filter').forEach(x => x.classList.remove('active', 'primary'));
    button.classList.add('active', 'primary'); filter = button.dataset.filter; render();
  }));
  search.addEventListener('input', render);
  fetch('./pages/azkar-data.json').then(r => { if (!r.ok) throw new Error('azkar-data'); return r.json(); }).then(items => {
    data = items; render();
  }).catch(() => { status.textContent = 'تعذر تحميل بيانات الأذكار المحلية.'; list.innerHTML = ''; });
})();
