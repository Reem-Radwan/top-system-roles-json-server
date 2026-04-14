// ─── ManageInventory.js ──────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./manageinventory.css";

// ─── API service (replaces mockUnits + mockCompanies) ────────────────────────
import { getCompanies, getUnitsByCompany, patchUnit } from "../../services/manageInventoryApi";
import { ROLES } from "../../data/permissions";

// ── Auth (unchanged) ─────────────────────────────────────────────────────────
function getStoredUser() {
  try { const r = localStorage.getItem("auth_user"); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

// ── Constants (all unchanged) ─────────────────────────────────────────────────
const STATUS_OPTS = [
  "Available","Blocked Development","Blocked Sales",
  "Blocked Cancelation","Contracted","Hold","Partner","Reserved","Unreleased",
];

const RANGE_FILTER_FIELDS = [
  "gross_area","net_area","internal_area","footprint","covered_terraces",
  "uncovered_terraces","penthouse_area","garage_area","basement_area",
  "common_area","roof_pergola_area","roof_terraces_area","bua","land_area",
  "garden_area","total_area","interest_free_unit_price","sales_value",
  "base_price","cash_price","contract_value","collected_amount",
  "total_premium_value","maintenance_value","gas","parking_price",
  "psm","net_area_psm","covered_terraces_psm","uncovered_terraces_psm",
  "penthouse_psm","garage_psm","basement_psm","common_area_psm",
  "roof_pergola_psm","roof_terraces_psm","land_psm","garden_psm",
  "base_psm","interest_free_psm",
];

const INITIAL_COLUMNS = [
  { title:"Unit Code",        field:"unit_code",                 visible:true,  fixed:true,  type:"input"  },
  { title:"Project",          field:"project",                   visible:true,              type:"input"  },
  { title:"City",             field:"city",                      visible:true,              type:"input"  },
  { title:"Building Number",  field:"building_number",           visible:true,              type:"input"  },
  { title:"Unit Type",        field:"unit_type",                 visible:true,              type:"input"  },
  { title:"Status",           field:"status",                    visible:true,  type:"select", options:STATUS_OPTS },
  { title:"Payment Plan Code",field:"payment_plan_code",         visible:false, type:"number" },
  { title:"Sales Phasing",    field:"sales_phasing",             visible:true,  type:"input"  },
  { title:"Interest Free Unit Price",field:"interest_free_unit_price",visible:true, type:"number", formatter:"money" },
  { title:"Sales Value",      field:"sales_value",               visible:true,  type:"number", formatter:"money" },
  { title:"Total Premium %",  field:"total_premium_percent",     visible:false, type:"number" },
  { title:"Reservation Date", field:"reservation_date",          visible:true,  type:"date"   },
  { title:"Owner",            field:"owner",                     visible:true,  type:"input"  },
  { title:"Contract Date",    field:"contract_date",             visible:false, type:"date"   },
  { title:"Creation Date",    field:"creation_date",             visible:false, type:"date"   },
  { title:"Delivery Date",    field:"delivery_date",             visible:false, type:"date"   },
  { title:"Development Delivery Date",field:"development_delivery_date",visible:true,type:"date"},
  { title:"Construction Delivery Date",field:"construction_delivery_date",visible:false,type:"date"},
  { title:"Client Handover Date",field:"client_handover_date",   visible:false, type:"date"   },
  { title:"Contract Delivery Date",field:"contract_delivery_date",visible:false, type:"date"  },
  { title:"Construction Phasing",field:"construction_phasing",   visible:false, type:"input"  },
  { title:"Handover Phasing", field:"handover_phasing",          visible:false, type:"input"  },
  { title:"Phasing",          field:"phasing",                   visible:false, type:"input"  },
  { title:"Unit Model",       field:"unit_model",                visible:false, type:"input"  },
  { title:"Plot Type",        field:"plot_type",                 visible:false, type:"input"  },
  { title:"Building Style",   field:"building_style",            visible:false, type:"input"  },
  { title:"Building Type",    field:"building_type",             visible:false, type:"input"  },
  { title:"Unit Position",    field:"unit_position",             visible:false, type:"input"  },
  { title:"Floor",            field:"floor",                     visible:false, type:"input"  },
  { title:"SAP Code",         field:"sap_code",                  visible:false, type:"input"  },
  { title:"ERP Code",         field:"erp_code",                  visible:false, type:"input"  },
  { title:"AMS",              field:"ams",                       visible:false, type:"input"  },
  { title:"Bedrooms",         field:"num_bedrooms",              visible:false, type:"number" },
  { title:"Bathrooms",        field:"num_bathrooms",             visible:false, type:"number" },
  { title:"Parking Slots",    field:"num_parking_slots",         visible:false, type:"number" },
  { title:"Mirror",           field:"mirror",                    visible:false, type:"input"  },
  { title:"Finishing Specs",  field:"finishing_specs",           visible:false, type:"input"  },
  { title:"Main View",        field:"main_view",                 visible:false, type:"input"  },
  { title:"Main View %",      field:"main_view_percent",         visible:false, type:"input"  },
  { title:"Secondary View",   field:"secondary_view",            visible:false, type:"input"  },
  { title:"Secondary View %", field:"secondary_view_percent",    visible:false, type:"input"  },
  { title:"Back View",        field:"back_view",                 visible:false, type:"input"  },
  { title:"Back View %",      field:"back_view_percent",         visible:false, type:"input"  },
  { title:"North Breeze",     field:"north_breeze",              visible:false, type:"input"  },
  { title:"North Breeze %",   field:"north_breeze_percent",      visible:false, type:"input"  },
  { title:"Levels",           field:"levels",                    visible:false, type:"input"  },
  { title:"Levels %",         field:"levels_percent",            visible:false, type:"input"  },
  { title:"Corners",          field:"corners",                   visible:false, type:"input"  },
  { title:"Corners %",        field:"corners_percent",           visible:false, type:"input"  },
  { title:"Accessibility",    field:"accessibility",             visible:false, type:"input"  },
  { title:"Accessibility %",  field:"accessibility_percent",     visible:false, type:"input"  },
  { title:"Gross Area",       field:"gross_area",                visible:true,  type:"number" },
  { title:"Net Area",         field:"net_area",                  visible:false, type:"number" },
  { title:"Internal Area",    field:"internal_area",             visible:false, type:"number" },
  { title:"Footprint",        field:"footprint",                 visible:false, type:"number" },
  { title:"Covered Terraces", field:"covered_terraces",          visible:false, type:"number" },
  { title:"Uncovered Terraces",field:"uncovered_terraces",       visible:false, type:"number" },
  { title:"Penthouse Area",   field:"penthouse_area",            visible:false, type:"number" },
  { title:"Garage Area",      field:"garage_area",               visible:false, type:"number" },
  { title:"Basement Area",    field:"basement_area",             visible:false, type:"number" },
  { title:"Common Area",      field:"common_area",               visible:false, type:"number" },
  { title:"Roof Pergola Area",field:"roof_pergola_area",         visible:false, type:"number" },
  { title:"Roof Terraces Area",field:"roof_terraces_area",       visible:false, type:"number" },
  { title:"BUA",              field:"bua",                       visible:false, type:"number" },
  { title:"Land Area",        field:"land_area",                 visible:false, type:"number" },
  { title:"Garden Area",      field:"garden_area",               visible:false, type:"number" },
  { title:"Total Area",       field:"total_area",                visible:false, type:"number" },
  { title:"Area Range",       field:"area_range",                visible:false, type:"input"  },
  { title:"Base Price",       field:"base_price",                visible:false, type:"number", formatter:"money" },
  { title:"Cash Price",       field:"cash_price",                visible:false, type:"number", formatter:"money" },
  { title:"Contract Value",   field:"contract_value",            visible:false, type:"number", formatter:"money" },
  { title:"Collected Amount", field:"collected_amount",          visible:false, type:"number", formatter:"money" },
  { title:"Collected %",      field:"collected_percent",         visible:false, type:"number" },
  { title:"Discount",         field:"discount",                  visible:false, type:"number", formatter:"money" },
  { title:"Total Premium Value",field:"total_premium_value",     visible:false, type:"number", formatter:"money" },
  { title:"Special Premiums", field:"special_premiums",          visible:false, type:"input"  },
  { title:"Special Discounts",field:"special_discounts",         visible:false, type:"input"  },
  { title:"Maintenance %",    field:"maintenance_percent",       visible:false, type:"number" },
  { title:"Maintenance Value",field:"maintenance_value",         visible:false, type:"number", formatter:"money" },
  { title:"Gas",              field:"gas",                       visible:false, type:"number", formatter:"money" },
  { title:"Parking Price",    field:"parking_price",             visible:false, type:"number", formatter:"money" },
  { title:"Club",             field:"club",                      visible:false, type:"input"  },
  { title:"PSM",              field:"psm",                       visible:false, type:"number", formatter:"money" },
  { title:"Net Area PSM",     field:"net_area_psm",              visible:false, type:"number", formatter:"money" },
  { title:"Covered Terraces PSM",field:"covered_terraces_psm",  visible:false, type:"number", formatter:"money" },
  { title:"Uncovered Terraces PSM",field:"uncovered_terraces_psm",visible:false,type:"number",formatter:"money" },
  { title:"Penthouse PSM",    field:"penthouse_psm",             visible:false, type:"number", formatter:"money" },
  { title:"Garage PSM",       field:"garage_psm",                visible:false, type:"number", formatter:"money" },
  { title:"Basement PSM",     field:"basement_psm",              visible:false, type:"number", formatter:"money" },
  { title:"Common Area PSM",  field:"common_area_psm",           visible:false, type:"number", formatter:"money" },
  { title:"Roof Pergola PSM", field:"roof_pergola_psm",          visible:false, type:"number", formatter:"money" },
  { title:"Roof Terraces PSM",field:"roof_terraces_psm",         visible:false, type:"number", formatter:"money" },
  { title:"Land PSM",         field:"land_psm",                  visible:false, type:"number", formatter:"money" },
  { title:"Garden PSM",       field:"garden_psm",                visible:false, type:"number", formatter:"money" },
  { title:"Base PSM",         field:"base_psm",                  visible:false, type:"number", formatter:"money" },
  { title:"Interest Free PSM",field:"interest_free_psm",         visible:false, type:"number", formatter:"money" },
  { title:"Interest Free Years",field:"interest_free_years",     visible:false, type:"number" },
  { title:"Down Payment %",   field:"down_payment_percent",      visible:false, type:"number" },
  { title:"Down Payment",     field:"down_payment",              visible:false, type:"number", formatter:"money" },
  { title:"Contract %",       field:"contract_percent",          visible:false, type:"number" },
  { title:"Contract Payment", field:"contract_payment",          visible:false, type:"number", formatter:"money" },
  { title:"Delivery %",       field:"delivery_percent",          visible:false, type:"number" },
  { title:"Delivery Payment", field:"delivery_payment",          visible:false, type:"number", formatter:"money" },
  { title:"Contract Payment Plan",field:"contract_payment_plan", visible:false, type:"input"  },
  { title:"Grace Period Months",field:"grace_period_months",     visible:false, type:"number" },
  { title:"Blocking Reason",  field:"blocking_reason",           visible:false, type:"input"  },
  { title:"Release Date",     field:"release_date",              visible:false, type:"date"   },
  { title:"Blocking Date",    field:"blocking_date",             visible:false, type:"date"   },
  { title:"Release Year",     field:"release_year",              visible:false, type:"number" },
  { title:"Sales Year",       field:"sales_year",                visible:false, type:"number" },
  { title:"Adj Status",       field:"adj_status",                visible:false, type:"input"  },
  { title:"Contractor Type",  field:"contractor_type",           visible:false, type:"input"  },
  { title:"Contractor",       field:"contractor",                visible:false, type:"input"  },
  { title:"Customer",         field:"customer",                  visible:false, type:"input"  },
  { title:"Broker",           field:"broker",                    visible:false, type:"input"  },
  { title:"Bulks",            field:"bulks",                     visible:false, type:"input"  },
  { title:"Direct/Indirect",  field:"direct_indirect_sales",     visible:false, type:"input"  },
];

// ── Helpers (all unchanged) ───────────────────────────────────────────────────
const isEmptyVal = (v) =>
  v === null || v === undefined || v === "" || v === "None" || v === "none";
const normalizeEmpty = (v) => (isEmptyVal(v) ? "(Empty)" : String(v));
const toNumber = (v) => {
  if (isEmptyVal(v)) return null;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? null : n;
};
const toDateMs = (v) => {
  if (isEmptyVal(v)) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d.getTime();
};
const toStr = (v) => (isEmptyVal(v) ? "" : String(v).toLowerCase());
const formatVal = (v, col) => {
  if (isEmptyVal(v)) return "";
  if (col.formatter === "money") {
    const n = parseFloat(String(v).replace(/,/g, ""));
    return isNaN(n) ? String(v) : n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  if (col.type === "date" && typeof v === "string") {
    const p = v.split("-");
    if (p.length === 3 && p[0].length === 4) return `${p[2]}-${p[1]}-${p[0]}`;
  }
  return v;
};
const sanitizeInput = (raw, col) => {
  let v = raw;
  if (typeof v === "string" && v.includes(",") && col?.type === "number")
    v = v.replace(/,/g, "");
  if (col?.type === "date" && v) {
    const p = v.split("-");
    if (p.length === 3 && p[2].length === 4) v = `${p[2]}-${p[1]}-${p[0]}`;
  }
  return v;
};

// ── Notification helpers (all unchanged) ──────────────────────────────────────
const fireToast = (icon, title, timer = 1500) => {
  if (window.Swal)
    window.Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer }).fire({ icon, title });
};
const fireAlert = (icon, title, text, timer, showConfirmButton) => {
  if (window.Swal) {
    if (timer !== undefined) window.Swal.fire({ icon, title, text, timer, showConfirmButton });
    else window.Swal.fire(title, text, icon);
  }
};

function ToastContainer({ toasts }) {
  const icons = { success: "✓", error: "✗", info: "ℹ" };
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.icon}`}>
          <span className="toast-icon">{icons[t.icon] || "ℹ"}</span>
          <span>{t.title}</span>
        </div>
      ))}
    </div>
  );
}

function AlertModal({ modal, onClose }) {
  if (!modal) return null;
  const emojis = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  return (
    <div className="alert-backdrop" onClick={onClose}>
      <div className="alert-box" onClick={(e) => e.stopPropagation()}>
        <div className="alert-icon">{emojis[modal.icon] || "ℹ️"}</div>
        <h3>{modal.title}</h3>
        {modal.text && <p>{modal.text}</p>}
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

// ── SVG Icons (all unchanged) ─────────────────────────────────────────────────
const IconBuilding = ({ size = 16, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 384 512" fill="currentColor" style={style}>
    <path d="M48 0C21.5 0 0 21.5 0 48V464c0 26.5 21.5 48 48 48h96V432c0-26.5 21.5-48 48-48s48 21.5 48 48v80h96c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48H48zM64 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V240zm112-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V240c0-8.8 7.2-16 16-16zm80 16c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V240zM80 96h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16zm80 16c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V112zm112-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16z"/>
  </svg>
);
const IconColumns = ({ size = 22 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 512 512" fill="currentColor">
    <path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zm64 0v64H192V96H64zm0 128v64H192V224H64zm0 128v64H192V352H64zm192-256V224H448V96H256zm0 128v64H448V224H256zm0 128v64H448V352H256z"/>
  </svg>
);
const IconExcel = ({ size = 15 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 384 512" fill="currentColor">
    <path d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48zm212-240h-28.8l-36.4 67.7-32.5-67.7H131l54.6 104.1L128.7 432H157l39-72.3 37.4 72.3h31.5l-58-106.6L260 224z"/>
  </svg>
);

// ── Filter Menu ───────────────────────────────────────────────────────────────
function FilterMenu({ menu, columns, filteredDataForColumn, activeFilters, rangeFilterValues,
  onUpdateFilter, onUpdateDateFilter, onRangeInput, onApplyRange, onSelectAll, onClose }) {
  const [searchTxt, setSearchTxt] = useState("");
  const [rangeMin, setRangeMin]   = useState("");
  const [rangeMax, setRangeMax]   = useState("");
  const [openYears, setOpenYears] = useState({});

  const field  = menu?.field  ?? "";
  const colIdx = menu?.colIdx ?? 0;
  const top    = menu?.top    ?? 0;
  const left   = menu?.left   ?? 0;
  const colDef = columns[colIdx] ?? { title: "", type: "input", field: "" };
  const isRange = RANGE_FILTER_FIELDS.includes(field);

  useEffect(() => {
    if (!menu) return;
    const cur = rangeFilterValues[field] || { min: "", max: "" };
    setRangeMin(cur.min); setRangeMax(cur.max);
  }, [field, rangeFilterValues, menu]);

  const contextData = field ? filteredDataForColumn(field) : [];
  if (!menu) return null;

  const numericVals = contextData.map((r) => parseFloat(r[field])).filter((v) => !isNaN(v));
  const dataMin = numericVals.length ? Math.min(...numericVals) : 0;
  const dataMax = numericVals.length ? Math.max(...numericVals) : 0;
  const distinctVals = [...new Set(contextData.map((r) => normalizeEmpty(r[field])))].sort();
  const af = activeFilters[field] || [];

  const MONTH_ORDER = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];

  const buildDateMap = () => {
    const map = {};
    contextData.forEach((r) => {
      if (!r[field]) return;
      const d = new Date(r[field]);
      if (isNaN(d)) return;
      const y = d.getFullYear();
      const m = d.toLocaleString("default", { month: "long" });
      if (!map[y]) map[y] = {};
      if (!map[y][m]) map[y][m] = [];
      map[y][m].push(r[field]);
    });
    return map;
  };
  const dateMap     = colDef.type === "date" ? buildDateMap() : {};
  const sortedYears = Object.keys(dateMap).sort((a, b) => b - a);
  const toggleYear  = (y) => setOpenYears((prev) => ({ ...prev, [y]: !prev[y] }));
  const filt        = searchTxt.toLowerCase();

  return (
    <div className="filter-menu active" style={{ top, left, position: "fixed" }} onClick={(e) => e.stopPropagation()}>
      <div className="filter-header">
        <h4>Filter: {colDef.title}</h4>
        <span style={{ cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 4px" }} onClick={onClose}>✕</span>
      </div>

      {isRange && (
        <div className="range-filter-container">
          <div className="range-input-group">
            <label>Min:</label>
            <input type="number" className="range-input" placeholder="Minimum" value={rangeMin}
              onChange={(e) => { setRangeMin(e.target.value); onRangeInput(field, "min", e.target.value); }} />
          </div>
          <div className="range-placeholder">Min: {dataMin.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
          <div className="range-input-group">
            <label>Max:</label>
            <input type="number" className="range-input" placeholder="Maximum" value={rangeMax}
              onChange={(e) => { setRangeMax(e.target.value); onRangeInput(field, "max", e.target.value); }} />
          </div>
          <div className="range-placeholder">Max: {dataMax.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
          <button className="range-apply-btn" onClick={() => { onApplyRange(field); onClose(); }}>Apply Range Filter</button>
        </div>
      )}

      {!isRange && colDef.type === "date" && (
        <>
          <div className="filter-body">
            <input className="filter-search" placeholder="Search..." value={searchTxt} onChange={(e) => setSearchTxt(e.target.value)} />
            {sortedYears.filter((y) => String(y).includes(filt) || Object.keys(dateMap[y]).some((m) => m.toLowerCase().includes(filt))).map((y) => (
              <div className="year-group" key={y}>
                <div className="year-header" onClick={() => toggleYear(y)}>
                  <label onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox"
                      onChange={(e) => {
                        const allDates = Object.values(dateMap[y]).flat();
                        const cur = activeFilters[field] || [];
                        const next = e.target.checked ? [...new Set([...cur, ...allDates])] : cur.filter((d) => !allDates.includes(d));
                        onUpdateDateFilter(field, next);
                      }}
                      checked={Object.values(dateMap[y]).flat().every((d) => (activeFilters[field] || []).includes(d))}
                    /> {y}
                  </label>
                  <i className={`year-toggle ${openYears[y] ? "open" : ""}`}>▼</i>
                </div>
                <div className={`month-container ${openYears[y] ? "show" : ""}`}>
                  {[...Object.keys(dateMap[y])].sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)).filter((m) => m.toLowerCase().includes(filt)).map((m) => {
                    const dates   = dateMap[y][m];
                    const checked = dates.every((d) => (activeFilters[field] || []).includes(d));
                    return (
                      <label className="month-item" key={m}>
                        <input type="checkbox" checked={checked}
                          onChange={(e) => {
                            const cur  = activeFilters[field] || [];
                            const next = e.target.checked ? [...new Set([...cur, ...dates])] : cur.filter((d) => !dates.includes(d));
                            onUpdateDateFilter(field, next);
                          }} /> {m}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="filter-actions">
            <button className="action-btn btn-sm" onClick={() => onSelectAll(field, true, "date")}>Select All</button>
            <button className="action-btn btn-secondary btn-sm" onClick={() => onSelectAll(field, false, "date")}>Clear</button>
          </div>
        </>
      )}

      {!isRange && colDef.type !== "date" && (
        <>
          <div className="filter-body">
            <input className="filter-search" placeholder="Search..." value={searchTxt} onChange={(e) => setSearchTxt(e.target.value)} />
            <div className="filter-options">
              {distinctVals.filter((v) => v.toLowerCase().includes(filt)).map((v) => {
                const checked = af.length === 0 || af.includes(v);
                return (
                  <label key={v}>
                    <input type="checkbox" value={v} checked={checked}
                      onChange={() => {
                        let next;
                        if (checked) { const base = af.length === 0 ? distinctVals : af; next = base.filter((x) => x !== v); }
                        else next = [...af, v];
                        onUpdateFilter(field, next.length === distinctVals.length ? [] : next);
                      }} /> {v}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="filter-actions">
            <button className="action-btn btn-sm" onClick={() => onSelectAll(field, true)}>Select All</button>
            <button className="action-btn btn-secondary btn-sm" onClick={() => onSelectAll(field, false)}>Clear</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Column Panel (unchanged) ──────────────────────────────────────────────────
function ColumnPanel({ open, columns, onClose, onToggleCol, onSelectAll, colSearch, setColSearch }) {
  const filt = colSearch.toLowerCase();
  return (
    <div className={`column-panel ${open ? "active" : ""}`} id="columnPanel">
      <div className="panel-head">
        <h3><IconColumns size={20} style={{ marginRight: 8, verticalAlign: "middle" }} /> Columns</h3>
        <button className="panel-close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="panel-search-row">
        <input type="text" className="panel-search" placeholder="Search columns..." value={colSearch} onChange={(e) => setColSearch(e.target.value)} />
        <div className="panel-btn-row">
          <button className="action-btn btn-sm" style={{ flex: 1 }} onClick={() => onSelectAll(true)}>Select All</button>
          <button className="action-btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onSelectAll(false)}>Deselect All</button>
        </div>
      </div>
      <div className="panel-body">
        {columns.map((col, i) =>
          col.title.toLowerCase().includes(filt) ? (
            <div className="col-item" key={col.field}>
              <label>
                <input type="checkbox" checked={col.visible} onChange={() => onToggleCol(i)} disabled={col.fixed} />
                {col.title}
              </label>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// ── Pagination (unchanged) ────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onNav }) {
  if (totalPages <= 1) return null;
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    if (left > 1) { pages.push(1); if (left > 2) pages.push("..."); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) { if (right < totalPages - 1) pages.push("..."); pages.push(totalPages); }
    return pages;
  };
  return (
    <div className="pagination-right">
      <button className="page-btn" disabled={currentPage === 1} onClick={() => onNav(1)}>«</button>
      <button className="page-btn" disabled={currentPage === 1} onClick={() => onNav(currentPage - 1)}>‹</button>
      {getPageNumbers().map((p, i) =>
        p === "..." ? <span key={`e-${i}`} className="page-ellipsis">…</span>
          : <button key={p} className={`page-btn${p === currentPage ? " page-btn-active" : ""}`} onClick={() => onNav(p)}>{p}</button>
      )}
      <button className="page-btn" disabled={currentPage === totalPages} onClick={() => onNav(currentPage + 1)}>›</button>
      <button className="page-btn" disabled={currentPage === totalPages} onClick={() => onNav(totalPages)}>»</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function ManageInventory() {
  const user         = getStoredUser();
  const userRole     = user?.role ?? "";
  const isSalesOps   = userRole === ROLES.SALES_OPERATION;
  const isController = userRole === ROLES.MANAGER;
  const allowedFields = ["status", "owner", "reservation_date", "sales_phasing"];

  // ── companies loaded from API ─────────────────────────────────────────────
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(err => console.error('Failed to load companies:', err));
  }, []);

  // ── userCompanyName derived from API companies state ──────────────────────
  const userCompanyId   = user?.company_id ?? null;
  const userCompanyName = userCompanyId
    ? (companies.find(c => c.id === userCompanyId)?.name ?? "")
    : "";

  const [selectedCompany, setSelectedCompany] = useState("");
  // ── FIX: removed unused selectedCompanyId state; companyId is kept locally
  //    in handlers via the `companies` lookup instead ─────────────────────────
  const [filteredData,    setFilteredData]    = useState([]);
  const [activeFilters,   setActiveFilters]   = useState({});
  const [rangeFilters,    setRangeFilters]    = useState({});
  const [sortState,       setSortState]       = useState({ field: null, dir: 0 });
  const [columns,         setColumns]         = useState(INITIAL_COLUMNS);
  const [currentPage,     setCurrentPage]     = useState(1);
  const [pageSize,        setPageSize]        = useState(500);
  const [filterMenu,      setFilterMenu]      = useState(null);
  const [colPanelOpen,    setColPanelOpen]    = useState(false);
  const [colSearch,       setColSearch]       = useState("");
  const [toasts,          setToasts]          = useState([]);
  const [alertModal,      setAlertModal]      = useState(null);
  const [highlightedCells,setHighlightedCells]= useState(new Set());
  const [renderKey]                           = useState(0);
  const [dataLoading,     setDataLoading]     = useState(false);

  const allDataRef        = useRef([]);
  const undoStackRef      = useRef([]);
  const dragRef           = useRef({ isDragging: false, dragStart: null, dragSelection: [], mouseY: 0 });
  const multiSelectRef    = useRef({ selection: [], field: null });
  const preEditRef        = useRef(null);
  const rangeTimerRef     = useRef(null);
  const tableContainerRef = useRef(null);
  const filteredDataRef   = useRef([]);

  useEffect(() => { filteredDataRef.current = filteredData; }, [filteredData]);

  const loadCompany = useCallback(async (companyName, companyId) => {
    if (!companyId) { allDataRef.current = []; setFilteredData([]); return; }
    setDataLoading(true);
    try {
      const units = await getUnitsByCompany(companyId);
      allDataRef.current = units.map(u => ({ ...u }));
      applyAllFilters(companyName, {}, {});
    } catch (err) {
      console.error('Failed to load units:', err);
    } finally {
      setDataLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── auto-load uses companyId, waits for companies to load ─────────────────
  useEffect(() => {
    if (userCompanyId && userCompanyName) {
      setSelectedCompany(userCompanyName);
      loadCompany(userCompanyName, userCompanyId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCompanyName]);

  const fallbackToast = useCallback((icon, title, timer = 1500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, icon, title }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), timer);
  }, []);

  const showToast = useCallback((icon, title, timer = 1500) => {
    if (window.Swal) fireToast(icon, title, timer); else fallbackToast(icon, title, timer);
  }, [fallbackToast]);

  const showAlert = useCallback((title, text, icon) => {
    if (window.Swal) fireAlert(icon, title, text); else setAlertModal({ title, text, icon });
  }, []);

  const showSuccessPopup = useCallback(({ title, text, timer = 1500 }) => {
    if (window.Swal) fireAlert("success", title, text, timer, false);
    else fallbackToast("success", text ? `${title} — ${text}` : title, timer);
  }, [fallbackToast]);

  const showUnitCodeProtectedMsg = useCallback(() => {
    if (window.Swal) {
      window.Swal.fire({
        icon: "warning", title: "Protected Field",
        text: "Unit Code cannot be edited or deleted.",
        timer: 2200, showConfirmButton: false, toast: false,
      });
    } else {
      fallbackToast("info", "Unit Code cannot be edited or deleted.", 2500);
    }
  }, [fallbackToast]);

  const applyAllFilters = useCallback((company, afOverride, rfOverride) => {
    const af = afOverride ?? activeFilters;
    const rf = rfOverride ?? rangeFilters;
    const result = allDataRef.current.filter((row) => {
      for (const key in af) {
        const required = af[key];
        if (!required || required.length === 0) continue;
        if (RANGE_FILTER_FIELDS.includes(key) && rf[key]) continue;
        const cellVal = normalizeEmpty(row[key]);
        if (!required.includes(cellVal)) return false;
      }
      for (const key in rf) {
        const { min, max } = rf[key] || {};
        if ((min === "" || min === undefined) && (max === "" || max === undefined)) continue;
        const n = parseFloat(row[key]);
        if (isNaN(n)) return false;
        if (min !== "" && min !== undefined && n < parseFloat(min)) return false;
        if (max !== "" && max !== undefined && n > parseFloat(max)) return false;
      }
      return true;
    });
    setFilteredData(result); filteredDataRef.current = result; setCurrentPage(1);
  }, [activeFilters, rangeFilters]);

  const filteredDataForColumn = useCallback((targetField) => {
    return allDataRef.current.filter((row) => {
      for (const key in activeFilters) {
        if (key === targetField) continue;
        const required = activeFilters[key];
        if (!required || required.length === 0) continue;
        const cellVal = normalizeEmpty(row[key]);
        if (!required.includes(cellVal)) return false;
      }
      for (const key in rangeFilters) {
        if (key === targetField) continue;
        const { min, max } = rangeFilters[key] || {};
        if ((min === "" || min === undefined) && (max === "" || max === undefined)) continue;
        const n = parseFloat(row[key]);
        if (isNaN(n)) return false;
        if (min !== "" && min !== undefined && n < parseFloat(min)) return false;
        if (max !== "" && max !== undefined && n > parseFloat(max)) return false;
      }
      return true;
    });
  }, [activeFilters, rangeFilters]);

  const applySorting = useCallback((data, ss) => {
    if (!ss.field || ss.dir === 0) return data;
    const colDef = INITIAL_COLUMNS.find((c) => c.field === ss.field) || { field: ss.field, type: "input" };
    const isNum  = colDef.type === "number" || colDef.formatter === "money" || RANGE_FILTER_FIELDS.includes(ss.field);
    const isDate = colDef.type === "date";
    return [...data].sort((a, b) => {
      const va = a[ss.field], vb = b[ss.field];
      const ea = isEmptyVal(va), eb = isEmptyVal(vb);
      if (ea && eb) return 0; if (ea) return 1; if (eb) return -1;
      let cmp = 0;
      if (isNum) { const na = toNumber(va), nb = toNumber(vb); if (na === null && nb === null) cmp = 0; else if (na === null) cmp = 1; else if (nb === null) cmp = -1; else cmp = na - nb; }
      else if (isDate) { const da = toDateMs(va), db = toDateMs(vb); cmp = (da ?? Infinity) - (db ?? Infinity); }
      else cmp = toStr(va).localeCompare(toStr(vb));
      return cmp * ss.dir;
    });
  }, []);

  const sortedData = applySorting(filteredData, sortState);
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const safePage   = Math.min(currentPage, totalPages || 1);
  const start      = (safePage - 1) * pageSize;
  const pageData   = sortedData.slice(start, start + pageSize);

  const toggleSort = (field) => {
    clearMultiSelectHighlight();
    setSortState((prev) => {
      if (prev.field !== field) return { field, dir: 1 };
      if (prev.dir === 1)  return { field, dir: -1 };
      if (prev.dir === -1) return { field: null, dir: 0 };
      return { field, dir: 1 };
    });
  };

  const isEditable = (field) => {
    if (isController) return false;
    if (isSalesOps && !allowedFields.includes(field)) return false;
    return true;
  };

  const saveCell = useCallback((actualIdx, field, rawNewVal) => {
    if (field === "unit_code") return;
    const row = sortedData[actualIdx];
    if (!row) return;
    const colDef = INITIAL_COLUMNS.find((c) => c.field === field);
    const newVal = sanitizeInput(rawNewVal, colDef);
    const oldVal = row[field];
    if (newVal === oldVal) return;
    if (isEmptyVal(oldVal) && (newVal === "" || newVal === null)) return;
    undoStackRef.current.push({ type: "single", snapshots: [{ unit_code: row.unit_code, field, value: oldVal }] });
    if (undoStackRef.current.length > 10) undoStackRef.current.shift();
    const unit = allDataRef.current.find((u) => u.unit_code === row.unit_code);
    if (unit) unit[field] = newVal;
    applyAllFilters();
    showToast("success", "Saved", 1500);
    patchUnit(row.id, field, newVal)
      .catch(err => console.error('Failed to save cell:', err));
  }, [sortedData, applyAllFilters, showToast]);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) { showToast("info", "Nothing to Undo", 1500); return; }
    const action = undoStackRef.current.pop();
    action.snapshots.forEach(({ unit_code, field, value }) => {
      const unit = allDataRef.current.find((u) => u.unit_code === unit_code);
      if (unit) unit[field] = value;
    });
    applyAllFilters();
    showToast("success", `Undo Successful (${undoStackRef.current.length} remaining)`, 2000);
  }, [applyAllFilters, showToast]);

  const clearMultiSelectHighlight = () => {
    multiSelectRef.current = { selection: [], field: null };
    setHighlightedCells(new Set());
  };

  const handleMultiSelectDown = useCallback((rowIdx, field) => {
    if (field === "unit_code") { showUnitCodeProtectedMsg(); return; }
    multiSelectRef.current.selection = [];
    multiSelectRef.current.field = field;
    const endIdx = start + pageData.length;
    const newHL  = new Set();
    for (let i = rowIdx; i < endIdx; i++) { multiSelectRef.current.selection.push(i); newHL.add(`${i}-${field}`); }
    setHighlightedCells(newHL);
  }, [start, pageData.length, showUnitCodeProtectedMsg]);

  const handleDeleteSelection = useCallback(() => {
    const { selection, field } = multiSelectRef.current;
    if (!selection.length || !field) return;
    if (field === "unit_code") { showUnitCodeProtectedMsg(); return; }
    const snapshots = selection.map((idx) => ({ unit_code: sortedData[idx].unit_code, field, value: sortedData[idx][field] }));
    undoStackRef.current.push({ type: "batch", snapshots });
    if (undoStackRef.current.length > 10) undoStackRef.current.shift();
    selection.forEach((idx) => {
      const unit = allDataRef.current.find((u) => u.unit_code === sortedData[idx].unit_code);
      if (unit) {
        unit[field] = "";
        patchUnit(unit.id, field, "")
          .catch(err => console.error('Failed to clear cell:', err));
      }
    });
    const count = selection.length;
    clearMultiSelectHighlight();
    applyAllFilters();
    showSuccessPopup({ title: "Deleted", text: `Cleared ${count} cells.`, timer: 1000 });
  }, [sortedData, applyAllFilters, showSuccessPopup, showUnitCodeProtectedMsg]);

  const startDrag = useCallback((e, actualIdx, field) => {
    if (field === "unit_code") { showUnitCodeProtectedMsg(); return; }
    e.preventDefault();
    dragRef.current.isDragging    = true;
    dragRef.current.dragStart     = { rowIdx: actualIdx, field, val: sortedData[actualIdx][field] };
    dragRef.current.dragSelection = [actualIdx];
    dragRef.current.mouseY        = e.clientY;
    const onMove = (ev) => {
      if (!dragRef.current.isDragging) return;
      dragRef.current.mouseY = ev.clientY;
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const td = el?.closest("td[data-row]");
      if (td && td.dataset.field === dragRef.current.dragStart.field) {
        const curr = parseInt(td.dataset.row);
        const { rowIdx: sRow } = dragRef.current.dragStart;
        const lo = Math.min(sRow, curr), hi = Math.max(sRow, curr);
        dragRef.current.dragSelection = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
        setHighlightedCells(new Set(dragRef.current.dragSelection.map((i) => `${i}-${dragRef.current.dragStart.field}-drag`)));
      }
      const container = tableContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        if (ev.clientY > rect.bottom - 50) container.scrollTop += 15;
        else if (ev.clientY < rect.top + 50) container.scrollTop -= 15;
      }
    };
    const onUp = () => {
      dragRef.current.isDragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (dragRef.current.dragSelection.length > 1) {
        const { field: f, val } = dragRef.current.dragStart;
        const colDef   = INITIAL_COLUMNS.find((c) => c.field === f);
        const cleanVal = sanitizeInput(val, colDef);
        const snapshots = dragRef.current.dragSelection.map((idx) => ({ unit_code: sortedData[idx].unit_code, field: f, value: sortedData[idx][f] }));
        undoStackRef.current.push({ type: "batch", snapshots });
        if (undoStackRef.current.length > 10) undoStackRef.current.shift();
        dragRef.current.dragSelection.forEach((idx) => {
          const unit = allDataRef.current.find((u) => u.unit_code === sortedData[idx].unit_code);
          if (unit) {
            unit[f] = cleanVal;
            patchUnit(unit.id, f, cleanVal)
              .catch(err => console.error('Failed to drag-fill cell:', err));
          }
        });
        const count = dragRef.current.dragSelection.length;
        setHighlightedCells(new Set());
        applyAllFilters();
        showSuccessPopup({ title: "Bulk Update", text: `Updated ${count} units!`, timer: 1500 });
      } else { setHighlightedCells(new Set()); }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [sortedData, applyAllFilters, showSuccessPopup, showUnitCodeProtectedMsg]);

  const handleUpdateFilter = (field, vals) => { const next = { ...activeFilters, [field]: vals }; setActiveFilters(next); applyAllFilters(undefined, next, undefined); };
  const handleUpdateDateFilter = (field, vals) => { const next = { ...activeFilters, [field]: vals }; setActiveFilters(next); applyAllFilters(undefined, next, undefined); };
  const handleRangeInput = (field, type, value) => {
    const next = { ...rangeFilters, [field]: { ...(rangeFilters[field] || {}), [type]: value } };
    setRangeFilters(next);
    clearTimeout(rangeTimerRef.current);
    rangeTimerRef.current = setTimeout(() => applyAllFilters(undefined, undefined, next), 500);
  };
  const handleApplyRange  = () => applyAllFilters();
  const handleSelectAll   = (field, selectAll, type) => {
    if (type === "date") handleUpdateDateFilter(field, selectAll ? filteredDataForColumn(field).map((r) => r[field]).filter(Boolean) : []);
    else handleUpdateFilter(field, selectAll ? [] : ["__none_matches__"]);
  };
  const hasActiveFilter = (field) => {
    if (rangeFilters[field]) { const { min, max } = rangeFilters[field]; if (min !== "" && min !== undefined) return true; if (max !== "" && max !== undefined) return true; }
    return !!(activeFilters[field] && activeFilters[field].length > 0);
  };

  const exportToExcel = () => {
    if (!sortedData.length) { if (window.Swal) window.Swal.fire("Info", "No data to export", "info"); else showAlert("Info", "No data to export", "info"); return; }
    const doExport = () => {
      const XLSX = window.XLSX;
      const visCols = columns.filter((c) => c.visible);
      const rows = sortedData.map((row) => { const obj = {}; visCols.forEach((c) => { obj[c.title] = row[c.field] ?? ""; }); return obj; });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory");
      XLSX.writeFile(wb, "Inventory_Export.xlsx");
    };
    if (window.XLSX) doExport();
    else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.onload = doExport;
      script.onerror = () => showAlert("Error", "Failed to load XLSX library.", "error");
      document.head.appendChild(script);
    }
  };

  const toggleCol     = (idx) => setColumns((prev) => prev.map((c, i) => i === idx ? { ...c, visible: !c.visible } : c));
  const selectAllCols = (state) => setColumns((prev) => prev.map((c) => c.fixed ? c : { ...c, visible: state }));

  useEffect(() => {
    if (!window.Swal) { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11"; document.head.appendChild(s); }
    if (!window.XLSX) { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; document.head.appendChild(s); }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "ArrowDown") {
        e.preventDefault();
        const td = document.activeElement?.closest("td[data-row]");
        if (td) {
          if (td.dataset.field === "unit_code") { showUnitCodeProtectedMsg(); return; }
          handleMultiSelectDown(parseInt(td.dataset.row), td.dataset.field);
        }
      }
      if (e.key === "Delete") {
        e.preventDefault();
        const td = document.activeElement?.closest("td[data-row]");
        if (td && td.dataset.field === "unit_code") { showUnitCodeProtectedMsg(); return; }
        handleDeleteSelection();
      }
    };
    const handleClickOutside = (e) => {
      if (!e.target.closest("td") && !e.target.closest(".filter-menu")) clearMultiSelectHighlight();
      if (!e.target.closest(".filter-menu") && !e.target.closest(".filter-btn")) setFilterMenu(null);
      const panel = document.getElementById("columnPanel");
      const btn   = document.getElementById("toggleColBtn");
      if (colPanelOpen && panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) setColPanelOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside);
    return () => { document.removeEventListener("keydown", handleKeyDown); document.removeEventListener("click", handleClickOutside); };
  }, [handleUndo, handleMultiSelectDown, handleDeleteSelection, colPanelOpen, showUnitCodeProtectedMsg]);

  const showFilter = (e, field, colIdx) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    let left = rect.left;
    if (window.innerWidth - left < 300) left = window.innerWidth - 320;
    setFilterMenu({ field, colIdx, top: rect.bottom + 5, left });
  };

  const isDragHL  = (actualIdx, field) => highlightedCells.has(`${actualIdx}-${field}-drag`);
  const isMultiHL = (actualIdx, field) => highlightedCells.has(`${actualIdx}-${field}`);
  const visCols   = columns.filter((c) => c.visible);

  return (
    <div className="inventory-container">
      {!window.Swal && <ToastContainer toasts={toasts} />}
      {!window.Swal && <AlertModal modal={alertModal} onClose={() => setAlertModal(null)} />}

      {/* ── Header ── */}
      <div className="inv-header">
        <h1>
          <IconBuilding size={26} style={{ color: "#6c757d", flexShrink: 0 }} />
          Manage Inventory
        </h1>
        <div className="header-controls">
          <div className="company-select-wrapper">
            <label>
              <IconBuilding size={14} style={{ color: "#6c757d", marginRight: 4, verticalAlign: "middle" }} />
              Company:
            </label>
            {/* FIX: use inline comp lookup instead of selectedCompanyId state */}
            <select className="company-select" value={selectedCompany}
              onChange={(e) => {
                const compName = e.target.value;
                const comp = companies.find(c => c.name === compName);
                setSelectedCompany(compName);
                setActiveFilters({});
                setRangeFilters({});
                loadCompany(compName, comp?.id ?? null);
              }}>
              {!userCompanyName && <option value="">Select Company...</option>}
              {companies.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <button className="action-btn btn-excel" onClick={exportToExcel}>
            <IconExcel size={20} /> Excel
          </button>

          <button className="action-btn" id="toggleColBtn" onClick={() => setColPanelOpen((v) => !v)}>
            <IconColumns size={23} /> Columns
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="main-content">
        <div className="table-wrapper">

          {!selectedCompany ? (
            <div className="no-company-placeholder">
              Please select a company to view inventory.
            </div>
          ) : dataLoading ? (
            <div className="no-company-placeholder">Loading units…</div>
          ) : (
            <>
              <div className="table-container" ref={tableContainerRef}>
                <table className="inv-table" key={renderKey}>
                  <thead className="inv-thead">
                    <tr>
                      {visCols.map((col) => {
                        const isSorted  = sortState.field === col.field && sortState.dir !== 0;
                        const indicator = isSorted ? (sortState.dir === 1 ? "▲" : "▼") : "↕";
                        return (
                          <th key={col.field}
                            className={"inv-th sortable" + (col.fixed ? " th-fixed" : "") + (isSorted ? ` sorted ${sortState.dir === 1 ? "sorted-asc" : "sorted-desc"}` : "")}
                            style={col.fixed ? { left: 0 } : {}}
                            onClick={() => toggleSort(col.field)}>
                            <div className="header-cell">
                              <span className="header-title-wrap">
                                <span className="header-title">{col.title}</span>
                                <span className="sort-indicator">{indicator}</span>
                              </span>
                              <button className={`filter-btn${hasActiveFilter(col.field) ? " active-filter" : ""}`}
                                onClick={(e) => showFilter(e, col.field, columns.indexOf(col))} title="Filter">▼</button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="inv-tbody">
                    {pageData.length === 0 ? (
                      <tr><td colSpan={visCols.length} className="no-data">No records found.</td></tr>
                    ) : (
                      pageData.map((row, idx) => {
                        const actualIdx = start + idx;
                        return (
                          <tr key={row.unit_code}>
                            {visCols.map((col) => {
                              const editable   = isEditable(col.field);
                              const isUnitCode = col.field === "unit_code";
                              const rawVal  = row[col.field];
                              const dispVal = String(formatVal(rawVal, col) ?? "");
                              const isDrag  = isDragHL(actualIdx, col.field);
                              const isMulti = isMultiHL(actualIdx, col.field);
                              const tdClass =
                                "inv-td" +
                                (col.fixed ? " td-fixed" : "") +
                                (isDrag  ? " drag-highlight" : "") +
                                (isMulti ? " multi-select-highlight" : "");
                              return (
                                <td key={col.field} className={tdClass}
                                  style={col.fixed ? { left: 0 } : {}}
                                  data-row={actualIdx} data-field={col.field}>
                                  {col.type === "select" ? (
                                    !editable ? (
                                      <span className="cell-content readonly">{dispVal}</span>
                                    ) : (
                                      <select className="cell-select" defaultValue={rawVal ?? ""}
                                        onFocus={() => { preEditRef.current = rawVal; clearMultiSelectHighlight(); }}
                                        onChange={(e) => saveCell(actualIdx, col.field, e.target.value)}>
                                        {col.options.map((o) => <option key={o} value={o}>{o}</option>)}
                                      </select>
                                    )
                                  ) : isUnitCode ? (
                                    <div
                                      className="cell-content"
                                      contentEditable={true}
                                      suppressContentEditableWarning
                                      key={`${row.unit_code}-unit_code-${dispVal}`}
                                      dangerouslySetInnerHTML={{ __html: dispVal }}
                                      onFocus={() => { preEditRef.current = dispVal; clearMultiSelectHighlight(); }}
                                      onBlur={(e) => {
                                        const typed = e.currentTarget.innerText.trim();
                                        if (typed !== preEditRef.current) {
                                          e.currentTarget.innerText = preEditRef.current ?? "";
                                          if (window.Swal) {
                                            window.Swal.fire({ icon: "error", title: "Error", text: "Unit Code cannot be changed.", confirmButtonColor: "#6c757d", confirmButtonText: "OK" });
                                          } else { fallbackToast("info", "Unit Code cannot be changed.", 2500); }
                                        }
                                      }}
                                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
                                    />
                                  ) : (
                                    <div
                                      className={`cell-content${!editable ? " readonly" : ""}`}
                                      contentEditable={editable}
                                      suppressContentEditableWarning
                                      key={`${row.unit_code}-${col.field}-${dispVal}`}
                                      dangerouslySetInnerHTML={{ __html: dispVal }}
                                      onFocus={() => {
                                        preEditRef.current = rawVal;
                                        if (col.field !== multiSelectRef.current.field || !multiSelectRef.current.selection.includes(actualIdx))
                                          clearMultiSelectHighlight();
                                      }}
                                      onBlur={(e) => saveCell(actualIdx, col.field, e.currentTarget.innerText.trim())}
                                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
                                    />
                                  )}
                                  {editable && !col.fixed && !isUnitCode && (
                                    <div className="drag-handle" onMouseDown={(e) => startDrag(e, actualIdx, col.field)} />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              <div className="pagination-controls">
                <div className="pagination-left">
                  <label style={{ fontWeight: "bold", fontSize: 14 }}>Page Size:</label>
                  <select className="company-select" value={pageSize}
                    onChange={(e) => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }}>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                    <option value={2000}>2000</option>
                  </select>
                  <span style={{ fontSize: 13, color: "#666" }}>
                    {sortedData.length} record{sortedData.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <Pagination currentPage={safePage} totalPages={totalPages} onNav={setCurrentPage} />
              </div>
            </>
          )}
        </div>

        <ColumnPanel
          open={colPanelOpen}
          columns={columns}
          onClose={() => setColPanelOpen(false)}
          onToggleCol={toggleCol}
          onSelectAll={selectAllCols}
          colSearch={colSearch}
          setColSearch={setColSearch}
        />
      </div>

      {filterMenu && (
        <FilterMenu
          menu={filterMenu}
          columns={columns}
          filteredDataForColumn={filteredDataForColumn}
          activeFilters={activeFilters}
          rangeFilterValues={rangeFilters}
          onUpdateFilter={handleUpdateFilter}
          onUpdateDateFilter={handleUpdateDateFilter}
          onRangeInput={handleRangeInput}
          onApplyRange={handleApplyRange}
          onSelectAll={handleSelectAll}
          onClose={() => setFilterMenu(null)}
        />
      )}
    </div>
  );
}