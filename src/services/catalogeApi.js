// src/services/catalogeApi.js
// ─────────────────────────────────────────────────────────────────────────────
// All API calls for the Catalogue page.
// Base URL is read from .env → REACT_APP_API_URL (default: http://localhost:3001)
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ── Companies ─────────────────────────────────────────────────────────────────

/**
 * Fetch all companies.
 * GET /companies
 * @returns {Promise<Array>}  e.g. [{ id, name }, ...]
 */
export async function fetchCompanies() {
  const res = await axios.get(`${BASE_URL}/companies`);
  return res.data;
}

// ── Units ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all units that belong to a specific company.
 * GET /units?company_id={companyId}
 * @param {number} companyId
 * @returns {Promise<Array>}
 */
export async function fetchUnitsByCompany(companyId) {
  const res = await axios.get(`${BASE_URL}/units`, {
    params: { company_id: companyId },
  });
  return res.data;
}
