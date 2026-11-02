/* Apex Frames — Gjeneruesi i preventivave: formular me hapa (klienti → zërat → çmimi dhe pagesa → kushtet → rishikim dhe eksport) */
(function () {
  'use strict';
  const A = window.AF;
    const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const clone = o => JSON.parse(JSON.stringify(o));
  const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
  const has = v => String(v == null ? '' : v).trim() !== '';

  const STEPS = [
    { id: 'client', t: 'Klienti', h: 'Të dhënat e klientit', p: 'Kush e merr preventivin dhe për cilin projekt.' },
    { id: 'items', t: 'Zërat', h: 'Zërat e preventivit', p: 'Shto dritare, dyer, grila dhe shërbime. Sipërfaqja dhe totali llogariten vetë.' },
    { id: 'price', t: 'Çmimi dhe pagesa', h: 'Çmimi dhe plani i pagesës', p: 'Zbritje, transport, montim dhe fazat e pagesës.' },
    { id: 'terms', t: 'Kushtet', h: 'Kushtet dhe garancia', p: 'Teksti standard është i plotësuar. Ndrysho vetëm çfarë të duhet.' },
    { id: 'review', t: 'Rishikim dhe eksport', h: 'Rishikim dhe eksport', p: 'Kontrollo preventivin dhe shkarkoje si PDF ose Word.' }
  ];

  /* ---------- gjendja ---------- */
  const ST = window.AFStore;
  let S = null, Q = null, C = null, step = 0;
  let saveTimer = null;
  function persist() {
    if (Q) ST.saveQuote(Q.id, S);
    const el = $('#saved');
    if (el) { el.textContent = '✓ Ruajtur'; el.classList.add('on'); clearTimeout(saveTimer); saveTimer = setTimeout(() => { el.textContent = 'Ruhet automatikisht'; el.classList.remove('on'); }, 1500); }
  }
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  function setPath(o, p, v) {
    const ks = p.split('.'), last = ks.pop();
    ks.reduce((a, k) => a[k], o)[last] = v;
  }
  const fname = ext => 'Preventiv_' + (S.meta.ref || 'AF').replace(/[^\w\-]+/g, '_') + '.' + ext;
  const toIso = s => { const m = String(s || '').match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : ''; };
  const fromIso = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; };

  /* ---------- ndërtuesit e fushave ---------- */
  function field(path, label, o) {
    o = o || {};
    const v = getPath(S, path), id = 'f_' + path.replace(/\./g, '_');
    const cls = 'f ' + (o.cls || '') + (o.suffix ? ' sfx' : '');
    const hint = o.hint ? `<span class="hint">${o.hint}</span>` : '';
    let ctl;
    if (o.area) ctl = `<textarea id="${id}" data-k="${path}" rows="${o.rows || 4}" placeholder="${esc(o.ph || '')}">${esc(v)}</textarea>`;
    else if (o.date) ctl = `<input id="${id}" type="date" data-date="${path}" value="${esc(toIso(v))}">`;
    else ctl = `<input id="${id}" data-k="${path}" value="${esc(v)}" placeholder="${esc(o.ph || '')}" ${o.mode ? `inputmode="${o.mode}"` : ''} autocomplete="off" ${o.ro ? 'readonly' : ''}>`;
    return `<div class="${cls}"><label for="${id}">${label}${o.opt ? ' <small>(opsionale)</small>' : ''}</label><div class="wrap">${ctl}${o.suffix ? `<span class="u">${o.suffix}</span>` : ''}</div>${hint}</div>`;
  }
  const seg = (items, cur, act, extra) => `<div class="seg" role="group">${items.map(([k, l]) => `<button type="button" class="${cur === k ? 'on' : ''}" data-act="${act}" data-v="${k}" ${extra || ''} aria-pressed="${cur === k}">${l}</button>`).join('')}</div>`;

  /* ---------- pamjet e hapave ---------- */
  function viewClient() {
    return `
    <section class="card"><h2>Preventivi</h2>
      <div class="grid">
        ${field('meta.ref', 'Numri i preventivit', { cls: 's2', ph: 'AF-2026-KLIENT-01', hint: '<b class="warn" data-out="refwarn"></b> Jepet vetë nga arkivi; mund ta ndryshosh.' })}
        <div class="f s2"><label for="q_folder">Folderi (kompania)</label><div class="wrap"><select id="q_folder" data-qfolder>${'<option value="">— pa folder —</option>' + ST.folders().map(f => `<option value="${f.id}" ${Q && Q.folderId === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></div><span class="hint">Preventivi ruhet në arkiv nën këtë kompani.</span></div>
        ${field('meta.date', 'Data', { cls: 's2', date: true })}
        ${field('meta.validDays', 'Vlefshmëria', { cls: 's2', mode: 'numeric', suffix: 'ditë', hint: 'Vlen deri më <b data-out="valid"></b>' })}
        <div class="f s2"><span class="lbl">Monedha</span>${seg([['EUR', 'EUR (€)'], ['ALL', 'ALL (Lekë)']], S.cur, 'cur')}</div>
        ${field('meta.project', 'Titulli i projektit', { cls: 's4', ph: 'p.sh. 3 dritare dhe grila', opt: true })}
      </div></section>
    <section class="card"><h2>Klienti</h2>
      <div class="grid">
        ${field('client.name', 'Emri / Kompania', { cls: 's4', ph: 'p.sh. Test Klient SHPK' })}
        ${field('client.address', 'Adresa', { cls: 's2', ph: 'Rr. Elbasanit, Tiranë', opt: true })}
        ${field('client.contact', 'Kontakti', { cls: 's2', ph: 'Telefon ose email', opt: true })}
      </div></section>
    <section class="card"><h2>Projekti</h2>
      <div class="grid">
        ${field('proj.location', 'Vendndodhja', { cls: 's4', ph: 'p.sh. Tiranë', opt: true })}
        ${field('proj.production', 'Afati i prodhimit', { cls: 's2' })}
        ${field('proj.install', 'Afati i montimit', { cls: 's2' })}
      </div></section>`;
  }

  function itemHtml(si, ii) {
    const it = S.sections[si].items[ii], p = `sections.${si}.items.${ii}`, u = it.unit;
    const wOn = u === 'm2' || u === 'ml', hOn = u === 'm2';
    const unitSeg = Object.keys(A.UNITS).map(k => [k, A.UNITS[k].label]);
    const qLbl = u === 'sherbim' ? 'Sasia' : 'Sasia (copë)';
    return `<article class="item" data-item="${si}.${ii}">
      <div class="item-h"><span class="num">${ii + 1}</span><span class="tt" data-out="r.${si}.${ii}.tt"></span><span class="it" data-out="r.${si}.${ii}.val"></span>
        <button type="button" class="icon" data-act="dup" data-si="${si}" data-ii="${ii}" title="Dublikoje zërin" aria-label="Dublikoje zërin">⧉</button>
        <button type="button" class="icon del" data-act="delrow" data-si="${si}" data-ii="${ii}" title="Fshije zërin" aria-label="Fshije zërin">✕</button></div>
      <div class="grid">
        ${field(p + '.desc', 'Modeli / përshkrimi', { cls: 's4', ph: 'p.sh. Dritare uPVC 2 krah, hapje-anash' })}
        ${field(p + '.note', 'Specifikimi', { cls: 's4', ph: 'Profili, ngjyra, xhami…', opt: true })}
        <div class="f s4"><span class="lbl">Njësia e çmimit</span>${seg(unitSeg, u, 'unit', `data-si="${si}" data-ii="${ii}"`)}</div>
        ${wOn ? field(p + '.w', u === 'ml' ? 'Gjatësia' : 'Gjerësia', { mode: 'decimal', suffix: 'mm', ph: '0' }) : ''}
        ${hOn ? field(p + '.h', 'Lartësia', { mode: 'decimal', suffix: 'mm', ph: '0' }) : ''}
        ${field(p + '.q', qLbl, { mode: 'decimal', ph: '1' })}
        ${field(p + '.p', 'Çmimi ' + A.UNITS[u].price, { mode: 'decimal', suffix: S.cur, ph: '0' })}
      </div>
      <div class="calc"><span data-out="r.${si}.${ii}.calc"></span><b data-out="r.${si}.${ii}.val2"></b></div>
    </article>`;
  }

  function viewItems() {
    const chips = Object.keys(A.SECTION_PRESETS).map(k => `<button type="button" class="chip" data-act="addsec" data-v="${k}">+ ${A.SECTION_PRESETS[k].title}</button>`).join('');
    return S.sections.map((sec, si) => `
    <section class="card sec-card">
      <div class="sec-head">
        <input data-k="sections.${si}.title" value="${esc(sec.title)}" placeholder="Titulli i seksionit" aria-label="Titulli i seksionit">
        <span class="sec-tot" data-out="s.${si}.tot"></span>
        <button type="button" class="icon" data-act="secup" data-si="${si}" title="Ngjite" aria-label="Ngjite seksionin" ${si === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" class="icon" data-act="secdn" data-si="${si}" title="Ule" aria-label="Uli seksionin" ${si === S.sections.length - 1 ? 'disabled' : ''}>↓</button>
        <button type="button" class="icon del" data-act="delsec" data-si="${si}" title="Fshi seksionin" aria-label="Fshi seksionin" ${S.sections.length < 2 ? 'disabled' : ''}>✕</button>
      </div>
      <div class="sec-body">${sec.items.map((_, ii) => itemHtml(si, ii)).join('')}
        <button type="button" class="addrow" data-act="addrow" data-si="${si}">+ Shto zë në “${esc(sec.title || 'seksion')}”</button></div>
    </section>`).join('') + `
    <section class="card"><h2>Shto seksion tjetër</h2><div class="chips">${chips}</div></section>`;
  }

  function viewPrice() {
    const presets = [['50-50', '50 / 50', '2 pagesa'], ['50-30-20', '50 / 30 / 20', '3 pagesa'], ['20-80', '20 / 80', 'shërbim'], ['100', '100%', '1 pagesë']];
    if (S.payPreset === 'custom') presets.push(['custom', 'Vetjake', 'e ndryshuar']);
    const n = S.pay.length;
    const stages = S.pay.map((s, i) => {
      const last = i === n - 1, p = `pay.${i}`;
      return `<div class="stage">
        ${field(p + '.label', 'Emërtimi', {})}
        ${last ? `<div class="f"><span class="lbl">%</span><input class="inp" value="" data-out-val="st.${i}.pct" readonly aria-label="Përqindja (llogaritet vetë)"></div>` : field(p + '.pct', '%', { mode: 'decimal' })}
        ${field(p + '.when', 'Kur paguhet', { cls: 'when' })}
        <button type="button" class="icon del" data-act="delstage" data-i="${i}" title="Hiqe fazën" aria-label="Hiqe fazën" ${n < 2 ? 'disabled' : ''}>✕</button>
        <div class="amt"><b data-out="st.${i}.amt"></b> · <span data-out="st.${i}.w"></span></div>
      </div>`;
    }).join('');
    const incl = (path, label) => `<div class="f">${`<label for="f_${path}">${label}</label>`}<div style="display:flex;gap:8px"><input id="f_${path}" data-k="${path}" value="${esc(getPath(S, path))}" placeholder="shumë ose tekst" inputmode="text" autocomplete="off"><button type="button" class="chip" data-act="setval" data-k="${path}" data-v="E përfshirë" style="white-space:nowrap">E përfshirë</button></div></div>`;
    return `
    <section class="card"><h2>Zbritja dhe shtesat</h2>
      <div class="grid">
        <div class="f s2"><span class="lbl">Zbritja</span><div style="display:flex;gap:8px">${seg([['pct', '%'], ['amt', S.cur]], S.disc.mode, 'discmode')}<div style="flex:1;min-width:0"><input class="inp" data-k="disc.v" value="${esc(S.disc.v)}" inputmode="decimal" placeholder="0" aria-label="Vlera e zbritjes"></div></div><span class="hint" style="font-size:12px;color:var(--mute)" data-out="disc"></span></div>
        <div class="s2"></div>
        <div class="s2">${incl('transport', 'Transport')}</div>
        <div class="s2">${incl('montim', 'Montim')}</div>
        <div class="s2">${incl('other', 'Shërbime të tjera')}</div>
      </div></section>
    <section class="card"><h2>Plani i pagesës</h2>
      <div class="opts" style="margin-bottom:8px">${presets.map(([k, a, b]) => `<button type="button" class="opt ${S.payPreset === k ? 'on' : ''}" data-act="preset" data-v="${k}" aria-pressed="${S.payPreset === k}"><b>${a}</b><span>${b}</span></button>`).join('')}</div>
      ${stages}
      <button type="button" class="addrow" data-act="addstage" style="margin-top:6px">+ Shto fazë pagese</button>
      <p class="f"><span class="hint">Faza e fundit llogaritet vetë, kështu që shuma e pagesave është gjithmonë e barabartë me totalin.</span></p>
    </section>`;
  }

  function viewTerms() {
    return `
    <section class="card"><h2>Përfshirja</h2>
      <div class="grid">
        ${field('includes', 'Çfarë përfshihet', { cls: 's2', area: true, rows: 6, hint: 'Një zë për rresht' })}
        ${field('excludes', 'Nuk përfshihet', { cls: 's2', area: true, rows: 6, hint: 'Një zë për rresht' })}
      </div></section>
    <section class="card"><h2>Garancia</h2>
      <div class="grid">${field('warrantyTitle', 'Titulli', { cls: 's4' })}${field('warranty', 'Teksti i garancisë', { cls: 's4', area: true, rows: 5 })}</div></section>
    <section class="card"><h2>Termat dhe kushtet</h2>
      <p style="margin:0 0 10px;font-size:13.5px;color:var(--mute)">Dy kushtet e para (vlefshmëria dhe pagesat) shtohen vetë. Më poshtë shkruaj kushtet shtesë.</p>
      <div class="grid">${field('terms', 'Kushte shtesë', { cls: 's4', area: true, rows: 6, hint: 'Një kusht për rresht' })}
      ${field('notes', 'Shënim shtesë', { cls: 's4', area: true, rows: 3, opt: true, ph: 'Do të shfaqet nën termat' })}
      ${field('signClient', 'Emri i klientit për nënshkrim', { cls: 's4', ph: 'Lëre bosh për vijë të zbrazët', opt: true })}</div></section>`;
  }

  function checks() {
    const out = [], items = [];
    S.sections.forEach((sec, si) => sec.items.forEach((it, ii) => items.push({ sec, it, si, ii })));
    const L = [];
    L.push({ ok: has(S.client.name), t: 'Emri i klientit', s: 0 });
    L.push({ ok: !ST.refTaken(S.meta.ref, Q && Q.id), t: 'Numri i preventivit nuk përsëritet në arkiv', s: 0 });
    L.push({ ok: has(S.meta.ref) && !/^AF-\d{4}-?$/.test(S.meta.ref.trim()), t: 'Numri i preventivit', s: 0 });
    L.push({ ok: items.length > 0 && items.every(x => has(x.it.desc)), t: 'Çdo zë ka përshkrim', s: 1 });
    L.push({ ok: items.every(x => A.num(x.it.p) > 0), t: 'Çdo zë ka çmim', s: 1 });
    L.push({ ok: items.every(x => x.it.unit !== 'm2' || (A.num(x.it.w) > 0 && A.num(x.it.h) > 0)), t: 'Zërat në m² kanë gjerësi dhe lartësi', s: 1 });
    L.push({ ok: C.total > 0, t: 'Totali është më i madh se zero', s: 2 });
    return L.concat(out);
  }
  const stepOk = i => {
    const L = checks();
    if (i === 0) return L[0].ok && L[1].ok && L[2].ok;
    if (i === 1) return L[3].ok && L[4].ok && L[5].ok;
    if (i === 2) return L[6].ok;
    return true;
  };

  function viewReview() {
    const L = checks(), bad = L.filter(x => !x.ok);
    return `
    ${bad.length ? `<div class="banner">Ka ${bad.length} ${bad.length === 1 ? 'gjë' : 'gjëra'} për të kontrolluar para se ta dërgosh preventivin. Mund ta eksportosh edhe kështu.</div>` : '<div class="banner ok">✓ Gjithçka është e plotësuar. Preventivi është gati për eksport.</div>'}
    <section class="card"><h2>Kontrolli</h2><ul class="check">${L.map(x => `<li class="${x.ok ? '' : 'bad'}"><span class="ic">${x.ok ? '✓' : '!'}</span><span class="t">${x.t}</span>${x.ok ? '' : `<button type="button" class="secondary" data-act="goto" data-v="${x.s}">Plotëso</button>`}</li>`).join('')}</ul></section>
    <section class="card"><h2>Procesi</h2><div class="grid"><div class="f s2"><label for="q_status">Statusi i preventivit</label><div class="wrap"><select id="q_status" data-qstatus>${ST.STATUSES.map(x => `<option value="${x.k}" ${Q && Q.status === x.k ? 'selected' : ''}>${x.l}</option>`).join('')}</select></div><span class="hint">Përditësoje sa herë ndryshon procesi (dërguar, pranuar, në prodhim…). Duket në arkiv.</span></div></div></section>
    <section class="card"><h2>Eksporto</h2><div class="export">
      <button type="button" class="primary" data-act="pdf">Shkarko PDF<small>Hapet dritarja e printimit → Save as PDF</small></button>
      <button type="button" class="dark" data-act="docx">Shkarko Word (.docx)<small>Dokument i redaktueshëm</small></button>
      <button type="button" class="secondary" data-act="cert" style="grid-column:1/-1;min-height:60px">Gjenero certifikatën e garancisë<small>Nga ky preventiv, me numër dhe verifikim online</small></button></div>
      <p class="f" style="margin:10px 0 0"><span class="hint">Për PDF-në e pastër fik “Headers and footers” te dritarja e printimit.</span></p></section>
    <section class="card" style="padding:12px"><h2 style="margin-left:4px">Pamja paraprake</h2><div class="paper-wrap" id="pwrap"><div class="scale" id="pscale">${docHtml()}</div></div></section>`;
  }

  /* ---------- dokumenti (pamja paraprake dhe PDF) ---------- */
  function docHtml() {
    const cur = C.cur, f = n => A.fmt(n, C.d);
    const val = v => (has(v) ? esc(String(v).trim()) : '______________________');
    const secs = S.sections.map((sec, si) => {
      const sc = C.secs[si];
      const rows = sec.items.map((it, ii) => {
        const c = sc.items[ii], u = it.unit;
        const wv = (u === 'm2' || u === 'ml') && has(it.w) ? esc(it.w) : '', hv = u === 'm2' && has(it.h) ? esc(it.h) : '';
        const price = has(it.p) && A.isNum(it.p) ? f(A.num(it.p)) : '';
        return `<tr><td>${ii + 1}</td><td class="c">${esc(it.q)}</td><td>${esc(it.desc)}${has(it.note) ? `<div class="note">${esc(it.note.trim())}</div>` : ''}</td><td>${A.UNITS[u].label}</td><td class="r">${wv}</td><td class="r">${hv}</td><td class="r">${c.lbl}</td><td class="r">${price}</td><td class="r">${f(c.val)}</td></tr>`;
      }).join('');
      return `<div class="sec"><div class="sec-h">${esc(sec.title)}</div><table class="items">
        <colgroup><col style="width:6mm"><col style="width:10mm"><col><col style="width:14mm"><col style="width:13mm"><col style="width:13mm"><col style="width:19mm"><col style="width:16mm"><col style="width:21mm"></colgroup>
        <thead><tr><th>#</th><th class="c">Sasi</th><th>Modeli / Përshkrimi</th><th>Njësia</th><th class="r">Gjer. mm</th><th class="r">Lart. mm</th><th class="r">Sip. / Sasia</th><th class="r">Çmimi (${cur})</th><th class="r">Total (${cur})</th></tr></thead>
        <tbody>${rows}<tr class="tt"><td colspan="6">Total ${sec.items.length} zë</td><td class="r nt">${sc.m2 ? sc.m2.toFixed(3) + ' m²' : ''}</td><td></td><td class="r">${f(sc.total)}</td></tr></tbody></table></div>`;
    }).join('');
    const mon = (raw, n) => (A.isNum(raw) ? A.money(n, cur) : (has(raw) ? esc(String(raw).trim()) : A.money(0, cur)));
    const discLbl = S.disc.mode === 'pct' && A.num(S.disc.v) ? 'Zbritje ' + esc(A.num(S.disc.v)) + ' %' : 'Zbritje';
    const pay = S.pay.map((s, i) => { const st = C.stages[i]; return `<div class="tile"><div class="l">${esc(s.label)} · ${st.pct} %</div><div class="when">${esc(s.when)}</div><div class="v">${A.money(st.amt, cur)}</div><div class="w">${st.words}</div></div>`; }).join('');
    const terms = ['Çmimet janë të vlefshme ' + (S.meta.validDays || '30') + ' ditë nga data e lëshimit.', A.paymentSentence(S, C)].concat(lines(S.terms));
    return `<div class="page">
    <div class="hd"><div class="brandbox"><img src="assets/icon.svg" alt=""><div><div class="bn">Apex Frames</div><div class="bs">Dritare &amp; Dyer Premium</div><div class="bc">www.apexframes.co | info@apexframes.co<br>+355 698 881 333</div></div></div>
      <div class="meta"><div class="dt">Preventiv #${esc(S.meta.ref)}</div><div>Data: ${esc(S.meta.date)}</div><div>Vlefshmëria: ${esc(S.meta.validDays || '30')} ditë (deri më ${C.valid})</div><div>Projekt: ${esc(S.meta.project)}</div></div></div>
    <div class="boxes"><div class="box"><div class="lab">Klienti</div><div class="row">Emri / Kompania: ${val(S.client.name)}</div><div class="row">Adresa: ${val(S.client.address)}</div><div class="row">Kontakti: ${val(S.client.contact)}</div></div>
      <div class="box"><div class="lab">Projekti</div><div class="row">Vendndodhja: ${val(S.proj.location)}</div><div class="row">Prodhimi: ${val(S.proj.production)}</div><div class="row">Montimi: ${val(S.proj.install)}</div></div></div>
    ${secs}
    <div class="blk"><div class="h2">Përmbledhja e çmimeve</div><div class="tiles">
      <div class="tile"><div class="l">Nëntotal</div><div class="v">${A.money(C.sub, cur)}</div></div>
      <div class="tile"><div class="l">${discLbl}</div><div class="v">${C.disc ? '− ' + A.money(C.disc, cur) : A.money(0, cur)}</div></div>
      <div class="tile"><div class="l">Transport</div><div class="v">${mon(S.transport, C.tr)}</div></div>
      <div class="tile"><div class="l">Montim</div><div class="v">${mon(S.montim, C.mo)}</div></div>
      <div class="tile"><div class="l">Shërbime të tjera</div><div class="v">${mon(S.other, C.ot)}</div></div></div>
      <div class="totbar"><div class="l">Total përfundimtar</div><div class="v">${A.money(C.total, cur)}</div></div>
      <div class="words">Totali me fjalë: ${C.totalWords}.</div></div>
    <div class="blk"><div class="h2">Kushtet e pagesës</div><div class="tiles pay">${pay}</div></div>
    <div class="cols"><div><div class="lab">Çfarë përfshihet</div>${lines(S.includes).map(l => `<div>${esc(l)}</div>`).join('')}</div><div><div class="lab">Nuk përfshihet</div>${lines(S.excludes).map(l => `<div>${esc(l)}</div>`).join('')}</div></div>
    <div class="warr"><div class="wt">${esc(S.warrantyTitle)}</div>${esc(S.warranty)}</div>
    <div class="h2">Termat dhe kushtet</div><div class="terms">${terms.map((t, i) => `<div><i>${i + 1}.</i>${esc(t)}</div>`).join('')}</div>
    ${has(S.notes) ? `<div class="notes">${esc(S.notes.trim())}</div>` : ''}
    <div class="sig"><div>Për Apex Frames:<div class="sl"></div><div class="sm"><span>Firma / Vula</span><span>Data: ___ / ___ / _______</span></div><div style="font-size:9pt;color:#888;margin-top:1mm">Administrator: Emrulla Manuka</div></div>
      <div>Klienti: ${has(S.signClient) ? esc(S.signClient.trim()) : '______________________'}<div class="sl"></div><div class="sm"><span>Firma</span><span>Data: ___ / ___ / _______</span></div></div></div>
    <div class="ft"><div><span><b>Apex Frames SHPK</b> | NUIS M62116046U | Innovation Hub, Piramida e Tiranës (kati -1), Tiranë</span><span>www.apexframes.co | +355 698 881 333</span></div></div>
    </div>`;
  }

  function fitPreview() {
    const w = $('#pwrap'), s = $('#pscale');
    if (!w || !s) return;
    const z = Math.min(1, (w.clientWidth - 28) / (210 * 96 / 25.4));
    s.style.zoom = z; s.style.width = '210mm';
    s.style.marginLeft = z < 1 ? '0' : 'auto';
  }

  /* ---------- anësorja, shiriti, hapat ---------- */
  function sideHtml() {
    const secRows = S.sections.map((sec, si) => `<div class="r"><span>${esc(sec.title || 'Seksion')} (${sec.items.length})</span><span data-out="s.${si}.tot"></span></div>`).join('');
    return `<div class="sum"><h3>Përmbledhja</h3>${secRows}
      <div class="r" style="border-top:1px solid #444;margin-top:6px;padding-top:10px"><span>Nëntotal</span><span data-out="sub"></span></div>
      <div class="r"><span>Zbritje</span><span data-out="discS"></span></div>
      <div class="r"><span>Transport / montim / të tjera</span><span data-out="extras"></span></div>
      <div class="tot"><small>Total përfundimtar</small><strong data-out="total"></strong><em data-out="totw"></em></div>
      <div class="meta"><div data-out="metaRef"></div><div data-out="metaClient"></div></div></div>`;
  }

  function renderSteps() {
    $('#steps').innerHTML = STEPS.map((s, i) => {
      const done = i < step && stepOk(i);
      return `<button type="button" class="step ${i === step ? 'cur' : ''} ${done ? 'done' : ''}" data-act="goto" data-v="${i}" ${i === step ? 'aria-current="step"' : ''}><span class="n">${done ? '✓' : i + 1}</span><span class="lbl-t">${s.t}</span></button>`;
    }).join('');
    const cur = $('.step.cur', $('#steps'));
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  function renderBar() {
    const last = step === STEPS.length - 1;
    $('#bar').innerHTML = `<div class="bar-in">
      <button type="button" class="secondary" data-act="prev" ${step === 0 ? 'disabled' : ''}>‹ Mbrapa</button>
      <div class="mid"><b data-out="total"></b>Total</div><span class="sp"></span>
      ${last ? '<button type="button" class="primary" data-act="pdf">Shkarko PDF</button>' : `<button type="button" class="primary" data-act="next">Vazhdo: ${STEPS[step + 1].t} ›</button>`}</div>`;
  }

  function render(focus) {
    const s = STEPS[step];
    const views = [viewClient, viewItems, viewPrice, viewTerms, viewReview];
    $('#form').innerHTML = `<div class="view-h"><h1>${s.h}</h1><p>${s.p}</p></div>` + views[step]();
    $('#side').innerHTML = sideHtml();
    renderSteps(); renderBar();
    recalc();
    if (step === 4) fitPreview();
    if (focus) { const e = $(focus); if (e) { e.focus(); if (e.select && e.value) e.select(); } }
  }

  /* ---------- rillogaritja (pa prekur fushat) ---------- */
  function outAll(key, text) { $$(`[data-out="${key}"]`).forEach(e => { e.textContent = text; }); }
  function recalc() {
    C = A.compute(S);
    const f = n => A.fmt(n, C.d), cur = C.cur;
    S.sections.forEach((sec, si) => {
      sec.items.forEach((it, ii) => {
        const c = C.secs[si].items[ii], u = it.unit;
        const price = A.num(it.p);
        let calc;
        if (u === 'm2') calc = `${c.lbl} (${A.num(it.w) || 0} × ${A.num(it.h) || 0} mm × ${A.num(it.q) || 0})`;
        else if (u === 'ml') calc = `${c.lbl} (${A.num(it.w) || 0} mm × ${A.num(it.q) || 0})`;
        else calc = c.lbl;
        calc += ' × ' + f(price) + ' ' + cur;
        outAll(`r.${si}.${ii}.calc`, calc);
        outAll(`r.${si}.${ii}.val`, c.val ? f(c.val) + ' ' + cur : '');
        outAll(`r.${si}.${ii}.val2`, '= ' + f(c.val) + ' ' + cur);
        outAll(`r.${si}.${ii}.tt`, it.desc || 'Zë i ri');
      });
      outAll(`s.${si}.tot`, f(C.secs[si].total) + ' ' + cur);
    });
    outAll('sub', A.money(C.sub, cur));
    outAll('discS', C.disc ? '− ' + A.money(C.disc, cur) : '—');
    outAll('disc', C.disc ? 'Zbritja: − ' + A.money(C.disc, cur) : '');
    const ex = C.tr + C.mo + C.ot;
    outAll('extras', ex ? A.money(ex, cur) : 'E përfshirë');
    outAll('total', A.money(C.total, cur)); outAll('totw', C.totalWords);
    outAll('valid', C.valid);
    outAll('refwarn', ST.refTaken(S.meta.ref, Q && Q.id) ? '⚠ Ky numër ekziston tashmë në arkiv.' : '');
    outAll('metaRef', 'Nr. ' + (S.meta.ref || '—'));
    outAll('metaClient', S.client.name || 'Pa klient');
    S.pay.forEach((s, i) => {
      outAll(`st.${i}.amt`, A.money(C.stages[i].amt, cur)); outAll(`st.${i}.w`, C.stages[i].words);
      $$(`[data-out-val="st.${i}.pct"]`).forEach(e => { e.value = C.stages[i].pct + ' %'; });
    });
    $$('.step').forEach((b, i) => { const d = i < step && stepOk(i); b.classList.toggle('done', d); const n = $('.n', b); if (n) n.textContent = d ? '✓' : String(i + 1); });
  }

  /* ---------- ngjarjet ---------- */
  const form = $('#form');
  form.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.date) { setPath(S, el.dataset.date, fromIso(el.value)); recalc(); persist(); return; }
    if (!el.dataset.k) return;
    setPath(S, el.dataset.k, el.value);
    if (/^sections\.\d+\.title$/.test(el.dataset.k)) { const si = el.dataset.k.split('.')[1]; /* titulli shfaqet vetëm në anësore dhe te butoni */
      $$('.addrow', form)[+si] && ($$('.addrow', form)[+si].textContent = '+ Shto zë në “' + (el.value || 'seksion') + '”');
      $('#side').innerHTML = sideHtml(); }
    recalc(); persist();
  });

  function go(n, focus) {
    step = Math.max(0, Math.min(STEPS.length - 1, n));
    render(focus);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

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
  let toastT = null;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); }

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function exportPdf() {
    C = A.compute(S);
    $('#printroot').innerHTML = docHtml();
    const old = document.title; document.title = fname('pdf').replace(/\.pdf$/, '');
    toast('Në dritaren e printimit zgjidh “Save as PDF”');
    setTimeout(() => { window.print(); setTimeout(() => { document.title = old; }, 500); }, 300);
  }
  async function exportDocx() {
    try {
      toast('Po përgatitet dokumenti Word…');
      const blob = await window.AFDocx.build(S, A.compute(S));
      download(blob, fname('docx'));
      toast('✓ Dokumenti Word u shkarkua');
    } catch (err) { toast('Eksporti në Word dështoi: ' + err.message); console.error(err); }
  }

  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b || !Q || !b.closest('#app')) return;
    const a = b.dataset.act, v = b.dataset.v, si = +b.dataset.si, ii = +b.dataset.ii, i = +b.dataset.i;
    const sec = S.sections[si];
    let focus = null;
    switch (a) {
      case 'goto': return go(+v);
      case 'prev': return go(step - 1);
      case 'next': return go(step + 1);
      case 'pdf': return exportPdf();
      case 'docx': return exportDocx();
      case 'cert': location.hash = '#/c/new?q=' + Q.id; return;
      case 'cur': S.cur = v; break;
      case 'unit': sec.items[ii].unit = v; if (v === 'cope' || v === 'sherbim') { /* dimensionet nuk përdoren */ } break;
      case 'discmode': S.disc.mode = v; break;
      case 'setval': S[b.dataset.k] = v; break;
      case 'preset': S.payPreset = v; if (v !== 'custom') S.pay = clone(A.PAY_PRESETS[v]); break;
      case 'addrow': { const last = sec.items[sec.items.length - 1]; sec.items.push(A.newItem(last ? last.unit : 'm2')); focus = `[data-k="sections.${si}.items.${sec.items.length - 1}.desc"]`; break; }
      case 'dup': sec.items.splice(ii + 1, 0, clone(sec.items[ii])); focus = `[data-k="sections.${si}.items.${ii + 1}.desc"]`; break;
      case 'delrow': if (sec.items.length > 1) sec.items.splice(ii, 1); else sec.items[0] = A.newItem(sec.items[0].unit); break;
      case 'delsec': if (S.sections.length < 2) return; if (!(await confirmDlg('Të fshihet i gjithë seksioni “' + (sec.title || '') + '” me ' + sec.items.length + ' zë?', 'Fshije'))) return; S.sections.splice(si, 1); break;
      case 'secup': if (si > 0) S.sections.splice(si - 1, 0, S.sections.splice(si, 1)[0]); break;
      case 'secdn': if (si < S.sections.length - 1) S.sections.splice(si + 1, 0, S.sections.splice(si, 1)[0]); break;
      case 'addsec': { const p = A.SECTION_PRESETS[v]; S.sections.push({ title: p.title, items: [A.newItem(p.unit)] }); focus = `[data-k="sections.${S.sections.length - 1}.items.0.desc"]`; break; }
      case 'addstage': S.payPreset = 'custom'; S.pay.splice(S.pay.length - 1, 0, { label: 'Pagesa e ndërmjetme', pct: 0, when: '' }); break;
      case 'delstage': if (S.pay.length < 2) return; S.payPreset = 'custom'; S.pay.splice(i, 1); break;
      default: return;
    }
    persist(); render(focus);
  });

  $('#btn-save').addEventListener('click', () => { download(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }), fname('json')); toast('✓ Preventivi u ruajt si skedar'); });
  $('#btn-open').addEventListener('click', () => $('#file').click());
  $('#file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { const q = ST.importState(JSON.parse(r.result), Q && Q.folderId); location.hash = '#/q/' + q.id; }
      catch (err) { toast('Skedari JSON nuk lexohet.'); }
    };
    r.readAsText(f); e.target.value = '';
  });
  form.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.qstatus !== undefined) { ST.setStatus(Q.id, el.value); Q = ST.getQuote(Q.id); syncTop(); toast('Statusi: ' + ST.statusLabel(el.value)); }
    else if (el.dataset.qfolder !== undefined) {
      const f = ST.getFolder(el.value);
      ST.setFolder(Q.id, el.value); Q = ST.getQuote(Q.id);
      if (f) {
        if (!has(S.client.name)) { S.client.name = f.name; S.client.address = S.client.address || f.address || ''; S.client.contact = S.client.contact || f.contact || ''; }
        if (!S.meta.ref || S.meta.ref === Q.autoRef) { Q.autoRef = ST.nextRef(f.code, new Date().getFullYear(), Q.id); S.meta.ref = Q.autoRef; }
      }
      persist(); syncTop(); render();
    }
  });
  $('#btn-back').addEventListener('click', () => { location.hash = Q && Q.folderId ? '#/f/' + Q.folderId : '#/'; });
  function syncTop() {
    const f = Q && ST.getFolder(Q.folderId);
    $('#brand-sub').textContent = f ? f.name : 'Pa folder';
    const sel = $('#q-status');
    if (Q) { sel.innerHTML = ST.STATUSES.map(x => `<option value="${x.k}" ${Q.status === x.k ? 'selected' : ''}>${x.l}</option>`).join(''); sel.className = 'pill st-' + Q.status; }
  }
  $('#q-status').addEventListener('change', e => { ST.setStatus(Q.id, e.target.value); Q = ST.getQuote(Q.id); syncTop(); toast('Statusi: ' + ST.statusLabel(Q.status)); });
  window.addEventListener('resize', fitPreview);

  /* hapet nga routeri (archive.js) */
  window.AFEditor = {
    open: function (id) {
      Q = ST.getQuote(id);
      if (!Q) return false;
      S = Q.state = Object.assign(A.defaultState(), Q.state);
      C = A.compute(S); step = 0;
      $('#saved').textContent = 'Ruhet automatikisht';
      syncTop(); render();
      window.scrollTo({ top: 0, behavior: 'auto' });
      return true;
    },
    close: function () { Q = null; }
  };
  window.__AF_STATE = () => S; // për teste
})();
