// services/brochureapi.js
// All brochure/gallery-related API calls — uses shared Axios instance

import api from './salesperformanceanalysisapi';

// ─── COMPANIES ────────────────────────────────────────────────────────────────

/**
 * GET /companies
 */
export async function fetchCompanies() {
  const { data } = await api.get('/companies');
  return data; // [{ id, name }, ...]
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

/**
 * GET /projects?company_id=<id>
 */
export async function fetchProjectsByCompany(companyId) {
  const { data } = await api.get('/projects', {
    params: { company_id: parseInt(companyId, 10) },
  });
  return data;
}

// ─── DROPDOWN FILTERS ─────────────────────────────────────────────────────────

/**
 * GET /units?company_id=<id>&project_id=<id>
 * Returns distinct building_type values.
 */
export async function fetchBuildingTypes(companyId, projectId) {
  const { data } = await api.get('/units', {
    params: {
      company_id: parseInt(companyId, 10),
      project_id: parseInt(projectId, 10),
    },
  });
  return [...new Set(data.map(u => u.building_type).filter(Boolean))].sort();
}

/**
 * GET /units?company_id=<id>&project_id=<id>&building_type=<type>
 * Returns distinct unit_type values.
 */
export async function fetchUnitTypes(companyId, projectId, buildingType) {
  const { data } = await api.get('/units', {
    params: {
      company_id:    parseInt(companyId, 10),
      project_id:    parseInt(projectId, 10),
      building_type: buildingType,
    },
  });
  return [...new Set(data.map(u => u.unit_type).filter(Boolean))].sort();
}

/**
 * GET /units?company_id=<id>&project_id=<id>&building_type=<type>&unit_type=<type>
 * Returns distinct unit_model values.
 */
export async function fetchUnitModels(companyId, projectId, buildingType, unitType) {
  const { data } = await api.get('/units', {
    params: {
      company_id:    parseInt(companyId, 10),
      project_id:    parseInt(projectId, 10),
      building_type: buildingType,
      unit_type:     unitType,
    },
  });
  return [...new Set(data.map(u => u.unit_model).filter(Boolean))].sort();
}

// ─── GALLERY ──────────────────────────────────────────────────────────────────

/**
 * Fetch gallery images for a specific unit model.
 * Returns: { images: [{ id, url, label }], unitCodes: string[] }
 */
export async function fetchGallery(companyId, projectId, buildingType, unitType, unitModel) {
  const { data } = await api.get('/units', {
    params: {
      company_id:    parseInt(companyId, 10),
      project_id:    parseInt(projectId, 10),
      building_type: buildingType,
      unit_type:     unitType,
      unit_model:    unitModel,
    },
  });

  const unitCodes  = data.map(u => u.unit_code);
  const withImages = data.find(u => u.layout_images && u.layout_images.length > 0);
  const rawImages  = withImages ? withImages.layout_images : [];

  const images = rawImages.map((url, idx) => ({
    id:    idx + 1,
    url,
    label: `Layout ${idx + 1}`,
  }));

  return { images, unitCodes };
}

/**
 * Save updated gallery images for a unit model.
 * PATCHes every matching unit with the new layout_images array.
 * Returns the list of unit_codes updated.
 */
export async function saveGallery(companyId, projectId, buildingType, unitType, unitModel, newImages) {
  const urls = newImages.map(img => img.url);

  const { data: units } = await api.get('/units', {
    params: {
      company_id:    parseInt(companyId, 10),
      project_id:    parseInt(projectId, 10),
      building_type: buildingType,
      unit_type:     unitType,
      unit_model:    unitModel,
    },
  });

  await Promise.all(
    units.map(u => api.patch(`/units/${u.id}`, { layout_images: urls }))
  );

  return units.map(u => u.unit_code);
}
