/* ===================================================================
   CONTEÚDO PÚBLICO. A carta, o quiz, a linha do tempo, a música e as fotos (com legendas)
   ficam no Supabase (tabela conteudo) e só carregam depois do login.
   =================================================================== */
var CONFIG = {
  start: new Date(2025, 10, 1),        // 01/11/2025, início do namoro
  anniversary: new Date(2026, 10, 1),  // 1 ano de namoro: 01/11/2026

  /* preenchidos por applyContent() depois do login */
  timeline: [], quiz: [], letter: [], music: '', photos: [], sign: '', surprise: '',

  /* Sugestões: o namorado edita. */
  vouchers: [
    { t: 'Um jantar a dois', d: 'Você escolhe o restaurante.' },
    { t: 'Uma noite no cinema', d: 'Pipoca e o filme que você quiser.' },
    { t: 'Um dia sem celular', d: 'Só nós dois, de verdade.' },
    { t: 'Café da manhã especial', d: 'Preparado com carinho, do jeitinho que você gosta.' },
    { t: 'Cinco minutos de abraço', d: 'Sem pressa e sem interrupção.' },
    { t: 'Um piquenique no parque', d: 'Cesta, toalha e a gente num dia só nosso.' },
    { t: 'Um desejo seu', d: 'Um pedido razoável, sem perguntas.' }
  ],
};

/* =================================================================== */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  document.body.classList.add('locked');
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : many); };
  var fmtISO = function (iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };

  /* ---------- pétalas ---------- */
  var petals = (function () {
    var c = $('petals'), ctx = c.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 1.75), W = 0, H = 0, list = [], run = !reduce;
    var colors = ['#F8B8C8', '#F28BA8', '#E26A8D', '#FBD9E1'];
    function make(fromTop) {
      var d = .4 + Math.random() * .9;
      return { x: Math.random() * W, y: fromTop ? -30 - Math.random() * H * .4 : Math.random() * H, s: 7 + d * 11, d: d, vy: .25 + d * .7, ph: Math.random() * 6.28, r: Math.random() * 6.28, vr: (Math.random() - .5) * .02, col: colors[(Math.random() * colors.length) | 0], a: .35 + d * .45 };
    }
    var lastW = 0;
    function size() {
      /* Ao rolar no celular a barra do navegador encolhe/cresce e dispara "resize".
         Só recria as pétalas se a LARGURA mudou; senão elas ficariam saltando de lugar. */
      var same = innerWidth === lastW;
      lastW = innerWidth; W = innerWidth; H = same ? Math.max(H, innerHeight) : innerHeight;
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (same && list.length) return;
      var n = W < 700 ? 16 : 28; list = []; for (var i = 0; i < n; i++) list.push(make(false));
    }
    function draw(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, .65 + .35 * Math.sin(p.ph));
      ctx.globalAlpha = p.a; ctx.fillStyle = p.col; ctx.beginPath();
      ctx.moveTo(0, -p.s); ctx.bezierCurveTo(p.s * .9, -p.s * .7, p.s * .8, p.s * .6, 0, p.s); ctx.bezierCurveTo(-p.s * .8, p.s * .6, -p.s * .9, -p.s * .7, 0, -p.s);
      ctx.fill(); ctx.restore();
    }
    function frame(t) {
      requestAnimationFrame(frame);
      if (!run || document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        p.y += p.vy; p.x += Math.sin(t / 1800 + p.ph) * .5 * p.d; p.r += p.vr; p.ph += .02;
        if (p.y > H + 30) list[i] = make(true);
        draw(p);
      }
    }
    size(); addEventListener('resize', size);
    if (!reduce) requestAnimationFrame(frame);
    return { burst: function () { if (reduce) return; for (var i = 0; i < 26; i++) { var p = make(true); p.vy *= 1.8; list.push(p); } setTimeout(function () { if (list.length > 60) list.splice(28, list.length - 28); }, 12000); } };
  })();

  /* ---------- entrada ---------- */
  /* Tudo fica trancado até o login (nos.js define window.nosAuthed e chama openApp). */
  window.openApp = function (view) {
    if (!window.nosAuthed) return;
    document.body.classList.remove('locked', 'gated');
    document.body.classList.add('opened');
    petals.burst();
    if (view && VIEWS.indexOf(view) > 0) { go(view); return; }
    window.scrollTo(0, 0);
  };
  $('open').addEventListener('click', function () {
    if (window.nosAuthed) { window.openApp(); return; }
    this.hidden = true; $('nos-login-form').hidden = false; $('nos-email').focus();
  });

  /* ---------- contador ---------- */
  function daysIn(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function tick() {
    var now = new Date(), f = CONFIG.start;
    if (now < f) { $('since-line').textContent = 'Nossa história começa em 1 de novembro de 2025.'; return; }
    var y = now.getFullYear() - f.getFullYear(), m = now.getMonth() - f.getMonth(), d = now.getDate() - f.getDate();
    if (d < 0) { m--; d += daysIn(now.getFullYear(), now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1); }
    if (m < 0) { y--; m += 12; }
    var months = y * 12 + m;
    $('c-months').textContent = months;
    $('c-days').textContent = d;
    $('c-hours').textContent = now.getHours();
    $('c-mins').textContent = pad2(now.getMinutes());
    $('c-secs').textContent = pad2(now.getSeconds());
    var total = Math.floor((now - f) / 86400000);
    $('since-line').textContent = 'Desde 1 de novembro de 2025. São ' + total + ' dias, e eu contaria todos de novo.';
    var a = CONFIG.anniversary;
    if (now < a) {
      var ms = a - now, dd = Math.floor(ms / 86400000), hh = Math.floor(ms % 86400000 / 3600000);
      $('countdown').textContent = 'Faltam ' + plural(dd, 'dia', 'dias') + ' e ' + plural(hh, 'hora', 'horas') + ' para completarmos 1 ano de namoro.';
    } else if (now.getFullYear() === a.getFullYear() && now.getMonth() === a.getMonth() && now.getDate() === a.getDate()) {
      $('countdown').textContent = 'Hoje fazemos 1 ano de namoro. Feliz aniversário, minha princesa.';
    } else {
      $('countdown').textContent = 'Já passamos de 1 ano de namoro, e é só o começo.';
    }
  }
  tick(); setInterval(tick, 1000);

  /* ---------- linha do tempo ---------- */
  var tl = $('timeline');
  function buildTimeline() { tl.innerHTML = ''; CONFIG.timeline.forEach(function (it) {
    var li = document.createElement('li'); li.className = 'tl-item';
    var html = '';
    if (it.date) html += '<p class="tl-date"></p>';
    if (it.sdate) html += '<p class="tl-date tl-secret"></p>';
    html += '<h3 class="tl-title"></h3>';
    if (it.text) html += '<p class="tl-text"></p>';
    if (it.stext) html += '<p class="tl-text tl-secret"></p>';
    if (it.photo) html += '<figure class="tl-photo"><img alt="" loading="lazy"></figure>';
    li.innerHTML = html;
    if (it.date) li.querySelector('.tl-date:not(.tl-secret)').textContent = it.date;
    if (it.sdate) li.querySelector('.tl-date.tl-secret').textContent = it.sdate;
    if (it.stext) li.querySelector('.tl-text.tl-secret').textContent = it.stext;
    li.querySelector('.tl-title').textContent = it.title;
    if (it.text) li.querySelector('.tl-text:not(.tl-secret)').textContent = it.text;
    if (it.photo) { var im = li.querySelector('img'); im.src = it.photo; im.alt = it.title; }
    tl.appendChild(li);
  }); }

  /* ---------- quiz ---------- */
  var Q = [], idx = 0, score = 0, answered = false;
  function revealTimeline() { document.body.classList.add('quiz-done'); }
  function prepQuiz() {
    Q = CONFIG.quiz;
    $('draft').hidden = !Q.some(function (q) { return q.answer === null || q.answer === undefined; });
    Q.forEach(function (q) { if (q.options && q.options.length) for (var k = q.options.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)), t = q.options[k]; q.options[k] = q.options[r]; q.options[r] = t; } });
  }
  /* Conteúdo privado (vem do Supabase depois do login, via nos.js). */
  window.applyContent = function (c) {
    if (!c) return;
    CONFIG.timeline = c.timeline || []; CONFIG.quiz = c.quiz || []; CONFIG.letter = c.letter || [];
    CONFIG.music = c.music || ''; CONFIG.photos = c.photos || []; CONFIG.sign = c.sign || ''; CONFIG.surprise = c.surprise || '';
    window.ALBUM_PATHS = CONFIG.photos.map(function (p) { return p.src; }).filter(Boolean);
    buildTimeline(); prepQuiz(); buildGallery();
  };
  var el = { start: $('quiz-start'), run: $('quiz-run'), end: $('quiz-end'), form: $('q-form'), text: $('q-text'), input: $('q-input'), err: $('q-error'), fb: $('feedback'), count: $('count'), bar: $('bar') };

  function field(q) {
    var wrap = el.input; wrap.innerHTML = '';
    if (q.type === 'date') {
      var i = document.createElement('input'); i.type = 'date'; i.id = 'ans'; i.className = 'field'; i.setAttribute('aria-labelledby', 'q-text');
      i.max = new Date().toISOString().slice(0, 10); wrap.appendChild(i);
    } else if (q.type === 'number') {
      var s = document.createElement('div'); s.className = 'stepper';
      s.innerHTML = '<button type="button" class="step" aria-label="Diminuir">−</button><input class="field" id="ans" type="number" inputmode="numeric" min="' + (q.min || 0) + '" max="' + (q.max || 99) + '" value="0" aria-labelledby="q-text"><button type="button" class="step" aria-label="Aumentar">+</button>';
      var inp = s.querySelector('input'), b = s.querySelectorAll('button');
      b[0].onclick = function () { inp.value = Math.max(q.min || 0, (+inp.value || 0) - 1); };
      b[1].onclick = function () { inp.value = Math.min(q.max || 99, (+inp.value || 0) + 1); };
      wrap.appendChild(s);
    } else if (q.type === 'choice' && q.options && q.options.length) {
      var g = document.createElement('div'); g.className = 'opts'; g.setAttribute('role', 'radiogroup');
      q.options.forEach(function (o, k) {
        var d = document.createElement('div'); d.className = 'opt';
        d.innerHTML = '<input type="radio" name="opt" id="o' + k + '" value="' + k + '"><label for="o' + k + '"></label>';
        d.querySelector('label').textContent = o; g.appendChild(d);
      });
      wrap.appendChild(g);
    } else {
      var t = document.createElement('input'); t.type = 'text'; t.id = 'ans'; t.className = 'field'; t.autocomplete = 'off'; t.placeholder = 'Digite aqui'; t.setAttribute('aria-labelledby', 'q-text'); wrap.appendChild(t);
    }
  }

  function show(n) {
    idx = n; answered = false; var q = Q[n];
    el.text.textContent = q.q; field(q);
    el.count.textContent = 'Pergunta ' + (n + 1) + ' de ' + Q.length;
    el.bar.style.width = (n / Q.length * 100) + '%';
    el.err.hidden = true; el.fb.hidden = true; el.form.hidden = false;
    var f = el.input.querySelector('input, button'); if (f && q.type !== 'number') f.focus({ preventScroll: true });
  }

  function value(q) {
    if (q.type === 'choice' && q.options && q.options.length) { var c = el.input.querySelector('input:checked'); return c ? q.options[+c.value] : null; }
    var i = $('ans'); var v = i ? i.value.trim() : '';
    if (q.type === 'number') return v === '' ? null : +v;
    return v === '' ? null : v;
  }

  function judge(q, v) {
    if (q.answer === null || q.answer === undefined) return { r: 'ok', shown: '' };
    if (q.type === 'date') {
      if (v === q.answer) return { r: 'ok', shown: fmtISO(q.answer) };
      var diff = Math.abs((new Date(v) - new Date(q.answer)) / 86400000);
      return { r: diff <= 1 ? 'near' : 'no', shown: fmtISO(q.answer) };
    }
    if (q.type === 'number') {
      var ans = [].concat(q.answer), hit = ans.indexOf(v) > -1, close = ans.some(function (a) { return Math.abs(v - a) === 1; });
      return { r: hit ? 'ok' : close ? 'near' : 'no', shown: ans.join(' ou ') };
    }
    if (q.type === 'choice' && q.options && q.options.length) return { r: v === q.answer ? 'ok' : 'no', shown: q.answer };
    var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); };
    return { r: norm(v) === norm(q.answer) ? 'ok' : 'no', shown: q.answer };
  }

  el.form.addEventListener('submit', function (e) {
    e.preventDefault(); if (answered) return;
    var q = Q[idx], v = value(q);
    if (v === null) { el.err.textContent = 'Escolha ou escreva uma resposta, minha princesa.'; el.err.hidden = false; return; }
    answered = true; el.err.hidden = true;
    var j = judge(q, v);
    score += j.r === 'ok' ? 1 : j.r === 'near' ? .5 : 0;
    var title = j.r === 'ok' ? 'Isso mesmo!' : j.r === 'near' ? 'Pertinho!' : 'Quase lá';
    var text = j.r === 'ok' ? 'Você lembra de tudo, minha princesa.' + (j.shown ? ' Era ' + j.shown + '.' : '')
             : j.r === 'near' ? 'Faltou só um detalhe. Era ' + j.shown + '.'
             : 'Eu te perdoo. Era ' + j.shown + '.';
    $('fb-title').textContent = title; $('fb-text').textContent = text;
    $('next').textContent = idx === Q.length - 1 ? 'Ver meu resultado' : 'Próxima';
    el.form.hidden = true; el.fb.hidden = false; el.fb.focus({ preventScroll: true });
    if (j.r === 'ok') petals.burst();
  });

  $('next').addEventListener('click', function () { if (idx < Q.length - 1) show(idx + 1); else finish(); });

  function finish() {
    el.run.hidden = true; el.end.hidden = false;
    el.bar.style.width = '100%';
    var s = String(score).replace('.', ',');
    $('score').textContent = s + ' / ' + Q.length;
    var r = score / Q.length, title, text;
    if (r === 1) { title = 'Você guarda tudo no coração'; text = 'Nenhum detalhe escapou. É por isso que eu sei que a gente vai longe.'; }
    else if (r >= .7) { title = 'Quase perfeita'; text = 'Você lembra de quase tudo. O resto a gente vive de novo, juntinhos.'; }
    else if (r >= .4) { title = 'Boa memória, princesa'; text = 'Alguns detalhes escaparam, mas o importante você nunca esquece.'; }
    else { title = 'Hora de reviver tudo'; text = 'Eu topo recomeçar do primeiro dia, só para te lembrar de cada detalhe.'; }
    $('end-title').textContent = title; $('end-text').textContent = text;
    revealTimeline();
    petals.burst(); el.end.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }

  $('start').addEventListener('click', function () { el.start.hidden = true; el.run.hidden = false; score = 0; show(0); });

  /* ---------- carta ---------- */
  function openLetter() {
    revealTimeline();
    var sec = $('carta');
    if (sec.hidden) {
      var L = $('letter'); L.innerHTML = '';
      CONFIG.letter.forEach(function (p) { var e = document.createElement('p'); e.textContent = p; L.appendChild(e); });
      if (CONFIG.sign) { $('sign').textContent = CONFIG.sign; } else { $('sign').hidden = true; }
      if (CONFIG.music) { var m = $('music'); m.href = CONFIG.music; m.hidden = false; }
      if (CONFIG.surprise) { var s = $('surprise'); s.textContent = CONFIG.surprise; s.hidden = false; }
      sec.hidden = false;
      if (window.gsap && !reduce) gsap.from('#carta .wrap > *', { y: 40, autoAlpha: 0, duration: 1.1, ease: 'expo.out', stagger: .12, clearProps: 'transform,opacity,visibility' });
    }
    petals.burst();
    setTimeout(function () { sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, 60);
  }
  $('open-letter').addEventListener('click', openLetter);
  $('skip').addEventListener('click', openLetter);

  /* ---------- entradas ao rolar ---------- */
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    var rv = function (sel, from) {
      gsap.utils.toArray(sel).forEach(function (n) {
        gsap.from(n, Object.assign({ duration: 1.1, ease: 'expo.out', clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: n, start: 'top 90%', once: true } }, from));
      });
    };
    rv('.block .eyebrow', { y: 16, autoAlpha: 0 });
    rv('.block .display', { y: 46, autoAlpha: 0 });
    rv('.block .lead', { y: 26, autoAlpha: 0 });
    rv('.tile', { y: 30, autoAlpha: 0, stagger: .08 });
    rv('.countdown', { y: 24, autoAlpha: 0 });
    rv('.tl-item', { y: 40, autoAlpha: 0 });
    rv('.card', { y: 50, autoAlpha: 0 });
    gsap.from('.intro > *', { y: 26, autoAlpha: 0, duration: 1.3, ease: 'expo.out', stagger: .14, delay: .2, clearProps: 'transform,opacity,visibility' });
  }

  /* =================================================================
     PÁGINAS: Início, Álbum, Jogos, Vales
     ================================================================= */
  var VIEWS = ['inicio', 'album', 'jogos', 'vales', 'nos'], current = 'inicio', scratchReady = false;
  function go(name) {
    if (!window.nosAuthed || document.body.classList.contains('gated')) return;
    if (VIEWS.indexOf(name) < 0) name = 'inicio';
    VIEWS.forEach(function (v) { $('view-' + v).hidden = v !== name; });
    [].forEach.call(document.querySelectorAll('#tabbar button'), function (b) {
      if (b.dataset.go === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    current = name;
    window.scrollTo(0, 0);
    try { history.replaceState(null, '', name === 'inicio' ? location.pathname + location.search : '#' + name); } catch (e) {}
    if (name === 'jogos' && !scratchReady) { scratchReady = true; newScratch(); }
        window.dispatchEvent(new CustomEvent('viewchange', { detail: name }));
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
  addEventListener('hashchange', function () {
    var h = location.hash.replace('#', '');
    if (document.body.classList.contains('opened') && VIEWS.indexOf(h) > -1 && h !== current) go(h);
  });
  /* ---------- álbum ---------- */
  var cameraSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-5 4 4 2-2 5 5"/></svg>';
  var lb = $('lightbox');
  /* As fotos ficam no armazenamento privado do Supabase: só aparecem depois do login (nos.js chama setAlbumUrls). */
  var albumUrls = {}, albumLoaded = false;
  window.ALBUM_PATHS = [];
  var lbList = [], lbIdx = 0, lbY = 0;
  function lbShow(i) {
    if (!lbList.length) return;
    lbIdx = (i + lbList.length) % lbList.length;
    var it = lbList[lbIdx];
    $('lb-img').src = it.url; $('lb-img').alt = it.caption; $('lb-cap').textContent = it.caption;
    var many = lbList.length > 1;
    $('lb-prev').hidden = !many; $('lb-next').hidden = !many;
  }
  function lbOpen(i) {
    lbShow(i);
    lbY = window.scrollY;
    document.body.style.top = -lbY + 'px'; document.body.classList.add('lb-open');
    if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
  }
  lb.addEventListener('close', function () {
    document.body.classList.remove('lb-open'); document.body.style.top = '';
    window.scrollTo(0, lbY);
  });
  $('lb-prev').addEventListener('click', function () { lbShow(lbIdx - 1); });
  $('lb-next').addEventListener('click', function () { lbShow(lbIdx + 1); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') lbShow(lbIdx - 1); else if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
  });
  /* deslizar o dedo para o lado também troca de foto */
  var lbX = null;
  lb.addEventListener('touchstart', function (e) { lbX = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (lbX === null) return;
    var dx = e.changedTouches[0].clientX - lbX; lbX = null;
    if (Math.abs(dx) > 50) lbShow(lbIdx + (dx < 0 ? 1 : -1));
  }, { passive: true });
  lb.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  function buildGallery() {
    $('gallery').innerHTML = ''; lbList = [];
    CONFIG.photos.forEach(function (p) {
      var url = p.src && albumUrls[p.src];
      var f = document.createElement('figure'); f.className = 'ph' + (url ? '' : ' empty');
      if (url) {
        f.innerHTML = '<button type="button"><img decoding="async" alt=""></button><figcaption></figcaption>';
        var im = f.querySelector('img'); im.src = url; im.alt = p.caption || 'Foto nossa';
        f.querySelector('figcaption').textContent = p.caption || '';
        var at = lbList.push({ url: url, caption: p.caption || '' }) - 1;
        f.querySelector('button').addEventListener('click', function () { lbOpen(at); });
      } else {
        f.style.aspectRatio = p.ratio || '4 / 5';
        f.innerHTML = '<div class="slot">' + cameraSvg + '<figcaption></figcaption><span>' + (!p.src ? 'Foto em breve' : albumLoaded ? 'Foto não encontrada' : 'Carregando…') + '</span></div>';
        f.querySelector('figcaption').textContent = p.caption || '';
      }
      $('gallery').appendChild(f);
    });
  }
  buildGallery();
  window.setAlbumUrls = function (m) { albumUrls = m || {}; albumLoaded = true; buildGallery(); buildMemory(); };
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });

  /* ---------- pontos: ganhos nos joguinhos, gastos nos vales ---------- */
  var PTS_KEY = 'giovanna-pontos', pts = { bal: 0, total: 0, day: '', got: {} }, onPts = [];
  try { var ps = JSON.parse(localStorage.getItem(PTS_KEY) || 'null'); if (ps && typeof ps.bal === 'number') pts = ps; } catch (e) {}
  var todayKey = function () { var n = new Date(); return n.getFullYear() + '-' + pad2(n.getMonth() + 1) + '-' + pad2(n.getDate()); };
  var savePts = function () { try { localStorage.setItem(PTS_KEY, JSON.stringify(pts)); } catch (e) {} if (window.onJogoSalvar) window.onJogoSalvar(); };
  var ptsToastT = 0;
  function ptsToast(msg) {
    var t = $('pts-toast'); if (!t) { t = document.createElement('div'); t.id = 'pts-toast'; t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(ptsToastT); ptsToastT = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }
  function drawPts() {
    [].forEach.call(document.querySelectorAll('.pts-pill b'), function (b) { b.textContent = pts.bal; });
    onPts.forEach(function (f) { f(); });
  }
  window.Pontos = {
    get: function () { return pts.bal; },
    /* ganha pontos de um jogo, com limite por dia (para ela voltar amanhã) */
    earn: function (game, n, cap) {
      var d = todayKey(); if (pts.day !== d) { pts.day = d; pts.got = {}; }
      var g = Math.max(0, Math.min(Math.round(n), cap - (pts.got[game] || 0)));
      if (g <= 0) { ptsToast(n > 0 ? 'Limite de pontos de hoje nesse jogo. Volte amanhã!' : ''); return 0; }
      pts.got[game] = (pts.got[game] || 0) + g; pts.bal += g; pts.total += g; savePts(); drawPts();
      ptsToast('+' + g + ' pontos'); return g;
    },
    spend: function (n) { if (pts.bal < n) return false; pts.bal -= n; savePts(); drawPts(); return true; },
    onChange: function (f) { onPts.push(f); }
  };
  ['jogos', 'vales'].forEach(function (v) {
    var lead = document.querySelector('#view-' + v + ' .page-head .lead'); if (!lead) return;
    var p = document.createElement('p'); p.className = 'pts-pill'; p.innerHTML = '<span aria-hidden="true">★</span> <b>0</b> pontos'; lead.after(p);
  });
  drawPts();

  /* ---------- jogo da memória ---------- */
  var ICONS = [
    ['Coração', 'M12 21C5 15.8 3 12.5 3 9.5A4.5 4.5 0 0 1 7.5 5C9.2 5 10.9 5.9 12 7.4 13.1 5.9 14.8 5 16.5 5A4.5 4.5 0 0 1 21 9.5c0 3-2 6.3-9 11.5Z'],
    ['Estrela', 'm12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7L12 3Z'],
    ['Lua', 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z'],
    ['Cruz', 'M10.5 3h3v6.5H20v3h-6.5V21h-3v-8.5H4v-3h6.5V3Z'],
    ['Diamante', 'm12 3 7 6-7 12L5 9l7-6Z'],
    ['Flor', 'M12 2c2 2.6 2 5 0 7-2-2-2-4.4 0-7Zm0 13c2 2.6 2 5 0 7-2-2-2-4.4 0-7ZM2 12c2.6-2 5-2 7 0-2 2-4.4 2-7 0Zm13 0c2.6-2 5-2 7 0-2 2-4.4 2-7 0Zm-3-3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z'],
    ['Chave', 'M14 3a6 6 0 0 0-5.7 7.9L3 16.2V21h4.8v-2.2h2.2v-2.2h2.2l1.1-1.1A6 6 0 1 0 14 3Zm2 3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z'],
    ['Gota', 'M12 3C8 8 6 11 6 14.2A6 6 0 0 0 18 14.2C18 11 16 8 12 3Z']
  ];
  var shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var memFlipped = [], memLock = false, memMoves = 0, memMatched = 0, memPairs = 8;
  function buildMemory() {
    var grid = $('memory'); grid.innerHTML = ''; memFlipped = []; memLock = false; memMoves = 0; memMatched = 0;
    var photos = CONFIG.photos.filter(function (p) { return p.src && albumUrls[p.src]; }).map(function (p) { return { src: albumUrls[p.src], caption: p.caption }; });
    var usePhotos = photos.length >= memPairs;
    var base = []; for (var i = 0; i < memPairs; i++) base.push(i);
    var deck = shuffle(base.concat(base));
    deck.forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'mcard'; b.dataset.k = k; b.setAttribute('aria-label', 'Carta virada para baixo');
      var face = usePhotos ? '<img alt="" src="' + photos[k].src + '">' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICONS[k][1] + '"/></svg>';
      b.innerHTML = '<span class="back"></span><span class="front">' + face + '</span>';
      b.dataset.name = usePhotos ? (photos[k].caption || 'Foto') : ICONS[k][0];
      b.addEventListener('click', function () { flip(b); });
      grid.appendChild(b);
    });
    $('mem-status').textContent = 'Jogadas: 0';
  }
  function flip(b) {
    if (memLock || b.classList.contains('flip') || b.classList.contains('done')) return;
    b.classList.add('flip'); b.setAttribute('aria-label', b.dataset.name); memFlipped.push(b);
    if (memFlipped.length < 2) return;
    memMoves++; $('mem-status').textContent = 'Jogadas: ' + memMoves;
    var a = memFlipped[0], c = memFlipped[1];
    if (a.dataset.k === c.dataset.k) {
      a.classList.add('done'); c.classList.add('done'); memFlipped = []; memMatched++;
      if (memMatched === memPairs) {
        $('mem-status').textContent = 'Todos os pares em ' + memMoves + ' jogadas. Você tem ótima memória, minha princesa.';
        petals.burst();
        var gm = window.Pontos.earn('memoria', Math.max(10, 50 - 3 * (memMoves - memPairs)), 50);
        if (gm) $('mem-status').textContent += ' +' + gm + ' pontos.';
      }
    } else {
      memLock = true;
      setTimeout(function () {
        [a, c].forEach(function (x) { x.classList.remove('flip'); x.setAttribute('aria-label', 'Carta virada para baixo'); });
        memFlipped = []; memLock = false;
      }, 900);
    }
  }
  $('mem-reset').addEventListener('click', buildMemory);
  buildMemory();

  /* ---------- caça-pétalas ---------- */
  var cEl = $('catch'), cStatus = $('catch-status'), cHint = $('catch-hint'), cBtn = $('catch-start'), cRun = null;
  cBtn.addEventListener('click', function () {
    if (cRun) return;
    cHint.hidden = true; cBtn.disabled = true; cBtn.textContent = 'Jogando…';
    var score = 0, left = 30, list = [], last = performance.now(), W = cEl.clientWidth, H = cEl.clientHeight;
    cStatus.textContent = 'Pétalas: 0 · 30s';
    function spawn() {
      var gold = Math.random() < .12, b = document.createElement('button');
      b.type = 'button'; b.className = 'cp' + (gold ? ' gold' : ''); b.setAttribute('aria-label', 'Pétala');
      var p = { el: b, x: Math.random() * (W - 44), y: -48, vy: 70 + Math.random() * 110, ph: Math.random() * 6, gold: gold };
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault(); if (!p.dead) { p.dead = true; score += gold ? 3 : 1; b.remove(); cStatus.textContent = 'Pétalas: ' + score + ' · ' + left + 's'; }
      });
      cEl.appendChild(b); list.push(p);
    }
    var sp = setInterval(spawn, 480), tm = setInterval(function () {
      left--; cStatus.textContent = 'Pétalas: ' + score + ' · ' + left + 's';
      if (left <= 0) end();
    }, 1000);
    function frame(now) {
      if (!cRun) return;
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      list = list.filter(function (p) {
        if (p.dead) return false;
        p.y += p.vy * dt; p.ph += dt * 2.4;
        if (p.y > H) { p.el.remove(); return false; }
        p.el.style.transform = 'translate(' + (p.x + Math.sin(p.ph) * 14) + 'px,' + p.y + 'px) rotate(' + (p.ph * 40) + 'deg)';
        return true;
      });
      cRun.raf = requestAnimationFrame(frame);
    }
    function end() {
      clearInterval(sp); clearInterval(tm); cancelAnimationFrame(cRun.raf); cRun = null;
      list.forEach(function (p) { p.el.remove(); });
      var msg = score < 10 ? 'Vamos de novo, princesa?' : score < 25 ? 'Boa! Suas mãos são rápidas.' : 'Você colheu um jardim inteiro!';
      cHint.textContent = score + ' pétalas. ' + msg; cHint.hidden = false;
      cStatus.textContent = 'Fim! Você pegou ' + score + ' pétalas.';
      cBtn.disabled = false; cBtn.textContent = 'Jogar de novo';
      if (score >= 25) petals.burst();
      var gp = window.Pontos.earn('petalas', score, 40);
      if (gp) cStatus.textContent += ' +' + gp + ' pontos.';
    }
    cRun = { raf: 0 }; cRun.raf = requestAnimationFrame(frame);
  });

  /* ---------- raspadinha ---------- */
  var sc = $('scratch'), sctx = null, scDone = false, scDrawing = false, scMoves = 0;
  function newScratch() {
    var box = $('scratch-box'), w = box.clientWidth, h = box.clientHeight;
    if (!w) return;
    scDone = false; scMoves = 0; sc.classList.remove('gone');
    var d = Math.min(devicePixelRatio || 1, 2); sc.width = w * d; sc.height = h * d;
    sctx = sc.getContext('2d'); sctx.setTransform(d, 0, 0, d, 0, 0); sctx.globalCompositeOperation = 'source-over';
    var g = sctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#EBCB95'); g.addColorStop(.5, '#F6D9C0'); g.addColorStop(1, '#E5A5B5');
    sctx.fillStyle = g; sctx.fillRect(0, 0, w, h);
    sctx.fillStyle = 'rgba(255,255,255,.55)';
    for (var i = 0; i < 60; i++) { sctx.beginPath(); sctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2 + .6, 0, 6.3); sctx.fill(); }
    sctx.fillStyle = 'rgba(58,20,40,.7)'; sctx.font = '500 22px Jost, sans-serif'; sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
    sctx.fillText('Raspe aqui', w / 2, h / 2);
    var v = CONFIG.vouchers[Math.floor(Math.random() * CONFIG.vouchers.length)];
    $('prize-text').textContent = 'Vale: ' + v.t;
  }
  function scratchAt(e) {
    if (!sctx || scDone) return;
    var r = sc.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    sctx.globalCompositeOperation = 'destination-out'; sctx.beginPath(); sctx.arc(x, y, 24, 0, 6.3); sctx.fill();
    if (++scMoves % 12 === 0) checkScratch();
  }
  function checkScratch() {
    var d = sctx.getImageData(0, 0, sc.width, sc.height).data, clear = 0, total = 0;
    for (var i = 3; i < d.length; i += 64) { total++; if (d[i] < 40) clear++; }
    if (clear / total > .5) revealScratch();
  }
  function revealScratch() { if (scDone) return; scDone = true; sc.classList.add('gone'); petals.burst(); window.Pontos.earn('raspadinha', 5, 10); }
  sc.addEventListener('pointerdown', function (e) { scDrawing = true; sc.setPointerCapture(e.pointerId); scratchAt(e); });
  sc.addEventListener('pointermove', function (e) { if (scDrawing) scratchAt(e); });
  sc.addEventListener('pointerup', function () { scDrawing = false; if (sctx && !scDone) checkScratch(); });
  $('scratch-again').addEventListener('click', newScratch);
  $('scratch-reveal').addEventListener('click', revealScratch);

  /* ---------- vales ---------- */
  var USED_KEY = 'giovanna-vales', used = {};
  try { used = JSON.parse(localStorage.getItem(USED_KEY) || '{}'); } catch (e) { used = {}; }
  var saveUsed = function () { try { localStorage.setItem(USED_KEY, JSON.stringify(used)); } catch (e) {} if (window.onJogoSalvar) window.onJogoSalvar(); };
  var VCOST = [9000, 6000, 1500, 4000, 1000, 4500, 7500];
  var costOf = function (i) { return (CONFIG.vouchers[i] && CONFIG.vouchers[i].cost) || VCOST[i] || 100; };
  function renderVouchers() {
    var ul = $('vouchers'); ul.innerHTML = '';
    CONFIG.vouchers.forEach(function (v, i) {
      var li = document.createElement('li'); li.className = 'voucher' + (used[i] ? ' used' : '');
      li.innerHTML = '<span class="v-no"></span><h3></h3><p></p><span class="v-cost"></span><button class="btn" type="button"></button>';
      li.querySelector('.v-no').textContent = 'Vale nº ' + pad2(i + 1);
      li.querySelector('h3').textContent = v.t; li.querySelector('p').textContent = v.d;
      var b = li.querySelector('button');
      var cost = costOf(i), have = window.Pontos.get();
      li.querySelector('.v-cost').textContent = used[i] ? '' : cost + ' pontos';
      if (used[i]) { b.textContent = 'Resgatado em ' + used[i]; b.disabled = true; }
      else if (have < cost) { b.textContent = 'Faltam ' + (cost - have) + ' pontos'; b.disabled = true; b.classList.add('need'); }
      else { b.textContent = 'Resgatar'; b.addEventListener('click', function () { askRedeem(i, b); }); }
      ul.appendChild(li);
    });
  }
  var cf = $('confirm'), cfFrom = null, cfIndex = -1;
  function askRedeem(i, btn) {
    cfIndex = i; cfFrom = btn;
    $('cf-name').textContent = '“' + CONFIG.vouchers[i].t + '” por ' + costOf(i) + ' pontos';
    cf.returnValue = ''; cf.showModal();
  }
  cf.addEventListener('click', function (e) { if (e.target === cf) cf.close('no'); });
  cf.addEventListener('close', function () {
    var i = cfIndex; cfIndex = -1;
    if (cf.returnValue === 'yes' && i > -1 && !used[i] && window.Pontos.spend(costOf(i))) {
      var n = new Date(); used[i] = pad2(n.getDate()) + '/' + pad2(n.getMonth() + 1);
      saveUsed(); petals.burst(); renderVouchers();
      if (window.onVale) window.onVale(CONFIG.vouchers[i].t, costOf(i));
    } else if (cfFrom && document.contains(cfFrom)) cfFrom.focus();
  });
  /* o resgate não é reversível: o botão de reativar só aparece com ?reset na URL (uso do Fernando) */
  if (/[?&]reset\b/.test(location.search)) {
    var rb = document.createElement('p'); rb.className = 'skip';
    rb.innerHTML = '<button class="link" id="reset-vouchers" type="button">Reativar todos os vales</button>';
    $('vouchers').after(rb);
    $('reset-vouchers').addEventListener('click', function () { used = {}; saveUsed(); renderVouchers(); });
    var tb = document.createElement('button'); tb.className = 'link'; tb.type = 'button'; tb.textContent = '+300 pontos (teste)'; rb.appendChild(tb);
    tb.addEventListener('click', function () { pts.bal += 300; savePts(); drawPts(); });
  }
  renderVouchers();
  window.Pontos.onChange(renderVouchers);
  /* pontos e vales ficam na conta (Supabase); nos.js lê e grava por aqui */
  window.Pontos.estado = function () { return { bal: pts.bal, total: pts.total, day: pts.day, got: pts.got, used: used }; };
  window.Pontos.carregar = function (r) {
    /* nunca perde pontos: vale o lado que já ganhou mais (total só cresce); os vales resgatados dos dois lados somam */
    var merged = Object.assign({}, r.used || {}, used), keepLocal = (pts.total || 0) > (r.total || 0);
    if (!keepLocal) pts = { bal: r.bal || 0, total: r.total || 0, day: r.day || "", got: r.got || {} };
    used = merged;
    try { localStorage.setItem(PTS_KEY, JSON.stringify(pts)); localStorage.setItem(USED_KEY, JSON.stringify(used)); } catch (e) {}
    drawPts(); renderVouchers();
    if (keepLocal && window.onJogoSalvar) window.onJogoSalvar();
  };

  /* abrir direto numa página (#album, #jogos, #vales): só depois de tudo estar montado */
  /* (a abertura direta por #hash agora é feita em nos.js, só depois de confirmar o login) */

})();
