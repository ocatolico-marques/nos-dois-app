/* Vila Camilópolis: um mundinho 2D para passear e achar as lembranças escondidas. */
(function () {
  'use strict';
  var openBtn = document.getElementById('mundo-open');
  if (!openBtn) return;

  var TS = 32, W = 32, H = 36, SC = 2, VIEW_TILES = 11;
  var KEY = 'mundo-camilopolis-v1';

  /* ---------- lembranças (as mesmas da linha do tempo) ---------- */
  var MEMS = [
    { x: 6, y: 4, t: 'Tudo começou na paróquia', d: '', p: 'Frequentávamos a mesma paróquia. Foi ali que a nossa história começou.' },
    { x: 6, y: 9, t: 'O dia que saímos pela primeira vez', d: '26 de janeiro de 2025', p: 'A primeira vez que a gente saiu juntos.' },
    { x: 11, y: 19, t: 'O dia em que ficamos pela primeira vez', d: '1 de junho de 2025', p: 'Um dia que a gente nunca mais esqueceu.' },
    { x: 21, y: 20, t: 'O pedido de namoro', d: '', p: 'Foi no Via Fico.' },
    { x: 29, y: 8, t: 'Começamos a namorar', d: '1 de novembro de 2025', p: 'E dali em diante a gente virou nós dois.' },
    { x: 27, y: 33, t: 'Desde então', d: '', p: 'Já viajamos juntos, vivemos momentos incríveis, brigamos, demos risadas, e seguimos um ao lado do outro.' }
  ];
  var FEFE = { x: 8.5, y: 8.5 };
  var START = { x: 13.5, y: 29.5 };

  /* ---------- mapa ---------- */
  var G = 0, SW = 1, RD = 2, PV = 3, WT = 4, TR = 5;
  var tile = [], solid = [];
  var x, y;
  for (y = 0; y < H; y++) { tile.push([]); solid.push([]); for (x = 0; x < W; x++) { tile[y].push(G); solid[y].push(false); } }
  var ROWS = [12, 13, 26, 27], COLS = [14, 15];
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

  /* praça: caminhos de pedra em cruz */
  fillTile(1, 7, 12, 1, PV); fillTile(6, 4, 1, 7, PV); fillTile(5, 6, 3, 3, PV);
  /* lago */
  var lake = [];
  for (y = 16; y <= 22; y++) for (x = 2; x <= 9; x++) {
    var ex = (x - 5.5) / 4.2, ey = (y - 19) / 3.6;
    if (ex * ex + ey * ey <= 1) { tile[y][x] = WT; solid[y][x] = true; lake.push([x, y]); }
  }
  /* terraço do restaurante */
  fillTile(18, 19, 7, 2, TR);

  /* construções */
  var houses = [
    [17, 1, 4, 3, '#f7d9a8', '#c8553d'], [23, 1, 4, 3, '#cfe3f5', '#4f6fb3'], [28, 1, 3, 3, '#f9c9d4', '#a8456a'],
    [17, 6, 4, 3, '#d9efc9', '#5c8f4a'], [23, 6, 4, 3, '#fbe3b0', '#d17a3b'],
    [27, 15, 4, 3, '#e4d4f2', '#7d57a8'],
    [17, 22, 4, 3, '#cfe3f5', '#c8553d'], [23, 22, 4, 3, '#f7d9a8', '#4f6fb3'], [28, 22, 3, 3, '#d9efc9', '#a8456a'],
    [1, 30, 4, 3, '#fbe3b0', '#4f6fb3'], [7, 30, 4, 3, '#f9c9d4', '#5c8f4a'], [17, 30, 4, 3, '#cfe3f5', '#d17a3b'],
    [1, 34, 4, 2, '#e4d4f2', '#c8553d'], [7, 34, 4, 2, '#f7d9a8', '#7d57a8']
  ];
  houses.forEach(function (h) { fillSolid(h[0], h[1], h[2], h[3]); });
  var CHURCH = { x: 3, y: 0, w: 7, h: 4 }; fillSolid(CHURCH.x, CHURCH.y, CHURCH.w, CHURCH.h);
  var REST = { x: 18, y: 15, w: 7, h: 4 }; fillSolid(REST.x, REST.y, REST.w, REST.h);
  var BUS = { x: 25, y: 31, w: 5, h: 2 }; fillSolid(BUS.x, BUS.y, BUS.w, BUS.h);
  fillSolid(6, 7, 1, 1); /* fonte */
  var benches = [[3, 8], [9, 8], [3, 6], [9, 6]];
  benches.forEach(function (b) { solid[b[1]][b[0]] = true; });
  var trees = [
    [1, 4], [11, 4], [1, 9], [11, 9], [2, 2], [12, 1], [12, 6], [1, 6], [4, 10], [8, 10],
    [1, 16], [1, 19], [1, 22], [11, 16], [11, 22], [4, 24], [7, 24], [2, 24], [10, 24], [12, 19], [5, 15], [8, 15],
    [28, 5], [30, 5], [28, 10], [30, 10], [16, 10], [22, 10],
    [17, 17], [26, 21], [16, 24], [30, 20], [27, 29], [30, 29], [22, 33], [13, 31], [13, 34], [24, 34], [12, 33]
  ];
  trees.forEach(function (t) { if (tile[t[1]][t[0]] === G) solid[t[1]][t[0]] = true; });
  var lamps = [[13,2],[13,8],[13,17],[13,22],[13,32],[16,3],[16,8],[16,18],[16,24],[16,33],[4,11],[9,11],[20,11],[26,11],[5,14],[22,14],[5,25],[10,25],[20,25],[27,25],[4,28],[9,28],[21,28],[27,28]];
  /* nada pode bloquear as lembranças ou o ponto de partida */
  MEMS.forEach(function (m) { solid[m.y][m.x] = false; });

  /* ---------- aleatório fixo (o mapa é sempre igual) ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- desenho do cenário (uma vez só) ---------- */
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
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(px - 2, py + roofH - 1, w + 4, 3);
    var wy = py + roofH + 7, wc = Math.max(1, Math.floor(h[2] / 2));
    g.fillStyle = '#ffd98a';
    for (var q = 0; q < wc; q++) { if (q === Math.floor(wc / 2) && wc > 1) continue; g.fillRect(px + 8 + q * (w - 24) / Math.max(wc - 1, 1) * (wc > 1 ? 1 : 0), wy, 12, 10); }
    g.fillStyle = '#7a4a2c'; rr(g, px + w / 2 - 6, py + ht - 17, 12, 17, 3); g.fill();
    g.fillStyle = '#f6c34a'; g.beginPath(); g.arc(px + w / 2 + 3, py + ht - 8, 1.2, 0, 7); g.fill();
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
  function drawRest(g) {
    var px = REST.x * TS, py = REST.y * TS, w = REST.w * TS, ht = REST.h * TS;
    g.fillStyle = 'rgba(0,0,0,.2)'; rr(g, px + 4, py + 6, w, ht, 5); g.fill();
    g.fillStyle = '#fbe9d6'; rr(g, px, py, w, ht, 5); g.fill();
    g.fillStyle = '#7a1f3d'; rr(g, px - 3, py - 3, w + 6, 52, 7); g.fill();
    for (var s = 0; s < 14; s++) { g.fillStyle = s % 2 ? '#fff3ee' : '#c94f73'; g.fillRect(px + s * (w / 14), py + 49, w / 14, 14); }
    g.fillStyle = '#ffd98a'; g.fillRect(px + 14, py + 74, 40, 34); g.fillRect(px + w - 54, py + 74, 40, 34);
    g.fillStyle = '#6b3f26'; rr(g, px + w / 2 - 14, py + 72, 28, 56, 4); g.fill();
    g.fillStyle = '#f6c34a'; g.beginPath(); g.arc(px + w / 2 + 8, py + 100, 2, 0, 7); g.fill();
    g.font = 'italic 500 22px Fraunces, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#fff3ee'; g.fillText('Via Fico', px + w / 2, py + 24);
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
    var cols = ['#3f9a52', '#4cae5e', '#68c476'];
    g.fillStyle = cols[0]; g.beginPath(); g.arc(cx, cy - 4, 18 + r * 2, 0, 7); g.fill();
    g.fillStyle = cols[1]; g.beginPath(); g.arc(cx - 3, cy - 7, 13 + r * 2, 0, 7); g.fill();
    g.fillStyle = cols[2]; g.beginPath(); g.arc(cx - 6, cy - 10, 6, 0, 7); g.fill();
  }
  function buildStatic() {
    var c = document.createElement('canvas'); c.width = W * TS * SC; c.height = H * TS * SC;
    var g = c.getContext('2d'); g.scale(SC, SC);
    var r = rng(7);
    for (var b = 0; b < H; b++) for (var a = 0; a < W; a++) {
      var t = tile[b][a], px = a * TS, py = b * TS;
      if (t === G) { g.fillStyle = (a + b) % 2 ? '#a5d98a' : '#9ed383'; g.fillRect(px, py, TS, TS); }
      else if (t === SW) { g.fillStyle = '#ece3da'; g.fillRect(px, py, TS, TS); g.strokeStyle = 'rgba(0,0,0,.07)'; g.strokeRect(px + .5, py + .5, TS - 1, TS - 1); }
      else if (t === RD) { g.fillStyle = '#5d6170'; g.fillRect(px, py, TS, TS); }
      else if (t === PV) { g.fillStyle = '#f2dcc4'; g.fillRect(px, py, TS, TS); g.strokeStyle = 'rgba(160,110,80,.22)'; g.strokeRect(px + .5, py + .5, TS - 1, TS - 1); }
      else if (t === WT) { g.fillStyle = '#6cc3e8'; g.fillRect(px, py, TS, TS); }
      else if (t === TR) { g.fillStyle = (a + b) % 2 ? '#f8d3c2' : '#f3c4b1'; g.fillRect(px, py, TS, TS); }
    }
    /* faixas das ruas */
    g.fillStyle = 'rgba(255,243,238,.85)';
    for (b = 0; b < H; b++) for (a = 0; a < W; a++) {
      if (tile[b][a] !== RD) continue;
      var h1 = ROWS.indexOf(b) > -1, v1 = COLS.indexOf(a) > -1;
      if (h1 && !v1 && (b === 13 || b === 27 ? false : true)) { /* borda entre as duas pistas fica em b+1 */ g.fillRect(a * TS + 4, (b + 1) * TS - 1.5, 16, 3); }
      if (v1 && !h1 && a === 14) { g.fillRect((a + 1) * TS - 1.5, b * TS + 4, 3, 16); }
    }
    /* lago: brilho e margem */
    g.strokeStyle = '#8ea86a'; g.lineWidth = 3;
    lake.forEach(function (p) {
      [[0, -1, 0, 0, 1, 0], [0, 1, 0, 1, 1, 1], [-1, 0, 0, 0, 0, 1], [1, 0, 1, 0, 1, 1]].forEach(function (d) {
        var nx = p[0] + d[0], ny = p[1] + d[1];
        if (tile[ny][nx] !== WT) { g.beginPath(); g.moveTo((p[0] + d[2]) * TS, (p[1] + d[3]) * TS); g.lineTo((p[0] + d[4]) * TS, (p[1] + d[5]) * TS); g.stroke(); }
      });
    });
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5;
    for (var k = 0; k < 18; k++) { var p = lake[Math.floor(r() * lake.length)]; var wx = p[0] * TS + 6 + r() * 16, wy = p[1] * TS + 8 + r() * 16; g.beginPath(); g.moveTo(wx, wy); g.quadraticCurveTo(wx + 4, wy - 3, wx + 8, wy); g.stroke(); }
    /* florzinhas */
    for (k = 0; k < 220; k++) {
      var fx = Math.floor(r() * W), fy = Math.floor(r() * H);
      if (tile[fy][fx] !== G || solid[fy][fx]) continue;
      g.fillStyle = ['#fff3ee', '#f28ba8', '#ffd86b', '#b9a3f0'][Math.floor(r() * 4)];
      g.beginPath(); g.arc(fx * TS + 4 + r() * 24, fy * TS + 4 + r() * 24, 1.6, 0, 7); g.fill();
    }
    /* fonte */
    var fx0 = 6 * TS + 16, fy0 = 7 * TS + 16;
    g.fillStyle = '#d9c7b0'; g.beginPath(); g.arc(fx0, fy0, 21, 0, 7); g.fill();
    g.fillStyle = '#6cc3e8'; g.beginPath(); g.arc(fx0, fy0, 16, 0, 7); g.fill();
    g.fillStyle = '#e8f7ff'; g.beginPath(); g.arc(fx0, fy0, 6, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.arc(fx0, fy0, 11, 0, 7); g.stroke();
    /* bancos */
    benches.forEach(function (bn) { g.fillStyle = '#8a5a3a'; rr(g, bn[0] * TS + 3, bn[1] * TS + 9, 26, 14, 3); g.fill(); g.fillStyle = '#a8734d'; g.fillRect(bn[0] * TS + 3, bn[1] * TS + 9, 26, 5); });
    /* mesinhas do terraço */
    [[19, 19], [21, 19], [23, 19], [20, 20], [22, 20]].forEach(function (m) {
      var mx = m[0] * TS + 16, my = m[1] * TS + 18;
      g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(mx + 2, my + 3, 11, 7, 0, 0, 7); g.fill();
      g.fillStyle = '#fff3ee'; g.beginPath(); g.arc(mx, my, 9, 0, 7); g.fill();
      g.fillStyle = '#c94f73'; g.beginPath(); g.arc(mx, my, 3, 0, 7); g.fill();
    });
    houses.forEach(function (h) { drawHouse(g, h); });
    drawChurch(g); drawRest(g); drawBus(g);
    trees.forEach(function (t, n) { if (tile[t[1]][t[0]] === G) drawTree(g, t[0], t[1], n % 3 * .5); });
    lamps.forEach(function (l) { var lx = l[0] * TS + 16, ly = l[1] * TS + 16; g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(lx + 2, ly + 10, 6, 2.5, 0, 0, 7); g.fill(); g.fillStyle = '#3a2a3e'; g.fillRect(lx - 1.5, ly - 12, 3, 22); g.fillStyle = '#ffd98a'; g.beginPath(); g.arc(lx, ly - 14, 4.2, 0, 7); g.fill(); });
    label(g, 'Paróquia São Francisco de Léllis', 6.5 * TS, 4 * TS + 10);
    label(g, 'Praça São Camilo', 6.5 * TS, 10 * TS + 6);
    label(g, 'Parque', 5.5 * TS, 15 * TS + 10);
    label(g, 'Viagens', 27.5 * TS, 30 * TS + 14);
    return c;
  }

  /* ---------- estado ---------- */
  var found = [], done = false;
  try { var sv = JSON.parse(localStorage.getItem(KEY) || '{}'); found = sv.found || []; done = !!sv.done; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ found: found, done: done })); } catch (e) {} }

  var P = { x: START.x * TS, y: START.y * TS, face: 1, walk: 0, moving: false }, safe = { x: P.x, y: P.y }, inv = 0;
  var dir = { u: 0, d: 0, l: 0, r: 0 }, keys = {};
  var cars = [];
  [[12, 1, 0, 70, '#e8648f'], [12, 1, 20, 95, '#f2b441'], [13, -1, 8, 85, '#4f6fb3'], [13, -1, 24, 65, '#fff3ee'],
   [26, 1, 4, 80, '#7d57a8'], [26, 1, 22, 100, '#5c8f4a'], [27, -1, 14, 75, '#c8553d'], [27, -1, 28, 90, '#f2b441']].forEach(function (c) {
    cars.push({ h: true, lane: c[0], s: c[1], pos: c[2] * TS, v: c[3], c: c[4] });
  });
  [[14, 1, 6, 80, '#c94f73'], [14, 1, 24, 70, '#4f6fb3'], [15, -1, 10, 90, '#f2b441'], [15, -1, 30, 75, '#fff3ee']].forEach(function (c) {
    cars.push({ h: false, lane: c[0], s: c[1], pos: c[2] * TS, v: c[3], c: c[4] });
  });
  cars.forEach(function (c) { c.len = 44; });
  function carBox(c) {
    var along = c.pos, across = (c.lane + .5) * TS;
    return c.h ? { x: along - 22, y: across - 11, w: 44, h: 22 } : { x: across - 11, y: along - 22, w: 22, h: 44 };
  }

  /* ---------- tela ---------- */
  var root = document.createElement('div');
  root.id = 'world'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Vila Camilópolis');
  root.innerHTML =
    '<div class="w-bar"><button type="button" class="w-exit" id="w-exit">Sair</button><div class="w-title">Vila Camilópolis</div><div class="w-count" id="w-count">0/6</div></div>' +
    '<div class="w-stage" id="w-stage"><canvas id="w-canvas"></canvas>' +
    '<div class="w-toast" id="w-toast" hidden></div>' +
    '<div class="w-hint" id="w-hint"></div>' +
    '<div class="w-pad" id="w-pad"><button type="button" data-d="u" aria-label="Cima">▲</button><button type="button" data-d="l" aria-label="Esquerda">◀</button><button type="button" data-d="r" aria-label="Direita">▶</button><button type="button" data-d="d" aria-label="Baixo">▼</button></div>' +
    '<button type="button" class="w-tip" id="w-tip">Dica</button>' +
    '<div class="w-card" id="w-card" hidden><p class="w-date" id="w-date"></p><h3 id="w-ctitle"></h3><p id="w-ctext"></p><button type="button" id="w-ok">Continuar</button></div></div>';
  document.body.appendChild(root);
  var el = function (id) { return document.getElementById(id); };
  var canvas = el('w-canvas'), ctx = canvas.getContext('2d');
  var nc = null, cw = 0, ch = 0, dpr = 1, zoom = 1, running = false, paused = false, last = 0, parts = [], toastT = 0;

  function resize() {
    var st = el('w-stage'), r = st.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2); cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    zoom = cw / (VIEW_TILES * TS);
  }
  window.addEventListener('resize', function () { if (running) resize(); });

  function toast(msg) { var t = el('w-toast'); t.textContent = msg; t.hidden = false; toastT = 2.6; }
  function refreshHud() {
    el('w-count').textContent = found.length + '/' + MEMS.length;
    el('w-hint').textContent = found.length === MEMS.length ? (done ? 'Passeie à vontade. Você já achou tudo.' : 'Achou todas! O Fefe está te esperando na Praça São Camilo.') : 'Ache as ' + MEMS.length + ' lembranças brilhando pelo bairro.';
  }
  function burst(cx, cy, n) {
    for (var k = 0; k < n; k++) parts.push({ x: cx, y: cy, vx: (Math.random() - .5) * 220, vy: -60 - Math.random() * 200, l: 1.6 + Math.random(), c: ['#f28ba8', '#ffb3cc', '#8fb0f2', '#ffd86b'][k % 4], s: 5 + Math.random() * 6 });
  }
  function openCard(date, title, text, btn) {
    paused = true; clearDirs();
    el('w-date').textContent = date; el('w-date').hidden = !date;
    el('w-ctitle').textContent = title; el('w-ctext').textContent = text; el('w-ok').textContent = btn || 'Continuar';
    el('w-card').hidden = false; el('w-ok').focus();
  }
  el('w-ok').addEventListener('click', function () { el('w-card').hidden = true; paused = false; last = performance.now(); });

  el('w-tip').addEventListener('click', function () {
    var tx, ty, name;
    if (found.length === MEMS.length) { tx = FEFE.x * TS; ty = FEFE.y * TS; name = 'O Fefe'; }
    else {
      var best = 1e9, m;
      MEMS.forEach(function (c, n) { if (found.indexOf(n) > -1) return; var d = Math.hypot(c.x * TS + 16 - P.x, c.y * TS + 16 - P.y); if (d < best) { best = d; m = c; } });
      tx = m.x * TS + 16; ty = m.y * TS + 16; name = 'Uma lembrança';
    }
    var dx = tx - P.x, dy = ty - P.y, d = Math.hypot(dx, dy) / TS, w;
    if (Math.abs(dx) > Math.abs(dy)) w = dx > 0 ? 'para a direita' : 'para a esquerda'; else w = dy > 0 ? 'para baixo' : 'para cima';
    toast(name + ' está ' + (d < 5 ? 'pertinho, ' : d < 12 ? 'a uma boa caminhada, ' : 'bem longe, ') + w + '.');
  });

  /* ---------- controles ---------- */
  function clearDirs() { dir.u = dir.d = dir.l = dir.r = 0; keys = {}; [].forEach.call(root.querySelectorAll('.w-pad button'), function (b) { b.classList.remove('on'); }); }
  [].forEach.call(root.querySelectorAll('.w-pad button'), function (b) {
    var d = b.dataset.d;
    function on(e) { e.preventDefault(); dir[d] = 1; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (x) {} }
    function off(e) { e.preventDefault(); dir[d] = 0; b.classList.remove('on'); }
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  });
  var KM = { ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd', ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };
  document.addEventListener('keydown', function (e) { if (!running) return; if (e.key === 'Escape') { close(); return; } if (KM[e.key] && !paused) { keys[KM[e.key]] = 1; e.preventDefault(); } });
  document.addEventListener('keyup', function (e) { if (KM[e.key]) delete keys[KM[e.key]]; });

  /* ---------- movimento ---------- */
  function blocked(px, py) {
    var r = 8, pts = [[px - r, py - r + 6], [px + r, py - r + 6], [px - r, py + r], [px + r, py + r]];
    for (var k = 0; k < 4; k++) {
      var tx = Math.floor(pts[k][0] / TS), ty = Math.floor(pts[k][1] / TS);
      if (tx < 0 || ty < 0 || tx >= W || ty >= H || solid[ty][tx]) return true;
    }
    return false;
  }
  function update(dt) {
    var dx = (dir.r || keys.r ? 1 : 0) - (dir.l || keys.l ? 1 : 0), dy = (dir.d || keys.d ? 1 : 0) - (dir.u || keys.u ? 1 : 0);
    P.moving = !!(dx || dy);
    if (P.moving) {
      var len = Math.hypot(dx, dy), sp = 112 * dt; dx = dx / len * sp; dy = dy / len * sp;
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
          P.x = safe.x; P.y = safe.y; inv = 1.2; toast('Ai! Cuidado com os carros.'); burst(cw / 2, ch / 2, 10); break;
        }
      }
    }
    /* lembranças */
    MEMS.forEach(function (m, n) {
      if (found.indexOf(n) > -1) return;
      if (Math.hypot(m.x * TS + 16 - P.x, m.y * TS + 16 - P.y) < 20) {
        found.push(n); save(); refreshHud(); burst(cw / 2, ch / 2, 26);
        openCard(m.d, m.t, m.p, found.length === MEMS.length ? 'Ir até o Fefe' : 'Continuar');
      }
    });
    if (found.length === MEMS.length && !done && Math.hypot(FEFE.x * TS - P.x, FEFE.y * TS - P.y) < 26) {
      done = true; save(); refreshHud();
      burst(cw / 2, ch / 2, 70);
      openCard('', 'Você me achou! 💙', 'Amôoo, peciso di voxê ati tumiduuu 💙 Feliz um ano nosso, minha flor. 💌', 'Continuar passeando');
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
    if (c.h) { g.fillRect(b.x + (c.s > 0 ? 24 : 8), b.y + 3, 12, b.h - 6); } else { g.fillRect(b.x + 3, b.y + (c.s > 0 ? 24 : 8), b.w - 6, 12); }
    g.fillStyle = '#fff3a8';
    if (c.h) { var hx = c.s > 0 ? b.x + b.w - 3 : b.x; g.fillRect(hx, b.y + 3, 3, 4); g.fillRect(hx, b.y + b.h - 7, 3, 4); }
    else { var hy = c.s > 0 ? b.y + b.h - 3 : b.y; g.fillRect(b.x + 3, hy, 4, 3); g.fillRect(b.x + b.w - 7, hy, 4, 3); }
  }
  function render(ts) {
    var t = ts / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#1a1030'; ctx.fillRect(0, 0, cw, ch);
    var vw = cw / zoom, vh = ch / zoom, wx = W * TS, wy = H * TS;
    var camX = wx <= vw ? (wx - vw) / 2 : Math.max(0, Math.min(wx - vw, P.x - vw / 2));
    var camY = wy <= vh ? (wy - vh) / 2 : Math.max(0, Math.min(wy - vh, P.y - vh / 2));
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -camX * zoom * dpr, -camY * zoom * dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(stat, 0, 0, wx, wy);
    /* lembranças */
    MEMS.forEach(function (m, n) {
      var cx = m.x * TS + 16, cy = m.y * TS + 16, got = found.indexOf(n) > -1;
      if (got) { ctx.globalAlpha = .45; ctx.fillStyle = '#ffb3cc'; heartPath(ctx, cx, cy, 5); ctx.fill(); ctx.globalAlpha = 1; return; }
      var pulse = 1 + Math.sin(t * 4 + n) * .14;
      var gr = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26 * pulse);
      gr.addColorStop(0, 'rgba(255,214,107,.85)'); gr.addColorStop(1, 'rgba(255,214,107,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, 26 * pulse, 0, 7); ctx.fill();
      var bobY = Math.sin(t * 3 + n) * 2.5;
      ctx.fillStyle = '#e8648f'; heartPath(ctx, cx, cy - 2 + bobY, 9 * pulse); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(cx - 4, cy - 7 + bobY, 2.2, 0, 7); ctx.fill();
    });
    cars.forEach(function (c) { drawCar(ctx, c); });
    /* Fefe */
    if (found.length === MEMS.length) {
      var fx = FEFE.x * TS, fy = FEFE.y * TS, pr = 1 + Math.sin(t * 4) * .12;
      var g2 = ctx.createRadialGradient(fx, fy, 4, fx, fy, 34 * pr);
      g2.addColorStop(0, 'rgba(143,176,242,.8)'); g2.addColorStop(1, 'rgba(143,176,242,0)');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(fx, fy, 34 * pr, 0, 7); ctx.fill();
      person(ctx, fx, fy, { t: t, face: -1, body: '#4f6fb3', legs: '#33415c', hair: '#3a2a22' });
      ctx.fillStyle = '#e8648f'; heartPath(ctx, fx, fy - 30 + Math.sin(t * 3) * 2, 5); ctx.fill();
    }
    if (!(inv > 0 && Math.floor(t * 14) % 2)) person(ctx, P.x, P.y, { t: t, moving: P.moving, walk: P.walk, face: P.face, body: '#f28ba8', dress: true, legs: '#f6d3b8', hair: '#4a2c1e', long: true, bow: true });
    /* noite: escurece tudo e deixa só as luzes acesas */
    if (!nc) { nc = document.createElement('canvas'); }
    if (nc.width !== canvas.width || nc.height !== canvas.height) { nc.width = canvas.width; nc.height = canvas.height; }
    var ng = nc.getContext('2d');
    ng.globalCompositeOperation = 'source-over'; ng.setTransform(1, 0, 0, 1, 0, 0); ng.clearRect(0, 0, nc.width, nc.height);
    ng.fillStyle = 'rgba(20,10,46,.66)'; ng.fillRect(0, 0, nc.width, nc.height);
    ng.setTransform(dpr * zoom, 0, 0, dpr * zoom, -camX * zoom * dpr, -camY * zoom * dpr);
    ng.globalCompositeOperation = 'destination-out';
    function hole(hx, hy, rad, a) { var q = ng.createRadialGradient(hx, hy, 2, hx, hy, rad); q.addColorStop(0, 'rgba(0,0,0,' + a + ')'); q.addColorStop(1, 'rgba(0,0,0,0)'); ng.fillStyle = q; ng.beginPath(); ng.arc(hx, hy, rad, 0, 7); ng.fill(); }
    lamps.forEach(function (l) { hole(l[0] * TS + 16, l[1] * TS + 2, 78, .95); });
    hole(P.x, P.y - 4, 74, .95);
    MEMS.forEach(function (m, n) { if (found.indexOf(n) < 0) hole(m.x * TS + 16, m.y * TS + 16, 52, .9); });
    if (found.length === MEMS.length) hole(FEFE.x * TS, FEFE.y * TS, 60, .95);
    hole(6 * TS + 16, 7 * TS + 16, 70, .8); hole(CHURCH.x * TS + CHURCH.w * TS / 2, 3 * TS, 90, .6); hole((REST.x + REST.w / 2) * TS, (REST.y + 4) * TS, 100, .75);
    ng.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(nc, 0, 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -camX * zoom * dpr, -camY * zoom * dpr);
    lamps.forEach(function (l) { var q = ctx.createRadialGradient(l[0] * TS + 16, l[1] * TS + 2, 1, l[0] * TS + 16, l[1] * TS + 2, 56); q.addColorStop(0, 'rgba(255,190,110,.32)'); q.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = q; ctx.beginPath(); ctx.arc(l[0] * TS + 16, l[1] * TS + 2, 56, 0, 7); ctx.fill(); });
    ctx.globalCompositeOperation = 'source-over';
    /* confete */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    root.hidden = false; document.body.style.overflow = 'hidden'; running = true; paused = false;
    resize(); refreshHud(); clearDirs();
    if (!found.length && !done) { openCard('', 'Bem-vinda à Vila Camilópolis', 'Passeie pelo bairro e ache as ' + MEMS.length + ' lembranças que estão brilhando por aí. Cuidado com os carros!', 'Vamos lá'); }
    last = performance.now(); requestAnimationFrame(loop);
  }
  function close() { running = false; root.hidden = true; document.body.style.overflow = ''; clearDirs(); el('w-card').hidden = true; }
  openBtn.addEventListener('click', open);
  el('w-exit').addEventListener('click', close);
})();
