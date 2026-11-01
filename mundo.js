/* Vila Camilópolis: um bairrinho 2D, com uma missão nova por dia. Cada dia vencido destrava uma lembrança. */
(function () {
  'use strict';
  var openBtn = document.getElementById('mundo-open');
  if (!openBtn) return;

  var TS = 32, W = 20, H = 20, SC = 2, VIEW_TILES = 9;
  var KEY = 'mundo-camilopolis-v2';

  /* ---------- lembranças (as mesmas da linha do tempo): uma por dia vencido ---------- */
  var MEMS = [
    { t: 'Tudo começou na paróquia', d: '', p: 'Frequentávamos a mesma paróquia. Foi ali que a nossa história começou.' },
    { t: 'O dia que saímos pela primeira vez', d: '26 de janeiro de 2025', p: 'A primeira vez que a gente saiu juntos.', ph: ['album/jogo-primeiro-encontro.jpg'] },
    { t: 'O dia em que ficamos pela primeira vez', d: '1 de junho de 2025', p: 'Um dia que a gente nunca mais esqueceu.', ph: ['album/jogo-ficamos.jpg'] },
    { t: 'O pedido de namoro', d: '', p: 'Foi no Via Fico.', ph: ['album/jogo-pedido-1.jpg', 'album/jogo-pedido-2.jpg'] },
    { t: 'Começamos a namorar', d: '1 de novembro de 2025', p: 'E dali em diante a gente virou nós dois.' },
    { t: 'Desde então', d: '', p: 'Já viajamos juntos, vivemos momentos incríveis, brigamos, demos risadas, e seguimos um ao lado do outro.' }
  ];
  var FINAL_TXT = 'Amôoo, peciso di voxê ati tumiduuu 💙 Feliz um ano nosso, minha flor. 💌';

  /* ---------- lugares onde acontecem as entregas ---------- */
  var SPOTS = [
    { id: 'igreja', nome: 'a Paróquia', x: 6, y: 5, item: '🕯️', coisa: 'a vela' },
    { id: 'padaria', nome: 'a Padaria Karina', x: 17, y: 6, item: '🥖', coisa: 'o pão' },
    { id: 'via', nome: 'o Via Fico', x: 4, y: 17, item: '🍝', coisa: 'o jantar' },
    { id: 'praca', nome: 'a fonte da praça', x: 6, y: 8, item: '🌹', coisa: 'a rosa' },
    { id: 'bus', nome: 'o ponto de ônibus', x: 17, y: 16, item: '🎒', coisa: 'a mala' }
  ];
  var FEFE = { x: 8 * TS + 16, y: 7 * TS + 16 };
  var START = { x: 11.5 * TS, y: 9.5 * TS };

  /* ---------- mapa pequeno: praça com a igreja, padaria do outro lado da rua, Via Fico embaixo ---------- */
  var G = 0, SW = 1, RD = 2, PV = 3, TR = 5;
  var tile = [], solid = [], x, y;
  for (y = 0; y < H; y++) { tile.push([]); solid.push([]); for (x = 0; x < W; x++) { tile[y].push(G); solid[y].push(false); } }
  var ROWS = [10, 11], COLS = [12, 13];
  function isRoadAt(cx, cy) { return ROWS.indexOf(cy) > -1 || COLS.indexOf(cx) > -1; }
  for (y = 0; y < H; y++) for (x = 0; x < W; x++) if (isRoadAt(x, y)) tile[y][x] = RD;
  for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
    if (tile[y][x] !== G) continue;
    for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) {
      var nx = x + i, ny = y + j;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && isRoadAt(nx, ny)) tile[y][x] = SW;
    }
  }
  function fillTile(x0, y0, w, h, t) { for (var b = y0; b < y0 + h; b++) for (var a = x0; a < x0 + w; a++) if (tile[b] && tile[b][a] !== undefined) tile[b][a] = t; }
  function fillSolid(x0, y0, w, h) { for (var b = y0; b < y0 + h; b++) for (var a = x0; a < x0 + w; a++) if (solid[b] && solid[b][a] !== undefined) solid[b][a] = true; }

  fillTile(1, 7, 10, 1, PV); fillTile(6, 4, 1, 6, PV); fillTile(5, 6, 3, 3, PV);   /* praça */
  fillTile(17, 6, 1, 3, PV);                                                          /* entrada da padaria */
  fillTile(1, 17, 7, 2, TR);                                                          /* terraço do Via Fico */

  var houses = [
    [8, 13, 3, 3, '#cfe3f5', '#c8553d'], [8, 17, 3, 2, '#f7d9a8', '#4f6fb3'], [15, 13, 4, 2, '#f9c9d4', '#5c8f4a']
  ];
  houses.forEach(function (h) { fillSolid(h[0], h[1], h[2], h[3]); });
  var CHURCH = { x: 3, y: 0, w: 7, h: 4 }; fillSolid(CHURCH.x, CHURCH.y, CHURCH.w, CHURCH.h);
  var BAK = { x: 15, y: 2, w: 5, h: 4 }; fillSolid(BAK.x, BAK.y, BAK.w, BAK.h);
  var REST = { x: 1, y: 13, w: 7, h: 4 }; fillSolid(REST.x, REST.y, REST.w, REST.h);
  var BUS = { x: 15, y: 17, w: 5, h: 2 }; fillSolid(BUS.x, BUS.y, BUS.w, BUS.h);
  fillSolid(6, 7, 1, 1);
  var benches = [[3, 6], [9, 6], [3, 8], [9, 8]];
  benches.forEach(function (b) { solid[b[1]][b[0]] = true; });
  var trees = [[1, 4], [10, 4], [1, 6], [10, 6], [2, 1], [10, 1], [0, 14], [0, 16], [0, 18], [2, 19], [5, 19], [8, 19], [10, 19], [15, 7], [19, 7], [16, 0], [18, 0], [19, 14], [15, 16], [19, 16]];
  trees.forEach(function (t) { if (tile[t[1]][t[0]] === G && !solid[t[1]][t[0]]) solid[t[1]][t[0]] = true; });
  SPOTS.forEach(function (s) { solid[s.y][s.x] = false; });
  var lamps = [[11, 2], [11, 6], [11, 15], [11, 18], [14, 3], [14, 7], [14, 15], [14, 18], [2, 9], [5, 9], [9, 9], [16, 9], [19, 9], [2, 12], [6, 12], [9, 12], [17, 12]];

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- cenário (desenhado uma vez) ---------- */
  var stat = null;
  function rr(g, a, b, w, h, r) { g.beginPath(); g.moveTo(a + r, b); g.arcTo(a + w, b, a + w, b + h, r); g.arcTo(a + w, b + h, a, b + h, r); g.arcTo(a, b + h, a, b, r); g.arcTo(a, b, a + w, b, r); g.closePath(); }
  function label(g, txt, cx, cy) {
    g.font = '700 8px Jost, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    var w = g.measureText(txt).width + 10;
    g.fillStyle = 'rgba(43,16,34,.78)'; rr(g, cx - w / 2, cy - 7, w, 14, 7); g.fill();
    g.fillStyle = '#FFF3EE'; g.fillText(txt, cx, cy + .5);
  }
  function drawHouse(g, h) {
    var px = h[0] * TS, py = h[1] * TS, w = h[2] * TS, ht = h[3] * TS;
    g.fillStyle = 'rgba(0,0,0,.18)'; rr(g, px + 3, py + 5, w, ht, 5); g.fill();
    g.fillStyle = h[4]; rr(g, px, py, w, ht, 5); g.fill();
    var roofH = ht - TS;
    g.fillStyle = h[5]; rr(g, px - 2, py - 2, w + 4, roofH + 2, 6); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 1.5;
    for (var k = 1; k < roofH / 8; k++) { g.beginPath(); g.moveTo(px, py + k * 8); g.lineTo(px + w, py + k * 8); g.stroke(); }
    g.fillStyle = '#ffd98a'; g.fillRect(px + 8, py + roofH + 7, 12, 10); if (h[2] > 2) g.fillRect(px + w - 20, py + roofH + 7, 12, 10);
    g.fillStyle = '#7a4a2c'; rr(g, px + w / 2 - 6, py + ht - 17, 12, 17, 3); g.fill();
  }
  function drawChurch(g) {
    var px = CHURCH.x * TS, py = CHURCH.y * TS, w = CHURCH.w * TS;
    g.fillStyle = 'rgba(0,0,0,.2)'; rr(g, px + 4, py + 6, w, CHURCH.h * TS, 5); g.fill();
    g.fillStyle = '#f4e6d0'; g.fillRect(px, py + 34, w, 94);
    g.fillStyle = '#b5523a'; g.fillRect(px - 4, py + 18, w + 8, 22);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(px - 4, py + 18, w + 8, 4);
    var tx = px + w / 2 - 28;
    g.fillStyle = '#efdcc0'; g.fillRect(tx, py + 8, 56, 120);
    g.fillStyle = '#b5523a'; g.beginPath(); g.moveTo(tx - 6, py + 22); g.lineTo(tx + 28, py - 2); g.lineTo(tx + 62, py + 22); g.closePath(); g.fill();
    g.fillStyle = '#fff3ee'; g.fillRect(tx + 26, py - 14, 4, 18); g.fillRect(tx + 21, py - 9, 14, 4);
    g.fillStyle = '#ffd98a'; g.beginPath(); g.arc(tx + 28, py + 46, 10, 0, 7); g.fill();
    g.strokeStyle = '#fff3ee'; g.lineWidth = 2; g.beginPath(); g.moveTo(tx + 18, py + 46); g.lineTo(tx + 38, py + 46); g.moveTo(tx + 28, py + 36); g.lineTo(tx + 28, py + 56); g.stroke();
    g.fillStyle = '#6b3f26'; g.beginPath(); g.moveTo(tx + 16, py + 128); g.lineTo(tx + 16, py + 98); g.arc(tx + 28, py + 98, 12, Math.PI, 0); g.lineTo(tx + 40, py + 128); g.fill();
    g.fillStyle = '#ffd98a';
    [px + 14, px + 40, px + w - 54, px + w - 28].forEach(function (a) { rr(g, a, py + 66, 14, 26, 7); g.fill(); });
  }
  function shop(g, b, wall, roof, name, font) {
    var px = b.x * TS, py = b.y * TS, w = b.w * TS, ht = b.h * TS;
    g.fillStyle = 'rgba(0,0,0,.2)'; rr(g, px + 4, py + 6, w, ht, 5); g.fill();
    g.fillStyle = wall; rr(g, px, py, w, ht, 5); g.fill();
    g.fillStyle = roof; rr(g, px - 3, py - 3, w + 6, 52, 7); g.fill();
    for (var s = 0; s < 12; s++) { g.fillStyle = s % 2 ? '#fff3ee' : '#c94f73'; g.fillRect(px + s * (w / 12), py + 49, w / 12, 14); }
    g.fillStyle = '#ffd98a'; g.fillRect(px + 12, py + 74, 36, 34); g.fillRect(px + w - 48, py + 74, 36, 34);
    g.fillStyle = '#6b3f26'; rr(g, px + w / 2 - 14, py + 72, 28, 56, 4); g.fill();
    g.fillStyle = '#f6c34a'; g.beginPath(); g.arc(px + w / 2 + 8, py + 100, 2, 0, 7); g.fill();
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff3ee'; g.fillText(name, px + w / 2, py + 24);
  }
  function drawBus(g) {
    var px = BUS.x * TS, py = BUS.y * TS, w = BUS.w * TS, ht = BUS.h * TS;
    g.fillStyle = 'rgba(0,0,0,.2)'; rr(g, px + 3, py + 5, w, ht, 10); g.fill();
    g.fillStyle = '#f2b441'; rr(g, px, py, w, ht, 10); g.fill();
    g.fillStyle = '#ffd98a'; for (var k = 0; k < 5; k++) g.fillRect(px + 10 + k * 29, py + 10, 22, 16);
    g.fillStyle = '#c94f73'; g.fillRect(px, py + 36, w, 6);
    g.fillStyle = '#2b1022'; g.beginPath(); g.arc(px + 30, py + ht, 7, 0, 7); g.arc(px + w - 30, py + ht, 7, 0, 7); g.fill();
  }
  function drawTree(g, tx, ty, r) {
    var cx = tx * TS + 16, cy = ty * TS + 16;
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(cx + 3, cy + 12, 17, 8, 0, 0, 7); g.fill();
    g.fillStyle = '#7a4a2c'; g.fillRect(cx - 3, cy + 2, 6, 12);
    g.fillStyle = '#3f9a52'; g.beginPath(); g.arc(cx, cy - 4, 18 + r * 2, 0, 7); g.fill();
    g.fillStyle = '#4cae5e'; g.beginPath(); g.arc(cx - 3, cy - 7, 13 + r * 2, 0, 7); g.fill();
    g.fillStyle = '#68c476'; g.beginPath(); g.arc(cx - 6, cy - 10, 6, 0, 7); g.fill();
  }
  function buildStatic() {
    var c = document.createElement('canvas'); c.width = W * TS * SC; c.height = H * TS * SC;
    var g = c.getContext('2d'); g.scale(SC, SC);
    var r = rng(7), a, b;
    for (b = 0; b < H; b++) for (a = 0; a < W; a++) {
      var t = tile[b][a], px = a * TS, py = b * TS;
      if (t === G) { g.fillStyle = (a + b) % 2 ? '#a5d98a' : '#9ed383'; g.fillRect(px, py, TS, TS); }
      else if (t === SW) { g.fillStyle = '#ece3da'; g.fillRect(px, py, TS, TS); g.strokeStyle = 'rgba(0,0,0,.07)'; g.strokeRect(px + .5, py + .5, TS - 1, TS - 1); }
      else if (t === RD) { g.fillStyle = '#5d6170'; g.fillRect(px, py, TS, TS); }
      else if (t === PV) { g.fillStyle = '#f2dcc4'; g.fillRect(px, py, TS, TS); g.strokeStyle = 'rgba(160,110,80,.22)'; g.strokeRect(px + .5, py + .5, TS - 1, TS - 1); }
      else if (t === TR) { g.fillStyle = (a + b) % 2 ? '#f8d3c2' : '#f3c4b1'; g.fillRect(px, py, TS, TS); }
    }
    g.fillStyle = 'rgba(255,243,238,.85)';
    for (b = 0; b < H; b++) for (a = 0; a < W; a++) {
      if (tile[b][a] !== RD) continue;
      var h1 = ROWS.indexOf(b) > -1, v1 = COLS.indexOf(a) > -1;
      if (h1 && !v1 && b === 10) g.fillRect(a * TS + 4, (b + 1) * TS - 1.5, 16, 3);
      if (v1 && !h1 && a === 12) g.fillRect((a + 1) * TS - 1.5, b * TS + 4, 3, 16);
    }
    for (var k = 0; k < 120; k++) {
      var fx = Math.floor(r() * W), fy = Math.floor(r() * H);
      if (tile[fy][fx] !== G || solid[fy][fx]) continue;
      g.fillStyle = ['#fff3ee', '#f28ba8', '#ffd86b', '#b9a3f0'][Math.floor(r() * 4)];
      g.beginPath(); g.arc(fx * TS + 4 + r() * 24, fy * TS + 4 + r() * 24, 1.6, 0, 7); g.fill();
    }
    var fx0 = 6 * TS + 16, fy0 = 7 * TS + 16;
    g.fillStyle = '#d9c7b0'; g.beginPath(); g.arc(fx0, fy0, 21, 0, 7); g.fill();
    g.fillStyle = '#6cc3e8'; g.beginPath(); g.arc(fx0, fy0, 16, 0, 7); g.fill();
    g.fillStyle = '#e8f7ff'; g.beginPath(); g.arc(fx0, fy0, 6, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.arc(fx0, fy0, 11, 0, 7); g.stroke();
    benches.forEach(function (bn) { g.fillStyle = '#8a5a3a'; rr(g, bn[0] * TS + 3, bn[1] * TS + 9, 26, 14, 3); g.fill(); g.fillStyle = '#a8734d'; g.fillRect(bn[0] * TS + 3, bn[1] * TS + 9, 26, 5); });
    [[2, 17], [6, 17], [3, 18], [5, 18]].forEach(function (m) {
      var mx = m[0] * TS + 16, my = m[1] * TS + 18;
      g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(mx + 2, my + 3, 11, 7, 0, 0, 7); g.fill();
      g.fillStyle = '#fff3ee'; g.beginPath(); g.arc(mx, my, 9, 0, 7); g.fill();
      g.fillStyle = '#c94f73'; g.beginPath(); g.arc(mx, my, 3, 0, 7); g.fill();
    });
    houses.forEach(function (h) { drawHouse(g, h); });
    drawChurch(g);
    shop(g, REST, '#fbe9d6', '#7a1f3d', 'Via Fico', 'italic 500 22px Fraunces, Georgia, serif');
    shop(g, BAK, '#fff1dc', '#b8683a', 'Padaria Karina', 'italic 500 15px Fraunces, Georgia, serif');
    drawBus(g);
    trees.forEach(function (t, n) { if (tile[t[1]][t[0]] === G) drawTree(g, t[0], t[1], n % 3 * .5); });
    lamps.forEach(function (l) { var lx = l[0] * TS + 16, ly = l[1] * TS + 16; g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(lx + 2, ly + 10, 6, 2.5, 0, 0, 7); g.fill(); g.fillStyle = '#3a2a3e'; g.fillRect(lx - 1.5, ly - 12, 3, 22); g.fillStyle = '#ffd98a'; g.beginPath(); g.arc(lx, ly - 14, 4.2, 0, 7); g.fill(); });
    label(g, 'Paróquia São Francisco de Léllis', 6.5 * TS, 4 * TS + 8);
    label(g, 'Praça São Camilo', 6.5 * TS, 9 * TS + 16);
    label(g, 'Ponto de ônibus', 17.5 * TS, 15 * TS + 14);
    return c;
  }

  /* ---------- progresso salvo (no celular dela) ---------- */
  var S = { stars: 0, lastStar: '', streak: 0, day: '', k: 0, doneToday: false, final: false };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv) { for (var kk in S) if (sv[kk] !== undefined) S[kk] = sv[kk]; } } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function dayStr(off) { var n = new Date(); n.setDate(n.getDate() + (off || 0)); return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); }
  function hash(s) { var h = 2166136261; for (var q = 0; q < s.length; q++) { h ^= s.charCodeAt(q); h = Math.imul(h, 16777619); } return h >>> 0; }
  function Pt() { return window.Pontos; }

  /* ---------- missão do dia: 3 entregas, cada uma com tempo; mais difícil a cada dia vencido ---------- */
  var dels = [], M = { k: 0, phase: 'pick', t: 0, practice: false };
  function level() { return Math.min(S.stars, 6); }
  function tmax() { return Math.max(12, 24 - 2 * level()); }
  function makeDeliveries(seed) {
    var r = rng(seed), out = [], used = {};
    while (out.length < 3) {
      var a = Math.floor(r() * SPOTS.length), b = Math.floor(r() * SPOTS.length);
      if (a === b || used[a + '-' + b]) continue;
      used[a + '-' + b] = 1; out.push({ a: SPOTS[a], b: SPOTS[b] });
    }
    return out;
  }
  function startDay() {
    var today = dayStr();
    if (S.day !== today) { S.day = today; S.k = 0; S.doneToday = false; save(); }
    dels = makeDeliveries(hash(today));
    M.practice = S.doneToday; M.k = S.doneToday ? 0 : Math.min(S.k, 2);
    if (M.practice) dels = makeDeliveries((Math.random() * 1e9) | 0);
    M.phase = 'pick'; M.t = 0;
  }
  function cur() { return dels[M.k]; }

  /* ---------- carros: mais carros e mais rápidos conforme os dias ---------- */
  var cars = [];
  function makeCars() {
    cars = []; var r = rng(hash(S.day || dayStr()) + 3), n = 1 + (level() >= 2 ? 1 : 0) + (level() >= 4 ? 1 : 0), vb = 62 + level() * 9, cols = ['#e8648f', '#f2b441', '#4f6fb3', '#fff3ee', '#7d57a8', '#5c8f4a', '#c8553d'];
    [[10, 1, true], [11, -1, true], [12, 1, false], [13, -1, false]].forEach(function (L) {
      for (var q = 0; q < n; q++) {
        var len = (L[2] ? W : H) * TS;
        cars.push({ h: L[2], lane: L[0], s: L[1], pos: (q / n + r() * .25) * len, v: vb + r() * 30, c: cols[Math.floor(r() * cols.length)] });
      }
    });
  }
  function carBox(c) {
    var along = c.pos, across = (c.lane + .5) * TS;
    return c.h ? { x: along - 22, y: across - 11, w: 44, h: 22 } : { x: across - 11, y: along - 22, w: 22, h: 44 };
  }

  /* ---------- telas ---------- */
  var root = document.createElement('div');
  root.id = 'world'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Vila Camilópolis');
  root.innerHTML =
    '<div class="w-bar"><button type="button" class="w-exit" id="w-exit">Sair</button><div class="w-title">Vila Camilópolis</div><div class="w-count" id="w-count">★ 0/6</div></div>' +
    '<div class="w-stage" id="w-stage"><canvas id="w-canvas"></canvas>' +
    '<div class="w-mission" id="w-mission"><b id="w-m1"></b><span id="w-m2"></span></div>' +
    '<div class="w-toast" id="w-toast" hidden></div>' +
    '<div class="w-joy" id="w-joy"><i id="w-knob"></i></div>' +
    '<button type="button" class="w-tip" id="w-tip">Lembranças</button>' +
    '<div class="w-card" id="w-card" hidden><div class="w-photos" id="w-photos"></div><p class="w-date" id="w-date"></p><h3 id="w-ctitle"></h3><p id="w-ctext"></p><button type="button" id="w-ok">Continuar</button></div>' +
    '<div class="w-card w-album" id="w-album" hidden><h3>Lembranças</h3><div id="w-list"></div><button type="button" id="w-album-ok">Fechar</button></div></div>';
  document.body.appendChild(root);
  var el = function (id) { return document.getElementById(id); };
  var canvas = el('w-canvas'), ctx = canvas.getContext('2d');
  var nc = null, cw = 0, ch = 0, dpr = 1, zoom = 1, running = false, paused = false, last = 0, parts = [], toastT = 0, afterCard = null;

  var urls = {}, sbc = null;
  function loadPhotos() {
    if (sbc === null) { try { sbc = window.supabase.createClient('https://fapfosqocvtawkhgavap.supabase.co', 'sb_publishable_gklz-L7kiemOKagFhu5GWg_cUZdYk0J'); } catch (e) { sbc = false; } }
    if (!sbc) return;
    var paths = []; MEMS.forEach(function (m) { (m.ph || []).forEach(function (p) { paths.push(p); }); });
    sbc.storage.from('nos').createSignedUrls(paths, 3600).then(function (r) {
      (r.data || []).forEach(function (o) { if (o.signedUrl) urls[o.path] = o.signedUrl; });
    }).catch(function () {});
  }

  function resize() {
    var r = el('w-stage').getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2); cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    zoom = cw / (VIEW_TILES * TS);
  }
  window.addEventListener('resize', function () { if (running) { resize(); joyHome(); } });

  function toast(msg) { var t = el('w-toast'); t.textContent = msg; t.hidden = false; toastT = 2.6; }
  function ptsNow() { return Pt() ? Pt().get() : 0; }
  function refreshHud() {
    el('w-count').textContent = '★ ' + Math.min(S.stars, MEMS.length) + '/' + MEMS.length;
    var m1 = el('w-m1'), m2 = el('w-m2'), d = cur();
    var streak = (S.lastStar === dayStr() || S.lastStar === dayStr(-1)) ? S.streak : 0;
    var tail = '  ·  ' + ptsNow() + ' pontos' + (streak > 1 ? '  ·  🔥 ' + streak + ' dias' : '');
    if (S.stars >= MEMS.length && !S.final) { m1.textContent = 'O Fefe está te esperando na praça 💙'; m2.textContent = ''; return; }
    if (M.practice) { m1.textContent = 'Treino: ' + (M.phase === 'pick' ? 'pegue ' + d.a.coisa + ' em ' + d.a.nome : 'leve até ' + d.b.nome); m2.textContent = M.phase === 'drop' ? '⏱ ' + Math.ceil(M.t) + 's' + tail : 'Hoje já valeu a estrela. Volte amanhã!' + tail; return; }
    m1.textContent = (M.k + 1) + '/3 · ' + (M.phase === 'pick' ? 'Pegue ' + d.a.coisa + ' em ' + d.a.nome : 'Leve ' + d.a.coisa + ' até ' + d.b.nome);
    m2.textContent = (M.phase === 'drop' ? '⏱ ' + Math.ceil(M.t) + 's' : 'Sem pressa até pegar') + tail;
  }
  function burst(cx, cy, n) {
    for (var k = 0; k < n; k++) parts.push({ x: cx, y: cy, vx: (Math.random() - .5) * 220, vy: -60 - Math.random() * 200, l: 1.6 + Math.random(), c: ['#f28ba8', '#ffb3cc', '#8fb0f2', '#ffd86b'][k % 4], s: 5 + Math.random() * 6 });
  }
  function openCard(date, title, text, btn, ph, then) {
    paused = true; clearDirs(); afterCard = then || null;
    el('w-album').hidden = true;
    el('w-date').textContent = date; el('w-date').hidden = !date;
    el('w-ctitle').textContent = title; el('w-ctext').textContent = text; el('w-ok').textContent = btn || 'Continuar';
    var box = el('w-photos'); box.innerHTML = '';
    (ph || []).forEach(function (p) { if (urls[p]) { var im = document.createElement('img'); im.src = urls[p]; im.alt = ''; box.appendChild(im); } });
    box.hidden = !box.children.length;
    el('w-card').hidden = false; el('w-ok').focus();
  }
  el('w-ok').addEventListener('click', function () {
    el('w-card').hidden = true; var f = afterCard; afterCard = null;
    if (f) f(); else { paused = false; last = performance.now(); }
  });
  /* álbum das lembranças: as vencidas aparecem, as outras mostram em que dia abrem */
  function showAlbum() {
    paused = true; clearDirs(); var box = el('w-list'); box.innerHTML = '';
    MEMS.forEach(function (m, n) {
      var b = document.createElement('button'); b.type = 'button';
      if (n < S.stars) { b.textContent = m.t; b.addEventListener('click', function () { el('w-album').hidden = true; openCard(m.d, m.t, m.p, 'Voltar', m.ph, showAlbum); }); }
      else { b.textContent = '🔒 Abre no dia ' + (n + 1); b.disabled = true; }
      box.appendChild(b);
    });
    el('w-card').hidden = true; el('w-album').hidden = false;
  }
  el('w-tip').addEventListener('click', showAlbum);
  el('w-album-ok').addEventListener('click', function () { el('w-album').hidden = true; paused = false; last = performance.now(); });

  /* ---------- controles: joystick (toque e arraste em qualquer lugar da tela) ---------- */
  var joy = { x: 0, y: 0, on: false, id: null, ox: 0, oy: 0 }, keys = {};
  var joyEl = el('w-joy'), knob = el('w-knob'), JR = 52;
  function joyHome() { var r = el('w-stage').getBoundingClientRect(); joyEl.style.left = '76px'; joyEl.style.top = (r.height - 192) + 'px'; knob.style.transform = 'translate(-50%,-50%)'; }
  function clearDirs() { joy.x = joy.y = 0; joy.on = false; joy.id = null; keys = {}; joyEl.classList.remove('on'); if (running) joyHome(); }
  function joyMove(e) {
    var dx = e.clientX - joy.ox, dy = e.clientY - joy.oy, d = Math.hypot(dx, dy), k = d > JR ? JR / d : 1;
    knob.style.transform = 'translate(calc(-50% + ' + dx * k + 'px), calc(-50% + ' + dy * k + 'px))';
    var m = Math.min(1, d / JR);
    if (m < .18) { joy.x = joy.y = 0; } else { joy.x = dx / d * m; joy.y = dy / d * m; }
  }
  var stageEl = el('w-stage');
  stageEl.addEventListener('pointerdown', function (e) {
    if (paused || joy.on || e.target.closest('.w-tip, .w-card, .w-mission')) return;
    var r = stageEl.getBoundingClientRect(), lx = e.clientX - r.left, ly = e.clientY - r.top;
    if (lx > r.width * .6) return;
    /* o joystick fica sempre no lado esquerdo e na parte de baixo, perto do polegar */
    var cx = Math.max(76, Math.min(r.width * .38, lx)), cy = Math.max(r.height * .5, Math.min(r.height - 130, ly));
    joy.on = true; joy.id = e.pointerId; joy.ox = r.left + cx; joy.oy = r.top + cy;
    joyEl.style.left = cx + 'px'; joyEl.style.top = cy + 'px'; joyEl.classList.add('on');
    knob.style.transform = 'translate(-50%,-50%)';
    try { stageEl.setPointerCapture(e.pointerId); } catch (x) {}
    e.preventDefault();
  });
  stageEl.addEventListener('pointermove', function (e) { if (joy.on && e.pointerId === joy.id) joyMove(e); });
  ['pointerup', 'pointercancel'].forEach(function (n) { stageEl.addEventListener(n, function (e) { if (joy.on && e.pointerId === joy.id) clearDirs(); }); });
  var KM = { ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd', ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };
  document.addEventListener('keydown', function (e) { if (!running) return; if (e.key === 'Escape') { close(); return; } if (KM[e.key] && !paused) { keys[KM[e.key]] = 1; e.preventDefault(); } });
  document.addEventListener('keyup', function (e) { if (KM[e.key]) delete keys[KM[e.key]]; });

  /* ---------- jogo ---------- */
  var P = { x: START.x, y: START.y, face: 1, walk: 0, moving: false }, safe = { x: P.x, y: P.y }, inv = 0;
  function blocked(px, py) {
    var r = 8, pts = [[px - r, py - r + 6], [px + r, py - r + 6], [px - r, py + r], [px + r, py + r]];
    for (var k = 0; k < 4; k++) {
      var tx = Math.floor(pts[k][0] / TS), ty = Math.floor(pts[k][1] / TS);
      if (tx < 0 || ty < 0 || tx >= W || ty >= H || solid[ty][tx]) return true;
    }
    return false;
  }
  function near(s) { return Math.hypot(s.x * TS + 16 - P.x, s.y * TS + 16 - P.y) < 22; }
  function dropItem(msg) { if (M.phase === 'drop') { M.phase = 'pick'; M.t = 0; toast(msg); refreshHud(); } }

  function deliveryDone() {
    burst(cw / 2, ch / 2, 22);
    if (M.practice) { toast('Entrega feita! (treino, sem pontos)'); M.k = (M.k + 1) % 3; if (!M.k) dels = makeDeliveries((Math.random() * 1e9) | 0); M.phase = 'pick'; refreshHud(); return; }
    var g = Pt() && Pt().earn('mundo', 5, 60);
    S.k++; save();
    if (S.k >= 3) { dayWon(g); return; }
    M.k = S.k; M.phase = 'pick'; toast('Entrega feita!' + (g ? ' +' + g + ' pontos' : '') + ' Próxima.'); refreshHud();
  }
  function dayWon(gain) {
    S.doneToday = true; var today = dayStr();
    S.streak = S.lastStar === dayStr(-1) ? S.streak + 1 : 1; S.lastStar = today;
    var n = S.stars; S.stars = Math.min(S.stars + 1, MEMS.length); save();
    var bonus = Pt() ? Pt().earn('mundo', 25, 60) : 0;
    burst(cw / 2, ch / 2, 60); refreshHud();
    if (n >= MEMS.length) { startPractice(); return; }
    var m = MEMS[n];
    openCard((m.d ? m.d + ' · ' : '') + 'Estrela ' + (n + 1) + ' de ' + MEMS.length + ' · lembrança desbloqueada' + (bonus ? ' · +' + bonus + ' pontos' : ''), m.t, m.p, S.stars >= MEMS.length ? 'Ir até o Fefe' : 'Voltar amanhã tem mais', m.ph, function () {
      paused = false; last = performance.now(); startPractice(); toast(S.stars >= MEMS.length ? 'O Fefe te espera na praça!' : 'Amanhã tem uma missão mais difícil.');
    });
  }
  function startPractice() { M.practice = true; dels = makeDeliveries((Math.random() * 1e9) | 0); M.k = 0; M.phase = 'pick'; refreshHud(); }

  function update(dt) {
    var dx = joy.x + (keys.r ? 1 : 0) - (keys.l ? 1 : 0), dy = joy.y + (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
    P.moving = !!(dx || dy);
    if (P.moving) {
      var len = Math.hypot(dx, dy), sp = 112 * Math.min(1, len) * dt; dx = dx / len * sp; dy = dy / len * sp;
      if (dx > 0) P.face = 1; else if (dx < 0) P.face = -1;
      if (!blocked(P.x + dx, P.y)) P.x += dx;
      if (!blocked(P.x, P.y + dy)) P.y += dy;
      P.walk += dt * 10;
    }
    var ptx = Math.floor(P.x / TS), pty = Math.floor(P.y / TS);
    if (tile[pty] && tile[pty][ptx] !== RD) { safe.x = P.x; safe.y = P.y; }
    cars.forEach(function (c) {
      c.pos += c.s * c.v * dt;
      var lim = (c.h ? W : H) * TS + 60;
      if (c.pos > lim) c.pos = -60; if (c.pos < -60) c.pos = lim;
    });
    inv = Math.max(0, inv - dt);
    if (!inv) {
      var pb = { x: P.x - 7, y: P.y - 4, w: 14, h: 12 };
      for (var k = 0; k < cars.length; k++) {
        var b = carBox(cars[k]);
        if (pb.x < b.x + b.w && pb.x + pb.w > b.x && pb.y < b.y + b.h && pb.y + pb.h > b.y) {
          P.x = safe.x; P.y = safe.y; inv = 1.2; burst(cw / 2, ch / 2, 10);
          if (M.phase === 'drop') dropItem('Ai! Você derrubou o pedido. Pegue de novo.'); else toast('Ai! Cuidado com os carros.');
          break;
        }
      }
    }
    var waiting = S.stars >= MEMS.length && !S.final;
    if (waiting && Math.hypot(FEFE.x - P.x, FEFE.y - P.y) < 26) {
      S.final = true; save(); burst(cw / 2, ch / 2, 70);
      openCard('', 'Você me achou! 💙', FINAL_TXT, 'Continuar passeando', null, function () { paused = false; last = performance.now(); startPractice(); });
      return;
    }
    var d = cur();
    if (d && !waiting) {
      if (M.phase === 'pick' && near(d.a)) { M.phase = 'drop'; M.t = tmax(); toast('Pegou ' + d.a.coisa + '! Corra até ' + d.b.nome + '.'); refreshHud(); }
      else if (M.phase === 'drop' && near(d.b)) { deliveryDone(); }
      else if (M.phase === 'drop') { var before = Math.ceil(M.t); M.t -= dt; if (M.t <= 0) dropItem('Acabou o tempo! Pegue de novo.'); else if (Math.ceil(M.t) !== before) refreshHud(); }
    }
    toastT -= dt; if (toastT <= 0) el('w-toast').hidden = true;
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; p.l -= dt; });
    parts = parts.filter(function (p) { return p.l > 0; });
  }

  /* ---------- desenho dos elementos que se mexem ---------- */
  function heartPath(g, cx, cy, s) {
    g.beginPath(); g.moveTo(cx, cy + s * .9);
    g.bezierCurveTo(cx - s * 1.5, cy - s * .1, cx - s * .8, cy - s * 1.1, cx, cy - s * .35);
    g.bezierCurveTo(cx + s * .8, cy - s * 1.1, cx + s * 1.5, cy - s * .1, cx, cy + s * .9); g.closePath();
  }
  function person(g, x, y, o) {
    var bob = o.moving ? Math.sin(o.walk) * 1.6 : Math.sin(o.t * 2) * .6, f = o.face || 1;
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(x, y + 11, 8, 3.2, 0, 0, 7); g.fill();
    var leg = o.moving ? Math.sin(o.walk) * 3 : 0;
    g.fillStyle = o.legs; g.fillRect(x - 4 + leg * .4, y + 4, 3, 7); g.fillRect(x + 1 - leg * .4, y + 4, 3, 7);
    g.fillStyle = o.body; rr(g, x - 6, y - 6 + bob, 12, 12, 4); g.fill();
    if (o.dress) { g.beginPath(); g.moveTo(x - 6, y + 1 + bob); g.lineTo(x - 9, y + 8 + bob); g.lineTo(x + 9, y + 8 + bob); g.lineTo(x + 6, y + 1 + bob); g.fill(); }
    g.fillStyle = o.hair; g.beginPath(); g.arc(x, y - 11 + bob, 7.2, 0, 7); g.fill();
    if (o.long) { g.fillRect(x - 7.2, y - 11 + bob, 3.6, 12); g.fillRect(x + 3.6, y - 11 + bob, 3.6, 12); }
    g.fillStyle = '#f6d3b8'; g.beginPath(); g.arc(x + f * .6, y - 10 + bob, 5.6, 0, 7); g.fill();
    g.fillStyle = o.hair; g.beginPath(); g.arc(x + f * .6, y - 13.2 + bob, 5.6, Math.PI, 0); g.fill();
    g.fillStyle = '#3a2230'; g.fillRect(x + f * .6 - 2.4, y - 10 + bob, 1.4, 1.8); g.fillRect(x + f * .6 + 1, y - 10 + bob, 1.4, 1.8);
    if (o.bow) { g.fillStyle = '#f28ba8'; g.beginPath(); g.arc(x - 4, y - 16 + bob, 2.4, 0, 7); g.arc(x - 1, y - 16 + bob, 2.4, 0, 7); g.fill(); }
  }
  function drawCar(g, c) {
    var b = carBox(c);
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, b.x + 2, b.y + 3, b.w, b.h, 6); g.fill();
    g.fillStyle = c.c; rr(g, b.x, b.y, b.w, b.h, 6); g.fill();
    g.fillStyle = 'rgba(40,60,90,.65)';
    if (c.h) g.fillRect(b.x + (c.s > 0 ? 24 : 8), b.y + 3, 12, b.h - 6); else g.fillRect(b.x + 3, b.y + (c.s > 0 ? 24 : 8), b.w - 6, 12);
    g.fillStyle = '#fff3a8';
    if (c.h) { var hx = c.s > 0 ? b.x + b.w - 3 : b.x; g.fillRect(hx, b.y + 3, 3, 4); g.fillRect(hx, b.y + b.h - 7, 3, 4); }
    else { var hy = c.s > 0 ? b.y + b.h - 3 : b.y; g.fillRect(b.x + 3, hy, 4, 3); g.fillRect(b.x + b.w - 7, hy, 4, 3); }
  }
  function marker(g, s, t, txt, col) {
    var cx = s.x * TS + 16, cy = s.y * TS + 16, pr = 1 + Math.sin(t * 5) * .15;
    var gr = g.createRadialGradient(cx, cy, 2, cx, cy, 24 * pr);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,214,107,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 24 * pr, 0, 7); g.fill();
    g.font = '18px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, cx, cy - 14 + Math.sin(t * 4) * 3);
    g.fillStyle = '#ffd86b'; g.beginPath(); g.moveTo(cx - 5, cy + 2 + Math.sin(t * 4) * 2); g.lineTo(cx + 5, cy + 2 + Math.sin(t * 4) * 2); g.lineTo(cx, cy + 9 + Math.sin(t * 4) * 2); g.fill();
  }
  function render(ts) {
    var t = ts / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#1a1030'; ctx.fillRect(0, 0, cw, ch);
    var vw = cw / zoom, vh = ch / zoom, wx = W * TS, wy = H * TS;
    var camX = wx <= vw ? (wx - vw) / 2 : Math.max(0, Math.min(wx - vw, P.x - vw / 2));
    var padT = 78 / zoom, padB = 190 / zoom, minY = -padT, maxY = wy - vh + padB;
    var camY = minY > maxY ? (wy - vh) / 2 : Math.max(minY, Math.min(maxY, P.y - vh * .45));
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -camX * zoom * dpr, -camY * zoom * dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(stat, 0, 0, wx, wy);
    cars.forEach(function (c) { drawCar(ctx, c); });
    var d = cur(), waiting = S.stars >= MEMS.length && !S.final;
    if (d && !waiting) { if (M.phase === 'pick') marker(ctx, d.a, t, d.a.item, 'rgba(255,214,107,.8)'); else marker(ctx, d.b, t, d.a.item, 'rgba(143,176,242,.85)'); }
    if (waiting) {
      var fx = FEFE.x, fy = FEFE.y, pr = 1 + Math.sin(t * 4) * .12, g2 = ctx.createRadialGradient(fx, fy, 4, fx, fy, 34 * pr);
      g2.addColorStop(0, 'rgba(143,176,242,.8)'); g2.addColorStop(1, 'rgba(143,176,242,0)');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(fx, fy, 34 * pr, 0, 7); ctx.fill();
      person(ctx, fx, fy, { t: t, face: -1, body: '#4f6fb3', legs: '#33415c', hair: '#3a2a22' });
      ctx.fillStyle = '#e8648f'; heartPath(ctx, fx, fy - 30 + Math.sin(t * 3) * 2, 5); ctx.fill();
    } else if (S.final) {
      person(ctx, FEFE.x, FEFE.y, { t: t, face: -1, body: '#4f6fb3', legs: '#33415c', hair: '#3a2a22' });
    }
    if (!(inv > 0 && Math.floor(t * 14) % 2)) {
      person(ctx, P.x, P.y, { t: t, moving: P.moving, walk: P.walk, face: P.face, body: '#f28ba8', dress: true, legs: '#f6d3b8', hair: '#4a2c1e', long: true, bow: true });
      if (M.phase === 'drop' && d) { ctx.font = '16px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.a.item, P.x, P.y - 28); }
    }
    /* noite: escurece e deixa só as luzes acesas */
    if (!nc) nc = document.createElement('canvas');
    if (nc.width !== canvas.width || nc.height !== canvas.height) { nc.width = canvas.width; nc.height = canvas.height; }
    var ng = nc.getContext('2d');
    ng.globalCompositeOperation = 'source-over'; ng.setTransform(1, 0, 0, 1, 0, 0); ng.clearRect(0, 0, nc.width, nc.height);
    ng.fillStyle = 'rgba(20,10,46,.62)'; ng.fillRect(0, 0, nc.width, nc.height);
    ng.setTransform(dpr * zoom, 0, 0, dpr * zoom, -camX * zoom * dpr, -camY * zoom * dpr);
    ng.globalCompositeOperation = 'destination-out';
    function hole(hx, hy, rad, a) { var q = ng.createRadialGradient(hx, hy, 2, hx, hy, rad); q.addColorStop(0, 'rgba(0,0,0,' + a + ')'); q.addColorStop(1, 'rgba(0,0,0,0)'); ng.fillStyle = q; ng.beginPath(); ng.arc(hx, hy, rad, 0, 7); ng.fill(); }
    lamps.forEach(function (l) { hole(l[0] * TS + 16, l[1] * TS + 2, 80, .95); });
    hole(P.x, P.y - 4, 76, .95);
    hole(6 * TS + 16, 7 * TS + 16, 70, .8); hole(CHURCH.x * TS + CHURCH.w * TS / 2, 3 * TS, 90, .6);
    hole((REST.x + REST.w / 2) * TS, (REST.y + 4) * TS, 90, .75); hole((BAK.x + BAK.w / 2) * TS, (BAK.y + 4) * TS, 90, .75);
    if (d && !waiting) { var sp = M.phase === 'pick' ? d.a : d.b; hole(sp.x * TS + 16, sp.y * TS + 16, 56, .9); }
    ng.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(nc, 0, 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -camX * zoom * dpr, -camY * zoom * dpr);
    lamps.forEach(function (l) { var q = ctx.createRadialGradient(l[0] * TS + 16, l[1] * TS + 2, 1, l[0] * TS + 16, l[1] * TS + 2, 56); q.addColorStop(0, 'rgba(255,190,110,.32)'); q.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = q; ctx.beginPath(); ctx.arc(l[0] * TS + 16, l[1] * TS + 2, 56, 0, 7); ctx.fill(); });
    ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* seta na borda da tela apontando para o destino, quando ele está fora de vista */
    var tg = waiting ? { x: FEFE.x, y: FEFE.y } : d ? (function () { var q = M.phase === 'pick' ? d.a : d.b; return { x: q.x * TS + 16, y: q.y * TS + 16 }; })() : null;
    if (tg) {
      var sx = (tg.x - camX) * zoom, sy = (tg.y - camY) * zoom, mg = 26, top = 84, bot = ch - 196;
      if (sx < 0 || sy < top || sx > cw || sy > bot) {
        var cx0 = cw / 2, cy0 = (top + bot) / 2, ang = Math.atan2(sy - cy0, sx - cx0), k2 = Math.min((cw / 2 - mg) / Math.abs(Math.cos(ang) || 1e-6), ((bot - top) / 2 - mg) / Math.abs(Math.sin(ang) || 1e-6));
        var ax = cx0 + Math.cos(ang) * k2, ay = cy0 + Math.sin(ang) * k2;
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang); ctx.fillStyle = '#ffd86b'; ctx.strokeStyle = 'rgba(18,10,34,.8)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-3, 0); ctx.lineTo(-8, 10); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
      }
    }
    parts.forEach(function (p) { ctx.globalAlpha = Math.min(1, p.l); ctx.fillStyle = p.c; heartPath(ctx, p.x, p.y, p.s * .5); ctx.fill(); });
    ctx.globalAlpha = 1;
  }

  function loop(ts) {
    if (!running) return;
    var dt = Math.min(.05, (ts - last) / 1000); last = ts;
    if (!paused) update(dt); else { parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; p.l -= dt; }); parts = parts.filter(function (p) { return p.l > 0; }); }
    render(ts);
    requestAnimationFrame(loop);
  }

  function open() {
    if (!stat) stat = buildStatic();
    loadPhotos();
    startDay(); makeCars();
    P.x = START.x; P.y = START.y; safe.x = P.x; safe.y = P.y; inv = 0;
    root.hidden = false; document.body.style.overflow = 'hidden'; running = true; paused = false;
    resize(); refreshHud(); clearDirs(); joyHome();
    var t, b, txt;
    if (S.stars >= MEMS.length && !S.final) { t = 'O Fefe está te esperando'; b = 'Ir até a praça'; txt = 'Você abriu todas as lembranças. Ele está perto da fonte da praça.'; }
    else if (S.doneToday) { t = 'Hoje já valeu a estrela ★'; b = 'Treinar um pouco'; txt = 'Volte amanhã para a próxima lembrança. Enquanto isso, pode treinar sem ganhar pontos.'; }
    else { t = S.stars ? 'Dia ' + (S.stars + 1) + ' na Vila' : 'Bem-vinda à Vila Camilópolis'; b = 'Vamos lá'; txt = '3 entregas pelo bairro, uma depois da outra. Pegue o pedido, leve até o destino antes que o tempo acabe e cuidado com os carros. Cada dia vencido abre uma lembrança nossa e rende pontos para os vales.'; }
    openCard('', t, txt, b, null);
    last = performance.now(); requestAnimationFrame(loop);
  }
  function close() { running = false; root.hidden = true; document.body.style.overflow = ''; clearDirs(); el('w-card').hidden = true; el('w-album').hidden = true; }
  openBtn.addEventListener('click', open);
  el('w-exit').addEventListener('click', close);
})();
