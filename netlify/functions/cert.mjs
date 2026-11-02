/* Netlify Function: /api/cert — ruan certifikatat në Netlify Blobs. Vendos CERT_ADMIN_TOKEN te Environment variables. */
import { getStore } from '@netlify/blobs';
import { handle } from './cert-core.mjs';

const blobs = () => getStore({ name: 'certificates', consistency: 'strong' });
const store = {
  get: key => blobs().get(key, { type: 'json' }),
  async set(key, obj, opt) {
    const r = await blobs().setJSON(key, obj, opt && opt.onlyIfNew ? { onlyIfNew: true } : undefined);
    return opt && opt.onlyIfNew ? !!(r && r.modified) : true;
  },
  async list(prefix) { const r = await blobs().list({ prefix }); return r.blobs.map(b => b.key); }
};

export default async (req) => {
  const out = await handle(req, store, { CERT_ADMIN_TOKEN: process.env.CERT_ADMIN_TOKEN });
  return new Response(JSON.stringify(out.body), { status: out.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
};
export const config = { path: '/api/cert' };
