import React, { useState, useRef, useEffect } from 'react';
import './datatable.css';
import * as XLSX from 'xlsx';

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'unit_code',                 label: 'Unit Code',        type: 'text'   },
  { key: 'project',                   label: 'Project',          type: 'text'   },
  { key: 'unit_type',                 label: 'Unit Type',        type: 'text'   },
  { key: 'sellable_area',             label: 'Area (sqm)',       type: 'number' },
  { key: 'status',                    label: 'Status',           type: 'text'   },
  { key: 'interest_free_unit_price',  label: 'Price',            type: 'number' },
  { key: 'sales_value',               label: 'Sales Value',      type: 'number' },
  { key: 'psm',                       label: 'PSM',              type: 'number' },
  { key: 'development_delivery_date', label: 'Delivery Date',    type: 'date'   },
  { key: 'reservation_date',          label: 'Reservation Date', type: 'date'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtNumber   = (n) => (isNaN(+n) ? '-' : Math.round(+n).toLocaleString());
const fmtCurrency = (n) =>
  isNaN(+n) ? '-' :
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(+n);

// ✅ Always returns a string — prevents v.toLowerCase crash on numbers/null
const safeStr = (v) => (v == null ? '' : String(v));

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const buildDateHierarchy = (dates) => {
  const map = {};
  dates.forEach((d) => {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return;
    const y = dt.getFullYear();
    const m = dt.getMonth();
    if (!map[y]) map[y] = new Set();
    map[y].add(m);
  });
  return Object.keys(map)
    .sort((a, b) => b - a)
    .map((y) => ({ year: +y, months: [...map[y]].sort((a, b) => a - b) }));
};

// ─── FilterDropdown ───────────────────────────────────────────────────────────
const FilterDropdown = ({ column, allUnits, filteredUnits, activeFilters, onApply, onClose, anchorRect }) => {
  const { key, label, type } = column;

  // ── Number ──
  const numValues = allUnits.map((u) => parseFloat(u[key])).filter((v) => !isNaN(v) && v > 0);
  const absMin = numValues.length ? Math.min(...numValues) : 0;
  const absMax = numValues.length ? Math.max(...numValues) : 0;
  const activeNum = activeFilters?.number?.[key];
  const [minVal, setMinVal] = useState(activeNum ? activeNum.min : absMin);
  const [maxVal, setMaxVal] = useState(activeNum ? activeNum.max : absMax);

  // ── Text — safeStr every value to avoid toLowerCase crash ──
  const uniqueText = [...new Set(
    filteredUnits.map((u) => safeStr(u[key])).filter((v) => v !== '')
  )].sort();
  const activeText = activeFilters?.text?.[key] || [];
  const [textSearch, setTextSearch]   = useState('');
  const [checkedText, setCheckedText] = useState(new Set(activeText));

  // ── Date ──
  const hierarchy  = buildDateHierarchy(filteredUnits.map((u) => u[key]).filter(Boolean));
  const activeDates = activeFilters?.date?.[key] || [];
  const [checkedDates, setCheckedDates]   = useState(new Set(activeDates));
  const [dateSearch, setDateSearch]       = useState('');
  const [expandedYears, setExpandedYears] = useState({});

  const dropRef = useRef(null);

  const style = anchorRect ? {
    position: 'fixed',
    top:  anchorRect.bottom + 4,
    left: Math.min(anchorRect.left, window.innerWidth - 230),
    zIndex: 999999,
  } : { position: 'fixed', top: 80, left: 80, zIndex: 999999 };

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const handleApply = () => {
    if (type === 'number')    onApply(key, type, { min: +minVal, max: +maxVal });
    else if (type === 'text') onApply(key, type, [...checkedText]);
    else                      onApply(key, type, [...checkedDates]);
    onClose();
  };

  const handleClear = () => {
    if (type === 'number')    { setMinVal(absMin); setMaxVal(absMax); }
    else if (type === 'text')   setCheckedText(new Set());
    else                        setCheckedDates(new Set());
  };

  const toggleText = (v) =>
    setCheckedText((p) => { const s = new Set(p); s.has(v) ? s.delete(v) : s.add(v); return s; });
  const toggleDate = (k) =>
    setCheckedDates((p) => { const s = new Set(p); s.has(k) ? s.delete(k) : s.add(k); return s; });
  const toggleYear = (year, months, checked) =>
    setCheckedDates((p) => {
      const s = new Set(p);
      months.forEach((m) => {
        const k = `${year}-${String(m + 1).padStart(2, '0')}`;
        checked ? s.add(k) : s.delete(k);
      });
      return s;
    });

  const selectAllText  = () => setCheckedText(new Set(uniqueText));
  const clearAllText   = () => setCheckedText(new Set());
  const selectAllDates = () => {
    const all = new Set();
    hierarchy.forEach(({ year, months }) =>
      months.forEach((m) => all.add(`${year}-${String(m + 1).padStart(2, '0')}`))
    );
    setCheckedDates(all);
  };
  const clearAllDates = () => setCheckedDates(new Set());

  // ✅ safeStr before toLowerCase — no more crash
  const filteredText = uniqueText.filter((v) =>
    safeStr(v).toLowerCase().includes(safeStr(textSearch).toLowerCase())
  );

  const filteredHierarchy = hierarchy
    .map((y) => ({
      ...y,
      months: y.months.filter((m) =>
        !dateSearch ||
        String(y.year).includes(dateSearch) ||
        MONTH_NAMES[m].toLowerCase().includes(dateSearch.toLowerCase())
      ),
    }))
    .filter((y) => y.months.length > 0);

  return (
    <div ref={dropRef} className="col-filter-dropdown" style={style}>
      <div className="col-filter-header">
        <span>Filter: {label}</span>
        <button className="col-filter-close" onClick={onClose}>×</button>
      </div>

      <div className="col-filter-body">
        
        {/* ── Number ── */}
        {type === 'number' && (
          <div className="col-filter-range">
            <div className="col-range-row">
              <label>Min</label>
              <input type="number" value={minVal} min={absMin} max={absMax}
                onChange={(e) => setMinVal(e.target.value)} />
            </div>
            <div className="col-range-hint-row" style={{ textAlign: 'left', paddingLeft: '34px' }}>
              min: {fmtNumber(absMin)}
            </div>
            <div className="col-range-row">
              <label>Max</label>
              <input type="number" value={maxVal} min={absMin} max={absMax}
                onChange={(e) => setMaxVal(e.target.value)} />
            </div>
            <div className="col-range-hint-row" style={{ textAlign: 'left', paddingLeft: '34px' }}>
              max: {fmtNumber(absMax)}
            </div>
          </div>
        )}
        {/* ── Text ── */}
        {type === 'text' && (
          <>
            <input className="col-filter-search" type="text" placeholder="Search..."
              value={textSearch} onChange={(e) => setTextSearch(e.target.value)} />
            <div className="col-filter-actions">
              <button className="col-action-btn" onClick={selectAllText}>Select All</button>
              <button className="col-action-btn" onClick={clearAllText}>Clear All</button>
            </div>
            <div className="col-filter-options">
              {filteredText.map((v) => (
                <label key={v} className="col-filter-option">
                  <input type="checkbox" checked={checkedText.has(v)} onChange={() => toggleText(v)} />
                  <span>{v}</span>
                </label>
              ))}
              {filteredText.length === 0 && <div className="col-empty">No options</div>}
            </div>
          </>
        )}

        {/* ── Date ── */}
        {type === 'date' && (
          <>
            <input className="col-filter-search" type="text" placeholder="Year or month..."
              value={dateSearch} onChange={(e) => setDateSearch(e.target.value)} />
            <div className="col-filter-actions">
              <button className="col-action-btn" onClick={selectAllDates}>Select All</button>
              <button className="col-action-btn" onClick={clearAllDates}>Clear All</button>
            </div>
            <div className="col-filter-options">
              {filteredHierarchy.map(({ year, months }) => {
                const allKeys    = months.map((m) => `${year}-${String(m + 1).padStart(2, '0')}`);
                const allChecked = allKeys.every((k) => checkedDates.has(k));
                const isOpen     = !!expandedYears[year];
                return (
                  <div key={year} className="col-date-year-group">
                    <div className="col-date-year-header"
                      onClick={() => setExpandedYears((p) => ({ ...p, [year]: !p[year] }))}>
                      <span className="col-year-toggle">{isOpen ? '▼' : '▶'}</span>
                      <input type="checkbox" checked={allChecked}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => toggleYear(year, months, e.target.checked)} />
                      <span className="col-year-label">{year}</span>
                    </div>
                    {isOpen && (
                      <div className="col-date-months">
                        {months.map((m) => {
                          const dk = `${year}-${String(m + 1).padStart(2, '0')}`;
                          return (
                            <label key={dk} className="col-filter-option col-month-option">
                              <input type="checkbox" checked={checkedDates.has(dk)}
                                onChange={() => toggleDate(dk)} />
                              <span>{MONTH_NAMES[m]}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredHierarchy.length === 0 && <div className="col-empty">No dates</div>}
            </div>
          </>
        )}
      </div>

      <div className="col-filter-footer">
        <button className="col-clear-btn" onClick={handleClear}>Clear</button>
        <button className="col-apply-btn" onClick={handleApply}>Apply</button>
      </div>
    </div>
  );
};

// ─── Main DataTable ───────────────────────────────────────────────────────────
const DataTable = ({
  units,               // already-filtered units from dashboard
  allUnits,            // full unfiltered list (for number range abs bounds)
  onFilterChange,      // (filterType, values[])     → updates dashboard text filters
  onDateRangeChange,   // (rangeKey, start, end)     → updates dashboard date ranges
  onNumberRangeChange, // (rangeKey, min, max, true) → updates dashboard number ranges
  activeFilters = {},  // { number:{col:{min,max}}, text:{col:[]}, date:{col:[]} }
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortState, setSortState]   = useState({ column: null, order: '' });
  const [openFilter, setOpenFilter] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const tableScrollRef = useRef(null);

  // ── Search (local, unit code only) ──
  const searched = (units || []).filter((u) =>
    !searchTerm || safeStr(u.unit_code).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Sort ──
  const sorted = [...searched].sort((a, b) => {
    if (!sortState.column) return 0;
    const col = sortState.column;
    let va = a[col], vb = b[col];
    if (['sellable_area','interest_free_unit_price','sales_value','psm'].includes(col)) {
      va = parseFloat(va) || 0; vb = parseFloat(vb) || 0;
    } else if (['development_delivery_date','reservation_date'].includes(col)) {
      va = va ? new Date(va).getTime() : 0;
      vb = vb ? new Date(vb).getTime() : 0;
    } else {
      va = safeStr(va).toLowerCase();
      vb = safeStr(vb).toLowerCase();
    }
    if (sortState.order === 'asc') return va > vb ? 1 : va < vb ? -1 : 0;
    return va < vb ? 1 : va > vb ? -1 : 0;
  });

  const handleSort = (colKey) => {
    setSortState((prev) => {
      if (prev.column !== colKey) return { column: colKey, order: 'desc' };
      if (prev.order === 'desc')  return { column: colKey, order: 'asc' };
      return { column: null, order: '' };
    });
  };

  const handleFilterClick = (e, colKey) => {
    e.stopPropagation();
    if (openFilter === colKey) { setOpenFilter(null); return; }
    setAnchorRect(e.currentTarget.closest('th').getBoundingClientRect());
    setOpenFilter(colKey);
  };

  // ── Column → dashboard filter key maps ──
  const NUMBER_MAP = {
    sellable_area:             'grossAreaRange',
    interest_free_unit_price:  'interestFreePriceRange',
    sales_value:               'salesValueRange',
    psm:                       'psmRange',
  };
  // text columns that map to dashboard filter arrays
  const TEXT_MAP = {
    project:   'projects',
    unit_type: 'unitTypes',
    status:    'statuses',
  };

  // ── Apply filter → propagate to dashboard ──
  const handleApplyFilter = (colKey, type, value) => {
    if (type === 'number') {
      const rk = NUMBER_MAP[colKey];
      if (rk && onNumberRangeChange) onNumberRangeChange(rk, value.min, value.max, true);

    } else if (type === 'text') {
      const ft = TEXT_MAP[colKey];
      if (ft && onFilterChange) onFilterChange(ft, value);
      // unit_code has no dashboard counterpart — already handled by local searchTerm

    } else if (type === 'date') {
      if (!value.length) {
        if (colKey === 'reservation_date'           && onDateRangeChange) onDateRangeChange('salesDateRange', null, null);
        if (colKey === 'development_delivery_date'  && onDateRangeChange) onDateRangeChange('deliveryDateRange', null, null);
        return;
      }
      const dates   = value.map((k) => { const [y, m] = k.split('-'); return new Date(+y, +m - 1, 1); });
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      maxDate.setMonth(maxDate.getMonth() + 1); maxDate.setDate(0); // end of last month
      if (colKey === 'reservation_date'           && onDateRangeChange) onDateRangeChange('salesDateRange', minDate, maxDate);
      if (colKey === 'development_delivery_date'  && onDateRangeChange) onDateRangeChange('deliveryDateRange', minDate, maxDate);
    }
  };

  // ── Is filtered? ──
  const isFiltered = (col) => {
    if (col.type === 'number') return !!(activeFilters?.number?.[col.key]);
    if (col.type === 'text')   return (activeFilters?.text?.[col.key] || []).length > 0;
    if (col.type === 'date')   return (activeFilters?.date?.[col.key] || []).length > 0;
    return false;
  };

  const sortIcon = (colKey) => {
    if (sortState.column !== colKey) return <span className="sort-icon-neutral">⇅</span>;
    return <span className="sort-icon-active">{sortState.order === 'desc' ? '↓' : '↑'}</span>;
  };

  useEffect(() => {
    if (!isExpanded) return;
    const el = tableScrollRef.current;
    if (!el) return;
    const fn = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setIsAtBottom(Math.abs(scrollHeight - scrollTop - clientHeight) < 10);
    };
    el.addEventListener('scroll', fn);
    fn();
    return () => el.removeEventListener('scroll', fn);
  }, [isExpanded]);

  const totalPrice = sorted.reduce((s, u) => s + (parseFloat(u.interest_free_unit_price) || 0), 0);
  const totalSales = sorted.reduce((s, u) => s + (parseFloat(u.sales_value) || 0), 0);

  const exportToExcel = () => {
    const data = sorted.map((u) => ({
      'Unit Code':        u.unit_code ? u.unit_code.split('_')[0] : '-',
      'Project':          u.project || '-',
      'Unit Type':        u.unit_type || '-',
      'Area':             u.sellable_area || '-',
      'Status':           u.status || '-',
      'Price':            u.interest_free_unit_price || '-',
      'Sales Value':      u.sales_value || '-',
      'PSM':              u.psm || '-',
      'Delivery Date':    u.development_delivery_date || '-',
      'Reservation Date': u.reservation_date || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Units Data');
    XLSX.writeFile(wb, `Units_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const openCol = openFilter ? COLUMNS.find((c) => c.key === openFilter) : null;

  return (
    <div className="table-containery">
      <div className="table-header">
        <h3>Unit Details <span className="table-count">({sorted.length})</span></h3>
        <div className="table-controls">
          <div className="search-box">
            <input type="text" placeholder="Search BY Unit Code..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={exportToExcel}>Export</button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsExpanded((p) => !p)}>
            {isExpanded ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={`table-scroll ${isAtBottom ? 'at-bottom' : ''}`} ref={tableScrollRef}>
          <table className="units-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.key}>
                    <div className="th-inner">
                      <span className="th-label">{col.label}</span>
                      <span className="th-icons">
                        <button
                          className={`th-icon-btn filter-icon-btn ${isFiltered(col) ? 'active' : ''}`}
                          title={`Filter ${col.label}`}
                          onClick={(e) => handleFilterClick(e, col.key)}
                        >
                          {isFiltered(col) ? '🔹' : '🔻'}
                        </button>
                        <button
                          className="th-icon-btn sort-icon-btn"
                          title={`Sort ${col.label}`}
                          onClick={() => handleSort(col.key)}
                        >
                          {sortIcon(col.key)}
                        </button>
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sorted.map((unit, i) => (
                <tr key={i}>
                  <td>{unit.unit_code ? unit.unit_code.split('_')[0] : '-'}</td>
                  <td>{unit.project || '-'}</td>
                  <td>{unit.unit_type || '-'}</td>
                  <td>{fmtNumber(unit.sellable_area)}</td>
                  <td>{unit.status || '-'}</td>
                  <td>{fmtCurrency(unit.interest_free_unit_price)}</td>
                  <td>{fmtCurrency(unit.sales_value)}</td>
                  <td>{fmtCurrency(unit.psm)}</td>
                  <td>{unit.development_delivery_date || '-'}</td>
                  <td>{unit.reservation_date || '-'}</td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <td className="footer-label">Grand Total:</td>
                <td /><td /><td /><td />
                <td className="footer-value">{fmtCurrency(totalPrice)}</td>
                <td className="footer-value">{fmtCurrency(totalSales)}</td>
                <td /><td /><td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {openFilter && openCol && (
        <FilterDropdown
          column={openCol}
          allUnits={allUnits || units || []}
          filteredUnits={units || []}
          activeFilters={activeFilters}
          onApply={handleApplyFilter}
          onClose={() => setOpenFilter(null)}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
};

export default DataTable;