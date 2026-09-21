/* =========================================================
   Ar-Rafeeq 4 — Minshawy Murattal Recitation
   Standalone audio controller; no framework/dependency required.
   Streaming source only; Quran text remains local.
========================================================= */
(function (root) {
  'use strict';

  const primaryBase = 'https://everyayah.com/data/Minshawy_Murattal_128kbps/';
  const fallbackBase = 'https://cdn.islamic.network/quran/audio/128/ar.minshawi/';
  const pad = (n, w) => String(n).padStart(w, '0');

  const audio = new Audio();
  audio.preload = 'metadata';

  const state = {
    playing: false,
    loading: false,
    surah: null,
    ayah: null,
    totalAyahs: 0,
    error: null,
    fallbackTried: false
  };

  let onAyahChange = null;
  let onSurahEnd = null;
  let getGlobalAyah = null;

  function primaryUrl(surah, ayah) {
    return primaryBase + pad(surah, 3) + pad(ayah, 3) + '.mp3';
  }

  function fallbackUrl(globalAyah) {
    return fallbackBase + String(globalAyah) + '.mp3';
  }

  function emit() {
    root.dispatchEvent(new CustomEvent('rafeeq:recitation', {
      detail: { ...state }
    }));
  }

  function setState(patch) {
    Object.assign(state, patch);
    emit();
  }

  function play(surah, ayah, totalAyahs, globalAyah) {
    const s = Number(surah);
    const a = Number(ayah);
    const total = Number(totalAyahs);

    if (!Number.isInteger(s) || s < 1 || s > 114 ||
        !Number.isInteger(a) || a < 1 ||
        !Number.isInteger(total) || a > total) {
      setState({ playing: false, loading: false, error: 'بيانات التلاوة غير صحيحة' });
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    state.fallbackTried = false;

    setState({
      playing: true,
      loading: true,
      surah: s,
      ayah: a,
      totalAyahs: total,
      error: null,
      fallbackTried: false
    });

    audio.src = primaryUrl(s, a);
    onAyahChange?.(a);

    const promise = audio.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch((error) => {
        if (error && error.name === 'AbortError') return;
        setState({
          playing: false,
          loading: false,
          error: navigator.onLine === false
            ? 'التلاوة تحتاج إلى الاتصال بالإنترنت في هذه النسخة.'
            : 'تعذّر تشغيل التلاوة — اضغط تشغيل مرة أخرى.'
        });
      });
    }
  }

  function stop() {
    audio.pause();
    audio.currentTime = 0;
    setState({ playing: false, loading: false, error: null, surah: null, ayah: null, totalAyahs: 0 });
  }

  function pause() {
    audio.pause();
    setState({ playing: false, loading: false });
  }

  function resume() {
    if (state.surah === null || state.ayah === null) return;
    const promise = audio.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => setState({ playing: false, loading: false, error: 'تعذّر استئناف التلاوة.' }));
    }
  }

  function toggle(surah, ayah, totalAyahs, globalAyah) {
    if (state.playing) return pause();
    if (state.surah === Number(surah) && state.ayah !== null) return resume();
    play(surah, ayah, totalAyahs, globalAyah);
  }

  audio.addEventListener('playing', () => setState({ playing: true, loading: false, error: null }));
  audio.addEventListener('waiting', () => setState({ loading: true }));
  audio.addEventListener('pause', () => {
    if (!audio.ended) setState({ playing: false, loading: false });
  });
  audio.addEventListener('error', () => {
    if (state.surah === null || state.ayah === null) return;

    if (!state.fallbackTried) {
      state.fallbackTried = true;
      const global = getGlobalAyah?.(state.surah, state.ayah);
      if (global) {
        audio.src = fallbackUrl(global);
        const promise = audio.play();
        if (promise && typeof promise.catch === 'function') promise.catch(() => {});
        return;
      }
    }

    setState({
      playing: false,
      loading: false,
      error: navigator.onLine === false
        ? 'التلاوة غير متاحة دون اتصال في هذه النسخة.'
        : 'تعذّر تحميل صوت هذه الآية.'
    });
  });

  audio.addEventListener('ended', () => {
    if (state.surah === null || state.ayah === null) return;

    if (state.ayah < state.totalAyahs) {
      play(state.surah, state.ayah + 1, state.totalAyahs);
      return;
    }

    const finishedSurah = state.surah;
    setState({ playing: false, loading: false });
    onSurahEnd?.(finishedSurah);
  });

  function configure(options = {}) {
    onAyahChange = typeof options.onAyahChange === 'function' ? options.onAyahChange : null;
    onSurahEnd = typeof options.onSurahEnd === 'function' ? options.onSurahEnd : null;
    getGlobalAyah = typeof options.getGlobalAyah === 'function' ? options.getGlobalAyah : null;
  }

  root.RafeeqRecitation = Object.freeze({
    play,
    stop,
    pause,
    resume,
    toggle,
    configure,
    state,
    primaryUrl,
    fallbackUrl
  });
})(window);
