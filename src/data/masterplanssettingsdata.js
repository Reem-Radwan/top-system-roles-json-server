import {
  getMasterplanData,   // returns { has_masterplan, image_url, unit_positions[] }
  getUnitDetails,      // returns { type, data / building_name+data[], company_id, ... }
} from './masterplansdata';

// Shared bridge — lets masterplans.js subscribe to our pin mutations
import { bridgePositionStore, notifyBridgeChange } from './masterplansBridge';

// API layer for catalogue validation
import { fetchUnitByCode } from '../services/masterplansapi';

const delay = ms => new Promise(res => setTimeout(res, ms));

// Use the bridge store as our positionStore so masterplansdata can read it too
const positionStore  = bridgePositionStore;  // same object reference as the bridge
const imageStore     = {};   // projectId (int) -> image_url | null
const childRegistry  = {};   // childId (int)  -> { projectId, positionId, unitCode }
const pendingFetch   = {};   // projectId (int) -> Promise  (prevents double-fetch)

let nextPositionId = 50_000;
let nextChildId    = 40_000;

/**
 * One-time async initialise: fetch base data, deep-clone into the mutable store,
 * and assign stable child-ids to every unit inside a building position.
 *
 * FIX: imageStore and positionStore are now guarded INDEPENDENTLY.
 *
 * The bug: masterplans.js calls getMasterplanData() first, which seeds
 * bridgePositionStore[id] before the settings page ever opens.
 * ensureStore then saw positionStore[id] !== undefined and returned early —
 * but imageStore[id] was never set, so getMasterplanSettingsData returned
 * { has_masterplan: false } until a full page refresh.
 *
 * Fix: always fetch + populate imageStore when it is missing, regardless of
 * whether positionStore was already seeded by masterplans.js.
 */
async function ensureStore(projectId) {
  const id = parseInt(projectId, 10);

  // imageStore already populated AND positions already initialised — fully done
  if (imageStore[id] !== undefined && positionStore[id] !== undefined) return;

  // Another call is already fetching — wait for it
  if (pendingFetch[id]) return pendingFetch[id];

  pendingFetch[id] = (async () => {
    try {
      const d = await getMasterplanData(id);

      // Always populate imageStore (this was the missing step)
      imageStore[id] = d.has_masterplan ? d.image_url : null;

      if (!d.has_masterplan) {
        positionStore[id] = positionStore[id] ?? [];
        return;
      }

      // positionStore may have already been seeded by masterplans.js via the
      // bridge — if so, reuse it (it's the live array) but still assign
      // child_ids to any building pins that don't have them yet.
      if (positionStore[id] === undefined) {
        positionStore[id] = JSON.parse(JSON.stringify(d.unit_positions));
      }

      // Assign child_ids to every unit inside a building pin (idempotent —
      // skips units that already received a child_id from a previous call)
      positionStore[id].forEach(pos => {
        if (pos.unit_type === 'building') {
          (pos.filter_data || []).forEach(u => {
            if (u.child_id != null) return; // already assigned
            const cid = nextChildId++;
            u.child_id = cid;
            childRegistry[cid] = {
              projectId : id,
              positionId: pos.id,
              unitCode  : u.unit_code,
            };
          });
        }
      });

    } finally {
      delete pendingFetch[id];
    }
  })();

  return pendingFetch[id];
}

// ─── VALIDATION HELPERS ───────────────────────────────────────────────────────

/**
 * Check if a unit code exists in the catalogue via API.
 */
async function isUnitInCatalogue(unitCode) {
  try {
    const unit = await fetchUnitByCode(unitCode);
    return !!unit;
  } catch {
    return false;
  }
}

/**
 * Check if a unit code already has a pin on any project's masterplan.
 * For building pins, also checks child_codes / filter_data.
 */
function isUnitAlreadyPinned(unitCode) {
  for (const positions of Object.values(positionStore)) {
    for (const pos of positions) {
      if (pos.unit_code === unitCode) return true;
      // Check inside building stacks
      if (pos.unit_type === 'building') {
        const children = pos.child_codes || (pos.filter_data || []).map(u => u.unit_code);
        if (children.includes(unitCode)) return true;
      }
    }
  }
  return false;
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Returns masterplan image URL + current mutable position list for a project.
 * Mirrors Django's `get_project_masterplan` view.
 */
export async function getMasterplanSettingsData(projectId) {
  const id = parseInt(projectId, 10);
  await ensureStore(id);

  const imageUrl = imageStore[id];
  if (!imageUrl) return { has_masterplan: false };

  return {
    has_masterplan : true,
    image_url      : imageUrl,
    unit_positions : positionStore[id] || [],
  };
}

/**
 * Returns simplified unit data for the ADMIN tooltip.
 *   Single   → { type:'single',   data: { unit_code, interest_free_unit_price, gross_area, land_area } }
 *   Building → { type:'building', building_name, data:[{ unit_code, floor, interest_free_unit_price, gross_area, child_id }] }
 *
 * child_ids come from the mutable store (assigned in ensureStore).
 * Mirrors Django's `get_unit_details_for_masterplan` view (admin variant).
 */
export async function getUnitSettingsDetails(unitCode, projectId) {
  await delay(150);

  const baseDetail = await getUnitDetails(unitCode);
  if (!baseDetail) return null;

  // ── SINGLE UNIT ──────────────────────────────────────────────────────────
  if (baseDetail.type === 'single') {
    const u = baseDetail.data;
    return {
      type: 'single',
      data: {
        unit_code               : u.unit_code,
        interest_free_unit_price: u.interest_free_unit_price,
        gross_area              : u.gross_area,
        land_area               : u.land_area,
      },
    };
  }

  // ── BUILDING (STACK) ─────────────────────────────────────────────────────
  if (baseDetail.type === 'building') {
    // Build a unit_code → child_id lookup from the mutable store
    const id  = parseInt(projectId, 10);
    const positions = positionStore[id] || [];
    const pos = positions.find(p => p.unit_code === unitCode && p.unit_type === 'building');

    const childIdMap = {};
    if (pos && pos.filter_data) {
      pos.filter_data.forEach(u => {
        if (u.child_id != null) childIdMap[u.unit_code] = u.child_id;
      });
    }

    return {
      type         : 'building',
      building_name: baseDetail.building_name,
      data         : baseDetail.data.map(u => ({
        unit_code               : u.unit_code,
        floor                   : u.floor || '-',
        interest_free_unit_price: u.interest_free_unit_price,
        gross_area              : u.gross_area,
        child_id                : childIdMap[u.unit_code] ?? null,
      })),
    };
  }

  return null;
}

/**
 * Saves a new unit pin position.
 * Validates:
 *   1. Unit code must exist in the catalogue (mockUnits).
 *   2. Unit code must NOT already have a pin on this masterplan.
 * Mirrors Django's `save_unit_position` view.
 *
 * Returns:
 *   { success: false, errorType: 'not_in_catalogue' | 'already_pinned', error: string }
 *   { success: true, position_id, unit_code, unit_type, x_percent, y_percent, unit_status }
 */
export async function saveUnitPosition(projectId, unitCode, unitType, xPercent, yPercent) {
  await delay(300);
  const id = parseInt(projectId, 10);
  await ensureStore(id);

  // ── Validation 1: unit must exist in the catalogue ───────────────────────
  const inCatalogue = await isUnitInCatalogue(unitCode);
  if (!inCatalogue) {
    return {
      success   : false,
      errorType : 'not_in_catalogue',
      error     : `Unit code "${unitCode}" was not found in the database. Please check the code and try again.`,
    };
  }

  // ── Validation 2: unit must not already be pinned ────────────────────────
  if (isUnitAlreadyPinned(unitCode)) {
    return {
      success   : false,
      errorType : 'already_pinned',
      error     : `Unit "${unitCode}" already has a pin on this masterplan. Each unit can only be pinned once.`,
    };
  }

  // ── Determine unit_status for marker colour ──────────────────────────────
  let unit_status = unitType === 'building' ? null : 'Available';
  if (unitType === 'single') {
    try {
      const d = await getUnitDetails(unitCode);
      if (d?.data?.status) unit_status = d.data.status;
    } catch { /* keep default */ }
  }

  const newPos = {
    id         : nextPositionId++,
    unit_code  : unitCode,
    unit_type  : unitType,
    x_percent  : parseFloat(parseFloat(xPercent).toFixed(3)),
    y_percent  : parseFloat(parseFloat(yPercent).toFixed(3)),
    unit_status,
    filter_data: [],   // real backend populates this from DB; we leave empty for new pins
    child_codes: [],
  };

  (positionStore[id] = positionStore[id] || []).push(newPos);
  notifyBridgeChange(id);

  return {
    success    : true,
    position_id: newPos.id,
    unit_code  : newPos.unit_code,
    unit_type  : newPos.unit_type,
    x_percent  : newPos.x_percent,
    y_percent  : newPos.y_percent,
    unit_status: newPos.unit_status,
  };
}

/**
 * Deletes an entire pin (and all its child registrations).
 * Mirrors Django's `delete_unit_position` view.
 */
export async function deleteUnitPosition(positionId) {
  await delay(200);

  for (const [pid, positions] of Object.entries(positionStore)) {
    const idx = positions.findIndex(p => p.id === positionId);
    if (idx !== -1) {
      // Unregister children
      const pos = positions[idx];
      (pos.filter_data || []).forEach(u => {
        if (u.child_id != null) delete childRegistry[u.child_id];
      });
      positions.splice(idx, 1);
      notifyBridgeChange(pid);
      return { success: true };
    }
  }
  return { success: false, error: 'Position not found' };
}

/**
 * Removes a single unit from a building stack.
 * Mirrors Django's `delete_child_unit` view.
 */
export async function deleteChildUnit(childId) {
  await delay(150);

  const entry = childRegistry[childId];
  if (!entry) return { success: false, error: 'Child unit not found' };

  const { projectId, positionId, unitCode } = entry;
  const positions = positionStore[projectId];
  if (!positions) return { success: false };

  const pos = positions.find(p => p.id === positionId);
  if (!pos || !pos.filter_data) return { success: false };

  pos.filter_data = pos.filter_data.filter(u => u.unit_code !== unitCode);
  delete childRegistry[childId];

  return { success: true };
}

