// ═══════════════════════════════════════════════════
// services/api.js
// ═══════════════════════════════════════════════════
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// ─────────────────────────────────────────────────────
// SALES TEAM PERFORMANCE
// ─────────────────────────────────────────────────────

/**
 * Fetch all sales request records for a given company.
 * GET /sales_requests?company_key=mint
 */
export async function fetchSalesRequests(companyKey) {
  const response = await api.get("/sales_requests", {
    params: { company_key: companyKey },
  });
  return response.data;
}

// ─────────────────────────────────────────────────────
// SALES PERFORMANCE ANALYSIS
// ─────────────────────────────────────────────────────

/**
 * Fetch all companies.
 * GET /companies
 */
export async function fetchCompanies() {
  const response = await api.get("/companies");
  return response.data;
}

/**
 * Fetch projects for a specific company.
 * GET /projects?company_id=1
 */
export async function fetchProjectsByCompany(companyId) {
  const response = await api.get("/projects", {
    params: { company_id: companyId },
  });
  return response.data;
}

/**
 * Fetch sales analysis (price ranges, unit types, unit models) for a project.
 * GET /sales_analysis?project_id=p1
 * Returns the first match (one record per project).
 */
export async function fetchSalesAnalysis(projectId) {
  const response = await api.get("/sales_analysis", {
    params: { project_id: projectId },
  });
  return response.data[0] || null;
}

/**
 * Fetch premium analysis for a project and a specific premium type.
 * GET /premium_analysis?project_id=p1&premium_type=main_view
 */
export async function fetchPremiumAnalysis(projectId, premiumType) {
  const response = await api.get("/premium_analysis", {
    params: { project_id: projectId, premium_type: premiumType },
  });
  return response.data[0] || null;
}