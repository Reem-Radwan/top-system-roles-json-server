// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import ReactDOM from 'react-dom';
// import './variable-discount-rate.css';
// import { DB } from '../../data/variable-discount-ratedata';
// import Swal from 'sweetalert2';

// const getPortalRoot = () => {
//   let el = document.getElementById('vdr-portal-root');
//   if (!el) {
//     el = document.createElement('div');
//     el.id = 'vdr-portal-root';
//     el.style.cssText = 'position:static;z-index:auto;';
//     document.body.appendChild(el);
//   }
//   return el;
// };

// /* ─────────────────────────────────────────────
//    Reusable Searchable Dropdown (Portal-based)
// ───────────────────────────────────────────── */
// const SearchableDropdown = ({
//   label, value, options, placeholder, searchPlaceholder, disabled, onChange,
// }) => {
//   const [open, setOpen]   = useState(false);
//   const [query, setQuery] = useState('');
//   const [pos, setPos]     = useState({});
//   const [portalRoot, setPortalRoot] = useState(null);

//   const triggerRef = useRef(null);
//   const dropRef    = useRef(null);
//   const inputRef   = useRef(null);

//   // Stable listbox ID derived from the label
//   const listboxId = `vdr-listbox-${(label || '').replace(/\s+/g, '-').toLowerCase()}`;

//   useEffect(() => { setPortalRoot(getPortalRoot()); }, []);

//   const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

//   const calcPos = useCallback(() => {
//     if (!triggerRef.current) return;
//     const r = triggerRef.current.getBoundingClientRect();
//     setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
//   }, []);

//   const handleOpen = () => {
//     if (disabled) return;
//     calcPos();
//     setOpen(true);
//     setTimeout(() => inputRef.current?.focus(), 60);
//   };

//   const handleClose = () => { setOpen(false); setQuery(''); };
//   const handleSelect = (opt) => { onChange(opt); handleClose(); };

//   useEffect(() => {
//     if (!open) return;
//     const onOutside = (e) => {
//       if (!triggerRef.current?.contains(e.target) && !dropRef.current?.contains(e.target)) handleClose();
//     };
//     const onScroll = () => calcPos();
//     document.addEventListener('mousedown', onOutside);
//     window.addEventListener('scroll', onScroll, true);
//     window.addEventListener('resize', calcPos);
//     return () => {
//       document.removeEventListener('mousedown', onOutside);
//       window.removeEventListener('scroll', onScroll, true);
//       window.removeEventListener('resize', calcPos);
//     };
//   }, [open, calcPos]);

//   const portalDropdown = (open && portalRoot)
//     ? ReactDOM.createPortal(
//         <div ref={dropRef} className="select-dropdown-portal"
//           style={{ top: pos.top, left: pos.left, width: pos.width }}>
//           <div className="select-search">
//             <input ref={inputRef} type="text" placeholder={searchPlaceholder}
//               value={query} onChange={e => setQuery(e.target.value)} />
//             {query && (
//               <button className="select-search-clear" onClick={() => setQuery('')} tabIndex={-1}>×</button>
//             )}
//           </div>
//           {/* FIX 2b: add id + role="listbox" to match aria-controls on the trigger */}
//           <div
//             className="select-options"
//             id={listboxId}
//             role="listbox"
//           >
//             {filtered.length === 0 ? (
//               <div className="select-no-results">
//                 <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
//                   <circle cx="14" cy="14" r="10" stroke="#d0d0d0" strokeWidth="1.5"/>
//                   <path d="M10 14h8M14 10v8" stroke="#d0d0d0" strokeWidth="1.5" strokeLinecap="round"/>
//                 </svg>
//                 <span>No results found</span>
//               </div>
//             ) : (
//               filtered.map(opt => (
//                 <div key={opt}
//                   className={`select-option${value === opt ? ' selected' : ''}`}
//                   onClick={() => handleSelect(opt)}>
//                   <span className="select-option-text">{opt}</span>
//                   {value === opt && (
//                     <span className="select-option-check">
//                       <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//                         <path d="M2 6l2.5 2.5L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                       </svg>
//                     </span>
//                   )}
//                 </div>
//               ))
//             )}
//           </div>
//         </div>,
//         portalRoot
//       )
//     : null;

//   return (
//     <div className="dropdown-group">
//       <label>{label}</label>
//       <div className="searchable-select">
//         {/* FIX 2a: add aria-controls to satisfy jsx-a11y/role-has-required-aria-props */}
//         <div ref={triggerRef}
//           className={`select-trigger${open ? ' open' : ''}${disabled ? ' disabled' : ''}`}
//           onClick={handleOpen}
//           role="combobox"
//           aria-expanded={open}
//           aria-controls={listboxId}
//           aria-haspopup="listbox"
//           tabIndex={disabled ? -1 : 0}
//           onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleOpen(); }}>
//           <span className={value ? 'select-value-filled' : 'select-value-placeholder'}>
//             {value || placeholder || ''}
//           </span>
//           <div className="select-actions">
//             <svg className={`select-arrow${open ? ' rotated' : ''}`}
//               width="12" height="12" viewBox="0 0 12 12" fill="none">
//               <path d="M2 4l4 4 4-4" stroke="#6b6b6b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//           </div>
//         </div>
//         {portalDropdown}
//       </div>
//     </div>
//   );
// };

// /* ─────────────────────────────────────────────
//    Main Component
// ───────────────────────────────────────────── */
// const VariableDiscountRate = () => {
//   const [liveData,         setLiveData]         = useState(JSON.parse(JSON.stringify(DB)));
//   const [currentCompany,   setCurrentCompany]   = useState(null);
//   const [currentProject,   setCurrentProject]   = useState(null);
//   const [flashTargetIndex, setFlashTargetIndex] = useState(null);
//   const [showTable,        setShowTable]        = useState(false);
//   const [modalOpen,        setModalOpen]        = useState(false);
//   const [modalTitle,       setModalTitle]       = useState('Add New Row');
//   const [editIndex,        setEditIndex]        = useState('');
//   const [fieldYear,        setFieldYear]        = useState('');
//   const [fieldRate,        setFieldRate]        = useState('');
//   const [yearError,        setYearError]        = useState(false);
//   const [rateError,        setRateError]        = useState(false);
//   const [portalRoot,       setPortalRoot]       = useState(null);
//   const yearInputRef = useRef(null);

//   useEffect(() => {
//     setPortalRoot(getPortalRoot());
//     return () => {
//       const el = document.getElementById('vdr-portal-root');
//       if (el && el.childNodes.length === 0) document.body.removeChild(el);
//     };
//   }, []);

//   /* ── When modal opens/closes, prevent Bootstrap from stealing body scroll lock ── */
//   useEffect(() => {
//     if (modalOpen) {
//       document.body.classList.remove('modal-open');
//       document.body.style.overflow = '';
//       document.body.style.paddingRight = '';
//     }
//   }, [modalOpen]);

//   /* ── Helpers ── */
//   const formatRate = (rate) => {
//     if (rate === Math.floor(rate)) return rate + '%';
//     return parseFloat(rate.toFixed(2)) + '%';
//   };

//   const formatYear = (y) => (y === 1 ? '1 Year' : `${y} Years`);

//   /* ── Table visibility ── */
//   const renderTable = useCallback((flash) => {
//     setShowTable(true);
//     setFlashTargetIndex(flash ?? null);
//   }, []);

//   /* ── Dropdown handlers ── */
//   const handleCompanyChange = (co) => {
//     setCurrentCompany(co);
//     setCurrentProject(null);
//     setShowTable(false);
//   };

//   const handleProjectChange = (proj) => {
//     setCurrentProject(proj);
//     if (currentCompany && proj) renderTable();
//     else setShowTable(false);
//   };

//   /* ── Modal ── */
//   const openModal = (title, yearVal = '', rateVal = '', idx = '') => {
//     setModalTitle(title);
//     setFieldYear(yearVal);
//     setFieldRate(rateVal);
//     setEditIndex(idx);
//     setYearError(false);
//     setRateError(false);
//     setModalOpen(true);
//     setTimeout(() => yearInputRef.current?.focus(), 150);
//   };

//   const closeModal = () => setModalOpen(false);

//   /* ── CRUD ── */
//   const openEdit = (idx) => {
//     const row = liveData[currentCompany][currentProject][idx];
//     openModal('Edit Row', row.year, row.rate, idx);
//   };

//   const deleteRow = (idx) => {
//     const row = liveData[currentCompany][currentProject][idx];
//     Swal.fire({
//       title: 'Delete this row?',
//       html: `You are about to remove <b>${formatYear(row.year)}</b> (${formatRate(row.rate)}) from the schedule.<br><br>This action cannot be undone.`,
//       icon: 'warning', iconColor: '#e67e22',
//       showCancelButton: true,
//       confirmButtonText: 'Yes, delete it', cancelButtonText: 'Cancel',
//       confirmButtonColor: '#c0392b', cancelButtonColor: '#6b6b6b',
//       reverseButtons: true, focusCancel: true,
//     }).then(result => {
//       if (result.isConfirmed) {
//         setLiveData(prev => {
//           const next = JSON.parse(JSON.stringify(prev));
//           next[currentCompany][currentProject].splice(idx, 1);
//           return next;
//         });
//         renderTable();
//         Swal.fire({
//           icon: 'success', title: 'Deleted!',
//           text: `${formatYear(row.year)} has been removed.`,
//           timer: 1800, timerProgressBar: true, showConfirmButton: false,
//           position: 'top-end', toast: true, iconColor: '#27ae60',
//         });
//       }
//     });
//   };

//   const saveRow = async () => {
//     setYearError(false);
//     setRateError(false);

//     const yearVal = String(fieldYear).trim();
//     const rateVal = String(fieldRate).trim();
//     const idx     = editIndex;

//     let valid = true;
//     const year = parseInt(yearVal);
//     if (!yearVal || isNaN(year) || year < 1 || year > 100) { setYearError(true); valid = false; }
//     const rate = parseFloat(rateVal);
//     if (!rateVal || isNaN(rate) || rate < 0 || rate > 100) { setRateError(true); valid = false; }
//     if (!valid) return;

//     const rows   = liveData[currentCompany][currentProject];
//     const isEdit = idx !== '';

//     const yearExists = rows.some((row, i) => {
//       if (isEdit && i === parseInt(idx)) return false;
//       return row.year === year;
//     });

//     if (yearExists) {
//       /* FIX 1: Force SweetAlert above the modal overlay (z-index 2147483646)
//          by bumping the Swal container to 2147483647 via didOpen               */
//       await Swal.fire({
//         icon: 'warning',
//         title: 'Duplicate Year',
//         text: `Year ${year} already exists in the schedule. Please use a different year number.`,
//         confirmButtonText: 'OK',
//         confirmButtonColor: '#e67e22',
//         didOpen: () => {
//             // Target the actual SweetAlert2 popup container and force it above the modal
//             const swalContainer = document.querySelector('.swal2-container');
//             if (swalContainer) {
//             swalContainer.style.setProperty('z-index', '2147483647', 'important');
//             }
//         },
//         });
//       return;
//     }

//     let flashIdx, actionText = '';

//     setLiveData(prev => {
//       const next = JSON.parse(JSON.stringify(prev));
//       const cur  = next[currentCompany][currentProject];

//       if (isEdit) {
//         const old = cur[parseInt(idx)];
//         cur[parseInt(idx)] = { year, rate };
//         flashIdx = parseInt(idx);
//         actionText =
//           old.year === year && old.rate === rate
//             ? `No changes were made to ${formatYear(year)}.`
//           : old.year === year
//             ? `Rate for ${formatYear(year)} updated from ${formatRate(old.rate)} to ${formatRate(rate)}.`
//           : old.rate === rate
//             ? `Year changed from ${formatYear(old.year)} to ${formatYear(year)} (rate stayed ${formatRate(rate)}).`
//             : `Updated from ${formatYear(old.year)} (${formatRate(old.rate)}) to ${formatYear(year)} (${formatRate(rate)}).`;

//         Swal.fire({
//           icon: 'success', title: 'Row Updated!', text: actionText,
//           timer: 3000, timerProgressBar: true, showConfirmButton: false,
//           position: 'top-end', toast: true, iconColor: '#27ae60',
//         });
//       } else {
//         cur.push({ year, rate });
//         cur.sort((a, b) => a.year - b.year);
//         flashIdx   = cur.findIndex(r => r.year === year && r.rate === rate);
//         actionText = `${formatYear(year)} (${formatRate(rate)}) has been added.`;
//         Swal.fire({
//           icon: 'success', title: 'Row Added!', text: actionText,
//           timer: 3000, timerProgressBar: true, showConfirmButton: false,
//           position: 'top-end', toast: true, iconColor: '#27ae60',
//         });
//       }

//       renderTable(flashIdx);
//       closeModal();
//       return next;
//     });
//   };

//   /* ── Derived data ── */
//   const companies = Object.keys(liveData);
//   const projects  = currentCompany ? Object.keys(liveData[currentCompany]) : [];
//   const rows      = currentCompany && currentProject ? liveData[currentCompany][currentProject] : [];
//   const avgRate   = rows.length > 0 ? rows.reduce((s, r) => s + r.rate, 0) / rows.length : 0;
//   const maxRate   = rows.length > 0 ? Math.max(...rows.map(r => r.rate)) : 0;

//   /* ── Modal portal — uses vdr-modal-overlay class (not Bootstrap's modal) ── */
//   const modalPortal = portalRoot ? ReactDOM.createPortal(
//     <div
//       className={`vdr-modal-overlay${modalOpen ? ' open' : ''}`}
//       onClick={e => { if (e.target.classList.contains('vdr-modal-overlay')) closeModal(); }}
//     >
//       <div className="vdr-modal" role="dialog" aria-modal="true">
//         <div className="modal-header">
//           <h3>
//             <span className="dot" />
//             <span>{modalTitle}</span>
//           </h3>
//           <button className="modal-close" onClick={closeModal} aria-label="Close">×</button>
//         </div>

//         <div className="modal-body">
//           <div className="form-group">
//             <label htmlFor="vdr-fieldYear">Year Number</label>
//             <input
//               ref={yearInputRef}
//               type="number"
//               id="vdr-fieldYear"
//               placeholder="e.g. 10"
//               min="1" max="100"
//               value={fieldYear}
//               onChange={e => setFieldYear(e.target.value)}
//               className={yearError ? 'error' : ''}
//             />
//             <p className="form-hint">Enter the year number (e.g. 1, 5, 10, 20…)</p>
//             <span className={`form-error${yearError ? ' visible' : ''}`}>
//               Please enter a valid year (1–100).
//             </span>
//           </div>

//           <div className="form-group">
//             <label htmlFor="vdr-fieldRate">Discount Rate (%)</label>
//             <input
//               type="number"
//               id="vdr-fieldRate"
//               placeholder="e.g. 5.5"
//               step="0.01" min="0" max="100"
//               value={fieldRate}
//               onChange={e => setFieldRate(e.target.value)}
//               className={rateError ? 'error' : ''}
//             />
//             <p className="form-hint">Enter the percentage value (e.g. 3.5, 7, 12.25…)</p>
//             <span className={`form-error${rateError ? ' visible' : ''}`}>
//               Please enter a valid rate (0–100).
//             </span>
//           </div>
//         </div>

//         <div className="modal-actions">
//           <button className="btn-cancel" onClick={closeModal}>Cancel</button>
//           <button className="btn-save" onClick={saveRow}>Save</button>
//         </div>
//       </div>
//     </div>,
//     portalRoot
//   ) : null;

//   /* ── Render ── */
//   return (
//     <div className="vdr-root">
//       {/* Header */}
//       <div className="header-wrap">
//         <header className="header">
//           <div className="header-title">
//             <div className="title-icon">
//               <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
//                 <rect x="2" y="5" width="18" height="14" rx="2" stroke="#e67e22" strokeWidth="1.8"/>
//                 <path d="M2 9h18" stroke="#e67e22" strokeWidth="1.8"/>
//                 <path d="M7 13h3M7 16h5" stroke="#e67e22" strokeWidth="1.6" strokeLinecap="round"/>
//                 <path d="M14 13l1.5 1.5L17 12" stroke="#e67e22" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
//                 <circle cx="17" cy="4" r="2.5" fill="#e67e22" opacity="0.5"/>
//               </svg>
//             </div>
//             <h1>Variable Discount Rate</h1>
//           </div>

//           <div className="header-controls">
//             <SearchableDropdown
//               label="Company" value={currentCompany} options={companies}
//               placeholder="Select a Company..." searchPlaceholder="Search a company…"
//               disabled={false} onChange={handleCompanyChange}
//             />
//             <SearchableDropdown
//               label="Project" value={currentProject} options={projects}
//               placeholder="Select a Project..." searchPlaceholder="Search a project…"
//               disabled={!currentCompany} onChange={handleProjectChange}
//             />
//           </div>
//         </header>
//       </div>

//       {/* Main */}
//       <main className="main-wrap">
//         {!showTable && (
//           <div className="empty-state">
//             <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
//               <rect x="8" y="16" width="48" height="36" rx="4" stroke="#111" strokeWidth="2.5"/>
//               <path d="M8 24h48" stroke="#111" strokeWidth="2.5"/>
//               <path d="M20 32h24M20 40h16" stroke="#e67e22" strokeWidth="2.5" strokeLinecap="round"/>
//               <circle cx="48" cy="14" r="8" fill="#e67e22" opacity=".18"/>
//             </svg>
//             <p>Select a company and project to view the discount rate table.</p>
//           </div>
//         )}

//         {showTable && (
//           <div className="table-section visible">
//             <div className="section-toolbar">
//               <div className="section-meta">
//                 <div className="breadcrumb">
//                   <span>{currentCompany}</span> › Discount Schedule
//                 </div>
//                 <h2>{currentProject}</h2>
//               </div>
//               <button className="btn-add" onClick={() => openModal('Add New Row')}>
//                 <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
//                   <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
//                 </svg>
//                 Add New Row
//               </button>
//             </div>

//             <div className="table-card">
//               <div className="table-wrap">
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>#</th>
//                       <th>Year</th>
//                       <th>Discount Rate (%)</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {rows.map((row, idx) => (
//                       <tr key={`${row.year}-${row.rate}-${idx}`}
//                         className={flashTargetIndex === idx ? 'row-flash' : ''}>
//                         <td style={{ color: 'var(--vdr-gray-dark)', fontSize: '0.8rem' }}>{idx + 1}</td>
//                         <td><span className="year-badge">{formatYear(row.year)}</span></td>
//                         <td><div className="rate-value">{formatRate(row.rate)}</div></td>
//                         <td>
//                           <div className="actions-cell">
//                             <button className="btn-edit"   onClick={() => openEdit(idx)}>Edit</button>
//                             <button className="btn-delete" onClick={() => deleteRow(idx)}>Delete</button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//               <div className="table-footer">
//                 <span>Showing <strong>{rows.length}</strong> record(s)</span>
//                 <span>
//                   Average Rate: <strong style={{ color: 'var(--vdr-orange)' }}>{formatRate(avgRate)}</strong>
//                   &nbsp;|&nbsp;
//                   Max Rate: <strong style={{ color: 'var(--vdr-orange)' }}>{formatRate(maxRate)}</strong>
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}
//       </main>

//       {/* Modal portal */}
//       {modalPortal}
//     </div>
//   );
// };

// export default VariableDiscountRate;














import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import './variable-discount-rate.css';
import Swal from 'sweetalert2';
import {
  fetchCompanies,
  fetchProjectsByCompany,
  fetchRatesByProject,
  createRate,
  updateRate,
  deleteRate,
} from '../../services/variable-discount-rateapi';

const getPortalRoot = () => {
  let el = document.getElementById('vdr-portal-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'vdr-portal-root';
    el.style.cssText = 'position:static;z-index:auto;';
    document.body.appendChild(el);
  }
  return el;
};

/* ─────────────────────────────────────────────
   Reusable Searchable Dropdown (Portal-based)
───────────────────────────────────────────── */
const SearchableDropdown = ({
  label, value, options, placeholder, searchPlaceholder, disabled, onChange,
}) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos]     = useState({});
  const [portalRoot, setPortalRoot] = useState(null);

  const triggerRef = useRef(null);
  const dropRef    = useRef(null);
  const inputRef   = useRef(null);

  const listboxId = `vdr-listbox-${(label || '').replace(/\s+/g, '-').toLowerCase()}`;

  useEffect(() => { setPortalRoot(getPortalRoot()); }, []);

  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    calcPos();
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const handleClose = () => { setOpen(false); setQuery(''); };
  const handleSelect = (opt) => { onChange(opt); handleClose(); };

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropRef.current?.contains(e.target)) handleClose();
    };
    const onScroll = () => calcPos();
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', calcPos);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [open, calcPos]);

  const displayValue = value
    ? (options.find(o => o.value === value.value || o.value === value)?.label ?? value.label ?? value)
    : null;

  const portalDropdown = (open && portalRoot)
    ? ReactDOM.createPortal(
        <div ref={dropRef} className="select-dropdown-portal"
          style={{ top: pos.top, left: pos.left, width: pos.width }}>
          <div className="select-search">
            <input ref={inputRef} type="text" placeholder={searchPlaceholder}
              value={query} onChange={e => setQuery(e.target.value)} />
            {query && (
              <button className="select-search-clear" onClick={() => setQuery('')} tabIndex={-1}>×</button>
            )}
          </div>
          <div className="select-options" id={listboxId} role="listbox">
            {filtered.length === 0 ? (
              <div className="select-no-results">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="10" stroke="#d0d0d0" strokeWidth="1.5"/>
                  <path d="M10 14h8M14 10v8" stroke="#d0d0d0" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>No results found</span>
              </div>
            ) : (
              filtered.map(opt => (
                <div key={opt.value}
                  className={`select-option${value?.value === opt.value ? ' selected' : ''}`}
                  onClick={() => handleSelect(opt)}>
                  <span className="select-option-text">{opt.label}</span>
                  {value?.value === opt.value && (
                    <span className="select-option-check">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l2.5 2.5L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>,
        portalRoot
      )
    : null;

  return (
    <div className="dropdown-group">
      <label>{label}</label>
      <div className="searchable-select">
        <div ref={triggerRef}
          className={`select-trigger${open ? ' open' : ''}${disabled ? ' disabled' : ''}`}
          onClick={handleOpen}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleOpen(); }}>
          <span className={displayValue ? 'select-value-filled' : 'select-value-placeholder'}>
            {displayValue || placeholder || ''}
          </span>
          <div className="select-actions">
            <svg className={`select-arrow${open ? ' rotated' : ''}`}
              width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="#6b6b6b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        {portalDropdown}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const VariableDiscountRate = () => {
  /* ── dropdown data ── */
  const [companies,      setCompanies]      = useState([]);   // [{value: id, label: name}]
  const [projects,       setProjects]       = useState([]);   // [{value: id, label: name}]
  const [rows,           setRows]           = useState([]);   // [{id, projectId, year, rate}]

  /* ── selection ── */
  const [currentCompany, setCurrentCompany] = useState(null); // {value, label}
  const [currentProject, setCurrentProject] = useState(null); // {value, label}

  /* ── UI state ── */
  const [loading,          setLoading]          = useState(false);
  const [flashTargetId,    setFlashTargetId]    = useState(null);
  const [showTable,        setShowTable]        = useState(false);
  const [modalOpen,        setModalOpen]        = useState(false);
  const [modalTitle,       setModalTitle]       = useState('Add New Row');
  const [editRow,          setEditRow]          = useState(null);  // full rate row being edited
  const [fieldYear,        setFieldYear]        = useState('');
  const [fieldRate,        setFieldRate]        = useState('');
  const [yearError,        setYearError]        = useState(false);
  const [rateError,        setRateError]        = useState(false);
  const [portalRoot,       setPortalRoot]       = useState(null);
  const yearInputRef = useRef(null);

  /* ── bootstrap portal root ── */
  useEffect(() => {
    setPortalRoot(getPortalRoot());
    return () => {
      const el = document.getElementById('vdr-portal-root');
      if (el && el.childNodes.length === 0) document.body.removeChild(el);
    };
  }, []);

  /* ── prevent Bootstrap from stealing body scroll lock ── */
  useEffect(() => {
    if (modalOpen) {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }, [modalOpen]);

  /* ── load companies on mount ── */
  useEffect(() => {
    fetchCompanies()
      .then(data => setCompanies(data.map(c => ({ value: c.id, label: c.name }))))
      .catch(() => showApiError('Could not load companies.'));
  }, []);

  /* ── load projects when company changes ── */
  useEffect(() => {
    if (!currentCompany) { setProjects([]); return; }
    fetchProjectsByCompany(currentCompany.value)
      .then(data => setProjects(data.map(p => ({ value: p.id, label: p.name }))))
      .catch(() => showApiError('Could not load projects.'));
  }, [currentCompany]);

  /* ── load rates when project changes ── */
  const loadRates = useCallback(async (projectId, flashId) => {
    setLoading(true);
    try {
      const data = await fetchRatesByProject(projectId);
      setRows(data);
      setShowTable(true);
      setFlashTargetId(flashId ?? null);
    } catch {
      showApiError('Could not load discount rates.');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── helpers ── */
  const showApiError = (msg) => {
    Swal.fire({ icon: 'error', title: 'API Error', text: msg, confirmButtonColor: '#c0392b' });
  };

  const formatRate = (rate) => {
    if (rate === Math.floor(rate)) return rate + '%';
    return parseFloat(rate.toFixed(2)) + '%';
  };

  const formatYear = (y) => (y === 1 ? '1 Year' : `${y} Years`);

  /* ── dropdown handlers ── */
  const handleCompanyChange = (co) => {
    setCurrentCompany(co);
    setCurrentProject(null);
    setRows([]);
    setShowTable(false);
  };

  const handleProjectChange = (proj) => {
    setCurrentProject(proj);
    if (proj) loadRates(proj.value);
    else setShowTable(false);
  };

  /* ── modal ── */
  const openModal = (title, yearVal = '', rateVal = '', row = null) => {
    setModalTitle(title);
    setFieldYear(yearVal);
    setFieldRate(rateVal);
    setEditRow(row);
    setYearError(false);
    setRateError(false);
    setModalOpen(true);
    setTimeout(() => yearInputRef.current?.focus(), 150);
  };

  const closeModal = () => setModalOpen(false);

  /* ── CRUD ── */
  const openEdit = (row) => openModal('Edit Row', row.year, row.rate, row);

  const handleDelete = (row) => {
    Swal.fire({
      title: 'Delete this row?',
      html: `You are about to remove <b>${formatYear(row.year)}</b> (${formatRate(row.rate)}) from the schedule.<br><br>This action cannot be undone.`,
      icon: 'warning', iconColor: '#e67e22',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it', cancelButtonText: 'Cancel',
      confirmButtonColor: '#c0392b', cancelButtonColor: '#6b6b6b',
      reverseButtons: true, focusCancel: true,
    }).then(async result => {
      if (!result.isConfirmed) return;
      try {
        await deleteRate(row.id);
        await loadRates(currentProject.value);
        Swal.fire({
          icon: 'success', title: 'Deleted!',
          text: `${formatYear(row.year)} has been removed.`,
          timer: 1800, timerProgressBar: true, showConfirmButton: false,
          position: 'top-end', toast: true, iconColor: '#27ae60',
        });
      } catch {
        showApiError('Could not delete the row. Please try again.');
      }
    });
  };

  const saveRow = async () => {
    setYearError(false);
    setRateError(false);

    const yearVal = String(fieldYear).trim();
    const rateVal = String(fieldRate).trim();

    let valid = true;
    const year = parseInt(yearVal);
    if (!yearVal || isNaN(year) || year < 1 || year > 100) { setYearError(true); valid = false; }
    const rate = parseFloat(rateVal);
    if (!rateVal || isNaN(rate) || rate < 0 || rate > 100) { setRateError(true); valid = false; }
    if (!valid) return;

    const isEdit    = editRow !== null;
    const yearExists = rows.some(r => r.year === year && (!isEdit || r.id !== editRow.id));

    if (yearExists) {
      await Swal.fire({
        icon: 'warning',
        title: 'Duplicate Year',
        text: `Year ${year} already exists in the schedule. Please use a different year number.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#e67e22',
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container');
          if (swalContainer) swalContainer.style.setProperty('z-index', '2147483647', 'important');
        },
      });
      return;
    }

    try {
      let flashId;
      if (isEdit) {
        const old = editRow;
        const updated = await updateRate(old.id, currentProject.value, year, rate);
        flashId = updated.id;

        const actionText =
          old.year === year && old.rate === rate
            ? `No changes were made to ${formatYear(year)}.`
          : old.year === year
            ? `Rate for ${formatYear(year)} updated from ${formatRate(old.rate)} to ${formatRate(rate)}.`
          : old.rate === rate
            ? `Year changed from ${formatYear(old.year)} to ${formatYear(year)} (rate stayed ${formatRate(rate)}).`
            : `Updated from ${formatYear(old.year)} (${formatRate(old.rate)}) to ${formatYear(year)} (${formatRate(rate)}).`;

        Swal.fire({
          icon: 'success', title: 'Row Updated!', text: actionText,
          timer: 3000, timerProgressBar: true, showConfirmButton: false,
          position: 'top-end', toast: true, iconColor: '#27ae60',
        });
      } else {
        const created = await createRate(currentProject.value, year, rate);
        flashId = created.id;
        Swal.fire({
          icon: 'success', title: 'Row Added!',
          text: `${formatYear(year)} (${formatRate(rate)}) has been added.`,
          timer: 3000, timerProgressBar: true, showConfirmButton: false,
          position: 'top-end', toast: true, iconColor: '#27ae60',
        });
      }

      closeModal();
      await loadRates(currentProject.value, flashId);
    } catch {
      showApiError('Could not save the row. Please try again.');
    }
  };

  /* ── derived stats ── */
  const avgRate = rows.length > 0 ? rows.reduce((s, r) => s + r.rate, 0) / rows.length : 0;
  const maxRate = rows.length > 0 ? Math.max(...rows.map(r => r.rate)) : 0;

  /* ── modal portal ── */
  const modalPortal = portalRoot ? ReactDOM.createPortal(
    <div
      className={`vdr-modal-overlay${modalOpen ? ' open' : ''}`}
      onClick={e => { if (e.target.classList.contains('vdr-modal-overlay')) closeModal(); }}
    >
      <div className="vdr-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>
            <span className="dot" />
            <span>{modalTitle}</span>
          </h3>
          <button className="modal-close" onClick={closeModal} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="vdr-fieldYear">Year Number</label>
            <input
              ref={yearInputRef}
              type="number"
              id="vdr-fieldYear"
              placeholder="e.g. 10"
              min="1" max="100"
              value={fieldYear}
              onChange={e => setFieldYear(e.target.value)}
              className={yearError ? 'error' : ''}
            />
            <p className="form-hint">Enter the year number (e.g. 1, 5, 10, 20…)</p>
            <span className={`form-error${yearError ? ' visible' : ''}`}>
              Please enter a valid year (1–100).
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="vdr-fieldRate">Discount Rate (%)</label>
            <input
              type="number"
              id="vdr-fieldRate"
              placeholder="e.g. 5.5"
              step="0.01" min="0" max="100"
              value={fieldRate}
              onChange={e => setFieldRate(e.target.value)}
              className={rateError ? 'error' : ''}
            />
            <p className="form-hint">Enter the percentage value (e.g. 3.5, 7, 12.25…)</p>
            <span className={`form-error${rateError ? ' visible' : ''}`}>
              Please enter a valid rate (0–100).
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={closeModal}>Cancel</button>
          <button className="btn-save" onClick={saveRow}>Save</button>
        </div>
      </div>
    </div>,
    portalRoot
  ) : null;

  /* ── render ── */
  return (
    <div className="vdr-root">
      {/* Header */}
      <div className="header-wrap">
        <header className="header">
          <div className="header-title">
            <div className="title-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="5" width="18" height="14" rx="2" stroke="#e67e22" strokeWidth="1.8"/>
                <path d="M2 9h18" stroke="#e67e22" strokeWidth="1.8"/>
                <path d="M7 13h3M7 16h5" stroke="#e67e22" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M14 13l1.5 1.5L17 12" stroke="#e67e22" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="17" cy="4" r="2.5" fill="#e67e22" opacity="0.5"/>
              </svg>
            </div>
            <h1>Variable Discount Rate</h1>
          </div>

          <div className="header-controls">
            <SearchableDropdown
              label="Company"
              value={currentCompany}
              options={companies}
              placeholder="Select a Company..."
              searchPlaceholder="Search a company…"
              disabled={false}
              onChange={handleCompanyChange}
            />
            <SearchableDropdown
              label="Project"
              value={currentProject}
              options={projects}
              placeholder="Select a Project..."
              searchPlaceholder="Search a project…"
              disabled={!currentCompany}
              onChange={handleProjectChange}
            />
          </div>
        </header>
      </div>

      {/* Main */}
      <main className="main-wrap">
        {loading && (
          <div className="empty-state">
            <p>Loading…</p>
          </div>
        )}

        {!loading && !showTable && (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="16" width="48" height="36" rx="4" stroke="#111" strokeWidth="2.5"/>
              <path d="M8 24h48" stroke="#111" strokeWidth="2.5"/>
              <path d="M20 32h24M20 40h16" stroke="#e67e22" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="48" cy="14" r="8" fill="#e67e22" opacity=".18"/>
            </svg>
            <p>Select a company and project to view the discount rate table.</p>
          </div>
        )}

        {!loading && showTable && (
          <div className="table-section visible">
            <div className="section-toolbar">
              <div className="section-meta">
                <div className="breadcrumb">
                  <span>{currentCompany?.label}</span> › Discount Schedule
                </div>
                <h2>{currentProject?.label}</h2>
              </div>
              <button className="btn-add" onClick={() => openModal('Add New Row')}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
                Add New Row
              </button>
            </div>

            <div className="table-card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Year</th>
                      <th>Discount Rate (%)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.id}
                        className={flashTargetId === row.id ? 'row-flash' : ''}>
                        <td style={{ color: 'var(--vdr-gray-dark)', fontSize: '0.8rem' }}>{idx + 1}</td>
                        <td><span className="year-badge">{formatYear(row.year)}</span></td>
                        <td><div className="rate-value">{formatRate(row.rate)}</div></td>
                        <td>
                          <div className="actions-cell">
                            <button className="btn-edit"   onClick={() => openEdit(row)}>Edit</button>
                            <button className="btn-delete" onClick={() => handleDelete(row)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>Showing <strong>{rows.length}</strong> record(s)</span>
                <span>
                  Average Rate: <strong style={{ color: 'var(--vdr-orange)' }}>{formatRate(avgRate)}</strong>
                  &nbsp;|&nbsp;
                  Max Rate: <strong style={{ color: 'var(--vdr-orange)' }}>{formatRate(maxRate)}</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal portal */}
      {modalPortal}
    </div>
  );
};

export default VariableDiscountRate;