/* Ar-Rafeeq 4 — Minshawy Murattal with persistent offline cache */
(function (root) {
  'use strict';

  const androidApp = root.location && root.location.hostname === 'appassets.androidplatform.net';
  const primaryBase = 'https://cdn.islamic.network/quran/audio/128/ar.minshawi/';
  const fallbackBase = 'https://everyayah.com/data/Minshawy_Murattal_128kbps/';
  const cacheName = 'rafeeq-minshawy-v1';
  const pad = (n, w) => String(n).padStart(w, '0');

  const audio = new Audio();
  audio.preload = 'metadata';
  const state = { playing:false, loading:false, surah:null, ayah:null, totalAyahs:0, error:null, fallbackTried:false };
  let onAyahChange = null, onSurahEnd = null, getGlobalAyah = null, objectUrl = null;

  function remoteUrl(surah, ayah) {
    return primaryBase + pad(surah, 3) + pad(ayah, 3) + '.mp3';
  }
  function fallbackUrl(globalAyah) { return fallbackBase + String(globalAyah) + '.mp3'; }
  function emit() { root.dispatchEvent(new CustomEvent('rafeeq:recitation', { detail:{...state} })); }
  function setState(patch) { Object.assign(state, patch); emit(); }

  async function cachedUrl(url) {
    if (!('caches' in root)) return null;
    try {
      const cache = await caches.open(cacheName);
      const hit = await cache.match(url);
      if (!hit) return null;
      const blob = await hit.blob();
      if (!blob.size) return null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(blob);
      return objectUrl;
    } catch (_) { return null; }
  }

  async function cacheOne(url) {
    if (!('caches' in root)) throw new Error('التخزين المحلي غير متاح');
    const cache = await caches.open(cacheName);
    if (await cache.match(url)) return true;
    const response = await fetch(url, { mode:'cors', cache:'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    await cache.put(url, response.clone());
    return true;
  }

  async function downloadSurah(surah, totalAyahs, onProgress) {
    const s = Number(surah), total = Number(totalAyahs);
    if (!Number.isInteger(s) || s < 1 || s > 114 || !Number.isInteger(total) || total < 1) {
      throw new Error('بيانات السورة غير صحيحة');
    }
    for (let a = 1; a <= total; a += 1) {
      await cacheOne(remoteUrl(s, a));
      if (typeof onProgress === 'function') onProgress(a, total);
    }
    return true;
  }

  async function isSurahDownloaded(surah, totalAyahs) {
    if (!('caches' in root)) return false;
    try {
      const cache = await caches.open(cacheName);
      for (let a = 1; a <= Number(totalAyahs); a += 1) {
        if (!(await cache.match(remoteUrl(Number(surah), a)))) return false;
      }
      return true;
    } catch (_) { return false; }
  }

  function play(surah, ayah, totalAyahs, globalAyah) {
    const s=Number(surah), a=Number(ayah), total=Number(totalAyahs);
    if (!Number.isInteger(s)||s<1||s>114||!Number.isInteger(a)||a<1||!Number.isInteger(total)||a>total) {
      setState({playing:false,loading:false,error:'بيانات التلاوة غير صحيحة'}); return;
    }
    audio.pause(); audio.currentTime=0; state.fallbackTried=false;
    setState({playing:true,loading:true,surah:s,ayah:a,totalAyahs:total,error:null,fallbackTried:false});
    onAyahChange?.(a);

    (async()=>{
      let src = null;
      if (androidApp || navigator.onLine === false) src = await cachedUrl(remoteUrl(s,a));
      if (!src) src = remoteUrl(s,a);
      audio.src = src;
      await audio.play();
    })().catch((error)=>{
      if (error && error.name === 'AbortError') return;
      if (!state.fallbackTried && navigator.onLine !== false) {
        state.fallbackTried = true;
        const global = getGlobalAyah?.(s,a);
        if (global) { audio.src=fallbackUrl(global); audio.play().catch(()=>{}); return; }
      }
      setState({playing:false,loading:false,error:navigator.onLine===false
        ? 'هذه الآية غير محفوظة على الجهاز. نزّل السورة أولًا أثناء الاتصال بالإنترنت.'
        : 'تعذّر تشغيل التلاوة — اضغط تشغيل مرة أخرى.'});
    });
  }

  function stop() {
    audio.pause(); audio.currentTime=0;
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl=null; }
    setState({playing:false,loading:false,error:null,surah:null,ayah:null,totalAyahs:0});
  }
  function pause() { audio.pause(); setState({playing:false,loading:false}); }
  function resume() {
    if (state.surah===null || state.ayah===null) return;
    audio.play().catch(()=>setState({playing:false,loading:false,error:'تعذّر استئناف التلاوة.'}));
  }
  function toggle(surah,ayah,totalAyahs,globalAyah) {
    if (state.playing) return pause();
    if (state.surah===Number(surah)&&state.ayah!==null) return resume();
    play(surah,ayah,totalAyahs,globalAyah);
  }

  audio.addEventListener('playing',()=>setState({playing:true,loading:false,error:null}));
  audio.addEventListener('waiting',()=>setState({loading:true}));
  audio.addEventListener('pause',()=>{if(!audio.ended)setState({playing:false,loading:false});});
  audio.addEventListener('error',()=>{
    if (state.surah===null||state.ayah===null||state.fallbackTried) return;
    state.fallbackTried=true;
    const global=getGlobalAyah?.(state.surah,state.ayah);
    if(global&&navigator.onLine!==false){audio.src=fallbackUrl(global);audio.play().catch(()=>{});}
  });
  audio.addEventListener('ended',()=>{
    if(state.surah===null||state.ayah===null)return;
    if(state.ayah<state.totalAyahs){play(state.surah,state.ayah+1,state.totalAyahs);return;}
    const finishedSurah=state.surah; setState({playing:false,loading:false}); onSurahEnd?.(finishedSurah);
  });

  function configure(options={}) {
    onAyahChange=typeof options.onAyahChange==='function'?options.onAyahChange:null;
    onSurahEnd=typeof options.onSurahEnd==='function'?options.onSurahEnd:null;
    getGlobalAyah=typeof options.getGlobalAyah==='function'?options.getGlobalAyah:null;
  }

  root.RafeeqRecitation=Object.freeze({
    play,stop,pause,resume,toggle,configure,downloadSurah,isSurahDownloaded,
    state,primaryUrl:remoteUrl,fallbackUrl
  });
})(window);
