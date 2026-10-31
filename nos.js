/* Nós dois: login (Supabase) e recados com foto e frase entre as duas contas. */
(function () {
  var SB_URL = 'https://fapfosqocvtawkhgavap.supabase.co';
  var SB_KEY = 'sb_publishable_gklz-L7kiemOKagFhu5GWg_cUZdYk0J'; // chave pública, feita para ficar no site
  var PEOPLE = { 'fernandinhomlima@gmail.com': 'Fernando' }; // 'email@exemplo.com': 'Nome', para mostrar o nome em vez de "Seu amor"

  var $ = function (id) { return document.getElementById(id); };
  if (!window.supabase || !$('view-nos')) return;
  var sb = window.supabase.createClient(SB_URL, SB_KEY);
  var me = null, picked = null;

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function setMsg(el, text, bad) { el.textContent = text || ''; el.classList.toggle('bad', !!bad); }

  /* álbum: gera links temporários das fotos privadas (pasta album/ do armazenamento) */
  var CK = 'nos-cache-v1';
  function readCache(uid) { try { var c = JSON.parse(localStorage.getItem(CK)); return c && c.uid === uid ? c : null; } catch (e) { return null; } }
  function writeCache(o) { try { localStorage.setItem(CK, JSON.stringify(o)); } catch (e) {} }
  function preload(m) { Object.keys(m).forEach(function (k) { var i = new Image(); i.decoding = 'async'; i.src = m[k]; }); }
  async function loadAlbum(user) {
    if (!window.setAlbumUrls) return;
    if (!user) { window.setAlbumUrls({}); return; }
    /* Os links das fotos e o conteúdo ficam guardados neste aparelho: nas próximas vezes o álbum
       aparece na hora (mesmo link = a foto já está no cache do navegador) e é atualizado por baixo. */
    var cache = readCache(user.id) || { uid: user.id }, shown = false;
    if (cache.dados && window.applyContent) {
      window.applyContent(cache.dados);
      if (cache.urls && cache.exp > Date.now()) { window.setAlbumUrls(cache.urls); preload(cache.urls); shown = true; }
    }
    /* carta, quiz, linha do tempo e legendas: tabela privada, só para quem está logado */
    var c = await sb.from('conteudo').select('dados').eq('id', 'site').maybeSingle();
    if (c.data && window.applyContent) {
      var novoStr = JSON.stringify(c.data.dados);
      if (novoStr !== JSON.stringify(cache.dados)) { window.applyContent(c.data.dados); cache.dados = c.data.dados; shown = false; }
    }
    var paths = window.ALBUM_PATHS || [], m = {};
    if (shown && cache.urls && paths.every(function (p) { return cache.urls[p]; })) { writeCache(cache); return; }
    var r = await sb.storage.from('nos').createSignedUrls(paths, 604800);
    (r.data || []).forEach(function (x) { if (x.signedUrl) m[x.path] = x.signedUrl; });
    /* Se algum não estiver em album/NN.jpg (pasta com outro nome, subpasta do zip, raiz do bucket),
       procura pelo nome do arquivo (01, 02, ...) nessas pastas. */
    var missing = paths.filter(function (p) { return !m[p]; });
    if (missing.length) {
      var found = await findPhotos(), toSign = [], back = {};
      missing.forEach(function (p) { var f = found[baseName(p)]; if (f) { toSign.push(f); back[f] = p; } });
      if (toSign.length) {
        var r2 = await sb.storage.from('nos').createSignedUrls(toSign, 604800);
        (r2.data || []).forEach(function (x) { if (x.signedUrl) m[back[x.path]] = x.signedUrl; });
      }
    }
    window.setAlbumUrls(m); preload(m);
    cache.urls = m; cache.exp = Date.now() + 6 * 86400000; writeCache(cache);
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
    if (user) { $('nos-who').textContent = PEOPLE[user.email] || user.email; }
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
  $('nos-logout').addEventListener('click', async function () { await sb.auth.signOut(); try { localStorage.removeItem(CK); } catch (e) {} window.nosAuthed = false; location.hash = ''; location.reload(); });

  /* ---------- foto: enquadramento por tamanho de widget ---------- */
  /* Cada tamanho de widget recebe a sua própria versão da foto, recortada como você escolher e já no
     tamanho exato em pixels (alta resolução). Assim o iPhone não precisa reduzir a foto e ela fica nítida. */
  var SIZES = { p: { w: 720, h: 720 }, m: { w: 1500, h: 701 }, g: { w: 1500, h: 1571 } };
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
    return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('blob')); }, 'image/jpeg', .95); });
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
    var k = Math.min(1, 2000 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
    c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('blob')); }, 'image/jpeg', .93); });
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
  $('nos-cancel').addEventListener('click', function () { clearPhoto(); setMsg($('nos-send-msg'), ''); });
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
    } catch (err) { setMsg(msg, 'Não deu para enviar. Confira a internet e tente de novo.', true); }
    btn.disabled = false;
  });

  /* abre a aba: confere se já há sessão e atualiza a lista */
  window.addEventListener('viewchange', async function (e) {
    if (e.detail !== 'nos') return;
    var r = await sb.auth.getSession();
    render(r.data.session ? r.data.session.user : null);
  });

  /* =====================================================================
     Recado mais recente (cartão no Início + tela "Recado novo") e avisos no celular
     ===================================================================== */
  var VAPID_PUBLIC = 'BIv1V1cB_Gd_QC8zU-L1sKfsX_OAD_pxcF6CDg1KpB-c3dkztRVAxFs3sDk3vh6F677wN1dUnZc0A7rgl3hcqAg';

  function mostrarRecadoNovo() {
    var dlg = $('recado-dialog');
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
  }
  $('recado-dialog').addEventListener('click', function (e) { if (e.target === this) this.close(); });

  /* ---------- avisos (notificações) ---------- */
  function b64(s) {
    var p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')), a = new Uint8Array(r.length);
    for (var i = 0; i < r.length; i++) a[i] = r.charCodeAt(i);
    return a;
  }
  function instalado() { return window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches); }
  var swReg = null;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(function (r) { swReg = r; }).catch(function () {});
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'recado-novo' && window.nosAuthed) { window.openApp && window.openApp(); mostrarRecadoNovo(); }
    });
  }
  async function prepararAvisos() {
    var box = $('nos-avisos'), btn = $('nos-avisos-btn'), txt = $('nos-avisos-txt');
    if (!box) return;
    box.hidden = false; btn.hidden = true;
    if (!instalado() || !('PushManager' in window)) {
      txt.textContent = 'Para receber avisos de recado novo, abra o site pela tela inicial: Compartilhar → Adicionar à Tela de Início.';
      return;
    }
    if (Notification.permission === 'denied') {
      txt.textContent = 'Os avisos estão bloqueados. Ative em Ajustes → Notificações → Nós dois.';
      return;
    }
    var reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
    if (sub && Notification.permission === 'granted') {
      /* garante que o aparelho está registrado na conta atual */
      var j = sub.toJSON();
      await sb.from('push_subs').upsert({ user_id: me.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: 'endpoint' });
      txt.textContent = 'Avisos ativados neste aparelho ✓ Você recebe uma notificação quando chegar um recado.';
      return;
    }
    txt.textContent = 'Receba uma notificação no celular quando chegar um recado novo.';
    btn.hidden = false;
  }
  $('nos-avisos-btn').addEventListener('click', async function () {
    var btn = this, txt = $('nos-avisos-txt');
    btn.disabled = true;
    try {
      var perm = await Notification.requestPermission();
      if (perm !== 'granted') { txt.textContent = 'Sem permissão não dá para avisar. Ative em Ajustes → Notificações → Nós dois.'; btn.disabled = false; return; }
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(VAPID_PUBLIC) });
      var j = sub.toJSON();
      var r = await sb.from('push_subs').upsert({ user_id: me.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: 'endpoint' });
      if (r.error) throw r.error;
      btn.hidden = true;
      txt.textContent = 'Avisos ativados neste aparelho ✓ Você recebe uma notificação quando chegar um recado.';
    } catch (e) {
      txt.textContent = 'Não consegui ativar os avisos agora. Tente de novo em instantes.';
    }
    btn.disabled = false;
  });

  /* quando há login: carrega o cartão e prepara os avisos; abre a tela "Recado novo" se veio da notificação */
  var antesRender = render;
  render = function (user) {
    antesRender(user);
    if (user) {
      prepararAvisos().catch(function () {});
      if (/[?&]recado=1/.test(location.search) && !window.__recadoAberto) {
        window.__recadoAberto = true;
        setTimeout(function () { window.openApp && window.openApp(); mostrarRecadoNovo(); try { history.replaceState(null, '', location.pathname); } catch (e) {} }, 400);
      }
    }
  };
})();
