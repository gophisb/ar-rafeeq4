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
      text.textContent = data.text || "";
      source.textContent = "المصدر المرجعي: " + book.source;
      status.hidden = true;
      body.hidden = false;
    })
    .catch(() => {
      status.innerHTML =
        "<p><strong>النص المحلي الكامل لم يُدرج بعد.</strong></p>" +
        "<p class=\"muted\">تم تجهيز القارئ والمسار دون تغيير محتوى التطبيق الحالي. " +
        "لن نضع نصًا كاملًا قبل اكتمال التحقق من النسخة وحقوق إعادة التوزيع.</p>";
    });
})();