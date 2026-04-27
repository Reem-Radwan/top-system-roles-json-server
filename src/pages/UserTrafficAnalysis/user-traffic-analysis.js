import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  Chart,
  LineController, BarController, PieController, DoughnutController,
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { UTA_PRO, UTA_EXCL, utaCatOf } from '../../data/user-traffic-analysisdata';
import {
  fetchDashboardData,
} from '../../services/user-traffic-analysisApi';
import './user-traffic-analysis.css'

// Register chart.js components once
Chart.register(
  LineController, BarController, PieController, DoughnutController,
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, ArcElement,
  Tooltip, Legend, Filler,
  ChartDataLabels,
);
Chart.defaults.font.family = "'Times New Roman', Times, serif";
Chart.defaults.font.size   = 12;
Chart.defaults.color       = '#64748b';

// ─── helpers ────────────────────────────────────────────────
const capFirst = s => s.charAt(0).toUpperCase() + s.slice(1);

function tooltipStyle() {
  return {
    backgroundColor: '#ffffff',
    titleColor:      '#1e293b',
    bodyColor:       '#64748b',
    borderColor:     '#e2e8f0',
    borderWidth:     1,
    padding:         12,
    cornerRadius:    8,
    boxPadding:      4,
    titleFont: { family: "'Times New Roman',Times,serif", weight: '700', size: 12 },
    bodyFont:  { family: "'Times New Roman',Times,serif", size: 12 },
  };
}

function arrToggle(arr, val) {
  const i = arr.indexOf(val);
  return i >= 0 ? [...arr.slice(0, i), ...arr.slice(i + 1)] : [...arr, val];
}

function setOrToggle(val, current) {
  return current === val ? null : val;
}

// ─── compute (pure fn, memoised) ────────────────────────────
// allLogs = complete unfiltered dataset (needed for cohort first-month lookup)
function compute(F, allLogs = []) {
  let rows = allLogs.filter(r => {
    if (F.start && r.dt < F.start) return false;
    if (F.end) { const e = new Date(F.end); e.setHours(23, 59, 59, 999); if (r.dt > e) return false; }
    if (F.companies.length && !F.companies.includes(r.co)) return false;
    if (F.emails.length   && !F.emails.includes(r.email)) return false;
    if (F.groups.length   && !F.groups.includes(r.grp))   return false;
    if (F.paths.length    && !F.paths.includes(r.path))   return false;
    if (F.hours.length    && !F.hours.includes(r.dt.getHours())) return false;
    if (F.dows.length     && !F.dows.includes(r.dt.getDay()))   return false;
    if (F.dateFilter && r.dt.toISOString().slice(0, 10) !== F.dateFilter) return false;
    if (F.cohortMonth) {
      const userFirstMonth = {};
      allLogs.forEach(x => {
        const m = x.dt.getFullYear() + '-' + String(x.dt.getMonth() + 1).padStart(2, '0');
        if (!userFirstMonth[x.uid] || m < userFirstMonth[x.uid]) userFirstMonth[x.uid] = m;
      });
      if (userFirstMonth[r.uid] !== F.cohortMonth) return false;
    }
    if (F.urlCategory && utaCatOf(r.path) !== F.urlCategory) return false;
    return true;
  });

  const buckets = {};
  rows.forEach(r => {
    const dt = r.dt; let key;
    if (F.interval === 'month')     key = new Date(dt.getFullYear(), dt.getMonth(), 1).toISOString();
    else if (F.interval === 'week') { const d = new Date(dt); d.setDate(d.getDate() - d.getDay() + 1); d.setHours(0,0,0,0); key = d.toISOString(); }
    else key = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).toISOString();
    if (!buckets[key]) buckets[key] = { v: 0, u: new Set() };
    buckets[key].v++; buckets[key].u.add(r.uid);
  });
  const skd = Object.keys(buckets).sort();
  const ts  = skd.map(k => {
    const b = buckets[k], d = new Date(k);
    const lbl = F.interval === 'month'
      ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
      : d.toISOString().slice(0, 10);
    return { date: lbl, v: b.v, u: b.u.size };
  });
  const cb   = skd.length;
  const avgV = cb > 0 ? Math.round(ts.reduce((s,t) => s+t.v, 0) / cb * 100) / 100 : 0;
  const avgU = cb > 0 ? Math.round(ts.reduce((s,t) => s+t.u, 0) / cb * 100) / 100 : 0;

  const urlC={}, urlU={}, coC={}, coU={}, uC={}, grpC={}, grpU={};
  rows.forEach(r => {
    urlC[r.path] = (urlC[r.path]||0)+1;
    if (!urlU[r.path]) urlU[r.path] = new Set(); urlU[r.path].add(r.uid);
    coC[r.co]   = (coC[r.co]||0)+1;
    if (!coU[r.co]) coU[r.co] = new Set(); coU[r.co].add(r.uid);
    if (!uC[r.email]) uC[r.email] = { email: r.email, name: r.name, v: 0 }; uC[r.email].v++;
    if (!UTA_EXCL.includes(r.grp)) {
      grpC[r.grp] = (grpC[r.grp]||0)+1;
      if (!grpU[r.grp]) grpU[r.grp] = new Set(); grpU[r.grp].add(r.uid);
    }
  });
  const topUrls  = Object.entries(urlC).map(([p,c]) => ({ p, c, u: urlU[p].size })).sort((a,b) => b.c-a.c).slice(0,15);
  const topCos   = Object.entries(coC).map(([n,c])  => ({ n, c, u: coU[n].size  })).sort((a,b) => b.c-a.c).slice(0,15);
  const topUsers = Object.values(uC).sort((a,b) => b.v-a.v).slice(0,15);
  const topGrps  = Object.entries(grpC).map(([g,c]) => ({ g, c, u: grpU[g].size })).sort((a,b) => b.c-a.c).slice(0,10);

  const hourly  = new Array(24).fill(0);
  const dow     = new Array(7).fill(0);
  const heatmap = Array.from({ length: 7 }, () => new Array(24).fill(0));
  rows.forEach(r => { hourly[r.dt.getHours()]++; dow[r.dt.getDay()]++; heatmap[r.dt.getDay()][r.dt.getHours()]++; });

  const uv = {};
  rows.forEach(r => { uv[r.uid] = (uv[r.uid]||0)+1; });
  const freqB = { '1': 0, '2-5': 0, '6-15': 0, '16-30': 0, '31+': 0 };
  const tiers = { Casual: 0, Regular: 0, Power: 0 };
  Object.values(uv).forEach(v => {
    if (v===1) freqB['1']++; else if (v<=5) freqB['2-5']++; else if (v<=15) freqB['6-15']++; else if (v<=30) freqB['16-30']++; else freqB['31+']++;
    if (v<=5) tiers.Casual++; else if (v<=20) tiers.Regular++; else tiers.Power++;
  });
  const visFreq = Object.entries(freqB).map(([l,c]) => ({ l, c }));

  const cohort   = buildCohort(rows, allLogs);
  const urlTrend = buildUrlTrend(rows);
  const urlCats  = {};
  rows.forEach(r => { const cat = utaCatOf(r.path); urlCats[cat] = (urlCats[cat]||0)+1; });
  const grpPref  = buildGrpPref(rows);
  const mom      = buildMoM(ts);
  const anomaly  = buildAnomaly(rows);
  const du = new Set(rows.map(r => r.uid)).size;
  const tv = rows.length;

  return { tv, du, avgV, avgU, ts, topUrls, topCos, topUsers, topGrps, hourly, dow, heatmap, visFreq, tiers, cohort, urlTrend, urlCats, grpPref, mom, anomaly };
}

function buildCohort(rows, allLogs = []) {
  const ufm = {};
  allLogs.forEach(r => { const m = r.dt.getFullYear()*100+r.dt.getMonth(); if (!ufm[r.uid]||m<ufm[r.uid]) ufm[r.uid]=m; });
  const months = [...new Set(Object.values(ufm))].sort();
  const cSets  = {};
  months.forEach(m => { cSets[m] = new Set(Object.keys(ufm).filter(uid => ufm[uid]===m)); });
  const uAct   = {};
  rows.forEach(r => { const m=r.dt.getFullYear()*100+r.dt.getMonth(); if(!uAct[r.uid]) uAct[r.uid]=new Set(); uAct[r.uid].add(m); });
  function addM(ym,d){ let y=Math.floor(ym/100),m=ym%100+d; while(m>11){m-=12;y++;} return y*100+m; }
  const res = [];
  months.slice(-6).forEach(cm => {
    const us = cSets[cm];
    const row = { cohort: `${Math.floor(cm/100)}-${String(cm%100+1).padStart(2,'0')}`, base: us.size, ret: [] };
    for (let d=0; d<6; d++) {
      if (d===0) { row.ret.push(100); continue; }
      const tm   = addM(cm,d);
      const kept = [...us].filter(uid => uAct[uid]&&uAct[uid].has(tm)).length;
      row.ret.push(us.size>0 ? Math.round(kept/us.size*100) : 0);
    }
    res.push(row);
  });
  return res;
}

function buildUrlTrend(rows) {
  const pc = {};
  rows.forEach(r => { pc[r.path]=(pc[r.path]||0)+1; });
  const top5 = Object.entries(pc).sort((a,b) => b[1]-a[1]).slice(0,5).map(([p]) => p);
  const ms   = [...new Set(rows.map(r => `${r.dt.getFullYear()}-${String(r.dt.getMonth()+1).padStart(2,'0')}`))].sort();
  const s    = {};
  top5.forEach(p => { s[p]={}; ms.forEach(m => s[p][m]=0); });
  rows.forEach(r => { const m=`${r.dt.getFullYear()}-${String(r.dt.getMonth()+1).padStart(2,'0')}`; if(s[r.path]) s[r.path][m]++; });
  return { paths: top5, months: ms, series: s };
}

function buildGrpPref(rows) {
  const gd={}, gu={};
  rows.forEach(r => {
    if (UTA_EXCL.includes(r.grp)) return;
    if (!gd[r.grp]) gd[r.grp]={};
    gd[r.grp][r.path]=(gd[r.grp][r.path]||0)+1;
    if (!gu[r.grp]) gu[r.grp]=new Set(); gu[r.grp].add(r.uid);
  });
  return Object.entries(gd).map(([g,ps]) => {
    const tp  = Object.entries(ps).sort((a,b)=>b[1]-a[1])[0];
    const tot = Object.values(ps).reduce((s,v)=>s+v,0);
    const u   = gu[g]?gu[g].size:1;
    return { g, top: tp[0], topV: tp[1], tot, avg: Math.round(tot/u*10)/10 };
  }).sort((a,b)=>b.tot-a.tot);
}

function buildMoM(ts) {
  const m={};
  ts.forEach(t => { const k=t.date.slice(0,7); m[k]=(m[k]||0)+t.v; });
  const s = Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0]));
  return s.map(([mo,v],i) => ({ mo, v, g: i>0?Math.round((v-s[i-1][1])/s[i-1][1]*1000)/10:null }));
}

function buildAnomaly(rows) {
  const d={};
  rows.forEach(r => { const k=r.dt.toISOString().slice(0,10); d[k]=(d[k]||0)+1; });
  const dates=Object.keys(d).sort(), vals=dates.map(x=>d[x]);
  const mean=vals.reduce((s,v)=>s+v,0)/vals.length||0;
  const std =Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0)/vals.length||0);
  return { dates, vals, mean: Math.round(mean*10)/10, std: Math.round(std*10)/10, upper: mean+2*std, lower: Math.max(0,mean-2*std) };
}

// canvas wrapper to auto-destroy/recreate chart
function ChartCanvas({ id, cfg, height = 340, style = {} }) {
  const ref = useRef(null);
  const inst = useRef(null);
  useEffect(() => {
    if (!ref.current || !cfg) return;
    if (inst.current) inst.current.destroy();
    inst.current = new Chart(ref.current.getContext('2d'), cfg);
    return () => { if (inst.current) { inst.current.destroy(); inst.current = null; } };
  }, [cfg]);
  return (
    <div className="uta__chart-box" style={{ height, ...style }}>
      <canvas ref={ref} id={id} />
    </div>
  );
}

// ─── FILTER CHIPS ────────────────────────────────────────────
const CHIP_LABELS = {
  companies:   v => `Company: ${v}`,
  emails:      v => `User: ${v.split('@')[0]}`,
  groups:      v => `Group: ${v}`,
  paths:       v => `URL: ${v}`,
  hours:       v => `Hour: ${String(v).padStart(2,'0')}:00`,
  dows:        v => `Day: ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][v]}`,
  cohortMonth: v => `Cohort: ${v}`,
  urlCategory: v => `Category: ${v}`,
  dateFilter:  v => `Date: ${v}`,
};

function FilterChipsBar({ F, onRemove }) {
  const chips = [];
  ['companies','emails','groups','paths','hours','dows'].forEach(key => {
    F[key].forEach(val => chips.push({ key, val, label: CHIP_LABELS[key](val) }));
  });
  if (F.cohortMonth) chips.push({ key: 'cohortMonth', val: F.cohortMonth, label: CHIP_LABELS.cohortMonth(F.cohortMonth) });
  if (F.urlCategory) chips.push({ key: 'urlCategory', val: F.urlCategory, label: CHIP_LABELS.urlCategory(F.urlCategory) });
  if (F.dateFilter)  chips.push({ key: 'dateFilter',  val: F.dateFilter,  label: CHIP_LABELS.dateFilter(F.dateFilter) });
  if (!chips.length) return <div className="uta__filter-chips-bar" />;
  return (
    <div className="uta__filter-chips-bar">
      {chips.map((c, i) => (
        <span key={i} className="uta__filter-chip" onClick={() => onRemove(c.key, c.val)}>
          <span>{c.label}</span>
          <span className="uta__chip-x" title="Remove">×</span>
        </span>
      ))}
    </div>
  );
}

// ─── CUSTOM SEARCHABLE MULTI-SELECT ──────────────────────────
function SearchableMultiSelect({ id, options, value, onChange, placeholder }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const containerRef      = useRef(null);
  const inputRef          = useRef(null);

  const filtered = useMemo(() =>
    query.trim() === ''
      ? options
      : options.filter(o => o.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = useCallback((opt) => {
    onChange(arrToggle(value, opt));
  }, [value, onChange]);

  const removeTag = useCallback((opt, e) => {
    e.stopPropagation();
    onChange(arrToggle(value, opt));
  }, [value, onChange]);

  const openDropdown = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div
      ref={containerRef}
      className="uta__sms-container"
      id={id}
    >
      {/* Trigger box */}
      <div
        className={`uta__sms-box${open ? ' uta__sms-box--open' : ''}`}
        onClick={openDropdown}
      >
        <div className="uta__sms-tags">
          {value.length === 0 && !open && (
            <span className="uta__sms-placeholder">{placeholder}</span>
          )}
          {value.map(v => (
            <span key={v} className="uta__sms-tag">
              {v}
              <span className="uta__sms-tag-x" onMouseDown={e => removeTag(v, e)}>×</span>
            </span>
          ))}
          {open && (
            <input
              ref={inputRef}
              className="uta__sms-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={value.length === 0 ? placeholder : 'Search…'}
              onKeyDown={e => {
                if (e.key === 'Escape') { setOpen(false); setQuery(''); }
                if (e.key === 'Enter' && filtered.length === 1) toggle(filtered[0]);
              }}
            />
          )}
        </div>
        <span className={`uta__sms-arrow${open ? ' uta__sms-arrow--up' : ''}`}>▾</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="uta__sms-dropdown">
          {filtered.length === 0 ? (
            <div className="uta__sms-empty">No results for "{query}"</div>
          ) : (
            filtered.map(opt => {
              const selected = value.includes(opt);
              return (
                <div
                  key={opt}
                  className={`uta__sms-option${selected ? ' uta__sms-option--selected' : ''}`}
                  onMouseDown={e => { e.preventDefault(); toggle(opt); }}
                >
                  <span className="uta__sms-check">{selected ? '✓' : ''}</span>
                  <span>{opt}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function UserTrafficAnalysis() {
  const initF = {
    start: null, end: null, interval: 'day',
    companies: [], emails: [], groups: [], paths: [],
    hours: [], dows: [],
    cohortMonth: null, urlCategory: null, dateFilter: null,
  };
  const [F, setF] = useState(initF);
  const [showDU, setShowDU] = useState(true);
  const [hmTip, setHmTip] = useState({ visible: false, text: '', x: 0, y: 0 });
  const genDate = useMemo(() => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), []);

  // ── API data state ───────────────────────────────────────────
  const [allLogs, setAllLogs]           = useState([]);
  const [filterOptions, setFilterOptions] = useState({ companies: [], emails: [], groups: [], paths: [] });
  const [loading, setLoading]           = useState(true);
  const [apiError, setApiError]         = useState(null);

  // Fetch all logs once on mount, then reuse for filtering client-side
  useEffect(() => {
    setLoading(true);
    setApiError(null);
    fetchDashboardData()
      .then(({ logs, filterOptions: opts }) => {
        setAllLogs(logs);
        setFilterOptions(opts);
        setLoading(false);
      })
      .catch(err => {
        setApiError(err.message || 'Failed to load data');
        setLoading(false);
      });
  }, []);

  const D = useMemo(() => compute(F, allLogs), [F, allLogs]);

  // ── filter helpers ──────────────────────────────────────────
  const update = useCallback(patch => setF(prev => ({ ...prev, ...patch })), []);

  const toggleArr = (key, val) =>
    setF(prev => ({ ...prev, [key]: arrToggle(prev[key], val) }));

  const removeFilter = (key, val) => {
    setF(prev => {
      if (Array.isArray(prev[key])) return { ...prev, [key]: arrToggle(prev[key], val) };
      return { ...prev, [key]: null };
    });
  };

  const clearAll = () => {
    setF({ ...initF });
  };

  // Stable onChange callbacks for SearchableMultiSelect
  const onCompaniesChange = useCallback(vals => update({ companies: vals }), [update]);
  const onEmailsChange    = useCallback(vals => update({ emails: vals }),    [update]);

  // ── KPIs ────────────────────────────────────────────────────
  const { tv, du, avgV, avgU, anomaly, topCos, topUrls, topGrps } = D;
  const il = capFirst(F.interval);
  const peakIdx   = anomaly.vals.length ? anomaly.vals.indexOf(Math.max(...anomaly.vals)) : -1;
  const peakCount = peakIdx >= 0 ? anomaly.vals[peakIdx] : 0;
  const peakDate  = peakIdx >= 0 ? anomaly.dates[peakIdx] : '—';
  const allDates  = D.ts.map(t => t.date);
  const dateRange = allDates.length >= 2 ? `${allDates[0]} → ${allDates[allDates.length-1]}` : '—';

  // active filter count
  const filterCount =
    F.companies.length + F.emails.length + F.groups.length + F.paths.length +
    F.hours.length + F.dows.length +
    (F.cohortMonth ? 1 : 0) + (F.urlCategory ? 1 : 0) + (F.dateFilter ? 1 : 0);

  // badge helpers
  const pathBadge  = F.paths.length   ? (F.paths.length > 1 ? `${F.paths.length} URLs` : F.paths[0]) : null;
  const groupBadge = F.groups.length  ? F.groups.join(', ') : null;
  const coBadge    = F.companies.length ? (F.companies.length > 1 ? `${F.companies.length} cos` : F.companies[0]) : null;
  const userBadge  = F.emails.length  ? `${F.emails.length} selected` : null;
  const hourBadge  = F.hours.length   ? F.hours.map(h => `${String(h).padStart(2,'0')}:00`).join(', ') : null;
  const dowBadge   = F.dows.length    ? F.dows.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ') : null;
  const hmBadge    = (F.hours.length || F.dows.length)
    ? `${F.hours.length ? F.hours.length+' hrs' : ''} ${F.dows.length ? F.dows.length+' days' : ''}`.trim()
    : null;

  // ── chart configs ────────────────────────────────────────────
  const tsCfg = useMemo(() => ({
    type: 'line',
    data: {
      labels: D.ts.map(t => t.date),
      datasets: [
        { label: 'Gross Volume', data: D.ts.map(t => t.v), borderColor: '#334155', backgroundColor: 'rgba(51,65,85,0.07)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: '#334155' },
        { label: 'Distinct Users', data: D.ts.map(t => t.u), borderColor: '#ea580c', backgroundColor: 'transparent', borderWidth: 2, borderDash: [5,4], tension: 0.3, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: '#ea580c', hidden: !showDU },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        tooltip: { ...tooltipStyle(), mode: 'index', intersect: false, callbacks: { title: ctx => `Period: ${ctx[0].label}` } },
        legend: { position: 'top', align: 'end', labels: { boxWidth: 12, usePointStyle: true, pointStyle: 'circle' } },
        datalabels: { display: false },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
        x: { grid: { display: false }, border: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 15 } },
      },
    },
  }), [D.ts, showDU]);

  const urlChartCfg = useMemo(() => {
    const labels = D.topUrls.map(u => u.p);
    const vals   = D.topUrls.map(u => u.c);
    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Visits', data: vals,
          backgroundColor:     labels.map(l => F.paths.includes(l) ? '#c2410c' : 'rgba(148,163,184,0.6)'),
          hoverBackgroundColor: labels.map(l => F.paths.includes(l) ? '#9a3412' : '#ea580c'),
          borderColor: 'transparent', borderRadius: 4, borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        layout: { padding: { right: 40 } },
        onClick: (e, _, chart) => {
          const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
          if (pts.length) toggleArr('paths', labels[pts[0].index]);
        },
        plugins: {
          tooltip: { ...tooltipStyle(), callbacks: { title: ctx => `Path: ${ctx[0].label}` } },
          legend: { display: false },
          datalabels: { color: '#475569', anchor: 'end', align: 'right', font: { weight: '700', size: 11 }, formatter: v => v.toLocaleString() },
        },
        scales: {
          x: { beginAtZero: true, grace: '15%', grid: { color: '#f1f5f9' }, border: { display: false } },
          y: { grid: { display: false }, border: { display: false } },
        },
      },
    };
  }, [D.topUrls, F.paths]);

  const groupChartCfg = useMemo(() => {
    const labels = D.topGrps.map(g => g.g);
    const vals   = D.topGrps.map(g => g.c);
    return {
      type: 'pie',
      data: {
        labels,
        datasets: [{ data: vals, backgroundColor: labels.map((l,i) => F.groups.includes(l) ? UTA_PRO[0] : UTA_PRO[i%UTA_PRO.length]), borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        onClick: (e, _, chart) => {
          const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
          if (pts.length) toggleArr('groups', labels[pts[0].index]);
        },
        plugins: {
          tooltip: { ...tooltipStyle() },
          legend: { position: 'right', labels: { boxWidth: 12, usePointStyle: true, pointStyle: 'circle', padding: 10 } },
          datalabels: { color: '#fff', font: { weight: '700', size: 12 }, formatter: v => v },
        },
      },
    };
  }, [D.topGrps, F.groups]);

  const compChartCfg = useMemo(() => {
    const labels = D.topCos.map(c => c.n);
    const vals   = D.topCos.map(c => c.c);
    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Visits', data: vals,
          backgroundColor:     labels.map(l => F.companies.includes(l) ? '#ea580c' : 'rgba(148,163,184,0.6)'),
          hoverBackgroundColor: labels.map(l => F.companies.includes(l) ? '#c2410c' : '#ea580c'),
          borderColor: 'transparent', borderRadius: 4, borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, layout: { padding: { top: 28 } },
        onClick: (e, _, chart) => {
          const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
          if (pts.length) toggleArr('companies', labels[pts[0].index]);
        },
        plugins: {
          tooltip: { ...tooltipStyle() }, legend: { display: false },
          datalabels: { color: '#475569', anchor: 'end', align: 'top', font: { weight: '700', size: 11 }, formatter: v => v.toLocaleString() },
        },
        scales: {
          y: { beginAtZero: true, grace: '15%', grid: { color: '#f1f5f9' }, border: { display: false } },
          x: { grid: { display: false }, border: { display: false } },
        },
      },
    };
  }, [D.topCos, F.companies]);

  const hourChartCfg = useMemo(() => {
    const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,'0')}:00`);
    const max    = Math.max(...D.hourly);
    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Visits', data: D.hourly,
          backgroundColor:     D.hourly.map((v,i) => F.hours.includes(i) ? '#c2410c' : `rgba(234,88,12,${0.12+0.88*v/max})`),
          hoverBackgroundColor: D.hourly.map((_,i) => F.hours.includes(i) ? '#9a3412' : '#c2410c'),
          borderRadius: 4, borderSkipped: false, borderColor: 'transparent',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        onClick: (e, _, chart) => {
          const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
          if (pts.length) toggleArr('hours', pts[0].index);
        },
        plugins: {
          tooltip: { ...tooltipStyle(), callbacks: { title: ctx => `Hour: ${ctx[0].label}` } },
          legend: { display: false }, datalabels: { display: false },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
          x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 12 } },
        },
      },
    };
  }, [D.hourly, F.hours]);

  const dowChartCfg = useMemo(() => {
    const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Visits', data: D.dow,
          backgroundColor:     labels.map((_,i) => F.dows.includes(i) ? '#c2410c' : UTA_PRO[i%UTA_PRO.length]),
          hoverBackgroundColor: labels.map((_,i) => F.dows.includes(i) ? '#9a3412' : '#ea580c'),
          borderRadius: 4, borderSkipped: false, borderColor: 'transparent',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, layout: { padding: { top: 28 } },
        onClick: (e, _, chart) => {
          const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
          if (pts.length) toggleArr('dows', pts[0].index);
        },
        plugins: {
          tooltip: { ...tooltipStyle() }, legend: { display: false },
          datalabels: { color: '#475569', anchor: 'end', align: 'top', font: { weight: '700', size: 11 }, formatter: v => v.toLocaleString() },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
          x: { grid: { display: false }, border: { display: false } },
        },
      },
    };
  }, [D.dow, F.dows]);

  const freqChartCfg = useMemo(() => ({
    type: 'bar',
    data: {
      labels: D.visFreq.map(f => f.l),
      datasets: [{
        label: '# Users', data: D.visFreq.map(f => f.c),
        backgroundColor: ['rgba(241,245,249,0.9)','rgba(253,186,116,0.9)','rgba(249,115,22,0.9)','rgba(234,88,12,0.9)','rgba(194,65,12,0.9)'],
        hoverBackgroundColor: ['#e2e8f0','#f97316','#ea580c','#c2410c','#9a3412'],
        borderRadius: 4, borderSkipped: false, borderColor: 'transparent',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, layout: { padding: { top: 28 } },
      plugins: {
        tooltip: { ...tooltipStyle() }, legend: { display: false },
        datalabels: { color: '#475569', anchor: 'end', align: 'top', font: { weight: '700', size: 11 }, formatter: v => v.toLocaleString() },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false }, title: { display: true, text: 'Users', font: { size: 10 }, color: '#94a3b8' } },
        x: { grid: { display: false }, border: { display: false }, title: { display: true, text: 'Visits Made', font: { size: 10 }, color: '#94a3b8' } },
      },
    },
  }), [D.visFreq]);

  const tierChartCfg = useMemo(() => ({
    type: 'doughnut',
    data: {
      labels: Object.keys(D.tiers),
      datasets: [{ data: Object.values(D.tiers), backgroundColor: ['rgba(203,213,225,0.9)','rgba(234,88,12,0.9)','rgba(51,65,85,0.9)'], borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: {
        tooltip: { ...tooltipStyle() },
        legend: { position: 'right', labels: { boxWidth: 12, usePointStyle: true, pointStyle: 'circle', padding: 12 } },
        datalabels: { color: '#fff', font: { weight: '700', size: 12 }, formatter: v => v, display: ctx => ctx.dataset.data[ctx.dataIndex] > 0 },
      },
    },
  }), [D.tiers]);

  const coShareCfg = useMemo(() => ({
    type: 'doughnut',
    data: {
      labels: D.topCos.map(c => c.n),
      datasets: [{ data: D.topCos.map(c => c.c), backgroundColor: D.topCos.map((c,i) => F.companies.includes(c.n) ? UTA_PRO[0] : UTA_PRO[i%UTA_PRO.length]), borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '55%',
      onClick: (e, _, chart) => {
        const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
        if (pts.length) toggleArr('companies', D.topCos[pts[0].index].n);
      },
      plugins: {
        tooltip: { ...tooltipStyle() },
        legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle', font: { size: 11 }, padding: 8 } },
        datalabels: { display: false },
      },
    },
  }), [D.topCos, F.companies]);

  const coVsUsersCfg = useMemo(() => ({
    type: 'bar',
    data: {
      labels: D.topCos.map(c => c.n),
      datasets: [
        { label: 'Total Visits', data: D.topCos.map(c => c.c), backgroundColor: D.topCos.map(c => F.companies.includes(c.n) ? 'rgba(234,88,12,0.85)' : 'rgba(148,163,184,0.6)'), hoverBackgroundColor: D.topCos.map(c => F.companies.includes(c.n) ? '#c2410c' : '#ea580c'), borderRadius: 4, borderSkipped: false, borderColor: 'transparent', order: 2 },
        { label: 'Unique Users', data: D.topCos.map(c => c.u), type: 'line', borderColor: '#334155', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#334155', pointBorderColor: '#fff', pointBorderWidth: 2, tension: 0.3, order: 1 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      onClick: (e, _, chart) => {
        const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
        if (pts.length) toggleArr('companies', D.topCos[pts[0].index].n);
      },
      plugins: {
        tooltip: { ...tooltipStyle(), mode: 'index', intersect: false },
        legend: { position: 'top', align: 'end', labels: { boxWidth: 12, usePointStyle: true, pointStyle: 'circle' } },
        datalabels: { display: false },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
        x: { grid: { display: false }, border: { display: false } },
      },
    },
  }), [D.topCos, F.companies]);

  const urlTrendCfg = useMemo(() => {
    const { paths, months, series } = D.urlTrend;
    const colors = ['#334155','#ea580c','#f97316','#94a3b8','#7c3aed'];
    return {
      type: 'line',
      data: {
        labels: months,
        datasets: paths.map((p,i) => ({
          label: p,
          data: months.map(m => series[p][m]||0),
          borderColor: F.paths.includes(p) ? '#c2410c' : (colors[i]||'#cbd5e1'),
          backgroundColor: 'transparent',
          borderWidth: F.paths.includes(p) ? 2.5 : 1.5,
          tension: 0.3, pointRadius: 3, pointHoverRadius: 6,
          pointBackgroundColor: F.paths.includes(p) ? '#c2410c' : colors[i],
          pointBorderColor: '#fff', pointBorderWidth: 1.5,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        onClick: (e, _, chart) => {
          const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
          if (pts.length) toggleArr('paths', paths[pts[0].datasetIndex]);
        },
        plugins: {
          tooltip: { ...tooltipStyle(), mode: 'index', intersect: false },
          legend: { position: 'top', align: 'end', labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } },
          datalabels: { display: false },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
          x: { grid: { display: false }, border: { display: false } },
        },
      },
    };
  }, [D.urlTrend, F.paths]);

  const urlCatCfg = useMemo(() => {
    const labels = Object.keys(D.urlCats), vals = Object.values(D.urlCats);
    return {
      type: 'pie',
      data: {
        labels,
        datasets: [{ data: vals, backgroundColor: labels.map((l,i) => F.urlCategory===l ? '#c2410c' : UTA_PRO[i%UTA_PRO.length]), borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        onClick: (e, _, chart) => {
          const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
          if (pts.length) setF(prev => ({ ...prev, urlCategory: setOrToggle(labels[pts[0].index], prev.urlCategory) }));
        },
        plugins: {
          tooltip: { ...tooltipStyle() },
          legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle', font: { size: 11 }, padding: 8 } },
          datalabels: { color: '#fff', font: { weight: '700', size: 11 }, formatter: v => v>0?v:'', display: ctx => ctx.dataset.data[ctx.dataIndex]>0 },
        },
      },
    };
  }, [D.urlCats, F.urlCategory]);

  const groupCmpCfg = useMemo(() => ({
    type: 'bar',
    data: {
      labels: D.topGrps.map(g => g.g),
      datasets: [
        { label: 'Total Visits',  data: D.topGrps.map(g => g.c), backgroundColor: D.topGrps.map(g => F.groups.includes(g.g) ? 'rgba(234,88,12,0.85)' : 'rgba(148,163,184,0.6)'), hoverBackgroundColor: D.topGrps.map(g => F.groups.includes(g.g) ? '#c2410c' : '#ea580c'), borderRadius: 4, borderSkipped: false, borderColor: 'transparent' },
        { label: 'Unique Users',  data: D.topGrps.map(g => g.u||0), backgroundColor: D.topGrps.map(g => F.groups.includes(g.g) ? 'rgba(194,65,12,0.85)' : 'rgba(100,116,139,0.4)'), hoverBackgroundColor: D.topGrps.map(g => F.groups.includes(g.g) ? '#9a3412' : '#334155'), borderRadius: 4, borderSkipped: false, borderColor: 'transparent' },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, layout: { padding: { top: 22 } },
      onClick: (e, _, chart) => {
        const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
        if (pts.length) toggleArr('groups', D.topGrps[pts[0].index].g);
      },
      plugins: {
        tooltip: { ...tooltipStyle(), mode: 'index', intersect: false },
        legend: { position: 'top', align: 'end', labels: { boxWidth: 12, usePointStyle: true, pointStyle: 'circle' } },
        datalabels: { display: false },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
        x: { grid: { display: false }, border: { display: false } },
      },
    },
  }), [D.topGrps, F.groups]);

  const momCfg = useMemo(() => {
    const g = D.mom.map(m => m.g);
    return {
      type: 'bar',
      data: {
        labels: D.mom.map(m => m.mo),
        datasets: [{
          label: 'MoM Growth %', data: g,
          backgroundColor: g.map(v => v===null ? 'rgba(226,232,240,0.8)' : v>=0 ? 'rgba(22,163,74,0.8)' : 'rgba(220,38,38,0.8)'),
          hoverBackgroundColor: g.map(v => v===null ? '#e2e8f0' : v>=0 ? '#15803d' : '#b91c1c'),
          borderRadius: 4, borderSkipped: false, borderColor: 'transparent',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, layout: { padding: { top: 28 } },
        plugins: {
          tooltip: { ...tooltipStyle(), callbacks: { label: ctx => ctx.raw===null ? '—' : `${ctx.raw}%` } },
          legend: { display: false },
          datalabels: { color: '#475569', anchor: 'end', align: 'top', font: { weight: '700', size: 10 }, formatter: v => v===null ? '' : v+'%' },
        },
        scales: {
          y: { grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { callback: v => v+'%' } },
          x: { grid: { display: false }, border: { display: false } },
        },
      },
    };
  }, [D.mom]);

  const anomalyCfg = useMemo(() => {
    const { dates, vals, mean, upper, lower } = D.anomaly;
    return {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          { label: 'Daily Visits', data: vals, borderColor: '#334155', backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: vals.map(v => v>upper||v<lower ? 4 : 0), pointBackgroundColor: vals.map(v => v>upper ? '#dc2626' : v<lower ? '#2563eb' : '#334155'), pointBorderColor: '#fff', pointBorderWidth: 1.5, tension: 0, order: 1 },
          { label: 'Upper (+2σ)',  data: dates.map(() => upper), borderColor: 'transparent', backgroundColor: 'rgba(234,88,12,0.06)', borderWidth: 0, fill: '+1', pointRadius: 0, tension: 0, order: 2 },
          { label: 'Lower (-2σ)', data: dates.map(() => Math.max(0,lower)), borderColor: 'transparent', backgroundColor: 'rgba(234,88,12,0.06)', borderWidth: 0, fill: false, pointRadius: 0, tension: 0, order: 3 },
          { label: 'Mean',        data: dates.map(() => mean), borderColor: '#ea580c', borderWidth: 1.5, borderDash: [5,4], backgroundColor: 'transparent', pointRadius: 0, tension: 0, order: 4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: {
          tooltip: { ...tooltipStyle(), mode: 'index', intersect: false },
          legend: { position: 'top', align: 'end', labels: { boxWidth: 12, usePointStyle: true, pointStyle: 'circle', filter: i => i.datasetIndex===0||i.datasetIndex===3 } },
          datalabels: { display: false },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
          x: { grid: { display: false }, border: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 18 } },
        },
      },
    };
  }, [D.anomaly]);

  // ── Heatmap ─────────────────────────────────────────────────
  const maxHm  = Math.max(...D.heatmap.flat());
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const hmCellBg = (val) => {
    if (!maxHm || val < 1) return '#f1f5f9';
    const t = val / maxHm;
    return `rgba(${Math.round(234-t*80)},${Math.round(88+t*20)},${Math.round(12+t*10)},${0.12+t*0.88})`;
  };

  // ── Cohort table ─────────────────────────────────────────────
  const CohortTable = () => {
    if (!D.cohort.length) return <p className="text-muted small p-2">Insufficient data for cohort analysis.</p>;
    return (
      <table className="table table-sm align-middle m-0 uta__interactive-table">
        <thead>
          <tr><th>Cohort</th><th>Base</th><th>M+0</th><th>M+1</th><th>M+2</th><th>M+3</th><th>M+4</th><th>M+5</th></tr>
        </thead>
        <tbody>
          {D.cohort.map(row => {
            const isSel = F.cohortMonth === row.cohort;
            return (
              <tr key={row.cohort}
                style={isSel ? { background: '#fff7ed' } : {}}
                onClick={() => setF(prev => ({ ...prev, cohortMonth: setOrToggle(row.cohort, prev.cohortMonth) }))}>
                <td className="fw-bold" style={{ whiteSpace: 'nowrap', fontFamily: "'Times New Roman',Times,serif", fontSize: '0.8rem', color: isSel ? '#c2410c' : undefined }}>{row.cohort}</td>
                <td><span className="uta__badge-m">{row.base}</span></td>
                {row.ret.map((pct, i) => {
                  const col = pct>=70?'#c2410c':pct>=40?'#ea580c':pct>=20?'#f97316':pct>0?'#fdba74':'#e2e8f0';
                  const tc  = pct>=40?'#fff':'#475569';
                  return <td key={i}><div className="uta__cohort-cell" style={{ background: col, color: tc }}>{pct}%</div></td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // ── Monthly outlier click helper ─────────────────────────────
  const handleMonthClick = (m) => {
    const [yr, mo] = m.mo.split('-').map(Number);
    const startD = new Date(yr, mo-1, 1);
    const endD   = new Date(yr, mo, 0);
    const isCur = F.start && F.start.toISOString().slice(0,7)===m.mo && F.end && F.end.toISOString().slice(0,7)===m.mo;
    if (isCur) setF(prev => ({ ...prev, start: null, end: null }));
    else setF(prev => ({ ...prev, start: startD, end: endD }));
  };

  const handleOutlierClick = (r) => {
    if (F.dateFilter === r.d) {
      setF(prev => ({ ...prev, dateFilter: null, start: null, end: null }));
    } else {
      const d = new Date(r.d);
      setF(prev => ({ ...prev, dateFilter: r.d, start: d, end: d }));
    }
  };

  // outlier data
  const { dates: aDates, vals: aVals, mean: aMean, upper: aUpper, lower: aLower } = D.anomaly;
  const allPts  = aDates.map((d,i) => ({ d, v: aVals[i], delta: aVals[i]-aMean }));
  const spikes  = allPts.filter(x => x.v > aUpper).sort((a,b) => b.v-a.v).slice(0,10);
  const drops   = allPts.filter(x => x.v < aLower).sort((a,b) => a.v-b.v).slice(0,10);

  // ── render ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="uta__container px-3 py-5 text-center">
        <div className="spinner-border text-secondary mb-3" role="status" style={{ width: '2rem', height: '2rem' }} />
        <div style={{ color: '#64748b', fontFamily: "'Times New Roman', Times, serif" }}>
          Loading traffic data…
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="uta__container px-3 py-5 text-center">
        <div style={{ color: '#dc2626', fontSize: '1rem', marginBottom: '0.5rem' }}>⚠ Failed to load data</div>
        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{apiError}</div>
        <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.5rem' }}>
          Make sure json-server is running: <code>npx json-server --watch db.json --port 3001</code>
        </div>
      </div>
    );
  }

  return (
    <div className="uta__container px-3 mb-5">

      {/* HEADER */}
      <div className="uta__dash-header d-flex justify-content-between align-items-end flex-wrap gap-3">
        <div>
          <div className="uta__dash-sub">Analytics Platform</div>
          <h2 className="uta__dash-title">User Traffic Analysis</h2>
          <div className="uta__dash-meta">
            <span>{dateRange}</span> &nbsp;·&nbsp; Generated: <span>{genDate}</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          {filterCount > 0 && (
            <div className="uta__filter-count-badge">{filterCount} active</div>
          )}
          <button className="uta__clear-btn" onClick={clearAll}>✕ Clear All</button>
        </div>
      </div>

      {/* FILTER CHIPS */}
      <FilterChipsBar F={F} onRemove={removeFilter} />

      {/* FILTERS + KPIs */}
      <div className="row g-3 mb-3">
        <div className="col-xl-7 col-lg-12">
          <div className="uta__panel uta__filter-panel h-100 m-0">
            <div className="uta__filter-label mb-3" style={{ fontSize: '0.65rem', letterSpacing: '2px', color: 'var(--uta-accent)' }}>▸ ACTIVE FILTERS</div>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="uta__filter-label">Start Date</label>
                <input type="date" className="form-control form-control-sm"
                  value={F.start ? F.start.toISOString().slice(0,10) : ''}
                  onChange={e => update({ start: e.target.value ? new Date(e.target.value) : null })} />
              </div>
              <div className="col-md-4">
                <label className="uta__filter-label">End Date</label>
                <input type="date" className="form-control form-control-sm"
                  value={F.end ? F.end.toISOString().slice(0,10) : ''}
                  onChange={e => update({ end: e.target.value ? new Date(e.target.value) : null })} />
              </div>
              <div className="col-md-4">
                <label className="uta__filter-label">Group By</label>
                <select className="form-select form-select-sm" value={F.interval}
                  onChange={e => update({ interval: e.target.value })}>
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>
              <div className="col-md-6 pt-1">
                <label className="uta__filter-label">Companies</label>
                <SearchableMultiSelect
                  id="uta-filterCompany"
                  options={filterOptions.companies}
                  value={F.companies}
                  onChange={onCompaniesChange}
                  placeholder="Search companies…"
                />
              </div>
              <div className="col-md-6 pt-1">
                <label className="uta__filter-label">User Emails</label>
                <SearchableMultiSelect
                  id="uta-filterUser"
                  options={filterOptions.emails}
                  value={F.emails}
                  onChange={onEmailsChange}
                  placeholder="Search emails…"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-5 col-lg-12">
          <div className="row g-3 h-100 align-content-start">
            <div className="col-4">
              <div className="uta__kpi-card uta__c-navy h-100">
                <div className="uta__kpi-title">Total Visits</div>
                <div className="uta__kpi-val">{tv.toLocaleString()}</div>
                <div className="uta__kpi-sub">all events</div>
                <div className="uta__kpi-icon">∑</div>
              </div>
            </div>
            <div className="col-4">
              <div className="uta__kpi-card uta__c-accent h-100">
                <div className="uta__kpi-title">Visits / <span>{il}</span></div>
                <div className="uta__kpi-val">{avgV.toLocaleString()}</div>
                <div className="uta__kpi-sub">avg rate</div>
                <div className="uta__kpi-icon">≈</div>
              </div>
            </div>
            <div className="col-4">
              <div className="uta__kpi-card uta__c-slate h-100">
                <div className="uta__kpi-title">Users / <span>{il}</span></div>
                <div className="uta__kpi-val">{avgU.toLocaleString()}</div>
                <div className="uta__kpi-sub">avg active</div>
                <div className="uta__kpi-icon">⊙</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXTENDED KPIs */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-2">
          <div className="uta__kpi-card uta__c-green">
            <div className="uta__kpi-title">Distinct Users</div>
            <div className="uta__kpi-val uta__kpi-val--sm">{du.toLocaleString()}</div>
            <div className="uta__kpi-sub">{tv > 0 ? `${Math.round(du/tv*100)}% of total` : '—'}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="uta__kpi-card uta__c-purple">
            <div className="uta__kpi-title">Visits / User</div>
            <div className="uta__kpi-val uta__kpi-val--sm">{du > 0 ? (Math.round(tv/du*10)/10).toLocaleString() : '—'}</div>
            <div className="uta__kpi-sub">avg engagement</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="uta__kpi-card uta__c-amber">
            <div className="uta__kpi-title">Peak Day</div>
            <div className="uta__kpi-val uta__kpi-val--sm">{peakCount.toLocaleString()}</div>
            <div className="uta__kpi-sub">{peakDate}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="uta__kpi-card uta__c-accent">
            <div className="uta__kpi-title">Top Company</div>
            <div className="uta__kpi-val uta__kpi-val--xs">{topCos[0]?.n || '—'}</div>
            <div className="uta__kpi-sub">{topCos[0] ? `${topCos[0].c.toLocaleString()} visits` : '—'}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="uta__kpi-card uta__c-navy">
            <div className="uta__kpi-title">Top URL</div>
            <div className="uta__kpi-val uta__kpi-val--xs" style={{ fontFamily: "'Times New Roman',Times,serif", fontSize: '0.82rem', marginTop: '4px' }}>{topUrls[0]?.p || '—'}</div>
            <div className="uta__kpi-sub">{topUrls[0] ? `${topUrls[0].c.toLocaleString()} visits` : '—'}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="uta__kpi-card uta__c-slate">
            <div className="uta__kpi-title">Active Groups</div>
            <div className="uta__kpi-val uta__kpi-val--sm">{topGrps.length}</div>
            <div className="uta__kpi-sub">user segments</div>
          </div>
        </div>
      </div>

      {/* TIME SERIES */}
      <div className="uta__panel">
        <div className="uta__chart-title-area">
          <div>
            <h3 className="uta__chart-title">Traffic History Over Time</h3>
            <div className="uta__chart-hint">Click &amp; drag to zoom · Double-click to reset</div>
          </div>
          <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
            <input className="form-check-input" type="checkbox" id="uta-toggleDU" checked={showDU}
              onChange={e => setShowDU(e.target.checked)}
              style={{ cursor: 'pointer', width: '36px', height: '20px' }} />
            <label className="form-check-label" htmlFor="uta-toggleDU" style={{ fontSize: '0.78rem', color: 'var(--uta-muted)', cursor: 'pointer' }}>Distinct Users</label>
          </div>
        </div>
        <ChartCanvas id="uta-tsChart" cfg={tsCfg} height={300} />
      </div>

      {/* TOP URLs + GROUPS */}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="uta__panel m-0 h-100">
            <div className="uta__chart-title-area">
              <div>
                <h3 className="uta__chart-title">Top Requested URLs {pathBadge && <span className="uta__f-badge">{pathBadge}</span>}</h3>
                <div className="uta__chart-hint">Click bar to filter by URL</div>
              </div>
            </div>
            <ChartCanvas id="uta-urlChart" cfg={urlChartCfg} />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="uta__panel m-0 h-100">
            <div className="uta__chart-title-area">
              <div>
                <h3 className="uta__chart-title">Activity by User Group {groupBadge && <span className="uta__f-badge">{groupBadge}</span>}</h3>
                <div className="uta__chart-hint">Click slice to filter by group</div>
              </div>
            </div>
            <ChartCanvas id="uta-groupChart" cfg={groupChartCfg} />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="uta__panel m-0 h-100">
            <div className="uta__chart-title-area">
              <div>
                <h3 className="uta__chart-title">Company Activity {coBadge && <span className="uta__f-badge">{coBadge}</span>}</h3>
                <div className="uta__chart-hint">Click bar to filter by company</div>
              </div>
            </div>
            <ChartCanvas id="uta-compChart" cfg={compChartCfg} />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="uta__panel m-0 h-100" style={{ paddingBottom: 0 }}>
            <div className="uta__chart-title-area">
              <div>
                <h3 className="uta__chart-title">User Activity Ledger {userBadge && <span className="uta__f-badge">{userBadge}</span>}</h3>
                <div className="uta__chart-hint">Click any row to filter by that user</div>
              </div>
            </div>
            <div className="uta__table-wrap" style={{ maxHeight: '380px' }}>
              <table className="table table-sm align-middle m-0 uta__interactive-table">
                <thead><tr><th>Name</th><th>Email</th><th className="text-end">Visits</th></tr></thead>
                <tbody>
                  {D.topUsers.map(u => (
                    <tr key={u.email}
                      className={F.emails.includes(u.email) ? 'uta__row-selected' : ''}
                      title="Click to filter by this user"
                      onClick={() => setF(prev => ({ ...prev, emails: arrToggle(prev.emails, u.email) }))}>
                      <td className="fw-bold" style={{ fontSize: '0.85rem' }}>{u.name||'—'}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--uta-muted)', fontFamily: "'Times New Roman',Times,serif" }}>{u.email}</td>
                      <td className="text-end"><span className="uta__badge-m">{u.v.toLocaleString()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* BEHAVIORAL */}
      <div className="uta__sec-label mt-4">Behavioral Analysis</div>
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="uta__panel m-0 h-100">
            <div className="uta__chart-title-area">
              <div>
                <h3 className="uta__chart-title">Visits by Hour {hourBadge && <span className="uta__f-badge">{hourBadge}</span>}</h3>
                <div className="uta__chart-hint">Click bar to filter by hour</div>
              </div>
            </div>
            <ChartCanvas id="uta-hourChart" cfg={hourChartCfg} height={240} />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="uta__panel m-0 h-100">
            <div className="uta__chart-title-area">
              <div>
                <h3 className="uta__chart-title">Visits by Day of Week {dowBadge && <span className="uta__f-badge">{dowBadge}</span>}</h3>
                <div className="uta__chart-hint">Click bar to filter by weekday</div>
              </div>
            </div>
            <ChartCanvas id="uta-dowChart" cfg={dowChartCfg} height={240} />
          </div>
        </div>

        {/* HEATMAP */}
        <div className="col-12">
          <div className="uta__panel m-0">
            <div className="uta__chart-title-area">
              <div>
                <h3 className="uta__chart-title">Activity Heatmap — Hour × Day {hmBadge && <span className="uta__f-badge">{hmBadge}</span>}</h3>
                <div className="uta__chart-hint">Click cell to filter by day + hour</div>
              </div>
            </div>
            <div className="uta__heatmap-section">
              <div style={{ paddingBottom: '8px', minWidth: 'min(100%,800px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ width: '40px' }} />
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="uta__heatmap-col-label">{h%3===0 ? String(h).padStart(2,'0') : ''}</div>
                  ))}
                </div>
                {D.heatmap.map((row, di) => (
                  <div key={di} style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="uta__heatmap-label">{days[di]}</div>
                    {row.map((val, hi) => {
                      const sel = F.hours.includes(hi) || F.dows.includes(di);
                      return (
                        <div key={hi}
                          className={`uta__heatmap-cell${sel ? ' uta__hm-selected' : ''}`}
                          style={{ backgroundColor: hmCellBg(val) }}
                          onMouseEnter={e => setHmTip({ visible: true, text: `${days[di]} ${String(hi).padStart(2,'0')}:00 — ${val} visits`, x: e.pageX+14, y: e.pageY-32 })}
                          onMouseMove={e  => setHmTip(t => ({ ...t, x: e.pageX+14, y: e.pageY-32 }))}
                          onMouseLeave={() => setHmTip(t => ({ ...t, visible: false }))}
                          onClick={() => setF(prev => ({ ...prev, hours: arrToggle(prev.hours, hi), dows: arrToggle(prev.dows, di) }))}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 mt-3">
              <span style={{ fontSize: '0.68rem', color: 'var(--uta-muted)', fontWeight: 600 }}>Low</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: 11 }, (_, i) => {
                  const t = i/10;
                  return <div key={i} style={{ width:'16px', height:'12px', borderRadius:'3px', background:`rgba(${Math.round(234-t*80)},${Math.round(88+t*20)},${Math.round(12+t*10)},${0.12+t*0.88})` }} />;
                })}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--uta-muted)', fontWeight: 600 }}>High</span>
            </div>
          </div>
        </div>
      </div>

      {/* ENGAGEMENT */}
      <div className="uta__sec-label mt-4">Engagement &amp; Retention</div>
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="uta__panel m-0 h-100">
            <div className="uta__chart-title-area">
              <div><h3 className="uta__chart-title">Visit Frequency Distribution</h3><div className="uta__chart-hint">How many visits each unique user made</div></div>
            </div>
            <ChartCanvas id="uta-freqChart" cfg={freqChartCfg} height={240} />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="uta__panel m-0 h-100">
            <div className="uta__chart-title-area">
              <div><h3 className="uta__chart-title">Engagement Tier Breakdown</h3><div className="uta__chart-hint">Casual ≤5 · Regular 6–20 · Power 21+</div></div>
            </div>
            <ChartCanvas id="uta-tierChart" cfg={tierChartCfg} height={240} />
          </div>
        </div>
        <div className="col-12">
          <div className="uta__panel m-0">
            <div className="uta__chart-title-area">
              <div><h3 className="uta__chart-title">Monthly Cohort Retention Matrix</h3><div className="uta__chart-hint">Click a cohort row to filter by that month's users</div></div>
            </div>
            <div className="uta__scroll-x"><CohortTable /></div>
          </div>
        </div>
      </div>

      {/* COMPANY INTELLIGENCE */}
      <div className="uta__sec-label mt-4">Company Intelligence</div>
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="uta__panel m-0 h-100">
            <div className="uta__chart-title-area"><div><h3 className="uta__chart-title">Traffic Share by Company</h3><div className="uta__chart-hint">Click slice to filter</div></div></div>
            <ChartCanvas id="uta-coShareChart" cfg={coShareCfg} height={280} />
          </div>
        </div>
        <div className="col-lg-8">
          <div className="uta__panel m-0 h-100">
            <div className="uta__chart-title-area"><div><h3 className="uta__chart-title">Company: Visits vs Unique Users</h3><div className="uta__chart-hint">Click bar to filter by company</div></div></div>
            <ChartCanvas id="uta-coVsUsersChart" cfg={coVsUsersCfg} height={280} />
          </div>
        </div>
        <div className="col-12">
          <div className="uta__panel m-0" style={{ paddingBottom: 0 }}>
            <div className="uta__chart-title-area"><div><h3 className="uta__chart-title">Company Performance Breakdown</h3><div className="uta__chart-hint">Click any row to filter by that company</div></div></div>
            <div className="uta__table-wrap" style={{ maxHeight: '280px' }}>
              <table className="table table-sm align-middle m-0 uta__interactive-table">
                <thead><tr><th>#</th><th>Company</th><th className="text-end">Visits</th><th className="text-end">Users</th><th className="text-end">V/U</th><th>Share</th></tr></thead>
                <tbody>
                  {D.topCos.map((c, i) => {
                    const share = tv > 0 ? Math.round(c.c/tv*1000)/10 : 0;
                    const vpu   = c.u > 0 ? Math.round(c.c/c.u*10)/10 : 0;
                    const bw    = D.topCos[0].c > 0 ? Math.round(c.c/D.topCos[0].c*100) : 0;
                    return (
                      <tr key={c.n}
                        className={F.companies.includes(c.n) ? 'uta__row-selected' : ''}
                        title="Click to filter by this company"
                        onClick={() => setF(prev => ({ ...prev, companies: arrToggle(prev.companies, c.n) }))}>
                        <td style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: "'Times New Roman',Times,serif" }}>{String(i+1).padStart(2,'0')}</td>
                        <td className="fw-bold">{c.n}</td>
                        <td className="text-end"><span className="uta__badge-m">{c.c.toLocaleString()}</span></td>
                        <td className="text-end" style={{ color: 'var(--uta-muted)' }}>{c.u}</td>
                        <td className="text-end" style={{ color: 'var(--uta-muted)' }}>{vpu}</td>
                        <td style={{ minWidth: '110px' }}>
                          <div className="d-flex align-items-center gap-2">
                            <div className="uta__progress flex-grow-1">
                              <div className="uta__progress-bar" style={{ width: `${bw}%`, background: '#ea580c' }} />
                            </div>
                            <small style={{ color: '#94a3b8', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>{share}%</small>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* URL INTELLIGENCE */}
      <div className="uta__sec-label mt-4">URL &amp; Path Intelligence</div>
      <div className="row g-3">
        <div className="col-12">
          <div className="uta__panel m-0">
            <div className="uta__chart-title-area"><div><h3 className="uta__chart-title">Top 5 URL Trends Over Time</h3><div className="uta__chart-hint">Click a legend label to filter by URL</div></div></div>
            <ChartCanvas id="uta-urlTrendChart" cfg={urlTrendCfg} height={280} />
          </div>
        </div>
        <div className="col-lg-5">
          <div className="uta__panel m-0 h-100">
            <div className="uta__chart-title-area"><div><h3 className="uta__chart-title">URL Category Distribution</h3><div className="uta__chart-hint">Click slice to filter by category</div></div></div>
            <ChartCanvas id="uta-urlCatChart" cfg={urlCatCfg} height={260} />
          </div>
        </div>
        <div className="col-lg-7">
          <div className="uta__panel m-0 h-100" style={{ paddingBottom: 0 }}>
            <div className="uta__chart-title-area"><div><h3 className="uta__chart-title">URL Access Detail</h3><div className="uta__chart-hint">Click any row to filter by that URL</div></div></div>
            <div className="uta__table-wrap" style={{ maxHeight: '300px' }}>
              <table className="table table-sm align-middle m-0 uta__interactive-table">
                <thead><tr><th>Path</th><th className="text-end">Visits</th><th className="text-end">Users</th><th>Share</th></tr></thead>
                <tbody>
                  {D.topUrls.map(u => {
                    const share = tv > 0 ? Math.round(u.c/tv*1000)/10 : 0;
                    const bw    = D.topUrls[0]?.c > 0 ? Math.round(u.c/D.topUrls[0].c*100) : 0;
                    return (
                      <tr key={u.p}
                        className={F.paths.includes(u.p) ? 'uta__row-selected' : ''}
                        title="Click to filter by this URL"
                        onClick={() => setF(prev => ({ ...prev, paths: arrToggle(prev.paths, u.p) }))}>
                        <td style={{ fontSize: '0.78rem', fontFamily: "'Times New Roman',Times,serif", color: 'var(--uta-accent)' }}>{u.p}</td>
                        <td className="text-end"><span className="uta__badge-m">{u.c.toLocaleString()}</span></td>
                        <td className="text-end" style={{ color: 'var(--uta-muted)' }}>{u.u}</td>
                        <td style={{ minWidth: '90px' }}>
                          <div className="d-flex align-items-center gap-1">
                            <div className="uta__progress flex-grow-1" style={{ height: '5px' }}>
                              <div className="uta__progress-bar" style={{ width: `${bw}%`, background: '#334155' }} />
                            </div>
                            <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{share}%</small>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* GROUP INTELLIGENCE */}
      <div className="uta__sec-label mt-4">User Group Intelligence</div>
      <div className="row g-3">
        <div className="col-lg-7">
          <div className="uta__panel m-0 h-100">
            <div className="uta__chart-title-area"><div><h3 className="uta__chart-title">Group Activity — Visits &amp; Users</h3><div className="uta__chart-hint">Click bar to filter by group</div></div></div>
            <ChartCanvas id="uta-groupCmpChart" cfg={groupCmpCfg} height={260} />
          </div>
        </div>
        <div className="col-lg-5">
          <div className="uta__panel m-0 h-100" style={{ paddingBottom: 0 }}>
            <div className="uta__chart-title-area"><div><h3 className="uta__chart-title">Group Top URL Preference</h3><div className="uta__chart-hint">Click row to filter by group</div></div></div>
            <div className="uta__table-wrap" style={{ maxHeight: '300px' }}>
              <table className="table table-sm align-middle m-0 uta__interactive-table">
                <thead><tr><th>Group</th><th>Top URL</th><th className="text-end">Visits</th><th className="text-end">Avg/User</th></tr></thead>
                <tbody>
                  {D.grpPref.map(g => (
                    <tr key={g.g}
                      className={F.groups.includes(g.g) ? 'uta__row-selected' : ''}
                      title="Click to filter by this group"
                      onClick={() => setF(prev => ({ ...prev, groups: arrToggle(prev.groups, g.g) }))}>
                      <td className="fw-bold" style={{ fontSize: '0.82rem' }}>{g.g}</td>
                      <td style={{ fontFamily: "'Times New Roman',Times,serif", fontSize: '0.72rem', color: 'var(--uta-accent)' }}>{g.top}</td>
                      <td className="text-end"><span className="uta__badge-m">{g.topV.toLocaleString()}</span></td>
                      <td className="text-end" style={{ color: 'var(--uta-muted)' }}>{g.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* TREND & GROWTH */}
      <div className="uta__sec-label mt-4">Trend &amp; Growth Analysis</div>
      <div className="row g-3">
        <div className="col-lg-8">
          <div className="uta__panel m-0 h-100">
            <div className="uta__chart-title-area"><div><h3 className="uta__chart-title">Month-over-Month Growth</h3></div></div>
            <ChartCanvas id="uta-momChart" cfg={momCfg} height={240} />
          </div>
        </div>
        <div className="col-lg-4">
          <div className="uta__panel m-0 h-100" style={{ paddingBottom: 0 }}>
            <div className="uta__chart-title-area"><div><h3 className="uta__chart-title">Monthly Summary</h3><div className="uta__chart-hint">Click row to filter by month</div></div></div>
            <div className="uta__table-wrap" style={{ maxHeight: '280px' }}>
              <table className="table table-sm align-middle m-0 uta__interactive-table">
                <thead><tr><th>Month</th><th className="text-end">Visits</th><th className="text-end">Δ%</th></tr></thead>
                <tbody>
                  {D.mom.map(m => {
                    const gc = m.g===null ? '#94a3b8' : m.g>=0 ? '#16a34a' : '#dc2626';
                    const isSel = F.start && F.end && F.start.toISOString().slice(0,7)===m.mo && F.end.toISOString().slice(0,7)===m.mo;
                    return (
                      <tr key={m.mo}
                        className={isSel ? 'uta__row-selected' : ''}
                        title="Click to filter by this month"
                        onClick={() => handleMonthClick(m)}>
                        <td style={{ fontFamily: "'Times New Roman',Times,serif", fontSize: '0.8rem' }}>{m.mo}</td>
                        <td className="text-end"><span className="uta__badge-m">{m.v.toLocaleString()}</span></td>
                        <td className="text-end fw-bold" style={{ color: gc, fontSize: '0.8rem' }}>
                          {m.g===null ? '—' : (m.g>0?'+':'')+m.g+'%'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ANOMALY */}
      <div className="uta__sec-label mt-4">Anomaly &amp; Outlier Detection</div>
      <div className="row g-3 mb-5">
        <div className="col-12">
          <div className="uta__panel m-0">
            <div className="uta__chart-title-area">
              <div>
                <h3 className="uta__chart-title">Daily Traffic with Anomaly Bands (±2σ)</h3>
                <div className="uta__chart-hint">
                  Shaded band = normal range · <span style={{ color: '#dc2626' }}>●</span> Spikes · <span style={{ color: '#2563eb' }}>●</span> Drops
                </div>
              </div>
            </div>
            <ChartCanvas id="uta-anomalyChart" cfg={anomalyCfg} height={280} />
          </div>
        </div>
        {[{ title: 'Top Spike Days', data: spikes }, { title: 'Top Drop Days', data: drops }].map(({ title, data }) => (
          <div key={title} className="col-lg-6">
            <div className="uta__panel m-0 h-100" style={{ paddingBottom: 0 }}>
              <div className="uta__chart-title-area"><div><h3 className="uta__chart-title">{title}</h3><div className="uta__chart-hint">Click row to filter by date</div></div></div>
              <div className="uta__table-wrap" style={{ maxHeight: '220px' }}>
                <table className="table table-sm align-middle m-0 uta__interactive-table">
                  <thead><tr><th>Date</th><th className="text-end">Visits</th><th className="text-end">vs Mean</th></tr></thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr><td colSpan={3} className="text-muted text-center py-2" style={{ fontSize: '0.8rem' }}>No outliers detected</td></tr>
                    ) : data.map(r => {
                      const col = r.delta > 0 ? '#dc2626' : '#2563eb';
                      return (
                        <tr key={r.d}
                          className={F.dateFilter===r.d ? 'uta__row-selected' : ''}
                          title="Click to filter by this date"
                          onClick={() => handleOutlierClick(r)}>
                          <td style={{ fontFamily: "'Times New Roman',Times,serif", fontSize: '0.8rem' }}>{r.d}</td>
                          <td className="text-end"><span className="uta__badge-m">{r.v}</span></td>
                          <td className="text-end fw-bold" style={{ color: col, fontSize: '0.8rem' }}>
                            {r.delta > 0 ? '+' : ''}{Math.round(r.delta)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* HEATMAP TOOLTIP */}
      {hmTip.visible && (
        <div style={{
          position: 'fixed',
          left: hmTip.x,
          top: hmTip.y,
          background: '#1e293b',
          color: '#fff',
          padding: '6px 12px',
          fontSize: '0.72rem',
          borderRadius: '6px',
          pointerEvents: 'none',
          zIndex: 9999,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {hmTip.text}
        </div>
      )}
    </div>
  );
}