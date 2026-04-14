// ── Companies (same as catalogedata.js) ──────────────────────────────────────
export const cancellationCompanies = [
  { id: 1, name: "Mint" },
  { id: 2, name: "Palmier Developments" },
  { id: 3, name: "IGI Developments" },
];

// ── Role mock (replace with real auth in production) ─────────────────────────
// MOCK_ROLE: "sales_ops" | "admin_or_biz"
export const MOCK_ROLE = "admin_or_biz";

// ── Selected company for sales_ops role (auto-assigned) ──────────────────────
export const SALES_OPS_COMPANY = { id: 1, name: "Mint" };

// ─────────────────────────────────────────────────────────────────────────────
// CANCELLATION BRIDGE
//
// A lightweight pub/sub bus that lets the Cancellation page push unit
// status changes into any mounted Catalog component — even across separate
// React trees — without prop-drilling or a global store.
//
// USAGE:
//   // In Cancellation.js (publisher):
//   import { cancellationBridge } from './cancellationdata';
//   cancellationBridge.emit({ unit_code, company_id, newStatus, ... });
//
//   // In Catalog.js (subscriber):
//   import { cancellationBridge } from '../../data/cancellationdata';
//   useEffect(() => {
//     const unsub = cancellationBridge.subscribe(update => {
//       // update: { unit_code, company_id, newStatus, sales_value }
//       setActiveData(prev => prev.map(u =>
//         u.unit_code === update.unit_code
//           ? { ...u, status: update.newStatus, interest_free_unit_price: update.sales_value,
//               reservation_date: null, contract_payment_plan: null }
//           : u
//       ));
//     });
//     return () => unsub();
//   }, []);
// ─────────────────────────────────────────────────────────────────────────────

const _listeners = new Set();

export const cancellationBridge = {
  /**
   * Publish a cancellation update to all subscribers.
   * @param {{ unit_code: string, company_id: number, newStatus: string, sales_value: number }} update
   */
  emit(update) {
    _listeners.forEach(fn => {
      try { fn(update); } catch (_) { /* swallow subscriber errors */ }
    });
  },

  /**
   * Subscribe to cancellation updates.
   * @param {(update: object) => void} fn
   * @returns {() => void} unsubscribe function
   */
  subscribe(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// performCancellation
//
// Simulates the backend POST. In production, replace the body with a real
// fetch() call to your Django endpoint.
//
// Returns: { ok: boolean, message: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function performCancellation({ unit_code, company_id, mockUnits }) {
  // Simulate network latency
  await new Promise(r => setTimeout(r, 900));

  // Find the unit in the shared mock store
  const unit = mockUnits.find(
    u => u.unit_code.trim().toLowerCase() === unit_code.trim().toLowerCase()
      && u.company_id === company_id
  );

  if (!unit) {
    return { ok: false, message: `Unit "${unit_code}" not found for the selected company.` };
  }

  const nonCancellableStatuses = ["Available", "Sold", "Blocked Cancellation", "UNReleased"];
  if (nonCancellableStatuses.includes(unit.status)) {
    return {
      ok: false,
      message: `Unit "${unit_code}" has status "${unit.status}" and cannot be cancelled.`,
    };
  }

  // Apply the cancellation mutations in place (mock DB update)
  unit.status                 = "Blocked Cancellation";
  unit.reservation_date       = null;
  unit.contract_payment_plan  = null;
  // sales_value resets to interest_free_unit_price (step 3 from original page)
  unit.sales_value            = unit.interest_free_unit_price;

  // Broadcast to catalog
  cancellationBridge.emit({
    unit_code:   unit.unit_code,
    company_id:  unit.company_id,
    newStatus:   "Blocked Cancellation",
    sales_value: unit.interest_free_unit_price,
  });

  return {
    ok: true,
    message: `Unit "${unit_code}" reservation has been successfully cancelled.`,
  };
}