/* ─────────────────────────────────────────────────────────────────
   variable-discount-rateapis.js
   All HTTP calls to json-server.
   Base URL is read from the env var; falls back to localhost:3001.
   ───────────────────────────────────────────────────────────────── */

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

/* ── helpers ── */
const get  = (path) => fetch(`${BASE_URL}${path}`).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });
const post = (path, body) => fetch(`${BASE_URL}${path}`, { method: 'POST',   headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });
const put  = (path, body) => fetch(`${BASE_URL}${path}`, { method: 'PUT',    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });
const del  = (path)       => fetch(`${BASE_URL}${path}`, { method: 'DELETE' }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });

/* ────────────────────────────────────────────
   Companies
──────────────────────────────────────────── */

/** Returns [{id, name}, …] */
export const fetchCompanies = () => get('/companies');

/* ────────────────────────────────────────────
   Projects
──────────────────────────────────────────── */

/** Returns [{id, companyId, name}, …] for one company */
export const fetchProjectsByCompany = (companyId) =>
  get(`/projects?companyId=${companyId}`);

/* ────────────────────────────────────────────
   Rates
──────────────────────────────────────────── */

/** Returns [{id, projectId, year, rate}, …] sorted by year ascending */
export const fetchRatesByProject = async (projectId) => {
  const rows = await get(`/rates?projectId=${projectId}`);
  return rows.slice().sort((a, b) => a.year - b.year);
};

/** Creates a new rate row. Returns the created object (with id). */
export const createRate = (projectId, year, rate) =>
  post('/rates', { projectId, year, rate });

/** Replaces an existing rate row (full PUT). Returns the updated object. */
export const updateRate = (id, projectId, year, rate) =>
  put(`/rates/${id}`, { id, projectId, year, rate });

/** Deletes a rate row. Returns the deleted object (json-server echoes it). */
export const deleteRate = (id) => del(`/rates/${id}`);