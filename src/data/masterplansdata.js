// masterplansdata.js
// All mock data has been removed.
// This file now acts as a thin adapter between the React page and the API layer.
// It preserves the exact same function signatures so masterplans.js needs only
// one import-path change.

import { bridgePositionStore, subscribeToBridgeChanges } from './masterplansBridge';
import { getBridgeImages, seedBridgeImages }              from './brochureBridge';
import {
  fetchProjects,
  fetchMasterplan,
  fetchUnitPositions,
  fetchUnitDetails as apiFetchUnitDetails,
} from '../services/masterplansapi';

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
// Kept as a cache so the dropdown doesn't need its own useEffect.
// Populated on first call to getProjects().
let _projectsCache = null;

/**
 * Returns all projects. Used by the ProjectSelect dropdown and scoped-user logic.
 * masterplans.js calls this once on mount.
 */
export async function getProjects() {
  if (_projectsCache) return _projectsCache;
  try {
    _projectsCache = await fetchProjects();
    return _projectsCache;
  } catch (err) {
    console.error('[masterplansdata] getProjects failed:', err);
    return [];
  }
}

// ─── MASTERPLAN DATA ──────────────────────────────────────────────────────────
/**
 * Returns masterplan image + unit positions for a project.
 * Shape (unchanged): { has_masterplan, image_url, unit_positions, is_client }
 *
 * Uses bridgePositionStore as a local write-through cache so that
 * masterplans settings (drag & pin edits) stay in sync without a refetch.
 */
export async function getMasterplanData(projectId) {
  const id = parseInt(projectId, 10);

  try {
    const masterplan = await fetchMasterplan(id);
    if (!masterplan || !masterplan.has_masterplan) return { has_masterplan: false };

    // Seed the bridge store if it hasn't been populated yet for this project
    if (bridgePositionStore[id] === undefined) {
      const positions = await fetchUnitPositions(id);
      bridgePositionStore[id] = positions;
    }

    return {
      has_masterplan:  true,
      image_url:       masterplan.image_url,
      unit_positions:  bridgePositionStore[id],
      is_client:       masterplan.is_client || false,
    };
  } catch (err) {
    console.error('[masterplansdata] getMasterplanData failed:', err);
    return { has_masterplan: false };
  }
}

// ─── SUBSCRIBE TO SETTINGS CHANGES ───────────────────────────────────────────
/**
 * masterplans.js uses this to react to pin mutations made in the Settings page.
 * The bridge re-notifies with the changed projectId; no API round-trip needed
 * because the Settings page already wrote the new positions to bridgePositionStore.
 */
export function subscribeToSettingsChanges(fn) {
  return subscribeToBridgeChanges(fn);
}

// ─── UNIT DETAILS ─────────────────────────────────────────────────────────────
/**
 * Returns full unit detail for a single unit or a building block.
 * Layout images are resolved live from brochureBridge (picks up uploads instantly).
 *
 * Priority:
 *   1. brochureBridge[unitCode]  — set by UnitBrochureManager
 *   2. layout_images from the API
 */
export async function getUnitDetails(unitCode) {
  try {
    const entry = await apiFetchUnitDetails(unitCode);

    if (entry.type === 'building') {
      // Patch each child unit's layout_images from the bridge
      const liveUnits = entry.data.map(u => {
        const bridgeImgs = getBridgeImages(u.unit_code);
        if (bridgeImgs !== null) {
          return { ...u, layout_images: bridgeImgs.map(img => img.url) };
        }
        return u;
      });

      // Also seed the bridge for any units that don't have it yet
      entry.data.forEach(u => {
        if (getBridgeImages(u.unit_code) === null && u.layout_images?.length) {
          seedBridgeImages(u.unit_code, u.layout_images.map((url, i) => ({ id: i + 1, url, label: `Layout ${i + 1}` })));
        }
      });

      return { ...entry, data: liveUnits };
    }

    // Single unit
    const bridgeImgs = getBridgeImages(unitCode);

    // Seed bridge on first load if not already seeded
    if (bridgeImgs === null && entry.data?.layout_images?.length) {
      seedBridgeImages(unitCode, entry.data.layout_images.map((url, i) => ({ id: i + 1, url, label: `Layout ${i + 1}` })));
    }

    const liveImages = bridgeImgs !== null
      ? bridgeImgs.map(img => img.url)
      : (entry.data?.layout_images || []);

    return {
      ...entry,
      data: { ...entry.data, layout_images: liveImages },
    };
  } catch (err) {
    console.error('[masterplansdata] getUnitDetails failed for', unitCode, err);
    // Return a safe fallback so the UI never crashes
    return {
      type: 'single', company_id: null, project: 'Unknown', project_id: null,
      data: {
        unit_code: unitCode, status: 'Available',
        interest_free_unit_price: null,
        development_delivery_date: 'TBD',
        finishing_specs: 'N/A',
        gross_area: 0, garden_area: 0, land_area: 0,
        penthouse_area: 0, roof_terraces_area: 0,
        num_bedrooms: 'N/A', unit_model: 'N/A',
        floor: 'N/A', layout_images: [],
      },
    };
  }
}


