// ─── dual-paymentsapi.js ───────────────────────────────────────────────────────
// All HTTP calls to json-server (default: http://localhost:3001)
// Mirrors the old mockFetch / mockSave / mockDelete surface so the
// component only has to await instead of calling the sync helpers.
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ─── Key builder (same logic as getMockKey) ───────────────────────────────────
export function getPlanId(projectId, year, scheme, planCode) {
  return `${projectId}|${year}|${scheme}|${planCode}`;
}

// ─── applyIdx helper (used by apiFetchPlan to reconstruct row patches) ────────
export function applyIdx(rec, idx, val, dr) {
  if (idx === 0) {
    rec.dp1 = val;
    rec.dp1_discount_rate = dr;
  } else if (idx === 1) {
    rec.dp2 = val;
    rec.dp2_discount_rate = dr;
  } else {
    const n = idx - 2;
    rec[`installment_${n}`] = val;
    rec[`installment_${n}_discount_rate`] = dr;
  }
}

// ─── Fetch companies ──────────────────────────────────────────────────────────
export async function apiFetchCompanies() {
  try {
    const res = await fetch(`${BASE_URL}/companies`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error('[apiFetchCompanies]', err);
    return { success: false, data: [], error: err.message };
  }
}

// ─── Fetch projects (optionally filtered by company) ─────────────────────────
export async function apiFetchProjects(companyId) {
  try {
    const qs  = companyId ? `?company_id=${encodeURIComponent(companyId)}` : '';
    const res = await fetch(`${BASE_URL}/projects${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error('[apiFetchProjects]', err);
    return { success: false, data: [], error: err.message };
  }
}

// ─── Fetch a single payment plan ─────────────────────────────────────────────
// Returns { success, data } — data is the raw DB record (or {}) when not found.
export async function apiFetchPlan(projectId, year, scheme, planCode = '') {
  try {
    const id  = getPlanId(projectId, year, scheme, planCode);
    const res = await fetch(`${BASE_URL}/payment_plans/${encodeURIComponent(id)}`);

    if (res.status === 404) {
      // Plan doesn't exist yet — return empty so component renders blank rows
      return { success: true, data: {} };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error('[apiFetchPlan]', err);
    return { success: false, data: {}, error: err.message };
  }
}

// ─── Save / upsert a payment plan ────────────────────────────────────────────
// Accepts the same payload shape the component already builds:
//   { project_id, year, scheme, payment_plan_code,
//     disable_additional_discount?, interest_rate?,
//     index?, value?, discount_rate?, npv?,   ← single-row update
//     bulk_updates?: [{ index, value, discount_rate, npv }] }
//
// Handles GET-then-PUT (upsert) so we never lose fields not in the payload.
export async function apiSavePlan(payload) {
  try {
    const { project_id, year, scheme, payment_plan_code = '' } = payload;
    const id  = getPlanId(project_id, year, scheme, payment_plan_code);
    const url = `${BASE_URL}/payment_plans/${encodeURIComponent(id)}`;

    // 1. Try to load existing record
    const existing = await fetch(url);
    let record = {};
    if (existing.ok) {
      record = await existing.json();
    } else {
      // Brand-new plan — seed with identity fields
      record = {
        id,
        project_id,
        year,
        scheme,
        payment_plan_code,
      };
    }

    // 2. Merge scalar fields
    if (payload.disable_additional_discount !== undefined)
      record.disable_additional_discount = payload.disable_additional_discount;
    if (payload.interest_rate !== undefined)
      record.interest_rate = payload.interest_rate;

    // 3. Merge row data
    if (payload.bulk_updates && payload.bulk_updates.length > 0) {
      payload.bulk_updates.forEach(it =>
        applyIdx(record, it.index, it.value, it.discount_rate)
      );
    } else if (payload.index !== undefined) {
      applyIdx(record, payload.index, payload.value, payload.discount_rate);
    }

    // 4. PUT (json-server will create if not found when using PUT with an id)
    const saveRes = await fetch(url, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(record),
    });

    if (!saveRes.ok) throw new Error(`HTTP ${saveRes.status}`);
    return { success: true };
  } catch (err) {
    console.error('[apiSavePlan]', err);
    return { success: false, error: err.message };
  }
}

// ─── Delete a payment plan ────────────────────────────────────────────────────
export async function apiDeletePlan(projectId, year, scheme, planCode = '') {
  try {
    const id  = getPlanId(projectId, year, scheme, planCode);
    const url = `${BASE_URL}/payment_plans/${encodeURIComponent(id)}`;

    // Check existence first so we can return a helpful message
    const check = await fetch(url);
    if (check.status === 404) {
      return { success: false, message: 'Plan not found.' };
    }
    if (!check.ok) throw new Error(`HTTP ${check.status}`);

    const delRes = await fetch(url, { method: 'DELETE' });
    if (!delRes.ok) throw new Error(`HTTP ${delRes.status}`);

    return { success: true, message: 'Plan deleted successfully.' };
  } catch (err) {
    console.error('[apiDeletePlan]', err);
    return { success: false, message: err.message };
  }
}