import React, {
  useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import Panzoom from '@panzoom/panzoom';
import Swal from 'sweetalert2';
import './masterplans.css';
import { getProjects, getMasterplanData, getUnitDetails, subscribeToSettingsChanges } from '../../data/masterplansdata';
import { bridgePositionStore } from '../../data/masterplansBridge';
import { ROLES } from '../../data/permissions';
import { getBridgeImages, subscribeToBrochureChanges } from '../../data/brochureBridge';

// ── Auth ──────────────────────────────────────────────────────────────────────
function getStoredUser() {
  try { const r = localStorage.getItem('auth_user'); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
const MANAGER_ROLES = [ROLES.ADMIN, ROLES.DEVELOPER, ROLES.TEAM_MEMBER, ROLES.MANAGER];
// ── BROCHURE BRIDGE: live image sync from UnitBrochureManager ────────────────



/* ── Helpers ── */
function getPinLabel(unitCode) {
  if (!unitCode) return '';
  const parts = unitCode.split('_')[0].split('-');
  const last  = parts[parts.length - 1];
  return /^\d+$/.test(last) ? parseInt(last, 10) : last;
}
function formatPrice(v) { if (v == null || v === '' || v === 'N/A') return 'N/A'; const n = parseFloat(v); return isNaN(n) ? v : Math.floor(n).toLocaleString('en-US'); }
function formatArea(v)  { if (v == null || v === '' || v === 'N/A') return 'N/A'; const n = parseFloat(v); return isNaN(n) ? v : n.toLocaleString('en-US'); }
function isValidMetric(v) { if (v == null) return false; const s = String(v).trim().toLowerCase(); if (!s || ['n/a','null','none','-'].includes(s)) return false; const n = parseFloat(v); return !(isNaN(n) === false && n === 0); }
function isMobile() { return window.innerWidth <= 767.98; }

/* ── Buy handler — identical to catalogue ── */
function handleBuyUnit(unitCode, project) {
  Swal.fire({
    icon: 'info',
    title: 'Reserve Unit',
    text: `Reservation for unit ${unitCode} (${project || ''}).`,
    confirmButtonColor: '#d97706',
  });
}

/* ── Smart tooltip position ── */
function calcTooltipStyle(rect, w, h, isBuilding) {
  if (isMobile()) {
    if (isBuilding) return { position:'fixed', top:'20px', left:'2.5vw', right:'2.5vw', zIndex:9999, opacity:1 };
    return { position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', maxWidth:'90vw', zIndex:9999, opacity:1 };
  }
  const pad=12, vw=window.innerWidth, vh=window.innerHeight;
  let top = rect.top - h - 14, left = rect.left + rect.width/2 - w/2;
  if (top < pad) top = rect.bottom + 14;
  if (left < pad) left = pad;
  if (left + w > vw - pad) left = vw - w - pad;
  if (top + h > vh - pad) top = Math.max(pad, vh - h - pad);
  return { position:'fixed', top, left, zIndex:9999, opacity:1 };
}

/* ── Project Select ── */
function ProjectSelect({ projects, value, onChange }) {
  const [open,setOpen]=useState(false), [q,setQ]=useState('');
  const ref=useRef(null), iRef=useRef(null);
  const sel=projects.find(p=>String(p.id)===String(value));
  const list=projects.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()));
  useEffect(()=>{
    const h=e=>{ if(ref.current&&!ref.current.contains(e.target)){setOpen(false);setQ('');} };
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[]);
  return (
    <div className="project-searchable-select" ref={ref}>
      <div className={`project-select-trigger ${open?'open':''}`} onClick={()=>{setOpen(o=>!o);setTimeout(()=>iRef.current?.focus(),50);}}>
        <i className="fa-solid fa-map" style={{color:'#e07b00',marginRight:8,fontSize:14}}/>
        <span className="project-select-value">{sel?sel.name:'Select a Project...'}</span>
        <div className="project-select-actions">
          {sel&&<span className="project-select-clear" onClick={e=>{e.stopPropagation();onChange('','');setOpen(false);setQ('');}}><i className="fa-solid fa-xmark"/></span>}
          <i className={`fa-solid fa-chevron-down project-select-arrow ${open?'rotated':''}`}/>
        </div>
      </div>
      {open&&(
        <div className="project-select-dropdown">
          <div className="project-select-search">
            <i className="fa-solid fa-magnifying-glass"/>
            <input ref={iRef} type="text" placeholder="Search projects..." value={q} onChange={e=>setQ(e.target.value)} onClick={e=>e.stopPropagation()}/>
          </div>
          <div className="project-select-options">
            {list.length===0&&<div className="project-select-no-results">No projects found</div>}
            {list.map(p=>(
              <div key={p.id} className={`project-select-option ${String(p.id)===String(value)?'selected':''}`} onClick={()=>{onChange(String(p.id),p.name);setOpen(false);setQ('');}}>
                <i className="fa-regular fa-map" style={{marginRight:8,opacity:.5,fontSize:12}}/>{p.name}
                {String(p.id)===String(value)&&<i className="fa-solid fa-check" style={{marginLeft:'auto',color:'#e07b00'}}/>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MultiSelect (portal dropdown) ── */
function MultiSelect({ options, selected, onChange, placeholder, validSet }) {
  const [val,setVal]=useState(''), [open,setOpen]=useState(false);
  const cRef=useRef(null), dRef=useRef(null), [pos,setPos]=useState({top:0,left:0,width:200});
  const calc=useCallback(()=>{ if(!cRef.current)return; const r=cRef.current.getBoundingClientRect(); setPos({top:r.bottom+2,left:r.left,width:r.width}); },[]);
  useEffect(()=>{ if(open)calc(); },[open,calc]);
  useEffect(()=>{ const h=e=>{ if(!cRef.current?.contains(e.target)&&!dRef.current?.contains(e.target)){setOpen(false);setVal('');} }; document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h); },[]);
  useEffect(()=>{ if(!open)return; window.addEventListener('scroll',calc,true); window.addEventListener('resize',calc); return()=>{ window.removeEventListener('scroll',calc,true); window.removeEventListener('resize',calc); }; },[open,calc]);
  const filt=options.filter(o=>String(o).toLowerCase().includes(val.toLowerCase()));
  const add=v=>{ if(!selected.includes(String(v)))onChange([...selected,String(v)]); setVal(''); };
  const rem=v=>onChange(selected.filter(x=>x!==v));
  return (
    <div className="multi-select-container" ref={cRef} onClick={()=>{setOpen(true);cRef.current?.querySelector('input')?.focus();}}>
      {selected.map(v=><div key={v} className="multi-select-tag">{v}<i className="fa-solid fa-xmark" onMouseDown={e=>{e.stopPropagation();rem(v);}}/></div>)}
      <input type="text" className="multi-select-input" placeholder={selected.length===0?placeholder:''} value={val} onChange={e=>setVal(e.target.value)} onFocus={()=>{setOpen(true);calc();}} autoComplete="off" onClick={e=>e.stopPropagation()}/>
      {open&&createPortal(
        <div ref={dRef} style={{position:'fixed',top:pos.top,left:pos.left,width:pos.width,background:'#fff',border:'1px solid #ccc',borderTop:'none',borderRadius:'0 0 6px 6px',maxHeight:200,overflowY:'auto',zIndex:300000,boxShadow:'0 8px 24px rgba(0,0,0,.14)'}} onMouseDown={e=>e.stopPropagation()}>
          {filt.length===0?<div style={{padding:'8px 12px',color:'#aaa',fontSize:13}}>No options</div>
            :filt.map(opt=>{const s=String(opt),isSel=selected.includes(s),isDis=validSet!=null&&!validSet.has(s);return(
              <div key={s} className={`multi-select-option${isSel?' selected':''}${isDis?' disabled':''}`} onMouseDown={e=>{e.preventDefault();e.stopPropagation();if(!isSel&&!isDis)add(s);}}>
                {isSel&&<i className="fa-solid fa-check" style={{marginRight:6,fontSize:10,color:'#e07b00'}}/>}{opt}
              </div>
            );})}
        </div>, document.body
      )}
    </div>
  );
}

/* ── Layout Modal ── */
function LayoutModal({ images, onClose }) {
  const [idx,setIdx]=useState(0);
  if(!images?.length)return null;
  const next=()=>setIdx(p=>(p+1)%images.length);
  const prev=()=>setIdx(p=>(p-1+images.length)%images.length);
  return createPortal(
    <div className="mp-layout-modal-overlay" onClick={onClose}>
      <div className="mp-layout-modal-content" onClick={e=>e.stopPropagation()}>
        <button type="button" className="mp-close-modal-btn" onClick={onClose}>&times;</button>
        {images.length>1&&<>
          <button type="button" className="mp-layout-arrow mp-layout-arrow-left" onClick={prev}>
            <i className="fa-solid fa-chevron-left"/>
          </button>
          <button type="button" className="mp-layout-arrow mp-layout-arrow-right" onClick={next}>
            <i className="fa-solid fa-chevron-right"/>
          </button>
        </>}
        <div style={{textAlign:'center'}}>
          <img src={images[idx]} alt={`Layout ${idx+1}`} className="mp-carousel-img"/>
          {images.length>1&&(
            <div style={{marginTop:14,fontWeight:500,color:'#6b7280',fontSize:13}}>
              {idx+1} / {images.length}
            </div>
          )}
        </div>
      </div>
    </div>, document.body
  );
}

/* ── Tooltip Portal ── */
function TooltipPortal({ children, markerRect, isBuilding }) {
  const ref=useRef(null);
  const [style,setStyle]=useState({position:'fixed',opacity:0,top:0,left:0,zIndex:9999});
  useLayoutEffect(()=>{
    if(!ref.current||!markerRect)return;
    setStyle(calcTooltipStyle(markerRect,ref.current.offsetWidth,ref.current.offsetHeight,isBuilding));
  },[markerRect,isBuilding,children]);
  return createPortal(<div ref={ref} style={style}>{children}</div>,document.body);
}

/* ── Single Tooltip ── */
function SingleTooltip({ unit, companyId, markerRect, onClose, onViewLayout, onShowInCatalog, getLiveImages, isManager }) {
  // Use live bridge images (picks up UnitBrochureManager uploads instantly)
  const liveImages = getLiveImages ? getLiveImages(unit.unit_code) : (unit.layout_images || []);
  const hasBrochure = liveImages.length > 0;
  const handleBuy = () => { onClose(); handleBuyUnit(unit.unit_code, unit.project); };
  return (
    <TooltipPortal markerRect={markerRect} isBuilding={false}>
      <div className="unit-tooltip" onClick={e=>e.stopPropagation()}>
        <div className="tooltip-header"><span>{unit.unit_code}</span><span className="tooltip-close" onClick={onClose}>&times;</span></div>
        {unit.interest_free_unit_price&&<div className="tooltip-field"><label>Price (EGP):</label><span>{formatPrice(unit.interest_free_unit_price)}</span></div>}
        <div className="tooltip-field"><label>Status:</label><span>{unit.status||'N/A'}</span></div>
        <div className="tooltip-field"><label>Delivery:</label><span>{unit.development_delivery_date||'N/A'}</span></div>
        <div className="tooltip-field"><label>Finishing:</label><span>{unit.finishing_specs||'N/A'}</span></div>
        {isValidMetric(unit.gross_area)&&<div className="tooltip-field"><label>Gross Area:</label><span>{formatArea(unit.gross_area)} m²</span></div>}
        {isValidMetric(unit.garden_area)&&<div className="tooltip-field"><label>Garden:</label><span>{formatArea(unit.garden_area)} m²</span></div>}
        {isValidMetric(unit.land_area)&&<div className="tooltip-field"><label>Land:</label><span>{formatArea(unit.land_area)} m²</span></div>}
        {isValidMetric(unit.penthouse_area)&&<div className="tooltip-field"><label>Penthouse:</label><span>{formatArea(unit.penthouse_area)} m²</span></div>}
        {isValidMetric(unit.roof_terraces_area)&&<div className="tooltip-field"><label>Roof/Terrace:</label><span>{formatArea(unit.roof_terraces_area)} m²</span></div>}
        {hasBrochure&&<button className="buy-now-btn" style={{backgroundColor:'#17a2b8',marginTop:5,marginBottom:5}} onClick={()=>onViewLayout(liveImages)}><i className="fa-regular fa-images"/> View Brochure</button>}
        {(unit.status==='Available'||isManager)&&(
          <button className="buy-now-btn" onClick={handleBuy}>
            <i className="fa-solid fa-cart-shopping"/> Buy Now
          </button>
        )}
        <div style={{textAlign:'center',marginTop:8,paddingTop:8,borderTop:'1px solid #eee'}}>
          <button style={{fontSize:12,color:'#e07b00',background:'none',border:'none',cursor:'pointer',fontWeight:'bold',padding:0}} onClick={()=>onShowInCatalog(unit.unit_code,companyId)}>
            <i className="fa-solid fa-list-ul"/> Show Details in Catalog
          </button>
        </div>
      </div>
    </TooltipPortal>
  );
}

/* ── Building Tooltip ── */
function BuildingTooltip({ buildingName, units, companyId, markerRect, onClose, onViewLayout, urlFilters, frontendFilters, onShowInCatalog, getLiveImages, isManager }) {
  const { selCodes,selBeds,selFinish,selMod,selStat,minA,maxA } = frontendFilters;
  const visible = units.filter(u=>{
    if(urlFilters?.length&&!urlFilters.includes(u.unit_code))return false;
    if(selCodes.length&&!selCodes.includes(u.unit_code))return false;
    if(selBeds.length&&!selBeds.includes(String(u.num_bedrooms)))return false;
    if(selFinish.length&&!selFinish.includes(u.finishing_specs))return false;
    if(selMod.length&&!selMod.includes(u.unit_model))return false;
    if(selStat.length&&!selStat.includes(u.status))return false;
    const a=parseFloat(u.gross_area);
    if(!isNaN(minA)&&(isNaN(a)||a<minA))return false;
    if(!isNaN(maxA)&&(isNaN(a)||a>maxA))return false;
    if(!isManager&&u.status!=='Available')return false;
    return true;
  });
  return (
    <TooltipPortal markerRect={markerRect} isBuilding>
      <div className="unit-tooltip wide-tooltip" onClick={e=>e.stopPropagation()} style={{minWidth:580,maxWidth:'min(700px,96vw)'}}>
        <div className="tooltip-header"><span>{buildingName}</span><span className="tooltip-close" onClick={onClose}>&times;</span></div>
        {visible.length===0
          ? <div style={{padding:'14px 0',textAlign:'center',color:'#aaa',fontSize:12}}>No matching units.</div>
          : <table className="building-units-table" style={{width:'100%'}}>
              <thead><tr><th>Unit</th><th>Floor</th><th>Status</th><th>Price (EGP)</th><th>Finishing</th><th>Area</th><th>Actions</th></tr></thead>
              <tbody>{visible.map(u=>(
                <tr key={u.unit_code}>
                  <td>{u.unit_code}</td><td>{u.floor||'N/A'}</td><td>{u.status}</td>
                  <td>{u.interest_free_unit_price?formatPrice(u.interest_free_unit_price):'N/A'}</td>
                  <td>{u.finishing_specs||'N/A'}</td><td>{formatArea(u.gross_area)} m²</td>
                  <td><div style={{display:'flex',gap:4,alignItems:'center'}}>
                    {(()=>{ const imgs=getLiveImages?getLiveImages(u.unit_code):(u.layout_images||[]); return imgs.length>0&&<button className="btn btn-sm btn-info text-white" style={{padding:'2px 6px',fontSize:11,border:'none',borderRadius:3}} onClick={()=>onViewLayout(imgs)}><i className="fa-regular fa-images"/></button>; })()}
                    <button className="btn btn-sm btn-light border" style={{padding:'2px 6px',fontSize:11,color:'#e07b00'}} onClick={()=>onShowInCatalog(u.unit_code,companyId)}><i className="fa-solid fa-circle-info"/></button>
                    {(u.status==='Available'||isManager)&&(
                      <button
                        className="buy-btn"
                        style={{margin:0,padding:'2px 8px',fontSize:11}}
                        onClick={()=>{ onClose(); handleBuyUnit(u.unit_code, buildingName); }}
                      >
                        Buy
                      </button>
                    )}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
        }
      </div>
    </TooltipPortal>
  );
}

/* ── Filter Modal ── */
const EMPTY_FILTER = { codes:[],beds:[],fin:[],mod:[],stat:[],areaMin:'',areaMax:'' };

function FilterModal({ show, onClose, onApply, onReset, positions, isClient, filterSel, setFilterSel }) {
  const allOpts = useMemo(()=>{
    const codes=new Set(),beds=new Set(),fin=new Set(),mod=new Set(),stat=new Set(); let areas=[];
    positions.forEach(pos=>pos.filter_data?.forEach(u=>{ codes.add(u.unit_code); if(u.bedrooms&&u.bedrooms!=='-')beds.add(String(u.bedrooms)); if(u.finishing&&u.finishing!=='N/A')fin.add(u.finishing); if(u.model&&u.model!=='N/A')mod.add(u.model); if(u.status)stat.add(u.status); if(u.area>0)areas.push(u.area); }));
    return { codes:[...codes].sort(), beds:[...beds].sort((a,b)=>parseFloat(a)-parseFloat(b)), fin:[...fin].sort(), mod:[...mod].sort(), stat:[...stat].sort(), minArea:areas.length?Math.floor(Math.min(...areas)):0, maxArea:areas.length?Math.ceil(Math.max(...areas)):0 };
  },[positions]);

  const validSets = useMemo(()=>{
    const {codes:sC,beds:sB,fin:sF,mod:sM,stat:sS,areaMin,areaMax}=filterSel;
    const minA=parseFloat(areaMin),maxA=parseFloat(areaMax);
    const vs={codes:new Set(),beds:new Set(),fin:new Set(),mod:new Set(),stat:new Set()};
    positions.forEach(pos=>pos.filter_data?.forEach(u=>{
      const mC=!sC.length||sC.includes(u.unit_code),mB=!sB.length||sB.includes(String(u.bedrooms)),mF=!sF.length||sF.includes(u.finishing),mM=!sM.length||sM.includes(u.model),mS=!sS.length||sS.includes(u.status),mA=(isNaN(minA)||u.area>=minA)&&(isNaN(maxA)||u.area<=maxA);
      if(mB&&mF&&mM&&mS&&mA)vs.codes.add(u.unit_code); if(mC&&mF&&mM&&mS&&mA)vs.beds.add(String(u.bedrooms)); if(mC&&mB&&mM&&mS&&mA)vs.fin.add(u.finishing); if(mC&&mB&&mF&&mS&&mA)vs.mod.add(u.model); if(mC&&mB&&mF&&mM&&mA)vs.stat.add(u.status);
    }));
    return vs;
  },[positions,filterSel]);

  const dynArea = useMemo(()=>{
    const {codes:sC,beds:sB,fin:sF,mod:sM,stat:sS}=filterSel; let areas=[];
    positions.forEach(pos=>pos.filter_data?.forEach(u=>{ const mC=!sC.length||sC.includes(u.unit_code),mB=!sB.length||sB.includes(String(u.bedrooms)),mF=!sF.length||sF.includes(u.finishing),mM=!sM.length||sM.includes(u.model),mS=!sS.length||sS.includes(u.status); if(mC&&mB&&mF&&mM&&mS&&u.area>0)areas.push(u.area); }));
    if(!areas.length)return{min:allOpts.minArea,max:allOpts.maxArea};
    return{min:Math.floor(Math.min(...areas)),max:Math.ceil(Math.max(...areas))};
  },[positions,filterSel,allOpts]);

  const set=(f,v)=>setFilterSel(p=>({...p,[f]:v}));
  const hasF=filterSel.codes.length+filterSel.beds.length+filterSel.fin.length+filterSel.mod.length+filterSel.stat.length>0||filterSel.areaMin!==''||filterSel.areaMax!=='';
  const cnt=[filterSel.codes.length>0,filterSel.beds.length>0,filterSel.fin.length>0,filterSel.mod.length>0,filterSel.stat.length>0,filterSel.areaMin!==''||filterSel.areaMax!==''].filter(Boolean).length;

  if(!show)return null;
  return createPortal(
    <div className="filter-modal" style={{display:'block'}} onClick={onClose}>
      <div className="filter-modal-content fmr-wrap" onClick={e=>e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="fmr-head fmr-head-orange">
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div className="fmr-head-icon"><i className="fa-solid fa-sliders"/></div>
            <div>
              <div className="fmr-head-title">Filter Units</div>
              <div className="fmr-head-sub">{hasF?<><b style={{color:'#fff'}}>{cnt}</b> filter{cnt!==1?'s':''} active</>:'Narrow down visible pins'}</div>
            </div>
          </div>
          <button className="fmr-head-close" onClick={onClose}><i className="fa-solid fa-xmark"/></button>
        </div>

        {/* ── Body ── */}
        <div className="fmr-body2">

          {/* Unit Code */}
          <div className="fmr-grp">
            <label className="fmr-lbl"><i className="fa-solid fa-hashtag"/> Unit Code {filterSel.codes.length>0&&<span className="fmr-cnt">{filterSel.codes.length}</span>}</label>
            <MultiSelect options={allOpts.codes} selected={filterSel.codes} onChange={v=>set('codes',v)} placeholder="Search unit codes…" validSet={validSets.codes}/>
          </div>

          {/* Bedrooms + Finishing side by side */}
          <div className="fmr-row2">
            <div className="fmr-grp" style={{flex:1,minWidth:0}}>
              <label className="fmr-lbl"><i className="fa-solid fa-bed"/> Bedrooms {filterSel.beds.length>0&&<span className="fmr-cnt">{filterSel.beds.length}</span>}</label>
              <MultiSelect options={allOpts.beds} selected={filterSel.beds} onChange={v=>set('beds',v)} placeholder="Select bedrooms…" validSet={validSets.beds}/>
              {allOpts.beds.length===0&&<span className="fmr-empty-txt">—</span>}
            </div>
            <div className="fmr-grp" style={{flex:1,minWidth:0}}>
              <label className="fmr-lbl"><i className="fa-solid fa-paint-roller"/> Finishing {filterSel.fin.length>0&&<span className="fmr-cnt">{filterSel.fin.length}</span>}</label>
              <MultiSelect options={allOpts.fin} selected={filterSel.fin} onChange={v=>set('fin',v)} placeholder="Select…" validSet={validSets.fin}/>
            </div>
          </div>

          {/* Unit Model */}
          <div className="fmr-grp">
            <label className="fmr-lbl"><i className="fa-solid fa-building"/> Unit Model {filterSel.mod.length>0&&<span className="fmr-cnt">{filterSel.mod.length}</span>}</label>
            <MultiSelect options={allOpts.mod} selected={filterSel.mod} onChange={v=>set('mod',v)} placeholder="Select model…" validSet={validSets.mod}/>
          </div>

          {/* Area */}
          <div className="fmr-grp">
            <label className="fmr-lbl"><i className="fa-solid fa-vector-square"/> Gross Area (m²) {(filterSel.areaMin||filterSel.areaMax)&&<span className="fmr-cnt">✓</span>}</label>
            <div className="fmr-range2">
              <div className="fmr-rf"><span className="fmr-rlbl">Min</span><input type="number" placeholder={dynArea.min||'0'} value={filterSel.areaMin} onChange={e=>set('areaMin',e.target.value)}/></div>
              <span className="fmr-rdash">—</span>
              <div className="fmr-rf"><span className="fmr-rlbl">Max</span><input type="number" placeholder={dynArea.max||'∞'} value={filterSel.areaMax} onChange={e=>set('areaMax',e.target.value)}/></div>
            </div>
            <div style={{fontSize:10,color:'#9ca3af',marginTop:3}}>Available: {dynArea.min}–{dynArea.max} m²</div>
          </div>

          {/* Status — inline visible checkboxes */}
          {!isClient&&allOpts.stat.length>0&&(
            <div className="fmr-grp">
              <label className="fmr-lbl"><i className="fa-solid fa-circle-dot"/> Status {filterSel.stat.length>0&&<span className="fmr-cnt">{filterSel.stat.length}</span>}</label>
              <div className="fmr-status-chips">
                {allOpts.stat.map(s=>{
                  const isSelected = filterSel.stat.includes(s);
                  const isDisabled = validSets.stat.size>0 && !validSets.stat.has(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      className={`fmr-status-chip${isSelected?' fmr-status-chip--on':''}${isDisabled?' fmr-status-chip--off':''}`}
                      onClick={()=>{
                        if(isDisabled)return;
                        set('stat', isSelected ? filterSel.stat.filter(x=>x!==s) : [...filterSel.stat,s]);
                      }}
                    >
                      <span className="fmr-status-chip-dot" style={{background: s.toLowerCase().includes('available')?'#28a745':s.toLowerCase().includes('sold')||s.toLowerCase().includes('contracted')||s.toLowerCase().includes('reserved')?'#dc3545':s.toLowerCase().includes('blocked')?'#ffc107':'#6c757d'}}/>
                      {s}
                      {isSelected&&<i className="fa-solid fa-check" style={{fontSize:9,marginLeft:3}}/>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="fmr-foot">
          <button className="fmr-btn-reset" disabled={!hasF} onClick={onReset}><i className="fa-solid fa-rotate-left"/> Reset</button>
          <div style={{display:'flex',gap:8}}>
            <button className="fmr-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="fmr-btn-apply" onClick={onApply}><i className="fa-solid fa-check"/> Apply</button>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ── Mobile Backdrop / Legend ── */
function MobileBackdrop({ onClose }) { return createPortal(<div className="tooltip-backdrop" onClick={onClose}/>,document.body); }

/* ── Main Component ── */
export default function Masterplans() {
  const user        = getStoredUser();
  const isManager   = MANAGER_ROLES.includes(user?.role ?? '');
  const isScoped    = !!(user?.company_id);

  // ── Load projects from API ────────────────────────────────────────────────
  const [allProjects, setAllProjects] = useState([]);
  useEffect(() => {
    getProjects().then(list => setAllProjects(list)).catch(() => setAllProjects([]));
  }, []); // eslint-disable-line

  const scopedProjects = isScoped
    ? allProjects.filter(p => p.company_id === user.company_id)
    : allProjects;
  // First project id for scoped users (used for auto-load)
  const firstScopedId  = isScoped && scopedProjects.length ? String(scopedProjects[0].id) : '';

  const [selProjId,setSelProjId]=useState(isScoped ? firstScopedId : '');
  const [mapState,setMapState]=useState('empty');
  const [masterplan,setMasterplan]=useState(null);
  const [tooltip,setTooltip]=useState(null);
  const [filterSel,setFilterSel]=useState({...EMPTY_FILTER});
  const [filterOpen,setFilterOpen]=useState(false);
  const [visibleCodes,setVisibleCodes]=useState(null);
  const [urlFilterList,setUrlFilterList]=useState(null);
  const [showClear,setShowClear]=useState(false);
  const [glowUnit,setGlowUnit]=useState(null);
  const [layoutImages,setLayoutImages]=useState(null);
  const [pendingCode,setPendingCode]=useState(null);

  // ── BROCHURE BRIDGE SYNC ──────────────────────────────────────────────────
  // Bumps whenever UnitBrochureManager uploads/deletes/reorders images,
  // forcing getLiveImages() to re-read fresh data from the bridge store.
  const [brochureTick,setBrochureTick]=useState(0);
  useEffect(()=>{
    const unsub=subscribeToBrochureChanges(()=>setBrochureTick(t=>t+1));
    return unsub;
  },[]);

  // Returns live URL[] for a unit_code, reading from brochureBridge first.
  // Bridge stores {id,url,label}[] — we extract plain strings so LayoutModal
  // receives the same format it always expected.
  // brochureTick in deps ensures this recreates (and tooltips re-render)
  // whenever the manager uploads/deletes/reorders images.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getLiveImages=useCallback((unitCode)=>{
    const live=getBridgeImages(unitCode);
    if(live!==null)return live.map(img=>img.url);
    return [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[brochureTick]);

  const pzRef=useRef(null),wRef=useRef(null),iwRef=useRef(null),imgRef=useRef(null);

  useEffect(()=>{
    const p=new URLSearchParams(window.location.search);
    const pid=p.get('project_id'),fu=p.get('focus_unit'),rc=p.get('filtered_codes'),ru=p.get('reopen_unit');
    if(rc){setUrlFilterList(decodeURIComponent(rc).split(',').filter(Boolean));setShowClear(true);}
    if(fu){setGlowUnit(fu);const u=new URL(window.location.href);u.searchParams.delete('focus_unit');window.history.replaceState({},``,u);}
    if(ru){setPendingCode(ru);const u=new URL(window.location.href);u.searchParams.delete('reopen_unit');window.history.replaceState({},``,u);}
    if(pid){
      const opt=allProjects.find(p=>String(p.id)===pid);
      setSelProjId(pid);setMpName(opt?.name||'');loadMap(pid);
    } else if(isScoped && firstScopedId){
      // Scoped users: auto-load their first company project (no manual selection needed)
      const opt=allProjects.find(p=>String(p.id)===firstScopedId);
      setMpName(opt?.name||'');
      loadMap(firstScopedId);
    }
  },[]);// eslint-disable-line

  const [,setMpName]=useState('');

  useEffect(()=>{
    const h=e=>{ if(tooltip){const ins=e.target.closest?.('.unit-tooltip')||e.target.closest?.('.unit-marker');if(!ins)setTooltip(null);} };
    document.addEventListener('click',h);return()=>document.removeEventListener('click',h);
  },[tooltip]);

  const destroyPz=useCallback(()=>{if(pzRef.current){try{pzRef.current.destroy();}catch(_){}pzRef.current=null;}},[]);

  const loadMap=useCallback(async pid=>{
    setMapState('loading');setTooltip(null);setMasterplan(null);destroyPz();
    try{const d=await getMasterplanData(pid);if(d.has_masterplan){setMasterplan(d);setMapState('loaded');}else setMapState('no_masterplan');}
    catch{setMapState('no_masterplan');}
  },[destroyPz]);

  // ── Subscribe to Settings pin changes so this page stays in sync ──────────
  const selProjIdRef = useRef(selProjId);
  useEffect(()=>{ selProjIdRef.current = selProjId; },[selProjId]);

  useEffect(()=>{
    const unsub = subscribeToSettingsChanges(changedProjectId => {
      const currentId = parseInt(selProjIdRef.current, 10);
      if (!currentId || changedProjectId !== currentId) return;
      // Read instantly from the bridge store — no async, no delay
      const livePositions = bridgePositionStore[currentId];
      if (!livePositions) return;
      setMasterplan(prev => prev ? { ...prev, unit_positions: [...livePositions] } : prev);
      setTooltip(null); // close any open tooltip since pins may have changed
    });
    return unsub;
  }, []);

  useEffect(()=>{
    if(mapState!=='loaded'||!masterplan||!wRef.current||!imgRef.current)return;
    const img=imgRef.current;
    const init=()=>{
      img.classList.add('loaded');
      setTimeout(()=>{
        if(!wRef.current)return;
        const pz=Panzoom(wRef.current,{maxScale:6,minScale:1,contain:null,startScale:1,animate:true});
        pzRef.current=pz;
        wRef.current.addEventListener('panzoomchange',ev=>{
          const sc=ev.detail.scale,ms=Math.max(0.3,1/sc);
          iwRef.current?.querySelectorAll('.unit-marker:not(.glow-active)').forEach(m=>{m.style.transform=`translate(0%,-100%) rotate(-45deg) scale(${ms})`;});
        });
        wRef.current.parentElement?.addEventListener('wheel',pz.zoomWithWheel);
        pz.reset();
      },50);
    };
    if(img.complete&&img.naturalWidth>0)init(); else img.decode?.().then(init).catch(init);
    return()=>destroyPz();
  },[mapState,masterplan,destroyPz]);

  /* Reopen tooltip after Back */
  useEffect(()=>{
    if(!pendingCode||mapState!=='loaded'||!masterplan)return;
    const code=pendingCode;
    const pos=masterplan.unit_positions.find(p=>p.unit_code===code);
    if(!pos){setPendingCode(null);return;}
    setTimeout(async()=>{
      const el=document.querySelector(`.unit-marker[data-unit-code="${code}"]`);
      if(el){ try{const r=await getUnitDetails(code);if(r)setTooltip({position:pos,response:r,markerRect:el.getBoundingClientRect()});}catch{} }
      else {
        for(const p of masterplan.unit_positions){
          if(p.unit_type==='building'){
            const ch=p.child_codes||p.filter_data?.map(u=>u.unit_code)||[];
            if(ch.includes(code)){
              const bel=document.querySelector(`.unit-marker[data-unit-code="${p.unit_code}"]`);
              if(bel){try{const r=await getUnitDetails(p.unit_code);if(r)setTooltip({position:p,response:r,markerRect:bel.getBoundingClientRect()});}catch{}}
              break;
            }
          }
        }
      }
      setPendingCode(null);
    },600);
  },[pendingCode,mapState,masterplan]);

  const handleProjectChange=(id,name)=>{
    setSelProjId(id);setMpName(name);setTooltip(null);setFilterSel({...EMPTY_FILTER});
    setVisibleCodes(null);setUrlFilterList(null);setShowClear(false);setGlowUnit(null);
    if(id)loadMap(id); else setMapState('empty');
  };

  const handleMarkerClick=useCallback(async(pos,el)=>{
    const mr=el.getBoundingClientRect();
    try{const r=await getUnitDetails(pos.unit_code);if(r)setTooltip({position:pos,response:r,markerRect:mr});}catch{}
  },[]);

  const handleShowInCatalog=useCallback((unitCode,companyId)=>{
    const retUrl=new URL(window.location.href);
    retUrl.searchParams.set('project_id',selProjId);
    retUrl.searchParams.set('reopen_unit',unitCode);
    const params=new URLSearchParams();
    if(unitCode)params.set('highlight_code',unitCode);
    if(companyId)params.set('company_id',String(companyId));
    params.set('single_unit_mode','1');
    params.set('return_url',encodeURIComponent(retUrl.toString()));
    window.location.href=`/cataloge?${params.toString()}`;
  },[selProjId]);

  const handleApply=()=>{
    const {codes,beds,fin,mod,stat,areaMin,areaMax}=filterSel;
    const hasF=codes.length+beds.length+fin.length+mod.length+stat.length>0||areaMin!==''||areaMax!=='';
    if(!hasF){setVisibleCodes(null);setShowClear(!!urlFilterList?.length);setFilterOpen(false);return;}
    const minA=parseFloat(areaMin),maxA=parseFloat(areaMax),matched=new Set();
    masterplan.unit_positions.forEach(pos=>pos.filter_data?.forEach(u=>{
      const ok=(!codes.length||codes.includes(u.unit_code))&&(!beds.length||beds.includes(String(u.bedrooms)))&&(!fin.length||fin.includes(u.finishing))&&(!mod.length||mod.includes(u.model))&&(!stat.length||stat.includes(u.status))&&(isNaN(minA)||u.area>=minA)&&(isNaN(maxA)||u.area<=maxA);
      if(ok){matched.add(u.unit_code);if(pos.unit_type==='building')matched.add(pos.unit_code);}
    }));
    setVisibleCodes(matched);setShowClear(true);setFilterOpen(false);
  };

  const handleClear=()=>{
    setVisibleCodes(null);setUrlFilterList(null);setFilterSel({...EMPTY_FILTER});setShowClear(false);setGlowUnit(null);
    const url=new URL(window.location.href);let ch=false;
    ['filtered_codes','focus_unit'].forEach(k=>{if(url.searchParams.has(k)){url.searchParams.delete(k);ch=true;}});
    if(ch)window.history.replaceState({},``,url);
  };

  const isVisible=useCallback(pos=>{
    if(urlFilterList?.length){ if(pos.unit_type==='single')return urlFilterList.includes(pos.unit_code); const ch=pos.child_codes||pos.filter_data?.map(u=>u.unit_code)||[];return ch.some(c=>urlFilterList.includes(c)); }
    if(visibleCodes){ if(pos.unit_type==='building'){const ch=pos.child_codes||pos.filter_data?.map(u=>u.unit_code)||[];return ch.some(c=>visibleCodes.has(c))||visibleCodes.has(pos.unit_code);}return visibleCodes.has(pos.unit_code); }
    return true;
  },[urlFilterList,visibleCodes]);

  const ff=useMemo(()=>({selCodes:filterSel.codes,selBeds:filterSel.beds,selFinish:filterSel.fin,selMod:filterSel.mod,selStat:filterSel.stat,minA:parseFloat(filterSel.areaMin),maxA:parseFloat(filterSel.areaMax)}),[filterSel]);

  const mkClass=pos=>{
    let c='unit-marker';
    if(pos.unit_type==='building') c+=' building';
    else {
      const st=(pos.unit_status||'').toLowerCase();
      c+=st==='available'?' available':st.includes('blocked')?' blocked':' unavailable';
    }
    const childCodes = pos.child_codes || (pos.filter_data||[]).map(u=>u.unit_code);
    const isGlow = pos.unit_code===glowUnit || (glowUnit && childCodes.includes(glowUnit));
    if(isGlow) c+=' glow-active';
    return c;
  };

  const activeCnt=[filterSel.codes.length>0,filterSel.beds.length>0,filterSel.fin.length>0,filterSel.mod.length>0,filterSel.stat.length>0,filterSel.areaMin!==''||filterSel.areaMax!==''].filter(Boolean).length;

  return(
    <div className="unit-mapping-container">
      <div className="masterplan-page-header">
        <div className="masterplan-page-title"><i className="fa-solid fa-map-location-dot"/><span>Masterplans</span></div>
        {/* Scoped users: company name badge only — no dropdown needed */}
        {/* Unscoped users (Admin/Developer): full searchable project picker */}
        <div className="masterplan-page-select-wrap">
          {isScoped ? (
            <div className="project-select-trigger" style={{cursor:'default',userSelect:'none'}}>
              <i className="fa-solid fa-map" style={{color:'#e07b00',marginRight:8,fontSize:14}}/>
              <span className="project-select-value">{scopedProjects.find(p=>String(p.id)===selProjId)?.name || scopedProjects[0]?.name || ''}</span>
            </div>
          ) : (
            <ProjectSelect projects={allProjects} value={selProjId} onChange={handleProjectChange}/>
          )}
        </div>
      </div>

      {/* ── Empty / loading states — full width like the header ── */}
      {mapState==='empty'&&<div className="no-masterplan"><i className="fa-solid fa-map" style={{fontSize:48,opacity:.2,marginBottom:16}}/><p>Select a project to load its masterplan</p></div>}
      {mapState==='no_masterplan'&&<div className="no-masterplan"><i className="fa-solid fa-map-location-dot" style={{fontSize:48,opacity:.2,marginBottom:16}}/><p>No masterplan for this project</p></div>}
      {mapState==='loading'&&<div className="loading"><p>Loading masterplan…</p></div>}

      {/* ── Masterplan container — only rendered when loaded ── */}
      {mapState==='loaded'&&masterplan&&(
        <div className="masterplan-container">
          {/* Controls only visible after a project is loaded */}
          <div className="zoom-controls">
            <button className="filter-btn-trigger" title="Filter" onClick={()=>setFilterOpen(true)} style={{position:'relative'}}>
              <i className="fa-solid fa-sliders"/>
              {activeCnt>0&&<span className="filter-badge">{activeCnt}</span>}
            </button>
            {showClear&&<button className="zoom-btn" style={{background:'#dc3545',fontSize:14,fontWeight:'bold'}} onClick={handleClear}><i className="fa-solid fa-filter-circle-xmark"/></button>}
            <div style={{height:10}}/>
            <button className="zoom-btn" onClick={()=>pzRef.current?.zoomIn()}>+</button>
            <button className="zoom-btn" onClick={()=>pzRef.current?.zoomOut()}>−</button>
            <button className="zoom-btn" onClick={()=>pzRef.current?.reset()}>↻</button>
          </div>

          <div id="masterplan-wrapper" ref={wRef} style={{width:'100%',height:'100%'}}>
            <div className="masterplan-image-wrapper" ref={iwRef}>
              <img ref={imgRef} src={masterplan.image_url} className="masterplan-image" alt="Masterplan" draggable={false}/>
              {masterplan.unit_positions.map(pos=>{
                const x=parseFloat(pos.x_percent),y=parseFloat(pos.y_percent);
                if(isNaN(x)||isNaN(y))return null;
                return(
                  <div key={pos.id} className={mkClass(pos)} data-position-id={pos.id} data-unit-code={pos.unit_code} title={pos.unit_code}
                    style={{left:`${x}%`,top:`${y}%`,display:isVisible(pos)?'':'none'}}
                    onClick={e=>{e.stopPropagation();if(pos.unit_code===glowUnit)setGlowUnit(null);handleMarkerClick(pos,e.currentTarget);}}
                    onTouchEnd={e=>{e.preventDefault();e.stopPropagation();if(pos.unit_code===glowUnit)setGlowUnit(null);handleMarkerClick(pos,e.currentTarget);}}
                  ><span>{getPinLabel(pos.unit_code)}</span></div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tooltip&&(()=>{
        const{response:r,markerRect}=tooltip;
        if(r.type==='single')return<>{isMobile()&&<MobileBackdrop onClose={()=>setTooltip(null)}/>}<SingleTooltip unit={r.data} companyId={r.company_id} markerRect={markerRect} onClose={()=>setTooltip(null)} onViewLayout={setLayoutImages} onShowInCatalog={handleShowInCatalog} getLiveImages={getLiveImages} isManager={isManager}/></>;
        if(r.type==='building')return<>{isMobile()&&<MobileBackdrop onClose={()=>setTooltip(null)}/>}<BuildingTooltip buildingName={r.building_name} units={r.data} companyId={r.company_id} markerRect={markerRect} onClose={()=>setTooltip(null)} onViewLayout={setLayoutImages} urlFilters={urlFilterList} frontendFilters={ff} onShowInCatalog={handleShowInCatalog} getLiveImages={getLiveImages} isManager={isManager}/></>;
        return null;
      })()}

      <FilterModal show={filterOpen} onClose={()=>setFilterOpen(false)} onApply={handleApply} onReset={()=>setFilterSel({...EMPTY_FILTER})} positions={masterplan?.unit_positions||[]} isClient={masterplan?.is_client||false} filterSel={filterSel} setFilterSel={setFilterSel}/>

      {layoutImages&&<LayoutModal images={layoutImages} onClose={()=>setLayoutImages(null)}/>}
    </div>
  );
}