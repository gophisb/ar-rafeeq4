/* =========================================================
   Ar-Rafeeq 4 — Minshawy Murattal Recitation
   Standalone audio controller; no framework/dependency required.
   Streaming source only; Quran text remains local.
========================================================= */
(function (root) {
  'use strict';

  const androidOffline = root.location && root.location.protocol === 'file:';
  const localBase = '../assets/audio/minshawy/';
  const primaryBase = 'https://everyayah.com/data/Minshawy_Murattal_128kbps/';
  const fallbackBase = 'https://cdn.islamic.network/quran/audio/128/ar.minshawi/';
  const pad = (n, w) => String(n).padStart(w, '0');

  const audio = new Audio();
  audio.preload = 'metadata';

  // Local offline cache: IndexedDB is used deliberately here because this
  // Android build does not currently ship the Capacitor Filesystem plugin.
  // No audio bytes are committed to GitHub.
  const DB_NAME = 'rafeeq-quran-audio-v1';
  const STORE = 'tracks';
  let dbPromise = null;
  let objectUrl = null;
  let downloadCancelled = false;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('تعذر فتح التخزين المحلي'));
    });
    return dbPromise;
  }

  function trackKey(surah, ayah) {
    return String(surah).padStart(3, '0') + String(ayah).padStart(3, '0');
  }

  async function getLocalBlob(surah, ayah) {
    try {
      const db = await openDb();
      return await new Promise((resolve, reject) => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(trackKey(surah, ayah));
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (_) {
      return null;
    }
  }

  async function putLocalBlob(surah, ayah, blob) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(blob, trackKey(surah, ayah));
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });
  }

  async function localTrackCount() {
    try {
      const db = await openDb();
      return await new Promise((resolve, reject) => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => reject(req.error);
      });
    } catch (_) {
      return 0;
    }
  }

  async function playLocalOrRemote(surah, ayah, totalAyahs, globalAyah) {
    const localBlob = await getLocalBlob(surah, ayah);
    if (localBlob) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(localBlob);
      audio.src = objectUrl;
      const promise = audio.play();
      return promise && typeof promise.then === 'function' ? promise.then(() => true) : true;
    }

    audio.src = primaryUrl(surah, ayah);
    const promise = audio.play();
    return promise && typeof promise.then === 'function' ? promise.then(() => false) : false;
  }

  async function downloadTrack(surah, ayah) {
    const existing = await getLocalBlob(surah, ayah);
    if (existing) return { downloaded: false, cached: true };

    const url = primaryBase + pad(surah, 3) + pad(ayah, 3) + '.mp3';
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const blob = await response.blob();
    if (!blob.size) throw new Error('ملف صوتي فارغ');
    await putLocalBlob(surah, ayah, blob);
    return { downloaded: true, cached: false, bytes: blob.size };
  }

  async function downloadSurah(surah, totalAyahs, onProgress) {
    const s = Number(surah);
    const total = Number(totalAyahs);
    if (!Number.isInteger(s) || s < 1 || s > 114 || !Number.isInteger(total) || total < 1) {
      throw new Error('بيانات السورة غير صحيحة');
    }
    downloadCancelled = false;
    for (let ayah = 1; ayah <= total; ayah += 1) {
      if (downloadCancelled) throw new Error('DOWNLOAD_CANCELLED');
      await downloadTrack(s, ayah);
      onProgress?.(ayah, total);
    }
    return { surah: s, ayahs: total };
  }

  async function downloadQuran(surahList, onProgress) {
    downloadCancelled = false;
    let done = 0;
    const total = surahList.reduce((sum, s) => sum + Number(s.ayahs || 0), 0);
    for (const s of surahList) {
      for (let ayah = 1; ayah <= Number(s.ayahs); ayah += 1) {
        if (downloadCancelled) throw new Error('DOWNLOAD_CANCELLED');
        await downloadTrack(s.n, ayah);
        done += 1;
        onProgress?.(done, total, s.n, ayah);
      }
    }
    return { ayahs: total };
  }

  function cancelDownload() {
    downloadCancelled = true;
  }

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
    const file = pad(surah, 3) + pad(ayah, 3) + '.mp3';
    return androidOffline ? localBase + file : primaryBase + file;
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

    onAyahChange?.(a);

    const promise = playLocalOrRemote(s, a, total, globalAyah);
    if (promise && typeof promise.catch === 'function') {
      promise.catch((error) => {
        if (error && error.name === 'AbortError') return;
        setState({
          playing: false,
          loading: false,
          error: navigator.onLine === false
            ? 'التلاوة غير متاحة دون اتصال لهذه الآية؛ نزّل السورة أولًا.'
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
    fallbackUrl,
    downloadTrack,
    downloadSurah,
    downloadQuran,
    cancelDownload,
    localTrackCount
  });
})(window);
