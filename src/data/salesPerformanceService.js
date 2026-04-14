// data/salesPerformanceService.js
// Business logic only — Axios instance is imported from services/salesperformanceanalysisapi.js

import api from '../services/salesperformanceanalysisapi';

/* ============================================================
   AUTH HELPER  (mirrors Django's selected_company_id)
   ============================================================ */
function getAuthUser() {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const UNBOUND_ROLES = ['Admin', 'Developer'];

/* ============================================================
   SERVICE
   ============================================================ */
export const salesPerformanceService = {

  /**
   * Get companies + auth meta.
   * JSON Server endpoint: GET /companies
   */
  async getCompanies() {
    try {
      const { data: companies } = await api.get('/companies');

      const authUser = getAuthUser();
      const isUnbound = !authUser || UNBOUND_ROLES.includes(authUser.role);
      const selectedCompanyId = isUnbound
        ? null
        : authUser.company_id ? String(authUser.company_id) : null;

      let initialProjects = [];
      if (selectedCompanyId) {
        const { data: projects } = await api.get('/projects', {
          params: { company_id: parseInt(selectedCompanyId, 10) },
        });
        initialProjects = projects;
      }

      return {
        success: true,
        data: companies,
        meta: { selectedCompanyId, initialProjects },
      };
    } catch (error) {
      console.error('[getCompanies]', error.message);
      return { success: false, error: 'Failed to load companies' };
    }
  },

  /**
   * Get projects for a specific company.
   * JSON Server endpoint: GET /projects?company_id=<id>
   */
  async getCompanyProjects(companyId) {
    try {
      const { data } = await api.get('/projects', {
        params: { company_id: parseInt(companyId, 10) },
      });
      return { success: true, data };
    } catch (error) {
      console.error('[getCompanyProjects]', error.message);
      return { success: false, error: 'Failed to load projects' };
    }
  },

  /**
   * Get Sales Analysis — Price Range breakdown.
   * JSON Server endpoint: GET /sales_analysis?project_id=<id>
   */
  async getSalesAnalysisData(projectId) {
    if (!projectId) return { success: false, error: 'project_id is required' };
    try {
      const { data } = await api.get('/sales_analysis', {
        params: { project_id: parseInt(projectId, 10) },
      });
      if (!data || data.length === 0) return { success: false, error: 'No data found' };

      const record = data[0];
      const rows = record.price_ranges || [];
      const totals = record.totals || {
        all:         rows.reduce((s, r) => s + (r.all         || 0), 0),
        released:    rows.reduce((s, r) => s + (r.released    || 0), 0),
        available:   rows.reduce((s, r) => s + (r.available   || 0), 0),
        sold_booked: rows.reduce((s, r) => s + (r.sold_booked || 0), 0),
      };
      return {
        success: true,
        data: {
          success: true,
          price_ranges: rows,
          totals,
        },
      };
    } catch (error) {
      console.error('[getSalesAnalysisData]', error.message);
      return { success: false, error: 'Failed to load price range data' };
    }
  },

  /**
   * Get Sales Analysis — Unit Type breakdown.
   * JSON Server endpoint: GET /sales_analysis?project_id=<id>
   */
  async getSalesAnalysisByUnitType(projectId) {
    if (!projectId) return { success: false, error: 'project_id is required' };
    try {
      const { data } = await api.get('/sales_analysis', {
        params: { project_id: parseInt(projectId, 10) },
      });
      if (!data || data.length === 0) return { success: false, error: 'No data found' };

      const record = data[0];
      const rows = record.unit_types || [];
      const totals = record.totals || {
        all:         rows.reduce((s, r) => s + (r.all         || 0), 0),
        released:    rows.reduce((s, r) => s + (r.released    || 0), 0),
        available:   rows.reduce((s, r) => s + (r.available   || 0), 0),
        sold_booked: rows.reduce((s, r) => s + (r.sold_booked || 0), 0),
      };
      return {
        success: true,
        data: {
          success: true,
          unit_types: rows,
          totals,
        },
      };
    } catch (error) {
      console.error('[getSalesAnalysisByUnitType]', error.message);
      return { success: false, error: 'Failed to load unit type data' };
    }
  },

  /**
   * Get Sales Analysis — Unit Model breakdown.
   * JSON Server endpoint: GET /sales_analysis?project_id=<id>
   */
  async getSalesAnalysisByUnitModel(projectId) {
    if (!projectId) return { success: false, error: 'project_id is required' };
    try {
      const { data } = await api.get('/sales_analysis', {
        params: { project_id: parseInt(projectId, 10) },
      });
      if (!data || data.length === 0) return { success: false, error: 'No data found' };

      const record = data[0];
      const rows = record.unit_models || [];
      const totals = record.totals || {
        all:         rows.reduce((s, r) => s + (r.all         || 0), 0),
        released:    rows.reduce((s, r) => s + (r.released    || 0), 0),
        available:   rows.reduce((s, r) => s + (r.available   || 0), 0),
        sold_booked: rows.reduce((s, r) => s + (r.sold_booked || 0), 0),
      };
      return {
        success: true,
        data: {
          success: true,
          unit_models: rows,
          totals,
        },
      };
    } catch (error) {
      console.error('[getSalesAnalysisByUnitModel]', error.message);
      return { success: false, error: 'Failed to load unit model data' };
    }
  },

  /**
   * Get Premium Analysis.
   * JSON Server endpoint: GET /premium_analysis?project_id=<id>&premium_type=<type>
   *
   * @param {string} premiumType – 'main_view' | 'secondary_view' | 'back_view' |
   *                               'levels' | 'north_breeze' | 'corners' | 'accessibility'
   */
  async getPremiumAnalysisData(projectId, premiumType) {
    if (!projectId || !premiumType) return { success: false, error: 'Missing parameters' };
    try {
      const { data } = await api.get('/premium_analysis', {
        params: { project_id: parseInt(projectId, 10), premium_type: premiumType },
      });
      if (!data || data.length === 0) return { success: false, error: `No data for ${premiumType}` };

      const record = data[0];
      return {
        success: true,
        data: {
          success: true,
          premium_groups: record.premium_groups,
          totals: record.totals,
        },
      };
    } catch (error) {
      console.error('[getPremiumAnalysisData]', error.message);
      return { success: false, error: 'Failed to load premium data' };
    }
  },
};

export default salesPerformanceService;