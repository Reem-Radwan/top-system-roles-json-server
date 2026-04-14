// ─── services/api.js ──────────────────────────────────────────────────────────
// All API calls to JSON Server go here.
// Base URL is read from your .env file: REACT_APP_API_URL=http://localhost:3001
// ──────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Companies ────────────────────────────────────────────────────────────────

/**
 * Fetch all companies.
 * GET /companies
 * @returns {Promise<Array>} Array of company objects { id, name }
 */
export const getCompanies = async () => {
  const response = await api.get('/companies');
  return response.data;
};

// ─── Units ────────────────────────────────────────────────────────────────────

/**
 * Fetch all units for a specific company, plus the company object itself.
 * GET /units?company_id={companyId}
 * GET /companies/{companyId}
 *
 * @param {number|string} companyId
 * @returns {Promise<{ units: Array, company: Object }>}
 */
export const getCompanyUnits = async (companyId) => {
  const id = String(companyId);

  const [unitsRes, companyRes] = await Promise.all([
    api.get(`/units?company_id=${id}`),
    api.get(`/companies/${id}`),
  ]);

  return {
    units:   unitsRes.data,
    company: companyRes.data,
  };
};

// ─── Optional CRUD helpers (add as needed) ────────────────────────────────────

/**
 * Add a new unit.
 * POST /units
 */
export const addUnit = async (unitData) => {
  const response = await api.post('/units', unitData);
  return response.data;
};

/**
 * Update an existing unit.
 * PATCH /units/{id}
 */
export const updateUnit = async (id, updates) => {
  const response = await api.patch(`/units/${id}`, updates);
  return response.data;
};

/**
 * Delete a unit.
 * DELETE /units/{id}
 */
export const deleteUnit = async (id) => {
  const response = await api.delete(`/units/${id}`);
  return response.data;
};

export default api;