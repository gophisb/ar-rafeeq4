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
      const paths = Array.isArray(book && book.localPaths) ? book.localPaths : (book && book.localPath ? [book.localPath] : []);
      if (!book || !paths.length) throw new Error("local-book-not-ready");
      return Promise.all(paths.map(path =>
        fetch("./" + path).then(r => { if (!r.ok) throw new Error("local-part"); return r.json(); })
      )).then(parts => ({ book, parts }));
    })
    .then(({ book, parts }) => {
      document.getElementById("islamicLibraryReaderTitle").textContent = book.title;
      const hadiths = parts.flatMap(part => Array.isArray(part.hadiths) ? part.hadiths : []);
      if (!hadiths.length) throw new Error("empty-local-book");
      let currentBook = "";
      text.innerHTML = hadiths.map(h => {
        const heading = h.book !== currentBook ? (currentBook = h.book,
          "<h2 class=\"library-reader-book\">" + escapeHtml(h.book) + "</h2>") : "";
        return heading +
          "<article class=\"library-reader-section\">" +
          "<h3>حديث رقم " + escapeHtml(h.idInBook) + "</h3>" +
          "<div class=\"library-reader-text\">" +
          escapeHtml(h.arabic || "").replace(/\\n/g, "<br>") +
          "</div></article>";
      }).join("");
      source.textContent = "المصدر: Hadith JSON (ISC)؛ البيانات موثقة في المستودع كمجمّعة من Sunnah.com. " +
        "مرجع العمل: ويكي مصدر.";
      status.hidden = true;
      body.hidden = false;
    })
    .catch(() => {
      status.hidden = false;
      body.hidden = true;
      status.innerHTML =
        "<p><strong>تعذر تحميل النص المحلي الكامل.</strong></p>" +
        "<p class=\"muted\">لم يتم عرض نص بديل غير موثّق.</p>";
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
