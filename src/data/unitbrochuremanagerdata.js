// ─────────────────────────────────────────────────────────────────────────────
// unitbrochuremanagerdata.js  –  API-backed version
//
// All static ubmGalleryData / ubmCompanies / ubmProjects arrays removed.
// Data is now fetched from JSON Server via masterplansApi.js.
//
// BRIDGE SYNC preserved:
//   • On first gallery load, seeds brochureBridge for the model key + each unit_code.
//   • pushGalleryUpdate() writes back via setBridgeImages for BOTH the model key
//     AND every unit_code so masterplans.js and cataloge.jsx both sync live.
// ─────────────────────────────────────────────────────────────────────────────

import {
  seedBridgeImages,
  setBridgeImages,
  getBridgeImages,
  makeModelKey,
  subscribeToBrochureChanges,
} from './brochureBridge';

import {
  fetchCompanies,
  fetchProjectsByCompany,
  fetchBuildingTypes,
  fetchUnitTypes,
  fetchUnitModels,
  fetchGallery,
  saveGallery,
} from '../services/brochureapi';

// ─────────────────────────────────────────────────────────────────────────────
// QUERY HELPERS
// All are now async — they call the API and cache via the bridge.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /companies
 * Returns all companies for the Company dropdown.
 */
export async function getCompanies() {
  try {
    return await fetchCompanies();
  } catch (err) {
    console.error('[unitbrochuremanagerdata] getCompanies failed:', err);
    return [];
  }
}

/**
 * GET /projects?company_id=<id>
 * Returns projects for a given company.
 */
export async function getProjects(companyId) {
  if (!companyId) return [];
  try {
    return await fetchProjectsByCompany(companyId);
  } catch (err) {
    console.error('[unitbrochuremanagerdata] getProjects failed:', err);
    return [];
  }
}

/**
 * GET /units?company_id=<id>&project_id=<id>  → derive distinct building_type values
 */
export async function getBuildingTypes(companyId, projectId) {
  if (!companyId || !projectId) return [];
  try {
    return await fetchBuildingTypes(companyId, projectId);
  } catch (err) {
    console.error('[unitbrochuremanagerdata] getBuildingTypes failed:', err);
    return [];
  }
}

/**
 * GET /units?company_id=<id>&project_id=<id>&building_type=<type> → distinct unit_type values
 */
export async function getUnitTypes(companyId, projectId, buildingType) {
  if (!companyId || !projectId || !buildingType) return [];
  try {
    return await fetchUnitTypes(companyId, projectId, buildingType);
  } catch (err) {
    console.error('[unitbrochuremanagerdata] getUnitTypes failed:', err);
    return [];
  }
}

/**
 * GET /units?... → distinct unit_model values
 */
export async function getUnitModels(companyId, projectId, buildingType, unitType) {
  if (!companyId || !projectId || !buildingType || !unitType) return [];
  try {
    return await fetchUnitModels(companyId, projectId, buildingType, unitType);
  } catch (err) {
    console.error('[unitbrochuremanagerdata] getUnitModels failed:', err);
    return [];
  }
}

/**
 * Get live gallery for a fully-specified model.
 * Bridge-first (picks up manager uploads instantly), falls back to API.
 *
 * Returns { images: Image[], unitCodes: string[] }
 */
export async function getGallery(companyId, projectId, buildingType, unitType, unitModel) {
  const mKey = makeModelKey(companyId, projectId, buildingType, unitType, unitModel);

  // Return bridge value if manager has already written to it
  const live = getBridgeImages(mKey);
  if (live !== null) return { images: [...live], unitCodes: [] };

  try {
    const result = await fetchGallery(companyId, projectId, buildingType, unitType, unitModel);
    // result: { images: [{id, url, label}], unitCodes: string[] }

    // Seed bridge so future reads are instant
    seedBridgeImages(mKey, result.images);
    if (result.images.length > 0) {
      result.unitCodes.forEach(code => seedBridgeImages(code, result.images));
    }

    return result;
  } catch (err) {
    console.error('[unitbrochuremanagerdata] getGallery failed:', err);
    return { images: [], unitCodes: [] };
  }
}

/**
 * Called by UnitBrochureManager whenever images change (upload/delete/reorder).
 * 1. Persists the change to the API (PATCH /units layout_images).
 * 2. Writes model key + every unit_code into the bridge.
 * Both masterplans.js (getUnitDetails) and cataloge.jsx (LayoutModal) react instantly.
 */
export async function pushGalleryUpdate(companyId, projectId, buildingType, unitType, unitModel, newImages) {
  const mKey = makeModelKey(companyId, projectId, buildingType, unitType, unitModel);

  // Update bridge immediately so UI feels instant
  setBridgeImages(mKey, newImages);

  try {
    // Persist to API + get back the affected unitCodes
    const unitCodes = await saveGallery(companyId, projectId, buildingType, unitType, unitModel, newImages);
    unitCodes.forEach(code => setBridgeImages(code, newImages));
  } catch (err) {
    console.error('[unitbrochuremanagerdata] pushGalleryUpdate failed:', err);
    // Bridge is already updated — UI stays consistent even if API call fails
  }
}

// Re-export so consumers need only one import
export { subscribeToBrochureChanges, getBridgeImages, makeModelKey };