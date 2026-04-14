// CancellationPage.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';

// ─── API service (replaces mockCompanies + mockUnits + performCancellation) ───
import { getCompanies, cancelUnit } from '../../services/cancellationApi';
import { ROLES } from '../../data/permissions';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
function getStoredUser() {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline styles (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  root: {
    fontFamily: '"Times New Roman", Times, serif',
    background: '#fafaf9',
    minHeight: '100vh',
    color: '#1c1917',
    padding: '20px 24px 40px',
    boxSizing: 'border-box',
  },
  header: {
    background: '#fff',
    border: '1.5px solid #e7e5e4',
    borderRadius: 10,
    boxShadow: '0 1px 3px rgba(249,115,22,.07),0 1px 2px rgba(0,0,0,.04)',
    padding: '14px 20px',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  headerIcon: {
    width: 42, height: 42,
    background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
    borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(220,38,38,.30)',
  },
  headerTitle: { fontSize: 17, fontWeight: 700, color: '#1c1917', margin: '0 0 2px', lineHeight: 1.3 },
  headerSub: { fontSize: 12, color: '#a8a29e', margin: 0, lineHeight: 1.4 },
  roleBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 700, padding: '5px 12px',
    borderRadius: 999, letterSpacing: '0.4px', whiteSpace: 'nowrap',
    border: '1.5px solid #fdba74', background: '#fff7ed', color: '#ea580c',
  },
  steps: {
    background: '#fff7ed',
    border: '1.5px dashed #fdba74',
    borderRadius: 10, padding: '14px 18px', marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.7px', color: '#ea580c', marginBottom: 9,
    display: 'flex', alignItems: 'center', gap: 7,
  },
  stepsList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 },
  stepsLi: { display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: '#57534e', lineHeight: 1.5 },
  stepNum: {
    minWidth: 20, height: 20,
    background: 'linear-gradient(135deg,#f97316,#ea580c)',
    borderRadius: '50%', display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: 1,
  },
  card: {
    background: '#fff', border: '1.5px solid #e7e5e4', borderRadius: 10,
    boxShadow: '0 4px 16px rgba(249,115,22,.10),0 2px 6px rgba(0,0,0,.05)',
  },
  cardHeader: {
    padding: '14px 20px', borderBottom: '1.5px solid #e7e5e4',
    background: '#fafaf9', borderRadius: '10px 10px 0 0',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  cardHeaderTitle: {
    fontSize: 13, fontWeight: 700, color: '#57534e',
    display: 'flex', alignItems: 'center', gap: 7,
  },
  cardBody: { padding: 22 },
  field: { marginBottom: 0 },
  fieldLabel: { fontSize: 12, color: '#a8a29e', marginBottom: 6, display: 'block', fontWeight: 600 },
  input: {
    width: '100%', border: '1.5px solid #e7e5e4', borderRadius: 8,
    padding: '11px 13px', outline: 'none', fontFamily: '"Times New Roman", Times, serif',
    fontSize: 13, color: '#1c1917', background: '#fff', boxSizing: 'border-box',
    transition: 'border-color .15s, box-shadow .15s',
  },
  selectedPill: {
    padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid #e7e5e4', background: '#fafaf9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
  },
  selectedPillLabel: { fontSize: 11.5, color: '#a8a29e' },
  selectedPillName: { fontWeight: 900, fontSize: 13.5, color: '#1c1917' },
  pillBadge: {
    fontSize: 10.5, fontWeight: 700, padding: '4px 10px',
    borderRadius: 999, background: '#fff7ed', color: '#ea580c',
    border: '1.5px solid #fdba74',
  },
  hint: {
    padding: '12px 14px', background: '#fafaf9',
    border: '1.5px dashed #e7e5e4', borderRadius: 10,
    color: '#57534e', fontSize: 12.5, lineHeight: 1.55,
    display: 'flex', alignItems: 'flex-start', gap: 8,
  },
  btn: {
    border: 0, borderRadius: 10, padding: '12px 16px',
    fontWeight: 800, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 10,
    justifyContent: 'center', width: '100%',
    fontFamily: '"Times New Roman", Times, serif',
    fontSize: 13.5, transition: 'opacity .15s, transform .15s',
    background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(220,38,38,.28)',
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  grid: { display: 'grid', gridTemplateColumns: '1fr', gap: 14 },
  divider: { height: 1, background: '#e7e5e4', borderRadius: 1 },
  log: {
    marginTop: 22, background: '#fff', border: '1.5px solid #e7e5e4',
    borderRadius: 10, overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(249,115,22,.07),0 1px 2px rgba(0,0,0,.04)',
  },
  logHeader: {
    padding: '11px 16px', background: '#fafaf9', borderBottom: '1.5px solid #e7e5e4',
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px',
    color: '#57534e', display: 'flex', alignItems: 'center', gap: 7,
  },
  logRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px', borderBottom: '1px solid #e7e5e4', fontSize: 12.5,
  },
  logDot: { width: 8, height: 8, borderRadius: '50%', background: '#dc2626', flexShrink: 0 },
  logCode: { fontWeight: 700, color: '#1c1917' },
  logCompany: { color: '#a8a29e', fontSize: 11.5 },
  logStatus: {
    marginLeft: 'auto', fontSize: 10.5, fontWeight: 700,
    padding: '3px 9px', borderRadius: 999,
    background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5',
  },
  logTime: { fontSize: 11, color: '#a8a29e', whiteSpace: 'nowrap' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown Option (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function CnlOption({ opt, selected, onPick }) {
  const [hovered, setHovered] = useState(false);
  let bg    = '#fff';
  let color = '#1c1917';
  if (selected)     { bg = '#fff7ed'; color = '#ea580c'; }
  else if (hovered) { bg = '#ffedd5'; color = '#c2410c'; }

  return (
    <div
      onClick={() => onPick(opt)}
      role="option"
      aria-selected={selected}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '9px 14px', cursor: 'pointer', fontSize: 13,
        background: bg, color,
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid #f5f5f4',
        fontWeight: selected ? 700 : 400,
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      {selected && <i className="fa-solid fa-check" style={{ fontSize: 10, color: '#ea580c' }} />}
      {opt.name}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Searchable Company Select (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function CnlSelect({ value, options, onChange, disabled }) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef           = useRef(null);
  const inputRef          = useRef(null);

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter(o => o.name.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const selectedLabel = useMemo(() => {
    const f = options.find(o => o.id === value);
    return f ? f.name : null;
  }, [value, options]);

  const toggle = () => { if (disabled) return; setOpen(p => !p); if (open) setQuery(''); };
  const pick   = opt => { onChange(opt.id); setOpen(false); setQuery(''); };

  const triggerStyle = {
    ...S.input,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    borderColor: open ? 'rgba(249,115,22,.55)' : '#e7e5e4',
    boxShadow: open ? '0 0 0 3px rgba(249,115,22,.12)' : 'none',
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={triggerStyle} onClick={toggle} tabIndex={disabled ? -1 : 0}
           onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggle(); }}
           role="combobox" aria-expanded={open} aria-controls="cnl-dd-list" aria-haspopup="listbox">
        <span style={{ color: selectedLabel ? '#1c1917' : '#a8a29e', fontSize: 13 }}>
          {selectedLabel ?? '— Choose a company —'}
        </span>
        <i className="fa-solid fa-chevron-down" style={{
          color: '#a8a29e', fontSize: 11,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform .2s',
        }} />
      </div>

      {open && (
        <div id="cnl-dd-list" role="listbox" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999,
          background: '#fff', border: '1.5px solid #e7e5e4', borderRadius: 10,
          boxShadow: '0 12px 40px rgba(249,115,22,.13),0 4px 12px rgba(0,0,0,.07)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #e7e5e4',
                        display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: '#a8a29e', fontSize: 11 }} />
            <input ref={inputRef} type="text" placeholder="Search company…"
              value={query} onChange={e => setQuery(e.target.value)}
              style={{ border: 0, outline: 'none', width: '100%', fontSize: 12,
                       fontFamily: '"Times New Roman", Times, serif', color: '#1c1917' }} />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.length > 0 ? filtered.map(opt => (
              <CnlOption key={opt.id} opt={opt} selected={opt.id === value} onPick={pick} />
            )) : (
              <div style={{ padding: '12px 14px', color: '#a8a29e', fontSize: 12 }}>No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Log Row (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function LogRow({ entry }) {
  return (
    <div style={S.logRow}>
      <span style={S.logDot} />
      <span style={S.logCode}>{entry.unit_code}</span>
      <span style={S.logCompany}>{entry.company_name}</span>
      <span style={S.logStatus}>Blocked Cancellation</span>
      <span style={S.logTime}>{entry.time}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_OR_BIZ_ROLES = [ROLES.ADMIN, ROLES.DEVELOPER, ROLES.TEAM_MEMBER, ROLES.UPLOADER];

export default function CancellationPage() {
  const user         = getStoredUser();
  const userRole     = user?.role ?? '';
  const isSalesOps   = userRole === ROLES.SALES_OPERATION;
  const isAdminOrBiz = ADMIN_OR_BIZ_ROLES.includes(userRole);

  // ── CHANGED: companies loaded from API instead of mockCompanies ────────────
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(err => console.error('Failed to load companies:', err));
  }, []);

  // ── CHANGED: SALES_OPS_COMPANY now derived from API companies state ─────────
  const SALES_OPS_COMPANY = isSalesOps
    ? (companies.find(c => c.id === user?.company_id) ?? companies[0] ?? null)
    : null;

  const [selectedCompanyId, setSelectedCompanyId] = useState(
    isSalesOps ? user?.company_id : null
  );
  const [unitCode, setUnitCode] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [log,      setLog]      = useState([]);

  const [wide, setWide] = useState(window.innerWidth >= 992);
  useEffect(() => {
    const h = () => setWide(window.innerWidth >= 992);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ── CHANGED: uses companies state instead of mockCompanies ─────────────────
  const selectedCompany = useMemo(() => {
    if (isSalesOps) return SALES_OPS_COMPANY;
    return companies.find(c => c.id === selectedCompanyId) || null;
  }, [selectedCompanyId, isSalesOps, SALES_OPS_COMPANY, companies]);

  const hasCompany = !!selectedCompany;

  const handleSubmit = useCallback(async () => {
    const code = unitCode.trim();

    if (!code) {
      await Swal.fire({ icon: 'warning', title: 'Unit code required', text: 'Please enter the unit code.' });
      return;
    }

    const companyId   = selectedCompany?.id   || '';
    const companyName = selectedCompany?.name || '';

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirm Cancellation',
      html: `
        <div style="text-align:left; font-size:14px;">
          ${companyId ? `<div><b>Company:</b> ${companyName}</div>` : ''}
          <div><b>Unit Code:</b> ${code}</div>
          <hr/>
          <div>This action will update the unit and delete related analytical requests.</div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'No',
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'Processing...',
      text: 'Please wait while we cancel the reservation.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => { Swal.showLoading(); },
    });

    setLoading(true);
    try {
      // ── CHANGED: real API call instead of performCancellation() ────────────
      const res = await cancelUnit({ unit_code: code, company_id: companyId });

      Swal.close();

      if (res.ok) {
        await Swal.fire({ icon: 'success', title: 'Success', text: res.message });

        setLog(prev => [{
          unit_code:    code,
          company_name: companyName,
          time:         new Date().toLocaleTimeString(),
        }, ...prev]);

        setUnitCode('');
      } else {
        await Swal.fire({ icon: 'error', title: 'Failed', text: res.message });
      }
    } catch {
      Swal.close();
      await Swal.fire({ icon: 'error', title: 'Failed', text: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  }, [unitCode, selectedCompany]);

  const handleKeyDown = e => { if (e.key === 'Enter') handleSubmit(); };

  const handleCompanyChange = id => {
    setSelectedCompanyId(id);
    setUnitCode('');
  };

  const gridTwoStyle = wide
    ? { ...S.grid, gridTemplateColumns: '1.1fr .9fr' }
    : S.grid;

  return (
    <div style={S.root}>

      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.headerIcon}>
            <i className="fa-solid fa-ban" style={{ fontSize: 18, color: '#fff' }} />
          </div>
          <div>
            <h2 style={S.headerTitle}>Cancel Unit Reservation</h2>
            <p style={S.headerSub}>
              Sets status to <b>Blocked Cancellation</b>, clears reservation fields,
              updates sales_value, and deletes analytical requests.
            </p>
          </div>
        </div>
        <div style={S.roleBadge}>
          {isSalesOps ? 'SalesOperation' : isAdminOrBiz ? 'Admin/Business' : 'No Access'}
        </div>
      </div>

      {!isSalesOps && !isAdminOrBiz && (
        <div style={{ ...S.hint, justifyContent: 'center', padding: '36px 20px' }}>
          <i className="fa-solid fa-lock" style={{ fontSize: 28, display: 'block' }} />
          You do not have permission to cancel unit reservations.
        </div>
      )}

      {(isSalesOps || isAdminOrBiz) && (
        <>
          <div style={S.steps}>
            <div style={S.stepsTitle}><b>Operation Steps:</b></div>
            <div style={{ fontSize: 13, color: '#57534e', lineHeight: 1.8 }}>
              1) Status → <b>Blocked Cancellation</b><br />
              2) Reservation Date → Cleared, Contract Payment Plan → Cleared<br />
              3) Sales Value → Interest Free Unit Price
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardBody}>

              {isSalesOps && (
                <div style={S.grid}>
                  <div style={S.selectedPill}>
                    <div>
                      <div style={S.selectedPillLabel}>Company</div>
                      <div style={S.selectedPillName}>{SALES_OPS_COMPANY?.name ?? '…'}</div>
                    </div>
                    <span style={S.pillBadge}>Auto</span>
                  </div>

                  <div style={S.field}>
                    <label style={S.fieldLabel}>Unit Code</label>
                    <input
                      style={S.input}
                      placeholder="e.g. U-101-A"
                      value={unitCode}
                      onChange={e => setUnitCode(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={loading}
                    />
                  </div>

                  <button
                    style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }}
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    <i className="fa-solid fa-triangle-exclamation" />
                    Cancel Reservation
                  </button>
                </div>
              )}

              {isAdminOrBiz && (
                <div style={gridTwoStyle}>
                  <div style={S.grid}>
                    <div style={S.field}>
                      <label style={S.fieldLabel}>Select Company</label>
                      {/* ── CHANGED: options={companies} instead of options={mockCompanies} */}
                      <CnlSelect
                        value={selectedCompanyId}
                        options={companies}
                        onChange={handleCompanyChange}
                        disabled={loading}
                      />
                    </div>

                    {hasCompany && (
                      <div style={S.selectedPill}>
                        <div>
                          <div style={S.selectedPillLabel}>Selected Company</div>
                          <div style={S.selectedPillName}>{selectedCompany.name}</div>
                        </div>
                        <span style={S.pillBadge}>Selected</span>
                      </div>
                    )}

                    {!hasCompany && (
                      <div style={S.hint}>
                        Choose a company from the dropdown, then the unit code field will appear.
                      </div>
                    )}
                  </div>

                  <div style={S.grid}>
                    {hasCompany ? (
                      <>
                        <div style={S.field}>
                          <label style={S.fieldLabel}>Unit Code</label>
                          <input
                            style={S.input}
                            placeholder="e.g. U-101-A"
                            value={unitCode}
                            onChange={e => setUnitCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            autoFocus
                          />
                        </div>

                        <button
                          style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }}
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          <i className="fa-solid fa-triangle-exclamation" />
                          Cancel Reservation
                        </button>
                      </>
                    ) : (
                      <div style={S.hint}>Please select a company first.</div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {log.length > 0 && (
            <div style={S.log}>
              <div style={S.logHeader}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: '#f97316' }} />
                Session Cancellation Log
              </div>
              {log.map((entry, i) => (
                <LogRow key={`${entry.unit_code}-${i}`} entry={entry} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}