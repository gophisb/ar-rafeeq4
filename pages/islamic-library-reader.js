(() => {
  "use strict";

  const status = document.getElementById("islamicLibraryReaderStatus");
  const body = document.getElementById("islamicLibraryReaderBody");
  const text = document.getElementById("islamicLibraryReaderText");
  const source = document.getElementById("islamicLibraryReaderSource");

  const bookId = localStorage.getItem("rafeeq.library.book") || "riyad-al-salihin";

  fetch("./pages/islamic-library-local-manifest.json")
    .then(r => { if (!r.ok) throw new Error("local-manifest"); return r.json(); })
    .then(manifest => {
      const book = manifest.books.find(item => item.id === bookId);
      if (!book || !book.localPath) throw new Error("local-book-not-ready");

      return fetch("./" + book.localPath)
        .then(r => { if (!r.ok) throw new Error("local-book"); return r.json(); })
        .then(data => ({ book, data }));
    })
    .then(({ book, data }) => {
      document.getElementById("islamicLibraryReaderTitle").textContent = book.title;
      const sections = Array.isArray(data.sections) ? data.sections : [];
      text.innerHTML = sections.map(section =>
        "<article class=\"library-reader-section\">" +
        "<h2>" + escapeHtml(section.number + " — " + section.title) + "</h2>" +
        "<div class=\"library-reader-text\">" +
        escapeHtml(section.text || "").replace(/\\n/g, "<br>") +
        "</div></article>"
      ).join("");
      source.textContent = "المصدر المرجعي: " + book.source;
      status.hidden = sections.length > 0;
      body.hidden = sections.length === 0;
      if (!sections.length) throw new Error("empty-local-book");
    })
    .catch(() => {
      status.hidden = false;
      body.hidden = true;
      status.innerHTML =
        "<p><strong>النص المحلي لهذا الجزء غير متاح.</strong></p>" +
        "<p class=\"muted\">القارئ يعمل محليًا، ولن نعرض نصًا غير موثّق أو مُختلق.</p>";
    });

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
