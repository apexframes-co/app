/* Apex Frames — certifikatat e garancisë: logjika e serverit (pa varësi nga Netlify, e testueshme).
   store: { get(key), set(key, obj, {onlyIfNew}) -> bool, list(prefix) -> [keys] } */

export const START_NO = 875;           // numri i parë: AF-2026-875
export const NR_RE = /^AF-\d{4}-\d{1,7}$/;

const json = (status, body) => ({ status, body });
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

export const normNr = s => str(s, 24).toUpperCase().replace(/\s+/g, '');
const numPart = nr => parseInt(nr.split('-')[2], 10) || 0;

/* "Test Klient SHPK" -> "Te** Kl**** SH**" (faqja publike nuk tregon emrin e plotë) */
export function maskName(n) {
  return String(n || '').trim().split(/\s+/).filter(Boolean)
    .map(w => (w.length <= 2 ? w[0] + '*' : w.slice(0, 2) + '*'.repeat(Math.min(w.length - 2, 5)))).join(' ');
}

function dmyToDate(s) {
  const m = String(s || '').match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  return m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : null;
}
const pad = n => String(n).padStart(2, '0');
export function validUntil(purchase, years) {
  const d = dmyToDate(purchase);
  if (!d) return '';
  d.setUTCFullYear(d.getUTCFullYear() + (parseInt(years, 10) || 5));
  return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
}

const publicView = c => ({
  found: true, nr: c.nr, name: maskName(c.name), product: c.product, purchaseDate: c.purchaseDate,
  years: c.years, validUntil: c.validUntil, status: c.revoked ? 'revoked' : 'active', issuedAt: c.issuedAt
});

export async function handle(req, store, env) {
  const url = new URL(req.url, 'http://x');
  const token = String(env.CERT_ADMIN_TOKEN || '');
  const auth = String((req.headers && (req.headers.get ? req.headers.get('authorization') : req.headers.authorization)) || '');
  const isAdmin = !!token && auth === 'Bearer ' + token;

  if (req.method === 'GET') {
    if (url.searchParams.get('list') === '1') {
      if (!isAdmin) return json(401, { error: 'Nuk je i autorizuar.' });
      const keys = await store.list('AF-');
      const all = (await Promise.all(keys.map(k => store.get(k)))).filter(Boolean);
      all.sort((a, b) => numPart(b.nr) - numPart(a.nr));
      return json(200, { certs: all });
    }
    const nr = normNr(url.searchParams.get('nr'));
    if (!NR_RE.test(nr)) return json(400, { found: false, error: 'Numër i pavlefshëm. Formati: AF-2026-875.' });
    const c = await store.get(nr);
    if (!c) return json(404, { found: false });
    return json(200, isAdmin && url.searchParams.get('full') === '1' ? Object.assign({ found: true }, c) : publicView(c));
  }

  if (req.method === 'POST') {
    if (!isAdmin) return json(401, { error: token ? 'Çelësi i administratorit është i gabuar.' : 'CERT_ADMIN_TOKEN nuk është vendosur në server.' });
    let b; try { b = await req.json(); } catch (e) { return json(400, { error: 'Kërkesë e pavlefshme.' }); }

    if (b.action === 'issue') {
      const name = str(b.name, 120), product = str(b.product, 600), purchaseDate = str(b.purchaseDate, 10);
      const years = Math.min(30, Math.max(1, parseInt(b.years, 10) || 5));
      if (!name) return json(400, { error: 'Shkruaj emrin e klientit.' });
      if (!product) return json(400, { error: 'Shkruaj produktin.' });
      if (!dmyToDate(purchaseDate)) return json(400, { error: 'Data e blerjes duhet të jetë dd/mm/vvvv.' });
      const year = new Date().getUTCFullYear();
      for (let attempt = 0; attempt < 8; attempt++) {
        const keys = await store.list('AF-');
        const next = Math.max(START_NO - 1, ...keys.map(k => numPart(k))) + 1 + attempt;
        const nr = 'AF-' + year + '-' + next;
        const rec = { nr, name, product, purchaseDate, years, validUntil: validUntil(purchaseDate, years), quoteRef: str(b.quoteRef, 40),
          issuedAt: new Date().toISOString(), revoked: false };
        if (await store.set(nr, rec, { onlyIfNew: true })) return json(201, Object.assign({ found: true }, rec));
      }
      return json(409, { error: 'Nuk u gjet numër i lirë. Provo përsëri.' });
    }

    if (b.action === 'revoke') {
      const nr = normNr(b.nr), c = NR_RE.test(nr) ? await store.get(nr) : null;
      if (!c) return json(404, { error: 'Certifikata nuk u gjet.' });
      c.revoked = b.revoked !== false; c.revokedAt = c.revoked ? new Date().toISOString() : '';
      await store.set(nr, c, {});
      return json(200, Object.assign({ found: true }, c));
    }
    return json(400, { error: 'Veprim i panjohur.' });
  }
  return json(405, { error: 'Metodë e palejuar.' });
}
