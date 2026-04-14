import React, { useState, useEffect, useRef } from "react";
import "./customizedreport.css";

// ─── API service (replaces MOCK + COMPANY_ID_TO_KEY + COMPANY_KEY_TO_NAME) ───
import { getCompanies, getUnitsByCompany, REPORT_FIELDS } from "../../services/customizedReportApi";

// ── INJECT FONT AWESOME ONCE ──
if (!document.getElementById("crpt-fa-stylesheet")) {
  const link = document.createElement("link");
  link.id = "crpt-fa-stylesheet";
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
  document.head.appendChild(link);
}

// ── PURE HELPERS (all unchanged) ──
function isBlank(v) { return v === null || v === undefined || v === ""; }
function normVal(v) { if (isBlank(v)) return "-"; return String(v); }
function fieldType(fieldsMap, n) { return (fieldsMap[n] && fieldsMap[n].type) ? fieldsMap[n].type : "string"; }
function labelOf(fieldsMap, n) { return (fieldsMap[n] && fieldsMap[n].label) ? fieldsMap[n].label : n; }

function fmtNumber(x) {
  if (x === null || x === undefined || x === "") return "";
  const n = Number(x);
  if (Number.isNaN(n)) return String(x);
  return new Intl.NumberFormat().format(n);
}

function fmtPercentRatio(ratio) {
  if (ratio === null || ratio === undefined) return "";
  const n = Number(ratio);
  if (Number.isNaN(n)) return "";
  return (n * 100).toFixed(2) + "%";
}

function uniqSorted(arr) { return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b)); }

function allowedAggsForField(fieldsMap, fn) {
  if (fieldType(fieldsMap, fn) === "number") {
    return [
      { k: "sum", label: "Sum" }, { k: "avg", label: "Average" },
      { k: "min", label: "Min" }, { k: "max", label: "Max" },
      { k: "count", label: "Count" }, { k: "dcount", label: "Distinct Count" },
    ];
  }
  return [{ k: "count", label: "Count" }, { k: "dcount", label: "Distinct Count" }];
}

function defaultAggForField(fieldsMap, fn) { return (fieldType(fieldsMap, fn) === "number") ? "sum" : "count"; }

function aggTitle(agg) {
  return { sum: "Sum", avg: "Average", min: "Min", max: "Max", count: "Count", dcount: "Distinct Count" }[agg] || agg;
}

function measureCaption(fieldsMap, m) { return `${aggTitle(m.agg)} of ${labelOf(fieldsMap, m.field)}`; }
function supportsPercentOfGrand(m) { return m.agg === "sum" || m.agg === "count" || m.agg === "dcount"; }

function buildDisplayMeasures(baseMeasures, percentOfGrand) {
  const out = [];
  for (let i = 0; i < baseMeasures.length; i++) {
    const m = baseMeasures[i];
    out.push({ kind: "value", base: m, baseIndex: i });
    if (percentOfGrand && supportsPercentOfGrand(m)) out.push({ kind: "pct_gt", base: m, baseIndex: i });
  }
  return out;
}

function displayCaption(fieldsMap, d) {
  if (d.kind === "pct_gt") return `% of Grand Total • ${measureCaption(fieldsMap, d.base)}`;
  return measureCaption(fieldsMap, d.base);
}

function isPct(d) { return d && d.kind === "pct_gt"; }
function cryptoRandomId() { return "m_" + Math.random().toString(16).slice(2) + Date.now().toString(16); }
function keyOf(row, fields) { return fields.map(f => normVal(row[f])).join("\u0000"); }
function initState(measures) { return measures.map(m => ({ agg: m.agg, sum: 0, count: 0, dcount: new Set(), min: null, max: null })); }

function updateState(states, row, measures) {
  for (let i = 0; i < measures.length; i++) {
    const m = measures[i];
    const st = states[i];
    const v = row[m.field];
    if (v === null || v === undefined || v === "") continue;
    const n = Number(v);
    if (Number.isNaN(n)) continue;
    st.sum += n;
    st.count++;
    st.dcount.add(n);
    if (st.min === null || n < st.min) st.min = n;
    if (st.max === null || n > st.max) st.max = n;
  }
}

function stateToValue(st, measure) {
  if (!st) return null;
  if (measure.agg === "sum") return st.count ? st.sum : null;
  if (measure.agg === "avg") return st.count ? (st.sum / st.count) : null;
  if (measure.agg === "count") return st.count;
  if (measure.agg === "dcount") return st.dcount.size;
  if (measure.agg === "min") return st.min;
  if (measure.agg === "max") return st.max;
  return null;
}

function getFilteredUnits(rawUnits, config, showBlank) {
  const groupingFields = [...config.rows, ...config.cols];
  return rawUnits.filter(r => {
    for (const fn of config.filters) {
      const chosen = config.filterValues[fn];
      if (!chosen) continue;
      const val = normVal(r[fn]);
      if (chosen instanceof Set && !chosen.has(val)) return false;
    }
    if (!showBlank && groupingFields.length) {
      for (const fn of groupingFields) {
        if (isBlank(r[fn])) return false;
      }
    }
    return true;
  });
}

function buildPivot(units, config, measures) {
  const hasRows = config.rows.length > 0;
  const hasCols = config.cols.length > 0;
  const rowKeySet = new Map();
  const colKeySet = new Map();

  units.forEach(r => {
    const rk = hasRows ? keyOf(r, config.rows) : "__total__";
    if (!rowKeySet.has(rk)) rowKeySet.set(rk, hasRows ? config.rows.map(f => normVal(r[f])) : ["Grand Total"]);
    const ck = hasCols ? keyOf(r, config.cols) : "__total__";
    if (!colKeySet.has(ck)) colKeySet.set(ck, hasCols ? config.cols.map(f => normVal(r[f])) : ["Grand Total"]);
  });

  const rowKeys = Array.from(rowKeySet.keys()).sort();
  const colKeys = hasCols ? Array.from(colKeySet.keys()).sort() : [];

  const cells = new Map();
  const rowTotals = new Map();
  const colTotals = new Map();
  const grand = initState(measures);

  units.forEach(r => {
    const rk = hasRows ? keyOf(r, config.rows) : "__total__";
    const ck = hasCols ? keyOf(r, config.cols) : "__total__";
    if (!cells.has(rk)) cells.set(rk, new Map());
    if (!cells.get(rk).has(ck)) cells.get(rk).set(ck, initState(measures));
    if (!rowTotals.has(rk)) rowTotals.set(rk, initState(measures));
    if (!colTotals.has(ck)) colTotals.set(ck, initState(measures));
    updateState(cells.get(rk).get(ck), r, measures);
    updateState(rowTotals.get(rk), r, measures);
    updateState(colTotals.get(ck), r, measures);
    updateState(grand, r, measures);
  });

  return { rowKeys, colKeys, rowKeySet, colKeySet, cells, rowTotals, colTotals, grand, hasRows, hasCols };
}

function uniqueValuesFor(rawUnits, fn) {
  return uniqSorted(rawUnits.map(r => normVal(r[fn])));
}

function filterSummary(rawUnits, config, fn) {
  const all = uniqueValuesFor(rawUnits, fn);
  const chosen = config.filterValues[fn];
  if (chosen == null) return "(All)";
  if (chosen instanceof Set && chosen.size === 0) return "(None)";
  if (chosen instanceof Set && chosen.size === 1) return Array.from(chosen)[0];
  if (chosen instanceof Set && chosen.size === all.length) return "(All)";
  return "(Multiple Items)";
}

// ── PIVOT TABLE (unchanged) ──
function buildPivotHtml(config, rawUnits, showBlank, grandTotals, percentOfGrand, fieldsMap) {
  const measures = config.values;
  if (!measures.length && !config.rows.length && !config.cols.length) return "";
  if (!rawUnits.length) return "";
  if (!measures.length) return "";

  const units = getFilteredUnits(rawUnits, config, showBlank);
  const dispMeasures = buildDisplayMeasures(measures, percentOfGrand);
  const p = buildPivot(units, config, measures);
  const showGT = grandTotals;
  const groupColsCount = p.hasRows ? config.rows.length : 1;

  const grandDenoms = measures.map((m, i) => {
    if (!supportsPercentOfGrand(m)) return null;
    return stateToValue(p.grand[i], m) || null;
  });

  function esc(str) {
    return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  let html = `<table class="crpt-pivot">`;
  html += `<thead>`;

  if (p.hasCols) {
    html += `<tr>`;
    for (let ci = 0; ci < groupColsCount; ci++) {
      html += `<th class="crpt-sticky-col">${esc(config.rows[ci] ? labelOf(fieldsMap, config.rows[ci]) : "")}</th>`;
    }
    for (const ck of p.colKeys) {
      const labels = p.colKeySet.get(ck);
      html += `<th colspan="${dispMeasures.length}">${labels.map(esc).join(" › ")}</th>`;
    }
    if (showGT) {
      html += `<th colspan="${dispMeasures.length}" class="crpt-gt-col crpt-gt-col-sticky">Grand Total</th>`;
    }
    html += `</tr>`;
  } else {
    html += `<tr>`;
    for (let ci = 0; ci < groupColsCount; ci++) {
      html += `<th class="crpt-sticky-col">${esc(config.rows[ci] ? labelOf(fieldsMap, config.rows[ci]) : "")}</th>`;
    }
    for (let di = 0; di < dispMeasures.length; di++) {
      const d = dispMeasures[di];
      const isLast = di === dispMeasures.length - 1;
      const cls = [isPct(d) ? "crpt-pct-col" : "", isLast && showGT ? "crpt-gt-col crpt-gt-col-sticky" : ""].filter(Boolean).join(" ");
      html += `<th${cls ? ` class="${cls}"` : ""}>${esc(displayCaption(fieldsMap, d))}</th>`;
    }
    html += `</tr>`;
  }
  html += `</thead>`;

  html += `<tbody>`;
  for (const rk of p.rowKeys) {
    html += `<tr>`;
    const rowLabels = p.rowKeySet.get(rk) || [rk];
    for (let ci = 0; ci < groupColsCount; ci++) {
      html += `<td class="crpt-sticky-col">${esc(rowLabels[ci] || "")}</td>`;
    }
    if (p.hasCols) {
      for (const ck of p.colKeys) {
        const ctStates = (p.cells.get(rk) && p.cells.get(rk).get(ck)) || null;
        for (const d of dispMeasures) {
          if (isPct(d)) {
            const denom = grandDenoms[d.baseIndex];
            const baseV = ctStates ? stateToValue(ctStates[d.baseIndex], d.base) : null;
            const ratio = (denom && baseV !== null) ? (Number(baseV) / denom) : null;
            html += `<td class="crpt-num crpt-pct-col"><span class="crpt-pct-pill"><span class="crpt-pct-dot"></span><span>${fmtPercentRatio(ratio)}</span></span></td>`;
          } else {
            const v = ctStates ? stateToValue(ctStates[d.baseIndex], d.base) : null;
            const display = (v === null || v === undefined) ? "-" : fmtNumber(d.base.agg === "avg" ? Number(v).toFixed(2) : v);
            html += `<td class="crpt-num">${display}</td>`;
          }
        }
      }
      if (showGT) {
        const rtStates = p.rowTotals.get(rk) || null;
        for (const d of dispMeasures) {
          if (isPct(d)) {
            const denom = grandDenoms[d.baseIndex];
            const baseV = rtStates ? stateToValue(rtStates[d.baseIndex], d.base) : null;
            const ratio = (denom && baseV !== null) ? (Number(baseV) / denom) : null;
            html += `<td class="crpt-num crpt-pct-col crpt-gt-col-sticky"><span class="crpt-pct-pill"><span class="crpt-pct-dot"></span><span>${fmtPercentRatio(ratio)}</span></span></td>`;
          } else {
            const v = rtStates ? stateToValue(rtStates[d.baseIndex], d.base) : null;
            const display = (v === null || v === undefined) ? "-" : fmtNumber(d.base.agg === "avg" ? Number(v).toFixed(2) : v);
            html += `<td class="crpt-num crpt-gt-col crpt-gt-col-sticky">${display}</td>`;
          }
        }
      }
    } else {
      const rtStates = p.rowTotals.get(rk) || null;
      for (let di = 0; di < dispMeasures.length; di++) {
        const d = dispMeasures[di];
        const isLast = di === dispMeasures.length - 1;
        const stickyClass = isLast && showGT ? " crpt-gt-col crpt-gt-col-sticky" : "";
        if (isPct(d)) {
          const denom = grandDenoms[d.baseIndex];
          const baseV = rtStates ? stateToValue(rtStates[d.baseIndex], d.base) : null;
          const ratio = (denom && baseV !== null) ? (Number(baseV) / denom) : null;
          html += `<td class="crpt-num crpt-pct-col${stickyClass}"><span class="crpt-pct-pill"><span class="crpt-pct-dot"></span><span>${fmtPercentRatio(ratio)}</span></span></td>`;
        } else {
          const v = rtStates ? stateToValue(rtStates[d.baseIndex], d.base) : null;
          const display = (v === null || v === undefined) ? "-" : fmtNumber(d.base.agg === "avg" ? Number(v).toFixed(2) : v);
          html += `<td class="crpt-num${stickyClass}">${display}</td>`;
        }
      }
    }
    html += `</tr>`;
  }

  if (showGT) {
    html += `<tr class="crpt-gt-row">`;
    for (let ci = 0; ci < groupColsCount; ci++) {
      html += `<td class="crpt-sticky-col">${ci === 0 ? '<b>Grand Total</b>' : ''}</td>`;
    }
    if (p.hasCols) {
      for (const ck of p.colKeys) {
        const ctStates = p.colTotals.get(ck) || null;
        for (const d of dispMeasures) {
          if (isPct(d)) {
            const denom = grandDenoms[d.baseIndex];
            const baseV = ctStates ? stateToValue(ctStates[d.baseIndex], d.base) : null;
            const ratio = (denom && baseV !== null) ? (Number(baseV) / denom) : null;
            html += `<td class="crpt-num crpt-pct-col"><span class="crpt-pct-pill"><span class="crpt-pct-dot"></span><span>${fmtPercentRatio(ratio)}</span></span></td>`;
          } else {
            const v = ctStates ? stateToValue(ctStates[d.baseIndex], d.base) : null;
            const display = (v === null || v === undefined) ? "-" : fmtNumber(d.base.agg === "avg" ? Number(v).toFixed(2) : v);
            html += `<td class="crpt-num">${display}</td>`;
          }
        }
      }
      for (const d of dispMeasures) {
        if (isPct(d)) {
          const ratio = grandDenoms[d.baseIndex] ? 1 : null;
          html += `<td class="crpt-num crpt-pct-col crpt-gt-col-sticky"><span class="crpt-pct-pill"><span class="crpt-pct-dot"></span><span>${fmtPercentRatio(ratio)}</span></span></td>`;
        } else {
          const gv = stateToValue(p.grand[d.baseIndex], d.base);
          const display = (gv === null || gv === undefined) ? "-" : fmtNumber(d.base.agg === "avg" ? Number(gv).toFixed(2) : gv);
          html += `<td class="crpt-num crpt-gt-col crpt-gt-col-sticky">${display}</td>`;
        }
      }
    } else {
      for (let di = 0; di < dispMeasures.length; di++) {
        const d = dispMeasures[di];
        const isLast = di === dispMeasures.length - 1;
        const stickyClass = isLast ? " crpt-gt-col crpt-gt-col-sticky" : "";
        if (isPct(d)) {
          const ratio = grandDenoms[d.baseIndex] ? 1 : null;
          html += `<td class="crpt-num crpt-pct-col${stickyClass}"><span class="crpt-pct-pill"><span class="crpt-pct-dot"></span><span>${fmtPercentRatio(ratio)}</span></span></td>`;
        } else {
          const v = stateToValue(p.grand[d.baseIndex], d.base);
          const display = (v === null || v === undefined) ? "-" : fmtNumber(d.base.agg === "avg" ? Number(v).toFixed(2) : v);
          html += `<td class="crpt-num${stickyClass}">${display}</td>`;
        }
      }
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;
  return html;
}

// ── APPLY STICKY ROW/COL POSITIONS (unchanged) ──
function applyStickyRowCols(tableEl, count) {
  if (!tableEl) return;
  tableEl.querySelectorAll(".crpt-sticky-col, .crpt-gt-col-sticky").forEach(el => {
    el.style.left = ""; el.style.right = ""; el.style.zIndex = ""; el.style.position = "";
  });
  let left = 0;
  for (let ci = 1; ci <= count; ci++) {
    const sample =
      tableEl.querySelector(`tbody tr:not(.crpt-gt-row) td:nth-child(${ci})`) ||
      tableEl.querySelector(`thead tr th:nth-child(${ci})`);
    const w = sample ? sample.getBoundingClientRect().width : 120;
    const currentLeft = left;
    tableEl.querySelectorAll(`tr > *:nth-child(${ci})`).forEach(cell => {
      cell.classList.add("crpt-sticky-col");
      cell.style.position = "sticky";
      cell.style.left = currentLeft + "px";
      cell.style.zIndex = cell.closest(".crpt-gt-row") ? 560 : cell.tagName === "TH" ? 7 : 5;
    });
    left += w;
  }
  const sampleBodyRow = tableEl.querySelector("tbody tr:not(.crpt-gt-row)");
  if (!sampleBodyRow) return;
  const gtBodyCells = Array.from(sampleBodyRow.querySelectorAll(".crpt-gt-col-sticky"));
  if (!gtBodyCells.length) return;
}

// ── AUTH (unchanged) ──
function getStoredUser() {
  try { const r = localStorage.getItem("auth_user"); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

// ── MAIN COMPONENT ──
export default function CustomizedReport() {
  const user    = getStoredUser();

  // ── CHANGED: scoped check now uses user.company_id directly (numeric) ───────
  const isScoped       = !!user?.company_id;
  const scopedCompanyId = isScoped ? user.company_id : null;

  // ── CHANGED: companies loaded from API ───────────────────────────────────────
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(err => console.error('Failed to load companies:', err));
  }, []);

  // ── CHANGED: companyId is now a numeric ID (or empty string) ─────────────────
  const [companyId, setCompanyId]       = useState(isScoped ? scopedCompanyId : "");
  const [rawUnits, setRawUnits]         = useState([]);
  const [fieldsMeta, setFieldsMeta]     = useState([]);
  const [fieldsMap, setFieldsMap]       = useState({});
  const [config, setConfig]             = useState({ rows: [], cols: [], filters: [], values: [], filterValues: {} });
  const [showBlank, setShowBlank]       = useState(false);
  const [grandTotals, setGrandTotals]   = useState(true);
  const [percentOfGrand, setPercentOfGrand] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");
  const [statusText, setStatusText]     = useState("Load a company to start.");
  const [metaText, setMetaText]         = useState("No data loaded.");
  const [metaLine, setMetaLine]         = useState("");
  const [fieldSearch, setFieldSearch]   = useState("");
  const [paneMobileHidden, setPaneMobileHidden] = useState(false);
  const [toast, setToast]               = useState("");
  const toastTimerRef = useRef(null);

  const [fpOpen, setFpOpen]         = useState(false);
  const [fpField, setFpField]       = useState(null);
  const [fpAllValues, setFpAllValues] = useState([]);
  const [fpSearch, setFpSearch]     = useState("");
  const [fpPos, setFpPos]           = useState({ top: 0, left: 0 });
  const [fpDraft, setFpDraft]       = useState({});

  const pivotHostRef    = useRef(null);
  const filterPopupRef  = useRef(null);

  // ── AUTO-LOAD FOR SCOPED USERS ────────────────────────────────────────────────
  useEffect(() => {
    if (isScoped && scopedCompanyId) loadCompany(scopedCompanyId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── TOAST (unchanged) ─────────────────────────────────────────────────────────
  function showToast(msg) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 2400);
  }

  // ── LOAD COMPANY — CHANGED: real API call instead of MOCK[id] ────────────────
  async function loadCompany(id) {
    if (!id) {
      setRawUnits([]); setFieldsMeta([]); setFieldsMap({});
      setConfig({ rows: [], cols: [], filters: [], values: [], filterValues: {} });
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const units       = await getUnitsByCompany(id);
      const company     = companies.find(c => c.id === Number(id));
      const companyName = company?.name || `Company ${id}`;

      const fm = {};
      REPORT_FIELDS.forEach(f => { fm[f.name] = f; });

      setRawUnits(units);
      setFieldsMeta(REPORT_FIELDS);
      setFieldsMap(fm);
      setConfig({ rows: [], cols: [], filters: [], values: [], filterValues: {} });
      setStatusText(`Loaded ${units.length} units • ${companyName}`);
      setMetaText(`${companyName} • ${units.length} records`);
      setMetaLine(companyName);
    } catch (err) {
      console.error('Failed to load company data:', err);
      setErrorMsg("Failed to load company data. Is JSON Server running?");
    } finally {
      setLoading(false);
    }
  }

  // ── DERIVED (unchanged) ───────────────────────────────────────────────────────
  const filteredFields = fieldsMeta.filter(f => {
    if (!fieldSearch.trim()) return true;
    const q = fieldSearch.trim().toLowerCase();
    return (f.name || "").toLowerCase().includes(q) || (f.label || "").toLowerCase().includes(q);
  });

  function fieldIsUsed(fn) {
    return config.rows.includes(fn) || config.cols.includes(fn) ||
      config.filters.includes(fn) || config.values.some(v => v.field === fn);
  }

  function getFieldTags(fn) {
    const tags = [];
    if (config.filters.includes(fn)) tags.push("F");
    if (config.cols.includes(fn)) tags.push("C");
    if (config.rows.includes(fn)) tags.push("R");
    if (config.values.some(v => v.field === fn)) tags.push("V");
    return tags;
  }

  // ── CONFIG MUTATORS (all unchanged) ──────────────────────────────────────────
  function removeFromArr(arr, item) { return arr.filter(x => x !== item); }

  function removeFieldFromRCF(cfg, fn) {
    return {
      ...cfg,
      rows: removeFromArr(cfg.rows, fn),
      cols: removeFromArr(cfg.cols, fn),
      filters: removeFromArr(cfg.filters, fn),
      filterValues: Object.fromEntries(Object.entries(cfg.filterValues).filter(([k]) => k !== fn)),
    };
  }

  function addMeasure(cfg, fn, agg, fMap) {
    const allowed = allowedAggsForField(fMap, fn).map(x => x.k);
    let finalAgg = agg;
    if (!allowed.includes(agg)) finalAgg = "count";
    const id = cryptoRandomId();
    let newVal = { id, field: fn, agg: finalAgg };
    if (fieldType(fMap, fn) !== "number" && ["sum", "avg", "min", "max"].includes(finalAgg)) {
      newVal.agg = "count";
      showToast("Non-numeric field → using COUNT.");
    }
    return { ...cfg, values: [...cfg.values, newVal] };
  }

  function autoPlaceField(cfg, fn, fMap) {
    const t = fieldType(fMap, fn);
    if (t === "number") return addMeasure(cfg, fn, defaultAggForField(fMap, fn), fMap);
    if (t === "date") { const c = removeFieldFromRCF(cfg, fn); return { ...c, cols: [...c.cols, fn] }; }
    const c = removeFieldFromRCF(cfg, fn);
    return { ...c, rows: [...c.rows, fn] };
  }

  function placeFieldInArea(cfg, fn, area, fMap) {
    if (area === "values") return addMeasure(cfg, fn, defaultAggForField(fMap, fn), fMap);
    const c = removeFieldFromRCF(cfg, fn);
    if (area === "filters") return { ...c, filters: [...c.filters, fn] };
    if (area === "cols") return { ...c, cols: [...c.cols, fn] };
    if (area === "rows") return { ...c, rows: [...c.rows, fn] };
    return c;
  }

  function handleFieldCheck(fn, checked) {
    if (checked) {
      setConfig(prev => autoPlaceField(prev, fn, fieldsMap));
    } else {
      setConfig(prev => {
        const c = removeFieldFromRCF(prev, fn);
        return { ...c, values: c.values.filter(m => m.field !== fn) };
      });
    }
  }

  function handleDragStart(e, fn) { e.dataTransfer.setData("text/plain", fn); }

  function handleAreaDrop(e, area) {
    e.preventDefault();
    const fn = e.dataTransfer.getData("text/plain");
    if (!fn || !fieldsMap[fn]) return;
    setConfig(prev => placeFieldInArea(prev, fn, area, fieldsMap));
  }

  function handleAreaDragOver(e) { e.preventDefault(); }

  function handleRemoveRCF(fn) { setConfig(prev => removeFieldFromRCF(prev, fn)); }
  function handleRemoveValue(id) { setConfig(prev => ({ ...prev, values: prev.values.filter(x => x.id !== id) })); }
  function handleAggChange(id, agg) {
    setConfig(prev => ({ ...prev, values: prev.values.map(m => m.id === id ? { ...m, agg } : m) }));
  }

  // ── FILTER POPUP (unchanged) ──────────────────────────────────────────────────
  function openFilterPopup(fn, anchorEl) {
    const allVals = uniqueValuesFor(rawUnits, fn);
    const chosen = config.filterValues[fn];
    const draft = {};
    allVals.forEach(v => { draft[v] = !chosen || (chosen instanceof Set && chosen.has(v)); });
    setFpField(fn);
    setFpAllValues(allVals);
    setFpSearch("");
    setFpDraft(draft);
    const rect = anchorEl.getBoundingClientRect();
    setFpPos({ top: rect.bottom + window.scrollY + 4, left: Math.max(4, rect.left + window.scrollX) });
    setFpOpen(true);
  }

  function closeFilterPopup() { setFpOpen(false); setFpField(null); }

  function applyFilter() {
    const sel = new Set(Object.entries(fpDraft).filter(([, v]) => v).map(([k]) => k));
    const allVals = fpAllValues;
    setConfig(prev => ({
      ...prev,
      filterValues: { ...prev.filterValues, [fpField]: sel.size === allVals.length ? null : sel },
    }));
    closeFilterPopup();
  }

  function clearFilter() {
    setConfig(prev => ({ ...prev, filterValues: { ...prev.filterValues, [fpField]: new Set() } }));
    closeFilterPopup();
  }

  useEffect(() => {
    function handleClick(e) {
      if (!fpOpen) return;
      if (filterPopupRef.current && !filterPopupRef.current.contains(e.target) &&
          !e.target.closest(".crpt-rf-item")) closeFilterPopup();
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [fpOpen]);

  // ── PIVOT HTML + STICKY (unchanged) ──────────────────────────────────────────
  const pivotHtml = React.useMemo(() => {
    return buildPivotHtml(config, rawUnits, showBlank, grandTotals, percentOfGrand, fieldsMap);
  }, [config, rawUnits, showBlank, grandTotals, percentOfGrand, fieldsMap]);

  useEffect(() => {
    if (pivotHostRef.current) {
      const table = pivotHostRef.current.querySelector("table.crpt-pivot");
      if (table) {
        const groupColsCount = config.rows.length > 0 ? config.rows.length : 1;
        setTimeout(() => applyStickyRowCols(table, groupColsCount), 0);
      }
    }
  }, [pivotHtml, config.rows.length]);

  const measuresText = config.values.length
    ? `Values: ${config.values.map(m => measureCaption(fieldsMap, m)).join(" • ")}${percentOfGrand ? " • %GT" : ""}`
    : "Values: (none)";

  const hasPivotContent = pivotHtml.trim().length > 0;
  const showWelcome = !companyId;
  const showMain    = !!companyId;

  const fpFilteredVals = fpSearch
    ? fpAllValues.filter(v => v.toLowerCase().includes(fpSearch.toLowerCase()))
    : fpAllValues;

  return (
    <div className="crpt-wrap">
      {/* ── HEADER ── */}
      <div className="crpt-header">
        <div className="crpt-header-left">
          <h1>Pivot Engine</h1>
          <div className="crpt-header-meta">
            Excel-like pivot table
            <span>{metaLine ? ` • ${metaLine}` : ""}</span>
          </div>
        </div>
        <div className="crpt-header-controls">
          {/* ── CHANGED: dropdown now uses companies from API, values are numeric IDs */}
          {!isScoped && (
            <div>
              <label className="crpt-company-label">Select a Company</label>
              <select
                className="crpt-company-select"
                value={companyId}
                onChange={e => {
                  const id = e.target.value ? Number(e.target.value) : "";
                  setCompanyId(id);
                  loadCompany(id);
                }}
              >
                <option value="">-- Select Company --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            className="crpt-action-btn crpt-btn-secondary crpt-pane-toggle"
            onClick={() => setPaneMobileHidden(p => !p)}
            type="button"
          >
            <i className="crpt-fa-icon fas fa-sliders-h"></i> Fields
          </button>
          <button
            className="crpt-action-btn crpt-btn-outline"
            onClick={() => {
              if (!companyId) { showToast("Select a company first."); return; }
              if (!hasPivotContent) { showToast("Generate a pivot table first."); return; }
              showToast("✅ Snapshot sent to managers successfully.");
            }}
            type="button"
          >
            <i className="crpt-fa-icon fas fa-paper-plane"></i> Send Managers
          </button>
          <button
            className="crpt-action-btn crpt-btn-secondary"
            onClick={() => {
              setConfig({ rows: [], cols: [], filters: [], values: [], filterValues: {} });
              setFieldSearch("");
              closeFilterPopup();
            }}
            type="button"
          >
            <i className="crpt-fa-icon fas fa-undo"></i> Reset
          </button>
        </div>
      </div>

      <div className="crpt-page-container">
        {showWelcome && (
          <div className="crpt-welcome-section">
            <div className="crpt-icon">📊</div>
            <h2>Pivot Engine</h2>
            <p>Select a company to load units and start building your pivot table.</p>
          </div>
        )}

        {showMain && (
          <div className="crpt-main-content">
            <div className="crpt-status-bar">
              <div className={`crpt-spinner${loading ? " crpt-active" : ""}`}></div>
              <span className="crpt-status-text">{statusText}</span>
              <label className="crpt-toggle-label">
                <input type="checkbox" checked={grandTotals} onChange={e => setGrandTotals(e.target.checked)} />
                Grand Totals
              </label>
              <label className="crpt-toggle-label">
                <input type="checkbox" checked={percentOfGrand} onChange={e => setPercentOfGrand(e.target.checked)} />
                % of Grand Total
              </label>
              <button
                className={`crpt-blank-btn${showBlank ? " crpt-blank-btn-active" : ""}`}
                onClick={() => setShowBlank(p => !p)}
                type="button"
              >
                <i className={`crpt-fa-icon fas fa-eye${showBlank ? "" : "-slash"}`}></i>
                {showBlank ? "Include Blanks" : "Exclude Blanks"}
              </button>
            </div>

            {errorMsg && <div className="crpt-error-box crpt-visible">{errorMsg}</div>}

            <div className="crpt-xl-wrap">
              <div className="crpt-xl-sheet">
                <div className="crpt-xl-sheet-head">
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <div className="crpt-xl-mini"><b>PivotTable</b></div>
                    <div className="crpt-xl-mini">{metaText}</div>
                  </div>
                  <div className="crpt-xl-mini">{measuresText}</div>
                </div>

                <div className="crpt-xl-report-filters">
                  <span className="crpt-xl-mini" style={{ color: "var(--crpt-medium-gray)", fontSize: "0.82rem" }}>Report Filters:</span>
                  {config.filters.length === 0 ? (
                    <span style={{ fontSize: "0.82rem", color: "var(--crpt-medium-gray)" }}>Add fields to FILTERS area (right pane).</span>
                  ) : (
                    config.filters.map(fn => (
                      <div key={fn} className="crpt-rf-item" onClick={e => openFilterPopup(fn, e.currentTarget)}>
                        <span className="crpt-rf-label">{labelOf(fieldsMap, fn)}</span>
                        <span className="crpt-rf-value">{filterSummary(rawUnits, config, fn)}</span>
                        <span className="crpt-rf-caret">▼</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="crpt-xl-pivot-area">
                  <div className="crpt-xl-pivot-scroll">
                    {!hasPivotContent && (
                      <div className="crpt-xl-placeholder">
                        <i className="crpt-fa-icon fas fa-table" style={{ fontSize: "2rem", color: "var(--crpt-light-gray)", display: "block", marginBottom: "10px" }}></i>
                        {!rawUnits.length ? "No units loaded yet." : "Configure Rows / Columns / Filters / Values to render the pivot."}
                      </div>
                    )}
                    <div ref={pivotHostRef} dangerouslySetInnerHTML={{ __html: pivotHtml }} />
                  </div>
                </div>
              </div>

              <div className={`crpt-xl-pane${paneMobileHidden ? " crpt-mobile-hidden" : ""}`}>
                <div className="crpt-xl-pane-head">
                  <div>
                    <div className="crpt-h">PivotTable Fields</div>
                    <div className="crpt-sub">Choose fields to add to report</div>
                  </div>
                  <div className="crpt-count-badge">{fieldsMeta.length}</div>
                </div>
                <div className="crpt-xl-pane-body">
                  <input
                    className="crpt-xl-search"
                    placeholder="🔍 Search fields..."
                    value={fieldSearch}
                    onChange={e => setFieldSearch(e.target.value)}
                  />
                  <div className="crpt-xl-fields">
                    {fieldsMeta.length === 0 ? (
                      <div className="crpt-xl-field">
                        <span style={{ color: "var(--crpt-medium-gray)", fontSize: "0.85rem" }}>Select a company to load fields.</span>
                      </div>
                    ) : filteredFields.length === 0 ? (
                      <div className="crpt-xl-field">
                        <span style={{ color: "var(--crpt-medium-gray)", fontSize: "0.85rem" }}>No matching fields.</span>
                      </div>
                    ) : (
                      filteredFields.map(f => {
                        const used = fieldIsUsed(f.name);
                        const tags = getFieldTags(f.name);
                        return (
                          <div key={f.name} className="crpt-xl-field" draggable
                            onDragStart={e => handleDragStart(e, f.name)}
                            onClick={() => handleFieldCheck(f.name, !used)}
                          >
                            <input className="crpt-chk" type="checkbox" checked={used}
                              onChange={e => { e.stopPropagation(); handleFieldCheck(f.name, e.target.checked); }}
                              onClick={e => e.stopPropagation()}
                            />
                            <div className="crpt-label" title={f.label}>{f.label}</div>
                            <div className="crpt-tags">
                              {tags.length > 0
                                ? tags.map(t => <span key={t} className="crpt-tag crpt-on">{t}</span>)
                                : <span className="crpt-tag">—</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="crpt-xl-pane-section-title">Drag fields between areas below:</div>

                  <div className="crpt-xl-areas">
                    <div className="crpt-areas-grid">
                      <div className="crpt-area" onDrop={e => handleAreaDrop(e, "filters")} onDragOver={handleAreaDragOver}>
                        <div className="crpt-t">FILTERS <span>drop</span></div>
                        <div className="crpt-chips">
                          {config.filters.map(fn => (
                            <div key={fn} className="crpt-chip">
                              <span className="crpt-txt" title={labelOf(fieldsMap, fn)}>{labelOf(fieldsMap, fn)}</span>
                              <button className="crpt-mini-btn" onClick={() => handleRemoveRCF(fn)}>✕</button>
                            </div>
                          ))}
                        </div>
                        <div className="crpt-area-hint">Report filter</div>
                      </div>

                      <div className="crpt-area" onDrop={e => handleAreaDrop(e, "cols")} onDragOver={handleAreaDragOver}>
                        <div className="crpt-t">COLUMNS <span>drop</span></div>
                        <div className="crpt-chips">
                          {config.cols.map(fn => (
                            <div key={fn} className="crpt-chip">
                              <span className="crpt-txt" title={labelOf(fieldsMap, fn)}>{labelOf(fieldsMap, fn)}</span>
                              <button className="crpt-mini-btn" onClick={() => handleRemoveRCF(fn)}>✕</button>
                            </div>
                          ))}
                        </div>
                        <div className="crpt-area-hint">Column Labels</div>
                      </div>

                      <div className="crpt-area" onDrop={e => handleAreaDrop(e, "rows")} onDragOver={handleAreaDragOver}>
                        <div className="crpt-t">ROWS <span>drop</span></div>
                        <div className="crpt-chips">
                          {config.rows.map(fn => (
                            <div key={fn} className="crpt-chip">
                              <span className="crpt-txt" title={labelOf(fieldsMap, fn)}>{labelOf(fieldsMap, fn)}</span>
                              <button className="crpt-mini-btn" onClick={() => handleRemoveRCF(fn)}>✕</button>
                            </div>
                          ))}
                        </div>
                        <div className="crpt-area-hint">Row Labels</div>
                      </div>

                      <div className="crpt-area" onDrop={e => handleAreaDrop(e, "values")} onDragOver={handleAreaDragOver}>
                        <div className="crpt-t">VALUES <span>drop</span></div>
                        <div className="crpt-chips">
                          {config.values.map(m => {
                            const allowed = allowedAggsForField(fieldsMap, m.field);
                            return (
                              <div key={m.id} className="crpt-chip">
                                <span className="crpt-txt" title={measureCaption(fieldsMap, m)}>{labelOf(fieldsMap, m.field)}</span>
                                <select className="crpt-agg" value={m.agg} onChange={e => handleAggChange(m.id, e.target.value)}>
                                  {allowed.map(a => <option key={a.k} value={a.k}>{a.label}</option>)}
                                </select>
                                <button className="crpt-mini-btn" onClick={() => handleRemoveValue(m.id)}>✕</button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="crpt-area-hint">Multi-measures</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div ref={filterPopupRef} className={`crpt-filter-popup${fpOpen ? " crpt-visible" : ""}`} style={{ top: fpPos.top, left: fpPos.left }}>
        <div className="crpt-fp-head">
          <div className="crpt-h">{fpField ? labelOf(fieldsMap, fpField) : "Filter"}</div>
          <button onClick={closeFilterPopup} type="button">✕</button>
        </div>
        <div className="crpt-fp-body">
          <input className="crpt-fp-search" placeholder="Search..." value={fpSearch} onChange={e => setFpSearch(e.target.value)} />
          <div className="crpt-fp-list">
            {fpFilteredVals.map(v => (
              <div key={v} className="crpt-fp-item">
                <input type="checkbox" checked={!!fpDraft[v]} onChange={e => setFpDraft(prev => ({ ...prev, [v]: e.target.checked }))} />
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div className="crpt-fp-actions">
            <button className="crpt-fp-btn-clear" onClick={clearFilter} type="button">Clear</button>
            <button className="crpt-fp-btn-apply" onClick={applyFilter} type="button">OK</button>
          </div>
        </div>
      </div>

      <div className={`crpt-toast${toast ? " crpt-visible" : ""}`}>{toast}</div>
    </div>
  );
}