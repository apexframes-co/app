/* Apex Frames — eksporti i preventivit në Word (.docx), me bibliotekën docx (vendor/docx.iife.js) */
(function () {
  'use strict';
  const A = window.AF;

  async function build(S, C) {
    const D = window.docx;
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
      AlignmentType, ImageRun, Footer, PageNumber, VerticalAlign, TableLayoutType } = D;

    const FONT = 'Times New Roman', INK = '262626', TXT = '555555', GRAY = '888888', TILE = 'F4F3F0', LINE = 'CCCCCC';
    const W = 10092; // gjerësia e përmbajtjes, twips (A4, 16 mm margjina)
    const d = C.d, cur = C.cur;
    const f = n => A.fmt(n, d);

    /* ---- ndihmëse ---- */
    const NB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const noB = { top: NB, bottom: NB, left: NB, right: NB };
    const ln = (color, size) => ({ style: BorderStyle.SINGLE, size: size, color: color });
    const R = (t, o) => { o = o || {}; return new TextRun({ text: String(t == null ? '' : t), font: FONT, size: o.size || 21, color: o.color || TXT, bold: o.bold, italics: o.italics, characterSpacing: o.cs, allCaps: o.caps }); };
    const P = (runs, o) => {
      o = o || {};
      return new Paragraph({ children: Array.isArray(runs) ? runs : [runs], alignment: o.align, spacing: o.noline ? { before: 0, after: 0 } : { before: o.before || 0, after: o.after || 0, line: o.line || 252 }, indent: o.indent, border: o.border, keepNext: o.keepNext, keepLines: true });
    };
    const gap = tw => new Paragraph({ children: [], spacing: { before: 0, after: tw || 100, line: 20 } });
    const cell = (children, o) => {
      o = o || {};
      return new TableCell({
        children: children, width: { size: o.w, type: WidthType.DXA }, columnSpan: o.span,
        shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
        borders: o.borders || noB, verticalAlign: o.valign || VerticalAlign.TOP,
        margins: o.m || { top: 50, bottom: 50, left: 80, right: 80 }
      });
    };
    const table = (cols, rows) => new Table({ width: { size: cols.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: cols, layout: TableLayoutType.FIXED, rows: rows });
    const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
    const val = v => (v && String(v).trim() ? String(v).trim() : '______________________');
    const b64 = data => { const bin = atob(data.split(',')[1]); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
    const label = t => P(R(t, { size: 17, color: GRAY, caps: true, cs: 20 }), { after: 60, keepNext: true });
    const h2 = t => P(R(t, { size: 17, color: GRAY, caps: true, cs: 20 }), { before: 200, after: 80, keepNext: true });

    const children = [];

    /* ---- koka ---- */
    const hb = { top: NB, left: NB, right: NB, bottom: ln('1F1F1F', 18) };
    const hm = { top: 0, bottom: 120, left: 0, right: 0 };
    children.push(table([1150, 4950, 3992], [new TableRow({ children: [
      cell([P(new ImageRun({ type: 'png', data: b64(window.AF_ICON_PNG), transformation: { width: 52, height: 51 } }), { noline: true })], { w: 1150, borders: hb, m: hm }),
      cell([
        P(R('Apex Frames', { size: 48, color: '2B2B2B' }), { line: 240 }),
        P(R('Dritare & Dyer Premium', { size: 19, color: '777777' }), { before: 60 }),
        P(R('www.apexframes.co | info@apexframes.co | +355 698 881 333', { size: 17, color: '777777' }), { before: 60 })
      ], { w: 4950, borders: hb, m: hm }),
      cell([
        P(R('PREVENTIV #' + (S.meta.ref || ''), { size: 26, color: INK, caps: true }), { align: AlignmentType.RIGHT }),
        P(R('Data: ' + (S.meta.date || ''), { size: 19, color: '777777' }), { align: AlignmentType.RIGHT, before: 60 }),
        P(R('Vlefshmëria: ' + (S.meta.validDays || '30') + ' ditë (deri më ' + C.valid + ')', { size: 19, color: '777777' }), { align: AlignmentType.RIGHT }),
        P(R('Projekt: ' + (S.meta.project || ''), { size: 19, color: '777777' }), { align: AlignmentType.RIGHT })
      ], { w: 3992, borders: hb, m: hm })
    ] })]));
    children.push(gap(140));

    /* ---- klienti / projekti ---- */
    const box = (title, rows) => cell([label(title)].concat(rows.map(r => P([R(r[0] + ' ', { color: '2B2B2B' }), R(val(r[1]), { color: '2B2B2B' })], { after: 60 }))),
      { w: 4950, fill: TILE, m: { top: 100, bottom: 80, left: 160, right: 160 } });
    children.push(table([4950, 192, 4950], [new TableRow({ cantSplit: true, children: [
      box('Klienti', [['Emri / Kompania:', S.client.name], ['Adresa:', S.client.address], ['Kontakti:', S.client.contact]]),
      cell([P([])], { w: 192 }),
      box('Projekti', [['Vendndodhja:', S.proj.location], ['Prodhimi:', S.proj.production], ['Montimi:', S.proj.install]])
    ] })]));

    /* ---- seksionet ---- */
    const cw = [380, 560, 3472, 780, 830, 830, 1100, 1000, 1140];
    const rb = { top: NB, left: NB, right: NB, bottom: ln('E4E4E1', 4) };
    const hdrCell = (t, i, al) => cell([P(R(t, { size: 17, color: 'E8E8E8' }), { align: al })], { w: cw[i], fill: INK, m: { top: 70, bottom: 70, left: 60, right: 60 } });
    S.sections.forEach((sec, si) => {
      const sc = C.secs[si];
      children.push(P(R(sec.title || '', { size: 17, color: GRAY, caps: true, cs: 20 }), { before: 200, after: 80, keepNext: true }));
      const rows = [new TableRow({
        tableHeader: true, cantSplit: true, children: [
          hdrCell('#', 0), hdrCell('Sasi', 1, AlignmentType.CENTER), hdrCell('Modeli / Përshkrimi', 2), hdrCell('Njësia', 3),
          hdrCell('Gjer. mm', 4, AlignmentType.RIGHT), hdrCell('Lart. mm', 5, AlignmentType.RIGHT), hdrCell('Sip. / Sasia', 6, AlignmentType.RIGHT),
          hdrCell('Çmimi (' + cur + ')', 7, AlignmentType.RIGHT), hdrCell('Total (' + cur + ')', 8, AlignmentType.RIGHT)]
      })];
      sec.items.forEach((it, ii) => {
        const c = sc.items[ii], u = it.unit;
        const wv = (u === 'm2' || u === 'ml') && String(it.w).trim() ? it.w : '', hv = u === 'm2' && String(it.h).trim() ? it.h : '';
        const price = A.isNum(it.p) && String(it.p).trim() ? f(A.num(it.p)) : '';
        const desc = [P(R(it.desc || '', { color: '2B2B2B', size: 19 }))];
        if (String(it.note || '').trim()) desc.push(P(R(it.note.trim(), { size: 17, color: '777777', italics: true }), { before: 20 }));
        const tc = (t, i, al) => cell([P(R(t, { color: '2B2B2B', size: 19 }), { align: al })], { w: cw[i], borders: rb, m: { top: 60, bottom: 60, left: 60, right: 60 } });
        rows.push(new TableRow({ cantSplit: true, children: [
          tc(String(ii + 1), 0), tc(String(it.q || ''), 1, AlignmentType.CENTER),
          cell(desc, { w: cw[2], borders: rb, m: { top: 60, bottom: 60, left: 60, right: 60 } }),
          tc(A.UNITS[u].label, 3), tc(wv, 4, AlignmentType.RIGHT), tc(hv, 5, AlignmentType.RIGHT),
          tc(c.lbl, 6, AlignmentType.RIGHT), tc(price, 7, AlignmentType.RIGHT), tc(f(c.val), 8, AlignmentType.RIGHT)
        ] }));
      });
      const tb = { top: ln(LINE, 4), left: NB, right: NB, bottom: ln('DDDDDD', 4) };
      const tt = (t, i, al, span) => cell([P(R(t, { size: 17, color: '999999', caps: i < 6 }), { align: al })], { w: span ? cw.slice(0, 6).reduce((a, b) => a + b, 0) : cw[i], span: span, borders: tb, m: { top: 70, bottom: 70, left: 60, right: 60 } });
      rows.push(new TableRow({ cantSplit: true, children: [
        tt('Total ' + sec.items.length + ' zë', 0, undefined, 6), tt(sc.m2 ? sc.m2.toFixed(3) + ' m²' : '', 6, AlignmentType.RIGHT),
        tt('', 7), tt(f(sc.total), 8, AlignmentType.RIGHT)
      ] }));
      children.push(table(cw, rows));
    });

    /* ---- përmbledhja ---- */
    children.push(h2('Përmbledhja e çmimeve'));
    const tileB = { top: ln('FFFFFF', 24), bottom: ln('FFFFFF', 24), left: ln('FFFFFF', 24), right: ln('FFFFFF', 24) };
    const money = (raw, n) => (A.isNum(raw) ? A.money(n, cur) : (String(raw || '').trim() || A.money(0, cur)));
    const tile = (l, v, w) => cell([P(R(l, { size: 16, color: GRAY }), { after: 20 }), P(R(v, { size: 22, color: '2B2B2B' }))], { w: w, fill: TILE, borders: tileB, m: { top: 90, bottom: 90, left: 110, right: 90 } });
    const discLabel = S.disc.mode === 'pct' && A.num(S.disc.v) ? 'Zbritje (' + A.num(S.disc.v) + '%)' : 'Zbritje';
    children.push(table([2018, 2018, 2018, 2018, 2020], [new TableRow({ cantSplit: true, children: [
      tile('Nëntotal', A.money(C.sub, cur), 2018), tile(discLabel, C.disc ? '− ' + A.money(C.disc, cur) : A.money(0, cur), 2018),
      tile('Transport', money(S.transport, C.tr), 2018), tile('Montim', money(S.montim, C.mo), 2018),
      tile('Shërbime të tjera', money(S.other, C.ot), 2020)
    ] })]));
    children.push(gap(60));
    children.push(table([5600, 4492], [new TableRow({ cantSplit: true, children: [
      cell([P(R('Total përfundimtar', { size: 18, color: 'CCCCCC', caps: true, cs: 15 }))], { w: 5600, fill: INK, valign: VerticalAlign.CENTER, m: { top: 140, bottom: 140, left: 160, right: 80 } }),
      cell([P(R(A.money(C.total, cur), { size: 32, color: 'FFFFFF' }), { align: AlignmentType.RIGHT })], { w: 4492, fill: INK, valign: VerticalAlign.CENTER, m: { top: 100, bottom: 100, left: 80, right: 160 } })
    ] })]));
    children.push(P(R('Totali me fjalë: ' + C.totalWords + '.', { size: 18, color: GRAY }), { before: 60, after: 60 }));

    /* ---- pagesa ---- */
    children.push(h2('Kushtet e pagesës'));
    const n = S.pay.length, GAPW = 120, pw = Math.floor((W - GAPW * (n - 1)) / n);
    const pws = S.pay.map((_, i) => (i === n - 1 ? W - GAPW * (n - 1) - pw * (n - 1) : pw));
    const pb = { top: NB, bottom: NB, right: NB, left: ln(INK, 18) };
    const payCells = [], payCols = [];
    S.pay.forEach((s, i) => {
      const st = C.stages[i];
      if (i) { payCells.push(cell([P([])], { w: GAPW })); payCols.push(GAPW); }
      payCols.push(pws[i]);
      payCells.push(cell([
        P(R((s.label || '') + ' · ' + st.pct + '%', { size: 17, color: '666666' }), { after: 20 }),
        P(R(s.when || '', { size: 17, color: '777777' }), { after: 40 }),
        P(R(A.money(st.amt, cur), { size: 26, color: '2B2B2B', bold: true })),
        P(R(st.words, { size: 16, color: GRAY }), { before: 20 })
      ], { w: pws[i], fill: TILE, borders: pb, m: { top: 100, bottom: 100, left: 150, right: 100 } }));
    });
    children.push(table(payCols, [new TableRow({ cantSplit: true, children: payCells })]));
    children.push(gap(100));

    /* ---- përfshirja ---- */
    const listCell = (title, text) => cell([label(title)].concat(lines(text).map(l => P(R('•  ' + l, { size: 19, color: '2B2B2B' }), { after: 20, indent: { left: 240, hanging: 240 } }))),
      { w: 4950, fill: TILE, m: { top: 100, bottom: 80, left: 160, right: 160 } });
    children.push(table([4950, 192, 4950], [new TableRow({ cantSplit: true, children: [
      listCell('Çfarë përfshihet', S.includes), cell([P([])], { w: 192 }), listCell('Nuk përfshihet', S.excludes)
    ] })]));
    children.push(gap(100));

    /* ---- garancia ---- */
    children.push(table([W], [new TableRow({ cantSplit: true, children: [cell([
      P(R(S.warrantyTitle || '', { size: 22, color: INK }), { after: 40 }),
      P(R(S.warranty || '', { size: 18, color: '333333' }), { line: 250 })
    ], { w: W, fill: TILE, borders: { top: NB, bottom: NB, right: NB, left: ln(INK, 18) }, m: { top: 100, bottom: 100, left: 180, right: 160 } })] })]));

    /* ---- termat ---- */
    children.push(h2('Termat dhe kushtet'));
    const terms = ['Çmimet janë të vlefshme ' + (S.meta.validDays || '30') + ' ditë nga data e lëshimit.', A.paymentSentence(S, C)].concat(lines(S.terms));
    terms.forEach((t, i) => children.push(P(R((i + 1) + '.  ' + t, { size: 18 }), { after: 40, indent: { left: 300, hanging: 300 }, line: 250 })));
    if (String(S.notes || '').trim()) children.push(P(R(S.notes.trim(), { size: 18 }), { before: 80 }));

    /* ---- nënshkrimet ---- */
    children.push(gap(120));
    const sigLine = { top: NB, left: NB, right: NB, bottom: ln('AAAAAA', 4) };
    children.push(table([4800, 492, 4800], [
      new TableRow({ cantSplit: true, children: [
        cell([P(R('Për Apex Frames:'))], { w: 4800 }), cell([P([])], { w: 492 }),
        cell([P(R('Klienti: ' + (String(S.signClient || '').trim() || '______________________')))], { w: 4800 })] }),
      new TableRow({ cantSplit: true, height: { value: 760, rule: 'atLeast' }, children: [
        cell([P([])], { w: 4800, borders: sigLine }), cell([P([])], { w: 492 }), cell([P([])], { w: 4800, borders: sigLine })] }),
      new TableRow({ cantSplit: true, children: [
        cell([P(R('Firma / Vula        Data: ___ / ___ / _______', { size: 18, color: GRAY })), P(R('Administrator: Emrulla Manuka', { size: 18, color: GRAY }), { before: 20 })], { w: 4800 }),
        cell([P([])], { w: 492 }),
        cell([P(R('Firma        Data: ___ / ___ / _______', { size: 18, color: GRAY }))], { w: 4800 })] })
    ]));

    /* ---- fundi i faqes ---- */
    const footer = new Footer({ children: [
      P(R('Apex Frames SHPK | NUIS M62116046U | Innovation Hub, Piramida e Tiranës (kati -1), Tiranë | www.apexframes.co | +355 698 881 333', { size: 15, color: GRAY }),
        { align: AlignmentType.CENTER, border: { top: ln(LINE, 4) } }),
      P([R('Faqe ', { size: 15, color: GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 15, color: GRAY }), R(' / ', { size: 15, color: GRAY }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 15, color: GRAY })], { align: AlignmentType.RIGHT })
    ] });

    const doc = new Document({
      creator: 'Apex Frames SHPK', title: 'Preventiv ' + (S.meta.ref || ''),
      styles: { default: { document: { run: { font: FONT, size: 21, color: TXT } } } },
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 680, right: 907, bottom: 1000, left: 907, footer: 380 } } },
        footers: { default: footer }, children: children
      }]
    });
    return Packer.toBlob(doc);
  }

  window.AFDocx = { build: build };
})();
