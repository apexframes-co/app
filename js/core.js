/* Apex Frames — Gjeneruesi i preventivave: llogaritjet dhe numrat me fjalë (pa varësi nga DOM) */
(function (root) {
  'use strict';

  const rnd = (n, d) => Math.round((n + Number.EPSILON) * Math.pow(10, d)) / Math.pow(10, d);
  const num = v => {
    v = String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.');
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };
  const isNum = v => /^\s*-?\d+([.,]\d+)?\s*$/.test(String(v == null ? '' : v));
  const decOf = cur => (cur === 'EUR' ? 2 : 0);
  const fmt = (n, d) => {
    const parts = rnd(n, d).toFixed(d).split('.');
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (parts[1] ? '.' + parts[1] : '');
  };
  const money = (n, cur) => cur + ' ' + fmt(n, decOf(cur));

  /* ---------- numrat me fjalë (shqip) ---------- */
  const U = ['zero', 'një', 'dy', 'tre', 'katër', 'pesë', 'gjashtë', 'shtatë', 'tetë', 'nëntë'];
  const T = ['dhjetë', 'njëmbëdhjetë', 'dymbëdhjetë', 'trembëdhjetë', 'katërmbëdhjetë', 'pesëmbëdhjetë',
    'gjashtëmbëdhjetë', 'shtatëmbëdhjetë', 'tetëmbëdhjetë', 'nëntëmbëdhjetë'];
  const D = ['', '', 'njëzet', 'tridhjetë', 'dyzet', 'pesëdhjetë', 'gjashtëdhjetë', 'shtatëdhjetë', 'tetëdhjetë', 'nëntëdhjetë'];
  const H = ['', 'njëqind', 'dyqind', 'treqind', 'katërqind', 'pesëqind', 'gjashtëqind', 'shtatëqind', 'tetëqind', 'nëntëqind'];

  function w999(n) {
    const p = [];
    const h = Math.floor(n / 100), r = n % 100;
    if (h) p.push(H[h]);
    if (r >= 10 && r < 20) p.push(T[r - 10]);
    else {
      const d = Math.floor(r / 10), u = r % 10;
      if (d >= 2) p.push(D[d]);
      if (u) p.push(U[u]);
    }
    return p.join(' e ');
  }
  function words(n) {
    n = Math.floor(Math.abs(n));
    if (n === 0) return 'zero';
    const p = [];
    const b = Math.floor(n / 1e9), m = Math.floor((n % 1e9) / 1e6), k = Math.floor((n % 1e6) / 1000), r = n % 1000;
    if (b) p.push(b === 1 ? 'një miliard' : w999(b) + ' miliardë');
    if (m) p.push(m === 1 ? 'një milion' : w999(m) + ' milionë');
    if (k) p.push(k === 1 ? 'një mijë' : w999(k) + ' mijë');
    if (r) p.push(w999(r));
    return p.join(' e ');
  }
  function moneyWords(n, cur) {
    const d = decOf(cur);
    n = rnd(n, d);
    const i = Math.floor(n), c = Math.round((n - i) * 100);
    let s = words(i) + (cur === 'EUR' ? ' euro' : ' lekë');
    if (d === 2 && c) s += ' e ' + words(c) + ' cent';
    return s;
  }

  /* ---------- njësitë e çmimit ---------- */
  const UNITS = {
    m2: { label: 'm²', price: '/m²' },
    ml: { label: 'ml', price: '/ml' },
    cope: { label: 'copë', price: '/copë' },
    sherbim: { label: 'shërbim', price: '/shërb.' }
  };

  function itemCalc(it, d) {
    const q = num(it.q), w = num(it.w), h = num(it.h), p = num(it.p);
    let qty, val, lbl;
    if (it.unit === 'm2') {
      qty = rnd(rnd(w * h / 1e6, 3) * q, 3);
      val = rnd(qty * p, d);
      lbl = qty.toFixed(3) + ' m²';
    } else if (it.unit === 'ml') {
      qty = rnd(rnd(w / 1000, 3) * q, 3);
      val = rnd(qty * p, d);
      lbl = qty.toFixed(3) + ' ml';
    } else {
      qty = q;
      val = rnd(q * p, d);
      lbl = (Math.round(q * 100) / 100) + (it.unit === 'cope' ? ' copë' : ' shërb.');
    }
    return { qty: qty, val: val, lbl: lbl };
  }

  /* ---------- preset-et ---------- */
  const PAY_PRESETS = {
    '50-50': [
      { label: 'Parapagimi', pct: 50, when: 'në nënshkrimin e kontratës' },
      { label: 'Pagesa finale', pct: 50, when: 'pas procesverbalit të dorëzimit' }
    ],
    '50-30-20': [
      { label: 'Parapagimi', pct: 50, when: 'në nënshkrimin e kontratës' },
      { label: 'Pagesa e dytë', pct: 30, when: 'në njoftimin e gatishmërisë' },
      { label: 'Pagesa finale', pct: 20, when: 'pas procesverbalit të dorëzimit' }
    ],
    '20-80': [
      { label: 'Parapagimi', pct: 20, when: 'para fillimit të punimeve' },
      { label: 'Pagesa finale', pct: 80, when: 'pas procesverbalit të dorëzimit' }
    ],
    '100': [
      { label: 'Pagesa', pct: 100, when: 'në nënshkrimin e kontratës' }
    ]
  };

  const SECTION_PRESETS = {
    dritare: { title: 'Dritare', unit: 'm2' },
    dyer: { title: 'Dyer', unit: 'm2' },
    grila: { title: 'Grila', unit: 'm2' },
    tenda: { title: 'Tenda', unit: 'm2' },
    aksesore: { title: 'Aksesorë', unit: 'cope' },
    sherbime: { title: 'Shërbime', unit: 'sherbim' },
    tjeter: { title: 'Zëra të tjerë', unit: 'cope' }
  };

  const DEFAULT_TERMS = [
    'Pagesat bëhen me transfertë bankare te Apex Frames SHPK; të dhënat bankare dërgohen me kontratën.',
    'Sistemi i profilit, ngjyra, xhami, hapja dhe aksesorët konfirmohen me klientin para kontratës. Ndryshimet bëhen vetëm me aneks të shkruar.',
    'Çmimet janë përfundimtare. Apex Frames nuk është subjekt TVSH.'
  ];

  function newItem(unit) {
    return { q: '1', desc: '', note: '', unit: unit || 'm2', w: '', h: '', p: '' };
  }

  function defaultState() {
    const t = new Date();
    const pad = n => String(n).padStart(2, '0');
    return {
      v: 1,
      meta: { ref: 'AF-' + t.getFullYear() + '-', date: pad(t.getDate()) + '/' + pad(t.getMonth() + 1) + '/' + t.getFullYear(), validDays: '30', project: '' },
      client: { name: '', address: '', contact: '' },
      proj: { location: '', production: '6–8 javë nga konfirmimi', install: '24–48 orë pas dorëzimit' },
      cur: 'EUR',
      sections: [{ title: 'Dritare', items: [newItem('m2')] }],
      disc: { mode: 'pct', v: '0' },
      transport: 'E përfshirë',
      montim: 'E përfshirë',
      other: '0',
      payPreset: '50-50',
      pay: JSON.parse(JSON.stringify(PAY_PRESETS['50-50'])),
      includes: 'Furnizimi dhe transporti\nMontimi profesional me izolim perimetral PU dhe silikon\nRregullimi mekanik dhe pastrimi i kantierit',
      excludes: 'Punime civile dhe prishje strukturore\nSuvatim / lyerje\nSkelë ose platformë e posaçme\nMateriale të furnizuara nga klienti',
      warrantyTitle: 'Apex Frames – Garanci 5-vjeçare e produktit dhe mbështetja',
      warranty: 'Të gjitha produktet e furnizuara nga Apex Frames mbulohen nga një garanci 5-vjeçare ndaj defekteve të prodhimit në profile, hardware dhe mekanizma, sipas certifikimit të prodhuesit. Apex Frames angazhohet të ofrojë mbështetje teknike, pjesë këmbimi dhe ndërhyrje brenda periudhës së garancisë. Cilësia e montimit mbulohet veçmas për 24 muaj nga procesverbali i dorëzimit.',
      terms: DEFAULT_TERMS.join('\n'),
      notes: '',
      signClient: ''
    };
  }

  /* ---------- llogaritja e plotë ---------- */
  function validUntil(dateStr, days) {
    const m = String(dateStr || '').match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/);
    if (!m) return '…';
    const dt = new Date(+m[3], +m[2] - 1, +m[1] + (parseInt(days, 10) || 30));
    const pad = n => String(n).padStart(2, '0');
    return pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1) + '/' + dt.getFullYear();
  }

  function compute(S) {
    const cur = S.cur, d = decOf(cur);
    let sub = 0, nItems = 0;
    const secs = S.sections.map(sec => {
      let st = 0, m2 = 0;
      const items = sec.items.map(it => {
        const c = itemCalc(it, d);
        st += c.val;
        if (it.unit === 'm2') m2 += c.qty;
        nItems++;
        return c;
      });
      sub += st;
      return { items: items, total: rnd(st, d), m2: rnd(m2, 3) };
    });
    sub = rnd(sub, d);
    const disc = S.disc.mode === 'pct' ? rnd(sub * num(S.disc.v) / 100, d) : rnd(num(S.disc.v), d);
    const tr = num(S.transport), mo = num(S.montim), ot = num(S.other);
    const total = rnd(sub - disc + tr + mo + ot, d);

    const n = S.pay.length;
    let paidPct = 0, paidAmt = 0;
    const stages = S.pay.map((s, i) => {
      let pct, amt;
      if (i < n - 1) {
        pct = Math.max(0, Math.min(100 - paidPct, num(s.pct)));
        amt = rnd(total * pct / 100, d);
      } else {
        pct = rnd(Math.max(0, 100 - paidPct), 2);
        amt = rnd(total - paidAmt, d);
      }
      paidPct += pct; paidAmt += amt;
      return { pct: pct, amt: amt, words: moneyWords(amt, cur) };
    });

    return {
      cur: cur, d: d, secs: secs, sub: sub, disc: disc, tr: tr, mo: mo, ot: ot,
      total: total, totalWords: moneyWords(total, cur), stages: stages, nItems: nItems,
      valid: validUntil(S.meta.date, S.meta.validDays)
    };
  }

  function paymentSentence(S, C) {
    const parts = S.pay.map((s, i) => C.stages[i].pct + '% (' + fmt(C.stages[i].amt, C.d) + ' ' + C.cur + ') ' + (s.when || '').trim());
    return 'Pagesa kryhet: ' + parts.join('; ') + '.';
  }

  const api = {
    rnd: rnd, num: num, isNum: isNum, fmt: fmt, money: money, decOf: decOf, words: words, moneyWords: moneyWords,
    UNITS: UNITS, PAY_PRESETS: PAY_PRESETS, SECTION_PRESETS: SECTION_PRESETS, newItem: newItem,
    defaultState: defaultState, compute: compute, itemCalc: itemCalc, paymentSentence: paymentSentence, validUntil: validUntil
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AF = api;
})(typeof window !== 'undefined' ? window : globalThis);
