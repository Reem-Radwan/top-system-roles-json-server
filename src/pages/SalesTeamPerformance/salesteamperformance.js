import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Navigate } from "react-router-dom";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "./salesteamperformance.css";
import {
  COMPANIES,
  C1,
  C2,
  buildPieData,
  buildTrendData,
  buildHierarchy,
  calcStats,
  fmt,
  getAvailableOptions,
  applyFilters,
  sortRows,
  makePieChartConfig,
  makeTrendChartConfig,
} from "../../data/salesteamperformancedata";
// ── NEW: import the API service ──────────────────────
import { fetchSalesRequests } from "../../services/salesteamperformanceapi.js";

// Register datalabels plugin globally
Chart.register(ChartDataLabels);

// ─── Role-based access constants ─────────────────────────────────────────────
const PAGE_ALLOWED_ROLES  = ["Admin", "Developer", "Manager"];
const GLOBAL_ADMIN_ROLES  = ["Admin", "Developer"];

function getStoredUser() {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const COMPANY_ID_TO_KEY = { 1: "mint", 2: "palmier", 3: "igi" };

// ─────────────────────────────────────────────────────────
function FilterDropdown({ type, label, placeholder, selected, allOptions, availableOptions, onChangeSelected, openKey, setOpenKey }) {
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const isOpen = openKey === type;

  const filtered = allOptions.filter((o) => o.toLowerCase().includes(search.toLowerCase()));
  const labelText = selected.length === 0 ? `All ${label}s` : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  function toggle(e) {
    e.stopPropagation();
    setOpenKey(isOpen ? null : type);
  }

  function handleOption(e, val) {
    e.stopPropagation();
    const next = selected.includes(val) ? selected.filter((x) => x !== val) : [...selected, val];
    onChangeSelected(next);
  }

  function selectAll(e) {
    e.stopPropagation();
    onChangeSelected(allOptions.filter((v) => availableOptions.has(v)));
  }

  function clearAll(e) {
    e.stopPropagation();
    onChangeSelected([]);
  }

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpenKey(null); }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [setOpenKey]);

  return (
    <div className="stp-filter-group">
      <label className="stp-filter-label">{label}</label>
      <div className="stp-filter-dropdown" ref={ref}>
        <div className={`stp-filter-selected ${isOpen ? "open" : ""}`} onClick={toggle}>
          <span>{labelText}</span>
          <span>▼</span>
        </div>
        <div className={`stp-filter-dropdown-content ${isOpen ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
          <input
            className="stp-filter-search"
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="stp-filter-actions">
            <button className="stp-filter-action-btn" onClick={selectAll}>Select All</button>
            <button className="stp-filter-action-btn" onClick={clearAll}>Clear</button>
          </div>
          <div className="stp-filter-options">
            {filtered.map((val) => {
              const available = availableOptions.has(val);
              const checked   = selected.includes(val);
              return (
                <div key={val} className="stp-filter-option" onClick={(e) => available && handleOption(e, val)}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!available}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span style={{ opacity: available ? 1 : 0.5 }}>{val}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CHART MODAL — sub-component
// ─────────────────────────────────────────────────────────
function ChartModal({ modalType, onClose, filteredData, currentPeriod, onToggleSalesman, onToggleTeam }) {
  const canvasRef  = useRef(null);
  const divRef     = useRef(null);
  const chartRef   = useRef(null);
  const isTrend    = modalType === "trend";

  useEffect(() => {
    if (!modalType) return;
    const ctx = canvasRef.current;
    if (!ctx) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    let cfg;
    if (modalType === "salesmen") {
      const { labels, values, counts, total } = buildPieData(filteredData, "salesman");
      cfg = makePieChartConfig({ labels, values, counts, total, colors: C1, legendPos: "right", anchorThreshold: 3,
        onClickCb: (val) => { onToggleSalesman(val); onClose(); } });
    } else if (modalType === "teams") {
      const { labels, values, counts, total } = buildPieData(filteredData, "team");
      cfg = makePieChartConfig({ labels, values, counts, total, colors: C2, legendPos: "right", anchorThreshold: 3,
        onClickCb: (val) => { onToggleTeam(val); onClose(); } });
    } else {
      const { labels, values, counts } = buildTrendData(filteredData, currentPeriod);
      cfg = makeTrendChartConfig({ labels, values, counts });
    }
    chartRef.current = new Chart(ctx, cfg);
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalType, filteredData, currentPeriod]);

  if (!modalType) return null;

  const title =
    modalType === "salesmen" ? "Top Salesmen — Detailed View" :
    modalType === "teams"    ? "Top Teams — Detailed View" :
                               "Sales Trend — Detailed View";

  return (
    <div className={`stp-modal-overlay open`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`stp-modal-content ${isTrend ? "trend-modal" : ""}`}>
        <div className="stp-modal-header">
          <h2 className="stp-modal-title">{title}</h2>
          <button className="stp-modal-close" onClick={onClose}>×</button>
        </div>
        <div className={`stp-modal-chart-container ${isTrend ? "line" : ""}`}>
          {isTrend ? (
            <div ref={divRef}><canvas ref={canvasRef} /></div>
          ) : (
            <canvas ref={canvasRef} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TABLE ROW — recursive
// ─────────────────────────────────────────────────────────
function TableRows({ rows, indent, parentTeam, expandedRows, toggleExpand, memberCounters }) {
  return (
    <>
      {rows.map((row) => {
        const expanded = expandedRows.has(row.name + "-" + row.type);
        let labelEl = null;
        if (row.type === "head") {
          labelEl = <span className="stp-level-label head">HEAD</span>;
        } else if (row.type === "salesman" && parentTeam) {
          if (!memberCounters.current[parentTeam]) memberCounters.current[parentTeam] = 0;
          const k = `${parentTeam}::${row.name}`;
          if (!memberCounters.current[k]) {
            memberCounters.current[parentTeam]++;
            memberCounters.current[k] = memberCounters.current[parentTeam];
          }
          labelEl = <span className="stp-level-label member">Member {memberCounters.current[k]}</span>;
        }

        const trClass = row.type === "team" ? "team-row" : row.type === "head" ? "head-row" : "";
        const indentClass = indent > 0 ? `stp-indent-${indent}` : "";

        let childRows = [];
        if (expanded && row.type === "team" && row.children) {
          memberCounters.current[row.name] = 0;
          Object.keys(row.children.heads).forEach((h) => {
            childRows.push({ type: "head", name: h, stats: calcStats(row.children.heads[h]) });
          });
          Object.keys(row.children.salesmen).forEach((s) => {
            childRows.push({ type: "salesman", name: s, stats: calcStats(row.children.salesmen[s]) });
          });
          if (row.sortColumn) childRows = sortRows(childRows, row.sortColumn, row.sortDirection);
        }

        return (
          <React.Fragment key={row.name + "-" + row.type}>
            <tr className={trClass}>
              <td>
                <div className={`stp-employee-name ${indentClass}`}>
                  {row.type === "team" && (
                    <span
                      className={`stp-expand-icon ${expanded ? "expanded" : ""}`}
                      onClick={() => toggleExpand(row.name + "-" + row.type)}
                    >▶</span>
                  )}
                  <span className="stp-employee-name-text">{row.name}</span>
                  {labelEl}
                </div>
              </td>
              <td>{fmt(row.stats.approved, "n")}</td>
              <td>{fmt(row.stats.unapproved, "n")}</td>
              <td>
                <span className="stp-percentage">
                  {fmt(row.stats.percentage, "p")}{row.stats.percentage > 0 ? "%" : ""}
                </span>
              </td>
              <td><span className="stp-sales-value">{fmt(row.stats.sales, "sales")}</span></td>
            </tr>
            {expanded && row.children && (
              <TableRows
                rows={childRows}
                indent={indent + 1}
                parentTeam={row.name}
                expandedRows={expandedRows}
                toggleExpand={toggleExpand}
                memberCounters={memberCounters}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
export default function SalesTeamPerformance() {
  // ── Role-based setup ─────────────────────────────────
  const currentUser   = getStoredUser();
  const isAllowed     = !!currentUser && PAGE_ALLOWED_ROLES.includes(currentUser.role);
  const isGlobalAdmin = !!currentUser && GLOBAL_ADMIN_ROLES.includes(currentUser.role);
  const boundCompanyKey = (!isGlobalAdmin && currentUser?.company_id)
    ? (COMPANY_ID_TO_KEY[currentUser.company_id] ?? null)
    : null;

  const [currentCompany, setCurrentCompany] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({ project: [], team: [], salesman: [] });
  const [startDate, setStartDate]   = useState("");
  const [endDate,   setEndDate]     = useState("");
  const [currentPeriod, setPeriod]  = useState("quarterly");
  const [expandedRows, setExpanded] = useState(new Set());
  const [sortState, setSortState]   = useState({ column: null, direction: 0 });
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const [modalType, setModalType]   = useState(null);

  // ── NEW: API state ────────────────────────────────────
  const [currentData, setCurrentData] = useState([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [apiError,    setApiError]    = useState(null);

  // Refs for charts
  const salesmenCanvasRef = useRef(null);
  const teamsCanvasRef    = useRef(null);
  const trendCanvasRef    = useRef(null);
  const salesmenChart     = useRef(null);
  const teamsChart        = useRef(null);
  const trendChart        = useRef(null);
  const memberCounters    = useRef({});

  // ── Auto-load for bound (non-global-admin) users ──────
  useEffect(() => {
    if (!isGlobalAdmin && boundCompanyKey) {
      setCurrentCompany(boundCompanyKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── NEW: Fetch data from API whenever company changes ─
  useEffect(() => {
    if (!currentCompany) {
      setCurrentData([]);
      return;
    }
    setIsLoading(true);
    setApiError(null);
    fetchSalesRequests(currentCompany)
      .then((data) => {
        setCurrentData(data);
      })
      .catch((err) => {
        console.error("Failed to fetch sales requests:", err);
        setApiError("Failed to load data. Please check that JSON Server is running.");
        setCurrentData([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentCompany]);

  // ── Memoized filteredData ─────────────────────────────
  const filteredData = useMemo(
    () => (currentCompany ? applyFilters(currentData, selectedFilters, startDate, endDate) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentData, selectedFilters, startDate, endDate]
  );

  // ── All unique options from current company data ──────
  const allOptions = {
    project:  currentData ? [...new Set(currentData.map((d) => d.project))].sort() : [],
    team:     currentData ? [...new Set(currentData.map((d) => d.team))].sort()    : [],
    salesman: currentData ? [...new Set(currentData.map((d) => d.salesman))].sort(): [],
  };

  const availableOptions = {
    project:  getAvailableOptions(currentData, selectedFilters, "project"),
    team:     getAvailableOptions(currentData, selectedFilters, "team"),
    salesman: getAvailableOptions(currentData, selectedFilters, "salesman"),
  };

  // ── Company change ────────────────────────────────────
  function handleCompanyChange(e) {
    const val = e.target.value;
    if (!val) return;
    setCurrentCompany(val);
    setSelectedFilters({ project: [], team: [], salesman: [] });
    setStartDate(""); setEndDate("");
    setExpanded(new Set());
    setSortState({ column: null, direction: 0 });
    setPeriod("quarterly");
  }

  // ── Reset all filters ─────────────────────────────────
  function handleReset() {
    setSelectedFilters({ project: [], team: [], salesman: [] });
    setStartDate(""); setEndDate("");
    setExpanded(new Set());
    setSortState({ column: null, direction: 0 });
    setPeriod("quarterly");
  }

  // ── Chart-click filter toggles ────────────────────────
  const toggleFilterBySalesman = useCallback((s) => {
    setSelectedFilters((f) => ({
      ...f,
      salesman: f.salesman.length === 1 && f.salesman[0] === s ? [] : [s],
    }));
  }, []);

  const toggleFilterByTeam = useCallback((t) => {
    setSelectedFilters((f) => ({
      ...f,
      team: f.team.length === 1 && f.team[0] === t ? [] : [t],
    }));
  }, []);

  // ── Table sort ────────────────────────────────────────
  function handleSort(col) {
    setSortState((prev) => ({
      column: col,
      direction: prev.column === col ? (prev.direction === 1 ? -1 : 1) : 1,
    }));
  }

  // ── Expand/collapse ───────────────────────────────────
  function toggleExpand(key) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // ── Build table rows ──────────────────────────────────
  function buildTableRows() {
    const hier = buildHierarchy(filteredData);
    memberCounters.current = {};
    let allRows = [];

    Object.keys(hier.teams).forEach((team) => {
      const td = hier.teams[team];
      allRows.push({
        type: "team",
        name: team,
        stats: calcStats([...Object.values(td.heads).flat(), ...Object.values(td.salesmen).flat()]),
        children: td,
        sortColumn: sortState.column,
        sortDirection: sortState.direction,
      });
    });

    if (hier.noTeam.length > 0) {
      const byPerson = {};
      hier.noTeam.forEach((d) => { if (!byPerson[d.salesman]) byPerson[d.salesman] = []; byPerson[d.salesman].push(d); });
      allRows.push({
        type: "team",
        name: "No Team",
        stats: calcStats(hier.noTeam),
        children: { salesmen: byPerson, heads: {} },
        sortColumn: sortState.column,
        sortDirection: sortState.direction,
      });
    }

    if (sortState.column) allRows = sortRows(allRows, sortState.column, sortState.direction);
    return allRows;
  }

  // ── Sort indicator text ───────────────────────────────
  function sortIcon(col) {
    if (sortState.column !== col) return "↕";
    return sortState.direction === 1 ? "▼" : "▲";
  }

  // ── Draw / update Pie charts ──────────────────────────
  useEffect(() => {
    if (!currentCompany || !salesmenCanvasRef.current) return;
    if (salesmenChart.current) { salesmenChart.current.destroy(); salesmenChart.current = null; }
    const { labels, values, counts, total } = buildPieData(filteredData, "salesman");
    if (!labels.length) return;
    const cfg = makePieChartConfig({ labels, values, counts, total, colors: C1, legendPos: "bottom", anchorThreshold: 5, onClickCb: toggleFilterBySalesman });
    salesmenChart.current = new Chart(salesmenCanvasRef.current, cfg);
    return () => { if (salesmenChart.current) { salesmenChart.current.destroy(); salesmenChart.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData]);

  useEffect(() => {
    if (!currentCompany || !teamsCanvasRef.current) return;
    if (teamsChart.current) { teamsChart.current.destroy(); teamsChart.current = null; }
    const { labels, values, counts, total } = buildPieData(filteredData, "team");
    if (!labels.length) return;
    const cfg = makePieChartConfig({ labels, values, counts, total, colors: C2, legendPos: "bottom", anchorThreshold: 5, onClickCb: toggleFilterByTeam });
    teamsChart.current = new Chart(teamsCanvasRef.current, cfg);
    return () => { if (teamsChart.current) { teamsChart.current.destroy(); teamsChart.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData]);

  useEffect(() => {
    if (!currentCompany || !trendCanvasRef.current) return;
    if (trendChart.current) { trendChart.current.destroy(); trendChart.current = null; }
    const { labels, values, counts } = buildTrendData(filteredData, currentPeriod);
    if (!labels.length) return;
    const cfg = makeTrendChartConfig({ labels, values, counts });
    trendChart.current = new Chart(trendCanvasRef.current, cfg);
    return () => { if (trendChart.current) { trendChart.current.destroy(); trendChart.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, currentPeriod]);

  // ── Dynamic chart titles ──────────────────────────────
  const { labels: sLabels } = currentCompany ? buildPieData(filteredData, "salesman") : { labels: [] };
  const { labels: tLabels } = currentCompany ? buildPieData(filteredData, "team")    : { labels: [] };

  const tableRows = currentCompany ? buildTableRows() : [];

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────

  if (!isAllowed) return <Navigate to="/" replace />;

  const boundCompanyLabel = boundCompanyKey
    ? (COMPANIES.find((c) => c.value === boundCompanyKey)?.label ?? "")
    : "";

  return (
    <div className="stp-root">
      {/* ── HEADER ── */}
      <div className="stp-header">
        <div className="stp-header-left">
          <h1>
            Sales Requests Analysis Dashboard
            {!isGlobalAdmin && boundCompanyLabel && ` — ${boundCompanyLabel}`}
          </h1>
        </div>

        {isGlobalAdmin && (
          <div className="stp-company-selector">
            <label className="stp-company-label">Select a Company</label>
            <select className="stp-company-select" value={currentCompany || ""} onChange={handleCompanyChange}>
              <option value="">Select...</option>
              {COMPANIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── CONTAINER ── */}
      <div className="stp-container">
        {/* ── NEW: Loading & Error states ── */}
        {isLoading && (
          <div className="stp-welcome">
            <div className="stp-search-icon">⏳</div>
            <p>Loading dashboard data...</p>
          </div>
        )}

        {!isLoading && apiError && (
          <div className="stp-welcome">
            <div className="stp-search-icon">⚠️</div>
            <p style={{ color: "#E55527" }}>{apiError}</p>
          </div>
        )}

        {!isLoading && !apiError && !currentCompany && (
          <div className="stp-welcome">
            <div className="stp-search-icon">🔍</div>
            <p>
              {isGlobalAdmin
                ? "Select a company to view the sales requests analysis dashboard"
                : "Loading dashboard..."}
            </p>
          </div>
        )}

        {!isLoading && !apiError && currentCompany && (
          <div className="stp-dashboard">

            {/* ── FILTERS ── */}
            <div className="stp-filters-section">
              <div className="stp-filters-header">
                <h2>Filters</h2>
                <button className="stp-reset-btn" onClick={handleReset}>Reset All Filters</button>
              </div>
              <div className="stp-filters-grid">
                {["project", "team", "salesman"].map((type) => (
                  <FilterDropdown
                    key={type}
                    type={type}
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                    placeholder={`Search ${type}s...`}
                    selected={selectedFilters[type]}
                    allOptions={allOptions[type]}
                    availableOptions={availableOptions[type]}
                    onChangeSelected={(val) => setSelectedFilters((f) => ({ ...f, [type]: val }))}
                    openKey={openDropdownKey}
                    setOpenKey={setOpenDropdownKey}
                  />
                ))}
                {/* Date range */}
                <div className="stp-filter-group">
                  <div className="stp-date-inputs">
                    <div className="stp-date-input-group">
                      <label className="stp-filter-label">Start Date</label>
                      <input type="date" className="stp-date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="stp-date-input-group">
                      <label className="stp-filter-label">End Date</label>
                      <input type="date" className="stp-date-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CHARTS ── */}
            <div className="stp-charts-section">
              <div className="stp-charts-row">
                {/* Salesmen Pie */}
                <div className="stp-chart-card">
                  <div className="stp-chart-header">
                    <h3 className="stp-chart-title">Top {sLabels.length} Salesman</h3>
                    <button className="stp-expand-btn" onClick={() => setModalType("salesmen")}>⛶</button>
                  </div>
                  <div className="stp-chart-container">
                    <canvas ref={salesmenCanvasRef} />
                  </div>
                </div>
                {/* Teams Pie */}
                <div className="stp-chart-card">
                  <div className="stp-chart-header">
                    <h3 className="stp-chart-title">Top {tLabels.length} Teams</h3>
                    <button className="stp-expand-btn" onClick={() => setModalType("teams")}>⛶</button>
                  </div>
                  <div className="stp-chart-container">
                    <canvas ref={teamsCanvasRef} />
                  </div>
                </div>
              </div>

              {/* Trend Line */}
              <div className="stp-chart-card stp-chart-full-width">
                <div className="stp-chart-header">
                  <h3 className="stp-chart-title">Sales Trend</h3>
                  <div className="stp-chart-actions">
                    <div className="stp-period-selector">
                      {["annually", "quarterly", "monthly"].map((p) => (
                        <button
                          key={p}
                          className={`stp-period-btn ${currentPeriod === p ? "active" : ""}`}
                          onClick={() => setPeriod(p)}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                    <button className="stp-expand-btn" onClick={() => setModalType("trend")}>⛶</button>
                  </div>
                </div>
                <div className="stp-chart-scroll">
                  <div className="stp-chart-container line">
                    <canvas ref={trendCanvasRef} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── TABLE ── */}
            <div className="stp-table-section">
              <h2>Hierarchical Analysis</h2>
              <div className="stp-table-wrapper">
                <table className="stp-table">
                  <thead>
                    <tr>
                      {[
                        { col: "employee",   label: "Employee Name" },
                        { col: "approved",   label: "Approved Requests" },
                        { col: "unapproved", label: "Unapproved Requests" },
                        { col: "percentage", label: "Approval %" },
                        { col: "sales",      label: "Total Sales" },
                      ].map(({ col, label }) => (
                        <th key={col} onClick={() => handleSort(col)}>
                          {label}{" "}
                          <span className={`stp-sort-indicator ${sortState.column === col ? "active" : ""}`}>
                            {sortIcon(col)}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <TableRows
                      rows={tableRows}
                      indent={0}
                      parentTeam=""
                      expandedRows={expandedRows}
                      toggleExpand={toggleExpand}
                      memberCounters={memberCounters}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {modalType && (
        <ChartModal
          modalType={modalType}
          onClose={() => setModalType(null)}
          filteredData={filteredData}
          currentPeriod={currentPeriod}
          onToggleSalesman={(s) => toggleFilterBySalesman(s)}
          onToggleTeam={(t) => toggleFilterByTeam(t)}
        />
      )}
    </div>
  );
}