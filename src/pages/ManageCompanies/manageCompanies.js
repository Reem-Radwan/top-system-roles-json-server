import React, { useMemo, useRef, useState, useId } from "react";
import Swal from "sweetalert2";
import "./manageCompanies.css";
import { useNavigate } from "react-router-dom";
import { INITIAL_COMPANIES } from "../../data/fakeManageCompaniesData";

const TYPES = ["Native", "ERP", "Google Sheets"];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function mockRequest(ok = true, delayMs = 300) {
  return new Promise((resolve, reject) => {
    setTimeout(() => (ok ? resolve({ ok: true }) : reject(new Error("Mock error"))), delayMs);
  });
}

async function uploadLogoAjax(companyId, file) {
  const formData = new FormData();
  formData.append("company_id", companyId);
  formData.append("logo", file);

  await mockRequest(true, 350);
  return URL.createObjectURL(file);
}

function normalizeVal(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}
function boolText(v) {
  return v ? "Active" : "Inactive";
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* -----------------------------
   Config Modal (ERP + Google Sheets)
   - All fields OPTIONAL now
------------------------------ */
function ConfigModal({ open, company, onClose, onDone }) {
  const [erpDraft, setErpDraft] = useState(() => ({
    mainUrl: company?.erp?.mainUrl || "",
    mainKey: company?.erp?.mainKey || "",
    unitsUrl: company?.erp?.unitsUrl || "",
    unitsKey: company?.erp?.unitsKey || "",
    holdUnitUrl: company?.erp?.holdUnitUrl || "",
    holdUnitKey: company?.erp?.holdUnitKey || "",
    leadsUrl: company?.erp?.leadsUrl || "",
    leadsKey: company?.erp?.leadsKey || "",
  }));

  const [gsDraft, setGsDraft] = useState(() => ({
    sheetUrl: company?.gsheet?.sheetUrl || "",
    gid: company?.gsheet?.gid || "",
    title: company?.gsheet?.title || "",
  }));

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!company) return;

    setErpDraft({
      mainUrl: company.erp?.mainUrl || "",
      mainKey: company.erp?.mainKey || "",
      unitsUrl: company.erp?.unitsUrl || "",
      unitsKey: company.erp?.unitsKey || "",
      holdUnitUrl: company.erp?.holdUnitUrl || "",
      holdUnitKey: company.erp?.holdUnitKey || "",
      leadsUrl: company.erp?.leadsUrl || "",
      leadsKey: company.erp?.leadsKey || "",
    });

    setGsDraft({
      sheetUrl: company?.gsheet?.sheetUrl || "",
      gid: company?.gsheet?.gid || "",
      title: company?.gsheet?.title || "",
    });
  }, [company]);

  if (!open || !company) return null;

  const isERP = company.type === "ERP";
  const isGS = company.type === "Google Sheets";

  function handleDoneClick() {
    // No validation blocking, because everything is optional now. [web:818]
    if (isERP) onDone({ kind: "erp", data: erpDraft });
    else if (isGS) onDone({ kind: "gsheet", data: gsDraft });
    else onClose();
  }

  return (
    <div className="mu-modal-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="mu-modal mc-config-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mu-modal-header">
          <div className="mu-modal-title">Configuration: {company.name}</div>
          <button className="mu-modal-x" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mu-modal-body">
          <form>
            {isERP ? (
              <>
                <div style={{ display: "flex", gap: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: 10 }}>
                  <button type="button" className="lux-tab active">
                    ERP Settings
                  </button>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div className="cu-two">
                    <label className="mu-label">
                      Main URL
                      <input className="mu-field" type="url" value={erpDraft.mainUrl} onChange={(e) => setErpDraft((p) => ({ ...p, mainUrl: e.target.value }))} />
                    </label>

                    <label className="mu-label">
                      Main Key
                      <input className="mu-field" type="text" value={erpDraft.mainKey} onChange={(e) => setErpDraft((p) => ({ ...p, mainKey: e.target.value }))} />
                    </label>

                    <label className="mu-label">
                      Units URL
                      <input className="mu-field" type="url" value={erpDraft.unitsUrl} onChange={(e) => setErpDraft((p) => ({ ...p, unitsUrl: e.target.value }))} />
                    </label>

                    <label className="mu-label">
                      Units Key
                      <input className="mu-field" type="text" value={erpDraft.unitsKey} onChange={(e) => setErpDraft((p) => ({ ...p, unitsKey: e.target.value }))} />
                    </label>

                    <label className="mu-label">
                      Hold Unit URL
                      <input className="mu-field" type="url" value={erpDraft.holdUnitUrl} onChange={(e) => setErpDraft((p) => ({ ...p, holdUnitUrl: e.target.value }))} />
                    </label>

                    <label className="mu-label">
                      Hold Unit Key
                      <input className="mu-field" type="text" value={erpDraft.holdUnitKey} onChange={(e) => setErpDraft((p) => ({ ...p, holdUnitKey: e.target.value }))} />
                    </label>

                    <label className="mu-label">
                      Leads URL
                      <input className="mu-field" type="url" value={erpDraft.leadsUrl} onChange={(e) => setErpDraft((p) => ({ ...p, leadsUrl: e.target.value }))} />
                    </label>

                    <label className="mu-label">
                      Leads Key
                      <input className="mu-field" type="text" value={erpDraft.leadsKey} onChange={(e) => setErpDraft((p) => ({ ...p, leadsKey: e.target.value }))} />
                    </label>
                  </div>
                </div>
              </>
            ) : isGS ? (
              <>
                <div style={{ display: "flex", gap: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: 10 }}>
                  <button type="button" className="lux-tab active">
                    Google Sheets
                  </button>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label className="mu-label">
                    Sheet URL
                    <input className="mu-field" type="url" value={gsDraft.sheetUrl} onChange={(e) => setGsDraft((p) => ({ ...p, sheetUrl: e.target.value }))} />
                  </label>

                  <div className="cu-two" style={{ marginTop: 12 }}>
                    <label className="mu-label">
                      GID
                      <input className="mu-field" type="text" value={gsDraft.gid} onChange={(e) => setGsDraft((p) => ({ ...p, gid: e.target.value }))} />
                    </label>

                    <label className="mu-label">
                      Title
                      <input className="mu-field" type="text" value={gsDraft.title} onChange={(e) => setGsDraft((p) => ({ ...p, title: e.target.value }))} />
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <div className="mu-hint">No configuration for this type.</div>
            )}
          </form>
        </div>

        <div className="mu-modal-footer">
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Cancel
          </button>

          <button className="btn btn-primary muu-save" type="button" onClick={handleDoneClick}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Mobile Edit Modal
------------------------------ */
function MobileEditModal({
  open,
  company,
  draftActiveValue,
  onClose,
  onChangeName,
  onChangeDate,
  onUploadLogo,
  onChangeActive,
  onChangeType,
  onSave,
  onOpenConfig,
  onSync,
  onDelete,
  syncing,
}) {
  const formRef = useRef(null);
  const mobileInputId = useId();

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !company) return null;

  const isERP = company.type === "ERP";
  const isGS = company.type === "Google Sheets";

  function requireValidThen(fn) {
    if (formRef.current && !formRef.current.reportValidity()) return;
    fn();
  }

  return (
    <div className="mu-modal-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="mu-modal" onMouseDown={(e) => e.stopPropagation()} style={{ width: "min(560px, 92vw)" }}>
        <div className="mu-modal-header">
          <div className="mu-modal-title">{company.name}</div>
          <button className="mu-modal-x" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mu-modal-body">
          <form ref={formRef}>
            <label className="mu-label">
              Company Name *
              <input className="mu-field" type="text" required value={company.name} onChange={(e) => onChangeName(e.target.value)} />
            </label>

            {/* Click logo to upload (no upload button) */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              <input
                id={mobileInputId}
                className="mc-file-hidden"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (f) onUploadLogo(f);
                  e.target.value = "";
                }}
              />

              <label htmlFor={mobileInputId} className="mc-logo-click" title="Click to change logo">
                <div className="mc-logo">
                  {company.logoUrl ? <img src={company.logoUrl} alt="logo" className="mc-logo-img" /> : <div className="mc-logo-ph">No logo</div>}
                </div>
                <div className="mc-logo-edit-badge">Edit</div>
              </label>
            </div>

            <label className="mu-label" style={{ marginTop: 12 }}>
              Joining Date *
              <input className="mu-field" type="date" required value={company.joining_date || ""} onChange={(e) => onChangeDate(e.target.value)} />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div className="mc-mini-box">
                <div className="mc-mini-label">Projects</div>
                <div className="mc-mini-value">{company.projects}</div>
              </div>
              <div className="mc-mini-box">
                <div className="mc-mini-label">Users</div>
                <div className="mc-mini-value">{company.users}</div>
              </div>
            </div>

            <label className="mu-label" style={{ marginTop: 12 }}>
              Active
              <div style={{ marginTop: 8 }}>
                <input type="checkbox" checked={!!draftActiveValue} onChange={(e) => onChangeActive(e.target.checked)} />
              </div>
            </label>

            <label className="mu-label" style={{ marginTop: 12 }}>
              Type *
              <select className="mu-field" required value={company.type} onChange={(e) => onChangeType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
              <div
                className="mc-mobile-actions"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
              <button type="button" className="btn btn-primary muu-savee" onClick={() => requireValidThen(onSave)}>
                Save
              </button>

              {isERP || isGS ? (
                <button type="button" className="btn btn-sm lux-btn warn" onClick={() => requireValidThen(onOpenConfig)}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    <i className="fas fa-gear" aria-hidden="true"></i>
                    Config
                  </span>
                </button>
              ) : null}

              {isGS ? (
                <button
                  type="button"
                  className={syncing ? "btn btn-sm lux-btn syncing" : "btn btn-sm lux-btn sync"}
                  onClick={() => requireValidThen(onSync)}
                  disabled={!!syncing}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    {syncing ? <span className="mc-spinner" aria-hidden="true"></span> : null}
                    {syncing ? "Syncing..." : "Sync"}
                  </span>
                </button>
              ) : null}

              <button type="button" className="btn btn-sm lux-btn danger" onClick={() => requireValidThen(onDelete)}>
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function LogoPicker({ logoUrl, name, onPick }) {
  const inputId = useId();

  return (
    <div className="mc-logo-clickwrap">
      <input
        id={inputId}
        className="mc-file-hidden"
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          if (f) onPick(f);
          e.target.value = "";
        }}
      />

      <label className="mc-logo-click" htmlFor={inputId} title="Click to change logo">
        <div className="mc-logo">
          {logoUrl ? <img src={logoUrl} alt={`${name} logo`} className="mc-logo-img" /> : <div className="mc-logo-ph">No logo</div>}
        </div>
        <div className="mc-logo-edit-badge">Edit</div>
      </label>
    </div>
  );
}

export default function ManageCompanies() {
  const [rows, setRows] = useState(INITIAL_COMPANIES);
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState({});
  const navigate = useNavigate();

  const [config, setConfig] = useState({ open: false, companyId: null });
  const [mobileEdit, setMobileEdit] = useState({ open: false, companyId: null });

  const [draftActive, setDraftActive] = useState(() => Object.fromEntries(INITIAL_COMPANIES.map((c) => [c.id, !!c.active])));

  const [dirty, setDirty] = useState({});
  const [baseline, setBaseline] = useState(() => {
    const map = {};
    INITIAL_COMPANIES.forEach((c) => {
      map[c.id] = deepClone({ ...c, active: !!c.active });
    });
    return map;
  });

  const objectUrlRef = useRef([]);

  const swalFire = (opts) =>
    Swal.fire({
      allowOutsideClick: true,
      allowEscapeKey: true,
      ...opts,
    });

  function markDiff(id, field, from, to) {
    setDirty((p) => ({
      ...p,
      [id]: {
        ...(p[id] || {}),
        [field]: { from, to },
      },
    }));
  }
  function clearDirty(id) {
    setDirty((p) => ({ ...p, [id]: {} }));
  }

  function updateCompany(id, patch) {
    setRows((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;

        const base = baseline[id] || {};
        const next = { ...c, ...patch };

        Object.keys(patch).forEach((k) => {
          const before = base?.[k];
          const after = next?.[k];
          if (normalizeVal(before) !== normalizeVal(after)) {
            markDiff(id, k, before, after);
          }
        });

        return next;
      })
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [rows, query]);

  function openConfig(companyId) {
    setConfig({ open: true, companyId });
  }
  function closeConfig() {
    setConfig({ open: false, companyId: null });
  }

  const configCompany = config.companyId ? rows.find((c) => c.id === config.companyId) : null;
  const mobileCompany = mobileEdit.companyId ? rows.find((c) => c.id === mobileEdit.companyId) : null;

  function actionsForType(type) {
    if (type === "Native") return ["save", "delete"];
    if (type === "ERP") return ["save", "config", "delete"];
    return ["save", "config", "sync", "delete"];
  }

  function diffLinesForAlert(id) {
    const d = dirty[id] || {};
    const entries = Object.entries(d);

    if (!entries.length) return ["No changes."];

    const label = (k) =>
      ({
        name: "Name",
        joining_date: "Joining Date",
        type: "Type",
        active: "Active",
        logoUrl: "Logo",
        erp: "ERP Configuration",
        gsheet: "Google Sheets Configuration",
      }[k] || k);

    return entries.map(([k, v]) => {
      if (k === "erp") return "ERP Configuration updated";
      if (k === "gsheet") return "Google Sheets Configuration updated";

      const from = k === "active" ? boolText(!!v.from) : normalizeVal(v.from) || "(empty)";
      const to = k === "active" ? boolText(!!v.to) : normalizeVal(v.to) || "(empty)";
      return `${label(k)} updated from "${from}" to "${to}"`;
    });
  }

  async function handleSave(c) {
    const nextActive = !!draftActive[c.id];
    const baseActive = !!baseline[c.id]?.active;
    if (nextActive !== baseActive) markDiff(c.id, "active", baseActive, nextActive);

    setRows((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: nextActive } : x)));

    await mockRequest(true);

    const lines = diffLinesForAlert(c.id);

    await swalFire({
      icon: "success",
      title: "Saved",
      html: `<div style="text-align:center; line-height:1.6">${lines.map((t) => `<div>${t}</div>`).join("")}</div>`,
      confirmButtonColor: "#f59e0b",
    });

    setBaseline((p) => {
      const latest = rows.find((x) => x.id === c.id) || c;
      return { ...p, [c.id]: deepClone({ ...latest, active: nextActive }) };
    });

    clearDirty(c.id);
  }

  async function handleDelete(c) {
    const res = await swalFire({
      icon: "warning",
      title: "Confirm Deletion",
      text: `Delete company "${c.name}"?`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#b23b2a",
      cancelButtonText: "Cancel",
    });

    if (!res.isConfirmed) return;

    await mockRequest(true);
    setRows((prev) => prev.filter((x) => x.id !== c.id));

    await swalFire({
      icon: "success",
      title: "Deleted",
      confirmButtonColor: "#f59e0b",
    });
  }

  async function handleSyncDesktop(c) {
    const res = await swalFire({
      icon: "warning",
      title: "Sync from Google Sheets",
      text: "Are you sure you want to delete existing units and sync from the Sheet?",
      showCancelButton: true,
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
    });

    if (!res.isConfirmed) return;

    setSyncing((p) => ({ ...p, [c.id]: true }));
    try {
      await wait(3500);
      await swalFire({
        icon: "success",
        title: "Synced",
        text: `Synced "${c.name}" from Google Sheets.`,
        confirmButtonColor: "#f59e0b",
      });
    } finally {
      setSyncing((p) => ({ ...p, [c.id]: false }));
    }
  }

  async function handleSyncMobileFlow(c) {
    setMobileEdit({ open: false, companyId: null });
    await wait(60);

    const res = await Swal.fire({
      icon: "warning",
      title: "Sync from Google Sheets",
      text: "Are you sure you want to delete existing units and sync from the Sheet?",
      showCancelButton: true,
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      allowOutsideClick: true,
      allowEscapeKey: true,
    });

    if (!res.isConfirmed) {
      setMobileEdit({ open: true, companyId: c.id });
      return;
    }

    setMobileEdit({ open: true, companyId: c.id });
    setSyncing((p) => ({ ...p, [c.id]: true }));

    try {
      await wait(3500);

      setMobileEdit({ open: false, companyId: null });
      await wait(60);

      await swalFire({
        icon: "success",
        title: "Synced",
        text: `Synced "${c.name}" from Google Sheets.`,
        confirmButtonColor: "#f59e0b",
      });
    } finally {
      setSyncing((p) => ({ ...p, [c.id]: false }));
    }
  }

  // UPDATED: when uploading logo from MOBILE, close the modal first then show Swal. [web:22]
  async function handleLogoChange(c, file, opts = { fromMobile: false }) {
    if (!file) return;

    if (opts.fromMobile) {
      setMobileEdit({ open: false, companyId: null });
      await wait(60);
    }

    try {
      const logoUrl = await uploadLogoAjax(c.id, file);
      objectUrlRef.current.push(logoUrl);

      const baseLogo = baseline[c.id]?.logoUrl || "";
      if (normalizeVal(baseLogo) !== normalizeVal(logoUrl)) markDiff(c.id, "logoUrl", baseLogo, logoUrl);

      setRows((prev) => prev.map((x) => (x.id === c.id ? { ...x, logoUrl } : x)));

      await swalFire({
        icon: "success",
        title: "Logo updated",
        text: `Logo updated for "${c.name}".`,
        confirmButtonColor: "#f59e0b",
      });
    } catch {
      await swalFire({
        icon: "error",
        title: "Upload failed",
        text: "Could not upload logo.",
        confirmButtonColor: "#f59e0b",
      });

      // if it failed from mobile, reopen edit form so user isn't stuck
      if (opts.fromMobile) setMobileEdit({ open: true, companyId: c.id });
    }
  }

  async function handleConfigDone(payload) {
    if (!configCompany) return;

    if (payload.kind === "erp") {
      const before = baseline[configCompany.id]?.erp || {};
      const after = { ...(configCompany.erp || {}), ...payload.data };

      if (normalizeVal(JSON.stringify(before)) !== normalizeVal(JSON.stringify(after))) {
        markDiff(configCompany.id, "erp", "(previous)", "(updated)");
      }
      setRows((prev) => prev.map((c) => (c.id === configCompany.id ? { ...c, erp: after } : c)));
    }

    if (payload.kind === "gsheet") {
      const before = baseline[configCompany.id]?.gsheet || {};
      const after = { ...(configCompany.gsheet || {}), ...payload.data };

      if (normalizeVal(JSON.stringify(before)) !== normalizeVal(JSON.stringify(after))) {
        markDiff(configCompany.id, "gsheet", "(previous)", "(updated)");
      }
      setRows((prev) => prev.map((c) => (c.id === configCompany.id ? { ...c, gsheet: after } : c)));
    }

    closeConfig();
  }

  const [reopenMobileId, setReopenMobileId] = useState(null);

  function openConfigFromMobile(companyId) {
    setReopenMobileId(companyId);
    setMobileEdit({ open: false, companyId: null });
    setTimeout(() => openConfig(companyId), 60);
  }

  function closeConfigAndMaybeReopenMobile() {
    const id = reopenMobileId;
    closeConfig();
    setReopenMobileId(null);
    if (id) setTimeout(() => setMobileEdit({ open: true, companyId: id }), 80);
  }

  async function configOnDone(payload) {
    await handleConfigDone(payload);
    closeConfigAndMaybeReopenMobile();
  }

  const configOnClose = () => closeConfigAndMaybeReopenMobile();

  // kept for compatibility; not used to disable sync anymore
  function canSyncCompany(c) {
    if (!c || c.type !== "Google Sheets") return true;
    const g = c.gsheet || {};
    return !!(g.sheetUrl && g.gid && g.title);
  }

  return (
    <div className="lux-page manage-companies">
      <div className="lux-topbar mc-topbar">
        <div className="lux-title">Manage Companies</div>

        <button type="button" className="lux-create-btn mc-create" onClick={() => navigate("/create-company")}>
          <i className="fas fa-plus" aria-hidden="true" style={{ marginRight: 8 }}></i>
          Create Company
        </button>
      </div>

      <div className="luxs-filters mc-filters">
        <input className="lux-input mc-search" placeholder="Search Company Name..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {/* MOBILE LIST */}
      <div className="mc-mobile-list">
        {filtered.map((c) => (
          <div key={c.id} className="mc-mobile-row">
            <div className="mc-mobile-name">{c.name}</div>

            <button type="button" className="mc-mobile-edit" onClick={() => setMobileEdit({ open: true, companyId: c.id })} aria-label={`Edit ${c.name}`} title="Edit">
              <i className="fas fa-pen" aria-hidden="true"></i>
            </button>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE */}
      <div className="lux-scroll mc-scroll">
        <table className="lux-table mc-table">
          <thead>
            <tr>
              <th className="sticky-col">NAME</th>
              <th>LOGO</th>
              <th>JOINING DATE</th>
              <th>PROJECTS</th>
              <th>USERS</th>
              <th>ACTIVE</th>
              <th>TYPE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((c) => {
              const actions = actionsForType(c.type);

              return (
                <tr key={c.id}>
                  <td className="sticky-col">
                    <input className="lux-cell-input" value={c.name} onChange={(e) => updateCompany(c.id, { name: e.target.value })} />
                  </td>

                  <td>
                    <LogoPicker logoUrl={c.logoUrl} name={c.name} onPick={(file) => handleLogoChange(c, file, { fromMobile: false })} />
                  </td>

                  <td>
                    <input type="date" className="lux-cell-input" value={c.joining_date || ""} onChange={(e) => updateCompany(c.id, { joining_date: e.target.value })} />
                  </td>

                  <td>{c.projects}</td>
                  <td>{c.users}</td>

                  <td>
                    <input
                      type="checkbox"
                      checked={!!draftActive[c.id]}
                      onChange={(e) => {
                        const v = e.target.checked;
                        setDraftActive((p) => ({ ...p, [c.id]: v }));
                        const base = !!baseline[c.id]?.active;
                        if (v !== base) markDiff(c.id, "active", base, v);
                      }}
                    />
                  </td>

                  <td>
                    <select className="lux-cell-select" value={c.type} onChange={(e) => updateCompany(c.id, { type: e.target.value })}>
                      {TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <div className="mc-actions">
                      {actions.includes("save") ? (
                        <button type="button" className="btn btn-sm lux-btn" title="Save" onClick={() => handleSave(c)}>
                          Save
                        </button>
                      ) : null}

                      {actions.includes("config") ? (
                        <button
                          type="button"
                          className="btn btn-sm lux-btn warn"
                          title="Config"
                          onClick={() => openConfig(c.id)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
                        >
                          <i className="fas fa-gear" aria-hidden="true"></i>
                          Config
                        </button>
                      ) : null}

                      {actions.includes("sync") ? (
                        <button
                          type="button"
                          className={syncing[c.id] ? "btn btn-sm lux-btn syncing" : "btn btn-sm lux-btn sync"}
                          title="Sync"
                          onClick={() => handleSyncDesktop(c)}
                          disabled={!!syncing[c.id]}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            {syncing[c.id] ? <span className="mc-spinner" aria-hidden="true"></span> : null}
                            {syncing[c.id] ? "Syncing..." : "Sync"}
                          </span>
                        </button>
                      ) : null}

                      {actions.includes("delete") ? (
                        <button type="button" className="btn btn-sm lux-btn danger" title="Delete" onClick={() => handleDelete(c)}>
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfigModal open={config.open} company={configCompany} onClose={configOnClose} onDone={configOnDone} />

      <MobileEditModal
        open={mobileEdit.open}
        company={mobileCompany}
        draftActiveValue={mobileCompany ? draftActive[mobileCompany.id] : false}
        onClose={() => setMobileEdit({ open: false, companyId: null })}
        onChangeName={(v) => mobileCompany && updateCompany(mobileCompany.id, { name: v })}
        onChangeDate={(v) => mobileCompany && updateCompany(mobileCompany.id, { joining_date: v })}
        onUploadLogo={(file) => mobileCompany && handleLogoChange(mobileCompany, file, { fromMobile: true })}
        onChangeActive={(v) => {
          if (!mobileCompany) return;
          setDraftActive((p) => ({ ...p, [mobileCompany.id]: v }));
          const base = !!baseline[mobileCompany.id]?.active;
          if (v !== base) markDiff(mobileCompany.id, "active", base, v);
        }}
        onChangeType={(v) => mobileCompany && updateCompany(mobileCompany.id, { type: v })}
        onSave={async () => {
          if (!mobileCompany) return;
          setMobileEdit({ open: false, companyId: null });
          await wait(60);
          await handleSave(mobileCompany);
        }}
        onOpenConfig={() => {
          if (!mobileCompany) return;
          openConfigFromMobile(mobileCompany.id);
        }}
        onSync={async () => {
          if (!mobileCompany) return;
          await handleSyncMobileFlow(mobileCompany);
        }}
        onDelete={async () => {
          if (!mobileCompany) return;
          setMobileEdit({ open: false, companyId: null });
          await wait(60);
          await handleDelete(mobileCompany);
        }}
        syncing={mobileCompany ? !!syncing[mobileCompany.id] : false}
        canSync={mobileCompany ? canSyncCompany(mobileCompany) : true}
      />
    </div>
  );
}
