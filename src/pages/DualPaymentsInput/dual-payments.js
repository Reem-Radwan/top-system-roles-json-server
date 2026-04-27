import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import Swal from 'sweetalert2';
import './dual-payments.css';
import {
  apiFetchPlan,
  apiSavePlan,
  apiDeletePlan,
  apiFetchCompanies,
  apiFetchProjects,
} from '../../services/dual-paymentsapi';

const MAX_ROWS = 42;

function fmt(num) {
  return parseFloat(num.toFixed(5));
}

// ─── Main Component ───────────────────────────────────────────
export default function DualPayment() {
  // Filter state
  const [company, setCompany]             = useState('');
  const [project, setProject]             = useState('');
  const [year, setYear]                   = useState('1');
  const [scheme, setScheme]               = useState('flat');
  const [planCode, setPlanCode]           = useState('');
  const [planCodeDraft, setPlanCodeDraft] = useState('');

  // UI state
  const [disableAdditional, setDisableAdditional] = useState(false);
  const [showControls, setShowControls]           = useState(false);
  const [showPayments, setShowPayments]           = useState(false);
  const [planTitle, setPlanTitle]                 = useState('Extended Payments — Default');
  const [planTitleCoded, setPlanTitleCoded]       = useState(false);
  const [totalNPV, setTotalNPV]                   = useState(0);
  const [toast, setToast]                         = useState(null);
  const [loading, setLoading]                     = useState(false);

  // Companies & projects from API
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects]   = useState([]);

  // Table rows
  const [rows, setRows] = useState([]);

  // Drag state
  const dragState = useRef({
    isDragging: false,
    startIndex: null,
    startCol: null,
    startValue: 0,
    focusedIndex: null,
    focusedCol: null,
    highlightedIndices: [],
    scrollInterval: null,
    lastX: 0,
    lastY: 0,
  });
  const [highlightedIndices, setHighlightedIndices] = useState([]);
  const [focusedCell, setFocusedCell] = useState(null);

  const tableRef = useRef(null);
  const SCROLL_ZONE = 60, SCROLL_SPEED = 15;

  // ─── Toast helper ───
  function showToast(msg, isErr) {
    setToast({ msg, err: isErr });
    setTimeout(() => setToast(null), 3000);
  }

  // ─── Build rows array ───
  function buildEmptyRows(count) {
    return Array.from({ length: Math.min(count, MAX_ROWS) }, () => ({
      value: 0,
      dr: 0,
      npv: 0,
      cumulative: 0,
    }));
  }

  // ─── Compute NPV / cumulative ───
  function runMath(rowsIn) {
    let cumSum = 0, totalNPVCalc = 0;
    const updated = rowsIn.map((row, i) => {
      const val  = parseFloat(row.value) || 0;
      const dr   = parseFloat(row.dr) || 0;
      const vDec = val / 100, dDec = dr / 100;
      const npv  = i <= 1 ? vDec : vDec / Math.pow(1 + dDec, i - 1);
      totalNPVCalc += npv;
      cumSum += val;
      return { ...row, npv, cumulative: cumSum < 0.000001 ? 0 : cumSum };
    });
    return { rows: updated, totalNPV: totalNPVCalc };
  }

  // ─── Reload payments (async) ───
  const reloadPayments = useCallback(async () => {
    const code = planCode.trim();
    if (code) {
      setPlanTitle(`Extended Payments — ${code}`);
      setPlanTitleCoded(true);
    } else {
      setPlanTitle('Extended Payments — Default');
      setPlanTitleCoded(false);
    }

    if (!project) {
      setShowControls(false);
      setShowPayments(false);
      return;
    }

    setShowControls(true);
    setShowPayments(true);
    setLoading(true);

    const yrs      = parseInt(year) || 0;
    const rowCount = Math.max(2, Math.min(yrs * 4 + 2, MAX_ROWS));
    const emptyRows = buildEmptyRows(rowCount);

    try {
      const res = await apiFetchPlan(project, year, scheme, code);
      if (res.success) {
        const data = res.data;
        if ('disable_additional_discount' in data)
          setDisableAdditional(!!data.disable_additional_discount);

        const loaded = emptyRows.map((row, i) => {
          let val = 0, dr = 0;
          if (i === 0)      { val = data.dp1 || 0;                     dr = data.dp1_discount_rate || 0; }
          else if (i === 1) { val = data.dp2 || 0;                     dr = data.dp2_discount_rate || 0; }
          else              { val = data[`installment_${i - 2}`] || 0; dr = data[`installment_${i - 2}_discount_rate`] || 0; }
          return { ...row, value: val, dr };
        });

        const { rows: computed, totalNPV: npv } = runMath(loaded);
        setRows(computed);
        setTotalNPV(npv);
      } else {
        showToast('Error loading data', true);
        const { rows: computed, totalNPV: npv } = runMath(emptyRows);
        setRows(computed);
        setTotalNPV(npv);
      }
    } catch {
      showToast('Network error loading data', true);
      const { rows: computed, totalNPV: npv } = runMath(emptyRows);
      setRows(computed);
      setTotalNPV(npv);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, year, scheme, planCode]);

  // ─── Fetch companies on mount ───
  useEffect(() => {
    apiFetchCompanies().then(res => {
      if (res.success) setCompanies(res.data);
    });
  }, []);

  // ─── Fetch projects when company changes ───
  useEffect(() => {
    if (!company) { setProjects([]); return; }
    apiFetchProjects(company).then(res => {
      if (res.success) setProjects(res.data);
    });
  }, [company]);

  useEffect(() => { reloadPayments(); }, [reloadPayments]);

  // ─── Value change ───
  function handleValueChange(index, raw) {
    setRows(prev => {
      const next = prev.map((r, i) =>
        i === index ? { ...r, value: raw === '' ? 0 : parseFloat(raw) || 0 } : r
      );
      let tot = next.reduce((s, r) => s + (parseFloat(r.value) || 0), 0);
      let capped = next;
      if (tot > 100.00001) {
        const cur     = parseFloat(raw) || 0;
        const allowed = cur - (tot - 100);
        capped = next.map((r, i) => i === index ? { ...r, value: allowed > 0 ? allowed : 0 } : r);
      }
      const { rows: computed, totalNPV: npv } = runMath(capped);
      setTotalNPV(npv);
      saveSingle(index, capped);
      return computed;
    });
  }

  // ─── DR change ───
  function handleDrChange(index, raw) {
    setRows(prev => {
      const next = prev.map((r, i) =>
        i === index ? { ...r, dr: raw === '' ? 0 : parseFloat(raw) || 0 } : r
      );
      const { rows: computed, totalNPV: npv } = runMath(next);
      setTotalNPV(npv);
      saveSingle(index, computed);
      return computed;
    });
  }

  // ─── Save single row (fire-and-forget) ───
  function saveSingle(index, currentRows) {
    if (!project) return;
    const row  = currentRows[index];
    const val  = parseFloat(row.value) || 0;
    const dr   = parseFloat(row.dr) || 0;
    const vDec = val / 100, dDec = dr / 100;
    const npv  = index <= 1 ? vDec : vDec / Math.pow(1 + dDec, index - 1);
    apiSavePlan({
      project_id: project, year, scheme,
      payment_plan_code: planCode,
      index, value: val, discount_rate: dr, npv,
      disable_additional_discount: disableAdditional,
    }).then(res => {
      if (!res.success) showToast('Save failed', true);
    });
  }

  // ─── Bulk save (fire-and-forget) ───
  function sendBulkSave(bulk) {
    if (!project || bulk.length === 0) return;
    apiSavePlan({
      project_id: project, year, scheme,
      payment_plan_code: planCode,
      disable_additional_discount: disableAdditional,
      bulk_updates: bulk,
    }).then(res => {
      if (!res.success) showToast('Save failed', true);
    });
  }

  // ─── Focus cell ───
  function handleCellFocus(e, index, col) {
    setFocusedCell({ index, col });
    dragState.current.focusedIndex = index;
    dragState.current.focusedCol   = col;
    dragState.current.startInput   = e.target;
    dragState.current.isDraggingDR = col === 'dr';
  }

  // ─── Global mouse events for drag ───
  useEffect(() => {
    function onMouseMove(e) {
      const ds = dragState.current;
      if (!ds.isDragging) return;
      ds.lastX = e.clientX;
      ds.lastY = e.clientY;
      handleDragHover(e.clientX, e.clientY);
      checkAutoScroll(e.clientY);
    }

    function onMouseUp() {
      const ds = dragState.current;
      if (!ds.isDragging) return;
      stopAutoScroll();
      ds.isDragging = false;
      document.body.classList.remove('dp__noselect');

      const highlighted = ds.highlightedIndices;
      if (highlighted.length > 0) {
        const sv  = ds.startValue;
        const col = ds.startCol;
        let bulk  = [];

        setRows(prev => {
          const next = prev.map((r, i) => {
            if (!highlighted.includes(i)) return r;
            return col === 'value' ? { ...r, value: sv } : { ...r, dr: sv };
          });
          const { rows: computed, totalNPV: npv } = runMath(next);
          setTotalNPV(npv);
          computed.forEach((r, i) => {
            if (highlighted.includes(i)) {
              const val    = parseFloat(r.value) || 0;
              const dr     = parseFloat(r.dr) || 0;
              const npvRow = i <= 1 ? val / 100 : (val / 100) / Math.pow(1 + dr / 100, i - 1);
              bulk.push({ index: i, value: val, discount_rate: dr, npv: npvRow });
            }
          });
          sendBulkSave(bulk);
          return computed;
        });
      }
      ds.highlightedIndices = [];
      setHighlightedIndices([]);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, year, scheme, planCode, disableAdditional]);

  function handleDragHover(x, y) {
    const ds       = dragState.current;
    if (!ds.isDragging) return;
    const col      = ds.isDraggingDR ? 'dr' : 'value';
    const selector = col === 'value' ? 'input.ext-value' : 'input.ext-dr';
    const below    = document.elementFromPoint(x, y);
    if (!below) return;
    const td  = below.closest('td');
    const inp = td && td.querySelector(selector);
    if (inp) {
      const ci = parseInt(inp.dataset.index);
      const si = ds.startIndex;
      const mn = Math.min(si, ci), mx = Math.max(si, ci);
      const newHighlighted = [];
      for (let i = mn; i <= mx; i++) newHighlighted.push(i);
      ds.highlightedIndices = newHighlighted;
      setHighlightedIndices([...newHighlighted]);
    }
  }

  function checkAutoScroll(y) {
    const vh = window.innerHeight;
    if (y < SCROLL_ZONE)           startAutoScroll(-1);
    else if (y > vh - SCROLL_ZONE) startAutoScroll(1);
    else                           stopAutoScroll();
  }

  function startAutoScroll(dir) {
    const ds = dragState.current;
    if (ds.scrollInterval) return;
    ds.scrollInterval = setInterval(() => {
      window.scrollBy(0, dir * SCROLL_SPEED);
      handleDragHover(ds.lastX, ds.lastY);
    }, 30);
  }

  function stopAutoScroll() {
    const ds = dragState.current;
    if (ds.scrollInterval) { clearInterval(ds.scrollInterval); ds.scrollInterval = null; }
  }

  // ─── Drag handle mouse-down ───
  function handleDragHandleMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    const ds = dragState.current;
    if (ds.focusedIndex === null) return;
    ds.isDragging = true;
    ds.startIndex = ds.focusedIndex;
    ds.startCol   = ds.focusedCol;
    ds.startValue = ds.isDraggingDR
      ? (parseFloat(rows[ds.focusedIndex]?.dr)    || 0)
      : (parseFloat(rows[ds.focusedIndex]?.value) || 0);
    ds.highlightedIndices = [ds.focusedIndex];
    setHighlightedIndices([ds.focusedIndex]);
    document.body.classList.add('dp__noselect');
  }

  // ─── Drag handle double-click (fill down) ───
  function handleDragHandleDoubleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const ds = dragState.current;
    if (ds.focusedIndex === null) return;
    const sv  = ds.isDraggingDR
      ? parseFloat(rows[ds.focusedIndex]?.dr)    || 0
      : parseFloat(rows[ds.focusedIndex]?.value) || 0;
    const si  = ds.focusedIndex;
    const col = ds.isDraggingDR ? 'dr' : 'value';
    let bulk = [], changed = false;

    setRows(prev => {
      const next = [...prev];
      for (let i = si + 1; i < next.length; i++) {
        const cur = col === 'value' ? next[i].value : next[i].dr;
        if (cur !== 0 && cur !== '') break;
        next[i] = col === 'value' ? { ...next[i], value: sv } : { ...next[i], dr: sv };
        changed = true;
      }
      if (!changed) return prev;
      const { rows: computed, totalNPV: npv } = runMath(next);
      setTotalNPV(npv);
      computed.forEach((r, i) => {
        if (i > si) {
          const val    = parseFloat(r.value) || 0;
          const dr     = parseFloat(r.dr) || 0;
          const npvRow = i <= 1 ? val / 100 : (val / 100) / Math.pow(1 + dr / 100, i - 1);
          bulk.push({ index: i, value: val, discount_rate: dr, npv: npvRow });
        }
      });
      sendBulkSave(bulk);
      return computed;
    });
  }

  // ─── Delete plan (async) ───
  async function handleDeletePlan() {
    if (!project) { showToast('Please select a project first', true); return; }
    const result = await Swal.fire({
      title: 'Delete Plan?',
      text: 'This will permanently remove the current payment plan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#c0392b',
      cancelButtonColor: '#888',
      reverseButtons: true,
      customClass: {
        popup: 'swal-times', title: 'swal-times',
        htmlContainer: 'swal-times', confirmButton: 'swal-times', cancelButton: 'swal-times',
      },
    });
    if (result.isConfirmed) {
      const res = await apiDeletePlan(project, year, scheme, planCode);
      showToast(res.message, !res.success);
      if (res.success) reloadPayments();
    }
  }

  // ─── Disable Additional Discount (async) ───
  async function handleDisableChange(e) {
    const val = e.target.checked;
    setDisableAdditional(val);
    if (!project) return;
    const res = await apiSavePlan({
      project_id: project, year, scheme,
      payment_plan_code: planCode,
      disable_additional_discount: val,
    });
    if (!res.success) showToast('Save failed', true);
  }

  // ─── Company change ───
  function handleCompanyChange(e) {
    setCompany(e.target.value);
    setProject('');
  }

  // ─── Plan code commit ───
  function handlePlanCodeBlur()    { setPlanCode(planCodeDraft); }
  function handlePlanCodeKeyPress(e) {
    if (e.key === 'Enter') { e.preventDefault(); setPlanCode(planCodeDraft); }
  }

  // ─── Visible rows (hide after cumulative >= 100) ───
  const visibleRows = (() => {
    let cutoff = false;
    return rows.map(r => {
      const hidden = cutoff;
      if (r.cumulative >= 99.99999 && !cutoff) cutoff = true;
      return { ...r, hidden };
    });
  })();

  // ─── Render ───
  return (
    <>
      {/* ═══ HEADER ═══ */}
      <header className="dp__page-header">
        <div className="dp__header-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="20" height="14" rx="3" stroke="#d97b20" strokeWidth="1.6" />
            <path d="M2 10.5h20" stroke="#d97b20" strokeWidth="1.4" />
            <rect x="5" y="13.5" width="4" height="3" rx="1" fill="#f0d5b0" />
            <rect x="10" y="13.5" width="4" height="3" rx="1" fill="#f0d5b0" />
            <rect x="15" y="13.5" width="4" height="3" rx="1" fill="#d97b20" />
          </svg>
        </div>
        <div className="dp__header-text">
          <h1>Dual Payments Input</h1>
          <p>Manage extended payment plans, NPV &amp; discount rates</p>
        </div>
      </header>

      <div className="dp__wrap">

        {/* ═══ SECTION 1: FILTERS ═══ */}
        <div className="dp__section">
          <div className="dp__section-head">
            <span className="dp__accent-dot" />
            <span>Project Selection</span>
          </div>
          <div className="dp__section-body">
            <div className="dp__filters-grid">

              {/* Company */}
              <div className="dp__field">
                <label>Company</label>
                <select value={company} onChange={handleCompanyChange}>
                  <option value="">Select company</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Project */}
              <div className="dp__field">
                <label>Project</label>
                <select value={project} onChange={e => setProject(e.target.value)} disabled={!company}>
                  <option value="">Select project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className="dp__field">
                <label>Year</label>
                <select value={year} onChange={e => setYear(e.target.value)}>
                  {[1,2,3,4,5,6,7,8,9,10].map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Scheme */}
              <div className="dp__field">
                <label>Scheme</label>
                <select value={scheme} onChange={e => setScheme(e.target.value)}>
                  <option value="flat">Flat</option>
                  <option value="flat_back_loaded">Flat Back Loaded</option>
                  <option value="bullet">Bullet</option>
                  <option value="bullet_back_loaded">Bullet Back Loaded</option>
                </select>
              </div>

              {/* Plan Code */}
              <div className="dp__field">
                <label className="dp__orange">
                  Plan Code <em style={{ fontWeight: 400, color: '#ccc', textTransform: 'none' }}>(optional)</em>
                </label>
                <input
                  type="text"
                  placeholder="e.g. PLAN-A"
                  value={planCodeDraft}
                  onChange={e => setPlanCodeDraft(e.target.value)}
                  onBlur={handlePlanCodeBlur}
                  onKeyPress={handlePlanCodeKeyPress}
                />
                <span className="dp__field-hint">Leave blank for default</span>
              </div>

            </div>
          </div>
        </div>

        {/* ═══ SECTION 2: CONTROLS ═══ */}
        {showControls && (
          <div className="dp__section">
            <div className="dp__section-head">
              <span className="dp__accent-dot" />
              <span>Plan Controls</span>
            </div>
            <div className="dp__section-body">
              <div className="dp__controls-row">
                <div className="dp__controls-left">
                  <label className="dp__cb-wrap">
                    <input type="checkbox" checked={disableAdditional} onChange={handleDisableChange} />
                    <span>Disable Additional Discount (Extended)</span>
                  </label>
                </div>
                <button className="dp__btn-delete" onClick={handleDeletePlan}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                  </svg>
                  Delete Current Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SECTION 3: TABLE ═══ */}
        {showPayments && (
          <div className="dp__section">
            <div className="dp__section-head">
              <span className="dp__accent-dot" />
              <span>Payment Schedule</span>
            </div>
            <div className="dp__section-body">
              <div className="dp__pay-header">
                <div className={`dp__pay-title${planTitleCoded ? ' dp__coded' : ''}`}>
                  {planTitle}
                </div>
                <div className="dp__npv-pill">
                  Total NPV: <span>{fmt(totalNPV * 100)}%</span>
                </div>
              </div>

              {/* Loading overlay */}
              {loading && (
                <div className="dp__loading">Loading…</div>
              )}

              <div className="dp__tbl-wrap">
                <table ref={tableRef}>
                  <thead>
                    <tr>
                      <th>Label</th>
                      <th>Value %</th>
                      <th>Discount Rate %</th>
                      <th>NPV %</th>
                      <th>Cumulative %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row, i) =>
                      row.hidden ? null : (
                        <tr key={i}>
                          {/* Label */}
                          <td>
                            <span className={`dp__row-label ${i < 2 ? 'dp__dp' : 'dp__pmt'}`}>
                              {i === 0 ? 'DP1' : i === 1 ? 'DP2' : `PMT ${i - 1}`}
                            </span>
                          </td>

                          {/* Value % */}
                          <td
                            className={
                              highlightedIndices.includes(i) && dragState.current.startCol === 'value'
                                ? 'dp__drag-highlight' : ''
                            }
                            style={{ position: 'relative' }}
                          >
                            <input
                              type="number"
                              step="0.00001"
                              min="0"
                              className="ext-value"
                              data-index={i}
                              value={row.value === 0 ? '' : row.value}
                              onChange={e => handleValueChange(i, e.target.value)}
                              onFocus={e => handleCellFocus(e, i, 'value')}
                            />
                            {focusedCell?.index === i && focusedCell?.col === 'value' && (
                              <div
                                className="dp__drag-handle"
                                onMouseDown={handleDragHandleMouseDown}
                                onDoubleClick={handleDragHandleDoubleClick}
                              />
                            )}
                          </td>

                          {/* Discount Rate % */}
                          <td
                            className={
                              highlightedIndices.includes(i) && dragState.current.startCol === 'dr'
                                ? 'dp__drag-highlight' : ''
                            }
                            style={{ position: 'relative' }}
                          >
                            <input
                              type="number"
                              step="0.00001"
                              className="ext-dr"
                              data-index={i}
                              value={row.dr === 0 ? '' : row.dr}
                              onChange={e => handleDrChange(i, e.target.value)}
                              onFocus={e => handleCellFocus(e, i, 'dr')}
                            />
                            {focusedCell?.index === i && focusedCell?.col === 'dr' && (
                              <div
                                className="dp__drag-handle"
                                onMouseDown={handleDragHandleMouseDown}
                                onDoubleClick={handleDragHandleDoubleClick}
                              />
                            )}
                          </td>

                          {/* NPV % */}
                          <td>
                            <span className="dp__npv-val">
                              {row.value === 0 ? '—' : fmt(row.npv * 100)}
                            </span>
                          </td>

                          {/* Cumulative % */}
                          <td>
                            <span className="dp__cum-val">
                              {row.cumulative < 0.000001 ? '' : fmt(row.cumulative)}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div className={`dp__toast${toast.err ? ' dp__err' : ''}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}