import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3001' });

// ── 1. Fetch all companies ─────────────────────────────────────────────────────
export async function getCompanies() {
  const res = await API.get('/companies');
  return res.data;
}

// ── 2. Fetch all units for a given company_id ──────────────────────────────────
export async function getUnitsByCompany(companyId) {
  const res = await API.get('/units', { params: { company_id: companyId } });
  return res.data;
}

// ── 3. Patch a single unit field ───────────────────────────────────────────────
export async function patchUnit(unitId, field, value) {
  await API.patch(`/units/${unitId}`, { [field]: value });
}

// ── 4. Patch multiple fields at once (bulk drag-fill / multi-select clear) ─────
export async function patchUnitFields(unitId, fields) {
  await API.patch(`/units/${unitId}`, fields);
}