/*!
 * qibla.js — بوصلة القبلة (وحدة مستقلة، بلا مكتبات خارجية، تعمل دون إنترنت)
 * مدمجة في الرفيق 4 عبر js/qibla-compass.js
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QiblaCompass = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg', CX = 300, CY = 380;
  var KAABA = { lat: 21.422487, lon: 39.826206 };
  var FONT = 'Cinzel,"Times New Roman",serif';
  var rad = function (d) { return d * Math.PI / 180; };
  var deg = function (r) { return r * 180 / Math.PI; };
  var norm = function (a) { return ((a % 360) + 360) % 360; };
  var diff = function (a, b) { var d = norm(a - b); return d > 180 ? d - 360 : d; };
  var pol = function (r, a) { var t = rad(a); return [CX + r * Math.sin(t), CY - r * Math.cos(t)]; };
  var pts = function (arr) { return arr.map(function (p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' '); };
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function bearing(lat, lon) {
    var p1 = rad(lat), p2 = rad(KAABA.lat), dl = rad(KAABA.lon - lon);
    return norm(deg(Math.atan2(Math.sin(dl) * Math.cos(p2),
      Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl))));
  }
  function distKm(lat, lon) {
    var dp = rad(KAABA.lat - lat), dl = rad(KAABA.lon - lon);
    var a = Math.pow(Math.sin(dp / 2), 2) + Math.cos(rad(lat)) * Math.cos(rad(KAABA.lat)) * Math.pow(Math.sin(dl / 2), 2);
    return 2 * 6371 * Math.asin(Math.sqrt(a));
  }
  function horiz(tx, ty, bx, by) {
    return Math.hypot(bx, by) > Math.hypot(tx, ty) ? norm(deg(Math.atan2(bx, by))) : norm(deg(Math.atan2(tx, ty)));
  }
  function fromEuler(a, b, g) {
    a = rad(a); b = rad(b); g = rad(g);
    var cA = Math.cos(a), sA = Math.sin(a), cB = Math.cos(b), sB = Math.sin(b), cG = Math.cos(g), sG = Math.sin(g);
    return horiz(-sA * cB, cA * cB, -(cA * sG + sA * sB * cG), -(sA * sG - cA * sB * cG));
  }
  function fromQuat(q) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    return horiz(2 * (x * y - z * w), 1 - 2 * (x * x + z * z), -2 * (x * z + y * w), -2 * (y * z - x * w));
  }

  var CSS = [
    '.qc-root{width:100%;display:flex;flex-direction:column;align-items:center;gap:6px;direction:rtl;',
    'font-family:"Amiri","Noto Naskh Arabic","Traditional Arabic","Geeza Pro",serif;color:#e6d6b2}',
    '.qc-stage{width:100%;touch-action:none;user-select:none;-webkit-user-select:none}',
    '.qc-stage svg{display:block;width:100%;height:auto;max-height:68vh;margin:0 auto;filter:drop-shadow(0 18px 22px rgba(0,0,0,.48))}',
    '.qc-manual svg{cursor:grab}',
    '.qc-bezel{transition:filter .5s}',
    '.qc-aligned .qc-bezel{filter:drop-shadow(0 0 14px rgba(255,190,80,.6))}',
    '.qc-kaaba{opacity:0;transform:scale(.55);transform-origin:300px 380px;pointer-events:none;transition:opacity .55s ease,transform .7s cubic-bezier(.2,1.3,.4,1)}',
    '.qc-aligned .qc-kaaba{opacity:1;transform:scale(1)}',
    '.qc-aligned .qc-marker{filter:url(#qc-goldGlow)}',
    '.qc-pulse{animation:qc-pulse 2.4s ease-in-out infinite}',
    '@keyframes qc-pulse{0%,100%{opacity:.5}50%{opacity:1}}',
    '.qc-status{font-size:18px;min-height:30px;text-align:center;line-height:1.5}',
    '.qc-status.qc-ok{color:#e9c767;font-weight:700;font-size:21px}',
    '.qc-nums{font-size:14px;color:#bba983;text-align:center;font-variant-numeric:tabular-nums;line-height:1.8}',
    '.qc-btn{font:inherit;font-size:16px;color:#102019;font-weight:700;border:1px solid #e2c27a;border-radius:12px;padding:10px 18px;min-height:46px;cursor:pointer;background:linear-gradient(180deg,#e9cb86,#b58b3c 55%,#8a6420)}',
    '.qc-btn:focus-visible{outline:3px solid #ffd77a;outline-offset:2px}',
    '@media (prefers-reduced-motion:reduce){.qc-kaaba,.qc-bezel{transition:none}.qc-pulse{animation:none}}'
  ].join('');

  var SVG = '<svg viewBox="0 0 600 760" role="img" aria-label="بوصلة القبلة"><defs>' +
  '<linearGradient id="qc-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2c27c"/><stop offset=".28" stop-color="#a98240"/><stop offset=".55" stop-color="#5c4421"/><stop offset=".8" stop-color="#b08c4a"/><stop offset="1" stop-color="#43301a"/></linearGradient>' +
  '<linearGradient id="qc-brassDark" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d5f2a"/><stop offset=".5" stop-color="#2f2111"/><stop offset="1" stop-color="#8d6c33"/></linearGradient>' +
  '<linearGradient id="qc-spikeL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1d796"/><stop offset="1" stop-color="#b98c3c"/></linearGradient>' +
  '<linearGradient id="qc-spikeD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8f6a2b"/><stop offset="1" stop-color="#4a3216"/></linearGradient>' +
  '<radialGradient id="qc-ringG" cx=".5" cy=".5" r=".5"><stop offset=".78" stop-color="#3a3426"/><stop offset=".86" stop-color="#6c624b"/><stop offset=".95" stop-color="#5b5340"/><stop offset="1" stop-color="#241f15"/></radialGradient>' +
  '<radialGradient id="qc-parch" cx=".45" cy=".4" r=".78"><stop offset="0" stop-color="#d4bb90"/><stop offset=".55" stop-color="#ad9068"/><stop offset="1" stop-color="#6e5636"/></radialGradient>' +
  '<radialGradient id="qc-hubG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f5e3ad"/><stop offset=".5" stop-color="#b48a3a"/><stop offset="1" stop-color="#4a3112"/></radialGradient>' +
  '<radialGradient id="qc-glassG" cx=".4" cy=".25" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".17"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
  '<radialGradient id="qc-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd777" stop-opacity=".75"/><stop offset="1" stop-color="#ffd777" stop-opacity="0"/></radialGradient>' +
  '<linearGradient id="qc-kFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262626"/><stop offset="1" stop-color="#050505"/></linearGradient>' +
  '<linearGradient id="qc-kSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#101010"/><stop offset="1" stop-color="#000"/></linearGradient>' +
  '<linearGradient id="qc-kTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4a4a"/><stop offset="1" stop-color="#1c1c1c"/></linearGradient>' +
  '<linearGradient id="qc-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".5" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6f1e"/></linearGradient>' +
  '<filter id="qc-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .2  0 0 0 0 .12  0 0 0 0 .04  0 0 0 .95 -.3" result="c"/><feComposite in="c" in2="SourceGraphic" operator="in"/></filter>' +
  '<filter id="qc-weather" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="4" seed="9" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .05  0 0 0 0 .03  0 0 0 0 .01  0 0 0 1.5 -.5" result="c"/><feComposite in="c" in2="SourceGraphic" operator="in"/></filter>' +
  '<filter id="qc-goldGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feColorMatrix in="b" type="matrix" values="1 0 0 0 .4  0 .8 0 0 .25  0 0 0 0 0  0 0 0 1.4 0" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></filter>' +
  '<clipPath id="qc-parchClip"><circle cx="300" cy="380" r="176"/></clipPath></defs>' +
  '<g><rect x="286" y="96" width="28" height="44" rx="4" fill="url(#qc-brassDark)" stroke="#231709"/><ellipse cx="300" cy="104" rx="22" ry="9" fill="url(#qc-brass)" stroke="#3a2610"/><circle cx="300" cy="60" r="38" fill="none" stroke="url(#qc-brass)" stroke-width="12"/><circle cx="300" cy="60" r="44" fill="none" stroke="#2c1d0a" opacity=".7"/><rect x="286" y="620" width="28" height="44" rx="4" fill="url(#qc-brassDark)" stroke="#231709"/><ellipse cx="300" cy="656" rx="22" ry="9" fill="url(#qc-brass)" stroke="#3a2610"/><circle cx="300" cy="698" r="38" fill="none" stroke="url(#qc-brass)" stroke-width="12"/></g>' +
  '<g class="qc-bezel"><g data-r="spikes"></g><circle cx="300" cy="380" r="254" fill="url(#qc-brass)" stroke="#2c1d0a" stroke-width="2"/><circle data-fx cx="300" cy="380" r="254" fill="#000" filter="url(#qc-weather)" opacity=".8"/><circle cx="300" cy="380" r="238" fill="none" stroke="#1f1408" stroke-width="20" stroke-dasharray="1.4 2.3" opacity=".6"/><circle cx="300" cy="380" r="247" fill="none" stroke="#f3dca0" stroke-width="1.3" opacity=".45"/><circle cx="300" cy="380" r="227" fill="none" stroke="#2c1d0a" stroke-width="2"/><circle cx="300" cy="380" r="225" fill="url(#qc-brassDark)"/><g data-r="bezelCracks" fill="none" stroke-linecap="round"></g></g>' +
  '<g data-r="dial"><circle cx="300" cy="380" r="220" fill="url(#qc-ringG)"/><circle data-fx cx="300" cy="380" r="220" fill="#000" filter="url(#qc-weather)" opacity=".7"/><g data-r="ringCracks" fill="none" stroke-linecap="round"></g><g data-r="ticks"></g><g data-r="numbers"></g><circle cx="300" cy="380" r="176" fill="url(#qc-parch)" stroke="#231a0d" stroke-width="2.5"/><circle data-fx cx="300" cy="380" r="176" fill="#000" filter="url(#qc-grain)"/><circle data-fx cx="300" cy="380" r="176" fill="#000" filter="url(#qc-weather)" opacity=".55"/><circle cx="300" cy="380" r="170" fill="none" stroke="#3b2c18" opacity=".6"/><g clip-path="url(#qc-parchClip)" fill="none" stroke="#3d2c18" opacity=".5"><path d="M150 310 L185 335 L178 372 L212 402"/><path d="M432 255 L402 300 L430 340 L405 382"/><path d="M240 520 L270 492 L262 452"/><path d="M382 482 L420 520 L450 502 L470 540"/><path d="M300 205 L318 232 L300 262"/><path d="M210 440 L185 470 L205 505"/></g><g data-r="letters"></g><g data-r="star"></g><g data-r="marker" class="qc-marker"><line x1="300" y1="346" x2="300" y2="262" stroke="#e8b44a" stroke-width="2.6" stroke-linecap="round" opacity=".92"/><polygon points="300,246 292,268 308,268" fill="url(#qc-gold)" stroke="#4d310a"/><circle cx="300" cy="187" r="14.5" fill="#0c0b09" stroke="#e2b04a" stroke-width="2.2"/><rect x="292" y="179" width="16" height="16" rx="1.5" fill="#050505" stroke="#e2b04a"/><rect x="292" y="183" width="16" height="3.2" fill="url(#qc-gold)"/><rect x="300.5" y="188.5" width="3.6" height="6.5" fill="#e2b04a"/></g></g>' +
  '<g><circle cx="300" cy="380" r="17" fill="url(#qc-hubG)" stroke="#2c1d0a" stroke-width="1.5"/><circle cx="300" cy="380" r="7" fill="#24160a"/><circle cx="297" cy="377" r="2.4" fill="#fff4cf" opacity=".9"/></g>' +
  '<g class="qc-kaaba"><circle cx="300" cy="380" r="150" fill="url(#qc-halo)" class="qc-pulse"/><circle cx="300" cy="380" r="104" fill="#0a0d11" opacity=".92" stroke="#e2b04a" stroke-width="2.5"/><circle cx="300" cy="380" r="98" fill="none" stroke="#e2b04a" stroke-width=".8" opacity=".6"/><g transform="translate(300 372) scale(1.05)"><polygon points="-52,-30 -20,-44 64,-44 32,-30" fill="url(#qc-kTop)"/><polygon points="32,-30 64,-44 64,26 32,42" fill="url(#qc-kSide)" stroke="#000" stroke-width=".6"/><rect x="-52" y="-30" width="84" height="72" fill="url(#qc-kFront)" stroke="#000" stroke-width=".6"/><rect x="-52" y="-17" width="84" height="13" fill="url(#qc-gold)"/><polygon points="32,-17 64,-31 64,-18 32,-4" fill="url(#qc-gold)" opacity=".85"/><line x1="-52" y1="-10.5" x2="32" y2="-10.5" stroke="#8a5f14" stroke-width="1.6" stroke-dasharray="3 3"/><rect x="2" y="10" width="18" height="32" rx="2" fill="url(#qc-gold)" stroke="#6c4a10"/><rect x="6" y="15" width="10" height="24" rx="1.5" fill="none" stroke="#8a5f14"/><g stroke="#fff" stroke-opacity=".06"><line x1="-36" y1="-3" x2="-36" y2="42"/><line x1="-20" y1="-3" x2="-20" y2="42"/><line x1="-4" y1="-3" x2="-4" y2="42"/><line x1="24" y1="-3" x2="24" y2="42"/></g></g><text x="300" y="468" text-anchor="middle" font-size="25" font-weight="700" fill="#f1cf7a" font-family="Amiri,'Noto Naskh Arabic','Traditional Arabic',serif">الكعبة المشرفة</text></g>' +
  '<g><polygon points="287,150 313,150 300,190" fill="url(#qc-gold)" stroke="#2a1a06" stroke-width="1.6"/><circle cx="300" cy="160" r="3" fill="#2a1a06"/></g><ellipse cx="270" cy="250" rx="180" ry="105" fill="url(#qc-glassG)" transform="rotate(-18 270 250)" pointer-events="none"/><circle cx="300" cy="380" r="225" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="3" pointer-events="none"/></svg>';

  function drawStatic(svg) {
    var q = function (r) { return svg.querySelector('[data-r="' + r + '"]'); };
    var seed = 7;
    function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    [45, 90, 135, 225, 270, 315].forEach(function (a) {
      var tip = pol(300, a), l = pol(248, a - 6.5), r = pol(248, a + 6.5), c = pol(248, a);
      mk('polygon', { points: pts([l, tip, c]), fill: 'url(#qc-spikeL)', stroke: '#3a2610' }, q('spikes'));
      mk('polygon', { points: pts([c, tip, r]), fill: 'url(#qc-spikeD)', stroke: '#3a2610' }, q('spikes'));
    });
    function cracks(parent, count, r0, r1, light, dark) {
      for (var i = 0; i < count; i++) {
        var a = rnd() * 360, r = r0 + rnd() * (r1 - r0), d = '', n = 3 + Math.floor(rnd() * 4);
        for (var k = 0; k < n; k++) {
          var p = pol(r, a); d += (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
          a += (rnd() - .5) * 9; r = Math.min(r1, Math.max(r0, r + (rnd() - .5) * 16));
        }
        mk('path', { d: d, stroke: dark, 'stroke-width': 1.3, opacity: .5, transform: 'translate(.8 .8)' }, parent);
        mk('path', { d: d, stroke: light, 'stroke-width': .9, opacity: .55 }, parent);
      }
    }
    cracks(q('bezelCracks'), 26, 228, 252, '#f3e2b0', '#1c1208');
    cracks(q('ringCracks'), 18, 180, 216, '#d9c89c', '#15110a');
    for (var d = 0; d < 360; d += 2) {
      var len = d % 30 === 0 ? 11 : d % 10 === 0 ? 8 : 4, p1 = pol(217, d), p2 = pol(217 - len, d);
      mk('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], stroke: '#17130c', 'stroke-width': d % 10 === 0 ? 1.7 : 1, 'stroke-linecap': 'round' }, q('ticks'));
    }
    for (var n = 0; n < 360; n += 30) {
      var g = mk('g', { transform: 'rotate(' + n + ' ' + CX + ' ' + CY + ')' }, q('numbers'));
      mk('text', { x: CX + .8, y: CY - 190.2, 'text-anchor': 'middle', 'font-size': 15, fill: '#d9c89c', opacity: .45, 'font-family': FONT }, g).textContent = n;
      mk('text', { x: CX, y: CY - 191, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#1a160e', 'font-family': FONT }, g).textContent = n;
    }
    [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']].forEach(function (L) {
      var g = mk('g', { transform: 'rotate(' + L[0] + ' ' + CX + ' ' + CY + ')' }, q('letters'));
      mk('text', { x: CX + 1.2, y: CY - 141.8, 'text-anchor': 'middle', 'font-size': 36, 'font-weight': 700, fill: '#f0e2bd', opacity: .5, 'font-family': FONT }, g).textContent = L[1];
      mk('text', { x: CX, y: CY - 143, 'text-anchor': 'middle', 'font-size': 36, 'font-weight': 700, fill: '#2f3033', 'font-family': FONT }, g).textContent = L[1];
    });
    var spec = [];
    for (var i = 0; i < 16; i++) {
      var a2 = i * 22.5;
      if (i % 4 === 0) spec.push({ a: a2, L: 118, rb: 34, dl: 17, o: 3 });
      else if (i % 2 === 0) spec.push({ a: a2, L: 96, rb: 28, dl: 15, o: 2 });
      else spec.push({ a: a2, L: 72, rb: 22, dl: 11, o: 1 });
    }
    spec.sort(function (x, y) { return x.o - y.o; }).forEach(function (k) {
      var tip = pol(k.L, k.a), lb = pol(k.rb, k.a - k.dl), rb = pol(k.rb, k.a + k.dl), c = [CX, CY];
      mk('polygon', { points: pts([c, lb, tip]), fill: '#10161d', stroke: '#06090c', 'stroke-width': .7 }, q('star'));
      mk('polygon', { points: pts([c, tip, rb]), fill: k.o === 3 ? '#e1cfa4' : '#c9b384', stroke: '#2a1d0e', 'stroke-width': .7 }, q('star'));
    });
  }

  var current = null;
  function mount(container, options) {
    if (!container) throw new Error('QiblaCompass.mount: الحاوية غير موجودة');
    unmount();
    var o = { lat: null, lon: null, vibrate: true, manual: true, status: true, quality: 'auto',
      pattern: [220, 90, 220, 90, 420], onAlign: null, onHeading: null };
    for (var k in (options || {})) o[k] = options[k];
    if (!document.getElementById('qc-style')) {
      var st = document.createElement('style'); st.id = 'qc-style'; st.textContent = CSS; document.head.appendChild(st);
    }
    var rootEl = document.createElement('div'); rootEl.className = 'qc-root';
    rootEl.innerHTML = '<div class="qc-stage qc-manual">' + SVG + '</div>' +
      (o.status ? '<div class="qc-status" role="status" aria-live="polite"></div><div class="qc-nums"></div>' : '') +
      '<button type="button" class="qc-btn" hidden>تفعيل البوصلة</button>';
    container.innerHTML = ''; container.appendChild(rootEl);
    var stage = rootEl.querySelector('.qc-stage'), svg = rootEl.querySelector('svg');
    var statusEl = rootEl.querySelector('.qc-status'), numsEl = rootEl.querySelector('.qc-nums'), btn = rootEl.querySelector('.qc-btn');
    drawStatic(svg);
    var lite = o.quality === 'lite' ||
      (o.quality === 'auto' && ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 3)));
    if (lite) [].forEach.call(svg.querySelectorAll('[data-fx]'), function (n) { n.parentNode.removeChild(n); });
    var dial = svg.querySelector('[data-r="dial"]'), marker = svg.querySelector('[data-r="marker"]');
    var S = { qibla: null, heading: 40, target: 40, aligned: false, mode: 'manual', km: null, src: null, notice: '', until: 0 };
    var raf = 0, alive = true, genSensor = null, drag = null, attached = false;
    function say(t) { S.notice = t; S.until = t ? Date.now() + 5000 : 0; }
    function setLocation(lat, lon) {
      if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        S.qibla = null; S.km = null; return;
      }
      S.qibla = bearing(lat, lon); S.km = Math.round(distKm(lat, lon));
      marker.setAttribute('transform', 'rotate(' + S.qibla.toFixed(2) + ' ' + CX + ' ' + CY + ')');
    }
    function got(h, src) {
      if (!alive || !Number.isFinite(h)) return;
      if (S.src && S.src !== src) return;
      S.src = src;
      if (S.mode !== 'sensor') { S.mode = 'sensor'; stage.classList.remove('qc-manual'); btn.hidden = true; say(''); }
      S.target = norm(h);
    }
    function onOrient(e) {
      if (typeof e.webkitCompassHeading === 'number') return got(e.webkitCompassHeading, 'ios');
      if ((e.absolute || e.type === 'deviceorientationabsolute') && e.alpha != null && e.beta != null && e.gamma != null)
        got(fromEuler(e.alpha, e.beta, e.gamma), 'abs');
    }
    function attach() {
      if (!alive || attached) return; attached = true;
      window.addEventListener('deviceorientationabsolute', onOrient, true);
      window.addEventListener('deviceorientation', onOrient, true);
      try {
        if ('AbsoluteOrientationSensor' in window) {
          genSensor = new AbsoluteOrientationSensor({ frequency: 30, referenceFrame: 'screen' });
          genSensor.addEventListener('reading', function () { if (alive && genSensor && genSensor.quaternion) got(fromQuat(genSensor.quaternion), 'gen'); });
          genSensor.addEventListener('error', function () {});
          genSensor.start();
        }
      } catch (e) { genSensor = null; }
      window.setTimeout(function () {
        if (alive && S.mode !== 'sensor') say('لا توجد قراءات من المستشعر. اسحب القرص للتجربة، أو تحقق من دعم المستشعر في الهاتف.');
      }, 3500);
    }
    var needsPermission = !!(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function');
    function requestSensors() {
      if (!needsPermission) { attach(); return Promise.resolve(true); }
      return DeviceOrientationEvent.requestPermission().then(function (r) {
        if (!alive) return false;
        if (r === 'granted') { attach(); btn.hidden = true; return true; }
        say('لم يُمنح إذن المستشعر. فعّله من إعدادات المتصفح.'); return false;
      }).catch(function () { if (alive) say('تعذّر طلب إذن المستشعر.'); return false; });
    }
    if (needsPermission) { btn.hidden = false; btn.addEventListener('click', requestSensors); } else attach();
    function ptr(e) { var r = svg.getBoundingClientRect(); return deg(Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2)))); }
    function pd(e) { if (!o.manual || S.mode !== 'manual') return; drag = { a0: ptr(e), h0: S.target }; try { svg.setPointerCapture(e.pointerId); } catch (x) {} }
    function pm(e) { if (drag) S.target = norm(drag.h0 - (ptr(e) - drag.a0)); }
    function pu() { drag = null; }
    svg.addEventListener('pointerdown', pd); svg.addEventListener('pointermove', pm);
    svg.addEventListener('pointerup', pu); svg.addEventListener('pointercancel', pu);
    var lastStatus = '', lastNums = '', lastHeadingInt = -1;
    function frame() {
      if (!alive) return;
      var d = diff(S.target, S.heading);
      S.heading = Math.abs(d) < .02 ? S.target : norm(S.heading + d * 0.2);
      dial.setAttribute('transform', 'rotate(' + (-S.heading).toFixed(2) + ' ' + CX + ' ' + CY + ')');
      var off = S.qibla == null ? null : diff(S.qibla, S.heading), a = off == null ? 999 : Math.abs(off);
      if (!S.aligned && a <= 3) setAligned(true);
      else if (S.aligned && a > 7) setAligned(false);
      var hi = Math.round(S.heading) % 360;
      if (hi !== lastHeadingInt) { lastHeadingInt = hi; if (o.onHeading) try { o.onHeading(hi, S); } catch (e) {} }
      if (statusEl) {
        var txt, ok = false;
        if (S.qibla == null) txt = 'حدّد موقعك لحساب اتجاه القبلة';
        else if (S.aligned) { txt = 'أنت الآن في اتجاه القبلة'; ok = true; }
        else if (S.notice && Date.now() < S.until) txt = S.notice;
        else if (S.mode === 'manual' && !S.src) txt = 'حرّك الهاتف، أو اسحب القرص للتجربة';
        else txt = a < 12 ? 'اقتربت — بقي ' + Math.round(a) + '°' : 'أدِر نحو ' + (off > 0 ? 'اليمين' : 'اليسار') + ' ' + Math.round(a) + '°';
        if (txt !== lastStatus) { lastStatus = txt; statusEl.textContent = txt; }
        statusEl.classList.toggle('qc-ok', ok);
        var nt = S.qibla == null ? '' : 'القبلة ' + S.qibla.toFixed(1) + '° · هاتفك ' + hi + '° · ' + S.km.toLocaleString('ar-u-nu-latn') + ' كم';
        if (nt !== lastNums) { lastNums = nt; numsEl.textContent = nt; }
      }
      raf = requestAnimationFrame(frame);
    }
    function setAligned(v) {
      S.aligned = v; rootEl.classList.toggle('qc-aligned', v);
      if (v && o.vibrate) { try { navigator.vibrate && navigator.vibrate(o.pattern); } catch (e) {} }
      if (o.onAlign) try { o.onAlign(v, S); } catch (e) {}
    }
    setLocation(o.lat, o.lon);
    raf = requestAnimationFrame(frame);
    function destroy() {
      alive = false; cancelAnimationFrame(raf);
      window.removeEventListener('deviceorientationabsolute', onOrient, true);
      window.removeEventListener('deviceorientation', onOrient, true);
      try { genSensor && genSensor.stop(); } catch (e) {}
      try { navigator.vibrate && navigator.vibrate(0); } catch (e) {}
      if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
    }
    current = { setLocation: setLocation, requestSensors: requestSensors, destroy: destroy,
      getState: function () { return { qibla: S.qibla, heading: S.heading, aligned: S.aligned, mode: S.mode }; } };
    return current;
  }
  function unmount() { if (current) { current.destroy(); current = null; } }
  function setLocation(lat, lon) { if (current) current.setLocation(lat, lon); }
  return { mount: mount, unmount: unmount, setLocation: setLocation, bearing: bearing, distanceKm: distKm, KAABA: KAABA };
});
