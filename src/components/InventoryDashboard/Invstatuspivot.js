import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import './invstatuspivot.css';

// Moved outside component — static data, no need to redefine on every render
const statuses = [
  { key: 'available',  label: '📦 AVAILABLE',           theme: 'blue' },
  { key: 'unreleased', label: '🔒 UNRELEASED',          theme: 'blue' },
  { key: 'blocked',    label: '🚫 BLOCKED DEVELOPMENT', theme: 'blue' },
  { key: 'reserved',   label: '⏳ RESERVED',            theme: 'blue' },
  { key: 'hold',       label: '⏸️ HOLD',               theme: 'blue' },
  { key: 'partner',    label: '🤝 PARTNER',             theme: 'blue' },
  { key: 'contracted', label: '✅ CONTRACTED',          theme: 'gray' }
];

const getStatusKey = (unitStatus) => {
  const statusMap = {
    'Available': 'available',
    'Unreleased': 'unreleased',
    'Blocked Development': 'blocked',
    'Reserved': 'reserved',
    'Hold': 'hold',
    'Partner': 'partner',
    'Contracted': 'contracted'
  };
  return statusMap[unitStatus] || 'available';
};

const InvStatusPivot = ({ units }) => {
  const [expandedCities, setExpandedCities] = useState({});
  const [expandedProjects, setExpandedProjects] = useState({});
  const [expandedTypes, setExpandedTypes] = useState({});

  const [selectedStatuses, setSelectedStatuses] = useState(['available']);

  const [visibleColumns, setVisibleColumns] = useState({
    percentage: true,
    noOfUnits: true,
    salesValue: true
  });

  const [visibleRows, setVisibleRows] = useState({
    cities: true,
    projects: true,
    unitTypes: true
  });

  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [showRowDropdown, setShowRowDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const columnDropdownRef = useRef(null);
  const rowDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const pivotScrollRef = useRef(null);

  const getCurrentStatusTheme = () => {
    const first = selectedStatuses[0];
    const currentStatus = statuses.find(s => s.key === first);
    return currentStatus?.theme || 'blue';
  };

  // FIX 1: 'statuses' is now defined outside the component, so useMemo no longer
  // needs it as a dependency — the missing-dep warning is gone.
  const pivotData = useMemo(() => {
    const cityMap = {};

    units.forEach(unit => {
      const city = unit.city || 'Unknown';
      const project = unit.project || 'Unknown';
      const unitType = unit.unit_type || 'Unknown';
      const statusKey = getStatusKey(unit.status);

      if (!cityMap[city]) {
        cityMap[city] = { name: city, statusData: {}, projects: {}, totalUnits: 0 };
        statuses.forEach(s => { cityMap[city].statusData[s.key] = { count: 0, value: 0 }; });
      }
      cityMap[city].totalUnits++;
      cityMap[city].statusData[statusKey].count++;
      cityMap[city].statusData[statusKey].value += parseFloat(unit.sales_value) || 0;

      if (!cityMap[city].projects[project]) {
        cityMap[city].projects[project] = { name: project, statusData: {}, unitTypes: {}, totalUnits: 0 };
        statuses.forEach(s => { cityMap[city].projects[project].statusData[s.key] = { count: 0, value: 0 }; });
      }
      cityMap[city].projects[project].totalUnits++;
      cityMap[city].projects[project].statusData[statusKey].count++;
      cityMap[city].projects[project].statusData[statusKey].value += parseFloat(unit.sales_value) || 0;

      if (!cityMap[city].projects[project].unitTypes[unitType]) {
        cityMap[city].projects[project].unitTypes[unitType] = { name: unitType, statusData: {}, totalUnits: 0 };
        statuses.forEach(s => { cityMap[city].projects[project].unitTypes[unitType].statusData[s.key] = { count: 0, value: 0 }; });
      }
      cityMap[city].projects[project].unitTypes[unitType].totalUnits++;
      cityMap[city].projects[project].unitTypes[unitType].statusData[statusKey].count++;
      cityMap[city].projects[project].unitTypes[unitType].statusData[statusKey].value += parseFloat(unit.sales_value) || 0;
    });

    return Object.values(cityMap);
  }, [units]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target)) {
        setShowColumnDropdown(false);
      }
      if (rowDropdownRef.current && !rowDropdownRef.current.contains(event.target)) {
        setShowRowDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // FIX 2: Wrapped in useCallback so it has a stable reference and can be safely
  // listed as a dependency of the useEffect below.
  const collapseToProjectsOnly = useCallback(() => {
    const newExpandedCities = {};
    pivotData.forEach(city => { newExpandedCities[city.name] = true; });
    setExpandedCities(newExpandedCities);
    setExpandedProjects({});
    setExpandedTypes({});
  }, [pivotData]);

  useEffect(() => {
    if (pivotData.length > 0) {
      collapseToProjectsOnly();
    }
  }, [pivotData, collapseToProjectsOnly]); // FIX 2 (cont.): dependency added

  const formatNumber = (num) =>
    num === 0 ? '-' : num.toLocaleString('en-US', { maximumFractionDigits: 0 });

  const calculatePercentage = (count, total) => {
    if (total === 0 || count === 0) return '-';
    return `${((count / total) * 100).toFixed(2)}%`;
  };

  const toggleCity = (cityName) => {
    setExpandedCities(prev => ({ ...prev, [cityName]: !prev[cityName] }));
  };

  const toggleProject = (cityName, projectName) => {
    const key = `${cityName}-${projectName}`;
    setExpandedProjects(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // FIX 3: Removed unused 'toggleType' function entirely.

  const toggleColumn = (columnKey) =>
    setVisibleColumns(prev => ({ ...prev, [columnKey]: !prev[columnKey] }));

  const toggleRow = (rowKey) =>
    setVisibleRows(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));

  const toggleColumnDropdown = (e) => {
    e.stopPropagation();
    setShowColumnDropdown(prev => !prev);
    setShowRowDropdown(false);
    setShowStatusDropdown(false);
  };

  const toggleRowDropdown = (e) => {
    e.stopPropagation();
    setShowRowDropdown(prev => !prev);
    setShowColumnDropdown(false);
    setShowStatusDropdown(false);
  };

  const toggleStatusSelection = (statusKey) => {
    setSelectedStatuses(prev => {
      if (prev.includes(statusKey)) {
        if (prev.length <= 1) return prev;
        return prev.filter(s => s !== statusKey);
      }
      return [...prev, statusKey];
    });
  };

  const expandAll = () => {
    const newExpandedCities = {};
    const newExpandedProjects = {};
    const newExpandedTypes = {};

    pivotData.forEach(city => {
      newExpandedCities[city.name] = true;
      Object.keys(city.projects).forEach(projectName => {
        const projectKey = `${city.name}-${projectName}`;
        newExpandedProjects[projectKey] = true;
        const project = city.projects[projectName];
        Object.keys(project.unitTypes).forEach(typeName => {
          const typeKey = `${city.name}-${projectName}-${typeName}`;
          newExpandedTypes[typeKey] = true;
        });
      });
    });

    setExpandedCities(newExpandedCities);
    setExpandedProjects(newExpandedProjects);
    setExpandedTypes(newExpandedTypes);
  };

  const collapseAll = () => {
    setExpandedCities({});
    setExpandedProjects({});
    setExpandedTypes({});
  };

  const isEverythingExpanded = useMemo(() => {
    const allCitiesExpanded = pivotData.every(city => expandedCities[city.name]);

    let allProjectsExpanded = true;
    pivotData.forEach(city => {
      if (expandedCities[city.name]) {
        Object.keys(city.projects).forEach(projectName => {
          const projectKey = `${city.name}-${projectName}`;
          if (!expandedProjects[projectKey]) allProjectsExpanded = false;
        });
      }
    });

    let allTypesExpanded = true;
    pivotData.forEach(city => {
      if (expandedCities[city.name]) {
        Object.keys(city.projects).forEach(projectName => {
          const projectKey = `${city.name}-${projectName}`;
          if (expandedProjects[projectKey]) {
            const project = city.projects[projectName];
            Object.keys(project.unitTypes).forEach(typeName => {
              const typeKey = `${city.name}-${projectName}-${typeName}`;
              if (!expandedTypes[typeKey]) allTypesExpanded = false;
            });
          }
        });
      }
    });

    return allCitiesExpanded && allProjectsExpanded && allTypesExpanded;
  }, [pivotData, expandedCities, expandedProjects, expandedTypes]);

  const isEverythingCollapsed = useMemo(() => {
    const allCitiesCollapsed = pivotData.every(city => !expandedCities[city.name]);
    const allProjectsCollapsed = Object.keys(expandedProjects).length === 0;
    const allTypesCollapsed = Object.keys(expandedTypes).length === 0;
    return allCitiesCollapsed && allProjectsCollapsed && allTypesCollapsed;
  }, [pivotData, expandedCities, expandedProjects, expandedTypes]);

  const isDefaultState = useMemo(() => {
    const allCitiesExpanded = pivotData.every(city => expandedCities[city.name]);
    const allProjectsCollapsed = Object.keys(expandedProjects).length === 0;
    const allTypesCollapsed = Object.keys(expandedTypes).length === 0;
    return allCitiesExpanded && allProjectsCollapsed && allTypesCollapsed;
  }, [pivotData, expandedCities, expandedProjects, expandedTypes]);

  // FIX 4: Removed unused 'renderRow' helper function entirely.

  const currentTheme = getCurrentStatusTheme();

  return (
    <div className={`invstatus-unique-container invstatus-theme-${currentTheme}`}>
      {/* Status Tabs */}
      <div className="invstatus-tabs-container">
        <div className="invstatus-tabs-wrapper">
          <div className="invstatus-tabs-scroller">
            <div className="invstatus-category-toggle">
              {statuses.map(status => (
                <button
                  key={status.key}
                  className={`invstatus-category-btn ${
                    selectedStatuses.length === 1 && selectedStatuses[0] === status.key
                      ? 'invstatus-active'
                      : ''
                  }`}
                  onClick={() => setSelectedStatuses([status.key])}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="invstatus-controls invstatus-right-aligned">
        <div className="invstatus-controls-group">
          {isEverythingCollapsed ? (
            <button className="invstatus-control-btn" onClick={collapseToProjectsOnly}>
              ▼ Show Projects
            </button>
          ) : isDefaultState ? (
            <button className="invstatus-control-btn" onClick={expandAll}>
              ▼ Expand All
            </button>
          ) : isEverythingExpanded ? (
            <button className="invstatus-control-btn" onClick={collapseAll}>
              ◀ Collapse All
            </button>
          ) : (
            <button className="invstatus-control-btn" onClick={collapseAll}>
              ◀ Collapse All
            </button>
          )}

          <div className="invstatus-status-toggle" ref={statusDropdownRef}>
            <button
              className="invstatus-control-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusDropdown(prev => !prev);
                setShowColumnDropdown(false);
                setShowRowDropdown(false);
              }}
            >
              ⚙️ Status {showStatusDropdown ? '▲' : '▼'}
            </button>
            {showStatusDropdown && (
              <div className="invstatus-column-dropdown">
                <div className="invstatus-dropdown-section">
                  <h4>Statuses</h4>
                  {statuses.map(s => {
                    const checked = selectedStatuses.includes(s.key);
                    const disableUncheck = checked && selectedStatuses.length <= 1;
                    return (
                      <label className="invstatus-dropdown-label" key={s.key}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disableUncheck}
                          onChange={() => toggleStatusSelection(s.key)}
                        />
                        {s.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="invstatus-row-toggle" ref={rowDropdownRef}>
            <button className="invstatus-control-btn" onClick={toggleRowDropdown}>
              📋 Rows/Fields {showRowDropdown ? '▲' : '▼'}
            </button>
            {showRowDropdown && (
              <div className="invstatus-row-dropdown">
                <div className="invstatus-dropdown-section">
                  <h4>Hierarchy Levels</h4>
                  <label className="invstatus-dropdown-label">
                    <input type="checkbox" checked={visibleRows.cities} onChange={() => toggleRow('cities')} />
                    📍 Cities
                  </label>
                  <label className="invstatus-dropdown-label">
                    <input
                      type="checkbox"
                      checked={visibleRows.projects}
                      onChange={() => toggleRow('projects')}
                      disabled={!visibleRows.cities}
                    />
                    📁 Projects
                  </label>
                  <label className="invstatus-dropdown-label">
                    <input
                      type="checkbox"
                      checked={visibleRows.unitTypes}
                      onChange={() => toggleRow('unitTypes')}
                      disabled={!visibleRows.projects}
                    />
                    🏠 Unit Types
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="invstatus-column-toggle" ref={columnDropdownRef}>
            <button className="invstatus-control-btn" onClick={toggleColumnDropdown}>
              ⚙️ Columns {showColumnDropdown ? '▲' : '▼'}
            </button>
            {showColumnDropdown && (
              <div className="invstatus-column-dropdown">
                <div className="invstatus-dropdown-section">
                  <h4>Data Fields</h4>
                  {Object.keys(visibleColumns).map(key => (
                    <label className="invstatus-dropdown-label" key={key}>
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={() => toggleColumn(key)}
                      />
                      {key === 'percentage' ? '%' : key === 'noOfUnits' ? 'Units' : key === 'salesValue' ? 'Total Sales' : key}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pivot Table */}
      <div className="invstatus-table-scroll" ref={pivotScrollRef}>
        <div className="invstatus-table-wrapper">
          <table className={`invstatus-pivot-table ${selectedStatuses.length === 1 ? 'invstatus-single-layout' : ''}`}>
            <thead>
              <tr className="invstatus-header-row">
                <th className="invstatus-group-header"></th>
                {selectedStatuses.map(statusKey => {
                  const status = statuses.find(s => s.key === statusKey);
                  const label = status ? status.label : statusKey;

                  if (selectedStatuses.length > 1) {
                    const columnCount =
                      (visibleColumns.percentage ? 1 : 0) +
                      (visibleColumns.noOfUnits ? 1 : 0) +
                      (visibleColumns.salesValue ? 1 : 0);
                    return (
                      <th key={statusKey} colSpan={columnCount} className="invstatus-status-group-header">
                        {label}
                      </th>
                    );
                  }

                  return (
                    <React.Fragment key={statusKey}>
                      {visibleColumns.percentage && <th className="invstatus-metric-header">%</th>}
                      {visibleColumns.noOfUnits && <th className="invstatus-metric-header">UNITS</th>}
                      {visibleColumns.salesValue && <th className="invstatus-metric-header">TOTAL SALES</th>}
                    </React.Fragment>
                  );
                })}
              </tr>

              {selectedStatuses.length > 1 && (
                <tr className="invstatus-sub-header-row">
                  <th className="invstatus-group-header"></th>
                  {selectedStatuses.map(statusKey => (
                    <React.Fragment key={statusKey}>
                      {visibleColumns.percentage && <th className="invstatus-metric-header">%</th>}
                      {visibleColumns.noOfUnits && <th className="invstatus-metric-header">UNITS</th>}
                      {visibleColumns.salesValue && <th className="invstatus-metric-header">TOTAL SALES</th>}
                    </React.Fragment>
                  ))}
                </tr>
              )}
            </thead>

            <tbody>
              {visibleRows.cities &&
                pivotData.map(city => {
                  const isCityExpanded = expandedCities[city.name];
                  const cityHasExpandable = visibleRows.projects;

                  return (
                    <React.Fragment key={city.name}>
                      <tr className="invstatus-data-row invstatus-level-0">
                        <td className="invstatus-group-column" style={{ paddingLeft: '10px' }}>
                          {cityHasExpandable && (
                            <button
                              className="invstatus-expand-btn"
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleCity(city.name); }}
                            >
                              {isCityExpanded ? '▼' : '▶'}
                            </button>
                          )}
                          <span className="invstatus-level-0-label">📍 {city.name}</span>
                        </td>

                        {selectedStatuses.map((statusKey, index) => {
                          const data = city.statusData[statusKey] || { count: 0, value: 0 };
                          const percentage = calculatePercentage(data.count, city.totalUnits);
                          const isLastStatusGroup = index === selectedStatuses.length - 1;

                          return (
                            <React.Fragment key={statusKey}>
                              {visibleColumns.percentage && (
                                <td className={`invstatus-metric-cell ${isLastStatusGroup && !visibleColumns.salesValue ? 'invstatus-group-separator' : ''}`}>
                                  {percentage}
                                </td>
                              )}
                              {visibleColumns.noOfUnits && (
                                <td className={`invstatus-metric-cell ${isLastStatusGroup && !visibleColumns.salesValue ? 'invstatus-group-separator' : ''}`}>
                                  {formatNumber(data.count)}
                                </td>
                              )}
                              {visibleColumns.salesValue && (
                                <td className={`invstatus-metric-cell ${isLastStatusGroup ? 'invstatus-group-end' : 'invstatus-group-separator'}`}>
                                  {formatNumber(data.value)}
                                </td>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tr>

                      {visibleRows.projects &&
                        isCityExpanded &&
                        Object.values(city.projects).map(project => {
                          const projectKey = `${city.name}-${project.name}`;
                          const isProjectExpanded = expandedProjects[projectKey];
                          const projectHasExpandable = visibleRows.unitTypes;

                          return (
                            <React.Fragment key={projectKey}>
                              <tr className="invstatus-data-row invstatus-level-1">
                                <td className="invstatus-group-column" style={{ paddingLeft: '30px' }}>
                                  {projectHasExpandable && (
                                    <button
                                      className="invstatus-expand-btn"
                                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleProject(city.name, project.name); }}
                                    >
                                      {isProjectExpanded ? '▼' : '▶'}
                                    </button>
                                  )}
                                  <span className="invstatus-level-1-label">📁 {project.name}</span>
                                </td>

                                {selectedStatuses.map((statusKey, index) => {
                                  const data = project.statusData[statusKey] || { count: 0, value: 0 };
                                  const percentage = calculatePercentage(data.count, project.totalUnits);
                                  const isLastStatusGroup = index === selectedStatuses.length - 1;

                                  return (
                                    <React.Fragment key={statusKey}>
                                      {visibleColumns.percentage && (
                                        <td className={`invstatus-metric-cell ${isLastStatusGroup && !visibleColumns.salesValue ? 'invstatus-group-separator' : ''}`}>
                                          {percentage}
                                        </td>
                                      )}
                                      {visibleColumns.noOfUnits && (
                                        <td className={`invstatus-metric-cell ${isLastStatusGroup && !visibleColumns.salesValue ? 'invstatus-group-separator' : ''}`}>
                                          {formatNumber(data.count)}
                                        </td>
                                      )}
                                      {visibleColumns.salesValue && (
                                        <td className={`invstatus-metric-cell ${isLastStatusGroup ? 'invstatus-group-end' : 'invstatus-group-separator'}`}>
                                          {formatNumber(data.value)}
                                        </td>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </tr>

                              {visibleRows.unitTypes &&
                                isProjectExpanded &&
                                Object.values(project.unitTypes).map(unitType => {
                                  const typeKey = `${city.name}-${project.name}-${unitType.name}`;

                                  return (
                                    // FIX 5: Removed unused 'isTypeExpanded' variable.
                                    // Unit types are leaf nodes with no children to expand.
                                    <React.Fragment key={typeKey}>
                                      <tr className="invstatus-data-row invstatus-level-2">
                                        <td className="invstatus-group-column" style={{ paddingLeft: '50px' }}>
                                          <span className="invstatus-level-2-label">🏠 {unitType.name}</span>
                                        </td>

                                        {selectedStatuses.map((statusKey, index) => {
                                          const data = unitType.statusData[statusKey] || { count: 0, value: 0 };
                                          const percentage = calculatePercentage(data.count, unitType.totalUnits);
                                          const isLastStatusGroup = index === selectedStatuses.length - 1;

                                          return (
                                            <React.Fragment key={statusKey}>
                                              {visibleColumns.percentage && (
                                                <td className={`invstatus-metric-cell ${isLastStatusGroup && !visibleColumns.salesValue ? 'invstatus-group-separator' : ''}`}>
                                                  {percentage}
                                                </td>
                                              )}
                                              {visibleColumns.noOfUnits && (
                                                <td className={`invstatus-metric-cell ${isLastStatusGroup && !visibleColumns.salesValue ? 'invstatus-group-separator' : ''}`}>
                                                  {formatNumber(data.count)}
                                                </td>
                                              )}
                                              {visibleColumns.salesValue && (
                                                <td className={`invstatus-metric-cell ${isLastStatusGroup ? 'invstatus-group-end' : 'invstatus-group-separator'}`}>
                                                  {formatNumber(data.value)}
                                                </td>
                                              )}
                                            </React.Fragment>
                                          );
                                        })}
                                      </tr>
                                    </React.Fragment>
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
    </div>
  );
};

export default InvStatusPivot;