(() => {
  "use strict";
  const search = document.getElementById("islamicLibrarySearch");
  const list = document.getElementById("islamicLibraryList");

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[c]));
  }

  function render(items) {
    const q = (search.value || "").trim().toLowerCase();
    const filtered = items.filter(book =>
      !q || [book.title, book.author].join(" ").toLowerCase().includes(q)
    );

    list.innerHTML = filtered.map(book => `
      <article class="card">
        <div class="section-kicker">كتاب إسلامي</div>
        <h2>${esc(book.title)}</h2>
        <p class="muted">المؤلف: ${esc(book.author)}</p>
        <p>${esc(book.description)}</p>
        <div class="library-actions">
          <button type="button" class="text-button" disabled title="سيُفعّل بعد إدخال النص المحلي الموثق">
            القراءة دون إنترنت — قيد التجهيز
          </button>
          <a class="text-button" href="${esc(book.source)}" target="_blank" rel="noopener noreferrer">
            المصدر
          </a>
        </div>
      </article>`
    ).join("") || '<div class="card"><p>لا توجد نتائج.</p></div>';
  }

  list.addEventListener("click", event => {
    const button = event.target.closest("[data-library-book]");
    if (!button) return;
    localStorage.setItem("rafeeq.library.book", button.dataset.libraryBook);
    window.location.hash = "islamic-library-reader";
  });

  fetch("./pages/islamic-library-data.json")
    .then(r => { if (!r.ok) throw new Error("library-data"); return r.json(); })
    .then(data => {
      render(data);
      search.addEventListener("input", () => render(data));
    })
    .catch(() => {
      list.innerHTML = '<div class="card"><p>تعذر تحميل بيانات المكتبة المحلية.</p></div>';
    });
})();