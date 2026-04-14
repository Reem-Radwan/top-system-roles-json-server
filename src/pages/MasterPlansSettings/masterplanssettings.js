import React, {
  useState, useEffect, useRef, useCallback, useLayoutEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { Navigate } from 'react-router-dom';
import Panzoom from '@panzoom/panzoom';
import Swal from 'sweetalert2';
import './masterplanssettings.css';
import {
  getMasterplanSettingsData,
  getUnitSettingsDetails,
  saveUnitPosition,
  deleteUnitPosition,
  deleteChildUnit,
} from '../../data/masterplanssettingsdata';
import { getProjects } from '../../data/masterplansdata';

// ─── Roles allowed to access the Settings (edit) page ────────────────────────
// Mirrors base.html: only Admin, Developer, TeamMember, and Uploader receive
// the "Masterplan Settings" link ({% url 'unit_mapping' %}).
// All other roles are routed to the read-only Masterplans page instead.
const SETTINGS_ALLOWED_ROLES = ['Admin', 'Developer', 'TeamMember', 'Uploader'];

function getStoredUser() {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── SweetAlert above tooltip (z-index: 9999) and backdrop (z-index: 100000) ─
// All imports must come first (import/first rule). The injection runs once at
// module evaluation time — after imports are hoisted — so the order is safe.
if (typeof document !== 'undefined' && !document.getElementById('mps-swal-zfix')) {
  const s = document.createElement('style');
  s.id = 'mps-swal-zfix';
  s.textContent = '.swal2-container { z-index: 200000 !important; }';
  document.head.appendChild(s);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getPinLabel(unitCode) {
  if (!unitCode) return '';
  const parts = unitCode.split('_')[0].split('-');
  const last  = parts[parts.length - 1];
  return /^\d+$/.test(last) ? parseInt(last, 10) : last;
}
function formatPrice(v) {
  if (v == null || v === '' || v === 'N/A') return 'N/A';
  const n = parseFloat(v);
  return isNaN(n) ? String(v) : Math.floor(n).toLocaleString('en-US');
}
function formatArea(v) {
  if (v == null || v === '' || v === 'N/A') return 'N/A';
  const n = parseFloat(v);
  return isNaN(n) ? String(v) : n.toLocaleString('en-US');
}
function isMobile() { return window.innerWidth <= 767.98; }

// ─── Smart tooltip positioning ────────────────────────────────────────────────
function calcTooltipStyle(rect, w, h, isBuilding) {
  if (isMobile()) {
    if (isBuilding)
      return { position:'fixed', top:'20px', left:'2.5vw', right:'2.5vw', zIndex:9999, opacity:1 };
    return { position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', maxWidth:'90vw', zIndex:9999, opacity:1 };
  }
  const pad = 12, vw = window.innerWidth, vh = window.innerHeight;
  let top  = rect.top  - h - 14;
  let left = rect.left + rect.width / 2 - w / 2;
  if (top  < pad) top  = rect.bottom + 14;
  if (left < pad) left = pad;
  if (left + w > vw - pad) left = vw - w - pad;
  if (top  + h > vh - pad) top  = Math.max(pad, vh - h - pad);
  return { position:'fixed', top, left, zIndex:9999, opacity:1 };
}

// ─── Tooltip portal ───────────────────────────────────────────────────────────
function TooltipPortal({ children, markerRect, isBuilding }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ position:'fixed', opacity:0, top:0, left:0, zIndex:9999 });
  useLayoutEffect(() => {
    if (!ref.current || !markerRect) return;
    setStyle(calcTooltipStyle(markerRect, ref.current.offsetWidth, ref.current.offsetHeight, isBuilding));
  }, [markerRect, isBuilding, children]);
  return createPortal(<div ref={ref} style={style}>{children}</div>, document.body);
}

// ─── Project SearchSelect ─────────────────────────────────────────────────────
function ProjectSelect({ projects, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q,    setQ]    = useState('');
  const ref  = useRef(null);
  const iRef = useRef(null);
  const sel  = projects.find(p => String(p.id) === String(value));
  const list = projects.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="project-searchable-select" ref={ref}>
      <div
        className={`project-select-trigger ${open ? 'open' : ''}`}
        onClick={() => { setOpen(o => !o); setTimeout(() => iRef.current?.focus(), 50); }}
      >
        <i className="fa-solid fa-map" style={{ color:'#e07b00', marginRight:8, fontSize:14 }}/>
        <span className="project-select-value">{sel ? sel.name : 'Select a Project...'}</span>
        <div className="project-select-actions">
          {sel && (
            <span className="project-select-clear" onClick={e => { e.stopPropagation(); onChange('',''); setOpen(false); setQ(''); }}>
              <i className="fa-solid fa-xmark"/>
            </span>
          )}
          <i className={`fa-solid fa-chevron-down project-select-arrow ${open ? 'rotated' : ''}`}/>
        </div>
      </div>
      {open && (
        <div className="project-select-dropdown">
          <div className="project-select-search">
            <i className="fa-solid fa-magnifying-glass"/>
            <input ref={iRef} type="text" placeholder="Search projects..." value={q} onChange={e => setQ(e.target.value)} onClick={e => e.stopPropagation()}/>
          </div>
          <div className="project-select-options">
            {list.length === 0 && <div className="project-select-no-results">No projects found</div>}
            {list.map(p => (
              <div
                key={p.id}
                className={`project-select-option ${String(p.id) === String(value) ? 'selected' : ''}`}
                onClick={() => { onChange(String(p.id), p.name); setOpen(false); setQ(''); }}
              >
                <i className="fa-regular fa-map" style={{ marginRight:8, opacity:.5, fontSize:12 }}/>{p.name}
                {String(p.id) === String(value) && <i className="fa-solid fa-check" style={{ marginLeft:'auto', color:'#e07b00' }}/>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add-Position Form (portal, centered backdrop) ───────────────────────────
function AddForm({ x, y, onSave, onCancel }) {
  const [type, setType] = useState('single');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!code.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Unit Code Required',
        text: 'Please enter a unit code before saving.',
        confirmButtonColor: '#e07b00',
      });
      return;
    }
    setBusy(true);
    try {
      await onSave(type, code.trim());
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="mps-backdrop" onClick={onCancel}>
      <div className="mps-add-form" onClick={e => e.stopPropagation()}>
        <h4 className="mps-form-title">
          <i className="fa-solid fa-location-dot"/> Add Position
        </h4>

        <div className="mps-form-group">
          <label className="mps-form-label">Type</label>
          <select className="mps-form-control" value={type} onChange={e => setType(e.target.value)}>
            <option value="single">Single Unit</option>
            <option value="building">Building (Stack)</option>
          </select>
        </div>

        <div className="mps-form-group">
          <label className="mps-form-label">
            {type === 'building' ? 'Reference Unit Code' : 'Unit Code'}
          </label>
          <input
            className="mps-form-control"
            type="text"
            placeholder={type === 'building' ? 'e.g. BLK-A' : 'e.g. A-101'}
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
            autoFocus
          />
          {type === 'building' && (
            <small className="mps-form-help">
              Enter <strong>one</strong> reference unit code that identifies the building stack.
            </small>
          )}
        </div>

        <div className="mps-form-coords">
          <span><i className="fa-solid fa-crosshairs"/> X: {parseFloat(x).toFixed(2)}%</span>
          <span>Y: {parseFloat(y).toFixed(2)}%</span>
        </div>

        <div className="mps-form-actions">
          <button className="mps-btn mps-btn-success" onClick={handleSave} disabled={busy}>
            {busy ? <><i className="fa-solid fa-spinner fa-spin"/> Saving…</> : <><i className="fa-solid fa-floppy-disk"/> Save</>}
          </button>
          <button className="mps-btn mps-btn-secondary" onClick={onCancel} disabled={busy}>
            <i className="fa-solid fa-xmark"/> Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Admin Tooltip: Single Unit ───────────────────────────────────────────────
function SingleAdminTooltip({ data, positionId, markerRect, onClose, onDeletePin }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    onClose();
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Pin?',
      html: `Are you sure you want to delete the pin for <strong>${data.unit_code}</strong>?<br/>This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fa-solid fa-trash"></i> Delete',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    setDeleting(true);
    await onDeletePin(positionId);
  };

  return (
    <TooltipPortal markerRect={markerRect} isBuilding={false}>
      <div className="mps-tooltip" onClick={e => e.stopPropagation()}>
        <div className="mps-tooltip-header">
          <span><i className="fa-solid fa-location-dot"/>{data.unit_code}</span>
          <span className="mps-tooltip-close" onClick={onClose}>&times;</span>
        </div>
        <div className="mps-tooltip-field">
          <label>Price (EGP):</label>
          <span>{formatPrice(data.interest_free_unit_price)}</span>
        </div>
        {data.gross_area != null && data.gross_area !== 0 && (
          <div className="mps-tooltip-field">
            <label>Gross Area:</label>
            <span>{formatArea(data.gross_area)} m²</span>
          </div>
        )}
        {data.land_area != null && data.land_area !== 0 && (
          <div className="mps-tooltip-field">
            <label>Land Area:</label>
            <span>{formatArea(data.land_area)} m²</span>
          </div>
        )}
        <div className="mps-tooltip-footer">
          <button className="mps-btn mps-btn-danger mps-btn-full" onClick={handleDelete} disabled={deleting}>
            {deleting
              ? <><i className="fa-solid fa-spinner fa-spin"/> Deleting…</>
              : <><i className="fa-solid fa-trash"/> Delete Pin</>}
          </button>
        </div>
      </div>
    </TooltipPortal>
  );
}

// ─── Admin Tooltip: Building Stack ───────────────────────────────────────────
function BuildingAdminTooltip({ buildingName, units, positionId, markerRect, onClose, onDeletePin, onDeleteChild }) {
  const [rows,       setRows]       = useState(units);
  const [delStack,   setDelStack]   = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteChild = async (childId, unitCode) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Remove Unit?',
      html: `Remove <strong>${unitCode}</strong> from this building stack?`,
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fa-solid fa-trash"></i> Remove',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    setDeletingId(childId);
    try {
      await onDeleteChild(childId);
      setRows(r => r.filter(u => u.child_id !== childId));
    } finally { setDeletingId(null); }
  };

  const handleDeleteStack = async () => {
    onClose();
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Entire Stack?',
      html: `Are you sure you want to delete the entire building stack <strong>"${buildingName}"</strong>?<br/>All units in this stack will be unpinned.`,
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fa-solid fa-trash"></i> Delete Stack',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    setDelStack(true);
    await onDeletePin(positionId);
  };

  return (
    <TooltipPortal markerRect={markerRect} isBuilding>
      <div className="mps-tooltip mps-tooltip-wide" onClick={e => e.stopPropagation()}>
        <div className="mps-tooltip-header">
          <span><i className="fa-solid fa-building"/>{buildingName}</span>
          <span className="mps-tooltip-close" onClick={onClose}>&times;</span>
        </div>

        <div className="mps-building-scroll">
          {rows.length === 0
            ? <div className="mps-no-units">All units have been removed from this stack.</div>
            : (
              <table className="mps-building-table">
                <thead>
                  <tr><th>Unit</th><th>Floor</th><th>Price (EGP)</th><th>Area (m²)</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {rows.map(u => (
                    <tr key={u.child_id ?? u.unit_code}>
                      <td>{u.unit_code}</td>
                      <td>{u.floor}</td>
                      <td>{formatPrice(u.interest_free_unit_price)}</td>
                      <td>{formatArea(u.gross_area)}</td>
                      <td>
                        <button
                          className="mps-delete-child-btn"
                          title="Remove from stack"
                          disabled={deletingId === u.child_id || delStack}
                          onClick={() => u.child_id != null && handleDeleteChild(u.child_id, u.unit_code)}
                        >
                          {deletingId === u.child_id
                            ? <i className="fa-solid fa-spinner fa-spin"/>
                            : 'X'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>

        <div className="mps-tooltip-footer">
          <button className="mps-btn mps-btn-danger mps-btn-full" onClick={handleDeleteStack} disabled={delStack}>
            {delStack
              ? <><i className="fa-solid fa-spinner fa-spin"/> Deleting…</>
              : <><i className="fa-solid fa-trash"/> Delete Entire Stack</>}
          </button>
        </div>
      </div>
    </TooltipPortal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MasterplansSettings() {
  // ── Role check (value only — guard is applied in JSX after all hooks) ────
  // Rules of Hooks forbid early returns before hooks, so we read the role here
  // and defer the redirect to the return statement below.
  const currentUser = getStoredUser();
  const isAllowed   = !!currentUser && SETTINGS_ALLOWED_ROLES.includes(currentUser.role);

  const [allProjects, setAllProjects] = useState([]);
  const [selProjId,  setSelProjId]  = useState('');
  const [mapState,   setMapState]   = useState('empty');
  const [imageUrl,   setImageUrl]   = useState(null);
  const [positions,  setPositions]  = useState([]);
  const [tooltip,    setTooltip]    = useState(null);
  const [addForm,    setAddForm]    = useState(null);

  const pzRef        = useRef(null);
  const wRef         = useRef(null);
  const iwRef        = useRef(null);
  const imgRef       = useRef(null);
  const isPanningRef = useRef(false);
  const lastTapRef   = useRef(0);
  const projIdRef    = useRef('');

  const destroyPz = useCallback(() => {
    if (pzRef.current) { try { pzRef.current.destroy(); } catch (_) {} pzRef.current = null; }
  }, []);

  // ── Load projects from API ────────────────────────────────────────────────
  useEffect(() => {
    getProjects().then(list => setAllProjects(list)).catch(() => setAllProjects([]));
  }, []); // eslint-disable-line

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') { setTooltip(null); setAddForm(null); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    const h = e => {
      if (!tooltip) return;
      const inside = e.target.closest?.('.mps-tooltip') || e.target.closest?.('.unit-marker');
      if (!inside) setTooltip(null);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [tooltip]);

  const loadMap = useCallback(async pid => {
    setMapState('loading');
    setTooltip(null);
    setAddForm(null);
    setImageUrl(null);
    setPositions([]);
    destroyPz();
    try {
      const d = await getMasterplanSettingsData(pid);
      if (d.has_masterplan) {
        setImageUrl(d.image_url);
        setPositions(d.unit_positions);
        setMapState('loaded');
      } else {
        setMapState('no_masterplan');
      }
    } catch { setMapState('no_masterplan'); }
  }, [destroyPz]);

  useEffect(() => {
    if (mapState !== 'loaded' || !imageUrl || !wRef.current || !imgRef.current) return;
    const img = imgRef.current;

    const init = () => {
      img.classList.add('loaded');
      setTimeout(() => {
        if (!wRef.current) return;

        const pz = Panzoom(wRef.current, {
          maxScale         : 6,
          minScale         : 1,
          contain          : null,
          startScale       : 1,
          animate          : true,
          // ── FIX 1: disable Panzoom's own double-click zoom so our dblclick fires ──
          zoomOnDoubleClick: false,
        });
        pzRef.current = pz;
        const elem = wRef.current;

        elem.addEventListener('panstart', () => { isPanningRef.current = true; });
        elem.addEventListener('panend',   () => { setTimeout(() => { isPanningRef.current = false; }, 200); });

        elem.addEventListener('panzoomchange', ev => {
          const sc = ev.detail.scale;
          const ms = Math.max(0.3, 1 / sc);
          iwRef.current?.querySelectorAll('.unit-marker').forEach(m => {
            m.style.transform = `translate(0%,-100%) rotate(-45deg) scale(${ms})`;
          });
        });

        // ── FIX 2: listen on the IMAGE WRAPPER (which has pointer-events: auto
        //    in settings mode via the mps-crosshair override), NOT on the raw img
        //    element which has pointer-events:none in the shared CSS.
        //    We use iwRef (the .masterplan-image-wrapper div) so the coordinate
        //    maths stays relative to the visible image bounds. ──────────────────
        const imageWrapper = iwRef.current;

        imageWrapper.addEventListener('dblclick', e => {
          // Ignore clicks that landed on a pin marker
          if (e.target.closest('.unit-marker')) return;
          if (isPanningRef.current) return;

          // ── FIX 3: always measure against the img element itself so we get
          //    accurate percentages regardless of zoom/pan state ──────────────
          const imgEl  = imgRef.current;
          const rect   = imgEl.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width)  * 100;
          const y = ((e.clientY - rect.top)  / rect.height) * 100;
          if (isFinite(x) && isFinite(y)) { setAddForm({ x, y }); }
        });

        // ── Touch double-tap (same fix: listen on wrapper, measure img) ────────
        imageWrapper.addEventListener('touchend', e => {
          if (e.target.closest('.unit-marker')) return;
          if (isPanningRef.current) return;
          const now  = Date.now();
          const diff = now - lastTapRef.current;
          if (diff < 300 && diff > 0) {
            e.preventDefault();
            const touch  = e.changedTouches[0];
            const imgEl  = imgRef.current;
            const rect   = imgEl.getBoundingClientRect();
            const x = ((touch.clientX - rect.left) / rect.width)  * 100;
            const y = ((touch.clientY - rect.top)  / rect.height) * 100;
            if (isFinite(x) && isFinite(y)) { setAddForm({ x, y }); }
            lastTapRef.current = 0;
          } else {
            lastTapRef.current = now;
          }
        });

        wRef.current.parentElement?.addEventListener('wheel', pz.zoomWithWheel);
        pz.reset();
      }, 50);
    };

    if (img.complete && img.naturalWidth > 0) init();
    else img.decode?.().then(init).catch(init);
    return () => destroyPz();
  }, [mapState, imageUrl, destroyPz]);

  const handleProjectChange = (id, _name) => {
    projIdRef.current = id;
    setSelProjId(id);
    setTooltip(null);
    setAddForm(null);
    if (id) loadMap(id);
    else { setMapState('empty'); destroyPz(); }
  };

  const handleMarkerClick = useCallback(async (pos, el) => {
    const mr = el.getBoundingClientRect();
    try {
      const r = await getUnitSettingsDetails(pos.unit_code, projIdRef.current);
      if (!r) return;
      setTooltip({ ...r, positionId: pos.id, markerRect: mr });
    } catch { /* silently ignore */ }
  }, []);

  // ── Save new pin with validation ──────────────────────────────────────────
  const handleSavePin = useCallback(async (type, code) => {
    const r = await saveUnitPosition(projIdRef.current, code, type, addForm.x, addForm.y);

    if (!r.success) {
      setAddForm(null);

      if (r.errorType === 'not_in_catalogue') {
        await Swal.fire({
          icon: 'error',
          title: 'Unit Not Found',
          html: `<strong>${code}</strong> was not found in the database.<br/>Please verify the unit code and try again.`,
          confirmButtonColor: '#e07b00',
          confirmButtonText: 'OK',
        });
      } else if (r.errorType === 'already_pinned') {
        await Swal.fire({
          icon: 'warning',
          title: 'Already Pinned',
          html: `<strong>${code}</strong> already has a pin on this masterplan.<br/>Each unit can only be pinned once.`,
          confirmButtonColor: '#e07b00',
          confirmButtonText: 'OK',
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: r.error || 'An unexpected error occurred.',
          confirmButtonColor: '#e07b00',
        });
      }
      return;
    }

    // Success — add the new pin to state
    setPositions(prev => [...prev, {
      id         : r.position_id,
      unit_code  : r.unit_code,
      unit_type  : r.unit_type,
      x_percent  : r.x_percent,
      y_percent  : r.y_percent,
      unit_status: r.unit_status,
      filter_data: [],
      child_codes: [],
    }]);
    setAddForm(null);

    await Swal.fire({
      icon: 'success',
      title: 'Pin Added',
      html: `<strong>${r.unit_code}</strong> has been successfully pinned to the masterplan.`,
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    });
  }, [addForm]);

  const handleDeletePin = useCallback(async (positionId) => {
    const r = await deleteUnitPosition(positionId);
    if (r.success) {
      setPositions(prev => prev.filter(p => p.id !== positionId));
      setTooltip(null);
    }
  }, []);

  const handleDeleteChild = useCallback(async (childId) => {
    await deleteChildUnit(childId);
  }, []);

  const mkClass = pos => {
    let c = 'unit-marker';
    if (pos.unit_type === 'building') c += ' building';
    else {
      const st = (pos.unit_status || '').toLowerCase();
      c += st === 'available' ? ' available' : st.includes('blocked') ? ' blocked' : ' unavailable';
    }
    return c;
  };

  // ── Route guard (after all hooks — Rules of Hooks compliant) ────────────
  // Only Admin / Developer / TeamMember / Uploader may use the settings page.
  // Any other authenticated role that navigates here directly is redirected.
  if (!isAllowed) return <Navigate to="/" replace />;

  return (
    <div className="unit-mapping-container">

      {/* ── Page Header ── */}
      <div className="masterplan-page-header">
        <div className="masterplan-page-title">
          <i className="fa-solid fa-map-pin"/>
          <span>Unit Mapping Settings</span>
        </div>
        <div className="masterplan-page-select-wrap">
          <ProjectSelect projects={allProjects} value={selProjId} onChange={handleProjectChange}/>
        </div>
      </div>

      {/* ── Empty / loading states ── */}
      {mapState === 'empty' && (
        <div className="no-masterplan">
          <i className="fa-solid fa-map" style={{ fontSize:48, opacity:.2, marginBottom:16 }}/>
          <p>Select a project to load its masterplan</p>
        </div>
      )}
      {mapState === 'no_masterplan' && (
        <div className="no-masterplan">
          <i className="fa-solid fa-map-location-dot" style={{ fontSize:48, opacity:.2, marginBottom:16 }}/>
          <p>No masterplan found for this project</p>
        </div>
      )}
      {mapState === 'loading' && (
        <div className="loading"><p>Loading masterplan…</p></div>
      )}

      {/* ── Masterplan container — only rendered when loaded ── */}
      {mapState === 'loaded' && imageUrl && (
        <div className="masterplan-container" id="masterplan-container">

          <div className="zoom-controls">
            <button className="zoom-btn" title="Zoom In"  onClick={() => pzRef.current?.zoomIn()}>+</button>
            <button className="zoom-btn" title="Zoom Out" onClick={() => pzRef.current?.zoomOut()}>−</button>
            <button className="zoom-btn" title="Reset"    onClick={() => pzRef.current?.reset()}>↻</button>
          </div>

          <div id="masterplan-wrapper" ref={wRef} style={{ width:'100%', height:'100%' }}>
            {/*
              ── FIX 4: the .masterplan-image-wrapper div is our event target.
                 It has pointer-events: auto (it's a normal div).
                 The <img> inside it has pointer-events: none in the shared CSS,
                 which is CORRECT for the viewer page (prevents accidental drags).
                 For the settings page we DON'T need to change the img's
                 pointer-events — we simply listen on the wrapper div instead,
                 exactly like the pure HTML version listens on the container.
                 The crosshair cursor is applied via CSS on .masterplan-image-wrapper
                 when the settings page is active (see masterplanssettings.css).
            */}
            <div className="masterplan-image-wrapper mps-crosshair" ref={iwRef}>
              <img
                ref={imgRef}
                src={imageUrl}
                className="masterplan-image"
                alt="Masterplan"
                draggable={false}
              />
              {positions.map(pos => {
                const x = parseFloat(pos.x_percent);
                const y = parseFloat(pos.y_percent);
                if (isNaN(x) || isNaN(y)) return null;
                return (
                  <div
                    key={pos.id}
                    className={mkClass(pos)}
                    data-position-id={pos.id}
                    data-unit-code={pos.unit_code}
                    title={pos.unit_code}
                    style={{ left:`${x}%`, top:`${y}%` }}
                    onClick={e => { e.stopPropagation(); handleMarkerClick(pos, e.currentTarget); }}
                    onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); handleMarkerClick(pos, e.currentTarget); }}
                  >
                    <span>{getPinLabel(pos.unit_code)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Add-Position Form ── */}
      {addForm && (
        <AddForm
          x={addForm.x}
          y={addForm.y}
          onSave={handleSavePin}
          onCancel={() => setAddForm(null)}
        />
      )}

      {/* ── Admin Tooltips ── */}
      {tooltip && (() => {
        if (tooltip.type === 'single') return (
          <SingleAdminTooltip
            data={tooltip.data}
            positionId={tooltip.positionId}
            markerRect={tooltip.markerRect}
            onClose={() => setTooltip(null)}
            onDeletePin={handleDeletePin}
          />
        );
        if (tooltip.type === 'building') return (
          <BuildingAdminTooltip
            buildingName={tooltip.building_name}
            units={tooltip.data}
            positionId={tooltip.positionId}
            markerRect={tooltip.markerRect}
            onClose={() => setTooltip(null)}
            onDeletePin={handleDeletePin}
            onDeleteChild={handleDeleteChild}
          />
        );
        return null;
      })()}
    </div>
  );
}