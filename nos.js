/* Nós dois: login (Supabase) e recados com foto e frase entre as duas contas. */
(function () {
  var SB_URL = 'https://fapfosqocvtawkhgavap.supabase.co';
  var SB_KEY = 'sb_publishable_gklz-L7kiemOKagFhu5GWg_cUZdYk0J'; // chave pública, feita para ficar no site
  var PEOPLE = { 'fernandinhomlima@gmail.com': 'Fernando' }; // 'email@exemplo.com': 'Nome', para mostrar o nome em vez de "Seu amor"

  var $ = function (id) { return document.getElementById(id); };
  if (!window.supabase || !$('view-nos')) return;
  var sb = window.supabase.createClient(SB_URL, SB_KEY);
  var me = null, loadedOnce = false, picked = null;

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function setMsg(el, text, bad) { el.textContent = text || ''; el.classList.toggle('bad', !!bad); }

  /* álbum: gera links temporários das fotos privadas (pasta album/ do armazenamento) */
  async function loadAlbum(user) {
    if (!window.setAlbumUrls) return;
    if (!user) { window.setAlbumUrls({}); return; }
    /* carta, quiz, linha do tempo e legendas: tabela privada, só para quem está logado */
    var c = await sb.from('conteudo').select('dados').eq('id', 'site').maybeSingle();
    if (c.data && window.applyContent) window.applyContent(c.data.dados);
    var paths = window.ALBUM_PATHS || [], m = {};
    var r = await sb.storage.from('nos').createSignedUrls(paths, 3600);
    (r.data || []).forEach(function (x) { if (x.signedUrl) m[x.path] = x.signedUrl; });
    /* Se algum não estiver em album/NN.jpg (pasta com outro nome, subpasta do zip, raiz do bucket),
       procura pelo nome do arquivo (01, 02, ...) nessas pastas. */
    var missing = paths.filter(function (p) { return !m[p]; });
    if (missing.length) {
      var found = await findPhotos(), toSign = [], back = {};
      missing.forEach(function (p) { var f = found[baseName(p)]; if (f) { toSign.push(f); back[f] = p; } });
      if (toSign.length) {
        var r2 = await sb.storage.from('nos').createSignedUrls(toSign, 3600);
        (r2.data || []).forEach(function (x) { if (x.signedUrl) m[back[x.path]] = x.signedUrl; });
      }
    }
    window.setAlbumUrls(m);
  }
  function baseName(p) { return p.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase(); }
  async function findPhotos() {
    var out = {}, dirs = ['album', ''], seen = 0, uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;
    while (dirs.length && seen++ < 8) {
      var dir = dirs.shift(), r = await sb.storage.from('nos').list(dir, { limit: 200 });
      (r.data || []).forEach(function (it) {
        var full = dir ? dir + '/' + it.name : it.name;
        if (it.id) { if (/\.(jpe?g|png|webp)$/i.test(it.name)) out[baseName(it.name)] = out[baseName(it.name)] || full; }
        else if (!uuid.test(it.name) && dir.split('/').length < 2) dirs.push(full);
      });
    }
    return out;
  }
  /* sessão já existente (ex.: app instalado): o botão vira "Abrir" e entra direto */
  sb.auth.getSession().then(function (r) {
    var user = r.data.session && r.data.session.user;
    if (!user) return;
    window.nosAuthed = true; render(user);
    $('open').textContent = 'Abrir';
    var h = location.hash.replace('#', '');
    if (h && h !== 'inicio') window.openApp(h);
  });

  function render(user) {
    if ((user && user.id) !== (me && me.id)) loadAlbum(user);
    me = user;
    $('nos-app').hidden = !user;
    if (user) { $('nos-who').textContent = PEOPLE[user.email] || user.email; loadFeed(); }
  }

  /* ---------- login ---------- */
  $('nos-login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button'), msg = $('nos-login-msg');
    btn.disabled = true; setMsg(msg, 'Entrando…');
    var r = await sb.auth.signInWithPassword({ email: $('nos-email').value.trim(), password: $('nos-pass').value });
    btn.disabled = false;
    if (r.error) { setMsg(msg, 'E-mail ou senha incorretos.', true); return; }
    setMsg(msg, ''); $('nos-pass').value = '';
    window.nosAuthed = true; render(r.data.user);
    window.openApp();
  });
  $('nos-logout').addEventListener('click', async function () { await sb.auth.signOut(); window.nosAuthed = false; location.hash = ''; location.reload(); });

  /* ---------- foto: enquadramento por tamanho de widget ---------- */
  /* Cada tamanho de widget recebe a sua própria versão da foto, recortada como você escolher e já no
     tamanho exato em pixels (3x). Assim o iPhone não precisa reduzir a foto e ela fica nítida. */
  var SIZES = { p: { w: 480, h: 480 }, m: { w: 1020, h: 480 }, g: { w: 1020, h: 1068 } };
  var srcImg = null, srcUrl = '', cur = 'p', crop = {};
  function resetCrop() { crop = { p: { z: 1, cx: .5, cy: .5 }, m: { z: 1, cx: .5, cy: .5 }, g: { z: 1, cx: .5, cy: .5 } }; }
  function place(W, H, st) {
    var s = Math.max(W / srcImg.naturalWidth, H / srcImg.naturalHeight) * st.z;
    var dw = srcImg.naturalWidth * s, dh = srcImg.naturalHeight * s;
    var l = Math.min(0, Math.max(W - dw, W / 2 - st.cx * dw)), t = Math.min(0, Math.max(H - dh, H / 2 - st.cy * dh));
    st.cx = (W / 2 - l) / dw; st.cy = (H / 2 - t) / dh; /* mantém a posição dentro dos limites */
    return { l: l, t: t, dw: dw, dh: dh };
  }
  function drawCrop(ctx, W, H, st) {
    var p = place(W, H, st);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(srcImg, p.l, p.t, p.dw, p.dh);
  }
  function paintPreview() {
    if (!srcImg) return;
    var c = $('nos-crop'), S = SIZES[cur], w = c.clientWidth || 300, dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(w * dpr); c.height = Math.round(w * dpr * S.h / S.w);
    c.style.aspectRatio = S.w + ' / ' + S.h;
    drawCrop(c.getContext('2d'), c.width, c.height, crop[cur]);
  }
  function renderVariant(key) {
    var S = SIZES[key], c = document.createElement('canvas');
    c.width = S.w; c.height = S.h;
    drawCrop(c.getContext('2d'), S.w, S.h, crop[key]);
    return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('blob')); }, 'image/jpeg', .92); });
  }
  function loadImg(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () { srcUrl = url; res(im); };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('img')); };
      im.src = url;
    });
  }
  /* versão geral (aba Nós): até 1600 px */
  function shrink(im) {
    var k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
    c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('blob')); }, 'image/jpeg', .9); });
  }
  function clearPhoto() {
    picked = null; srcImg = null; if (srcUrl) URL.revokeObjectURL(srcUrl); srcUrl = '';
    $('nos-edit').hidden = true; $('nos-file').value = '';
  }
  $('nos-file').addEventListener('change', async function () {
    var f = this.files[0], msg = $('nos-send-msg');
    if (srcUrl) URL.revokeObjectURL(srcUrl); srcUrl = ''; picked = null; srcImg = null; $('nos-edit').hidden = true;
    if (!f) return;
    try {
      srcImg = await loadImg(f); picked = await shrink(srcImg);
      resetCrop(); cur = 'p'; $('nos-zoom').value = 1;
      [].forEach.call(document.querySelectorAll('.nos-tabs button'), function (b) { b.setAttribute('aria-selected', b.dataset.size === cur ? 'true' : 'false'); });
      $('nos-edit').hidden = false; paintPreview(); setMsg(msg, '');
    } catch (e) { clearPhoto(); setMsg(msg, 'Não consegui abrir essa foto. Tente outra.', true); }
  });
  [].forEach.call(document.querySelectorAll('.nos-tabs button'), function (b) {
    b.addEventListener('click', function () {
      cur = b.dataset.size; $('nos-zoom').value = crop[cur].z;
      [].forEach.call(document.querySelectorAll('.nos-tabs button'), function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      paintPreview();
    });
  });
  $('nos-zoom').addEventListener('input', function () { if (srcImg) { crop[cur].z = +this.value; paintPreview(); } });
  (function drag() {
    var c = $('nos-crop'), px = 0, py = 0, on = false;
    c.addEventListener('pointerdown', function (e) { on = true; px = e.clientX; py = e.clientY; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', function (e) {
      if (!on || !srcImg) return;
      var k = c.width / c.clientWidth, st = crop[cur], p = place(c.width, c.height, st);
      st.cx -= (e.clientX - px) * k / p.dw; st.cy -= (e.clientY - py) * k / p.dh;
      px = e.clientX; py = e.clientY; paintPreview();
    });
    ['pointerup', 'pointercancel'].forEach(function (n) { c.addEventListener(n, function () { on = false; }); });
  })();
  addEventListener('resize', paintPreview);
  $('nos-text').addEventListener('input', function () { $('nos-count').textContent = this.value.length + '/280'; });

  /* ---------- enviar ---------- */
  $('nos-send-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var msg = $('nos-send-msg'), btn = e.target.querySelector('button[type=submit]'), text = $('nos-text').value.trim();
    if (!picked && !text) { setMsg(msg, 'Escolha uma foto ou escreva uma frase.', true); return; }
    btn.disabled = true; setMsg(msg, 'Enviando…');
    try {
      var path = null;
      if (picked) {
        path = me.id + '/' + Date.now() + '.jpg';
        var up = await sb.storage.from('nos').upload(path, picked, { contentType: 'image/jpeg' });
        if (up.error) throw up.error;
        /* uma versão pronta para cada tamanho de widget: ...-p.jpg, ...-m.jpg, ...-g.jpg */
        var outs = await Promise.all(['p', 'm', 'g'].map(function (k) {
          return renderVariant(k).then(function (b) { return sb.storage.from('nos').upload(path.replace('.jpg', '-' + k + '.jpg'), b, { contentType: 'image/jpeg' }); });
        }));
        outs.forEach(function (o) { if (o.error) throw o.error; });
      }
      var ins = await sb.from('recados').insert({ texto: text || null, foto_path: path });
      if (ins.error) throw ins.error;
      $('nos-text').value = ''; $('nos-count').textContent = '0/280'; clearPhoto(); setMsg(msg, 'Enviado! 💌');
      loadFeed();
    } catch (err) { setMsg(msg, 'Não deu para enviar. Confira a internet e tente de novo.', true); }
    btn.disabled = false;
  });

  /* ---------- lista ---------- */
  async function loadFeed() {
    var box = $('nos-feed');
    if (!loadedOnce) box.innerHTML = '<p class="nos-empty">Carregando…</p>';
    var r = await sb.from('recados').select('id,de,texto,foto_path,criado_em').order('criado_em', { ascending: false }).limit(40);
    if (r.error) { box.innerHTML = '<p class="nos-empty">Não consegui carregar agora.</p>'; return; }
    loadedOnce = true;
    var rows = r.data, urls = {};
    var paths = rows.filter(function (x) { return x.foto_path; }).map(function (x) { return x.foto_path; });
    if (paths.length) {
      var s = await sb.storage.from('nos').createSignedUrls(paths, 3600);
      (s.data || []).forEach(function (x) { if (x.signedUrl) urls[x.path] = x.signedUrl; });
    }
    if (!rows.length) { box.innerHTML = '<p class="nos-empty">Nada por aqui ainda. Mande o primeiro recado. 💌</p>'; return; }
    box.innerHTML = '';
    rows.forEach(function (x) {
      var mine = x.de === me.id, li = document.createElement('article');
      li.className = 'nos-item' + (mine ? ' mine' : '');
      var d = new Date(x.criado_em);
      var when = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      li.innerHTML = '<p class="nos-meta">' + (mine ? 'Você' : 'Seu amor') + ' · ' + when + '</p>' +
        (x.foto_path && urls[x.foto_path] ? '<img alt="Foto enviada" loading="lazy" src="' + esc(urls[x.foto_path]) + '">' : '') +
        (x.texto ? '<p class="nos-text-out">' + esc(x.texto) + '</p>' : '') +
        (mine ? '<button type="button" class="link nos-del">Apagar</button>' : '');
      var del = li.querySelector('.nos-del');
      if (del) del.addEventListener('click', async function () {
        if (!confirm('Apagar este recado?')) return;
        if (x.foto_path) await sb.storage.from('nos').remove(['.jpg', '-p.jpg', '-m.jpg', '-g.jpg'].map(function (e) { return x.foto_path.replace('.jpg', e); }));
        await sb.from('recados').delete().eq('id', x.id);
        loadFeed();
      });
      box.appendChild(li);
    });
  }

  /* abre a aba: confere se já há sessão e atualiza a lista */
  window.addEventListener('viewchange', async function (e) {
    if (e.detail !== 'nos') return;
    var r = await sb.auth.getSession();
    render(r.data.session ? r.data.session.user : null);
  });
})();
