// services/masterplansapi.js
// All masterplan-related API calls — uses shared Axios instance

import api from './salesperformanceanalysisapi';

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

/**
 * Fetch all projects.
 * GET /projects
 */
export async function fetchProjects() {
  const { data } = await api.get('/projects');
  return data; // [{ id, name, company_id }, ...]
}

// ─── MASTERPLAN ───────────────────────────────────────────────────────────────

/**
 * Fetch the masterplan config for a project.
 * GET /masterplans?project_id=<id>
 */
export async function fetchMasterplan(projectId) {
  const { data } = await api.get('/masterplans', {
    params: { project_id: parseInt(projectId, 10) },
  });
  return data[0] || null; // { id, project_id, has_masterplan, image_url, is_client }
}

// ─── UNIT POSITIONS ───────────────────────────────────────────────────────────

/**
 * Fetch all pin positions for a project.
 * GET /unit_positions?project_id=<id>
 */
export async function fetchUnitPositions(projectId) {
  const { data } = await api.get('/unit_positions', {
    params: { project_id: parseInt(projectId, 10) },
  });
  return data;
}

/**
 * Update a single pin's position (used by settings/drag).
 * PATCH /unit_positions/<id>
 */
export async function updateUnitPosition(positionId, patch) {
  const { data } = await api.patch(`/unit_positions/${positionId}`, patch);
  return data;
}

// ─── UNIT DETAILS ─────────────────────────────────────────────────────────────

/**
 * Fetch full detail for one unit by its unit_code.
 * GET /units?unit_code=<code>
 */
export async function fetchUnitDetails(unitCode) {
  // 1. Try a direct lookup first
  const { data: rows } = await api.get('/units', { params: { unit_code: unitCode } });

  if (rows.length > 0) {
    const u = rows[0];
    return {
      type: 'single',
      company_id: u.company_id,
      project: u.project,
      project_id: u.project_id,
      data: {
        unit_code:                  u.unit_code,
        status:                     u.status,
        interest_free_unit_price:   u.interest_free_unit_price,
        development_delivery_date:  u.development_delivery_date,
        finishing_specs:            u.finishing_specs,
        gross_area:                 u.sellable_area,
        garden_area:                u.garden_area,
        land_area:                  u.land_area,
        penthouse_area:             u.penthouse_area,
        roof_terraces_area:         u.roof_terraces_area,
        num_bedrooms:               u.num_bedrooms,
        unit_model:                 u.unit_model,
        floor:                      u.floor || 'G',
        layout_images:              u.layout_images || [],
      },
    };
  }

  // 2. Not found — check if it is a building block code via unit_positions
  const { data: positions } = await api.get('/unit_positions', {
    params: { unit_code: unitCode },
  });

  if (positions.length > 0 && positions[0].unit_type === 'building') {
    const pos        = positions[0];
    const childCodes = pos.child_codes || (pos.filter_data || []).map(u => u.unit_code);

    const childResults = await Promise.all(
      childCodes.map(code =>
        api.get('/units', { params: { unit_code: code } }).then(r => r.data[0]).catch(() => null)
      )
    );

    const units = childResults
      .filter(Boolean)
      .map(u => ({
        unit_code:                 u.unit_code,
        floor:                     u.floor || 'G',
        status:                    u.status,
        interest_free_unit_price:  u.interest_free_unit_price,
        finishing_specs:           u.finishing_specs,
        gross_area:                u.sellable_area,
        num_bedrooms:              u.num_bedrooms,
        unit_model:                u.unit_model,
        layout_images:             u.layout_images || [],
      }));

    const first = childResults.find(Boolean);
    return {
      type:          'building',
      building_name: pos.building_name || unitCode,
      company_id:    first?.company_id || null,
      project:       first?.project    || '',
      project_id:    first?.project_id || null,
      data:          units,
    };
  }

  // 3. Fallback
  return {
    type: 'single',
    company_id: null,
    project: 'Unknown',
    project_id: null,
    data: {
      unit_code:                 unitCode,
      status:                    'Available',
      interest_free_unit_price:  null,
      development_delivery_date: 'TBD',
      finishing_specs:           'N/A',
      gross_area:                0,
      garden_area:               0,
      land_area:                 0,
      penthouse_area:            0,
      roof_terraces_area:        0,
      num_bedrooms:              'N/A',
      unit_model:                'N/A',
      floor:                     'N/A',
      layout_images:             [],
    },
  };
}

// ─── CATALOGUE VALIDATION ─────────────────────────────────────────────────────

/**
 * Fetch a single unit by unit_code for catalogue validation.
 * GET /units?unit_code=<code>
 */
export async function fetchUnitByCode(unitCode) {
  const { data } = await api.get('/units', { params: { unit_code: unitCode } });
  return data.length > 0 ? data[0] : null;
}
