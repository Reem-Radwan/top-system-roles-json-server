import React, { useState, useEffect, useRef } from 'react';

// ✅ CHANGED: import from API service instead of mock data
import { getCompanyUnits } from '../../../services/inventorydashboardapi';

import FilterSection from '../FilterSection/FilterSection';
import KPISection from '../KpiSection/KpiSection';
import ChartsSection from '../ChartsSection/ChartsSection';
import UnitMetricsCharts from '../UnitMetricsCharts/Unitmetricscharts';
import DataTable from '../DataTable/DataTable';
import PivotTable from '../PivotTable';
import InvStatusPivot from '../Invstatuspivot';
import './dashboard.css';
import SalesProgressPivot from '../SalesProgressPivot/SalesProgressPivot';
import DeliveryPlanPivot from '../DeliveryPlanPivot/DeliveryPlanPivot';

const Dashboard = ({ companyId, companyName, onViewChange, currentView, onTabChange }) => {
  const [units, setUnits]                 = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);           // ✅ NEW: error state
  const [generatingPDF] = useState(false);

  const tabsContainerRef = useRef(null);

  const [filters, setFilters] = useState({
    projects: [], unitTypes: [], contractPaymentPlans: [],
    statuses: [], areas: [], cities: [], owners: [],
    salesDateRange:    { start: null, end: null },
    deliveryDateRange: { start: null, end: null },
  });

  const [numberRangeFilters, setNumberRangeFilters] = useState({
    grossAreaRange:         { min: 0, max: Infinity, active: false },
    interestFreePriceRange: { min: 0, max: Infinity, active: false },
    salesValueRange:        { min: 0, max: Infinity, active: false },
    psmRange:               { min: 0, max: Infinity, active: false },
  });

  const [availableOptions, setAvailableOptions] = useState({
    projects: [], unitTypes: [], contractPaymentPlans: [],
    statuses: [], areas: [], cities: [], owners: [],
  });
  const [allFilterOptions, setAllFilterOptions] = useState({
    projects: [], unitTypes: [], contractPaymentPlans: [],
    statuses: [], areas: [], cities: [], owners: [],
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768 && tabsContainerRef.current) {
        setTimeout(() => { tabsContainerRef.current.scrollLeft = tabsContainerRef.current.scrollWidth; }, 100);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { if (onViewChange) onViewChange(currentView); }, [currentView, onViewChange]);

  useEffect(() => { loadCompanyData(); }, [companyId]); // eslint-disable-line

  const loadCompanyData = async () => {
    setLoading(true);
    setError(null); // ✅ reset error on each load
    try {
      // ✅ CHANGED: real API call — same signature { units, company }
      const data = await getCompanyUnits(companyId);
      setUnits(data.units);

      const masterOptions = {
        projects:             [...new Set(data.units.map(u => u.project).filter(Boolean))],
        unitTypes:            [...new Set(data.units.map(u => u.unit_type).filter(Boolean))],
        contractPaymentPlans: [...new Set(data.units.map(u => u.adj_contract_payment_plan).filter(Boolean))],
        statuses:             [...new Set(data.units.map(u => u.status).filter(Boolean))],
        areas:                [...new Set(data.units.map(u => u.area_range).filter(Boolean))],
        cities:               [...new Set(data.units.map(u => u.city).filter(Boolean))],
        owners:               [...new Set(data.units.map(u => u.owner).filter(Boolean))],
      };

      setAllFilterOptions(masterOptions);
      setAvailableOptions(masterOptions);
      setFilters({
        projects: [], unitTypes: [], contractPaymentPlans: [],
        statuses: [], areas: [], cities: [], owners: [],
        salesDateRange:    { start: null, end: null },
        deliveryDateRange: { start: null, end: null },
      });
      setNumberRangeFilters({
        grossAreaRange:         { min: 0, max: Infinity, active: false },
        interestFreePriceRange: { min: 0, max: Infinity, active: false },
        salesValueRange:        { min: 0, max: Infinity, active: false },
        psmRange:               { min: 0, max: Infinity, active: false },
      });
      setLoading(false);
    } catch (err) {
      console.error("Failed to load company data:", err);
      // ✅ Show a user-friendly error instead of crashing
      setError("Failed to load data. Make sure JSON Server is running on port 3001.");
      setLoading(false);
    }
  };

  // ── Main filter pipeline ──────────────────────────────────────────────────────
  useEffect(() => {
    if (units.length === 0) return;

    const NUMBER_COL_MAP = {
      grossAreaRange:         'sellable_area',
      interestFreePriceRange: 'interest_free_unit_price',
      salesValueRange:        'sales_value',
      psmRange:               'psm',
    };

    const filtered = units.filter((u) => {
      if (filters.projects.length             && !filters.projects.includes(u.project))                              return false;
      if (filters.unitTypes.length            && !filters.unitTypes.includes(u.unit_type))                           return false;
      if (filters.contractPaymentPlans.length && !filters.contractPaymentPlans.includes(u.adj_contract_payment_plan)) return false;
      if (filters.statuses.length             && !filters.statuses.includes(u.status))                               return false;
      if (filters.areas.length                && !filters.areas.includes(u.area_range))                              return false;
      if (filters.cities.length               && !filters.cities.includes(u.city))                                   return false;
      if (filters.owners.length               && !filters.owners.includes(u.owner))                                  return false;

      for (const [rangeKey, range] of Object.entries(numberRangeFilters)) {
        if (!range.active) continue;
        const col = NUMBER_COL_MAP[rangeKey];
        const val = parseFloat(u[col]);
        if (!isNaN(val) && (val < range.min || val > range.max)) return false;
      }

      if (filters.salesDateRange.start || filters.salesDateRange.end) {
        if (!u.reservation_date) return false;
        const d = new Date(u.reservation_date);
        if (isNaN(d.getTime())) return false;
        if (filters.salesDateRange.start && d < filters.salesDateRange.start) return false;
        if (filters.salesDateRange.end   && d > filters.salesDateRange.end)   return false;
      }

      if (filters.deliveryDateRange.start || filters.deliveryDateRange.end) {
        if (!u.development_delivery_date) return false;
        const d = new Date(u.development_delivery_date);
        if (isNaN(d.getTime())) return false;
        if (filters.deliveryDateRange.start && d < filters.deliveryDateRange.start) return false;
        if (filters.deliveryDateRange.end   && d > filters.deliveryDateRange.end)   return false;
      }

      return true;
    });

    setFilteredUnits(filtered);

    const getAvailableOptionsForFilter = (filterType) => {
      const fieldMap = {
        projects: 'project', unitTypes: 'unit_type',
        contractPaymentPlans: 'adj_contract_payment_plan',
        statuses: 'status', areas: 'area_range', cities: 'city', owners: 'owner',
      };
      const relevantUnits = units.filter((u) => {
        if (filterType !== 'projects'             && filters.projects.length             && !filters.projects.includes(u.project))                              return false;
        if (filterType !== 'unitTypes'            && filters.unitTypes.length            && !filters.unitTypes.includes(u.unit_type))                           return false;
        if (filterType !== 'contractPaymentPlans' && filters.contractPaymentPlans.length && !filters.contractPaymentPlans.includes(u.adj_contract_payment_plan)) return false;
        if (filterType !== 'statuses'             && filters.statuses.length             && !filters.statuses.includes(u.status))                               return false;
        if (filterType !== 'areas'                && filters.areas.length                && !filters.areas.includes(u.area_range))                              return false;
        if (filterType !== 'cities'               && filters.cities.length               && !filters.cities.includes(u.city))                                   return false;
        if (filterType !== 'owners'               && filters.owners.length               && !filters.owners.includes(u.owner))                                  return false;
        return true;
      });
      const vals = [...new Set(relevantUnits.map(u => u[fieldMap[filterType]]).filter(Boolean))];
      return [...new Set([...vals, ...(filters[filterType] || [])])];
    };

    setAvailableOptions({
      projects:             getAvailableOptionsForFilter('projects'),
      unitTypes:            getAvailableOptionsForFilter('unitTypes'),
      contractPaymentPlans: getAvailableOptionsForFilter('contractPaymentPlans'),
      statuses:             getAvailableOptionsForFilter('statuses'),
      areas:                getAvailableOptionsForFilter('areas'),
      cities:               getAvailableOptionsForFilter('cities'),
      owners:               getAvailableOptionsForFilter('owners'),
    });
  }, [units, filters, numberRangeFilters]);

  const updateFilter      = (filterType, values) => setFilters(prev => ({ ...prev, [filterType]: values }));
  const updateDateRange   = (rangeType, start, end) => setFilters(prev => ({ ...prev, [rangeType]: { start, end } }));
  const updateNumberRange = (rangeKey, min, max, active) => setNumberRangeFilters(prev => ({ ...prev, [rangeKey]: { min, max, active } }));

  const RANGE_TO_COL = {
    grossAreaRange:         'sellable_area',
    interestFreePriceRange: 'interest_free_unit_price',
    salesValueRange:        'sales_value',
    psmRange:               'psm',
  };
  const activeFiltersForTable = {
    number: Object.fromEntries(
      Object.entries(numberRangeFilters)
        .filter(([, r]) => r.active)
        .map(([rk, r]) => [RANGE_TO_COL[rk], { min: r.min, max: r.max }])
    ),
    text: {
      project:   filters.projects,
      unit_type: filters.unitTypes,
      status:    filters.statuses,
    },
    date: {},
  };

  // ✅ Error state — shown instead of crashing
  if (error) {
    return (
      <div className="dashboard-loading">
        <p style={{ color: 'red', textAlign: 'center', padding: '40px' }}>
          ⚠️ {error}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner spinner-large" />
        <p className="loading-text">Loading {companyName} data...</p>
      </div>
    );
  }

  return (
    <>
      {generatingPDF && (
        <div className="dashboard-loading">
          <div className="spinner spinner-large" />
          <p className="loading-text">Generating PDF Report...</p>
        </div>
      )}

      <div className="dashboard-container">
        {currentView === 'home' && (
          <div className="home-view">
            <FilterSection
              filterOptions={allFilterOptions}
              availableOptions={availableOptions}
              filters={filters}
              onFilterChange={updateFilter}
            />
            <KPISection units={filteredUnits} />
            <ChartsSection
              units={filteredUnits}
              allUnits={units}
              filters={filters}
              onDateRangeChange={updateDateRange}
              onFilterChange={updateFilter}
            />
            <UnitMetricsCharts units={filteredUnits} />
            <DataTable
              units={filteredUnits}
              allUnits={units}
              onFilterChange={updateFilter}
              onDateRangeChange={updateDateRange}
              onNumberRangeChange={updateNumberRange}
              activeFilters={activeFiltersForTable}
            />
          </div>
        )}

        {currentView === 'project-data' && (
          <div className="project-data-view">
            <div className="pivot-section">
              <PivotTable units={filteredUnits} />
            </div>
          </div>
        )}

        {currentView === 'inv-status' && (
          <div className="inv-status-view">
            <InvStatusPivot units={filteredUnits} />
          </div>
        )}

        {currentView === 'sales-progress' && (
          <div className="sales-progress-view">
            <SalesProgressPivot units={filteredUnits} />
          </div>
        )}

        {currentView === 'delivery-plan' && (
          <div className="delivery-plan-view">
            <DeliveryPlanPivot units={filteredUnits} />
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;