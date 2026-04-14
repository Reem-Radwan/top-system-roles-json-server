// approvalshistory.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import "./approvalshistory.css";
import { COLS, MONTH_NAMES } from "../../data/approvalshistorydata";
import { ROLES } from "../../data/permissions";
// ── API service (replaces MOCK + COMPANIES from approvalshistorydata) ─────────
import { fetchApprovalCompanies, fetchApprovalsByCompany } from "../../services/approvalsHistoryApi";

// ─────────────────────────────────────────────
//  RBAC HELPERS  (unchanged)
// ─────────────────────────────────────────────
function getAuthUser() {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getScopeRole(role) {
  if (role === ROLES.SALES || role === ROLES.SALES_HEAD) return "sales";
  if (role === ROLES.MANAGER) return "manager";
  return "admin_like";
}

const COMPANY_ID_TO_KEY = { 1: "mint", 2: "palmier", 3: "igi" };

// ─────────────────────────────────────────────
//  HELPERS  (unchanged)
// ─────────────────────────────────────────────
function fmtNumber(x) {
  if (x === null || x === undefined || x === "") return "-";
  const n = Number(x);
  if (isNaN(n)) return "-";
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function parseDateInputToTs(val) {
  if (!val) return null;
  const d = new Date(val + "T00:00:00");
  const ts = d.getTime();
  return isNaN(ts) ? null : ts;
}

function debounce(fn, ms = 250) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function getVisibleCols(meta, isSalesRole = false) {
  const showBase = !!(meta && meta.show_base_price);
  return COLS.filter((c) => {
    if (c.baseOnly && !showBase) return false;
    if (c.key === "salesman" && isSalesRole) return false;
    return true;
  });
}

// ─────────────────────────────────────────────
//  COLUMN FILTER MENU  (unchanged)
// ─────────────────────────────────────────────
function FilterMenu({ field, col, raw, activeColumnFilters, position, onClose, onChange }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const t = setTimeout(() => document.addEventListener("click", handler), 100);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", handler);
    };
  }, [onClose]);

  const existingRange =
    activeColumnFilters[field] && activeColumnFilters[field].range
      ? activeColumnFilters[field]
      : {};

  const [rangeMin, setRangeMin] = useState(
    existingRange.min !== null && existingRange.min !== undefined ? String(existingRange.min) : ""
  );
  const [rangeMax, setRangeMax] = useState(
    existingRange.max !== null && existingRange.max !== undefined ? String(existingRange.max) : ""
  );

  const applyRange = useCallback(() => {
    const minVal = parseFloat(rangeMin);
    const maxVal = parseFloat(rangeMax);
    if (!isNaN(minVal) || !isNaN(maxVal)) {
      onChange(field, {
        range: true,
        min: isNaN(minVal) ? null : minVal,
        max: isNaN(maxVal) ? null : maxVal,
      });
    } else {
      onChange(field, null);
    }
  }, [field, rangeMin, rangeMax, onChange]);

  const clearRange = useCallback(() => {
    setRangeMin("");
    setRangeMax("");
    onChange(field, null);
  }, [field, onChange]);

  const allDates = col.type === "date" ? raw.map((r) => r[field]).filter(Boolean) : [];
  const yearMap = {};
  allDates.forEach((d) => {
    const str = String(d);
    const parts = str.split("-");
    if (parts.length < 2) return;
    const yr = parts[0];
    const mo = parseInt(parts[1], 10) - 1;
    if (!yearMap[yr]) yearMap[yr] = new Set();
    yearMap[yr].add(mo);
  });
  const years = Object.keys(yearMap).sort().reverse();

  const curFilter = activeColumnFilters[field];
  const selectedSet = new Set(Array.isArray(curFilter) ? curFilter : []);

  const [openYears, setOpenYears] = useState({});
  const [checkedMonths, setCheckedMonths] = useState(() => {
    const init = {};
    years.forEach((yr) => {
      [...yearMap[yr]].forEach((m) => {
        const key = `${yr}-${String(m + 1).padStart(2, "0")}`;
        init[key] = selectedSet.size > 0 ? selectedSet.has(key) : false;
      });
    });
    return init;
  });

  const toggleYear = (yr) => {
    setOpenYears((prev) => ({ ...prev, [yr]: !prev[yr] }));
  };
  const applyDateFilter = useCallback(
    (months) => {
      const checked = Object.entries(months)
        .filter(([, v]) => v)
        .map(([k]) => k);
      const total = Object.keys(months).length;
      if (checked.length === 0 || checked.length === total) {
        onChange(field, null);
      } else {
        onChange(field, checked);
      }
    },
    [field, onChange]
  );

  const handleMonthChange = (key, yr, checked) => {
    const next = { ...checkedMonths, [key]: checked };
    setCheckedMonths(next);
    applyDateFilter(next);
  };

  const dtSelectAll = () => {
    const next = {};
    Object.keys(checkedMonths).forEach((k) => (next[k] = true));
    setCheckedMonths(next);
    onChange(field, null);
  };

  const dtClearAll = () => {
    const next = {};
    Object.keys(checkedMonths).forEach((k) => (next[k] = false));
    setCheckedMonths(next);
    onChange(field, null);
  };

  const allValues = [
    ...new Set(
      raw
        .map((r) => r[field])
        .filter((v) => v !== null && v !== undefined && v !== "")
    ),
  ].sort();

  const currentFilter = Array.isArray(activeColumnFilters[field])
    ? activeColumnFilters[field]
    : [];

  const [checkedText, setCheckedText] = useState(() => {
    const init = {};
    allValues.forEach((v) => {
      init[String(v)] = currentFilter.length > 0 && currentFilter.includes(String(v));
    });
    return init;
  });
  const [textSearch, setTextSearch] = useState("");

  const applyTextFilter = useCallback(
    (checked) => {
      const selected = Object.entries(checked)
        .filter(([, v]) => v)
        .map(([k]) => k);
      if (selected.length === 0) {
        onChange(field, null);
      } else {
        onChange(field, selected);
      }
    },
    [field, onChange]
  );

  const handleTextCbChange = (val, checked) => {
    const next = { ...checkedText, [val]: checked };
    setCheckedText(next);
    applyTextFilter(next);
  };

  const fmSelectAll = () => {
    const next = {};
    Object.keys(checkedText).forEach((k) => (next[k] = true));
    setCheckedText(next);
    applyTextFilter(next);
  };

  const fmClearAll = () => {
    const next = {};
    Object.keys(checkedText).forEach((k) => (next[k] = false));
    setCheckedText(next);
    onChange(field, null);
  };

  const visibleValues = allValues.filter((v) =>
    String(v).toLowerCase().includes(textSearch.toLowerCase())
  );

  let minPlaceholder = "Min";
  let maxPlaceholder = "Max";
  if (col.type === "number") {
    const nums = raw.map((r) => Number(r[field])).filter((n) => !isNaN(n) && n > 0);
    if (nums.length) {
      minPlaceholder = `Min: ${fmtNumber(Math.min(...nums))}`;
      maxPlaceholder = `Max: ${fmtNumber(Math.max(...nums))}`;
    }
  }

  const style = { top: position.top, left: position.left };

  const renderBody = () => {
    if (col.type === "number") {
      return (
        <>
          <div className="ah__filter-range">
            <input type="number" className="ah__fm-min" placeholder={minPlaceholder} value={rangeMin} onChange={(e) => setRangeMin(e.target.value)} />
            <input type="number" className="ah__fm-max" placeholder={maxPlaceholder} value={rangeMax} onChange={(e) => setRangeMax(e.target.value)} />
          </div>
          <div className="ah__filter-menu-actions">
            <button onClick={applyRange}>Apply</button>
            <button onClick={clearRange}>Clear</button>
          </div>
        </>
      );
    }

    if (col.type === "date") {
      return (
        <>
          <div className="ah__date-tree">
            {years.map((yr) => {
              const months = [...yearMap[yr]].sort((a, b) => a - b);
              const allMonthKeys = months.map((m) => `${yr}-${String(m + 1).padStart(2, "0")}`);
              const allSelected = allMonthKeys.length > 0 && allMonthKeys.every((k) => checkedMonths[k]);
              return (
                <div key={yr} className="ah__dt-year">
                  <div className="ah__dt-year-header" onClick={() => toggleYear(yr)}>
                    <span className={`ah__dt-arrow${openYears[yr] ? " ah__open" : ""}`}>▶</span>
                    <input type="checkbox" checked={!!allSelected} onChange={(e) => { e.stopPropagation(); const next = { ...checkedMonths }; months.forEach((m) => { const key = `${yr}-${String(m + 1).padStart(2, "0")}`; next[key] = e.target.checked; }); setCheckedMonths(next); applyDateFilter(next); }} onClick={(e) => e.stopPropagation()} />
                    <span>{yr}</span>
                  </div>
                  {openYears[yr] && (
                    <div className="ah__dt-months ah__open">
                      {months.map((m) => {
                        const key = `${yr}-${String(m + 1).padStart(2, "0")}`;
                        return (
                          <div key={key} className="ah__dt-month-item">
                            <input type="checkbox" checked={!!checkedMonths[key]} onChange={(e) => handleMonthChange(key, yr, e.target.checked)} />
                            <span>{MONTH_NAMES[m]}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="ah__filter-menu-actions">
            <button onClick={dtSelectAll}>Select All</button>
            <button onClick={dtClearAll}>Clear All</button>
          </div>
        </>
      );
    }

    return (
      <>
        <input type="text" className="ah__filter-menu-search" placeholder="Search..." value={textSearch} onChange={(e) => setTextSearch(e.target.value)} />
        <div className="ah__filter-menu-options">
          {visibleValues.map((val) => (
            <label key={String(val)}>
              <input type="checkbox" className="ah__fm-cb" value={String(val)} checked={!!checkedText[String(val)]} onChange={(e) => handleTextCbChange(String(val), e.target.checked)} />
              {String(val)}
            </label>
          ))}
        </div>
        <div className="ah__filter-menu-actions">
          <button onClick={fmSelectAll}>Select All</button>
          <button onClick={fmClearAll}>Clear All</button>
        </div>
      </>
    );
  };

  return ReactDOM.createPortal(
    <div className="ah__filter-menu" style={style} ref={menuRef}>
      <div className="ah__filter-menu-header-bar">
        <h4>{col.label}</h4>
        <button onClick={onClose}><i className="fas fa-times"></i></button>
      </div>
      <div className="ah__filter-menu-content">{renderBody()}</div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────
//  TABLE HEADER  (unchanged)
// ─────────────────────────────────────────────
function TableHeader({ meta, isSalesRole, sortState, activeColumnFilters, onSort, onOpenFilter }) {
  const cols = getVisibleCols(meta, isSalesRole);
  return (
    <thead>
      <tr>
        {cols.map((col) => {
          const isActive = sortState.column === col.key;
          const arrow = isActive ? (sortState.direction === 1 ? "▼" : "▲") : "↕";
          const hasColFilter =
            activeColumnFilters[col.key] &&
            (Array.isArray(activeColumnFilters[col.key])
              ? activeColumnFilters[col.key].length > 0
              : activeColumnFilters[col.key] !== null);
          return (
            <th key={col.key} className="ah__sortable">
              <div className="ah__th-inner">
                <span style={{ cursor: "pointer" }} onClick={() => onSort(col.key)}>{col.label}</span>
                <span className={`ah__sort-indicator${isActive ? " ah__active" : ""}`} onClick={() => onSort(col.key)}>{arrow}</span>
                <button className={`ah__filter-btn-th${hasColFilter ? " ah__active" : ""}`} onClick={(e) => onOpenFilter(e, col.key)} title={`Filter ${col.label}`}>
                  <i className="fas fa-filter"></i>
                </button>
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

// ─────────────────────────────────────────────
//  TABLE BODY  (unchanged)
// ─────────────────────────────────────────────
function TableBody({ rows, meta, isSalesRole }) {
  const cols = getVisibleCols(meta, isSalesRole);
  const showBase = !!(meta && meta.show_base_price);

  if (!rows.length) {
    return (
      <tbody>
        <tr>
          <td colSpan={cols.length}>
            <div className="ah__empty-state">
              <i className="fas fa-search"></i>
              No approved requests match your filters.
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {rows.map((r, idx) => (
        <tr key={idx}>
          {!isSalesRole && (
            <td style={{ textAlign: "left" }}>
              <div className="ah__salesman-cell">
                <div className="ah__salesman-avatar"><i className="fas fa-user"></i></div>
                <span className="ah__salesman-name">{r.salesman || "Unknown"}</span>
              </div>
            </td>
          )}
          <td className="ah__text-muted-sm">{r.client_id || "-"}</td>
          <td><span className="ah__badge-unit">{r.unit_code || "-"}</span></td>
          <td className="ah__text-muted-sm">{r.date || "-"}</td>
          {showBase && (
            <>
              <td className="ah__text-muted-sm" style={{ whiteSpace: "nowrap" }}>
                {r.land_area != null ? <>{fmtNumber(r.land_area)}&nbsp;<small className="ah__area-unit">m²</small></> : "-"}
              </td>
              <td className="ah__text-muted-sm" style={{ whiteSpace: "nowrap" }}>
                {r.gross_area != null ? <>{fmtNumber(r.gross_area)}&nbsp;<small className="ah__area-unit">m²</small></> : "-"}
              </td>
              <td className="ah__text-muted-sm">{fmtNumber(r.base_price)}</td>
            </>
          )}
          <td className="ah__fw-bold-primary">{fmtNumber(r.sales_price)}</td>
        </tr>
      ))}
    </tbody>
  );
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ApprovalsHistory() {
  // ── RBAC (unchanged) ────────────────────────────────────────────────────
  const authUser = useMemo(() => getAuthUser(), []);
  const userRole  = authUser?.role ?? "";
  const scopeRole = getScopeRole(userRole);
  const isSalesRole = scopeRole === "sales";
  const isAdminLike = scopeRole === "admin_like";
  const preselectedCompanyKey = !isAdminLike
    ? COMPANY_ID_TO_KEY[authUser?.company_id] ?? null
    : null;

  // ── State ────────────────────────────────────────────────────────────────
  const [selectedCompany, setSelectedCompany] = useState("");
  const [raw, setRaw] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const [metaLine, setMetaLine] = useState("✅ Approved requests only • Newest to oldest");

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minSales, setMinSales] = useState("");
  const [maxSales, setMaxSales] = useState("");

  const [sortState, setSortState] = useState({ column: null, direction: 0 });
  const [activeColumnFilters, setActiveColumnFilters] = useState({});
  const [filterMenu, setFilterMenu] = useState(null);

  // ── NEW: API-loaded companies list + error state ─────────────────────────
  const [companies, setCompanies] = useState([]);
  const [apiError, setApiError]   = useState(null);

  // Derive label for the fixed badge (bound roles) from API-loaded companies
  const preselectedCompanyLabel = useMemo(() => {
    if (isAdminLike || !preselectedCompanyKey) return "";
    return companies.find(c => c.key === preselectedCompanyKey)?.company_name ?? "";
  }, [companies, isAdminLike, preselectedCompanyKey]);

  // ── Load companies list from API on mount ────────────────────────────────
  useEffect(() => {
    fetchApprovalCompanies()
      .then(data => setCompanies(data))
      .catch(err => {
        console.error("Failed to load companies:", err);
        setApiError("Could not load companies. Is JSON Server running?");
      });
  }, []);

  const debouncedSetSearch = useMemo(() => debounce((v) => setSearch(v), 200), []);
  const debouncedSetMin    = useMemo(() => debounce((v) => setMinSales(v), 200), []);
  const debouncedSetMax    = useMemo(() => debounce((v) => setMaxSales(v), 200), []);

  const toggleSort = useCallback((col) => {
    setSortState((prev) => {
      if (prev.column === col) return { column: col, direction: prev.direction === 1 ? -1 : 1 };
      return { column: col, direction: 1 };
    });
  }, []);

  const sortRows = useCallback((rows, state) => {
    if (!state.column) return rows;
    const col = state.column;
    const dir = state.direction;
    return [...rows].sort((a, b) => {
      let va = a[col], vb = b[col];
      if (["salesman", "client_id", "unit_code", "date"].includes(col)) {
        va = va || ""; vb = vb || "";
        return dir === 1 ? vb.localeCompare(va) : va.localeCompare(vb);
      }
      va = va !== null && va !== undefined && va !== "" ? Number(va) : -Infinity;
      vb = vb !== null && vb !== undefined && vb !== "" ? Number(vb) : -Infinity;
      return dir === 1 ? vb - va : va - vb;
    });
  }, []);

  const applyFilters = useCallback(
    (rawData, currentSearch, currentDateFrom, currentDateTo, currentMinSales, currentMaxSales, colFilters, currentSortState) => {
      const q = (currentSearch || "").trim().toLowerCase();
      const fromTs = parseDateInputToTs(currentDateFrom);
      const toTsRaw = parseDateInputToTs(currentDateTo);
      const toTs = toTsRaw !== null ? toTsRaw + 24 * 60 * 60 * 1000 - 1 : null;
      const minS = currentMinSales !== "" ? Number(currentMinSales) : null;
      const maxS = currentMaxSales !== "" ? Number(currentMaxSales) : null;

      let result = rawData.filter((r) => {
        if (q) {
          const hay = `${r.salesman || ""} ${r.client_id || ""} ${r.unit_code || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (fromTs !== null && r.date_ts < fromTs) return false;
        if (toTs !== null && r.date_ts > toTs) return false;
        const sp = r.sales_price != null ? Number(r.sales_price) : null;
        if (minS !== null && (sp === null || sp < minS)) return false;
        if (maxS !== null && (sp === null || sp > maxS)) return false;
        for (const field in colFilters) {
          const filter = colFilters[field];
          const value = r[field];
          if (filter && filter.range) {
            const n = Number(value);
            if (filter.min !== null && (isNaN(n) || n < filter.min)) return false;
            if (filter.max !== null && (isNaN(n) || n > filter.max)) return false;
          } else if (Array.isArray(filter) && filter.length > 0) {
            if (field === "date") {
              const rowKey = value ? value.substring(0, 7) : "";
              if (!filter.includes(rowKey)) return false;
            } else {
              if (!filter.includes(String(value))) return false;
            }
          }
        }
        return true;
      });

      if (currentSortState.column) {
        result = sortRows(result, currentSortState);
      } else {
        result = result.sort((a, b) => (b.date_ts || 0) - (a.date_ts || 0));
      }
      return result;
    },
    [sortRows]
  );

  useEffect(() => {
    const result = applyFilters(raw, search, dateFrom, dateTo, minSales, maxSales, activeColumnFilters, sortState);
    setFiltered(result);
    setStatusText(`Showing ${result.length} result(s).`);
  }, [raw, search, dateFrom, dateTo, minSales, maxSales, activeColumnFilters, sortState, applyFilters]);

  // ── CHANGED: loadData now calls the API instead of reading MOCK object ───
  const loadData = useCallback(async (companyKey) => {
    setActiveColumnFilters({});
    setSortState({ column: null, direction: 0 });
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setMinSales("");
    setMaxSales("");

    if (!companyKey) {
      setRaw([]);
      setFiltered([]);
      setMeta(null);
      return;
    }

    setLoading(true);
    setStatusText("Fetching entries...");
    setApiError(null);

    try {
      // Fetch rows and the company meta (show_base_price flag) in parallel
      const [rows, allCompanies] = await Promise.all([
        fetchApprovalsByCompany(companyKey),
        fetchApprovalCompanies(),
      ]);

      const companyMeta = allCompanies.find(c => c.key === companyKey);
      if (!companyMeta) {
        setStatusText("Error: company not found.");
        setLoading(false);
        return;
      }

      const metaObj = {
        company_name: companyMeta.company_name,
        show_base_price: companyMeta.show_base_price,
      };

      const sortedRaw = [...rows].sort((a, b) => (b.date_ts || 0) - (a.date_ts || 0));
      setMeta(metaObj);
      setRaw(sortedRaw);
      setMetaLine(`✅ Approved requests only • ${metaObj.company_name} • Newest to oldest`);
      setStatusText("Data Synced");
    } catch (err) {
      console.error("Failed to load approvals:", err);
      setApiError("Could not load data. Is JSON Server running?");
      setStatusText("Error loading data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── RBAC: auto-load for Manager / Sales / SalesHead on mount ────────────
  useEffect(() => {
    if (preselectedCompanyKey) {
      setSelectedCompany(preselectedCompanyKey);
      loadData(preselectedCompanyKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setMinSales("");
    setMaxSales("");
    setActiveColumnFilters({});
    setSortState({ column: null, direction: 0 });
  };

  const openFilterMenu = (e, field) => {
    e.stopPropagation();
    if (filterMenu && filterMenu.field === field) { setFilterMenu(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuW = 260, menuH = 300;
    let left = rect.left;
    if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
    if (left < 4) left = 4;
    let top;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow >= menuH + 6 || spaceBelow >= window.innerHeight / 2) {
      top = rect.bottom + 4;
    } else {
      top = rect.top - menuH - 4;
      if (top < 4) top = 4;
    }
    setFilterMenu({ field, position: { top, left } });
  };

  const handleColumnFilterChange = useCallback((field, value) => {
    setActiveColumnFilters((prev) => {
      const next = { ...prev };
      if (value === null || value === undefined) delete next[field];
      else next[field] = value;
      return next;
    });
  }, []);

  // ── CHANGED: handleCompanyChange uses loadData (API) ────────────────────
  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
    loadData(e.target.value);
  };

  const isDashboardVisible = !!selectedCompany;

  return (
    <div className="ah__root">
      <div className="ah__header">
        <div className="ah__header-left">
          <h1>Historical Sales Requests</h1>
          <div className="ah__header-meta">{metaLine}</div>
        </div>

        {/* ── RBAC: Admin/Developer/TeamMember → dropdown selector ── */}
        {isAdminLike && (
          <div className="ah__company-selector">
            <label className="ah__company-label">Select a Company</label>
            <select className="ah__company-select" value={selectedCompany} onChange={handleCompanyChange}>
              <option value="">-- Select Company --</option>
              {/* ── CHANGED: was COMPANIES.map(...), now API-loaded companies ── */}
              {companies.map((c) => (
                <option key={c.key} value={c.key}>{c.company_name}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── RBAC: Manager / Sales / SalesHead → read-only badge ── */}
        {!isAdminLike && preselectedCompanyLabel && (
          <div className="ah__company-selector">
            <div className="ah__company-fixed-badge">🏢 {preselectedCompanyLabel}</div>
          </div>
        )}
      </div>

      {/* ── NEW: API error banner ── */}
      {apiError && (
        <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 16px', borderRadius:8, margin:'0 0 12px 0', fontSize:13 }}>
          <i className="fas fa-exclamation-triangle" style={{ marginRight:8 }} />
          {apiError}
        </div>
      )}

      <div className="ah__page-container">
        {!isDashboardVisible && (
          <div className="ah__welcome-section">
            <div className="ah__search-icon">🔍</div>
            <p>Select a company to view the historical approved sales requests</p>
          </div>
        )}

        <div className={`ah__dashboard-content${isDashboardVisible ? " ah__active" : ""}`}>
          <div className="ah__filters-section">
            <div className="ah__filters-header">
              <h2>Filters</h2>
              <button className="ah__reset-btn" onClick={resetFilters}>↺ Reset All Filters</button>
            </div>
            <div className="ah__filters-grid">
              <div className="ah__filter-group">
                <label className="ah__filter-label">🔍 Keyword Search</label>
                <input className="ah__filter-input" placeholder="Salesman, client, or unit..." defaultValue={search} onChange={(e) => debouncedSetSearch(e.target.value)} key={`search-${selectedCompany}`} />
              </div>
              <div className="ah__filter-group">
                <label className="ah__filter-label">📅 Date From</label>
                <input type="date" className="ah__filter-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="ah__filter-group">
                <label className="ah__filter-label">📅 Date To</label>
                <input type="date" className="ah__filter-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="ah__filter-group">
                <label className="ah__filter-label">💰 Min Sales Price</label>
                <input type="number" className="ah__filter-input" placeholder="0.00" defaultValue={minSales} onChange={(e) => debouncedSetMin(e.target.value)} key={`min-${selectedCompany}`} />
              </div>
              <div className="ah__filter-group">
                <label className="ah__filter-label">💰 Max Sales Price</label>
                <input type="number" className="ah__filter-input" placeholder="0.00" defaultValue={maxSales} onChange={(e) => debouncedSetMax(e.target.value)} key={`max-${selectedCompany}`} />
              </div>
            </div>
          </div>

          <div className="ah__status-bar">
            <div className="ah__status-left">
              <div className={`ah__spinner${loading ? " ah__active" : ""}`}></div>
              <div className="ah__status-badge">
                <span className="ah__label">Status: </span>
                <span className="ah__value">{statusText}</span>
              </div>
            </div>
            <div className="ah__count-badge">
              <i className="fas fa-filter" style={{ color: "#FF6B35", marginRight: "4px" }}></i>
              Showing <span className="ah__shown">{filtered.length}</span>
              <span className="ah__separator">/</span>
              <span>{raw.length}</span> entries
            </div>
          </div>

          <div className="ah__table-section">
            <div className="ah__table-wrapper">
              <table className="ah__table">
                {isDashboardVisible && meta ? (
                  <TableHeader meta={meta} isSalesRole={isSalesRole} sortState={sortState} activeColumnFilters={activeColumnFilters} onSort={toggleSort} onOpenFilter={openFilterMenu} />
                ) : (
                  <thead><tr></tr></thead>
                )}
                {loading ? (
                  <tbody>
                    <tr><td colSpan={8}><div className="ah__empty-state"><i className="fas fa-spinner fa-spin"></i> Loading...</div></td></tr>
                  </tbody>
                ) : isDashboardVisible && meta ? (
                  <TableBody rows={filtered} meta={meta} isSalesRole={isSalesRole} />
                ) : (
                  <tbody>
                    <tr><td colSpan={8}><div className="ah__empty-state"><i className="fas fa-database"></i> Select a company to load approved request data.</div></td></tr>
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      {filterMenu && (
        <FilterMenu
          key={filterMenu.field}
          field={filterMenu.field}
          col={COLS.find((c) => c.key === filterMenu.field)}
          raw={raw}
          activeColumnFilters={activeColumnFilters}
          position={filterMenu.position}
          onClose={() => setFilterMenu(null)}
          onChange={handleColumnFilterChange}
        />
      )}
    </div>
  );
}