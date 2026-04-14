import React, { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import "./manageProjects.css";
import { useNavigate } from "react-router-dom";

// ============================================
// SWEETALERT HELPERS
// ============================================
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const showLoading = (title = "Processing...", text = "Please wait.") => {
  Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading(),
  });
};

const confirmDialog = async ({
  title = "Are you sure?",
  text = "",
  icon = "warning",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonColor,
} = {}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    ...(confirmButtonColor ? { confirmButtonColor } : {}),
  });
  return result.isConfirmed;
};

// ============================================
// INPUT HELPERS (allow empty -> null)
// ============================================
const numOrEmpty = (v) => (v === null || v === undefined ? "" : v);
const toIntOrNull = (s) => (s === "" ? null : parseInt(s, 10));
const toFloatOrNull = (s) => (s === "" ? null : parseFloat(s));

// ============================================
// Percent Input (allows deleting digit-by-digit)
// value is stored as decimal (e.g. 0.15) but user types percent (e.g. 15)
// ============================================
function PercentInput({ value, onChange, digits = 2, className, ...props }) {
  const ref = useRef(null);
  const [text, setText] = useState(value === null || value === undefined ? "" : String(value * 100));

  useEffect(() => {
    const isFocused = document.activeElement === ref.current;
    if (isFocused) return;
    setText(value === null || value === undefined ? "" : String(value * 100));
  }, [value]);

  const isValidPercentText = (t) => /^-?\d*\.?\d*$/.test(t);

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*" 
      className={className}
      value={text}
      onChange={(e) => {
        const t = e.target.value;

        if (t === "") {
          setText("");
          onChange(null);
          return;
        }

        if (!isValidPercentText(t)) return;

        setText(t);

        const n = parseFloat(t);
        if (!Number.isNaN(n)) onChange(n / 100);
      }}
      onBlur={() => {
        if (text === "") return;

        const n = parseFloat(text);
        if (Number.isNaN(n)) return;

        if (text.includes(".")) setText(n.toFixed(digits));
        else setText(String(n));
      }}
      {...props}
    />
  );
}

// ============================================
// MOCK DATA
// ============================================
const mockCompanies = [
  { id: 1, name: "Mint", logo: "https://via.placeholder.com/150x50?text=Emaar" },
  { id: 2, name: "Palmier Developments", logo: "https://via.placeholder.com/150x50?text=Palm+Hills" },
  { id: 3, name: "IGI Developments", logo: "https://via.placeholder.com/150x50?text=Sodic" },
];

const baseProjects = [
  {
    id: 1,
    name: "Downtown Living",
    company: { id: 1, name: "Mint" },
    description: "Luxury apartments in downtown",
    projectconfiguration: {
      interest_rate: 0.085,
      base_dp: 0.15,
      base_tenor_years: 5,
      max_tenor_years: 10,
      days_until_unblocking: 48,
      variable_delivery_date: 24,
      base_payment_frequency: "monthly",
      default_scheme: "Flat",
      use_static_base_npv: true,
      maximum_requests_per_sales: 10,

      basenpv_set: [
        { id: 1, term_period: 1, npv_value: 0.95 },
        { id: 2, term_period: 2, npv_value: 0.9 },
        { id: 3, term_period: 3, npv_value: 0.85 },
      ],

      gaspolicy: {
        is_applied: true,
        gas_num_pmts: 3,
        scheduling: "before_delivery",
        gaspolicyfees_set: [
          { id: 1, term_period: 1, fee_amount: 5000 },
          { id: 2, term_period: 2, fee_amount: 4500 },
        ],
        gaspolicyoffsets_set: [
          { id: 1, term_period: 1, offset_value: 0.02 },
          { id: 2, term_period: 2, offset_value: 0.03 },
        ],
      },

      maintenancepolicy: {
        is_applied: true,
        split_two_one_on_delivery: false,
        maintenance_num_pmts: 2,
        maintenancepolicyscheduling_set: [
          { id: 1, term_period: 1, scheduling: "at_delivery" },
          { id: 2, term_period: 2, scheduling: "before_delivery" },
        ],
        maintenancepolicyoffsets_set: [
          { id: 1, term_period: 1, offset_value: 0.01 },
          { id: 2, term_period: 2, offset_value: 0.015 },
        ],
      },

      constraints: {
        dp_min: 0.1,
        dp_plus_first_pmt: 0.2,
        dp_plus_first_plus_second_pmt: 0.3,
        dp_plus_first_plus_second_plus_third_pmt: 0.4,
        dp_plus_first_plus_second_plus_third_plus_forth_pmt: 0.5,
        first_year_min: 0.25,
        annual_min: 0.15,
        max_discount: 0.1,
        max_exception_discount: 0.15,
        ctd_values: [
          { id: 1, term_period: 1, npv_value: 0.3 },
          { id: 2, term_period: 2, npv_value: 0.5 },
          { id: 3, term_period: 3, npv_value: 0.7 },
        ],
      },
    },
    masterplan: { image: "https://via.placeholder.com/400x300?text=Masterplan+1" },
  },

  {
    id: 2,
    name: "Green Valley",
    company: { id: 2, name: "Palmier Developments" },
    description: "Eco-friendly community",
    projectconfiguration: {
      interest_rate: 0.075,
      base_dp: 0.2,
      base_tenor_years: 7,
      max_tenor_years: 12,
      days_until_unblocking: 72,
      variable_delivery_date: 36,
      base_payment_frequency: "quarterly",
      default_scheme: "Bullet",
      use_static_base_npv: false,
      maximum_requests_per_sales: 15,

      basenpv_set: [
        { id: 4, term_period: 1, npv_value: 0.93 },
        { id: 5, term_period: 2, npv_value: 0.88 },
      ],

      gaspolicy: {
        is_applied: false,
        gas_num_pmts: 0,
        scheduling: "at_delivery",
        gaspolicyfees_set: [],
        gaspolicyoffsets_set: [],
      },

      maintenancepolicy: {
        is_applied: true,
        split_two_one_on_delivery: true,
        maintenance_num_pmts: 3,
        maintenancepolicyscheduling_set: [{ id: 3, term_period: 1, scheduling: "at_delivery" }],
        maintenancepolicyoffsets_set: [{ id: 3, term_period: 1, offset_value: 0.02 }],
      },

      constraints: {
        dp_min: 0.15,
        dp_plus_first_pmt: 0.25,
        dp_plus_first_plus_second_pmt: 0.35,
        dp_plus_first_plus_second_plus_third_pmt: 0.45,
        dp_plus_first_plus_second_plus_third_plus_forth_pmt: 0.55,
        first_year_min: 0.3,
        annual_min: 0.2,
        max_discount: 0.12,
        max_exception_discount: 0.18,
        ctd_values: [
          { id: 4, term_period: 1, npv_value: 0.35 },
          { id: 5, term_period: 2, npv_value: 0.55 },
        ],
      },
    },
    masterplan: null,
  },

  {
    id: 3,
    name: "Beverly Heights",
    company: { id: 3, name: "IGI Developments" },
    description: "Premium residential compound",
    projectconfiguration: {
      interest_rate: 0.09,
      base_dp: 0.18,
      base_tenor_years: 6,
      max_tenor_years: 10,
      days_until_unblocking: 60,
      variable_delivery_date: 30,
      base_payment_frequency: "semi-annual",
      default_scheme: "FlatBackLoaded",
      use_static_base_npv: true,
      maximum_requests_per_sales: 12,

      basenpv_set: [{ id: 6, term_period: 1, npv_value: 0.94 }],

      gaspolicy: {
        is_applied: true,
        gas_num_pmts: 2,
        scheduling: "at_delivery",
        gaspolicyfees_set: [{ id: 3, term_period: 1, fee_amount: 6000 }],
        gaspolicyoffsets_set: [{ id: 3, term_period: 1, offset_value: 0.025 }],
      },

      maintenancepolicy: {
        is_applied: false,
        split_two_one_on_delivery: false,
        maintenance_num_pmts: 0,
        maintenancepolicyscheduling_set: [],
        maintenancepolicyoffsets_set: [],
      },

      constraints: {
        dp_min: 0.12,
        dp_plus_first_pmt: 0.22,
        dp_plus_first_plus_second_pmt: 0.32,
        dp_plus_first_plus_second_plus_third_pmt: 0.42,
        dp_plus_first_plus_second_plus_third_plus_forth_pmt: 0.52,
        first_year_min: 0.28,
        annual_min: 0.18,
        max_discount: 0.11,
        max_exception_discount: 0.16,
        ctd_values: [{ id: 6, term_period: 1, npv_value: 0.32 }],
      },
    },
    masterplan: { image: "https://via.placeholder.com/400x300?text=Masterplan+3" },
  },
];

const extraProjects = [
  {
    id: 4,
    name: "Skyline Gardens",
    company: deepClone(baseProjects[0].company),
    description: "High-rise living with skyline views",
    projectconfiguration: deepClone(baseProjects[0].projectconfiguration),
    masterplan: { image: "https://via.placeholder.com/400x300?text=Masterplan+4" },
  },
  {
    id: 5,
    name: "Nile Pearl Residence",
    company: deepClone(baseProjects[0].company),
    description: "Riverfront residential project",
    projectconfiguration: deepClone(baseProjects[0].projectconfiguration),
    masterplan: null,
  },
  {
    id: 6,
    name: "Palm Vista",
    company: deepClone(baseProjects[1].company),
    description: "Family community with green parks",
    projectconfiguration: deepClone(baseProjects[1].projectconfiguration),
    masterplan: { image: "https://via.placeholder.com/400x300?text=Masterplan+6" },
  },
  {
    id: 7,
    name: "Sodic Heights Annex",
    company: deepClone(baseProjects[2].company),
    description: "Premium extension phase",
    projectconfiguration: deepClone(baseProjects[2].projectconfiguration),
    masterplan: null,
  },
];

const mockProjects = [...baseProjects, ...extraProjects];

// ============================================
// MAIN COMPONENT
// ============================================

export default function ManageProjects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState(mockProjects);
  const [companies] = useState(mockCompanies);

  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editedData, setEditedData] = useState(null);

  const [masterplanPreview, setMasterplanPreview] = useState(null);
  const [newMasterplanFile, setNewMasterplanFile] = useState(null);

  const canDelete = true;

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompany = !companyFilter || project.company.name === companyFilter;
      return matchesSearch && matchesCompany;
    });
  }, [projects, searchTerm, companyFilter]);

  const openEditModal = (project) => {
    setEditedData(deepClone(project));
    setMasterplanPreview(null);
    setNewMasterplanFile(null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditedData(null);
    setMasterplanPreview(null);
    setNewMasterplanFile(null);
  };

  const updateField = (path, value) => {
    setEditedData((prev) => {
      const next = deepClone(prev);
      const keys = path.split(".");
      let current = next;

      for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
      current[keys[keys.length - 1]] = value;

      return next;
    });
  };

  const addRow = (tablePath, defaultItem) => {
    setEditedData((prev) => {
      const next = deepClone(prev);
      const keys = tablePath.split(".");
      let current = next;

      for (let i = 0; i < keys.length; i++) {
        if (i === keys.length - 1) {
          current[keys[i]] = [...current[keys[i]], { ...defaultItem, id: Date.now() }];
        } else {
          current = current[keys[i]];
        }
      }

      return next;
    });
  };

  const removeRow = (tablePath, itemId) => {
    setEditedData((prev) => {
      const next = deepClone(prev);
      const keys = tablePath.split(".");
      let current = next;

      for (let i = 0; i < keys.length; i++) {
        if (i === keys.length - 1) {
          current[keys[i]] = current[keys[i]].filter((item) => item.id !== itemId);
        } else {
          current = current[keys[i]];
        }
      }

      return next;
    });
  };

  const updateTableItem = (tablePath, itemId, field, value) => {
    setEditedData((prev) => {
      const next = deepClone(prev);
      const keys = tablePath.split(".");
      let current = next;

      for (let i = 0; i < keys.length; i++) {
        if (i === keys.length - 1) {
          const item = current[keys[i]].find((x) => x.id === itemId);
          if (item) item[field] = value;
        } else {
          current = current[keys[i]];
        }
      }

      return next;
    });
  };

  const handleMasterplanChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewMasterplanFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setMasterplanPreview(reader.result);
      Toast.fire({ icon: "success", title: "Masterplan selected" });
    };
    reader.readAsDataURL(file);
  };

  const removeMasterplan = async () => {
    const confirmed = await confirmDialog({
      title: "Remove masterplan?",
      text: "This will remove the current masterplan from the project.",
      icon: "warning",
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!confirmed) return;

    updateField("masterplan", null);
    setMasterplanPreview(null);
    setNewMasterplanFile(null);

    Toast.fire({ icon: "success", title: "Masterplan removed" });
  };

  const handleUpdate = async () => {
    if (!editedData) return;

    showLoading("Saving changes...", "Please wait while we save your updates.");

    setTimeout(() => {
      setProjects((prev) => prev.map((p) => (p.id === editedData.id ? editedData : p)));
      Swal.close();
      Toast.fire({ icon: "success", title: "Project updated successfully" });
      closeEditModal();
    }, 800);
  };

  const confirmAndDelete = async (project) => {
    const confirmed = await confirmDialog({
      title: "Delete project?",
      text: `This will delete "${project.name}".`,
      icon: "warning",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!confirmed) return;

    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    Toast.fire({ icon: "success", title: "Project deleted" });
  };

  const createProject = () => {
    navigate("/create-project");
  };

  return (
    <div className="mp-page">
      <div className="mp-shell">
        <div className="mp-topBar">
          <div className="mp-topBarLeft">
            <div className="mp-pageIcon" aria-hidden="true" />
            <div className="mp-titles">
              <h1 className="mp-pageTitle">Manage Projects</h1>
            </div>
          </div>

          <button className="mp-btn mp-btnSuccess" onClick={createProject}>
            <i className="fas fa-plus" aria-hidden="true" style={{ marginRight: 8 }}></i>Create Project
          </button>
        </div>

        <div className="mp-card">
          <div className="mp-filters">
            <input
              className="mp-input"
              type="text"
              placeholder="Search by Project Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select className="mp-select" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.name}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mp-tableWrap">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Company</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <tr key={project.id}>
                      <td>{project.name}</td>
                      <td>{project.company.name}</td>
                      <td>
                        <div className="mp-actions">
                          <button className="mp-btn mp-btnPrimary" onClick={() => openEditModal(project)}>
                            Edit
                          </button>

                          {canDelete && (
                            <button className="mp-btn mp-btnDanger" onClick={() => confirmAndDelete(project)}>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="mp-empty">
                      No projects found. Please adjust your search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showEditModal && editedData && (
          <div className="mp-modalOverlay" onClick={closeEditModal}>
            <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mp-modalHeader">
                <h2 style={{ margin: 0 }}>Edit Project: {editedData.name}</h2>
                <button className="mp-modalClose" onClick={closeEditModal} aria-label="Close">
                  ×
                </button>
              </div>

              <div className="mp-modalBody">
                <div className="mp-card" style={{ marginBottom: 14 }}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <div>
                      <label>Project Name</label>
                      <input className="mp-input" value={editedData.name} readOnly />
                    </div>

                    <div>
                      <label>Company</label>
                      <input className="mp-input" value={editedData.company.name} readOnly />
                    </div>

                    <div>
                      <label>Description</label>
                      <input
                        className="mp-input"
                        value={editedData.description || ""}
                        onChange={(e) => updateField("description", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Project Configuration */}
                <div className="mp-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ marginTop: 0 }}>Project Configuration</h3>

                  <div className="mp-tableWrap">
                    <table className="mp-table">
                      <tbody>
                        <tr>
                          <th>Interest Rate (%)</th>
                          <td>
                            <PercentInput
                              className="mp-input"
                              digits={2}
                              value={editedData.projectconfiguration.interest_rate}
                              onChange={(v) => updateField("projectconfiguration.interest_rate", v)}
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Base DP (%)</th>
                          <td>
                            <PercentInput
                              className="mp-input"
                              digits={2}
                              value={editedData.projectconfiguration.base_dp}
                              onChange={(v) => updateField("projectconfiguration.base_dp", v)}
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Tenor Years</th>
                          <td>
                            <input
                              className="mp-input"
                              type="number"
                              value={numOrEmpty(editedData.projectconfiguration.base_tenor_years)}
                              onChange={(e) =>
                                updateField("projectconfiguration.base_tenor_years", toIntOrNull(e.target.value))
                              }
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Max Tenor Years</th>
                          <td>
                            <input
                              className="mp-input"
                              type="number"
                              value={numOrEmpty(editedData.projectconfiguration.max_tenor_years)}
                              onChange={(e) =>
                                updateField("projectconfiguration.max_tenor_years", toIntOrNull(e.target.value))
                              }
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Max Requests per Sales</th>
                          <td>
                            <input
                              className="mp-input"
                              type="number"
                              value={numOrEmpty(editedData.projectconfiguration.maximum_requests_per_sales)}
                              onChange={(e) =>
                                updateField(
                                  "projectconfiguration.maximum_requests_per_sales",
                                  toIntOrNull(e.target.value)
                                )
                              }
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Hours Until Auto Unblock</th>
                          <td>
                            <input
                              className="mp-input"
                              type="number"
                              value={numOrEmpty(editedData.projectconfiguration.days_until_unblocking)}
                              onChange={(e) =>
                                updateField("projectconfiguration.days_until_unblocking", toIntOrNull(e.target.value))
                              }
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Months of Delivery After Reservation</th>
                          <td>
                            <input
                              className="mp-input"
                              type="number"
                              value={numOrEmpty(editedData.projectconfiguration.variable_delivery_date)}
                              onChange={(e) =>
                                updateField(
                                  "projectconfiguration.variable_delivery_date",
                                  toIntOrNull(e.target.value)
                                )
                              }
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Payment Frequency</th>
                          <td>
                            <select
                              className="mp-select"
                              value={editedData.projectconfiguration.base_payment_frequency || ""}
                              onChange={(e) =>
                                updateField("projectconfiguration.base_payment_frequency", e.target.value)
                              }
                            >
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="semi-annual">Semi-Annual</option>
                              <option value="annual">Annual</option>
                            </select>
                          </td>
                        </tr>

                        <tr>
                          <th>Default Scheme</th>
                          <td>
                            <select
                              className="mp-select"
                              value={editedData.projectconfiguration.default_scheme || ""}
                              onChange={(e) => updateField("projectconfiguration.default_scheme", e.target.value)}
                            >
                              <option value="Flat">Flat</option>
                              <option value="FlatBackLoaded">Flat Back Loaded</option>
                              <option value="Bullet">Bullet</option>
                              <option value="BulletBackLoaded">Bullet Back Loaded</option>
                            </select>
                          </td>
                        </tr>

                        <tr>
                          <th>Use Static Base NPV</th>
                          <td>
                            <input
                              type="checkbox"
                              checked={!!editedData.projectconfiguration.use_static_base_npv}
                              onChange={(e) => updateField("projectconfiguration.use_static_base_npv", e.target.checked)}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Base NPV */}
                <div className="mp-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ marginTop: 0 }}>Base NPV</h3>

                  <div className="mp-tableWrap">
                    <table className="mp-table">
                      <thead>
                        <tr>
                          <th>YTD</th>
                          <th>NPV (%)</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {editedData.projectconfiguration.basenpv_set.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <input
                                className="mp-input"
                                type="number"
                                value={numOrEmpty(item.term_period)}
                                onChange={(e) =>
                                  updateTableItem(
                                    "projectconfiguration.basenpv_set",
                                    item.id,
                                    "term_period",
                                    toFloatOrNull(e.target.value)
                                  )
                                }
                              />
                            </td>

                            <td>
                              <PercentInput
                                className="mp-input"
                                digits={2}
                                value={item.npv_value}
                                onChange={(v) =>
                                  updateTableItem("projectconfiguration.basenpv_set", item.id, "npv_value", v)
                                }
                              />
                            </td>

                            <td>
                              <button
                                className="mp-btn mp-btnDanger"
                                onClick={() => removeRow("projectconfiguration.basenpv_set", item.id)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    className="mp-btn mp-btnPrimary"
                    style={{ marginTop: 10 }}
                    onClick={() => addRow("projectconfiguration.basenpv_set", { term_period: null, npv_value: null })}
                  >
                    Add Row
                  </button>
                </div>

                {/* Gas Policy */}
                <div className="mp-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ marginTop: 0 }}>Gas Policy</h3>

                  <div className="mp-tableWrap">
                    <table className="mp-table">
                      <tbody>
                        <tr>
                          <th>Applied?</th>
                          <td>
                            <input
                              type="checkbox"
                              checked={!!editedData.projectconfiguration.gaspolicy.is_applied}
                              onChange={(e) =>
                                updateField("projectconfiguration.gaspolicy.is_applied", e.target.checked)
                              }
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Number of Payments</th>
                          <td>
                            <input
                              className="mp-input"
                              type="number"
                              value={numOrEmpty(editedData.projectconfiguration.gaspolicy.gas_num_pmts)}
                              onChange={(e) =>
                                updateField("projectconfiguration.gaspolicy.gas_num_pmts", toIntOrNull(e.target.value))
                              }
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Scheduling</th>
                          <td>
                            <select
                              className="mp-select"
                              value={editedData.projectconfiguration.gaspolicy.scheduling || ""}
                              onChange={(e) => updateField("projectconfiguration.gaspolicy.scheduling", e.target.value)}
                            >
                              <option value="at_delivery">At Delivery</option>
                              <option value="before_delivery">Before Delivery</option>
                            </select>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Gas Policy Fees */}
                <div className="mp-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ marginTop: 0 }}>Gas Policy Fees</h3>

                  <div className="mp-tableWrap">
                    <table className="mp-table">
                      <thead>
                        <tr>
                          <th>YTD</th>
                          <th>Fees</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {editedData.projectconfiguration.gaspolicy.gaspolicyfees_set.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <input
                                className="mp-input"
                                type="number"
                                value={numOrEmpty(item.term_period)}
                                onChange={(e) =>
                                  updateTableItem(
                                    "projectconfiguration.gaspolicy.gaspolicyfees_set",
                                    item.id,
                                    "term_period",
                                    toFloatOrNull(e.target.value)
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                className="mp-input"
                                type="number"
                                value={numOrEmpty(item.fee_amount)}
                                onChange={(e) =>
                                  updateTableItem(
                                    "projectconfiguration.gaspolicy.gaspolicyfees_set",
                                    item.id,
                                    "fee_amount",
                                    toFloatOrNull(e.target.value)
                                  )
                                }
                              />
                            </td>

                            <td>
                              <button
                                className="mp-btn mp-btnDanger"
                                onClick={() => removeRow("projectconfiguration.gaspolicy.gaspolicyfees_set", item.id)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    className="mp-btn mp-btnPrimary"
                    style={{ marginTop: 10 }}
                    onClick={() =>
                      addRow("projectconfiguration.gaspolicy.gaspolicyfees_set", {
                        term_period: null,
                        fee_amount: null,
                      })
                    }
                  >
                    Add Row
                  </button>
                </div>

                {/* Gas Policy Offsets */}
                <div className="mp-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ marginTop: 0 }}>Gas Policy Offsets</h3>

                  <div className="mp-tableWrap">
                    <table className="mp-table">
                      <thead>
                        <tr>
                          <th>YTD</th>
                          <th>Offset (%)</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {editedData.projectconfiguration.gaspolicy.gaspolicyoffsets_set.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <input
                                className="mp-input"
                                type="number"
                                value={numOrEmpty(item.term_period)}
                                onChange={(e) =>
                                  updateTableItem(
                                    "projectconfiguration.gaspolicy.gaspolicyoffsets_set",
                                    item.id,
                                    "term_period",
                                    toFloatOrNull(e.target.value)
                                  )
                                }
                              />
                            </td>

                            <td>
                              <PercentInput
                                className="mp-input"
                                digits={5}
                                value={item.offset_value}
                                onChange={(v) =>
                                  updateTableItem("projectconfiguration.gaspolicy.gaspolicyoffsets_set", item.id, "offset_value", v)
                                }
                              />
                            </td>

                            <td>
                              <button
                                className="mp-btn mp-btnDanger"
                                onClick={() => removeRow("projectconfiguration.gaspolicy.gaspolicyoffsets_set", item.id)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    className="mp-btn mp-btnPrimary"
                    style={{ marginTop: 10 }}
                    onClick={() =>
                      addRow("projectconfiguration.gaspolicy.gaspolicyoffsets_set", {
                        term_period: null,
                        offset_value: null,
                      })
                    }
                  >
                    Add Row
                  </button>
                </div>

                {/* CTD Values */}
                <div className="mp-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ marginTop: 0 }}>Cash Till Delivery (CTD)</h3>

                  <div className="mp-tableWrap">
                    <table className="mp-table">
                      <thead>
                        <tr>
                          <th>YTD</th>
                          <th>CTD (%)</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {editedData.projectconfiguration.constraints.ctd_values.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <input
                                className="mp-input"
                                type="number"
                                value={numOrEmpty(item.term_period)}
                                onChange={(e) =>
                                  updateTableItem(
                                    "projectconfiguration.constraints.ctd_values",
                                    item.id,
                                    "term_period",
                                    toFloatOrNull(e.target.value)
                                  )
                                }
                              />
                            </td>

                            <td>
                              <PercentInput
                                className="mp-input"
                                digits={5}
                                value={item.npv_value}
                                onChange={(v) =>
                                  updateTableItem("projectconfiguration.constraints.ctd_values", item.id, "npv_value", v)
                                }
                              />
                            </td>

                            <td>
                              <button
                                className="mp-btn mp-btnDanger"
                                onClick={() => removeRow("projectconfiguration.constraints.ctd_values", item.id)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    className="mp-btn mp-btnPrimary"
                    style={{ marginTop: 10 }}
                    onClick={() =>
                      addRow("projectconfiguration.constraints.ctd_values", { term_period: null, npv_value: null })
                    }
                  >
                    Add Row
                  </button>
                </div>

                {/* Constraints */}
                <div className="mp-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ marginTop: 0 }}>Project Constraints</h3>

                  <div className="mp-tableWrap">
                    <table className="mp-table">
                      <tbody>
                        <tr>
                          <th>DP Min (%)</th>
                          <td>
                            <PercentInput
                              className="mp-input"
                              digits={2}
                              value={editedData.projectconfiguration.constraints.dp_min}
                              onChange={(v) => updateField("projectconfiguration.constraints.dp_min", v)}
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Max Discount (%)</th>
                          <td>
                            <PercentInput
                              className="mp-input"
                              digits={2}
                              value={editedData.projectconfiguration.constraints.max_discount}
                              onChange={(v) => updateField("projectconfiguration.constraints.max_discount", v)}
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Max Exception Discount (%)</th>
                          <td>
                            <PercentInput
                              className="mp-input"
                              digits={2}
                              value={editedData.projectconfiguration.constraints.max_exception_discount}
                              onChange={(v) =>
                                updateField("projectconfiguration.constraints.max_exception_discount", v)
                              }
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Maintenance Policy */}
                <div className="mp-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ marginTop: 0 }}>Maintenance Policy</h3>

                  <div className="mp-tableWrap">
                    <table className="mp-table">
                      <tbody>
                        <tr>
                          <th>Policy Applied?</th>
                          <td>
                            <input
                              type="checkbox"
                              checked={!!editedData.projectconfiguration.maintenancepolicy.is_applied}
                              onChange={(e) =>
                                updateField("projectconfiguration.maintenancepolicy.is_applied", e.target.checked)
                              }
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Number of Payments</th>
                          <td>
                            <input
                              className="mp-input"
                              type="number"
                              value={numOrEmpty(editedData.projectconfiguration.maintenancepolicy.maintenance_num_pmts)}
                              onChange={(e) =>
                                updateField(
                                  "projectconfiguration.maintenancepolicy.maintenance_num_pmts",
                                  toIntOrNull(e.target.value)
                                )
                              }
                            />
                          </td>
                        </tr>

                        <tr>
                          <th>Split 2 PMTs (one at delivery)</th>
                          <td>
                            <input
                              type="checkbox"
                              checked={!!editedData.projectconfiguration.maintenancepolicy.split_two_one_on_delivery}
                              onChange={(e) =>
                                updateField(
                                  "projectconfiguration.maintenancepolicy.split_two_one_on_delivery",
                                  e.target.checked
                                )
                              }
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Maintenance Policy Scheduling */}
                <div className="mp-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ marginTop: 0 }}>Maintenance Policy Scheduling</h3>

                  <div className="mp-tableWrap">
                    <table className="mp-table">
                      <thead>
                        <tr>
                          <th>YTD</th>
                          <th>Scheduled</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {editedData.projectconfiguration.maintenancepolicy.maintenancepolicyscheduling_set.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <input
                                className="mp-input"
                                type="number"
                                value={numOrEmpty(item.term_period)}
                                onChange={(e) =>
                                  updateTableItem(
                                    "projectconfiguration.maintenancepolicy.maintenancepolicyscheduling_set",
                                    item.id,
                                    "term_period",
                                    toFloatOrNull(e.target.value)
                                  )
                                }
                              />
                            </td>

                            <td>
                              <select
                                className="mp-select"
                                value={item.scheduling || ""}
                                onChange={(e) =>
                                  updateTableItem(
                                    "projectconfiguration.maintenancepolicy.maintenancepolicyscheduling_set",
                                    item.id,
                                    "scheduling",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="at_delivery">At Delivery</option>
                                <option value="before_delivery">Before Delivery</option>
                              </select>
                            </td>

                            <td>
                              <button
                                className="mp-btn mp-btnDanger"
                                onClick={() =>
                                  removeRow("projectconfiguration.maintenancepolicy.maintenancepolicyscheduling_set", item.id)
                                }
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    className="mp-btn mp-btnPrimary"
                    style={{ marginTop: 10 }}
                    onClick={() =>
                      addRow("projectconfiguration.maintenancepolicy.maintenancepolicyscheduling_set", {
                        term_period: null,
                        scheduling: "at_delivery",
                      })
                    }
                  >
                    Add Row
                  </button>
                </div>

                {/* Maintenance Policy Offsets */}
                <div className="mp-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ marginTop: 0 }}>Maintenance Policy Offsets</h3>

                  <div className="mp-tableWrap">
                    <table className="mp-table">
                      <thead>
                        <tr>
                          <th>YTD</th>
                          <th>Offset (%)</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {editedData.projectconfiguration.maintenancepolicy.maintenancepolicyoffsets_set.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <input
                                className="mp-input"
                                type="number"
                                value={numOrEmpty(item.term_period)}
                                onChange={(e) =>
                                  updateTableItem(
                                    "projectconfiguration.maintenancepolicy.maintenancepolicyoffsets_set",
                                    item.id,
                                    "term_period",
                                    toFloatOrNull(e.target.value)
                                  )
                                }
                              />
                            </td>

                            <td>
                              <PercentInput
                                className="mp-input"
                                digits={5}
                                value={item.offset_value}
                                onChange={(v) =>
                                  updateTableItem(
                                    "projectconfiguration.maintenancepolicy.maintenancepolicyoffsets_set",
                                    item.id,
                                    "offset_value",
                                    v
                                  )
                                }
                              />
                            </td>

                            <td>
                              <button
                                className="mp-btn mp-btnDanger"
                                onClick={() =>
                                  removeRow("projectconfiguration.maintenancepolicy.maintenancepolicyoffsets_set", item.id)
                                }
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    className="mp-btn mp-btnPrimary"
                    style={{ marginTop: 10 }}
                    onClick={() =>
                      addRow("projectconfiguration.maintenancepolicy.maintenancepolicyoffsets_set", {
                        term_period: null,
                        offset_value: null,
                      })
                    }
                  >
                    Add Row
                  </button>
                </div>

                {/* Masterplan */}
                <div className="mp-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ marginTop: 0 }}>Project Masterplan</h3>

                  {editedData.masterplan?.image ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      <div>
                        <strong>Current Masterplan</strong>
                      </div>

                      <img
                        src={editedData.masterplan.image}
                        alt="Current Masterplan"
                        style={{ maxWidth: 260, borderRadius: 10, border: "1px solid #e5e7eb" }}
                      />

                      <div>
                        <button className="mp-btn mp-btnWarning" onClick={removeMasterplan}>
                          Remove Masterplan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "#6b7280" }}>No masterplan uploaded.</div>
                  )}

                  <div style={{ marginTop: 12 }}>
                    <label htmlFor={`masterplan-image-${editedData.id}`}>
                      <strong>Upload New Masterplan</strong>
                    </label>
                    <input
                      id={`masterplan-image-${editedData.id}`}
                      className="mp-input"
                      style={{ paddingTop: 8 }}
                      type="file"
                      accept="image/*"
                      onChange={handleMasterplanChange}
                    />
                  </div>

                  {masterplanPreview && (
                    <div style={{ marginTop: 12 }}>
                      <strong>Preview</strong>
                      <div style={{ marginTop: 8 }}>
                        <img
                          src={masterplanPreview}
                          alt="Preview"
                          style={{ maxWidth: 260, borderRadius: 10, border: "1px solid #e5e7eb" }}
                        />
                      </div>
                    </div>
                  )}

                  {newMasterplanFile && (
                    <div style={{ marginTop: 10, color: "#6b7280" }}>Selected file: {newMasterplanFile.name}</div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                  <button className="mp-btn mp-btnGhost" onClick={closeEditModal}>
                    Cancel
                  </button>
                  <button className="mp-btn mp-btnSuccess" onClick={handleUpdate}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
