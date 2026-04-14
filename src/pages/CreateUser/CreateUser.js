import React, { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useLocation, useNavigate } from "react-router-dom";
import "./createUser.css";
import { COMPANIES } from "../../data/ManageUsersData";

const MODE = {
  COMPANIES: "companies",
  PROMETHEUS: "prometheus",
};

const COMPANY_ROLES = [
  "Company User",
  "Company Controller",
  "Company Manager",
  "Company Finance Manager",
];

const PROMETHEUS_ROLES = ["Admin", "Business Team", "Developer"];

export default function CreateUser() {
  const navigate = useNavigate();
  const location = useLocation();

  const mode = useMemo(() => {
    const fromView = location.state?.fromView;
    return fromView === "companies" ? MODE.COMPANIES : MODE.PROMETHEUS;
  }, [location.state]);

  const swalFire = (opts) =>
    Swal.fire({
      allowOutsideClick: true,
      allowEscapeKey: true,
      ...opts,
    });

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    password: "",
    confirm_password: "",
    role: "",
    companyName: "",
    joining_date: "",

    // Company User permissions (only)
    can_edit: false,
    can_change_years: false,
  });

  const [csvUI, setCsvUI] = useState({ open: false, file: null });

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const roles = mode === MODE.COMPANIES ? COMPANY_ROLES : PROMETHEUS_ROLES;

  const isCompanyMode = mode === MODE.COMPANIES;
  const isPrometheusMode = mode === MODE.PROMETHEUS;

  const isCompanyUser = isCompanyMode && form.role === "Company User";
  const showCompanyDetails = isCompanyMode;

  const showPrometheusBlock =
    isPrometheusMode &&
    (form.role === "Business Team" || form.role === "Developer");

  // CSV only after: Company User + Company selected
  const showCsvImport = isCompanyUser && !!form.companyName;

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function onRoleChange(nextRole) {
    update({ role: nextRole });

    // reset CSV UI when role changes
    setCsvUI({ open: false, file: null });

    // reset CompanyUser-only permissions when leaving Company User
    if (nextRole !== "Company User") {
      update({ can_edit: false, can_change_years: false });
    }

    // if role is not requiring extra block, clear joining_date
    if (!(nextRole === "Business Team" || nextRole === "Developer")) {
      update({ joining_date: "" });
    }
  }

  function onCompanyChange(nextCompanyName) {
    update({ companyName: nextCompanyName });

    // If company changes, close csv panel and reset file
    setCsvUI({ open: false, file: null });
  }

  async function validate() {
    const errors = [];

    const email = form.email.trim();
    const name = form.full_name.trim();
    const pass = form.password;
    const confirm = form.confirm_password;

    if (!email) errors.push("Email is required.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Email format is not correct.");
    }

    if (!name) errors.push("Full Name is required.");
    if (!pass) errors.push("Password is required.");
    if (!confirm) errors.push("Confirm Password is required.");
    if (pass && confirm && pass !== confirm)
      errors.push("Confirm Password must match Password.");

    if (!form.role) errors.push("Role is required.");

    if (mode === MODE.COMPANIES && !form.companyName) {
      errors.push("Company is required for Companies users.");
    }

    if (showPrometheusBlock && !form.joining_date) {
      errors.push("Joining Date is required for this role.");
    }

    if (showCsvImport && csvUI.open && !csvUI.file) {
      errors.push("Please choose a CSV file to import.");
    }

    if (errors.length) {
      await swalFire({
        icon: "error",
        title: "Validation error",
        html: `<div style="text-align:left">${errors
          .map((e) => `• ${e}`)
          .join("<br/>")}</div>`,
        confirmButtonText: "OK",
        confirmButtonColor: "#f59e0b",
      });
      return false;
    }

    return true;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const ok = await validate();
    if (!ok) return;

    // Mock create
    await swalFire({
      icon: "success",
      title: "User created (mock)",
      text: `${form.full_name} (${form.role}) created successfully.`,
      confirmButtonText: "OK",
      confirmButtonColor: "#f59e0b",
    });

    // go back to manage users (adjust if your route differs)
    navigate("/");
  }

  return (
    <div className="lux-page">
      <div className="lux-topbar cu-topbar">
        <div className="lux-title">Create User</div>

        <button
          type="button"
          className="btn btn-secondary back-btn"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <i
            className="fas fa-arrow-left"
            aria-hidden="true"
            style={{ marginRight: 8 }}
          ></i>
          <span className="back-text">Back</span>
        </button>
      </div>

      <div className="lux-group cu-container">
        <div className="lux-tablewrap">
          <div className="cu-subtitle">
            {isCompanyMode
              ? "Create a Companies user and assign role & company."
              : "Create a Prometheus user and assign role."}
          </div>

          <form className="cu-form" onSubmit={onSubmit}>
            {/* Email */}
            <label className="mu-label">
              Email
              <div className="cu-inputwrap">
                <i
                  className="fas fa-envelope cu-lefticon"
                  aria-hidden="true"
                ></i>
                <input
                  id="cu-email"
                  className="mu-field cu-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                  placeholder="Email"
                  required
                />
              </div>
            </label>

            {/* Full Name */}
            <label className="mu-label">
              Full Name
              <div className="cu-inputwrap">
                <i className="fas fa-user cu-lefticon" aria-hidden="true"></i>
                <input
                  id="cu-fullname"
                  className="mu-field cu-input"
                  value={form.full_name}
                  onChange={(e) => update({ full_name: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
            </label>

            {/* Password */}
            <label className="mu-label">
              Password
              <div className="cu-inputwrap">
                <i className="fas fa-lock cu-lefticon" aria-hidden="true"></i>
                <input
                  id="cu-password"
                  className="mu-field cu-input cu-input-rightpad"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update({ password: e.target.value })}
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="cu-eye"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  aria-controls="cu-password"
                  aria-pressed={showPwd ? "true" : "false"}
                  onClick={() => setShowPwd((v) => !v)}
                >
                  <i
                    className={showPwd ? "fas fa-eye-slash" : "fas fa-eye"}
                    aria-hidden="true"
                  ></i>
                </button>
              </div>
            </label>

            {/* Confirm Password */}
            <label className="mu-label">
              Confirm Password
              <div className="cu-inputwrap">
                <i className="fas fa-lock cu-lefticon" aria-hidden="true"></i>
                <input
                  id="cu-confirm"
                  className="mu-field cu-input cu-input-rightpad"
                  type={showConfirmPwd ? "text" : "password"}
                  value={form.confirm_password}
                  onChange={(e) => update({ confirm_password: e.target.value })}
                  placeholder="Confirm Password"
                />
                <button
                  type="button"
                  className="cu-eye"
                  aria-label={
                    showConfirmPwd
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  aria-controls="cu-confirm"
                  aria-pressed={showConfirmPwd ? "true" : "false"}
                  onClick={() => setShowConfirmPwd((v) => !v)}
                >
                  <i
                    className={
                      showConfirmPwd ? "fas fa-eye-slash" : "fas fa-eye"
                    }
                    aria-hidden="true"
                  ></i>
                </button>
              </div>
            </label>

            {/* Companies: Company Details */}
            {showCompanyDetails ? (
              <div className="cu-block">
                <div className="cu-block-title">
                  <i className="fas fa-building" style={{ marginRight: 8 }}></i>
                  Company Details
                </div>

                <label className="mu-label">
                  Company
                  <div className="cu-inputwrap">
                    <i
                      className="fas fa-city cu-lefticon"
                      aria-hidden="true"
                    ></i>
                    <select
                      className="mu-field cu-input"
                      value={form.companyName}
                      onChange={(e) => onCompanyChange(e.target.value)}
                    >
                      <option value="">Select company</option>
                      {COMPANIES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                {/* Company User permissions + CSV (only after selecting company) */}
                {isCompanyUser ? (
                  <>
                    <div className="cu-perms">
                      <label className="cu-check">
                        <input
                          type="checkbox"
                          checked={!!form.can_edit}
                          onChange={(e) =>
                            update({ can_edit: e.target.checked })
                          }
                        />
                        <span>Can Edit (Company User only)</span>
                      </label>

                      <label className="cu-check">
                        <input
                          type="checkbox"
                          checked={!!form.can_change_years}
                          onChange={(e) =>
                            update({ can_change_years: e.target.checked })
                          }
                        />
                        <span>Can Change Years (Company User only)</span>
                      </label>
                    </div>

                    {showCsvImport ? (
                      <div className="cu-csv-row">
                        <button
                          type="button"
                          className="cu-csv-btn"
                          onClick={() =>
                            setCsvUI((p) => ({
                              ...p,
                              open: !p.open,
                              file: !p.open ? p.file : null, // if closing -> clear
                            }))
                          }
                          aria-label="CSV import"
                          title="CSV Import"
                        >
                          <i className="fas fa-file-csv" aria-hidden="true"></i>
                          <span className="cu-csv-btn-text">
                            {csvUI.open ? "Hide CSV" : "CSV Import"}
                          </span>
                        </button>

                        {csvUI.open ? (
                          <div className="cu-csv-mini">
                            <input
                              className="cu-file"
                              type="file"
                              accept=".csv"
                              onChange={(e) =>
                                setCsvUI((p) => ({
                                  ...p,
                                  file: e.target.files?.[0] || null,
                                }))
                              }
                            />
                            <div className="cu-file-name">
                              {csvUI.file ? csvUI.file.name : "No file chosen"}
                            </div>
                          </div>
                        ) : (
                          <div className="cu-csv-hint">
                            Optional: import Company Users from CSV.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="cu-csv-hint">
                        Select a company to enable CSV import.
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            ) : null}

            {/* Prometheus extra block (Joining Date only) */}
            {showPrometheusBlock ? (
              <div className="cu-block">
                <div className="cu-block-title">
                  <i className="fas fa-id-badge" style={{ marginRight: 8 }}></i>
                  {form.role} Details
                </div>

                <label className="mu-label">
                  Joining Date
                  <div className="cu-inputwrap">
                    <i
                      className="fas fa-calendar-alt cu-lefticon"
                      aria-hidden="true"
                    ></i>
                    <input
                      className="mu-field cu-input"
                      type="date"
                      value={form.joining_date}
                      onChange={(e) => update({ joining_date: e.target.value })}
                    />
                  </div>
                </label>
              </div>
            ) : null}

            {/* Role LAST */}
            <label className="mu-label">
              Role
              <div className="cu-inputwrap">
                <i
                  className="fas fa-user-tag cu-lefticon"
                  aria-hidden="true"
                ></i>
                <select
                  className="mu-field cu-input"
                  value={form.role}
                  onChange={(e) => onRoleChange(e.target.value)}
                >
                  <option value="">Select role</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              {isCompanyMode ? (
                <div className="mu-hint">
                  Company-based roles require selecting a Company.
                </div>
              ) : (
                <div className="mu-hint">
                  Prometheus roles are system roles (Admin/Business
                  Team/Developer).
                </div>
              )}
            </label>

            <div className="cu-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>

              <button type="submit" className="btn btn-primary mu-save">
                <i className="fas fa-user-plus" style={{ marginRight: 6 }}></i>{" "}
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
