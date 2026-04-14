import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../ManageUsers/ManageUsers.css"; // reuse lux + mu styles
import "./CreateCompany.css";

const TYPES = ["Native", "ERP", "Google Sheets"];

function mockRequest(ok = true, delayMs = 400) {
  return new Promise((resolve, reject) => {
    setTimeout(() => (ok ? resolve({ ok: true }) : reject(new Error("Mock error"))), delayMs);
  });
}

export default function CreateCompany() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("Native");
  const [joiningDate, setJoiningDate] = useState("");
  const [active, setActive] = useState(true);
  const [, setLogoFile] = useState(null);

  const [gs, setGs] = useState({ sheetUrl: "", gid: "", title: "" });
  const [erp, setErp] = useState({
    mainUrl: "",
    mainKey: "",
    unitsUrl: "",
    unitsKey: "",
    holdUnitUrl: "",
    holdUnitKey: "",
    leadsUrl: "",
    leadsKey: "",
  });

  const isERP = type === "ERP";
  const isGS = type === "Google Sheets";

  async function handleSubmit(e) {
    e.preventDefault();

    // No SweetAlert on invalid: show native browser required messages
    if (formRef.current && !formRef.current.reportValidity()) return;

    await mockRequest(true);

    await Swal.fire({
      icon: "success",
      title: "Company Created",
      html: `<div style="text-align:center;line-height:1.7">
        <div>That's the company created.</div>
        <div><b>Name:</b> ${name}</div>
        <div><b>Type:</b> ${type}</div>
      </div>`,
      confirmButtonColor: "#f59e0b",
    });

    // reset
    setName("");
    setType("Native");
    setJoiningDate("");
    setActive(true);
    setLogoFile(null);
    setGs({ sheetUrl: "", gid: "", title: "" });
    setErp({
      mainUrl: "",
      mainKey: "",
      unitsUrl: "",
      unitsKey: "",
      holdUnitUrl: "",
      holdUnitKey: "",
      leadsUrl: "",
      leadsKey: "",
    });
  }

  // Build payload here when wiring up the real API call:
  // const payload = {
  //   name, type, joining_date: joiningDate, active, logo: logoFile || null,
  //   gsheet: isGS ? { sheetUrl: gs.sheetUrl, gid: gs.gid || null, title: gs.title || null } : null,
  //   erp: isERP ? { ...erp } : null,
  // };

  return (
    <div className="lux-page create-company-page">
      <div className="lux-topbar mc-topbar">
        <div className="lux-title">Create Company</div>
        <button
          type="button"
          className="btn btn-secondary back-btn"
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate("/ToP3/manage-companies");
          }}
          aria-label="Back"
        >
          <i className="fas fa-arrow-left" aria-hidden="true" style={{ marginRight: 8 }}></i>
          <span className="back-text">Back</span>
        </button>
      </div>

      <div className="cc-card">
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="cc-grid">
            {/* Name */}
            <label className="mu-label">
              Name
              <input
                className="mu-field"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            {/* Type */}
            <label className="mu-label">
              Company Type
              <select className="mu-field" value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            {/* Joining date */}
            <label className="mu-label">
              Joining Date
              <input
                className="mu-field"
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </label>

            {/* Upload logo (beside Joining Date) */}
            <label className="mu-label">
              Upload Logo
              <input
                className="mu-field"
                type="file"
                required
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
            </label>

            {/* Active */}
            <div className="cc-check-row">
              <label className="cc-check">
                <input
                  className="cc-check-input"
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <span className="cc-check-text">Active</span>
              </label>
            </div>

            {/* Google Sheets fields */}
            {isGS ? (
              <>
                <div className="cc-section-title">Google Sheets</div>

                <label className="mu-label">
                  Google Sheet URL
                  <input
                    className="mu-field"
                    type="url"
                    value={gs.sheetUrl}
                    onChange={(e) => setGs((p) => ({ ...p, sheetUrl: e.target.value }))}
                  />
                </label>

                <label className="mu-label">
                  Worksheet GID (optional)
                  <input
                    className="mu-field"
                    type="text"
                    value={gs.gid}
                    onChange={(e) => setGs((p) => ({ ...p, gid: e.target.value }))}
                  />
                </label>

                <label className="mu-label">
                  Worksheet Title (optional)
                  <input
                    className="mu-field"
                    type="text"
                    value={gs.title}
                    onChange={(e) => setGs((p) => ({ ...p, title: e.target.value }))}
                  />
                </label>
              </>
            ) : null}

            {/* ERP fields */}
            {isERP ? (
              <>
                <div className="cc-section-title">ERP</div>

                <label className="mu-label">
                  ERP System URL
                  <input
                    className="mu-field"
                    type="url"
                    value={erp.mainUrl}
                    onChange={(e) => setErp((p) => ({ ...p, mainUrl: e.target.value }))}
                  />
                </label>

                <label className="mu-label">
                  ERP System URL Key
                  <input
                    className="mu-field"
                    type="text"
                    value={erp.mainKey}
                    onChange={(e) => setErp((p) => ({ ...p, mainKey: e.target.value }))}
                  />
                </label>

                <label className="mu-label">
                  ERP System Units URL
                  <input
                    className="mu-field"
                    type="url"
                    value={erp.unitsUrl}
                    onChange={(e) => setErp((p) => ({ ...p, unitsUrl: e.target.value }))}
                  />
                </label>

                <label className="mu-label">
                  ERP System Units URL Key
                  <input
                    className="mu-field"
                    type="text"
                    value={erp.unitsKey}
                    onChange={(e) => setErp((p) => ({ ...p, unitsKey: e.target.value }))}
                  />
                </label>

                <label className="mu-label">
                  ERP System Unit URL
                  <input
                    className="mu-field"
                    type="url"
                    value={erp.holdUnitUrl}
                    onChange={(e) => setErp((p) => ({ ...p, holdUnitUrl: e.target.value }))}
                  />
                </label>

                <label className="mu-label">
                  ERP System Unit URL Key
                  <input
                    className="mu-field"
                    type="text"
                    value={erp.holdUnitKey}
                    onChange={(e) => setErp((p) => ({ ...p, holdUnitKey: e.target.value }))}
                  />
                </label>

                <label className="mu-label">
                  ERP System Leads URL
                  <input
                    className="mu-field"
                    type="url"
                    value={erp.leadsUrl}
                    onChange={(e) => setErp((p) => ({ ...p, leadsUrl: e.target.value }))}
                  />
                </label>

                <label className="mu-label">
                  ERP System Leads URL Key
                  <input
                    className="mu-field"
                    type="text"
                    value={erp.leadsKey}
                    onChange={(e) => setErp((p) => ({ ...p, leadsKey: e.target.value }))}
                  />
                </label>
              </>
            ) : null}
          </div>

          <div className="cc-actions">
            <button type="submit" className="btn btn-primary mu-save">
              Create Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}