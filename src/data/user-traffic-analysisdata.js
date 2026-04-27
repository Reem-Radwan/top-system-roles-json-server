// ============================================================
//  user-traffic-analysisdata.js
//  Static constants only — all log data is fetched via the API
//  (see user-traffic-analysisapi.js)
// ============================================================

// URL → category mapping
export const UTA_CATS = {
  'Reports & Analytics': ['/reports/sales/', '/reports/traffic/', '/analytics/overview/'],
  'Data Operations':     ['/upload/documents/', '/pipeline/', '/leads/', '/contracts/'],
  'User Management':     ['/user/profile/', '/settings/', '/notifications/'],
  'Core Dashboard':      ['/dashboard/'],
  'API & Export':        ['/api/export/'],
  'Calendar & Help':     ['/calendar/', '/help/'],
};

export function utaCatOf(path) {
  for (const [cat, ps] of Object.entries(UTA_CATS)) {
    if (ps.includes(path)) return cat;
  }
  return 'Other';
}

// Groups excluded from group charts
export const UTA_EXCL = ['Client', 'Controller'];

// Chart colour palette
export const UTA_PRO = [
  '#c2410c', '#ea580c', '#f97316', '#fdba74',
  '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#1e293b', '#7c3aed',
];