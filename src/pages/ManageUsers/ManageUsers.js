import React, { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "./ManageUsers.css";
import { COMPANIES, INITIAL_USERS } from "../../data/ManageUsersData";

const COMPANY_NAMES = ["Mint", "Palmier Developments", "IGI Developments"];

const VIEW = {
  COMPANIES: "companies",
  ADMIN_BT: "admin_bt",
};

function cleanRole(value) {
  return (value || "").replace(/\s+/g, "").toLowerCase();
}

function canonicalRole(role) {
  const r = cleanRole(role);

  if (r === "admin") return "Admin";
  if (r === "developer") return "Developer";
  if (r === "businessteam") return "BusinessTeam";
  if (r === "companyuser") return "CompanyUser";
  if (r === "companycontroller") return "CompanyController";
  if (r === "financemanager") return "Finance Manager";
  if (r === "manager") return "Manager";

  return (role || "").trim();
}

function displayRole(role) {
  const canon = canonicalRole(role);

  if (canon === "BusinessTeam") return "Business Team";
  if (canon === "CompanyUser") return "Company User";
  if (canon === "CompanyController") return "Company Controller";
  if (canon === "Finance Manager") return "Finance Manager";

  const spaced = String(canon)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return spaced
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// --- Fake API (swap later with real requests) ---
function mockRequest(ok = true, delayMs = 250) {
  return new Promise((resolve, reject) => {
    setTimeout(
      () => (ok ? resolve({ ok: true }) : reject(new Error("Mock error"))),
      delayMs
    );
  });
}

function UserDetailsModal({
  open,
  onClose,
  user,
  view,
  roleGroup,
  rolesConfig,
  updateDraft,
  onSaveClick,
  onFieldCommit,
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !user) return null;

  const cfg = rolesConfig(roleGroup, view);

  const showCompany = cfg.showCompanyCol;
  const showJobTitle = cfg.showJobTitleCol;
  const showCanEdit = cfg.showCanEditCols;
  const showCanChangeYears = cfg.showCanEditCols;

  const adminAlwaysActive = cfg.adminAlwaysActive;

  return (
    <div
      className="mu-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div className="mu-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mu-modal-header">
          <div className="mu-modal-title">User Details</div>
          <button
            className="mu-modal-x"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mu-modal-body">
          <div className="mu-form-grid">
            <label className="mu-label">
              Full Name
              <input
                className="mu-field"
                value={user.full_name || ""}
                onChange={(e) => updateDraft({ full_name: e.target.value })}
                onBlur={(e) =>
                  onFieldCommit("full_name", "Name", e.target.value)
                }
              />
            </label>

            <label className="mu-label">
              Email
              <input
                className="mu-field"
                value={user.email || ""}
                onChange={(e) => updateDraft({ email: e.target.value })}
                onBlur={(e) => onFieldCommit("email", "Email", e.target.value)}
              />
            </label>

            <label className="mu-label">
              New Password
              <input
                className="mu-field"
                placeholder="New Password"
                value={user.passwordDraft || ""}
                onChange={(e) => updateDraft({ passwordDraft: e.target.value })}
              />
              <div className="mu-hint">
                Password is applied only when you press Save.
              </div>
            </label>

            <label className="mu-label">
              Role
              <input
                className="mu-field"
                value={displayRole(user.role)}
                disabled
              />
            </label>

            <label className="mu-label mu-label-inline">
              Active
              <input
                type="checkbox"
                checked={adminAlwaysActive ? true : !!user.is_active}
                disabled={adminAlwaysActive || !!user.is_superuser}
                onChange={(e) => {
                  updateDraft({ is_active: e.target.checked });
                  onFieldCommit("is_active", "Active", e.target.checked);
                }}
              />
            </label>

            {showCanEdit ? (
              <label className="mu-label mu-label-inline">
                Can Edit
                {canonicalRole(user.role) === "CompanyUser" ? (
                  <input
                    type="checkbox"
                    checked={!!user.can_edit}
                    onChange={(e) => {
                      updateDraft({ can_edit: e.target.checked });
                      onFieldCommit("can_edit", "Can Edit", e.target.checked);
                    }}
                  />
                ) : (
                  <span className="mu-dash">—</span>
                )}
              </label>
            ) : null}

            {showCanChangeYears ? (
              <label className="mu-label mu-label-inline">
                Can Change Years
                {canonicalRole(user.role) === "CompanyUser" ? (
                  <input
                    type="checkbox"
                    checked={!!user.can_change_years}
                    onChange={(e) => {
                      updateDraft({ can_change_years: e.target.checked });
                      onFieldCommit(
                        "can_change_years",
                        "Can Change Years",
                        e.target.checked
                      );
                    }}
                  />
                ) : (
                  <span className="mu-dash">—</span>
                )}
              </label>
            ) : null}

            {showCompany ? (
              <label className="mu-label">
                Company
                <select
                  className="mu-field"
                  value={user.company?.name || ""}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    const companyObj = COMPANIES.find(
                      (c) => c.name === nextName
                    ) || { id: "", name: nextName };

                    updateDraft({ company: companyObj });
                    onFieldCommit("companyName", "Company", nextName);
                  }}
                >
                  <option value="">Select company</option>
                  {COMPANY_NAMES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {showJobTitle ? (
              <label className="mu-label">
                Job Title
                <input
                  className="mu-field"
                  value={user.job_title || ""}
                  onChange={(e) => updateDraft({ job_title: e.target.value })}
                  onBlur={(e) =>
                    onFieldCommit("job_title", "Job Title", e.target.value)
                  }
                />
              </label>
            ) : null}
          </div>
        </div>

        <div className="mu-modal-footer">
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary muu-save"
            type="button"
            onClick={onSaveClick}
          >
            <i className="fas fa-save" style={{ marginRight: 6 }}></i> Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageUsers() {
  const [users, setUsers] = useState(INITIAL_USERS);

  const [view, setView] = useState(VIEW.COMPANIES);

  const [searchName, setSearchName] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchRole, setSearchRole] = useState("");

  const [collapsed, setCollapsed] = useState({});

  const [isMobile, setIsMobile] = useState(false);
  const [details, setDetails] = useState({
    open: false,
    userId: null,
    roleGroup: null,
  });

  const lastValuesRef = useRef(
    Object.fromEntries(
      INITIAL_USERS.map((u) => [
        u.id,
        {
          full_name: u.full_name || "",
          email: u.email || "",
          is_active: !!u.is_active,
          can_edit: !!u.can_edit,
          can_change_years: !!u.can_change_years,
          companyName: u.company?.name || "",
          job_title: u.job_title || "",
        },
      ])
    )
  );

  const navigate = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // SweetAlert defaults: click outside + ESC close [web:188]
  const swalFire = (opts) =>
    Swal.fire({
      allowOutsideClick: true,
      allowEscapeKey: true,
      ...opts,
    });

  function resetFiltersAndCollapse(nextView) {
    setView(nextView);
    setSearchName("");
    setSearchCompany("");
    setSearchRole("");
    setCollapsed({});
    setDetails({ open: false, userId: null, roleGroup: null });
  }

  function updateUser(userId, patch) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...patch } : u))
    );
  }

  function toastEdit(fieldLabel, oldVal, newVal) {
    const isBool = typeof newVal === "boolean";
    const oldText = isBool
      ? oldVal
        ? "Enabled"
        : "Disabled"
      : String(oldVal ?? "");
    const newText = isBool
      ? newVal
        ? "Enabled"
        : "Disabled"
      : String(newVal ?? "");

    return swalFire({
      icon: "success",
      title: `${fieldLabel} updated`,
      text: `${oldText} → ${newText}`,
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#f59e0b",
    });
  }

  async function triggerAjaxSave(userId, opts = { includePassword: false }) {
    const u = users.find((x) => x.id === userId);
    if (!u) return;

    const roleCanon = canonicalRole(u.role);
    const isAdmin = roleCanon === "Admin";

    const payload = {
      action: "save",
      user_id: u.id,
      full_name: u.full_name,
      email: u.email,
      password: opts.includePassword ? u.passwordDraft || "" : "",
      is_active: isAdmin ? true : !!u.is_active,
      can_edit: !!u.can_edit,
      can_change_years: !!u.can_change_years,
      role: roleCanon,
      company_id: u.company?.id || "",
      job_title: u.job_title || "",
    };

    try {
      await mockRequest(true);
      return payload;
    } catch {
      await swalFire({
        icon: "error",
        title: "Error",
        text: "Connection error. Could not save.",
      });
      return null;
    }
  }

  async function onFieldCommit(userId, fieldKey, fieldLabel, newValue) {
    const prev = lastValuesRef.current[userId]?.[fieldKey];

    const changed =
      typeof newValue === "string"
        ? (prev ?? "") !== newValue
        : Boolean(prev) !== Boolean(newValue);

    if (!changed) return;

    await toastEdit(fieldLabel, prev, newValue);
    lastValuesRef.current[userId] = {
      ...lastValuesRef.current[userId],
      [fieldKey]: newValue,
    };

    await triggerAjaxSave(userId, { includePassword: false });
  }

  const COMPANY_ROLES = useMemo(
    () =>
      new Set([
        "CompanyUser",
        "CompanyController",
        "Finance Manager",
        "Manager",
      ]),
    []
  );

  const PROMETHEUS_ROLES = useMemo(
    () => new Set(["Admin", "BusinessTeam", "Developer"]),
    []
  );

  const companiesUsers = useMemo(
    () => users.filter((u) => COMPANY_ROLES.has(canonicalRole(u.role))),
    [users, COMPANY_ROLES]
  );

  const adminBtUsers = useMemo(
    () => users.filter((u) => PROMETHEUS_ROLES.has(canonicalRole(u.role))),
    [users, PROMETHEUS_ROLES]
  );

  const filtered = useMemo(() => {
    const nameF = (searchName || "").toLowerCase().trim();
    const roleF = cleanRole(searchRole || "");
    const companyF = (searchCompany || "").toLowerCase();

    const base = view === VIEW.COMPANIES ? companiesUsers : adminBtUsers;

    return base.filter((u) => {
      const nm = (u.full_name || "").toLowerCase();
      const rl = cleanRole(canonicalRole(u.role));
      const comp = (u.company?.name || "").toLowerCase();

      const matchName = nm.includes(nameF);
      const matchRole = !roleF || rl === roleF;
      const matchCompany =
        view !== VIEW.COMPANIES || !companyF || comp === companyF;

      return matchName && matchRole && matchCompany;
    });
  }, [
    view,
    companiesUsers,
    adminBtUsers,
    searchName,
    searchRole,
    searchCompany,
  ]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const u of filtered) {
      const key = canonicalRole(u.role) || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(u);
    }

    const entries = Array.from(map.entries());
    const orderCompanies = [
      "CompanyUser",
      "CompanyController",
      "Finance Manager",
      "Manager",
    ];
    const orderPrometheus = ["Admin", "BusinessTeam", "Developer"];
    const order = view === VIEW.COMPANIES ? orderCompanies : orderPrometheus;

    return entries.sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      const ax = ai === -1 ? 999 : ai;
      const bx = bi === -1 ? 999 : bi;
      if (ax !== bx) return ax - bx;
      return a[0].localeCompare(b[0]);
    });
  }, [filtered, view]);

  function toggleRole(role) {
    const current = collapsed[role] ?? true; // default closed
    setCollapsed((prev) => ({ ...prev, [role]: !current }));
  }

  const rolesInThisView = useMemo(() => {
    return view === VIEW.COMPANIES
      ? ["CompanyUser", "CompanyController", "Finance Manager", "Manager"]
      : ["Admin", "BusinessTeam", "Developer"];
  }, [view]);

  function rolesConfig(roleGroup, currentView) {
    const isCompaniesView = currentView === VIEW.COMPANIES;
    const isPrometheusView = currentView === VIEW.ADMIN_BT;

    const isAdminGroup = roleGroup === "Admin";
    const isBusinessTeamGroup = roleGroup === "BusinessTeam";

    return {
      showCanEditCols: isCompaniesView && roleGroup === "CompanyUser",
      showCompanyCol: isCompaniesView,
      showJobTitleCol: isPrometheusView && isBusinessTeamGroup,
      adminAlwaysActive: isAdminGroup,
    };
  }

  async function handleSaveIcon(u) {
    const hasPassword = (u.passwordDraft || "").trim().length > 0;

    if (hasPassword) {
      await swalFire({
        icon: "success",
        title: "Password updated",
        text: `Password for "${u.full_name}" has been changed.`,
        showConfirmButton: true,
        confirmButtonText: "OK",
        confirmButtonColor: "#f59e0b",
      });
    }

    const res = await triggerAjaxSave(u.id, { includePassword: hasPassword });

    if (res && hasPassword) {
      updateUser(u.id, { passwordDraft: "" });
    }
  }

  async function handleDelete(u) {
    const res = await swalFire({
      icon: "warning",
      title: "Confirm Deletion",
      text: `Delete user "${u.full_name}"?`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#b23b2a",
      cancelButtonText: "Cancel",
    });

    if (!res.isConfirmed) return;

    await mockRequest(true);
    setUsers((prev) => prev.filter((x) => x.id !== u.id));

    await swalFire({
      icon: "success",
      title: "Deleted",
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#f59e0b",
    });
  }

  function openDetails(userId, roleGroup) {
    setDetails({ open: true, userId, roleGroup });
  }

  function closeDetails() {
    setDetails({ open: false, userId: null, roleGroup: null });
  }

  const detailsUser = details.userId
    ? users.find((x) => x.id === details.userId)
    : null;

  // NEW: bulk activate/deactivate for selected company in Companies view
  async function bulkSetActiveForSelectedCompany(nextActive) {
    if (view !== VIEW.COMPANIES) return;
    if (!searchCompany) return;

    const label = nextActive ? "Activate All Sales" : "Deactivate All Sales";

    const res = await swalFire({
      icon: "warning",
      title: label,
      text: `Apply this to all users in "${searchCompany}"?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      confirmButtonColor: "#f59e0b",
      cancelButtonText: "Cancel",
    });

    if (!res.isConfirmed) return;

    setUsers((prev) =>
      prev.map((u) => {
        const isCompaniesRole = COMPANY_ROLES.has(canonicalRole(u.role));
        const sameCompany =
          (u.company?.name || "").toLowerCase() ===
          (searchCompany || "").toLowerCase();

        if (isCompaniesRole && sameCompany && !u.is_superuser) {
          return { ...u, is_active: nextActive };
        }
        return u;
      })
    );

    await swalFire({
      icon: "success",
      title: "Updated",
      text: `All users in "${searchCompany}" set to ${
        nextActive ? "Active" : "Inactive"
      }.`,
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#f59e0b",
    });
  }

  return (
    <div className="lux-page">
      {/* Top switch + create user */}
      <div className="lux-topbar">
        <div className="lux-title">Manage Users</div>

        <div className="lux-topbar-right">
          {/* <button type="button" className="lux-create-btn" onClick={() => navigate("/users/create")}>
            <i className="fas fa-user-plus"></i>
            <span className="lux-create-text">Create User</span>
          </button> */}
          <button
            type="button"
            className="lux-create-btn"
            onClick={() =>
              navigate("/users/create", { state: { fromView: view } })
            }
          >
            <i className="fas fa-user-plus"></i>
            <span className="lux-create-text">Create User</span>
          </button>

          <div className="lux-switch">
            <button
              type="button"
              className={view === VIEW.COMPANIES ? "lux-tab active" : "lux-tab"}
              onClick={() => resetFiltersAndCollapse(VIEW.COMPANIES)}
            >
              Companies
            </button>

            <button
              type="button"
              className={view === VIEW.ADMIN_BT ? "lux-tab active" : "lux-tab"}
              onClick={() => resetFiltersAndCollapse(VIEW.ADMIN_BT)}
            >
              Prometheus
            </button>
          </div>
        </div>
      </div>

      {/* Filters + NEW bulk actions */}
      <div className="lux-filters">
        <input
          className="lux-input"
          placeholder="Search Name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

        {view === VIEW.COMPANIES ? (
          <>
            <select
              className="lux-input"
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
            >
              <option value="">All Companies</option>
              {COMPANIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {searchCompany ? (
              <div className="lux-bulk-actions">
                <button
                  type="button"
                  className="lux-bulk-btn activate"
                  onClick={() => bulkSetActiveForSelectedCompany(true)}
                >
                  <i className="fas fa-toggle-on"></i>
                  <span>Activate All Sales</span>
                </button>

                <button
                  type="button"
                  className="lux-bulk-btn deactivate"
                  onClick={() => bulkSetActiveForSelectedCompany(false)}
                >
                  <i className="fas fa-toggle-off"></i>
                  <span>Deactivate All Sales</span>
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        <select
          className="lux-input"
          value={searchRole}
          onChange={(e) => setSearchRole(e.target.value)}
        >
          <option value="">All Roles</option>
          {rolesInThisView.map((r) => (
            <option key={r} value={r}>
              {displayRole(r)}
            </option>
          ))}
        </select>
      </div>

      {/* Collapsible grouped tables */}
      <div className="lux-groups">
        {grouped.map(([role, roleUsers]) => {
          const cfg = rolesConfig(role, view);
          const isCollapsed = collapsed[role] ?? true;

          return (
            <div className="lux-group" key={role}>
              <button
                type="button"
                className="lux-group-header"
                onClick={() => toggleRole(role)}
              >
                <span className="lux-group-role">{displayRole(role)}</span>
                <span className="lux-group-meta">
                  {roleUsers.length} user{roleUsers.length === 1 ? "" : "s"}
                </span>
              </button>

              {!isCollapsed ? (
                <div className="lux-tablewrap">
                  {/* Mobile list */}
                  {isMobile ? (
                    <div className="mu-mobile-list">
                      {roleUsers.map((u) => (
                        <div className="mu-mobile-item" key={u.id}>
                          <div className="mu-mobile-main">
                            <div className="mu-mobile-name-text">
                              {u.full_name || "—"}
                            </div>

                            <button
                              className="mu-more-icon"
                              type="button"
                              onClick={() => openDetails(u.id, role)}
                              title="Edit"
                              aria-label="Edit"
                            >
                              <i className="fas fa-pen-to-square"></i>
                            </button>
                          </div>

                          <div className="mu-mobile-actions">
                            <button
                              type="button"
                              className="btn btn-sm lux-btn danger"
                              disabled={!!u.is_superuser}
                              title="Delete"
                              onClick={() => handleDelete(u)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm lux-btn warn"
                              disabled={!!u.is_superuser}
                              title="Login as"
                              onClick={() =>
                                swalFire({
                                  icon: "info",
                                  title: "Login as (mock)",
                                  text: `Logged in as "${u.full_name}".`,
                                  showConfirmButton: true,
                                  confirmButtonText: "OK",
                                  confirmButtonColor: "#f59e0b",
                                })
                              }
                            >
                              <i className="fas fa-sign-in-alt"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Desktop table
                    <div className="lux-scroll">
                      <table className="lux-table">
                        <thead>
                          <tr>
                            <th className="sticky-col">Full Name</th>
                            <th>Email</th>
                            <th>Password</th>
                            <th>Role</th>
                            <th>Active</th>

                            {cfg.showCanEditCols ? <th>Can Edit</th> : null}
                            {cfg.showCanEditCols ? (
                              <th>Can Change Years</th>
                            ) : null}

                            {cfg.showCompanyCol ? <th>Company</th> : null}
                            {cfg.showJobTitleCol ? <th>Job Title</th> : null}

                            <th>Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {roleUsers.map((u) => {
                            const roleCanon = canonicalRole(u.role);
                            const adminAlwaysActive = roleCanon === "Admin";

                            return (
                              <tr key={u.id}>
                                <td
                                  className="sticky-col"
                                  data-label="Full Name"
                                >
                                  <input
                                    className="lux-cell-input"
                                    value={u.full_name || ""}
                                    onChange={(e) =>
                                      updateUser(u.id, {
                                        full_name: e.target.value,
                                      })
                                    }
                                    onBlur={(e) =>
                                      onFieldCommit(
                                        u.id,
                                        "full_name",
                                        "Name",
                                        e.target.value
                                      )
                                    }
                                  />
                                </td>

                                <td data-label="Email">
                                  <input
                                    className="lux-cell-input"
                                    value={u.email || ""}
                                    onChange={(e) =>
                                      updateUser(u.id, {
                                        email: e.target.value,
                                      })
                                    }
                                    onBlur={(e) =>
                                      onFieldCommit(
                                        u.id,
                                        "email",
                                        "Email",
                                        e.target.value
                                      )
                                    }
                                  />
                                </td>

                                <td data-label="Password">
                                  <input
                                    className="lux-cell-input password-input"
                                    placeholder="New Password"
                                    value={u.passwordDraft || ""}
                                    onChange={(e) =>
                                      updateUser(u.id, {
                                        passwordDraft: e.target.value,
                                      })
                                    }
                                  />
                                </td>

                                <td data-label="Role">
                                  <span className="lux-pill">
                                    {displayRole(u.role)}
                                  </span>
                                </td>

                                <td data-label="Active">
                                  {adminAlwaysActive ? (
                                    <input
                                      type="checkbox"
                                      checked={true}
                                      disabled
                                    />
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={!!u.is_active}
                                      disabled={!!u.is_superuser}
                                      onChange={(e) => {
                                        updateUser(u.id, {
                                          is_active: e.target.checked,
                                        });
                                        onFieldCommit(
                                          u.id,
                                          "is_active",
                                          "Active",
                                          e.target.checked
                                        );
                                      }}
                                    />
                                  )}
                                </td>

                                {cfg.showCanEditCols ? (
                                  <td data-label="Can Edit">
                                    {canonicalRole(u.role) === "CompanyUser" ? (
                                      <input
                                        type="checkbox"
                                        checked={!!u.can_edit}
                                        onChange={(e) => {
                                          updateUser(u.id, {
                                            can_edit: e.target.checked,
                                          });
                                          onFieldCommit(
                                            u.id,
                                            "can_edit",
                                            "Can Edit",
                                            e.target.checked
                                          );
                                        }}
                                      />
                                    ) : (
                                      <span className="lux-dash">—</span>
                                    )}
                                  </td>
                                ) : null}

                                {cfg.showCanEditCols ? (
                                  <td data-label="Can Change Years">
                                    {canonicalRole(u.role) === "CompanyUser" ? (
                                      <input
                                        type="checkbox"
                                        checked={!!u.can_change_years}
                                        onChange={(e) => {
                                          updateUser(u.id, {
                                            can_change_years: e.target.checked,
                                          });
                                          onFieldCommit(
                                            u.id,
                                            "can_change_years",
                                            "Can Change Years",
                                            e.target.checked
                                          );
                                        }}
                                      />
                                    ) : (
                                      <span className="lux-dash">—</span>
                                    )}
                                  </td>
                                ) : null}

                                {cfg.showCompanyCol ? (
                                  <td data-label="Company">
                                    <select
                                      className="lux-cell-select"
                                      value={u.company?.name || ""}
                                      onChange={(e) => {
                                        const nextName = e.target.value;
                                        const companyObj = COMPANIES.find(
                                          (c) => c.name === nextName
                                        ) || {
                                          id: "",
                                          name: nextName,
                                        };

                                        updateUser(u.id, {
                                          company: companyObj,
                                        });
                                        onFieldCommit(
                                          u.id,
                                          "companyName",
                                          "Company",
                                          nextName
                                        );
                                      }}
                                    >
                                      <option value="">Select company</option>
                                      {COMPANY_NAMES.map((n) => (
                                        <option key={n} value={n}>
                                          {n}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                ) : null}

                                {cfg.showJobTitleCol ? (
                                  <td data-label="Job Title">
                                    <input
                                      className="lux-cell-input"
                                      value={u.job_title || ""}
                                      onChange={(e) =>
                                        updateUser(u.id, {
                                          job_title: e.target.value,
                                        })
                                      }
                                      onBlur={(e) =>
                                        onFieldCommit(
                                          u.id,
                                          "job_title",
                                          "Job Title",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                ) : null}

                                <td data-label="Actions">
                                  <button
                                    type="button"
                                    className="btn btn-sm lux-btn"
                                    title="Save"
                                    onClick={() => handleSaveIcon(u)}
                                  >
                                    <i className="fas fa-save"></i>
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-sm lux-btn danger"
                                    disabled={!!u.is_superuser}
                                    title="Delete"
                                    onClick={() => handleDelete(u)}
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-sm lux-btn warn"
                                    disabled={!!u.is_superuser}
                                    title="Login as"
                                    onClick={() =>
                                      swalFire({
                                        icon: "info",
                                        title: "Login as (mock)",
                                        text: `Logged in as "${u.full_name}".`,
                                        showConfirmButton: true,
                                        confirmButtonText: "OK",
                                        confirmButtonColor: "#f59e0b",
                                      })
                                    }
                                  >
                                    <i className="fas fa-sign-in-alt"></i>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Mobile "Show more" modal */}
      <UserDetailsModal
        open={details.open}
        onClose={closeDetails}
        user={detailsUser}
        view={view}
        roleGroup={details.roleGroup}
        rolesConfig={rolesConfig}
        updateDraft={(patch) => {
          if (!detailsUser) return;
          updateUser(detailsUser.id, patch);
        }}
        onFieldCommit={async (fieldKey, label, value) => {
          if (!detailsUser) return;
          await onFieldCommit(detailsUser.id, fieldKey, label, value);
        }}
        onSaveClick={async () => {
          if (!detailsUser) return;
          await handleSaveIcon(detailsUser);
          closeDetails();
        }}
      />
    </div>
  );
}
