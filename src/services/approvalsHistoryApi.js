// src/services/approvalsHistoryApi.js
// ─────────────────────────────────────────────────────────────────────────────
// All API calls for the Approvals History page.
// Base URL is read from .env → REACT_APP_API_URL (default: http://localhost:3001)
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ── Approval Companies ────────────────────────────────────────────────────────

/**
 * Fetch all approval companies (includes show_base_price flag).
 * GET /approval_companies
 * @returns {Promise<Array>}  e.g. [{ id, key, company_name, show_base_price }, ...]
 */
export async function fetchApprovalCompanies() {
  const res = await axios.get(`${BASE_URL}/approval_companies`);
  return res.data;
}

// ── Approvals (rows) ──────────────────────────────────────────────────────────

/**
 * Fetch all approval rows for a specific company key (e.g. "mint", "palmier", "igi").
 * GET /approvals?company_key={key}
 * @param {string} companyKey
 * @returns {Promise<Array>}
 */
export async function fetchApprovalsByCompany(companyKey) {
  const res = await axios.get(`${BASE_URL}/approvals`, {
    params: { company_key: companyKey },
  });
  return res.data;
}