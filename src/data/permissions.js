/**
 * permissions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for every role and its nav/page permissions.
 * Derived 1-to-1 from base.html / base_2.html Django template logic.
 *
 * HOW TO USE
 *   import { ROLES, MOCK_USERS, getUserRole, getMenusForRole } from './permissions';
 *
 * ROLES (group names exactly as in Django)
 *   Admin | Developer | TeamMember | Uploader | SalesOperation
 *   Manager | Sales | SalesHead | Viewer
 *
 * SPECIAL FLAGS (mirrors Django)
 *   is_superuser  → sees "Database" item inside Users & Companies (Admin/Dev only)
 *   viewer_pages  → dynamic per-Viewer set of allowed pages
 *                   keys: "top" | "masterplans" | "catalog" | "inv_report" | "SPA"
 *
 * HIDDEN USER
 *   email === "test@prometheus.com.eg" → navbar is NOT rendered at all (base.html line 558)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Role constants ───────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:          'Admin',
  DEVELOPER:      'Developer',
  TEAM_MEMBER:    'TeamMember',
  UPLOADER:       'Uploader',
  SALES_OPERATION:'SalesOperation',
  MANAGER:        'Manager',
  SALES:          'Sales',
  SALES_HEAD:     'SalesHead',
  VIEWER:         'Viewer',
};

// ─── Nav menu definitions per role ───────────────────────────────────────────
// Each entry mirrors the exact links shown in the Django templates.
// `items: null` means the link is a flat anchor (no dropdown).

const MENUS = {

  [ROLES.ADMIN]: [
    {
      label: 'Sales',
      items: [
        { label: 'TOP',           to: '/top' },
        { label: 'Masterplans',   to: '/masterplans' },
        { label: 'Catalog',       to: '/cataloge' },
        { label: 'Approvals Demo',to: '/approvals-demo' },
      ],
    },
    {
      label: 'Projects',
      items: [
        { label: 'Manage Projects',    to: '/manage-projects' },
        { label: 'Masterplan Settings',to: '/masterplans-settings' },
        { label: 'Payments Input',     to: '/dual-payments' },
        { label: 'Special Offer Input',to: '/special-offer-input' },
        { label: 'Max Dicount Variables', to: '/variable-discount-rate' },
        { label: 'Web Configurations', to: '/web-configurations' },
      ],
    },
    {
      label: 'Inventory',
      items: [
        { label: 'Inventory Hub',   to: '/inventory-hub' },
        { label: 'Manage Inventory',to: '/manage-inventory' },
        { label: 'Unit Brochure',   to: '/unit-brochure-manager' },
        { label: 'Cancellation',    to: '/cancellation' },
      ],
    },
    {
      label: 'Reports',
      items: [
        { label: 'Inventory Report',         to: '/inventory-report' },
        { label: 'Sales Performance Analysis',to: '/sales-analysis' },
        { label: 'Customized Report',         to: '/customized-report' },
        { label: 'Sales Team Performance',    to: '/sales-team-performance' },
        { label: 'Approvals History',         to: '/approvals-history' },
      ],
    },
    {
      label: 'Market Research',
      items: [
        { label: 'Master Data',    to: '/master-data' },
        { label: 'Units Data',     to: '/units-data' },
        { label: 'Team Performance',to: '/team-performance' },
        { label: 'Manager Analysis',to: '/manager-analysis' },
        { label: 'Market Explorer', to: '/market-explorer' },
        { label: 'Market Map View', to: '/market-map-view' },
      ],
    },
    {
      label: 'Users & Companies',
      // "Database" item is injected dynamically for is_superuser — see getMenusForRole()
      items: [
        { label: 'Manage Users',    to: '/manage-users' },
        { label: 'Manage Companies',to: '/manage-companies' },
        { label: 'Attendance Sheet',to: '/attendance-sheet' },
        { label: 'Google Sheets',   to: '/google-sheets' },
        // { label: 'Database', to: '/database' } ,
        { label: 'User Traffic Analysis', to: '/user-traffic-analysis' } 
      ],
    },
  ],

  // Developer has identical nav to Admin
  [ROLES.DEVELOPER]: null, // resolved to ADMIN in getMenusForRole()

  [ROLES.TEAM_MEMBER]: [
    {
      label: 'Sales',
      items: [
        { label: 'TOP',          to: '/top' },
        { label: 'Masterplans',  to: '/masterplans' },
        { label: 'Catalog',      to: '/cataloge' },
      ],
    },
    {
      label: 'Projects',
      items: [
        { label: 'Manage Projects',    to: '/manage-projects' },
        { label: 'Masterplan Settings',to: '/masterplans-settings' },
        { label: 'Payments Input',     to: '/dual-payments' },
        { label: 'Special Offer Input',to: '/special-offer-input' },
        { label: 'Web Configurations', to: '/web-configurations' },
      ],
    },
    {
      label: 'Inventory',
      items: [
        { label: 'Inventory Hub',   to: '/inventory-hub' },
        { label: 'Manage Inventory',to: '/manage-inventory' },
        { label: 'Analysis',        to: '/customized-report' },
        { label: 'Unit Brochure',   to: '/unit-brochure-manager' },
        { label: 'Cancellation',    to: '/cancellation' },
      ],
    },
    {
      label: 'Reports',
      items: [
        { label: 'Inventory Report',          to: '/inventory-report' },
        { label: 'Sales Performance Analysis', to: '/sales-analysis' },
        { label: 'Sales Team Performance',     to: '/sales-team-performance' },
        { label: 'Pricing Model',              to: '/pricing-model' },
      ],
    },
    {
      label: 'Market Research',
      items: [
        { label: 'Master Data',    to: '/master-data' },
        { label: 'Units Data',     to: '/units-data' },
        { label: 'Market Explorer',to: '/market-explorer' },
        { label: 'Market Map View',to: '/market-map-view' },
      ],
    },
    {
      label: 'Attendance',
      items: [
        { label: 'Attendance', to: '/attendance-sheet' },
      ],
    },
  ],

  [ROLES.UPLOADER]: [
    {
      label: 'Projects',
      items: [
        { label: 'Manage Projects',    to: '/manage-projects' },
        { label: 'Masterplan Settings',to: '/masterplans-settings' },
        { label: 'Payments Input',     to: '/dual-payments' },
        { label: 'Special Offer Input',to: '/special-offer-input' },
        { label: 'Max Dicount Variables', to: '/variable-discount-rate' },
        { label: 'Web Configurations', to: '/web-configurations' },
      ],
    },
    {
      label: 'Inventory',
      items: [
        { label: 'Inventory Hub',   to: '/inventory-hub' },
        { label: 'Manage Inventory',to: '/manage-inventory' },
        { label: 'Analysis',        to: '/customized-report' },
        { label: 'Unit Brochure',   to: '/unit-brochure-manager' },
        { label: 'Cancellation',    to: '/cancellation' },
      ],
    },
  ],

  [ROLES.SALES_OPERATION]: [
    // Flat links — no dropdowns
    { label: 'Sales Requests', to: '/sales-requests', flat: true },
    { label: 'Inventory',      to: '/manage-inventory', flat: true },
    { label: 'Cancellation',   to: '/cancellation', flat: true },
  ],

  [ROLES.MANAGER]: [
    {
      label: 'Sales',
      items: [
        { label: 'TOP',        to: '/top' },
        { label: 'Masterplans',to: '/masterplans' },
        { label: 'Catalog',    to: '/cataloge' },
      ],
    },
    {
      label: 'Reports',
      items: [
        { label: 'Inventory Report',          to: '/inventory-report' },
        { label: 'Sales Performance Analysis', to: '/sales-analysis' },
        { label: 'Sales Team Performance',     to: '/sales-team-performance' },
        { label: 'Customized Report',          to: '/customized-report' },
        { label: 'Required Reports',           to: '/required-reports' },
        { label: 'Approvals History',          to: '/approvals-history' },
      ],
    },
  ],

  [ROLES.SALES]: [
    // Flat links
    { label: 'TOP',        to: '/top',              flat: true },
    { label: 'Masterplans',to: '/masterplans',      flat: true },
    { label: 'Catalog',    to: '/cataloge',          flat: true },
    { label: 'History',    to: '/approvals-history', flat: true },
  ],

  [ROLES.SALES_HEAD]: [
    // Flat links
    { label: 'TOP',             to: '/top',                flat: true },
    { label: 'Masterplans',     to: '/masterplans',        flat: true },
    { label: 'Catalog',         to: '/cataloge',            flat: true },
    { label: 'History',         to: '/approvals-history',   flat: true },
    { label: 'Team Performance',to: '/sales-team-performance', flat: true },
  ],

  /**
   * Viewer nav is dynamic — pages are filtered at runtime by viewer_pages.
   * getMenusForRole() accepts an optional `viewerPages` array of page keys.
   * Possible keys: "top" | "masterplans" | "catalog" | "inv_report" | "SPA"
   */
  [ROLES.VIEWER]: 'DYNAMIC',
};

// ─── Viewer page map ──────────────────────────────────────────────────────────
const VIEWER_PAGE_MAP = [
  { key: 'top',        label: 'TOP',                         to: '/top',              flat: true },
  { key: 'masterplans',label: 'Masterplans',                 to: '/masterplans',      flat: true },
  { key: 'catalog',    label: 'Catalog',                     to: '/cataloge',          flat: true },
  { key: 'inv_report', label: 'Inventory Report',            to: '/inventory-report', flat: true },
  { key: 'SPA',        label: 'Sales Performance Analysis',  to: '/sales-analysis',   flat: true },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the resolved menu array for a given role.
 *
 * @param {string}   role         - One of the ROLES values
 * @param {object}   [opts]
 * @param {boolean}  [opts.isSuperuser=false]   - Adds "Database" to Users & Companies
 * @param {string[]} [opts.viewerPages=[]]       - Page keys for Viewer role
 * @returns {Array}  Menu entries
 */
export function getMenusForRole(role, { isSuperuser = false, viewerPages = [] } = {}) {
  // Developer mirrors Admin
  const effectiveRole = role === ROLES.DEVELOPER ? ROLES.ADMIN : role;

  if (effectiveRole === ROLES.VIEWER) {
    return VIEWER_PAGE_MAP.filter(p => viewerPages.includes(p.key));
  }

  const menus = MENUS[effectiveRole];
  if (!menus) return [];

  // Clone so we don't mutate the constant
  const result = menus.map(m =>
    m.items ? { ...m, items: [...m.items] } : { ...m }
  );

  // Superuser: inject Database link into Users & Companies
  if (isSuperuser && (role === ROLES.ADMIN || role === ROLES.DEVELOPER)) {
    const uac = result.find(m => m.label === 'Users & Companies');
    if (uac) uac.items.push({ label: 'Database', to: '/database' });
  }

  return result;
}

/**
 * Roles that render a flat nav bar (no hamburger grouping wrapper).
 * Mirrors `"Sales" not in user_groups …` container class logic.
 */
export const SLIM_NAV_ROLES = [ROLES.SALES, ROLES.SALES_HEAD, ROLES.VIEWER, ROLES.MANAGER];

/**
 * Returns true if the navbar should be hidden entirely for this user.
 * (base.html line 558: test@prometheus.com.eg has no navbar.)
 */
export function shouldHideNavbar(email) {
  return email === 'test@prometheus.com.eg';
}

// ─── Mock users for testing ───────────────────────────────────────────────────
/**
 * One account per role.
 * In your React app, on login success swap out the real API response
 * with one of these objects (or wire them to a mock auth endpoint).
 *
 * Shape expected by the rest of the app:
 * {
 *   id, name, email, role,
 *   isSuperuser,       // only Admin/Developer
 *   viewerPages,       // only Viewer
 *   company_id,        // bound roles only (non-Admin/Developer)
 *                      // Admin/Developer have no company_id — they pick via selector
 * }
 */
export const MOCK_USERS = [
  {
    // Admin — unbound: sees company selector, no company_id
    id: 1,
    name: 'Reem Admin',
    email: 'admin@prometheus.test',
    password: 'Admin123!',
    role: ROLES.ADMIN,
    isSuperuser: true,
    viewerPages: [],
  },
  {
    // Developer — unbound: sees company selector, no company_id
    id: 2,
    name: 'Reem Developer',
    email: 'developer@prometheus.test',
    password: 'Dev123!',
    role: ROLES.DEVELOPER,
    isSuperuser: false,
    viewerPages: [],
  },
  {
    // TeamMember — bound to company 1 (Mint / Golden Hills)
    id: 3,
    name: 'Reem TeamMember',
    email: 'team@prometheus.test',
    password: 'Team123!',
    role: ROLES.TEAM_MEMBER,
    isSuperuser: false,
    viewerPages: [],
    company_id: 1,
  },
  {
    // Uploader — bound to company 1 (Mint / Golden Hills)
    id: 4,
    name: 'Reem Uploader',
    email: 'uploader@prometheus.test',
    password: 'Upload123!',
    role: ROLES.UPLOADER,
    isSuperuser: false,
    viewerPages: [],
    company_id: 1,
  },
  {
    // SalesOperation — bound to company 2 (Palmier / Skyline Towers)
    id: 5,
    name: 'Reem Operation',
    email: 'salesop@prometheus.test',
    password: 'SalesOp123!',
    role: ROLES.SALES_OPERATION,
    isSuperuser: false,
    viewerPages: [],
    company_id: 2,
  },
  {
    // Manager — bound to company 1 (Mint / Golden Hills)
    id: 6,
    name: 'Reem Manager',
    email: 'manager@prometheus.test',
    password: 'Manager123!',
    role: ROLES.MANAGER,
    isSuperuser: false,
    viewerPages: [],
    company_id: 1,
  },
  {
    // Sales — bound to company 2 (Palmier / Skyline Towers)
    id: 7,
    name: 'Reem Sales',
    email: 'sales@prometheus.test',
    password: 'Sales123!',
    role: ROLES.SALES,
    isSuperuser: false,
    viewerPages: [],
    company_id: 2,
  },
  {
    // SalesHead — bound to company 2 (Palmier / Skyline Towers)
    id: 8,
    name: 'Reem SalesHead',
    email: 'saleshead@prometheus.test',
    password: 'SalesHead123!',
    role: ROLES.SALES_HEAD,
    isSuperuser: false,
    viewerPages: [],
    company_id: 2,
  },
  {
    // Viewer — bound to company 3 (IGI / Blue Lagoon)
    id: 9,
    name: 'Reem Viewer',
    email: 'viewer@prometheus.test',
    password: 'Viewer123!',
    role: ROLES.VIEWER,
    isSuperuser: false,
    // This viewer can see TOP, Masterplans, Catalog, and Inventory Report.
    // SPA is intentionally omitted to demonstrate partial Viewer access.
    viewerPages: ['top', 'masterplans', 'catalog', 'inv_report'],
    company_id: 3,
  },
  {
    // Special hidden-navbar account (no nav rendered — base.html line 558)
    id: 10,
    name: 'Reem User',
    email: 'test@prometheus.com.eg',
    password: 'Test123!',
    role: ROLES.VIEWER,
    isSuperuser: false,
    viewerPages: [],
    company_id: 3,
  },
];

/**
 * Mock login helper — call this instead of a real API during development.
 * Returns the user object on success, or throws on bad credentials.
 *
 * @param {string} email
 * @param {string} password
 * @returns {object} user
 */
export function mockLogin(email, password) {
  const user = MOCK_USERS.find(
    u => u.email === email && u.password === password
  );
  if (!user) throw new Error('Invalid email or password.');
  return user;
}