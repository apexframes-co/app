/* Apex Frames — Gjeneruesi i preventivave: ndërfaqja (editor WYSIWYG) */
(function () {
  'use strict';
  const A = window.AF;
  const KEY = 'af_preventiv_draft_v1';
  let S = load();
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- gjendja ---------- */
  function load() {
    const base = A.defaultState();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(base, JSON.parse(raw));
    } catch (e) { /* ruajtja lokale mund të mungojë */ }
    return base;
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* injoro */ } }
  function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
  function setPath(o, p, v) {
    const ks = p.split('.'), last = ks.pop();
    const t = ks.reduce((a, k) => a[k], o);
    t[last] = v;
  }
  const dec = () => A.decOf(S.cur);

  /* ---------- ndërtimi i DOM ---------- */
  function fv(path, fmtIt) {
    let v = getPath(S, path);
    if (fmtIt && A.isNum(v) && String(v).trim() !== '') v = A.fmt(A.num(v), dec());
    return v == null ? '' : v;
  }
  const ce = (path, ph, single, cls) =>
    `<div contenteditable="true" data-k="${path}" data-ph="${esc(ph || '')}" ${single ? 'data-single="1"' : ''} class="${cls || ''}">${esc(getPath(S, path))}</div>`;
  const inp = (path, ph, mode, fmtIt, dis) =>
    `<input data-k="${path}" value="${esc(fv(path, fmtIt))}" placeholder="${esc(ph || '')}" inputmode="${mode || 'decimal'}" ${fmtIt ? 'data-fmt="1"' : ''} ${dis ? 'disabled' : ''}>`;

  function rowHtml(si, ii) {
    const it = S.sections[si].items[ii], p = `sections.${si}.items.${ii}`;
    const u = it.unit;
    const wOn = u === 'm2' || u === 'ml', hOn = u === 'm2';
    const unitSel = `<select data-k="${p}.unit">` +
      Object.keys(A.UNITS).map(k => `<option value="${k}" ${u === k ? 'selected' : ''}>${A.UNITS[k].label}</option>`).join('') + '</select>';
    return `<tr>
      <td>${ii + 1}</td>
      <td class="c">${inp(p + '.q', '1', 'decimal')}</td>
      <td>${ce(p + '.desc', 'Modeli / përshkrimi')}${ce(p + '.note', 'specifikim: profili, ngjyra, xhami…', false, 'note')}</td>
      <td class="u">${unitSel}</td>
      <td class="r">${inp(p + '.w', wOn ? 'mm' : '', 'numeric', false, !wOn)}</td>
      <td class="r">${inp(p + '.h', hOn ? 'mm' : '', 'numeric', false, !hOn)}</td>
      <td class="r" data-out="r.${si}.${ii}.lbl"></td>
      <td class="r">${inp(p + '.p', '0', 'decimal', true)}</td>
      <td class="r" data-out="r.${si}.${ii}.val"></td>
      <td class="act"><button class="btn-s" data-act="dup" data-si="${si}" data-ii="${ii}" title="Dublikoje">⧉</button><button class="btn-s" data-act="delrow" data-si="${si}" data-ii="${ii}" title="Fshije">×</button></td>
    </tr>`;
  }

  function sectionHtml(si) {
    const sec = S.sections[si];
    return `<div class="sec">
      <div class="sec-h">${ce(`sections.${si}.title`, 'Titulli i seksionit', true, 'st')}
        <span class="noprint"><button class="btn-s" data-act="secup" data-si="${si}" title="Lart">▲</button><button class="btn-s" data-act="secdn" data-si="${si}" title="Poshtë">▼</button><button class="btn-s" data-act="delsec" data-si="${si}" title="Fshi seksionin">× seksioni</button></span></div>
      <table class="items">
        <colgroup><col style="width:6mm"><col style="width:10mm"><col><col style="width:14mm"><col style="width:13mm"><col style="width:13mm"><col style="width:17mm"><col style="width:16mm"><col style="width:21mm"><col class="act" style="width:11mm"></colgroup>
        <thead><tr><th>#</th><th class="c">Sasi</th><th>Modeli / Përshkrimi</th><th>Njësia</th><th class="r">Gjer. mm</th><th class="r">Lart. mm</th><th class="r">Sip. / Sasia</th><th class="r" data-out="hp">Çmimi</th><th class="r" data-out="ht">Total</th><th class="act"></th></tr></thead>
        <tbody>${sec.items.map((_, ii) => rowHtml(si, ii)).join('')}
        <tr class="tt"><td colspan="6">Total <span data-out="s.${si}.n"></span> zë</td><td class="r nt" data-out="s.${si}.m2"></td><td></td><td class="r" data-out="s.${si}.tot"></td><td class="act"></td></tr></tbody>
      </table>
      <button class="add" data-act="addrow" data-si="${si}">+ Shto rresht</button>
    </div>`;
  }

  function stageHtml(i) {
    const n = S.pay.length, last = i === n - 1, p = `pay.${i}`;
    return `<div class="tile">
      <div class="l">${ce(p + '.label', 'Emërtimi', true)}<span class="pc">${last ? `<span data-out="st.${i}.pct"></span>` : inp(p + '.pct', '0', 'decimal')}%</span>
        <button class="btn-s" data-act="delstage" data-i="${i}" title="Hiqe fazën">×</button></div>
      <div class="when">${ce(p + '.when', 'kur paguhet', true)}</div>
      <div class="v" data-out="st.${i}.amt"></div>
      <div class="w" data-out="st.${i}.w"></div>
    </div>`;
  }

  function termsHtml() {
    const lines = String(S.terms || '').split('\n').map(x => x.trim()).filter(Boolean);
    return `<div class="terms">
      <div>Çmimet janë të vlefshme <span data-out="vd"></span> ditë nga data e lëshimit.</div>
      <div data-out="payline"></div>
      <section contenteditable="true" data-k="terms" data-ph="Kushte shtesë (një për rresht)">${lines.map(l => `<div>${esc(l)}</div>`).join('')}</section>
    </div>`;
  }

  function render() {
    const preset = Object.keys(A.SECTION_PRESETS).map(k => `<option value="${k}">${A.SECTION_PRESETS[k].title}</option>`).join('');
    const payOpts = [['50-50', '50% / 50%'], ['50-30-20', '50% / 30% / 20%'], ['20-80', '20% / 80% (shërbim)'], ['100', '100% (një pagesë)']]
      .map(([k, l]) => `<option value="${k}" ${S.payPreset === k ? 'selected' : ''}>${l}</option>`).join('');
    $('#doc').innerHTML = `
    <div class="hd">
      <div class="brandbox"><img src="assets/icon.svg" alt="Apex Frames"><div><div class="bn">Apex Frames</div><div class="bs">Dritare &amp; Dyer Premium</div><div class="bc">www.apexframes.co | info@apexframes.co<br>+355 698 881 333</div></div></div>
      <div class="meta">
        <div class="dt">Preventiv #${ce('meta.ref', 'AF-2026-XXX-01', true)}</div>
        <div class="mrow">Data: ${ce('meta.date', 'dd/mm/vvvv', true)}</div>
        <div class="mrow">Vlefshmëria: ${inp('meta.validDays', '30', 'numeric')} ditë (deri më <span data-out="valid"></span>)</div>
        <div class="mrow">Projekt: ${ce('meta.project', 'p.sh. 3 dritare uPVC', true)}</div>
      </div>
    </div>
    <div class="boxes">
      <div class="box"><div class="lab">Klienti</div>
        <div class="row"><span>Emri / Kompania:</span>${ce('client.name', '…', true)}</div>
        <div class="row"><span>Adresa:</span>${ce('client.address', '…', true)}</div>
        <div class="row"><span>Kontakti:</span>${ce('client.contact', 'telefon / email', true)}</div></div>
      <div class="box"><div class="lab">Projekti</div>
        <div class="row"><span>Vendndodhja:</span>${ce('proj.location', '…', true)}</div>
        <div class="row"><span>Prodhimi:</span>${ce('proj.production', '…', true)}</div>
        <div class="row"><span>Montimi:</span>${ce('proj.install', '…', true)}</div></div>
    </div>
    ${S.sections.map((_, i) => sectionHtml(i)).join('')}
    <div class="addsec noprint"><span>Shto seksion:</span><select id="newsec">${preset}</select><button class="add" style="margin:0" data-act="addsec">+ Seksion</button></div>

    <div class="blk"><div class="h2">Përmbledhja e çmimeve</div>
    <div class="tiles">
      <div class="tile"><div class="l">Nëntotal</div><div class="v"><span data-out="sub"></span></div></div>
      <div class="tile"><div class="l">Zbritje <select data-k="disc.mode"><option value="pct" ${S.disc.mode === 'pct' ? 'selected' : ''}>%</option><option value="amt" ${S.disc.mode === 'amt' ? 'selected' : ''}>${S.cur}</option></select></div><div class="v">${inp('disc.v', '0', 'decimal', S.disc.mode === 'amt')}</div><div class="sub" data-out="disc"></div></div>
      <div class="tile"><div class="l">Transport</div><div class="v">${inp('transport', 'E përfshirë', 'text', true)}</div></div>
      <div class="tile"><div class="l">Montim</div><div class="v">${inp('montim', 'E përfshirë', 'text', true)}</div></div>
      <div class="tile"><div class="l">Shërbime të tjera</div><div class="v">${inp('other', '0', 'text', true)}</div></div>
    </div>
    <div class="totbar"><div class="l">Total përfundimtar</div><div class="v" data-out="total"></div></div>
    <div class="words">Totali me fjalë: <span data-out="totw"></span>.</div></div>

    <div class="blk"><div class="h2">Kushtet e pagesës</div>
    <div class="tiles pay">${S.pay.map((_, i) => stageHtml(i)).join('')}</div></div>
    <div class="paytools noprint"><span>Plani i pagesës:</span><select id="paypreset">${payOpts}</select><button class="add" style="margin:0" data-act="addstage">+ Fazë</button></div>

    <div class="cols">
      <div><div class="lab">Çfarë përfshihet</div>${ce('includes', 'Një zë për rresht')}</div>
      <div><div class="lab">Nuk përfshihet</div>${ce('excludes', 'Një zë për rresht')}</div>
    </div>
    <div class="warr">${ce('warrantyTitle', 'Titulli', true, 'wt')}${ce('warranty', 'Teksti i garancisë')}</div>
    <div class="h2">Termat dhe kushtet</div>
    ${termsHtml()}
    <div class="notes">${ce('notes', 'Shënime shtesë (opsionale)')}</div>

    <div class="sig">
      <div>Për Apex Frames:<div class="sl"></div><div class="sm"><span>Firma / Vula</span><span>Data: ___ / ___ / _______</span></div><div style="font-size:9pt;color:#888;margin-top:1mm">Administrator: Emrulla Manuka</div></div>
      <div><div class="nm">Klienti: ${ce('signClient', 'emri / kompania', true)}</div><div class="sl"></div><div class="sm"><span>Firma</span><span>Data: ___ / ___ / _______</span></div></div>
    </div>
    <div class="ft"><div><span><b>Apex Frames SHPK</b> | NUIS M62116046U | Innovation Hub, Piramida e Tiranës (kati -1), Tiranë</span><span>www.apexframes.co | +355 698 881 333</span></div></div>
`;
    $('#cur').value = S.cur;
    recalc();
  }

  /* ---------- rillogaritja (pa prekur fushat) ---------- */
  function out(key, text) { const e = $(`[data-out="${key}"]`); if (e) e.textContent = text; }
  let C = null;
  function recalc() {
    C = A.compute(S);
    const f = n => A.fmt(n, C.d);
    S.sections.forEach((sec, si) => {
      C.secs[si].items.forEach((c, ii) => { out(`r.${si}.${ii}.lbl`, c.lbl); out(`r.${si}.${ii}.val`, f(c.val)); });
      out(`s.${si}.n`, sec.items.length); out(`s.${si}.tot`, f(C.secs[si].total));
      out(`s.${si}.m2`, C.secs[si].m2 ? C.secs[si].m2.toFixed(3) + ' m²' : '');
    });
    $$('[data-out="hp"]').forEach(e => e.textContent = 'Çmimi (' + C.cur + ')');
    $$('[data-out="ht"]').forEach(e => e.textContent = 'Total (' + C.cur + ')');
    out('sub', A.money(C.sub, C.cur)); out('total', A.money(C.total, C.cur)); out('totw', C.totalWords);
    out('disc', C.disc ? '− ' + A.money(C.disc, C.cur) : '');
    out('valid', C.valid); out('vd', S.meta.validDays || '30');
    S.pay.forEach((s, i) => {
      out(`st.${i}.amt`, A.money(C.stages[i].amt, C.cur)); out(`st.${i}.w`, C.stages[i].words);
      out(`st.${i}.pct`, C.stages[i].pct);
    });
    out('payline', A.paymentSentence(S, C));
  }

  /* ---------- ngjarjet ---------- */
  const doc = $('#doc');
  doc.addEventListener('input', e => {
    const el = e.target, k = el.dataset && el.dataset.k;
    if (!k) return;
    let v = el.isContentEditable ? el.innerText.replace(/\n+$/, '') : el.value;
    setPath(S, k, v);
    recalc(); persist();
  });
  doc.addEventListener('change', e => {
    const el = e.target, k = el.dataset && el.dataset.k;
    if (el.id === 'paypreset') { S.payPreset = el.value; S.pay = JSON.parse(JSON.stringify(A.PAY_PRESETS[el.value])); render(); persist(); return; }
    if (!k) return;
    if (el.tagName === 'SELECT') {
      setPath(S, k, el.value); persist(); render(); return;
    }
    if (el.dataset.fmt && A.isNum(el.value) && el.value.trim() !== '') { el.value = A.fmt(A.num(el.value), dec()); }
  });
  doc.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.single) e.preventDefault();
  });
  doc.addEventListener('paste', e => {
    if (e.target.isContentEditable) {
      e.preventDefault();
      const t = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, e.target.dataset.single ? t.replace(/\s*\n\s*/g, ' ') : t);
    }
  });
  doc.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act, si = +b.dataset.si, ii = +b.dataset.ii, i = +b.dataset.i;
    const sec = S.sections[si];
    if (a === 'addrow') { const last = sec.items[sec.items.length - 1]; sec.items.push(A.newItem(last ? last.unit : 'm2')); }
    else if (a === 'delrow') { if (sec.items.length > 1) sec.items.splice(ii, 1); else sec.items[0] = A.newItem(sec.items[0].unit); }
    else if (a === 'dup') sec.items.splice(ii + 1, 0, JSON.parse(JSON.stringify(sec.items[ii])));
    else if (a === 'delsec') { if (S.sections.length > 1) { if (confirm('Të fshihet i gjithë seksioni?')) S.sections.splice(si, 1); } else return; }
    else if (a === 'secup' && si > 0) S.sections.splice(si - 1, 0, S.sections.splice(si, 1)[0]);
    else if (a === 'secdn' && si < S.sections.length - 1) S.sections.splice(si + 1, 0, S.sections.splice(si, 1)[0]);
    else if (a === 'addsec') {
      const p = A.SECTION_PRESETS[$('#newsec').value];
      S.sections.push({ title: p.title, items: [A.newItem(p.unit)] });
    }
    else if (a === 'addstage') { S.payPreset = 'custom'; S.pay.splice(S.pay.length - 1, 0, { label: 'Pagesa e ndërmjetme', pct: 0, when: '' }); }
    else if (a === 'delstage') { if (S.pay.length > 1) { S.payPreset = 'custom'; S.pay.splice(i, 1); } else return; }
    else return;
    persist(); render();
  });

  /* ---------- veglat ---------- */
  $('#cur').addEventListener('change', e => {
    S.cur = e.target.value; persist(); render();
  });
  $('#btn-new').addEventListener('click', () => {
    if (confirm('Të fillohet një preventiv i ri? Ndryshimet aktuale do të humbasin (ruaje më parë si JSON nëse të duhet).')) {
      S = A.defaultState(); persist(); render();
    }
  });
  $('#btn-pdf').addEventListener('click', () => {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const old = document.title;
    document.title = 'Preventiv_' + (S.meta.ref || 'AF').replace(/[^\w\-]+/g, '_');
    setTimeout(() => { window.print(); setTimeout(() => { document.title = old; }, 500); }, 50);
  });
  $('#btn-docx').addEventListener('click', async () => {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    try {
      const blob = await window.AFDocx.build(S, A.compute(S));
      download(blob, 'Preventiv_' + (S.meta.ref || 'AF').replace(/[^\w\-]+/g, '_') + '.docx');
    } catch (err) { alert('Eksporti në Word dështoi: ' + err.message); console.error(err); }
  });
  $('#btn-save').addEventListener('click', () => {
    download(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }), 'Preventiv_' + (S.meta.ref || 'AF').replace(/[^\w\-]+/g, '_') + '.json');
  });
  $('#btn-open').addEventListener('click', () => $('#file').click());
  $('#file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { S = Object.assign(A.defaultState(), JSON.parse(r.result)); persist(); render(); }
      catch (err) { alert('Skedari JSON nuk lexohet.'); }
    };
    r.readAsText(f); e.target.value = '';
  });
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  render();
  window.__AF_STATE = () => S; // për teste
})();
