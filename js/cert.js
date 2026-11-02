/* Apex Frames — certifikatat e garancisë: lista, krijimi, pamja/PDF dhe verifikimi online (API: /api/cert) */
(function () {
  'use strict';
  const A = window.AF, ST = window.AFStore;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const root = $('#certs');
  const TOKEN_KEY = 'af_cert_token';
  const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } };
  const setToken = t => { try { localStorage.setItem(TOKEN_KEY, t); } catch (e) { /* injoro */ } };
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const t = new Date(); return pad(t.getDate()) + '/' + pad(t.getMonth() + 1) + '/' + t.getFullYear(); };
  const toIso = s => { const m = String(s || '').match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : ''; };
  const fromIso = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; };
  const verifyUrl = nr => location.origin + '/v/' + nr;

  let toastT = null;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2800); }
  function confirmDlg(msg, ok) {
    return new Promise(res => {
      const d = $('#dlg');
      if (!d.showModal) { res(window.confirm(msg)); return; }
      $('#dlg-msg').textContent = msg; $('#dlg-ok').textContent = ok || 'Po'; d.returnValue = 'no';
      d.addEventListener('close', () => res(d.returnValue === 'yes'), { once: true }); d.showModal();
    });
  }

  /* ---------- API ---------- */
  async function api(method, qs, body) {
    let r;
    try {
      r = await fetch('/api/cert' + (qs || ''), { method, cache: 'no-store', headers: Object.assign({ authorization: 'Bearer ' + getToken() }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
    } catch (e) { const er = new Error('Nuk u lidh me serverin. Kontrollo internetin.'); er.code = 'net'; throw er; }
    let d = null; try { d = await r.json(); } catch (e) { /* jo JSON */ }
    if (!d) { const er = new Error('Serveri i certifikatave nuk është aktiv (Netlify Functions mungon në këtë adresë).'); er.code = 'nofn'; throw er; }
    if (!r.ok) { const er = new Error(d.error || 'Gabim ' + r.status); er.code = r.status === 401 ? 'auth' : 'http'; er.status = r.status; throw er; }
    return d;
  }

  /* ---------- dokumenti i certifikatës ---------- */
  function qrSvg(text) {
    try { const q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); }
    catch (e) { return ''; }
  }
  function certHtml(c) {
    const url = verifyUrl(c.nr);
    return `<div class="cert ${c.revoked ? 'revoked' : ''}">
      <img class="wm" src="assets/icon.svg" alt="">
      <img class="lg" src="assets/icon.svg" alt="Apex Frames">
      <h1>Certifikatë garancie</h1><div class="sub">Apex Frames Albania</div>
      <div class="nrbox">Nr. ${esc(c.nr)}</div>
      <p class="intro">Kjo certifikatë vërteton se produkti i blerë nga <b>APEX FRAMES SH.P.K</b> është i mbrojtur nga garancia zyrtare e kompanisë sonë.</p>
      <div class="blk"><b class="h">Përshkrimi i garancisë</b><ul>
        <li>Garancia mbulon defektet e materialit dhe prodhimit për një periudhë prej ${esc(c.years)} vitesh nga data e blerjes.</li>
        <li>Shërbimi i garancisë përfshin riparimin ose zëvendësimin e produktit pa asnjë kosto shtesë për klientin.</li>
        <li>Garancia është e vlefshme vetëm nëse produkti është përdorur sipas udhëzimeve dhe nuk është dëmtuar nga faktorë të jashtëm.</li></ul>
        <b class="h">Kufizime</b><ul>
        <li>Garancia nuk mbulon dëmtimet e shkaktuara nga përdorimi i gabuar, aksidentet, kushtet ekstreme të motit ose ndërhyrjet e paautorizuara.</li>
        <li>Shpenzimet e transportit ose montimit nuk përfshihen.</li></ul></div>
      <div class="cl"><b class="h">Të dhënat e klientit</b>
        <div class="r"><span>Emri:</span><b>${esc(c.name)}</b></div>
        <div class="r"><span>Data e blerjes:</span><b>${esc(c.purchaseDate)}</b></div>
        <div class="r"><span>Garancia deri më:</span><b>${esc(c.validUntil)}</b></div>
        <div class="r"><span>Produkti:</span><b>${esc(c.product)}</b></div></div>
      <div class="tag">Apex Frames Albania garanton cilësinë, sigurinë dhe jetëgjatësinë e çdo produkti të saj.</div>
      <div class="motto">“Your vision framed with precision – in harmony with nature.”</div>
      <div class="sg">Administratori<img src="assets/signature.png" alt=""><div class="ln">Emrulla Manuka</div></div>
      <div class="vf"><div class="qr">${qrSvg(url)}</div><div><b>Verifiko këtë certifikatë online:</b><div class="u">${esc(url.replace(/^https?:\/\//, ''))}</div>Skano kodin QR ose shkruaj numrin ${esc(c.nr)} në faqen e verifikimit.</div></div>
    </div>`;
  }
  function fitCert() {
    const w = $('.cwrap', root), s = $('.cscale', root);
    if (!w || !s) return;
    const z = Math.min(1, (w.clientWidth - 24) / (210 * 96 / 25.4));
    s.style.zoom = z;
  }

  /* ---------- pamjet ---------- */
  const head = (right) => `<header class="top"><div class="top-in">
    <div class="brand"><button class="ghost back" data-go="#/" aria-label="Kthehu te arkivi">‹ Arkivi</button><img src="assets/icon.svg" alt=""><div><b>Apex Frames</b><span>Certifikatat e garancisë</span></div></div>
    <div class="top-act">${right || ''}</div></div></header>`;

  const tokenCard = () => `<section class="card"><h2>Çelësi i administratorit</h2>
    <p style="margin:0 0 10px;font-size:14px;color:var(--mute)">Certifikatat e vërteta jepen vetëm me çelësin që ke vendosur në Netlify (<code>CERT_ADMIN_TOKEN</code>). Ruhet vetëm në këtë shfletues.</p>
    <div style="display:flex;gap:8px"><input id="tok" class="inp" type="password" placeholder="Çelësi i administratorit" value="${esc(getToken())}" autocomplete="off"><button class="primary" data-act="savetok">Ruaj</button></div></section>`;

  const errCard = e => `<div class="banner">${esc(e.message)}${e.code === 'auth' ? '' : ''}</div>`;
  const stPill = c => c.revoked ? '<span class="pill st-lost" style="padding:4px 12px">Anuluar</span>' : '<span class="pill st-won" style="padding:4px 12px">Aktive</span>';

  let cache = [], filter = '';
  async function showList() {
    root.innerHTML = head('<button class="primary" data-go="#/c/new">+ Certifikatë e re</button>') + `<div class="layout one"><main class="form">
      <div class="view-h"><h1>Certifikatat e garancisë</h1><p>Çdo certifikatë ka numër unik dhe verifikohet online nga klienti.</p></div>
      <div id="c-err"></div>${getToken() ? '' : tokenCard()}
      <div class="filters"><input id="c-q" class="inp" type="search" placeholder="Kërko sipas numrit, klientit ose produktit…" value="${esc(filter)}"></div>
      <div id="c-list"><div class="empty"><span>Po ngarkohen…</span></div></div>
      <details class="foot-note"><summary>Çelësi i administratorit</summary>${tokenCard()}</details>
    </main></div>`;
    if (!getToken()) { $('#c-list').innerHTML = ''; return; }
    try { cache = (await api('GET', '?list=1')).certs; drawList(); }
    catch (e) { $('#c-list').innerHTML = ''; $('#c-err').innerHTML = errCard(e); }
  }
  function drawList() {
    const t = filter.trim().toLowerCase();
    const list = cache.filter(c => !t || [c.nr, c.name, c.product, c.quoteRef].join(' ').toLowerCase().indexOf(t) >= 0);
    $('#c-list').innerHTML = !list.length ? `<div class="empty"><b>${cache.length ? 'Asnjë rezultat' : 'Ende nuk ka certifikata'}</b><span>${cache.length ? 'Provo një kërkim tjetër.' : 'Shtyp “+ Certifikatë e re”. Numri i parë është AF-' + new Date().getFullYear() + '-875.'}</span></div>`
      : `<div class="card" style="padding:0;overflow:hidden">${list.map(c => `<div class="qrow crow" data-go="#/c/${esc(c.nr)}" tabindex="0" role="link">
        <div class="q-main"><div class="q-ref">${esc(c.nr)}</div><div class="q-sub">${esc(c.name)} · ${esc(c.product.split('\n')[0])}</div></div>
        <div class="q-date" style="width:auto">${esc(c.purchaseDate)}</div><div class="q-tot" style="font-weight:500;font-size:13.5px">deri ${esc(c.validUntil)}</div><div class="q-st">${stPill(c)}</div><div></div></div>`).join('')}</div>`;
  }

  function quoteProduct(q) {
    const S = q.state; const out = [];
    (S.sections || []).forEach(sec => (sec.items || []).forEach(it => { if (String(it.desc || '').trim()) out.push(it.desc.trim() + (String(it.note || '').trim() ? ' (' + it.note.trim() + ')' : '')); }));
    return out.join('\n');
  }
  function showNew(preQuote) {
    const qs = ST.quotes().sort((a, b) => (b.date + b.ref).localeCompare(a.date + a.ref));
    root.innerHTML = head() + `<div class="layout one"><main class="form">
      <div class="view-h"><h1>Certifikatë e re</h1><p>Plotëso të dhënat. Numri jepet vetë nga serveri (AF-VVVV-NR).</p></div>
      <div id="c-err"></div>${getToken() ? '' : tokenCard()}
      <section class="card"><h2>Nga një preventiv (opsionale)</h2>
        <div class="f"><label for="n-q">Preventivi</label><div class="wrap"><select id="n-q"><option value="">— pa preventiv —</option>${qs.map(q => `<option value="${q.id}" ${preQuote === q.id ? 'selected' : ''}>${esc(q.ref)} · ${esc(q.client || 'Pa klient')}</option>`).join('')}</select></div><span class="hint">Plotëson emrin dhe produktet nga preventivi; mund t'i ndryshosh.</span></div></section>
      <section class="card"><h2>Të dhënat e certifikatës</h2><div class="grid">
        <div class="f s4"><label for="n-name">Emri i klientit</label><div class="wrap"><input id="n-name" autocomplete="off" placeholder="p.sh. Test Klient SHPK"></div></div>
        <div class="f s4"><label for="n-prod">Produkti</label><div class="wrap"><textarea id="n-prod" rows="3" placeholder="p.sh. 3 dritare uPVC Aluplast, Jet Black"></textarea></div><span class="hint">Një produkt për rresht.</span></div>
        <div class="f s2"><label for="n-date">Data e blerjes</label><div class="wrap"><input id="n-date" type="date" value="${toIso(today())}"></div></div>
        <div class="f s2"><label for="n-years">Garancia (vite)</label><div class="wrap"><input id="n-years" inputmode="numeric" value="5"></div></div>
      </div></section>
      <div style="display:flex;gap:10px;justify-content:flex-end"><button class="secondary" data-go="#/c">Anulo</button><button class="primary" data-act="issue">Gjenero certifikatën</button></div>
    </main></div>`;
    const sel = $('#n-q');
    const fill = () => { const q = ST.getQuote(sel.value); if (!q) return; $('#n-name').value = q.client || ''; $('#n-prod').value = quoteProduct(q); const d = toIso(q.state.meta.date); if (d) $('#n-date').value = d; };
    sel.addEventListener('change', fill); if (preQuote) fill();
  }
  async function issue(btn) {
    const q = ST.getQuote($('#n-q').value);
    btn.disabled = true; btn.textContent = 'Po gjenerohet…';
    try {
      const c = await api('POST', '', { action: 'issue', name: $('#n-name').value, product: $('#n-prod').value, purchaseDate: fromIso($('#n-date').value), years: $('#n-years').value, quoteRef: q ? q.ref : '' });
      toast('✓ Certifikata ' + c.nr + ' u krijua'); location.hash = '#/c/' + c.nr;
    } catch (e) { $('#c-err').innerHTML = errCard(e); btn.disabled = false; btn.textContent = 'Gjenero certifikatën'; window.scrollTo(0, 0); }
  }

  let cur = null;
  async function showOne(nr) {
    root.innerHTML = head() + `<div class="layout one"><main class="form"><div id="c-err"></div><div class="empty"><span>Po ngarkohet…</span></div></main></div>`;
    try { cur = await api('GET', '?nr=' + encodeURIComponent(nr) + '&full=1'); } catch (e) { root.querySelector('.form').innerHTML = errCard(e) + (e.code === 'auth' ? tokenCard() : '') + '<button class="secondary" data-go="#/c">‹ Lista</button>'; return; }
    const url = verifyUrl(cur.nr);
    root.innerHTML = head(`<button class="ghost" data-act="cpurl" title="Kopjo lidhjen e verifikimit">Kopjo lidhjen</button><button class="primary" data-act="pdfc">Shkarko PDF</button>`) + `<div class="layout one"><main class="form">
      <div class="view-h"><h1>${esc(cur.nr)} ${stPill(cur)}</h1><p>${esc(cur.name)} · lëshuar ${esc((cur.issuedAt || '').slice(0, 10).split('-').reverse().join('/'))}${cur.quoteRef ? ' · preventivi ' + esc(cur.quoteRef) : ''}</p></div>
      <section class="card"><h2>Verifikimi online</h2><p style="margin:0 0 10px;font-size:14.5px">Klienti e verifikon në: <b>${esc(url.replace(/^https?:\/\//, ''))}</b></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="secondary" data-act="cpurl">Kopjo lidhjen</button><a class="secondary" style="text-decoration:none" href="${esc('/v/' + cur.nr)}" target="_blank" rel="noopener"><button class="secondary" tabindex="-1">Hap faqen e verifikimit</button></a>
        <button class="secondary" data-act="revoke">${cur.revoked ? 'Riaktivizo certifikatën' : 'Anulo certifikatën'}</button></div></section>
      <div class="paper-wrap cwrap"><div class="cscale">${certHtml(cur)}</div></div>
    </main></div>`;
    fitCert();
  }
  function printCert() {
    $('#printroot').innerHTML = certHtml(cur);
    const old = document.title; document.title = 'Certifikate_' + cur.nr;
    toast('Në dritaren e printimit zgjidh “Save as PDF”');
    setTimeout(() => { window.print(); setTimeout(() => { document.title = old; }, 500); }, 350);
  }

  /* ---------- ngjarjet ---------- */
  root.addEventListener('click', async e => {
    const go = e.target.closest('[data-go]'); if (go) { location.hash = go.dataset.go; return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'savetok') { setToken($('#tok').value.trim()); toast('✓ Çelësi u ruajt'); route(location.hash); }
    else if (a === 'issue') issue(b);
    else if (a === 'pdfc') printCert();
    else if (a === 'cpurl') { try { await navigator.clipboard.writeText(verifyUrl(cur.nr)); toast('✓ Lidhja u kopjua'); } catch (er) { toast(verifyUrl(cur.nr)); } }
    else if (a === 'revoke') {
      if (!cur.revoked && !(await confirmDlg('Të anulohet certifikata ' + cur.nr + '? Faqja e verifikimit do të tregojë “e anuluar”.', 'Anuloje'))) return;
      try { await api('POST', '', { action: 'revoke', nr: cur.nr, revoked: !cur.revoked }); toast('✓ U përditësua'); showOne(cur.nr); } catch (er) { toast(er.message); }
    }
  });
  root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset && e.target.dataset.go) location.hash = e.target.dataset.go; });
  root.addEventListener('input', e => { if (e.target.id === 'c-q') { filter = e.target.value; drawList(); } });
  window.addEventListener('resize', fitCert);

  function route(h) {
    const m = String(h || '').match(/^#\/c(?:\/(.+))?$/);
    if (!m || !m[1]) return showList();
    if (m[1].indexOf('new') === 0) { const q = (h.split('?q=')[1] || ''); return showNew(q); }
    return showOne(decodeURIComponent(m[1]));
  }
  window.AFCert = { show: route };
})();
