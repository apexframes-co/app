/* Apex Frames — arkivi i preventivave: foldera (kompani), numërimi, statuset dhe grupimi sipas vitit/muajit.
   Ruhet në localStorage të shfletuesit; kopja rezervë (JSON) shërben për ta kaluar në pajisje tjetër. */
(function (root) {
  'use strict';
  const A = root.AF;
  const KEY = 'af_registry_v1';

  const STATUSES = [
    { k: 'draft', l: 'Draft' },
    { k: 'sent', l: 'Dërguar' },
    { k: 'won', l: 'Pranuar' },
    { k: 'prod', l: 'Në prodhim' },
    { k: 'installed', l: 'Montuar' },
    { k: 'done', l: 'Mbyllur' },
    { k: 'lost', l: 'Refuzuar' }
  ];
  const WON = ['won', 'prod', 'installed', 'done'];
  const MONTHS = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
  const statusLabel = k => (STATUSES.find(s => s.k === k) || STATUSES[0]).l;

  let R = load();
  function load() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY));
      if (r && Array.isArray(r.quotes) && Array.isArray(r.folders)) return r;
    } catch (e) { /* ruajtja lokale mund të mungojë */ }
    return { v: 1, folders: [], quotes: [] };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(R)); } catch (e) { /* injoro */ } }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const nowIso = () => new Date().toISOString();

  /* ---------- data ---------- */
  function isoOfDmy(s) {
    const m = String(s || '').match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/);
    return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : '';
  }
  const quoteDate = q => isoOfDmy(q.state && q.state.meta && q.state.meta.date) || (q.created || '').slice(0, 10);

  /* ---------- foldera ---------- */
  const codeFromName = name => {
    const c = String(name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return c.slice(0, 5);
  };
  const folders = () => R.folders.slice().sort((a, b) => a.name.localeCompare(b.name, 'sq'));
  const getFolder = id => R.folders.find(f => f.id === id) || null;
  function addFolder(f) {
    const nf = { id: uid(), name: (f.name || '').trim() || 'Folder pa emër', code: (f.code || codeFromName(f.name) || 'GEN').toUpperCase(),
      contact: f.contact || '', address: f.address || '', notes: f.notes || '', created: nowIso() };
    R.folders.push(nf); save(); return nf;
  }
  function updateFolder(id, f) {
    const x = getFolder(id); if (!x) return null;
    ['name', 'code', 'contact', 'address', 'notes'].forEach(k => { if (f[k] != null) x[k] = k === 'code' ? String(f[k]).toUpperCase().replace(/[^A-Z0-9]/g, '') : f[k]; });
    save(); return x;
  }
  function deleteFolder(id) {
    R.folders = R.folders.filter(f => f.id !== id);
    R.quotes.forEach(q => { if (q.folderId === id) q.folderId = null; });
    save();
  }

  /* ---------- numërimi ---------- */
  function refPrefix(code, year) { return 'AF-' + year + '-' + (code || 'GEN') + '-'; }
  function refTaken(ref, exceptId) {
    const r = String(ref || '').trim().toLowerCase();
    return !!r && R.quotes.some(q => q.id !== exceptId && String(q.ref || '').trim().toLowerCase() === r);
  }
  function nextRef(code, year, exceptId) {
    const pre = refPrefix(code, year);
    let max = 0;
    R.quotes.forEach(q => {
      if (q.id === exceptId) return;
      const r = String(q.ref || '');
      if (r.toUpperCase().startsWith(pre.toUpperCase())) { const n = parseInt(r.slice(pre.length), 10); if (n > max) max = n; }
    });
    let n = max + 1, ref;
    do { ref = pre + String(n).padStart(2, '0'); n++; } while (refTaken(ref, exceptId));
    return ref;
  }

  /* ---------- preventivat ---------- */
  const quotes = () => R.quotes.slice();
  const getQuote = id => R.quotes.find(q => q.id === id) || null;
  function summarize(q) {
    const S = q.state, C = A.compute(S);
    q.ref = (S.meta.ref || '').trim(); q.client = S.client.name || ''; q.project = S.meta.project || '';
    q.total = C.total; q.cur = S.cur; q.date = quoteDate(q); q.updated = nowIso();
  }
  function createQuote(folderId) {
    const S = A.defaultState(), f = getFolder(folderId), year = new Date().getFullYear();
    if (f) { S.client.name = f.name; S.client.address = f.address || ''; S.client.contact = f.contact || ''; }
    S.meta.ref = nextRef(f ? f.code : 'GEN', year);
    const q = { id: uid(), folderId: f ? f.id : null, status: 'draft', created: nowIso(), autoRef: S.meta.ref, state: S };
    summarize(q); R.quotes.push(q); save(); return q;
  }
  function importState(state, folderId) {
    const S = Object.assign(A.defaultState(), state);
    const q = { id: uid(), folderId: folderId || null, status: 'draft', created: nowIso(), autoRef: '', state: S };
    if (refTaken(S.meta.ref)) S.meta.ref = nextRef('GEN', new Date().getFullYear());
    summarize(q); R.quotes.push(q); save(); return q;
  }
  function saveQuote(id, state) {
    const q = getQuote(id); if (!q) return null;
    q.state = state; summarize(q); save(); return q;
  }
  function setStatus(id, k) { const q = getQuote(id); if (q) { q.status = k; q.updated = nowIso(); save(); } }
  function setFolder(id, folderId) { const q = getQuote(id); if (q) { q.folderId = folderId || null; q.updated = nowIso(); save(); } }
  function duplicateQuote(id) {
    const o = getQuote(id); if (!o) return null;
    const f = getFolder(o.folderId), S = JSON.parse(JSON.stringify(o.state));
    const t = new Date(), pad = n => String(n).padStart(2, '0');
    S.meta.date = pad(t.getDate()) + '/' + pad(t.getMonth() + 1) + '/' + t.getFullYear();
    S.meta.ref = nextRef(f ? f.code : 'GEN', t.getFullYear());
    const q = { id: uid(), folderId: o.folderId, status: 'draft', created: nowIso(), autoRef: S.meta.ref, state: S };
    summarize(q); R.quotes.push(q); save(); return q;
  }
  function deleteQuote(id) { R.quotes = R.quotes.filter(q => q.id !== id); save(); }

  /* ---------- grupimi: vit → muaj ---------- */
  function sums(list) {
    const o = {};
    list.forEach(q => { o[q.cur] = (o[q.cur] || 0) + (q.total || 0); });
    return o;
  }
  const fmtSums = o => { const k = Object.keys(o); return k.length ? k.map(c => A.money(o[c], c)).join(' · ') : '—'; };
  function group(list) {
    const years = {};
    list.slice().sort((a, b) => (b.date + b.ref).localeCompare(a.date + a.ref)).forEach(q => {
      const y = (q.date || '').slice(0, 4) || '—', m = parseInt((q.date || '').slice(5, 7), 10) || 0;
      const Y = years[y] || (years[y] = { year: y, months: {}, list: [] });
      (Y.months[m] || (Y.months[m] = { month: m, name: MONTHS[m - 1] || 'Pa datë', list: [] })).list.push(q);
      Y.list.push(q);
    });
    return Object.keys(years).sort((a, b) => b.localeCompare(a)).map(y => {
      const Y = years[y];
      return { year: y, list: Y.list, months: Object.keys(Y.months).map(Number).sort((a, b) => b - a).map(m => Y.months[m]) };
    });
  }

  /* ---------- kopja rezervë ---------- */
  const exportAll = () => JSON.stringify({ app: 'apex-preventiv-arkiv', v: 1, exported: nowIso(), folders: R.folders, quotes: R.quotes }, null, 2);
  function importAll(text) {
    const d = JSON.parse(text);
    if (!d || !Array.isArray(d.quotes) || !Array.isArray(d.folders)) throw new Error('Skedari nuk është kopje rezervë e arkivit.');
    let nf = 0, nq = 0;
    d.folders.forEach(f => { if (!getFolder(f.id)) { R.folders.push(f); nf++; } });
    d.quotes.forEach(q => {
      const ex = getQuote(q.id);
      if (!ex) { R.quotes.push(q); nq++; }
      else if (String(q.updated || '') > String(ex.updated || '')) { Object.assign(ex, q); nq++; }
    });
    save(); return { folders: nf, quotes: nq };
  }

  /* migrimi i draftit të vjetër (një preventiv) në arkiv */
  (function migrate() {
    try {
      const raw = localStorage.getItem('af_preventiv_draft_v1');
      if (raw && !R.quotes.length) { const s = JSON.parse(raw); if (s && s.client) { importState(s); } }
      if (raw) localStorage.removeItem('af_preventiv_draft_v1');
    } catch (e) { /* injoro */ }
  })();

  const api = {
    STATUSES: STATUSES, WON: WON, MONTHS: MONTHS, statusLabel: statusLabel, codeFromName: codeFromName,
    folders: folders, getFolder: getFolder, addFolder: addFolder, updateFolder: updateFolder, deleteFolder: deleteFolder,
    quotes: quotes, getQuote: getQuote, createQuote: createQuote, importState: importState, saveQuote: saveQuote, setStatus: setStatus,
    setFolder: setFolder, duplicateQuote: duplicateQuote, deleteQuote: deleteQuote, nextRef: nextRef, refTaken: refTaken,
    group: group, sums: sums, fmtSums: fmtSums, exportAll: exportAll, importAll: importAll, quoteDate: quoteDate
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AFStore = api;
})(typeof window !== 'undefined' ? window : globalThis);
