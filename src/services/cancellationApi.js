import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3001' });

// ── 1. Fetch all companies ────────────────────────────────────────────────────
export async function getCompanies() {
  const res = await API.get('/companies');
  return res.data; // [{ id, name }, ...]
}

// ── 2. Cancel a unit reservation (find → validate → PATCH) ───────────────────
export async function cancelUnit({ unit_code, company_id }) {
  // Step A: find the unit by code + company
  const search = await API.get('/units', {
    params: { unit_code, company_id },
  });

  const matches = search.data;

  // Case-insensitive match (mirrors the original mock logic)
  const unit = matches.find(
    u => u.unit_code.trim().toLowerCase() === unit_code.trim().toLowerCase()
  );

  if (!unit) {
    return { ok: false, message: `Unit "${unit_code}" not found for this company.` };
  }

  // Step B: validate status
  const nonCancellable = ['Available', 'Sold', 'Blocked Cancellation', 'UNReleased'];
  if (nonCancellable.includes(unit.status)) {
    return {
      ok: false,
      message: `Unit "${unit_code}" has status "${unit.status}" and cannot be cancelled.`,
    };
  }

  // Step C: apply the 3-step cancellation mutation via PATCH
  await API.patch(`/units/${unit.id}`, {
    status:                'Blocked Cancellation',
    reservation_date:      null,
    contract_payment_plan: null,
    sales_value:           unit.interest_free_unit_price,
  });

  return { ok: true, message: `Unit "${unit_code}" reservation cancelled successfully.` };
}