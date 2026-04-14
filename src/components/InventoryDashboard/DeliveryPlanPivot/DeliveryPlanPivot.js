import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './deliveryplanpivot.css';

const DeliveryPlanPivot = ({ units }) => {
  const [expandedCities, setExpandedCities] = useState({});
  const [expandedProjects, setExpandedProjects] = useState({});
  const [activeYear, setActiveYear] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [yearsAnalysisMode, setYearsAnalysisMode] = useState(false);
  
  const [selectedPeriods, setSelectedPeriods] = useState([
    { year: null, months: [] },
    { year: null, months: [] }
  ]);
  
  const [visibleRows, setVisibleRows] = useState({
    cities: true,
    projects: true,
    unitTypes: true
  });

  const [visibleColumns, setVisibleColumns] = useState({
    percentage: true,
    noOfUnits: true,
    salesValue: true
  });

  const [showRowDropdown, setShowRowDropdown] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.column-toggle') && !event.target.closest('.row-toggle')) {
        setShowColumnDropdown(false);
        setShowRowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getYearMonth = (unit) => {
    if (!unit.contract_delivery_date) return null;
    const date = new Date(unit.contract_delivery_date);
    if (isNaN(date.getTime())) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      monthName: date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
    };
  };

  const deliveryData = useMemo(() => {
    const cityMap = {};
    const allYears = new Set();
    const contractedUnits = units.filter(u => u.status === 'Contracted');

    contractedUnits.forEach(unit => {
      const yearMonth = getYearMonth(unit);
      if (!yearMonth) return;

      const { year, month, monthName } = yearMonth;
      const city = unit.city || 'Unknown';
      const project = unit.project || 'Unknown';
      const unitType = unit.unit_type || 'Unknown';

      allYears.add(year);

      if (!cityMap[city]) {
        cityMap[city] = { name: city, yearData: {}, projects: {} };
      }
      if (!cityMap[city].yearData[year]) {
        cityMap[city].yearData[year] = { months: {}, total: 0, totalValue: 0 };
      }
      if (!cityMap[city].yearData[year].months[month]) {
        cityMap[city].yearData[year].months[month] = { monthName, monthNumber: month, count: 0, value: 0 };
      }

      cityMap[city].yearData[year].months[month].count++;
      cityMap[city].yearData[year].months[month].value += parseFloat(unit.sales_value) || 0;
      cityMap[city].yearData[year].total++;
      cityMap[city].yearData[year].totalValue += parseFloat(unit.sales_value) || 0;

      if (!cityMap[city].projects[project]) {
        cityMap[city].projects[project] = { name: project, yearData: {}, unitTypes: {} };
      }
      if (!cityMap[city].projects[project].yearData[year]) {
        cityMap[city].projects[project].yearData[year] = { months: {}, total: 0, totalValue: 0 };
      }
      if (!cityMap[city].projects[project].yearData[year].months[month]) {
        cityMap[city].projects[project].yearData[year].months[month] = { monthName, monthNumber: month, count: 0, value: 0 };
      }

      cityMap[city].projects[project].yearData[year].months[month].count++;
      cityMap[city].projects[project].yearData[year].months[month].value += parseFloat(unit.sales_value) || 0;
      cityMap[city].projects[project].yearData[year].total++;
      cityMap[city].projects[project].yearData[year].totalValue += parseFloat(unit.sales_value) || 0;

      if (!cityMap[city].projects[project].unitTypes[unitType]) {
        cityMap[city].projects[project].unitTypes[unitType] = { name: unitType, yearData: {} };
      }
      if (!cityMap[city].projects[project].unitTypes[unitType].yearData[year]) {
        cityMap[city].projects[project].unitTypes[unitType].yearData[year] = { months: {}, total: 0, totalValue: 0 };
      }
      if (!cityMap[city].projects[project].unitTypes[unitType].yearData[year].months[month]) {
        cityMap[city].projects[project].unitTypes[unitType].yearData[year].months[month] = { monthName, monthNumber: month, count: 0, value: 0 };
      }

      cityMap[city].projects[project].unitTypes[unitType].yearData[year].months[month].count++;
      cityMap[city].projects[project].unitTypes[unitType].yearData[year].months[month].value += parseFloat(unit.sales_value) || 0;
      cityMap[city].projects[project].unitTypes[unitType].yearData[year].total++;
      cityMap[city].projects[project].unitTypes[unitType].yearData[year].totalValue += parseFloat(unit.sales_value) || 0;
    });

    const years = Array.from(allYears).sort();

    return { cityData: Object.values(cityMap), years };
  }, [units]);

  // Set first year as active by default (separate effect to avoid stale closure in useMemo)
  useEffect(() => {
    if (deliveryData.years.length > 0 && activeYear === null && !comparisonMode) {
      setActiveYear(deliveryData.years[0]);
    }
  }, [deliveryData.years, activeYear, comparisonMode]);

  // Stable helper — depends only on deliveryData
  const getAvailableMonths = useCallback((year) => {
    if (!year) return [];
    const monthsSet = new Set();
    deliveryData.cityData.forEach(city => {
      const yearData = city.yearData[year];
      if (yearData) {
        Object.keys(yearData.months).forEach(month => monthsSet.add(parseInt(month)));
      }
    });
    return Array.from(monthsSet).sort((a, b) => a - b);
  }, [deliveryData]);

  // Get active year months (default mode)
  const activeYearMonths = useMemo(() => {
    if (!activeYear) return [];
    return getAvailableMonths(activeYear);
  }, [activeYear, getAvailableMonths]);

  // Get comparison periods (comparison mode)
  const comparisonPeriods = useMemo(() => {
    const periods = [];
    selectedPeriods.forEach(period => {
      if (period.year && period.months.length > 0) {
        period.months.forEach(month => {
          periods.push({ year: period.year, month: parseInt(month) });
        });
      }
    });
    return periods;
  }, [selectedPeriods]);

  const displayMonths = yearsAnalysisMode 
    ? deliveryData.years.map(year => ({ year, month: null, isYearTotal: true }))
    : comparisonMode 
      ? comparisonPeriods 
      : activeYearMonths.map(month => ({ year: activeYear, month }));

  const updatePeriodYear = (index, year) => {
    const newPeriods = [...selectedPeriods];
    newPeriods[index] = { year: year ? parseInt(year) : null, months: [] };
    setSelectedPeriods(newPeriods);
  };

  const toggleMonth = (index, month) => {
    const newPeriods = [...selectedPeriods];
    const months = newPeriods[index].months;
    if (months.includes(month)) {
      newPeriods[index].months = months.filter(m => m !== month);
    } else {
      newPeriods[index].months = [...months, month].sort((a, b) => a - b);
    }
    setSelectedPeriods(newPeriods);
  };

  const selectAllMonths = (index) => {
    if (!selectedPeriods[index].year) return;
    const allMonths = getAvailableMonths(selectedPeriods[index].year);
    const newPeriods = [...selectedPeriods];
    newPeriods[index].months = allMonths;
    setSelectedPeriods(newPeriods);
  };

  const addPeriod = () => {
    if (selectedPeriods.length < 6) {
      setSelectedPeriods([...selectedPeriods, { year: null, months: [] }]);
    }
  };

  const removePeriod = (index) => {
    if (selectedPeriods.length > 2) {
      setSelectedPeriods(selectedPeriods.filter((_, i) => i !== index));
    }
  };

  const enterComparisonMode = () => {
    setComparisonMode(true);
    setYearsAnalysisMode(false);
    setShowPeriodSelector(true);
  };

  const enterYearsAnalysisMode = () => {
    setYearsAnalysisMode(true);
    setComparisonMode(false);
    setShowPeriodSelector(false);
  };

  const resetToDefault = () => {
    setComparisonMode(false);
    setYearsAnalysisMode(false);
    setShowPeriodSelector(false);
    setSelectedPeriods([
      { year: null, months: [] },
      { year: null, months: [] }
    ]);
    if (deliveryData.years.length > 0) {
      setActiveYear(deliveryData.years[0]);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num) || num === 0) return '-';
    return Math.round(num).toLocaleString('en-US');
  };

  const formatPercentage = (count, total) => {
    if (!total || count === 0) return '-';
    return `${((count / total) * 100).toFixed(2)}%`;
  };

  const getMonthName = (monthNumber) => {
    const date = new Date(2000, monthNumber, 1);
    return date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  };

  const toggleCity = (cityName) => {
    setExpandedCities(prev => ({ 
      ...prev, 
      [cityName]: !prev[cityName] 
    }));
  };

  const toggleProject = (cityName, projectName) => {
    const key = `${cityName}-${projectName}`;
    setExpandedProjects(prev => ({ 
      ...prev, 
      [key]: !prev[key] 
    }));
  };

  const toggleRow = (rowKey) => setVisibleRows(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
  const toggleColumn = (columnKey) => setVisibleColumns(prev => ({ ...prev, [columnKey]: !prev[columnKey] }));

  const toggleRowDropdown = () => {
    setShowRowDropdown(prev => !prev);
    setShowColumnDropdown(false);
  };

  const toggleColumnDropdown = () => {
    setShowColumnDropdown(prev => !prev);
    setShowRowDropdown(false);
  };

  const toggleExpandCollapse = () => {
    const hasExpanded = Object.values(expandedCities).some(v => v === true) || 
                        Object.values(expandedProjects).some(v => v === true);
    
    if (hasExpanded) {
      setExpandedCities({});
      setExpandedProjects({});
    } else {
      const newCities = {}, newProjects = {};
      deliveryData.cityData.forEach(city => {
        newCities[city.name] = true;
        Object.keys(city.projects).forEach(projectName => {
          newProjects[`${city.name}-${projectName}`] = true;
        });
      });
      setExpandedCities(newCities);
      setExpandedProjects(newProjects);
    }
  };

  const isAnyExpanded = Object.values(expandedCities).some(v => v === true) || 
                        Object.values(expandedProjects).some(v => v === true);

  return (
    <div className="delivery-plan-container">
      {!comparisonMode && !yearsAnalysisMode && (
        <div className="year-tabs">
          {deliveryData.years.map(year => (
            <button
              key={year}
              className={`year-tab ${activeYear === year ? 'active' : ''}`}
              onClick={() => setActiveYear(year)}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {showPeriodSelector && comparisonMode && (
        <div className="period-selector-container">
          {selectedPeriods.map((period, index) => (
            <div key={index} className="period-selector-box">
              <div className="period-header">
                <span>Period {index + 1}</span>
                {selectedPeriods.length > 2 && (
                  <button 
                    className="remove-period-btn" 
                    onClick={() => removePeriod(index)}
                    title="Remove this period"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <select
                className="period-year-select"
                value={period.year || ''}
                onChange={(e) => updatePeriodYear(index, e.target.value)}
              >
                <option value="">Select Year</option>
                {deliveryData.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {period.year && (
                <div className="month-selection">
                  <div className="month-selection-header">
                    <span>Select Months:</span>
                    <button 
                      className="select-all-btn"
                      onClick={() => selectAllMonths(index)}
                    >
                      Select All
                    </button>
                  </div>
                  <div className="month-checkboxes">
                    {getAvailableMonths(period.year).map(month => (
                      <label key={month} className="month-checkbox-label">
                        <input
                          type="checkbox"
                          checked={period.months.includes(month)}
                          onChange={() => toggleMonth(index, month)}
                        />
                        {getMonthName(month)}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {selectedPeriods.length < 6 && (
            <div className="add-period-box">
              <button className="add-period-btn" onClick={addPeriod}>
                <span className="add-period-icon">+</span>
                <span className="add-period-text">Add Period</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="delivery-plan-controls">
        <div className="dropdown-controls">
          {!comparisonMode && !yearsAnalysisMode ? (
            <>
              <button className="control-btn select-periods-btn" onClick={enterComparisonMode}>
                📅 Select Periods
              </button>
              <button className="control-btn years-analysis-btn" onClick={enterYearsAnalysisMode}>
                📊 Years Analysis
              </button>
            </>
          ) : (
            <button className="control-btn reset-btn" onClick={resetToDefault}>
              ↺ Reset
            </button>
          )}

          <button className="control-btn" onClick={toggleExpandCollapse}>
            {isAnyExpanded ? '▼ Expand All' : '▶ Collapse All'}
          </button>

          <div className="row-toggle">
            <button className="control-btn" onClick={toggleRowDropdown}>
              📋 Rows/Fields {showRowDropdown ? '▲' : '▼'}
            </button>
            {showRowDropdown && (
              <div className="row-dropdown">
                <div className="dropdown-section">
                  <h4>Hierarchy Levels</h4>
                  <label>
                    <input type="checkbox" checked={visibleRows.cities} onChange={() => toggleRow('cities')} />
                    📍 Cities
                  </label>
                  <label>
                    <input type="checkbox" checked={visibleRows.projects} onChange={() => toggleRow('projects')} disabled={!visibleRows.cities} />
                    📁 Projects
                  </label>
                  <label>
                    <input type="checkbox" checked={visibleRows.unitTypes} onChange={() => toggleRow('unitTypes')} disabled={!visibleRows.projects} />
                    🏠 Unit Types
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="column-toggle">
            <button className="control-btn" onClick={toggleColumnDropdown}>
              ⚙️ Columns {showColumnDropdown ? '▲' : '▼'}
            </button>
            {showColumnDropdown && (
              <div className="column-dropdown">
                <div className="dropdown-section">
                  <h4>Data Fields</h4>
                  <label>
                    <input type="checkbox" checked={visibleColumns.percentage} onChange={() => toggleColumn('percentage')} />
                    %
                  </label>
                  <label>
                    <input type="checkbox" checked={visibleColumns.noOfUnits} onChange={() => toggleColumn('noOfUnits')} />
                    Units
                  </label>
                  <label>
                    <input type="checkbox" checked={visibleColumns.salesValue} onChange={() => toggleColumn('salesValue')} />
                    Total Sales 
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="delivery-plan-scroll">
        <table className="delivery-plan-table">
          <thead>
            <tr className="month-header-row">
              <th className="group-header-cell" rowSpan="2"></th>
              {displayMonths.map((period, index) => (
                <th 
                  key={`${period.year}-${period.month}-${index}`} 
                  className={`month-header ${index > 0 ? 'simple-separator' : ''}`}
                  colSpan={[visibleColumns.percentage, visibleColumns.noOfUnits, visibleColumns.salesValue].filter(Boolean).length}
                >
                  {period.isYearTotal ? period.year : `${getMonthName(period.month)} ${period.year}`}
                </th>
              ))}
            </tr>
            <tr className="column-header-row">
              {displayMonths.map((period, index) => (
                <React.Fragment key={`${period.year}-${period.month}-${index}`}>
                  {visibleColumns.percentage && <th className={`sub-header ${index > 0 ? 'simple-separator' : ''}`}>%</th>}
                  {visibleColumns.noOfUnits && <th className="sub-header">UNITS</th>}
                  {visibleColumns.salesValue && <th className="sub-header">TOTAL SALES</th>}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.cities && deliveryData.cityData.map(city => {
              const isCityExpanded = expandedCities[city.name] !== true;

              return (
                <React.Fragment key={city.name}>
                  <tr className="data-row level-0">
                    <td className="group-cell">
                      <button className="expand-btn" onClick={() => toggleCity(city.name)}>
                        {isCityExpanded ? '▼' : '▶'}
                      </button>
                      <span className="level-0-label">📍 {city.name}</span>
                    </td>
                    {displayMonths.map((period, periodIndex) => {
                      let count = 0, value = 0, total = 0;
                      
                      if (period.isYearTotal) {
                        const yearData = city.yearData[period.year];
                        if (yearData) {
                          total = yearData.total || 0;
                          value = yearData.totalValue || 0;
                          Object.values(yearData.months || {}).forEach(monthData => {
                            count += monthData.count || 0;
                          });
                        }
                      } else {
                        const yearData = city.yearData[period.year];
                        const monthData = yearData?.months[period.month];
                        count = monthData?.count || 0;
                        value = monthData?.value || 0;
                        total = yearData?.total || 0;
                      }

                      return (
                        <React.Fragment key={`${period.year}-${period.month}-${periodIndex}`}>
                          {visibleColumns.percentage && <td className={`metric-cell ${periodIndex > 0 ? 'simple-separator' : ''}`}>{formatPercentage(count, total)}</td>}
                          {visibleColumns.noOfUnits && <td className="metric-cell">{formatNumber(count)}</td>}
                          {visibleColumns.salesValue && <td className="metric-cell">{formatNumber(value)}</td>}
                        </React.Fragment>
                      );
                    })}
                  </tr>

                  {visibleRows.projects && isCityExpanded && Object.values(city.projects).map(project => {
                    const projectKey = `${city.name}-${project.name}`;
                    const isProjectExpanded = expandedProjects[projectKey];

                    return (
                      <React.Fragment key={projectKey}>
                        <tr className="data-row level-1">
                          <td className="group-cell" style={{ paddingLeft: '40px' }}>
                            <button className="expand-btn" onClick={() => toggleProject(city.name, project.name)}>
                              {isProjectExpanded ? '▼' : '▶'}
                            </button>
                            <span className="level-1-label">📁 {project.name}</span>
                          </td>
                          {displayMonths.map((period, periodIndex) => {
                            let count = 0, value = 0, total = 0;
                            
                            if (period.isYearTotal) {
                              const yearData = project.yearData[period.year];
                              if (yearData) {
                                total = yearData.total || 0;
                                value = yearData.totalValue || 0;
                                Object.values(yearData.months || {}).forEach(monthData => {
                                  count += monthData.count || 0;
                                });
                              }
                            } else {
                              const yearData = project.yearData[period.year];
                              const monthData = yearData?.months[period.month];
                              count = monthData?.count || 0;
                              value = monthData?.value || 0;
                              total = yearData?.total || 0;
                            }

                            return (
                              <React.Fragment key={`${period.year}-${period.month}-${periodIndex}`}>
                                {visibleColumns.percentage && <td className={`metric-cell ${periodIndex > 0 ? 'simple-separator' : ''}`}>{formatPercentage(count, total)}</td>}
                                {visibleColumns.noOfUnits && <td className="metric-cell">{formatNumber(count)}</td>}
                                {visibleColumns.salesValue && <td className="metric-cell">{formatNumber(value)}</td>}
                              </React.Fragment>
                            );
                          })}
                        </tr>

                        {visibleRows.unitTypes && isProjectExpanded && Object.values(project.unitTypes).map(unitType => {
                          return (
                            <tr key={unitType.name} className="data-row level-2">
                              <td className="group-cell" style={{ paddingLeft: '80px' }}>
                                <span className="level-2-label">🏠 {unitType.name}</span>
                              </td>
                              {displayMonths.map((period, periodIndex) => {
                                let count = 0, value = 0, total = 0;
                                
                                if (period.isYearTotal) {
                                  const yearData = unitType.yearData[period.year];
                                  if (yearData) {
                                    total = yearData.total || 0;
                                    value = yearData.totalValue || 0;
                                    Object.values(yearData.months || {}).forEach(monthData => {
                                      count += monthData.count || 0;
                                    });
                                  }
                                } else {
                                  const yearData = unitType.yearData[period.year];
                                  const monthData = yearData?.months[period.month];
                                  count = monthData?.count || 0;
                                  value = monthData?.value || 0;
                                  total = yearData?.total || 0;
                                }

                                return (
                                  <React.Fragment key={`${period.year}-${period.month}-${periodIndex}`}>
                                    {visibleColumns.percentage && <td className={`metric-cell ${periodIndex > 0 ? 'simple-separator' : ''}`}>{formatPercentage(count, total)}</td>}
                                    {visibleColumns.noOfUnits && <td className="metric-cell">{formatNumber(count)}</td>}
                                    {visibleColumns.salesValue && <td className="metric-cell">{formatNumber(value)}</td>}
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeliveryPlanPivot;