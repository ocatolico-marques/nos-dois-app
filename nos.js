/* Nós dois: login (Supabase) e recados com foto e frase entre as duas contas. */
(function () {
  var SB_URL = 'https://fapfosqocvtawkhgavap.supabase.co';
  var SB_KEY = 'sb_publishable_gklz-L7kiemOKagFhu5GWg_cUZdYk0J'; // chave pública, feita para ficar no site
  var PEOPLE = { 'fernandinhomlima@gmail.com': 'Fernando' }; // 'email@exemplo.com': 'Nome', para mostrar o nome em vez de "Seu amor"

  var $ = function (id) { return document.getElementById(id); };
  if (!window.supabase || !$('view-nos')) return;
  var sb = window.supabase.createClient(SB_URL, SB_KEY);
  var me = null, loadedOnce = false, picked = null, pickedUrl = '';

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function setMsg(el, text, bad) { el.textContent = text || ''; el.classList.toggle('bad', !!bad); }

  /* álbum: gera links temporários das fotos privadas (pasta album/ do armazenamento) */
  async function loadAlbum(user) {
    if (!window.setAlbumUrls) return;
    if (!user) { window.setAlbumUrls({}); return; }
    /* carta, quiz, linha do tempo e legendas: tabela privada, só para quem está logado */
    var c = await sb.from('conteudo').select('dados').eq('id', 'site').maybeSingle();
    if (c.data && window.applyContent) window.applyContent(c.data.dados);
    var r =await sb.storage.from('nos').createSignedUrls(window.ALBUM_PATHS || [], 3600), m = {};
    (r.data || []).forEach(function (x) { if (x.signedUrl) m[x.path] = x.signedUrl; });
    window.setAlbumUrls(m);
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

  /* ---------- foto: reduz antes de enviar (rápido e leve) ---------- */
  function shrink(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var max = 1600, k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
        var c = document.createElement('canvas');
        c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('blob')); }, 'image/jpeg', .85);
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('img')); };
      im.src = url;
    });
  }
  $('nos-file').addEventListener('change', async function () {
    var f = this.files[0], msg = $('nos-send-msg');
    picked = null; if (pickedUrl) URL.revokeObjectURL(pickedUrl); pickedUrl = '';
    $('nos-preview').hidden = true;
    if (!f) return;
    try {
      picked = await shrink(f);
      pickedUrl = URL.createObjectURL(picked);
      $('nos-preview').src = pickedUrl; $('nos-preview').hidden = false; setMsg(msg, '');
    } catch (e) { setMsg(msg, 'Não consegui abrir essa foto. Tente outra.', true); }
  });
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
      }
      var ins = await sb.from('recados').insert({ texto: text || null, foto_path: path });
      if (ins.error) throw ins.error;
      $('nos-text').value = ''; $('nos-count').textContent = '0/280'; $('nos-file').value = '';
      picked = null; $('nos-preview').hidden = true; setMsg(msg, 'Enviado! 💌');
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
        if (x.foto_path) await sb.storage.from('nos').remove([x.foto_path]);
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
