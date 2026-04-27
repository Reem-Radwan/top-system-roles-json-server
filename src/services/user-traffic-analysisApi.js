// ============================================================
//  user-traffic-analysisapi.js
//  All data-fetching for the User Traffic Analysis dashboard.
//  Targets a json-server instance running at BASE_URL.
//
//  Start the server with:
//    npx json-server --watch db.json --port 3001
//
//  .env:  REACT_APP_API_URL=http://localhost:3001
// ============================================================

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ─── low-level fetch helper ──────────────────────────────────
async function apiFetch(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${endpoint}`);
  return res.json();
}

// ─── Build query string from filter object ───────────────────
// json-server supports: field=value, field_gte=, field_lte=, _limit, _page, q
function buildLogsQuery(F = {}) {
  const params = new URLSearchParams();

  // Date range — compare ISO strings (lexicographic works for ISO 8601)
  if (F.start) params.append('dt_gte', F.start.toISOString());
  if (F.end) {
    const e = new Date(F.end);
    e.setHours(23, 59, 59, 999);
    params.append('dt_lte', e.toISOString());
  }

  // Single-value filters that json-server handles natively
  if (F.companies?.length === 1) params.append('co', F.companies[0]);
  if (F.emails?.length   === 1) params.append('email', F.emails[0]);
  if (F.groups?.length   === 1) params.append('grp', F.groups[0]);
  if (F.paths?.length    === 1) params.append('path', F.paths[0]);

  // No built-in multi-value OR filter in json-server — fetch all and post-filter
  // (multi-value arrays are handled client-side in filterLogs below)

  // Fetch up to 10 000 rows so we have the full dataset for aggregations
  params.append('_limit', '10000');

  return params.toString() ? `?${params.toString()}` : '';
}

// ─── Post-filter rows for multi-value & derived filters ──────
export function filterLogs(rows, F) {
  return rows.filter(r => {
    if (F.companies?.length > 1  && !F.companies.includes(r.co))    return false;
    if (F.emails?.length   > 1   && !F.emails.includes(r.email))    return false;
    if (F.groups?.length   > 1   && !F.groups.includes(r.grp))      return false;
    if (F.paths?.length    > 1   && !F.paths.includes(r.path))      return false;
    if (F.hours?.length          && !F.hours.includes(new Date(r.dt).getHours())) return false;
    if (F.dows?.length           && !F.dows.includes(new Date(r.dt).getDay()))    return false;
    if (F.dateFilter && r.dt.slice(0, 10) !== F.dateFilter)          return false;
    return true;
  });
}

// ─── Public API functions ────────────────────────────────────

/**
 * Fetch all logs, optionally pre-filtered by server-side params.
 * Returns raw rows with dt as ISO string.
 */
export async function fetchLogs(F = {}) {
  const qs   = buildLogsQuery(F);
  const rows = await apiFetch(`/logs${qs}`);
  // Parse dt strings into Date objects for compatibility with compute()
  return rows.map(r => ({ ...r, dt: new Date(r.dt) }));
}

/**
 * Fetch filter dropdown options from /meta (single object) and /users.
 * Returns { companies, emails, groups, paths }
 */
export async function fetchFilterOptions() {
  const [meta, paths] = await Promise.all([
    apiFetch('/meta'),
    apiFetch('/paths'),
  ]);
  return {
    companies: meta.companies,
    emails:    meta.emails,
    groups:    meta.groups,
    paths:     paths.map(p => p.path),
  };
}

/**
 * Fetch all users (for name lookups).
 */
export async function fetchUsers() {
  return apiFetch('/users');
}

/**
 * Convenience: fetch everything the dashboard needs on mount.
 * Returns { logs, filterOptions }
 */
export async function fetchDashboardData(F = {}) {
  const [logs, filterOptions] = await Promise.all([
    fetchLogs(F),
    fetchFilterOptions(),
  ]);
  return { logs, filterOptions };
}

// ─── Cohort helper — needs ALL logs (unfiltered) ─────────────
let _allLogsCache = null;

export async function fetchAllLogsOnce() {
  if (!_allLogsCache) {
    const rows = await apiFetch('/logs?_limit=10000');
    _allLogsCache = rows.map(r => ({ ...r, dt: new Date(r.dt) }));
  }
  return _allLogsCache;
}

/** Invalidate the all-logs cache (call after writes). */
export function invalidateLogsCache() {
  _allLogsCache = null;
}