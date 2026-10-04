/* الرفيق 4 — مدير التلاوة المحلي والاتصال الاحتياطي */
(function (root) {
  'use strict';
  const CACHE_NAME = 'rafeeq4-quran-audio-v2';
  const primaryBase = 'https://everyayah.com/data/Minshawy_Murattal_128kbps/';
  const fallbackBase = 'https://cdn.islamic.network/quran/audio/128/ar.minshawi/';
  const pad = (n, w) => String(n).padStart(w, '0');
  const audio = new Audio();
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
  const state = { playing:false, loading:false, downloading:false, progress:0, surah:null, ayah:null, totalAyahs:0, error:null, fallbackTried:false };
  let onAyahChange = null, onSurahEnd = null, getGlobalAyah = null, objectUrl = null, generation = 0;
  const emit = () => root.dispatchEvent(new CustomEvent('rafeeq:recitation', { detail:{...state} }));
  const setState = patch => { Object.assign(state, patch); emit(); };
  const primaryUrl = (surah, ayah) => primaryBase + pad(surah,3) + pad(ayah,3) + '.mp3';
  const fallbackUrl = globalAyah => fallbackBase + String(globalAyah) + '.mp3';
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function cachedBlob(url) {
    if (!('caches' in root)) return null;
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(url);
    return response ? response.blob() : null;
  }
  async function fetchAndCache(url) {
    let lastError;
    for (let attempt=0; attempt<3; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(url, { mode:'cors', cache:'no-store', signal:controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (!blob.size || !String(blob.type || '').includes('audio')) throw new Error('invalid-audio');
        if ('caches' in root) await (await caches.open(CACHE_NAME)).put(url, new Response(blob, {headers:{'Content-Type':blob.type || 'audio/mpeg'}}));
        return blob;
      } catch (error) { lastError=error; if (attempt<2) await wait(700*(attempt+1)); }
      finally { clearTimeout(timer); }
    }
    throw lastError || new Error('audio-fetch-failed');
  }
  async function resolveBlob(surah, ayah, globalAyah) {
    const primary = primaryUrl(surah, ayah);
    const local = await cachedBlob(primary);
    if (local) return local;
    const fallback = fallbackUrl(globalAyah);
    const fallbackLocal = await cachedBlob(fallback);
    if (fallbackLocal) return fallbackLocal;
    if (navigator.onLine === false) throw new Error('offline-not-cached');
    try { return await fetchAndCache(primary); }
    catch (_) { if (!globalAyah) throw _; return fetchAndCache(fallback); }
  }
  async function play(surah, ayah, totalAyahs, globalAyah) {
    const s=Number(surah), a=Number(ayah), total=Number(totalAyahs), token=++generation;
    if (!Number.isInteger(s)||s<1||s>114||!Number.isInteger(a)||a<1||!Number.isInteger(total)||a>total) { setState({playing:false,loading:false,error:'بيانات التلاوة غير صحيحة'}); return; }
    audio.pause(); audio.currentTime=0; if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl=null;
    setState({playing:false,loading:true,surah:s,ayah:a,totalAyahs:total,error:null,fallbackTried:false}); onAyahChange?.(a);
    try {
      const blob=await resolveBlob(s,a,globalAyah ?? getGlobalAyah?.(s,a));
      if (token !== generation) return;
      objectUrl=URL.createObjectURL(blob); audio.src=objectUrl; await audio.play();
    } catch (error) {
      if (token !== generation) return;
      setState({playing:false,loading:false,error:error.message==='offline-not-cached'?'نزّل السورة أولاً لتعمل التلاوة دون إنترنت.':'تعذّر تحميل التلاوة؛ حاول مرة أخرى.'});
    }
  }
  function stop(){ generation += 1; audio.pause(); audio.currentTime=0; if(objectUrl)URL.revokeObjectURL(objectUrl); objectUrl=null; setState({playing:false,loading:false,surah:null,ayah:null,totalAyahs:0,error:null}); }
  function pause(){ audio.pause(); setState({playing:false,loading:false}); }
  function resume(){ if(state.surah===null||state.ayah===null)return; const p=audio.play(); if(p?.catch)p.catch(()=>setState({playing:false,error:'تعذّر استئناف التلاوة.'})); }
  function toggle(s,a,t,g){ if(state.playing) return pause(); if(state.surah===Number(s)&&state.ayah!==null)return resume(); return play(s,a,t,g); }
  async function downloadSurah(surah,totalAyahs,onProgress){
    const s=Number(surah), total=Number(totalAyahs); if(!Number.isInteger(s)||!Number.isInteger(total))throw new Error('invalid-surah');
    setState({downloading:true,progress:0,error:null});
    let done=0;
    try { for(let ayah=1;ayah<=total;ayah+=1){ const global=getGlobalAyah?.(s,ayah); await fetchAndCache(primaryUrl(s,ayah)).catch(()=>fetchAndCache(fallbackUrl(global))); done=ayah; setState({progress:Math.round(done*100/total)}); onProgress?.(done,total); } }
    finally { setState({downloading:false}); }
    return {downloaded:done,total};
  }
  audio.addEventListener('playing',()=>setState({playing:true,loading:false,error:null}));
  audio.addEventListener('waiting',()=>setState({loading:true}));
  audio.addEventListener('pause',()=>{if(!audio.ended&&!state.downloading)setState({playing:false,loading:false});});
  audio.addEventListener('ended',()=>{if(state.surah===null||state.ayah===null)return; if(state.ayah<state.totalAyahs)return play(state.surah,state.ayah+1,state.totalAyahs,getGlobalAyah?.(state.surah,state.ayah+1)); const done=state.surah; setState({playing:false,loading:false}); onSurahEnd?.(done);});
  function configure(options={}){ onAyahChange=typeof options.onAyahChange==='function'?options.onAyahChange:null; onSurahEnd=typeof options.onSurahEnd==='function'?options.onSurahEnd:null; getGlobalAyah=typeof options.getGlobalAyah==='function'?options.getGlobalAyah:null; }
  root.RafeeqRecitation=Object.freeze({play,stop,pause,resume,toggle,configure,downloadSurah,state,primaryUrl,fallbackUrl});
})(window);
