// ─────────────────────────────────────────────────────────────────────────────
// cataloge.jsx  –  synced brochure/map icons + pulsing pin + back-nav
//
// RBAC changes applied (mirrors unit_catalog.html Django template):
//   1. Company selector  → only Admin / Developer  (is_unbound_user)
//   2. Status + Phasing columns  → hidden for Sales, SalesHead, SalesOperation
//
// DATA SOURCE: JSON Server via src/services/catalogeApi.js  (was: mockUnits / mockCompanies)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import './cataloge.css';
import { ROLES } from '../../data/permissions';
// ── API service (replaces mockUnits / mockCompanies) ─────────────────────────
import { fetchCompanies, fetchUnitsByCompany } from '../../services/catalogeApi';
// ── BROCHURE BRIDGE: live image sync from UnitBrochureManager ────────────────
import { getBridgeImages, subscribeToBrochureChanges } from '../../data/brochureBridge';

// ─── RBAC helpers ─────────────────────────────────────────────────────────────
function getAuthUser() {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isUnboundUser(role) {
  return role === ROLES.ADMIN || role === ROLES.DEVELOPER;
}

function hasStatusPermission(role) {
  return [
    ROLES.ADMIN,
    ROLES.DEVELOPER,
    ROLES.TEAM_MEMBER,
    ROLES.MANAGER,
    ROLES.VIEWER,
  ].includes(role);
}
// ─────────────────────────────────────────────────────────────────────────────

/* ── Toast ── */
function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ position:'fixed',top:20,right:20,zIndex:99999,background:'#fff',color:'#16a34a',border:'1px solid #bbf7d0',borderRadius:10,padding:'12px 16px',display:'flex',alignItems:'center',gap:10,boxShadow:'0 6px 24px rgba(0,0,0,0.12)',fontSize:13,fontWeight:600,maxWidth:320,animation:'toastIn 0.3s ease' }}>
        <i className="fa-solid fa-circle-check" style={{fontSize:16,color:'#16a34a',flexShrink:0}}/>
        <span style={{flex:1}}>{message}</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#86efac',cursor:'pointer',fontSize:18,lineHeight:1,flexShrink:0,padding:'0 2px'}}>&times;</button>
      </div>
    </>
  );
}

/* ── Badges ── */
const StatusBadge = ({ status }) => {
  const s = (status||'').toLowerCase();
  let c = 'status-cell status-default';
  if (s.includes('available')) c='status-cell status-available';
  else if (s.includes('blocked')) c='status-cell status-blocked';
  else if (s.includes('contracted')||s.includes('reserved')||s.includes('sold')) c='status-cell status-booked';
  return <span className={c}>{status||'Available'}</span>;
};
const FinishingBadge = ({ finishing }) => {
  const f=(finishing||'Standard'), fl=f.toLowerCase();
  let c='finishing-cell finishing-standard';
  if(fl.includes('ultra'))c='finishing-cell finishing-ultra';
  else if(fl.includes('luxury'))c='finishing-cell finishing-luxury';
  else if(fl.includes('premium'))c='finishing-cell finishing-premium';
  else if(fl.includes('fully finished')||fl.includes('finished'))c='finishing-cell finishing-finished';
  else if(fl.includes('core')||fl.includes('shell'))c='finishing-cell finishing-core';
  return <span className={c}>{f}</span>;
};

/* ── Pagination ── */
const Pagination = ({ totalItems, currentPage, rowsPerPage, onPageChange }) => {
  const tp=Math.ceil(totalItems/rowsPerPage); if(tp<=1)return null;
  const s1=(currentPage-1)*rowsPerPage+1, e1=Math.min(currentPage*rowsPerPage,totalItems);
  let s=Math.max(1,currentPage-2),e=Math.min(tp,currentPage+2);
  if(s===1)e=Math.min(5,tp); if(e===tp)s=Math.max(1,tp-4);
  const pages=[]; for(let i=s;i<=e;i++)pages.push(i);
  return (
    <div className="pagination-wrapper">
      <div className="text-muted small">Showing <b>{s1}</b>–<b>{e1}</b> of <b>{totalItems}</b></div>
      <nav><ul className="pagination mb-0">
        <li className={`page-item ${currentPage===1?'disabled':''}`}><button className="page-link" onClick={()=>onPageChange(Math.max(1,currentPage-1))}>Previous</button></li>
        {s>1&&<><li className="page-item"><button className="page-link" onClick={()=>onPageChange(1)}>1</button></li>{s>2&&<li className="page-item disabled"><button className="page-link">…</button></li>}</>}
        {pages.map(p=><li key={p} className={`page-item ${p===currentPage?'active':''}`}><button className="page-link" onClick={()=>onPageChange(p)}>{p}</button></li>)}
        {e<tp&&<>{e<tp-1&&<li className="page-item disabled"><button className="page-link">…</button></li>}<li className="page-item"><button className="page-link" onClick={()=>onPageChange(tp)}>{tp}</button></li></>}
        <li className={`page-item ${currentPage===tp?'disabled':''}`}><button className="page-link" onClick={()=>onPageChange(Math.min(tp,currentPage+1))}>Next</button></li>
      </ul></nav>
    </div>
  );
};

/* ── Brochure Modal — same carousel as masterplan ── */
const LayoutModal = ({ images, onClose }) => {
  const [idx,setIdx]=useState(0);
  if(!images?.length)return null;
  const next=()=>setIdx(p=>(p+1)%images.length);
  const prev=()=>setIdx(p=>(p-1+images.length)%images.length);
  return (
    <div className="layout-modal-overlay show" onClick={onClose}>
      <div className="layout-modal-content" onClick={e=>e.stopPropagation()}>
        <button type="button" className="close-modal-btn" onClick={onClose}>&times;</button>
        {images.length>1&&<>
          <button type="button" className="layout-arrow layout-arrow-left" onClick={prev}><i className="fa-solid fa-chevron-left"/></button>
          <button type="button" className="layout-arrow layout-arrow-right" onClick={next}><i className="fa-solid fa-chevron-right"/></button>
        </>}
        <div style={{textAlign:'center'}}>
          <img src={images[idx]} alt={`Layout ${idx+1}`} className="carousel-img"/>
          {images.length>1&&<div style={{marginTop:14,fontWeight:500,color:'#6b7280'}}>{idx+1} / {images.length}</div>}
        </div>
      </div>
    </div>
  );
};

/* ── Date hierarchy filter ── */
const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DateHierarchyFilter=({data,colKey,selectedValues,onChange})=>{
  const [exp,setExp]=useState({});
  const h=useMemo(()=>{const h={};data.forEach(r=>{const raw=r[colKey];if(!raw)return;const d=new Date(raw);if(isNaN(d))return;const y=d.getFullYear(),m=d.getMonth();if(!h[y])h[y]={};if(!h[y][m])h[y][m]=[];h[y][m].push(raw);});return h;},[data,colKey]);
  const years=Object.keys(h).sort().reverse();
  if(!years.length)return<div className="text-muted small p-2">No dates</div>;
  const toggle=y=>setExp(p=>({...p,[y]:!p[y]}));
  const hM=(vals,chk)=>{let n=[...(selectedValues||[])];if(chk)n=[...new Set([...n,...vals])];else n=n.filter(v=>!vals.includes(v));onChange(n);};
  return<ul className="date-hierarchy-list">{years.map(y=>{const ms=Object.keys(h[y]).sort((a,b)=>+a-+b),all=Object.values(h[y]).flat(),ck=all.length>0&&all.every(v=>(selectedValues||[]).includes(v));return<li key={y} className="date-year-item"><div className="date-year-header"><input type="checkbox" checked={ck} onChange={e=>hM(all,e.target.checked)} style={{marginRight:8,accentColor:'#d97706'}}/><span className="date-year-label" onClick={()=>toggle(y)}>{y}</span><i className={`fa-solid fa-chevron-down date-year-toggle ${exp[y]?'rotated':''}`} onClick={()=>toggle(y)}/></div><ul className={`date-month-list ${exp[y]?'expanded':''}`}>{ms.map(m=>{const vals=h[y][m],mck=vals.every(v=>(selectedValues||[]).includes(v));return<li key={m} className="date-month-item"><input type="checkbox" checked={mck} onChange={e=>hM(vals,e.target.checked)} style={{marginRight:8,accentColor:'#d97706'}}/>{monthNames[+m]}</li>;})}</ul></li>;})}
  </ul>;
};

/* ── Columns ── */
const ALL_COLUMNS=[
  {key:'unit_code',label:'Unit Code'},{key:'project',label:'Project'},{key:'status',label:'Status'},
  {key:'sales_phasing',label:'Phasing'},{key:'num_bedrooms',label:'Bedrooms'},{key:'building_type',label:'Building'},
  {key:'unit_type',label:'Type'},{key:'unit_model',label:'Model'},
  {key:'development_delivery_date',label:'Delivery',type:'date'},
  {key:'finishing_specs',label:'Finishing'},
  {key:'sellable_area',label:'Gross Area (m²)',type:'range',rangeKey:'area',isArea:true},
  {key:'land_area',label:'Land (m²)',type:'range',rangeKey:'land',isArea:true},
  {key:'garden_area',label:'Garden (m²)',type:'range',rangeKey:'garden',isArea:true},
  {key:'penthouse_area',label:'Penthouse (m²)',type:'range',rangeKey:'penthouse',isArea:true},
  {key:'roof_terraces_area',label:'Roof (m²)',type:'range',rangeKey:'roof',isArea:true},
  {key:'interest_free_unit_price',label:'Price (EGP)',type:'range',rangeKey:'price',isPrice:true},
];

const STATUS_COLUMN_KEYS = new Set(['status', 'sales_phasing']);

const passesRange=(item,filters,skip)=>{for(const c of ALL_COLUMNS){if(!c.rangeKey||c.rangeKey===skip)continue;const v=parseFloat(item[c.key])||0;if(filters[`${c.rangeKey}Min`]&&v<parseFloat(filters[`${c.rangeKey}Min`]))return false;if(filters[`${c.rangeKey}Max`]&&v>parseFloat(filters[`${c.rangeKey}Max`]))return false;}return true;};
const passesChk=(item,filters,skip)=>{for(const[k,v]of Object.entries(filters)){if(k.endsWith('Min')||k.endsWith('Max')||k===skip)continue;if(Array.isArray(v)&&v.length>0&&!v.includes(String(item[k])))return false;}return true;};

/* ── Main ── */
export default function Catalog(){
  // ── Read logged-in user role once on mount ──────────────────────────────
  const authUser = useMemo(() => getAuthUser(), []);
  const userRole  = authUser?.role ?? '';

  const showCompanySelector = isUnboundUser(userRole);
  const showStatusCols      = hasStatusPermission(userRole);

  // ── State ───────────────────────────────────────────────────────────────
  const [selCo,setSelCo]=useState('');
  const [active,setActive]=useState([]);
  const [filtered,setFiltered]=useState([]);
  const [filters,setFilters]=useState({});
  const [activeDD,setActiveDD]=useState(null);
  const [ddPos,setDdPos]=useState({top:0,left:0});
  const [searchT,setSearchT]=useState({});
  const [page,setPage]=useState(1);
  const PER=50;
  const tbRef=useRef(null);
  const [modal,setModal]=useState(null);
  const [hlCode,setHlCode]=useState(null);
  const hlRef=useRef(null);
  const [toast,setToast]=useState(null);
  const [single,setSingle]=useState(false);
  const [retUrl,setRetUrl]=useState(null);

  // ── NEW: API-loaded companies list + loading/error state ────────────────
  const [companies, setCompanies]   = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [apiError, setApiError]     = useState(null);

  // ── Load companies once on mount ────────────────────────────────────────
  useEffect(() => {
    fetchCompanies()
      .then(data => setCompanies(data))
      .catch(err => {
        console.error('Failed to load companies:', err);
        setApiError('Could not load companies. Is JSON Server running?');
      });
  }, []);

  // ── Helper: load units for a company ID and apply optional filters ──────
  const loadUnits = useCallback(async (companyId, hlUnit = null, singleMode = false) => {
    setLoadingUnits(true);
    setApiError(null);
    try {
      const data = await fetchUnitsByCompany(companyId);
      setActive(data);
      let disp = data;
      if (singleMode && hlUnit) disp = data.filter(u => u.unit_code === hlUnit);
      setFiltered(disp);
      if (hlUnit) {
        setHlCode(hlUnit);
        const i = disp.findIndex(u => u.unit_code === hlUnit);
        if (i !== -1) setPage(Math.floor(i / PER) + 1);
        setToast(`Showing details for unit: ${hlUnit}`);
      }
    } catch (err) {
      console.error('Failed to load units:', err);
      setApiError('Could not load units. Is JSON Server running?');
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  // ── BROCHURE BRIDGE SYNC ──────────────────────────────────────────────────
  const [brochureTick,setBrochureTick]=useState(0);
  useEffect(()=>{
    const unsub=subscribeToBrochureChanges(()=>setBrochureTick(t=>t+1));
    return unsub;
  },[]);

  const getLiveImages=useCallback((unit)=>{
    const live=getBridgeImages(unit.unit_code);
    if(live!==null) return live.map(img=>img.url);
    return Array.isArray(unit.layout_images)?unit.layout_images:[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[brochureTick]);

  // FIX: 'handleBackToMap' was defined but never used in the JSX.
  // Wired it up to a back button that appears in single-unit mode (when
  // the user arrived via a map link and retUrl / history.back() is available).
  const handleBackToMap = useCallback(() => {
    if (retUrl) window.location.href = retUrl;
    else window.history.back();
  }, [retUrl]);

  // ── On mount: read URL params; auto-load company for bound roles ─────────
  useEffect(()=>{
    const p=new URLSearchParams(window.location.search);
    const hl=p.get('highlight_code'),co=p.get('company_id'),sm=p.get('single_unit_mode')==='1',ru=p.get('return_url');

    if(ru) setRetUrl(decodeURIComponent(ru));
    if(sm) setSingle(true);

    const resolvedCoId = co
      ? parseInt(co, 10)
      : authUser?.company_id
        ? authUser.company_id
        : null;

    if(resolvedCoId){
      setSelCo(resolvedCoId);
      // ── CHANGED: was mockUnits.filter(...), now API call ──
      loadUnits(resolvedCoId, hl || null, sm);
      const url=new URL(window.location.href);
      ['highlight_code','company_id','single_unit_mode','return_url'].forEach(k=>url.searchParams.delete(k));
      window.history.replaceState({},``,url);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{if(hlCode&&hlRef.current)setTimeout(()=>hlRef.current?.scrollIntoView({behavior:'smooth',block:'center'}),300);},[hlCode,page]);
  useEffect(()=>{if(!hlCode)return;const t=setTimeout(()=>setHlCode(null),5000);return()=>clearTimeout(t);},[hlCode]);

  const handleBuy=(c,pr)=>Swal.fire({icon:'info',title:'Reserve Unit',text:`Reservation for unit ${c} (${pr}).`,confirmButtonColor:'#d97706'});

  const handleMapClick=unit=>{
    if(!unit.project_id||!unit.map_focus_code){
      Swal.fire({icon:'warning',title:'Not Pinned',text:'This unit has no masterplan pin.',confirmButtonColor:'#d97706'});
      return;
    }
    const projectUnits=active.filter(u=>u.project_id===unit.project_id&&u.map_focus_code);
    const codes=projectUnits.map(u=>u.unit_code).join(',');
    const params=new URLSearchParams();
    params.set('project_id',String(unit.project_id));
    params.set('focus_unit',unit.map_focus_code);
    if(codes)params.set('filtered_codes',encodeURIComponent(codes));
    window.location.href=`/masterplans?${params.toString()}`;
  };

  // ── CHANGED: handleCo now calls the API instead of filtering mockUnits ──
  const handleCo=e=>{
    const id=parseInt(e.target.value,10);
    setSelCo(id||'');
    setFilters({});setActiveDD(null);setSearchT({});setPage(1);setHlCode(null);setSingle(false);setRetUrl(null);setToast(null);
    if(!id){setActive([]);setFiltered([]);return;}
    loadUnits(id);
  };

  const cur=useMemo(()=>filtered.slice((page-1)*PER,page*PER),[filtered,page]);

  const visCols=useMemo(()=>{
    const permittedCols = showStatusCols
      ? ALL_COLUMNS
      : ALL_COLUMNS.filter(col => !STATUS_COLUMN_KEYS.has(col.key));
    if(!selCo||!cur.length) return permittedCols;
    return permittedCols.filter(col=>
      cur.some(r=>{const v=r[col.key];return v!==null&&v!==undefined&&v!==''&&!(typeof v==='number'&&v===0);})
    );
  },[cur,selCo,showStatusCols]);

  const showMapBtn=useMemo(()=>{
    if(single)return false;
    return[...new Set(filtered.map(u=>u.project))].length===1&&filtered.length>0;
  },[filtered,single]);

  const rngStats=(ck,rk)=>{let mn=Infinity,mx=-Infinity;active.forEach(it=>{if(!passesRange(it,filters,rk)||!passesChk(it,filters))return;const v=parseFloat(it[ck])||0;if(v>0){if(v<mn)mn=v;if(v>mx)mx=v;}});return{min:isFinite(mn)?mn:null,max:isFinite(mx)?mx:null};};
  const getOpts=ck=>{const rel=active.filter(it=>passesRange(it,filters)&&passesChk(it,filters,ck));const vals=[...new Set(rel.map(r=>r[ck]))].filter(v=>v!==null&&v!==undefined&&v!==''&&v!==0);const t=(searchT[ck]||'').toLowerCase();return(t?vals.filter(v=>String(v).toLowerCase().includes(t)):vals).sort((a,b)=>!isNaN(a)&&!isNaN(b)?+a-+b:String(a).localeCompare(String(b)));};

  useEffect(()=>{
    if(!selCo||single)return;
    setFiltered(active.filter(it=>passesRange(it,filters)&&passesChk(it,filters)));setPage(1);if(tbRef.current)tbRef.current.scrollTop=0;
  },[filters,active,selCo,single]);

  const togDD=(e,k)=>{e.stopPropagation();if(activeDD===k){setActiveDD(null);return;}const r=e.currentTarget.getBoundingClientRect(),dw=290,vw=window.innerWidth,left=r.left+dw+8>vw?Math.max(4,r.right-dw):r.left;setDdPos({top:r.bottom+8,left});setActiveDD(k);};
  const hCb=(k,v)=>setFilters(p=>{const c=p[k]||[];return{...p,[k]:c.includes(v)?c.filter(x=>x!==v):[...c,v]};});
  const hRng=(k,v)=>setFilters(p=>({...p,[k]:v}));
  const hDate=(k,v)=>setFilters(p=>({...p,[k]:v}));
  const reset=()=>{setFilters({});setActiveDD(null);setSearchT({});};
  useEffect(()=>{const c=()=>setActiveDD(null);window.addEventListener('click',c);return()=>window.removeEventListener('click',c);},[]);
  const hPage=p=>{setPage(p);if(tbRef.current)tbRef.current.scrollTop=0;};

  const fmtN=n=>n?parseFloat(n).toLocaleString('en-US'):'0';
  const fmtA=n=>(!n||n===0)?<span className="text-muted" style={{opacity:0.25}}>-</span>:parseFloat(n).toFixed(2);
  const canClear=Object.keys(filters).length>0;
  const isFAct=col=>(Array.isArray(filters[col.key])&&filters[col.key].length>0)||(col.type==='range'&&(filters[`${col.rangeKey}Min`]||filters[`${col.rangeKey}Max`]));

  const redirectToMap=()=>{
    if(!filtered.length)return;
    const first=filtered.find(u=>u.project_id);
    if(first?.project_id){
      const codes=filtered.filter(u=>u.map_focus_code).map(u=>u.unit_code).join(',');
      const p=new URLSearchParams();p.set('project_id',String(first.project_id));if(codes)p.set('filtered_codes',encodeURIComponent(codes));
      window.location.href=`/masterplans?${p.toString()}`;return;
    }
    Swal.fire({toast:true,position:'top-end',icon:'info',title:`${filtered.length} units`,showConfirmButton:false,timer:2000});
  };

  const rndRng=col=>{const st=rngStats(col.key,col.rangeKey),fmt=v=>v===null?null:col.isArea?parseFloat(v).toFixed(2):col.isPrice?fmtN(v):String(v);
    return<div className="range-inputs"><label className="small" style={{fontWeight:600,display:'block',marginBottom:8}}>Filter Range</label><div className="range-input-group"><input type="number" className="range-min" placeholder={st.min!==null?`Min: ${fmt(st.min)}`:'Min'} value={filters[`${col.rangeKey}Min`]||''} onChange={e=>hRng(`${col.rangeKey}Min`,e.target.value)}/><input type="number" className="range-max" placeholder={st.max!==null?`Max: ${fmt(st.max)}`:'Max'} value={filters[`${col.rangeKey}Max`]||''} onChange={e=>hRng(`${col.rangeKey}Max`,e.target.value)}/></div></div>;
  };

  return(
    <div className="App" id="catalog">
      {toast&&<Toast message={toast} onClose={()=>setToast(null)}/>}

      {/* ── NEW: API error banner ── */}
      {apiError && (
        <div style={{background:'#fef2f2',border:'1px solid #fca5a5',color:'#b91c1c',padding:'10px 16px',borderRadius:8,margin:'12px 16px',fontSize:13}}>
          <i className="fa-solid fa-triangle-exclamation" style={{marginRight:8}}/>
          {apiError}
        </div>
      )}

      {/* Header */}
      <div className="catalog-search-section">
        <div className="catalog-search-top">
          <div className="catalog-search-title">
            {/* FIX: Back button wired to handleBackToMap — shown in single-unit
                mode (navigated here from masterplan) or when a return URL exists */}
            {(single || retUrl) && (
              <button
                type="button"
                className="catalog-back-btn"
                onClick={handleBackToMap}
                title="Back to map"
                style={{marginRight:10,background:'none',border:'1px solid #d97706',color:'#d97706',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:13,fontWeight:600}}
              >
                <i className="fa-solid fa-arrow-left" style={{marginRight:6}}/>
                Back to Map
              </button>
            )}

            <span className="catalog-header-icon"><i className="fa-solid fa-building"/></span>
            <span className="catalog-header-title">Units Inventory</span>

            {/* ── RBAC: Company selector only for Admin / Developer ── */}
            {showCompanySelector && (
              <div className="catalog-header-select-wrap">
                <select className="catalog-header-select" value={selCo||''} onChange={handleCo}>
                  <option value="">Select Company...</option>
                  {/* ── CHANGED: was mockCompanies.map(...), now API-loaded companies ── */}
                  {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span className="catalog-header-select-caret"><i className="fa-solid fa-caret-down"/></span>
              </div>
            )}
          </div>

          <div className="catalog-search-meta">
            {showMapBtn&&<button type="button" className="catalog-header-map" onClick={redirectToMap}><i className="fa-solid fa-map-location-dot"/> Show on Map</button>}
            <span className="catalog-header-count"><strong>{filtered.length}</strong> units</span>
            {!single&&<button type="button" className="catalog-header-clear" onClick={reset} disabled={!canClear}><i className="fa-solid fa-filter-circle-xmark" style={{marginRight:4}}/>Clear Filters</button>}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="container-new-new">
        {/* ── NEW: loading spinner ── */}
        {loadingUnits ? (
          <div style={{textAlign:'center',padding:'40px',color:'#6b7280'}}>
            <i className="fa-solid fa-spinner fa-spin" style={{fontSize:24,marginBottom:8}}/><br/>
            Loading units...
          </div>
        ) : !selCo?(
          <div id="emptyState" className="empty-state">
            <h4>
              {showCompanySelector
                ? 'Please select a company to view inventory.'
                : 'No inventory available.'}
            </h4>
          </div>
        ):(
          <div className="table-container-new-new" ref={tbRef} tabIndex={0}>
            <table className="modern-table">
              <thead><tr>
                {visCols.map(col=>(
                  <th key={col.key}>
                    <div className="th-content">
                      {col.label}
                      {!single&&<button className={`header-filter-btn ${isFAct(col)?'active':''}`} onClick={e=>togDD(e,col.key)} title={`Filter by ${col.label}`}><i className="fa-solid fa-filter"/></button>}
                    </div>
                  </th>
                ))}
                <th style={{minWidth:130}}>Actions</th>
              </tr></thead>
              <tbody>
                {cur.length>0?cur.map((unit,i)=>{
                  const isHL=unit.unit_code===hlCode;
                  const liveImages = getLiveImages(unit);
                  const hasBrochure = liveImages.length > 0;
                  const hasMapPin   = !!unit.project_id && !!unit.map_focus_code;
                  return(
                    <tr key={i} ref={isHL?hlRef:null} style={isHL?{background:'#fff3cd',outline:'2px solid #ffc107',animation:'hlFade 5s forwards'}:{}}>
                      {visCols.map(col=>{
                        if(col.key==='unit_code')return<td key={col.key}><span className="unit-code-badge">{unit[col.key]}</span></td>;
                        if(col.key==='status')return<td key={col.key}><StatusBadge status={unit[col.key]}/></td>;
                        if(col.key==='finishing_specs')return<td key={col.key}><FinishingBadge finishing={unit[col.key]}/></td>;
                        if(col.isPrice)return<td key={col.key}><span className="price-text">{fmtN(unit[col.key])}</span></td>;
                        if(col.isArea)return<td key={col.key}>{fmtA(unit[col.key])}</td>;
                        return<td key={col.key}>{unit[col.key]}</td>;
                      })}
                      <td style={{textAlign:'center'}}>
                        <button
                          className="action-icon-btn ai-brochure"
                          title={hasBrochure?'View Brochure':'No brochure available'}
                          disabled={!hasBrochure}
                          style={!hasBrochure?{opacity:0.25,cursor:'not-allowed',pointerEvents:'none'}:{}}
                          onClick={()=>hasBrochure&&setModal(liveImages)}
                        ><i className="fa-regular fa-images"/></button>

                        <button
                          className="action-icon-btn ai-map-available"
                          title={hasMapPin?'View on Masterplan (pin will pulse)':'No masterplan pin'}
                          disabled={!hasMapPin}
                          style={!hasMapPin?{opacity:0.25,cursor:'not-allowed',pointerEvents:'none'}:{}}
                          onClick={()=>hasMapPin&&handleMapClick(unit)}
                        ><i className="fa-solid fa-map-location-dot"/></button>

                        <button className="action-icon-btn ai-reserve" title="Reserve" onClick={()=>handleBuy(unit.unit_code,unit.project)}>
                          <i className="fa-solid fa-cart-shopping"/>
                        </button>
                      </td>
                    </tr>
                  );
                }):(
                  <tr><td colSpan={visCols.length+1} className="no-results"><h6 className="text-muted">No units match these filters.</h6></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {selCo&&!single&&<Pagination totalItems={filtered.length} currentPage={page} rowsPerPage={PER} onPageChange={hPage}/>}
      </div>

      {/* Filter dropdowns */}
      {!single&&activeDD&&(()=>{
        const col=ALL_COLUMNS.find(c=>c.key===activeDD); if(!col)return null;
        return(
          <div className={`custom-dropdown-menu ${col.type==='range'?'range-filter':''}`} style={{display:'block',top:ddPos.top,left:ddPos.left}} onClick={e=>e.stopPropagation()}>
            {col.type==='range'?rndRng(col):col.type==='date'?(
              <DateHierarchyFilter data={active} colKey={col.key} selectedValues={filters[col.key]||[]} onChange={v=>hDate(col.key,v)}/>
            ):(
              <>
                <div style={{marginBottom:8}}><input type="text" className="dropdown-search" placeholder="Search..." value={searchT[col.key]||''} onChange={e=>setSearchT(p=>({...p,[col.key]:e.target.value}))} autoFocus/></div>
                <div className="dropdown-options-list">
                  {getOpts(col.key).map((opt,i)=>(
                    <label key={i} className="dropdown-option-item">
                      <input type="checkbox" checked={filters[col.key]?.includes(String(opt))||false} onChange={()=>hCb(col.key,String(opt))} style={{accentColor:'#d97706',marginRight:8}}/>
                      {col.isPrice?fmtN(opt):opt}
                    </label>
                  ))}
                  {!getOpts(col.key).length&&<div className="text-muted small" style={{textAlign:'center',padding:8}}>No results</div>}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {modal&&<LayoutModal images={modal} onClose={()=>setModal(null)}/>}
      <style>{`@keyframes hlFade{0%{background:#fff3cd;outline-color:#ffc107}70%{background:#fff3cd;outline-color:#ffc107}100%{background:transparent;outline-color:transparent}}`}</style>
    </div>
  );
}