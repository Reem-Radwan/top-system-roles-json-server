// components/SalesPerformanceAnalysis.js
import React, { useState, useEffect, useCallback } from 'react';
import salesPerformanceService from '../../data/salesPerformanceService';
import Toast from './Toast';
import './salesPerformanceAnalysis.css';

/* ============================================================
   ALL PREMIUM TYPES (expanded from HTML: added back_view, levels)
   ============================================================ */
const ALL_PREMIUM_TYPES = [
  { key: 'main_view',       title: 'Main View' },
  { key: 'secondary_view',  title: 'Secondary View' },
  { key: 'back_view',       title: 'Back View' },
  { key: 'levels',          title: 'Levels' },
  { key: 'north_breeze',    title: 'North Breeze' },
  { key: 'corners',         title: 'Corners' },
  { key: 'accessibility',   title: 'Accessibility' },
];

const SalesPerformanceAnalysis = () => {
  // State management
  const [companies, setCompanies]               = useState([]);
  const [projects, setProjects]                 = useState([]);
  const [selectedCompany, setSelectedCompany]   = useState('');
  const [selectedProject, setSelectedProject]   = useState('');
  const [isRestrictedUser, setIsRestrictedUser] = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [darkMode, setDarkMode]                 = useState(false);

  // Analysis data
  const [priceRangeData, setPriceRangeData]   = useState(null);
  const [unitTypeData, setUnitTypeData]        = useState(null);
  const [unitModelData, setUnitModelData]      = useState(null);
  const [premiumData, setPremiumData]          = useState({});

  // Current view states
  const [currentAnalysisType, setCurrentAnalysisType] = useState('all');
  const [currentPremiumType,  setCurrentPremiumType]   = useState('all');

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Total units for percentage calculation (used in premium tables)
  const [priceRangeTotalUnits, setPriceRangeTotalUnits] = useState(0);

  // ─── Load companies on mount ───────────────────────────────
  const loadCompanies = useCallback(async () => {
    try {
      const response = await salesPerformanceService.getCompanies();
      if (response.success) {
        setCompanies(response.data);

        if (response.meta && response.meta.selectedCompanyId) {
          const autoCompanyId = response.meta.selectedCompanyId;
          setSelectedCompany(autoCompanyId);
          setIsRestrictedUser(true);

          if (response.meta.initialProjects && response.meta.initialProjects.length > 0) {
            setProjects(response.meta.initialProjects);
          } else {
            const projResponse = await salesPerformanceService.getCompanyProjects(autoCompanyId);
            if (projResponse.success) setProjects(projResponse.data);
          }
        } else {
          setIsRestrictedUser(false);
        }
      }
    } catch (error) {
      showToast('danger', 'Failed to load companies');
    }
  }, []);

  useEffect(() => {
    loadCompanies();
    window.scrollTo(0, 0);
    const savedDarkMode = localStorage.getItem('spa-dark-mode') === 'true';
    setDarkMode(savedDarkMode);
  }, [loadCompanies]);

  // ─── Apply dark mode ───────────────────────────────────────
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('spa-dark-mode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // ─── Auto-load when project changes ───────────────────────
  useEffect(() => {
    if (selectedProject) {
      loadAllData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  // ──────────────────────────────────────────────────────────
  // DATA LOADING
  // ──────────────────────────────────────────────────────────
  const handleCompanyChange = async (e) => {
    const companyId = e.target.value;
    setSelectedCompany(companyId);
    setSelectedProject('');
    setProjects([]);
    resetAnalysisData();

    if (companyId) {
      try {
        const response = await salesPerformanceService.getCompanyProjects(companyId);
        if (response.success) setProjects(response.data);
      } catch (error) {
        showToast('danger', 'Failed to load projects');
      }
    }
  };

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    if (!projectId) resetAnalysisData();
  };

  const loadAllData = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      await Promise.all([
        loadPriceRangeData(),
        loadUnitTypeData(),
        loadUnitModelData(),
        loadAllPremiumData(),
      ]);
      showToast('success', 'All data loaded successfully');
    } catch (error) {
      showToast('danger', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPriceRangeData = async () => {
    const response = await salesPerformanceService.getSalesAnalysisData(selectedProject);
    if (response.success) {
      setPriceRangeData(response.data);
      setPriceRangeTotalUnits(response.data.totals?.all || 0);
    }
  };

  const loadUnitTypeData = async () => {
    const response = await salesPerformanceService.getSalesAnalysisByUnitType(selectedProject);
    if (response.success) setUnitTypeData(response.data);
  };

  const loadUnitModelData = async () => {
    const response = await salesPerformanceService.getSalesAnalysisByUnitModel(selectedProject);
    if (response.success) setUnitModelData(response.data);
  };

  const loadAllPremiumData = async () => {
    const premiumResults = {};
    for (const { key } of ALL_PREMIUM_TYPES) {
      const response = await salesPerformanceService.getPremiumAnalysisData(selectedProject, key);
      if (response.success) premiumResults[key] = response.data;
    }
    setPremiumData(premiumResults);
  };

  const resetAnalysisData = () => {
    setPriceRangeData(null);
    setUnitTypeData(null);
    setUnitModelData(null);
    setPremiumData({});
    setCurrentAnalysisType('all');
    setCurrentPremiumType('all');
    setPriceRangeTotalUnits(0);
  };

  const handleReset = () => {
    setSelectedCompany('');
    setSelectedProject('');
    setProjects([]);
    resetAnalysisData();
  };

  // ──────────────────────────────────────────────────────────
  // DOWNLOAD (Excel)
  // ──────────────────────────────────────────────────────────
  const handleDownloadAll = async () => {
    if (!hasData) {
      showToast('warning', 'No data to download');
      return;
    }
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const projectName = projects.find(p => p.id.toString() === selectedProject)?.name || 'Project';
      const timestamp   = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      const addMeta = (ws) => {
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        const nextRow = range.e.r + 3;
        XLSX.utils.sheet_add_aoa(ws, [
          [],
          ['Generated on:', new Date().toLocaleString()],
          ['Project:', projectName],
        ], { origin: { r: nextRow, c: 0 } });
        return ws;
      };

      const makeSheet = (headers, rows, grandTotal) => {
        const data = [headers, ...rows];
        if (grandTotal) data.push(grandTotal);
        return addMeta(XLSX.utils.aoa_to_sheet(data));
      };

      // ── Price Range ──
      if (priceRangeData?.price_ranges) {
        const { price_ranges, totals } = priceRangeData;
        const headers = ['PRICE RANGE','ALL','BREAKDOWN','UNRELEASED','UNRELEASED %','RELEASED','RELEASED %','AVAILABLE','SOLD/BOOKED','SALES % FROM RELEASED','SALES % FROM TOTAL'];
        const rows = price_ranges.map(r => {
          const unrel = r.all - r.released;
          return [
            `${formatPriceEGP(r.from)} - ${formatPriceEGP(r.to)}`,
            r.all || '-',
            r.breakdown_percent > 0 ? r.breakdown_percent.toFixed(1) + '%' : '-',
            unrel || '-',
            r.all > 0 ? ((unrel / r.all) * 100).toFixed(1) + '%' : '-',
            r.released || '-',
            r.all > 0 ? ((r.released / r.all) * 100).toFixed(1) + '%' : '-',
            r.available || '-',
            r.sold_booked || '-',
            r.released > 0 ? ((r.sold_booked / r.released) * 100).toFixed(1) + '%' : '-',
            r.all > 0 ? ((r.sold_booked / r.all) * 100).toFixed(1) + '%' : '-',
          ];
        });
        const tUnrel = (totals.all || 0) - (totals.released || 0);
        const grandTotal = ['GRAND TOTAL', totals.all || '-', '100%', tUnrel || '-',
          totals.all > 0 ? ((tUnrel / totals.all) * 100).toFixed(1) + '%' : '-',
          totals.released || '-',
          totals.all > 0 ? ((totals.released / totals.all) * 100).toFixed(1) + '%' : '-',
          totals.available || '-', totals.sold_booked || '-',
          totals.released > 0 ? ((totals.sold_booked / totals.released) * 100).toFixed(1) + '%' : '-',
          totals.all > 0 ? ((totals.sold_booked / totals.all) * 100).toFixed(1) + '%' : '-',
        ];
        XLSX.utils.book_append_sheet(workbook, makeSheet(headers, rows, grandTotal), 'Price Range');
      }

      // ── Unit Type ──
      if (unitTypeData?.unit_types) {
        const { unit_types, totals } = unitTypeData;
        const headers = ['UNIT TYPE','ALL','BREAKDOWN','UNRELEASED','UNRELEASED %','RELEASED','RELEASED %','AVAILABLE','SOLD/BOOKED','SALES % FROM RELEASED','SALES % FROM TOTAL'];
        const rows = unit_types.map(t => {
          const unrel = t.all - t.released;
          return [
            t.unit_type || 'Not Specified',
            t.all || '-',
            t.breakdown_percent > 0 ? t.breakdown_percent.toFixed(1) + '%' : '-',
            unrel || '-',
            t.all > 0 ? ((unrel / t.all) * 100).toFixed(1) + '%' : '-',
            t.released || '-',
            t.all > 0 ? ((t.released / t.all) * 100).toFixed(1) + '%' : '-',
            t.available || '-', t.sold_booked || '-',
            t.released > 0 ? ((t.sold_booked / t.released) * 100).toFixed(1) + '%' : '-',
            t.all > 0 ? ((t.sold_booked / t.all) * 100).toFixed(1) + '%' : '-',
          ];
        });
        const tUnrel = (totals.all || 0) - (totals.released || 0);
        const grandTotal = ['GRAND TOTAL', totals.all || '-', '100%', tUnrel || '-',
          totals.all > 0 ? ((tUnrel / totals.all) * 100).toFixed(1) + '%' : '-',
          totals.released || '-',
          totals.all > 0 ? ((totals.released / totals.all) * 100).toFixed(1) + '%' : '-',
          totals.available || '-', totals.sold_booked || '-',
          totals.released > 0 ? ((totals.sold_booked / totals.released) * 100).toFixed(1) + '%' : '-',
          totals.all > 0 ? ((totals.sold_booked / totals.all) * 100).toFixed(1) + '%' : '-',
        ];
        XLSX.utils.book_append_sheet(workbook, makeSheet(headers, rows, grandTotal), 'Unit Type');
      }

      // ── Unit Model ──
      if (unitModelData?.unit_models) {
        const { unit_models, totals } = unitModelData;
        const headers = ['UNIT MODEL','ALL','BREAKDOWN','UNRELEASED','UNRELEASED %','RELEASED','RELEASED %','AVAILABLE','SOLD/BOOKED','SALES % FROM RELEASED','SALES % FROM TOTAL'];
        const rows = unit_models.map(m => {
          const unrel = m.all - m.released;
          return [
            m.unit_model || 'Not Specified',
            m.all || '-',
            m.breakdown_percent > 0 ? m.breakdown_percent.toFixed(1) + '%' : '-',
            unrel || '-',
            m.all > 0 ? ((unrel / m.all) * 100).toFixed(1) + '%' : '-',
            m.released || '-',
            m.all > 0 ? ((m.released / m.all) * 100).toFixed(1) + '%' : '-',
            m.available || '-', m.sold_booked || '-',
            m.released > 0 ? ((m.sold_booked / m.released) * 100).toFixed(1) + '%' : '-',
            m.all > 0 ? ((m.sold_booked / m.all) * 100).toFixed(1) + '%' : '-',
          ];
        });
        const tUnrel = (totals.all || 0) - (totals.released || 0);
        const grandTotal = ['GRAND TOTAL', totals.all || '-', '100%', tUnrel || '-',
          totals.all > 0 ? ((tUnrel / totals.all) * 100).toFixed(1) + '%' : '-',
          totals.released || '-',
          totals.all > 0 ? ((totals.released / totals.all) * 100).toFixed(1) + '%' : '-',
          totals.available || '-', totals.sold_booked || '-',
          totals.released > 0 ? ((totals.sold_booked / totals.released) * 100).toFixed(1) + '%' : '-',
          totals.all > 0 ? ((totals.sold_booked / totals.all) * 100).toFixed(1) + '%' : '-',
        ];
        XLSX.utils.book_append_sheet(workbook, makeSheet(headers, rows, grandTotal), 'Unit Model');
      }

      // ── Premium sheets ──
      ALL_PREMIUM_TYPES.forEach(({ key, title }) => {
        const currentData = premiumData[key];
        if (!currentData?.premium_groups) return;
        const { premium_groups, totals } = currentData;
        const headers = [title.toUpperCase(),'PREMIUM %','ALL','BREAKDOWN %','UNRELEASED','UNRELEASED %','RELEASED','RELEASED %','AVAILABLE','AVAILABLE %','SOLD/BOOKED','SOLD %','SALES % FROM RELEASED','SALES % FROM TOTAL'];
        const sorted = [...premium_groups].sort((a, b) => (a.premium_value || '').localeCompare(b.premium_value || ''));
        const rows = sorted.map(g => {
          const unrel    = g.all - g.released;
          const brkPct   = priceRangeTotalUnits > 0 ? ((g.all / priceRangeTotalUnits) * 100).toFixed(1) + '%' : '-';
          const unrelPct = g.all > 0 ? ((unrel / g.all) * 100).toFixed(1) + '%' : '-';
          const relPct   = g.all > 0 ? ((g.released / g.all) * 100).toFixed(1) + '%' : '-';
          const avlPct   = g.all > 0 ? ((g.available / g.all) * 100).toFixed(1) + '%' : '-';
          const sldPct   = g.all > 0 ? ((g.sold_booked / g.all) * 100).toFixed(1) + '%' : '-';
          const sfRel    = g.released > 0 ? ((g.sold_booked / g.released) * 100).toFixed(1) + '%' : '-';
          const sfTot    = g.all > 0 ? ((g.sold_booked / g.all) * 100).toFixed(1) + '%' : '-';
          const dispPrem = g.premium_percent > 0 ? (g.premium_percent * 100).toFixed(0) + '%' : '-';
          return [g.premium_value || 'Not Specified', dispPrem, g.all || '-', brkPct, unrel || '-', unrelPct, g.released || '-', relPct, g.available || '-', avlPct, g.sold_booked || '-', sldPct, sfRel, sfTot];
        });
        const tUnrel    = (totals.all || 0) - (totals.released || 0);
        const tBrkPct   = priceRangeTotalUnits > 0 ? ((totals.all / priceRangeTotalUnits) * 100).toFixed(1) + '%' : '-';
        const tUnrelPct = totals.all > 0 ? ((tUnrel / totals.all) * 100).toFixed(1) + '%' : '-';
        const tRelPct   = totals.all > 0 ? ((totals.released / totals.all) * 100).toFixed(1) + '%' : '-';
        const tAvlPct   = totals.all > 0 ? ((totals.available / totals.all) * 100).toFixed(1) + '%' : '-';
        const tSldPct   = totals.all > 0 ? ((totals.sold_booked / totals.all) * 100).toFixed(1) + '%' : '-';
        const tSfRel    = totals.released > 0 ? ((totals.sold_booked / totals.released) * 100).toFixed(1) + '%' : '-';
        const tSfTot    = totals.all > 0 ? ((totals.sold_booked / totals.all) * 100).toFixed(1) + '%' : '-';
        const grandTotal = ['GRAND TOTAL', '-', totals.all || '-', tBrkPct, tUnrel || '-', tUnrelPct, totals.released || '-', tRelPct, totals.available || '-', tAvlPct, totals.sold_booked || '-', tSldPct, tSfRel, tSfTot];
        XLSX.utils.book_append_sheet(workbook, makeSheet(headers, rows, grandTotal), title.substring(0, 31));
      });

      const filename = `Sales_Performance_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xlsx`;
      XLSX.writeFile(workbook, filename);
      showToast('success', 'Excel file downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      showToast('danger', 'Failed to download Excel file');
    }
  };

  // ──────────────────────────────────────────────────────────
  // NAVIGATION
  // ──────────────────────────────────────────────────────────
  const handleAnalysisTypeClick = (type) => {
    setCurrentAnalysisType(type);
    setTimeout(() => {
      document.getElementById('spa-analysis-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handlePremiumTypeClick = (type) => {
    setCurrentPremiumType(type);
    setTimeout(() => {
      document.getElementById('spa-premium-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // ──────────────────────────────────────────────────────────
  // TOASTS
  // ──────────────────────────────────────────────────────────
  const showToast = (type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ──────────────────────────────────────────────────────────
  // FORMATTERS
  // ──────────────────────────────────────────────────────────
  const formatPriceEGP = (price) => {
    if (price >= 1000000) return (price / 1000000).toFixed(2) + 'M EGP';
    if (price >= 1000)    return (price / 1000).toFixed(0) + 'K EGP';
    return price.toFixed(0) + ' EGP';
  };

  const formatPremiumType = (type) => {
    const mapping = {
      main_view: 'Main View', secondary_view: 'Secondary View', back_view: 'Back View',
      levels: 'Levels', north_breeze: 'North Breeze', corners: 'Corners', accessibility: 'Accessibility',
    };
    return mapping[type] || type;
  };

  // ──────────────────────────────────────────────────────────
  // PROGRESS CELL (shared helper)
  // ──────────────────────────────────────────────────────────
  const renderProgressCell = (pct, colorClass) => (
    <td className={`spa-tbl-progress-cell spa-tbl-highlight-${colorClass}`}>
      <div className="spa-tbl-progress-txt">
        {pct > 0 ? pct.toFixed(1) + '%' : '-'}
      </div>
      {pct > 0 && (
        <div className="spa-tbl-progress-bar">
          <div
            className={`spa-tbl-progress-fill spa-tbl-progress-${colorClass}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
    </td>
  );

  // ──────────────────────────────────────────────────────────
  // GRAND TOTAL ROW
  // isFirstTable = true  → adds orange top/bottom border (Price Range table only)
  // ──────────────────────────────────────────────────────────
  const renderGrandTotalRow = (totals, isFirstTable = false) => {
    const totalUnreleased        = (totals.all || 0) - (totals.released || 0);
    const totalUnreleasedPercent = totals.all > 0 ? (totalUnreleased / totals.all) * 100 : 0;
    const totalReleasedPercent   = totals.all > 0 ? (totals.released / totals.all) * 100 : 0;
    const totalSfRel             = totals.released > 0 ? (totals.sold_booked / totals.released) * 100 : 0;
    const totalSfTot             = totals.all > 0 ? (totals.sold_booked / totals.all) * 100 : 0;

    return (
      <tr className={`spa-tbl-grand-total${isFirstTable ? ' spa-tbl-grand-total-first' : ''}`}>
        <td className="spa-tbl-sticky-col spa-tbl-highlight-col">GRAND TOTAL</td>
        <td className="spa-tbl-highlight-col">{totals.all || '-'}</td>
        <td className="spa-tbl-group-end">100%</td>
        <td>{totalUnreleased || '-'}</td>
        <td className="spa-tbl-group-end">{totalUnreleasedPercent > 0 ? totalUnreleasedPercent.toFixed(1) + '%' : '-'}</td>
        <td>{totals.released || '-'}</td>
        <td className="spa-tbl-group-end">{totalReleasedPercent > 0 ? totalReleasedPercent.toFixed(1) + '%' : '-'}</td>
        <td>{totals.available || '-'}</td>
        <td className="spa-tbl-group-end">{totals.sold_booked || '-'}</td>
        {renderProgressCell(totalSfRel, 'gray')}
        {renderProgressCell(totalSfTot, 'orange')}
      </tr>
    );
  };

  // ──────────────────────────────────────────────────────────
  // STANDARD TABLE HEAD (shared by Price Range, Unit Type, Unit Model)
  // ──────────────────────────────────────────────────────────
  const renderStandardTableHead = (firstColLabel) => (
    <thead>
      <tr className="spa-tbl-head-main">
        <th rowSpan="2" className="spa-tbl-sticky-col spa-tbl-highlight-col">{firstColLabel}</th>
        <th colSpan="2" className="spa-tbl-head-primary spa-tbl-group-end">TOTAL UNITS</th>
        <th colSpan="2" className="spa-tbl-head-normal spa-tbl-group-end">UNRELEASED UNITS</th>
        <th colSpan="2" className="spa-tbl-head-normal spa-tbl-group-end">RELEASED UNITS</th>
        <th colSpan="2" className="spa-tbl-head-normal spa-tbl-group-end">CURRENT STATUS</th>
        <th colSpan="2" className="spa-tbl-head-orange">SALES PERFORMANCE</th>
      </tr>
      <tr className="spa-tbl-head-sub">
        <th className="spa-tbl-highlight-col">ALL</th>
        <th className="spa-tbl-group-end">BREAKDOWN</th>
        <th>UNRELEASED</th>
        <th className="spa-tbl-group-end">UNRELEASED %</th>
        <th>RELEASED</th>
        <th className="spa-tbl-group-end">RELEASED %</th>
        <th>AVAILABLE</th>
        <th className="spa-tbl-group-end">SOLD</th>
        <th className="spa-tbl-highlight-gray">SALES % FROM RELEASED</th>
        <th className="spa-tbl-highlight-orange">SALES % FROM TOTAL</th>
      </tr>
    </thead>
  );

  // ──────────────────────────────────────────────────────────
  // STANDARD TABLE ROW (shared helper)
  // ──────────────────────────────────────────────────────────
  const renderStandardRow = (label, item, index) => {
    const unreleased        = item.all - item.released;
    const unreleasedPercent = item.all > 0 ? (unreleased / item.all) * 100 : 0;
    const releasedPercent   = item.all > 0 ? (item.released / item.all) * 100 : 0;
    const sfRel             = item.released > 0 ? (item.sold_booked / item.released) * 100 : 0;
    const sfTot             = item.all > 0 ? (item.sold_booked / item.all) * 100 : 0;

    return (
      <tr key={index}>
        <td className="spa-tbl-sticky-col spa-tbl-txt-left spa-tbl-highlight-col">{label}</td>
        <td className="spa-tbl-highlight-col">{item.all || '-'}</td>
        <td className="spa-tbl-group-end">{item.breakdown_percent > 0 ? item.breakdown_percent.toFixed(1) + '%' : '-'}</td>
        <td>{unreleased || '-'}</td>
        <td className="spa-tbl-group-end">{unreleasedPercent > 0 ? unreleasedPercent.toFixed(1) + '%' : '-'}</td>
        <td>{item.released || '-'}</td>
        <td className="spa-tbl-group-end">{releasedPercent > 0 ? releasedPercent.toFixed(1) + '%' : '-'}</td>
        <td>{item.available || '-'}</td>
        <td className="spa-tbl-group-end">{item.sold_booked || '-'}</td>
        {renderProgressCell(sfRel, 'gray')}
        {renderProgressCell(sfTot, 'orange')}
      </tr>
    );
  };

  // ──────────────────────────────────────────────────────────
  // RENDER: PRICE RANGE TABLE  ← passes isFirstTable = true
  // ──────────────────────────────────────────────────────────
  const renderPriceRangeTable = () => {
    if (!priceRangeData?.price_ranges) return null;
    const { price_ranges, totals } = priceRangeData;
    return (
      <div className="spa-tbl-wrapper">
        <table className="spa-tbl">
          {renderStandardTableHead('PRICE RANGE')}
          <tbody>
            {price_ranges.map((range, i) =>
              renderStandardRow(`${formatPriceEGP(range.from)} - ${formatPriceEGP(range.to)}`, range, i)
            )}
            {renderGrandTotalRow(totals, true)}
          </tbody>
        </table>
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // RENDER: UNIT TYPE TABLE  ← isFirstTable = false (default)
  // ──────────────────────────────────────────────────────────
  const renderUnitTypeTable = () => {
    if (!unitTypeData?.unit_types) return null;
    const { unit_types, totals } = unitTypeData;
    return (
      <div className="spa-tbl-wrapper">
        <table className="spa-tbl">
          {renderStandardTableHead('UNIT TYPE')}
          <tbody>
            {unit_types.map((t, i) =>
              renderStandardRow(t.unit_type || 'Not Specified', t, i)
            )}
            {renderGrandTotalRow(totals, false)}
          </tbody>
        </table>
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // RENDER: UNIT MODEL TABLE  ← isFirstTable = false (default)
  // ──────────────────────────────────────────────────────────
  const renderUnitModelTable = () => {
    if (!unitModelData?.unit_models) return null;
    const { unit_models, totals } = unitModelData;
    return (
      <div className="spa-tbl-wrapper">
        <table className="spa-tbl">
          {renderStandardTableHead('UNIT MODEL')}
          <tbody>
            {unit_models.map((m, i) =>
              renderStandardRow(m.unit_model || 'Not Specified', m, i)
            )}
            {renderGrandTotalRow(totals, false)}
          </tbody>
        </table>
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // RENDER: PREMIUM TABLE
  // ──────────────────────────────────────────────────────────
  const renderPremiumTable = (premiumType) => {
    const currentData = premiumData[premiumType];
    if (!currentData?.premium_groups || currentData.premium_groups.length === 0) return null;
    const { premium_groups, totals } = currentData;

    const sorted = [...premium_groups].sort((a, b) =>
      (a.premium_value || '').localeCompare(b.premium_value || '')
    );

    const tUnrel    = (totals.all || 0) - (totals.released || 0);
    const tUnrelPct = totals.all > 0 ? (tUnrel / totals.all) * 100 : 0;
    const tRelPct   = totals.all > 0 ? (totals.released / totals.all) * 100 : 0;
    const tAvlPct   = totals.all > 0 ? (totals.available / totals.all) * 100 : 0;
    const tSldPct   = totals.all > 0 ? (totals.sold_booked / totals.all) * 100 : 0;
    const tSfRel    = totals.released > 0 ? (totals.sold_booked / totals.released) * 100 : 0;
    const tSfTot    = totals.all > 0 ? (totals.sold_booked / totals.all) * 100 : 0;
    const tBrkPct   = priceRangeTotalUnits > 0 ? (totals.all / priceRangeTotalUnits) * 100 : 0;

    return (
      <div className="spa-premium-tbl-container" key={premiumType}>
        <h4 className="spa-premium-tbl-title">
          <svg className="spa-premium-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
          {formatPremiumType(premiumType)}
        </h4>
        <div className="spa-tbl-wrapper">
          <table className="spa-tbl">
            <thead>
              <tr className="spa-tbl-head-main">
                <th rowSpan="2" className="spa-tbl-sticky-col spa-tbl-highlight-col">{formatPremiumType(premiumType).toUpperCase()}</th>
                <th rowSpan="2" className="spa-tbl-highlight-col spa-tbl-group-end">PREMIUM %</th>
                <th colSpan="2" className="spa-tbl-head-primary spa-tbl-group-end">TOTAL INVENTORY</th>
                <th colSpan="2" className="spa-tbl-head-normal spa-tbl-group-end">UNRELEASED</th>
                <th colSpan="2" className="spa-tbl-head-normal spa-tbl-group-end">RELEASED</th>
                <th colSpan="2" className="spa-tbl-head-normal spa-tbl-group-end">AVAILABLE</th>
                <th colSpan="2" className="spa-tbl-head-normal spa-tbl-group-end">SOLD</th>
                <th colSpan="2" className="spa-tbl-head-orange">SALES PERFORMANCE</th>
              </tr>
              <tr className="spa-tbl-head-sub">
                <th>#</th><th className="spa-tbl-group-end">%</th>
                <th>#</th><th className="spa-tbl-group-end">%</th>
                <th>#</th><th className="spa-tbl-group-end">%</th>
                <th>#</th><th className="spa-tbl-group-end">%</th>
                <th>#</th><th className="spa-tbl-group-end">%</th>
                <th className="spa-tbl-highlight-gray">SALES % (REL)</th>
                <th className="spa-tbl-highlight-orange">SALES % (TOT)</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((group, index) => {
                const unrel    = group.all - group.released;
                const unrelPct = group.all > 0 ? (unrel / group.all) * 100 : 0;
                const brkPct   = priceRangeTotalUnits > 0 ? (group.all / priceRangeTotalUnits) * 100 : 0;
                const relPct   = group.all > 0 ? (group.released / group.all) * 100 : 0;
                const avlPct   = group.all > 0 ? (group.available / group.all) * 100 : 0;
                const sldPct   = group.all > 0 ? (group.sold_booked / group.all) * 100 : 0;
                const sfRel    = group.released > 0 ? (group.sold_booked / group.released) * 100 : 0;
                const sfTot    = group.all > 0 ? (group.sold_booked / group.all) * 100 : 0;
                const dispPrem = group.premium_percent > 0 ? (group.premium_percent * 100).toFixed(0) + '%' : '-';
                return (
                  <tr key={index}>
                    <td className="spa-tbl-sticky-col spa-tbl-txt-left spa-tbl-highlight-col">{group.premium_value || 'Not Specified'}</td>
                    <td className="spa-tbl-highlight-col spa-tbl-group-end">{dispPrem}</td>
                    <td>{group.all || '-'}</td>
                    <td className="spa-tbl-group-end">{brkPct > 0 ? brkPct.toFixed(1) + '%' : '-'}</td>
                    <td>{unrel || '-'}</td>
                    <td className="spa-tbl-group-end">{unrelPct > 0 ? unrelPct.toFixed(1) + '%' : '-'}</td>
                    <td>{group.released || '-'}</td>
                    <td className="spa-tbl-group-end">{relPct > 0 ? relPct.toFixed(1) + '%' : '-'}</td>
                    <td>{group.available || '-'}</td>
                    <td className="spa-tbl-group-end">{avlPct > 0 ? avlPct.toFixed(1) + '%' : '-'}</td>
                    <td>{group.sold_booked || '-'}</td>
                    <td className="spa-tbl-group-end">{sldPct > 0 ? sldPct.toFixed(1) + '%' : '-'}</td>
                    {renderProgressCell(sfRel, 'gray')}
                    {renderProgressCell(sfTot, 'orange')}
                  </tr>
                );
              })}
              {/* Premium Grand Total Row — no orange border */}
              <tr className="spa-tbl-grand-total">
                <td className="spa-tbl-sticky-col spa-tbl-highlight-col">GRAND TOTAL</td>
                <td className="spa-tbl-highlight-col spa-tbl-group-end">-</td>
                <td>{totals.all || '-'}</td>
                <td className="spa-tbl-group-end">{tBrkPct > 0 ? tBrkPct.toFixed(1) + '%' : '-'}</td>
                <td>{tUnrel || '-'}</td>
                <td className="spa-tbl-group-end">{tUnrelPct > 0 ? tUnrelPct.toFixed(1) + '%' : '-'}</td>
                <td>{totals.released || '-'}</td>
                <td className="spa-tbl-group-end">{tRelPct > 0 ? tRelPct.toFixed(1) + '%' : '-'}</td>
                <td>{totals.available || '-'}</td>
                <td className="spa-tbl-group-end">{tAvlPct > 0 ? tAvlPct.toFixed(1) + '%' : '-'}</td>
                <td>{totals.sold_booked || '-'}</td>
                <td className="spa-tbl-group-end">{tSldPct > 0 ? tSldPct.toFixed(1) + '%' : '-'}</td>
                {renderProgressCell(tSfRel, 'gray')}
                {renderProgressCell(tSfTot, 'orange')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // DERIVED STATE
  // ──────────────────────────────────────────────────────────
  const hasData = priceRangeData || unitTypeData || unitModelData || Object.keys(premiumData).length > 0;

  const availablePremiumTypes = ALL_PREMIUM_TYPES.filter(({ key }) => {
    const d = premiumData[key];
    return d?.premium_groups?.length > 0;
  });

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────
  return (
    <div className="spa-main-container">
      {/* Toast Container */}
      <div className="spa-toast-wrapper">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <div className="spa-content-wrapper">
        {/* Header */}
        <div className="spa-dashboard-header">
          <h1 className="spa-header-title">
            <span style={{ fontSize: '1.75rem', filter: 'none', WebkitTextFillColor: 'initial' }}>📊</span>
            <span className="h1-color">Sales Performance Analysis</span>
          </h1>

          <div className="spa-header-center">
            {/* Company selector:
                Bound roles  (isRestrictedUser=true)  → disabled select, matches original {% else %} branch
                Unbound roles (Admin/Developer)        → interactive dropdown, matches original {% if not selected_company_id %} */}
            <div className="spa-selector-wrapper">
              <label className="spa-selector-label">
                {isRestrictedUser ? 'Company' : 'Select Company'}
              </label>
              <div className="spa-selector-container">
                {isRestrictedUser ? (
                  <select
                    className="spa-header-select"
                    value={selectedCompany}
                    onChange={() => {}}
                    disabled
                    style={{ backgroundColor: 'var(--spa-bg-tertiary)' }}
                  >
                    <option value={selectedCompany}>
                      {companies.find(c => c.id === selectedCompany)?.name || 'Loading...'}
                    </option>
                  </select>
                ) : (
                  <select
                    className="spa-header-select"
                    value={selectedCompany}
                    onChange={handleCompanyChange}
                  >
                    <option value="">Select Company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Project selector */}
            {(selectedCompany || isRestrictedUser) && (
              <div className="spa-selector-wrapper">
                <label className="spa-selector-label">Project</label>
                <div className="spa-selector-container">
                  <select
                    className="spa-header-select"
                    value={selectedProject}
                    onChange={handleProjectChange}
                  >
                    <option value="">Select Project</option>
                    {projects.length > 0 ? (
                      projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))
                    ) : (
                      <option value="" disabled>No projects found</option>
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="spa-header-right">
            {selectedProject && (
              <>
                <button className="spa-header-btn spa-btn-secondary" onClick={handleReset}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M14 8A6 6 0 1 1 8 2v4l3-3-3-3v4a6 6 0 0 0 0 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Reset
                </button>
                <button
                  className="spa-header-btn spa-btn-primary"
                  onClick={handleDownloadAll}
                  disabled={!hasData}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v8m0 0l3-3m-3 3L5 7m9 7H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Download All
                </button>
              </>
            )}
            <button
              className="spa-theme-toggle"
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div className="spa-theme-toggle-slider">
                {darkMode ? '🌙' : '☀️'}
              </div>
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="spa-loading">
            <div className="spa-loading-spinner"></div>
            <p className="spa-loading-text">Loading data...</p>
          </div>
        )}

        {/* Analysis Section */}
        {hasData && !loading && (
          <>
            {/* ── Sales Analysis ── */}
            <div id="spa-analysis-section" className="spa-section">
              <div className="spa-section-header">
                <h2 className="spa-section-title">
                  <svg className="spa-section-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <rect x="7" y="11" width="3" height="8" fill="currentColor"/>
                    <rect x="10.5" y="7" width="3" height="12" fill="currentColor"/>
                    <rect x="14" y="13" width="3" height="6" fill="currentColor"/>
                  </svg>
                  Sales Analysis
                </h2>
                <div className="spa-tab-buttons">
                  {[
                    { key: 'all',        label: 'All' },
                    { key: 'priceRange', label: 'Price Range' },
                    { key: 'unitType',   label: 'Unit Type' },
                    { key: 'unitModel',  label: 'Unit Model' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      className={`spa-tab-btn ${currentAnalysisType === key ? 'spa-tab-btn-active' : ''}`}
                      onClick={() => handleAnalysisTypeClick(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              {(currentAnalysisType === 'all' || currentAnalysisType === 'priceRange') && priceRangeData && (
                <div className="spa-table-section">
                  <h3 className="spa-table-title">Price Range</h3>
                  {renderPriceRangeTable()}
                </div>
              )}

              {/* Unit Type */}
              {(currentAnalysisType === 'all' || currentAnalysisType === 'unitType') && unitTypeData && (
                <div className="spa-table-section">
                  <h3 className="spa-table-title">Unit Type</h3>
                  {renderUnitTypeTable()}
                </div>
              )}

              {/* Unit Model */}
              {(currentAnalysisType === 'all' || currentAnalysisType === 'unitModel') && unitModelData && (
                <div className="spa-table-section">
                  <h3 className="spa-table-title">Unit Model</h3>
                  {renderUnitModelTable()}
                </div>
              )}
            </div>

            {/* ── Premium Analysis ── */}
            {availablePremiumTypes.length > 0 && (
              <div id="spa-premium-section" className="spa-section">
                <div className="spa-section-header">
                  <h2 className="spa-section-title">
                    <svg className="spa-section-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                    </svg>
                    Premium Analysis
                  </h2>
                  <div className="spa-tab-buttons">
                    <button
                      className={`spa-tab-btn ${currentPremiumType === 'all' ? 'spa-tab-btn-active' : ''}`}
                      onClick={() => handlePremiumTypeClick('all')}
                    >
                      All
                    </button>
                    {availablePremiumTypes.map(({ key, title }) => (
                      <button
                        key={key}
                        className={`spa-tab-btn ${currentPremiumType === key ? 'spa-tab-btn-active' : ''}`}
                        onClick={() => handlePremiumTypeClick(key)}
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="spa-premium-tables">
                  {currentPremiumType === 'all'
                    ? availablePremiumTypes.map(({ key }) => renderPremiumTable(key))
                    : renderPremiumTable(currentPremiumType)
                  }
                </div>
              </div>
            )}
          </>
        )}

        {/* No Data */}
        {!hasData && !loading && selectedProject && (
          <div className="spa-no-data">
            <p>No data available for this project</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesPerformanceAnalysis;
