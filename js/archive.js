/* Apex Frames — faqja kryesore: arkivi i preventivave (vit → muaj), foldera për kompanitë, statuset e procesit, kopja rezervë */
(function () {
  'use strict';
  const A = window.AF, ST = window.AFStore;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const home = $('#home');
  const view = { q: '', status: '', folder: '' }; // filtrat e faqes kryesore
  const openYears = new Set(); let yearsInit = false;

  /* ---------- ndihmëse ---------- */
  let toastT = null;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); }
  function confirmDlg(msg, okLabel) {
    return new Promise(res => {
      const d = $('#dlg');
      if (!d.showModal) { res(window.confirm(msg)); return; }
      $('#dlg-msg').textContent = msg; $('#dlg-ok').textContent = okLabel || 'Po';
      d.returnValue = 'no';
      d.addEventListener('close', () => res(d.returnValue === 'yes'), { once: true });
      d.showModal();
    });
  }
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  /* dialog me fusha: kthen objektin e vlerave ose null */
  function formDlg(title, fields, okLabel, extra) {
    return new Promise(res => {
      const d = document.createElement('dialog'); d.className = 'fdlg';
      d.innerHTML = `<form method="dialog"><h3>${esc(title)}</h3>${extra || ''}<div class="fd-grid">${fields.map(f => `<div class="f ${f.cls || ''}"><label for="fd_${f.k}">${f.l}${f.opt ? ' <small>(opsionale)</small>' : ''}</label>${
        f.type === 'select' ? `<select id="fd_${f.k}" name="${f.k}">${f.opts.map(o => `<option value="${esc(o[0])}" ${o[0] === f.v ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`
          : f.type === 'area' ? `<textarea id="fd_${f.k}" name="${f.k}" rows="3" placeholder="${esc(f.ph || '')}">${esc(f.v || '')}</textarea>`
            : `<input id="fd_${f.k}" name="${f.k}" value="${esc(f.v || '')}" placeholder="${esc(f.ph || '')}" autocomplete="off">`}${f.hint ? `<span class="hint">${f.hint}</span>` : ''}</div>`).join('')}</div>
        <div class="dlg-act"><button value="no" class="ghost" formnovalidate>Anulo</button><button value="yes" class="primary">${esc(okLabel || 'Ruaj')}</button></div></form>`;
      document.body.appendChild(d);
      const codeEl = d.querySelector('[name=code]'), nameEl = d.querySelector('[name=name]');
      if (codeEl && nameEl && !codeEl.value) nameEl.addEventListener('input', () => { if (!codeEl.dataset.touched) codeEl.value = ST.codeFromName(nameEl.value); });
      if (codeEl) codeEl.addEventListener('input', () => { codeEl.dataset.touched = '1'; });
      d.addEventListener('close', () => {
        const ok = d.returnValue === 'yes', out = {};
        d.querySelectorAll('[name]').forEach(e => { out[e.name] = e.value; });
        d.remove(); res(ok ? out : null);
      });
      d.showModal();
      const first = d.querySelector('input,select,textarea'); if (first) first.focus();
    });
  }
  const folderFields = (f) => [
    { k: 'name', l: 'Emri i kompanisë', v: f.name, ph: 'p.sh. Test Klient SHPK', cls: 's2' },
    { k: 'code', l: 'Kodi për numrat', v: f.code, ph: 'TEST', hint: 'Del në numrin e preventivit: AF-2026-<b>TEST</b>-01' },
    { k: 'contact', l: 'Kontakti', v: f.contact, ph: 'Telefon / email', opt: true },
    { k: 'address', l: 'Adresa', v: f.address, ph: 'Rr. Elbasanit, Tiranë', opt: true, cls: 's2' },
    { k: 'notes', l: 'Shënime për bashkëpunimin dhe procesin', v: f.notes, type: 'area', opt: true, cls: 's2', ph: 'p.sh. kontakti kryesor, kushtet e veçanta, afatet…' }
  ];

  /* ---------- pamja ---------- */
  const stPill = (q, cls) => `<select class="pill st-${q.status} ${cls || ''}" data-status="${q.id}" aria-label="Statusi i ${esc(q.ref)}">${ST.STATUSES.map(x => `<option value="${x.k}" ${q.status === x.k ? 'selected' : ''}>${x.l}</option>`).join('')}</select>`;

  function rowHtml(q, showFolder) {
    const f = ST.getFolder(q.folderId), d = (q.date || '').split('-');
    const dd = d.length === 3 ? d[2] + '/' + d[1] : '';
    return `<div class="qrow" data-open="${q.id}" tabindex="0" role="link" aria-label="Hap ${esc(q.ref)}">
      <div class="q-main"><div class="q-ref">${esc(q.ref || '(pa numër)')}</div>
        <div class="q-sub">${esc(q.client || 'Pa klient')}${q.project ? ' · ' + esc(q.project) : ''}</div>
        ${showFolder && f ? `<span class="badge">${esc(f.name)}</span>` : ''}</div>
      <div class="q-date">${dd}</div>
      <div class="q-tot">${A.money(q.total || 0, q.cur)}</div>
      <div class="q-st">${stPill(q)}</div>
      <div class="q-act"><button type="button" class="icon" data-dup="${q.id}" title="Dublikoje (numër i ri)" aria-label="Dublikoje">⧉</button><button type="button" class="icon del" data-del="${q.id}" title="Fshije" aria-label="Fshije">✕</button></div>
    </div>`;
  }

  function filtered() {
    const t = view.q.trim().toLowerCase();
    return ST.quotes().filter(q => {
      if (view.folder && (view.folder === 'none' ? q.folderId : q.folderId !== view.folder)) return false;
      if (view.status && q.status !== view.status) return false;
      if (t) { const f = ST.getFolder(q.folderId); const hay = [q.ref, q.client, q.project, f && f.name].join(' ').toLowerCase(); if (hay.indexOf(t) < 0) return false; }
      return true;
    });
  }

  function listHtml(list, showFolder) {
    if (!list.length) return `<div class="empty"><b>${ST.quotes().length ? 'Asnjë preventiv nuk përputhet me filtrat' : 'Ende nuk ka preventiva'}</b><span>${ST.quotes().length ? 'Hiq filtrat ose kërko diçka tjetër.' : 'Shtyp “+ Preventiv i ri” për të krijuar të parin. Numri jepet vetë.'}</span></div>`;
    const groups = ST.group(list);
    if (!yearsInit) { yearsInit = true; if (groups[0]) openYears.add(groups[0].year); }
    return groups.map(Y => `<details class="year" data-year="${Y.year}" ${openYears.has(Y.year) || view.q || view.status ? 'open' : ''}>
      <summary><span class="y-t">${Y.year}</span><span class="y-m">${Y.list.length} preventiva</span><span class="y-s">${esc(ST.fmtSums(ST.sums(Y.list)))}</span></summary>
      ${Y.months.map(M => `<div class="month"><div class="m-h"><b>${M.name}</b><span>${M.list.length} · ${esc(ST.fmtSums(ST.sums(M.list)))}</span></div>${M.list.map(q => rowHtml(q, showFolder)).join('')}</div>`).join('')}
    </details>`).join('');
  }

  function renderHome() {
    const all = ST.quotes(), list = filtered(), folder = ST.getFolder(view.folder);
    if (view.folder && view.folder !== 'none' && !folder) view.folder = '';
    const won = all.filter(q => ST.WON.indexOf(q.status) >= 0), open = all.filter(q => q.status === 'sent');
    const fs = ST.folders();
    const chip = (id, label, n) => `<button type="button" class="chip ${view.folder === id ? 'on' : ''}" data-folder="${id}">${esc(label)} <small>${n}</small></button>`;
    const fpanel = folder ? (() => { const fq = all.filter(q => q.folderId === folder.id); return `
      <section class="card fpanel"><div class="fp-h"><div><h2>${esc(folder.name)} <span class="badge">${esc(folder.code)}</span></h2>
        <div class="fp-sub">${[folder.contact, folder.address].filter(Boolean).map(esc).join(' · ') || 'Pa të dhëna kontakti'}</div></div>
        <div class="fp-act"><button type="button" class="secondary" data-act="editfolder">Ndrysho</button><button type="button" class="icon del" data-act="delfolder" title="Fshi folderin" aria-label="Fshi folderin">✕</button></div></div>
        ${folder.notes ? `<p class="fp-notes">${esc(folder.notes).replace(/\n/g, '<br>')}</p>` : ''}
        <div class="fp-stats"><span><b>${fq.length}</b> preventiva</span><span>Vlera: <b>${esc(ST.fmtSums(ST.sums(fq)))}</b></span><span>Të pranuara: <b>${esc(ST.fmtSums(ST.sums(fq.filter(q => ST.WON.indexOf(q.status) >= 0))))}</b></span></div>
      </section>`; })() : '';
    home.innerHTML = `
    <header class="top"><div class="top-in">
      <div class="brand"><img src="assets/icon.svg" alt=""><div><b>Apex Frames</b><span>Arkivi i preventivave</span></div></div>
      <div class="top-act"><button class="ghost" data-act="certs" title="Certifikatat e garancisë">Garancitë</button><button class="ghost" data-act="backup" title="Shkarko kopje rezervë të gjithë arkivit">Kopje rezervë</button><button class="ghost" data-act="restore" title="Rikthe ose bashko një kopje rezervë">Rikthe</button><button class="primary" data-act="newq">+ Preventiv i ri</button></div>
    </div></header>
    <div class="layout one"><main class="form">
      <div class="stats">
        <div class="stat"><small>Preventiva</small><b>${all.length}</b></div>
        <div class="stat"><small>Dërguar (në pritje)</small><b>${esc(ST.fmtSums(ST.sums(open)))}</b></div>
        <div class="stat"><small>Pranuar / në proces</small><b>${esc(ST.fmtSums(ST.sums(won)))}</b></div>
      </div>
      <div class="fbar"><div class="chips">${chip('', 'Të gjitha', all.length)}${fs.map(f => chip(f.id, f.name, all.filter(q => q.folderId === f.id).length)).join('')}${all.some(q => !q.folderId) && fs.length ? chip('none', 'Pa folder', all.filter(q => !q.folderId).length) : ''}
        <button type="button" class="chip add" data-act="newfolder">+ Folder i ri</button></div></div>
      ${fpanel}
      <div class="filters"><input id="h-q" class="inp" type="search" placeholder="Kërko sipas numrit, klientit, projektit…" value="${esc(view.q)}" aria-label="Kërko">
        <select id="h-st" class="inp" aria-label="Filtro sipas statusit"><option value="">Të gjitha statuset</option>${ST.STATUSES.map(x => `<option value="${x.k}" ${view.status === x.k ? 'selected' : ''}>${x.l}</option>`).join('')}</select>
        ${folder ? `<button type="button" class="primary" data-act="newq">+ Preventiv në këtë folder</button>` : ''}</div>
      <div id="h-list">${listHtml(list, !folder)}</div>
      <p class="foot-note">Arkivi ruhet në këtë shfletues. Për ta kaluar në kompjuter ose telefon tjetër përdor <b>Kopje rezervë</b> dhe <b>Rikthe</b>.</p>
    </main></div>`;
  }

  function refreshList() {
    const folder = ST.getFolder(view.folder);
    $('#h-list').innerHTML = listHtml(filtered(), !folder);
  }

  /* ---------- veprimet ---------- */
  async function newQuote() {
    let fid = view.folder && view.folder !== 'none' ? view.folder : '';
    if (!fid && ST.folders().length) {
      const r = await formDlg('Preventiv i ri', [{ k: 'folder', l: 'Për cilën kompani?', type: 'select', v: '', cls: 's2', hint: 'Zgjidh folderin që të plotësohen të dhënat e klientit dhe numri vetë.',
        opts: [['', '— pa folder (klient i rastësishëm) —']].concat(ST.folders().map(f => [f.id, f.name]))}], 'Vazhdo');
      if (!r) return; fid = r.folder;
    }
    const q = ST.createQuote(fid);
    location.hash = '#/q/' + q.id;
  }
  async function newFolder() {
    const r = await formDlg('Folder i ri (kompani)', folderFields({ name: '', code: '', contact: '', address: '', notes: '' }), 'Krijo folderin');
    if (!r) return;
    if (!r.name.trim()) { toast('Shkruaj emrin e kompanisë'); return; }
    const f = ST.addFolder(r); view.folder = f.id; renderHome(); toast('✓ Folderi u krijua');
  }
  async function editFolder() {
    const f = ST.getFolder(view.folder); if (!f) return;
    const r = await formDlg('Ndrysho folderin', folderFields(f), 'Ruaj');
    if (!r) return;
    ST.updateFolder(f.id, r); renderHome(); toast('✓ U ruajt');
  }
  async function delFolder() {
    const f = ST.getFolder(view.folder); if (!f) return;
    const n = ST.quotes().filter(q => q.folderId === f.id).length;
    if (!(await confirmDlg('Të fshihet folderi “' + f.name + '”? ' + (n ? n + ' preventiva nuk fshihen, por mbeten pa folder.' : ''), 'Fshije'))) return;
    ST.deleteFolder(f.id); view.folder = ''; renderHome();
  }

  home.addEventListener('click', async e => {
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'certs') { location.hash = '#/c'; return; }
      if (a === 'newq') return newQuote();
      if (a === 'newfolder') return newFolder();
      if (a === 'editfolder') return editFolder();
      if (a === 'delfolder') return delFolder();
      if (a === 'backup') { download(new Blob([ST.exportAll()], { type: 'application/json' }), 'Apex_arkivi_' + new Date().toISOString().slice(0, 10) + '.json'); toast('✓ Kopja rezervë u shkarkua'); return; }
      if (a === 'restore') { $('#file-arch').click(); return; }
    }
    const ch = e.target.closest('[data-folder]');
    if (ch) { view.folder = ch.dataset.folder; location.hash = view.folder && view.folder !== 'none' ? '#/f/' + view.folder : '#/'; renderHome(); return; }
    const dup = e.target.closest('[data-dup]');
    if (dup) { const q = ST.duplicateQuote(dup.dataset.dup); toast('Dublikuar si ' + q.ref); location.hash = '#/q/' + q.id; return; }
    const del = e.target.closest('[data-del]');
    if (del) {
      const q = ST.getQuote(del.dataset.del);
      if (await confirmDlg('Të fshihet preventivi ' + q.ref + (q.client ? ' (' + q.client + ')' : '') + '? Kjo nuk kthehet.', 'Fshije')) { ST.deleteQuote(q.id); renderHome(); }
      return;
    }
    if (e.target.closest('select')) return;
    const row = e.target.closest('[data-open]');
    if (row) location.hash = '#/q/' + row.dataset.open;
    const sm = e.target.closest('summary'); // mbaj mend vitet e hapura
    if (sm) { const d = sm.parentElement, y = d.dataset.year; setTimeout(() => { if (d.open) openYears.add(y); else openYears.delete(y); }, 0); }
  });
  home.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset && e.target.dataset.open) location.hash = '#/q/' + e.target.dataset.open; });
  home.addEventListener('input', e => { if (e.target.id === 'h-q') { view.q = e.target.value; refreshList(); } });
  home.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'h-st') { view.status = el.value; refreshList(); }
    else if (el.dataset.status) { ST.setStatus(el.dataset.status, el.value); el.className = 'pill st-' + el.value; toast('Statusi: ' + ST.statusLabel(el.value)); renderStatsOnly(); }
  });
  function renderStatsOnly() { const y = window.scrollY; renderHome(); window.scrollTo(0, y); }

  const fileArch = document.createElement('input');
  fileArch.type = 'file'; fileArch.id = 'file-arch'; fileArch.accept = '.json,application/json'; fileArch.hidden = true; document.body.appendChild(fileArch);
  fileArch.addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { const n = ST.importAll(r.result); renderHome(); toast('✓ Rikthyen ' + n.quotes + ' preventiva dhe ' + n.folders + ' foldera'); }
      catch (err) { toast(err.message || 'Skedari nuk lexohet.'); }
    };
    r.readAsText(f); e.target.value = '';
  });

  /* ---------- routeri (#/, #/f/ID, #/q/ID) ---------- */
  function route() {
    const h = location.hash || '#/';
    if (/^#\/c(\/|$)/.test(h)) {
      window.AFEditor.close(); $('#app').hidden = true; home.hidden = true; $('#certs').hidden = false;
      document.title = 'Certifikata garancie — Apex Frames'; window.AFCert.show(h); window.scrollTo(0, 0); return;
    }
    $('#certs').hidden = true;
    let m = h.match(/^#\/q\/(.+)$/);
    if (m && ST.getQuote(m[1])) {
      home.hidden = true; $('#app').hidden = false;
      window.AFEditor.open(m[1]);
      return;
    }
    window.AFEditor.close();
    $('#app').hidden = true; home.hidden = false;
    m = h.match(/^#\/f\/(.+)$/);
    view.folder = m && ST.getFolder(m[1]) ? m[1] : (view.folder === 'none' ? 'none' : '');
    if (!m && view.folder !== 'none') view.folder = '';
    document.title = 'Arkivi — Apex Frames';
    renderHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();
