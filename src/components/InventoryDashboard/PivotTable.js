import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import "./pivottable.css";


const PivotTable = ({ units }) => {
  const [expandedCities, setExpandedCities] = useState(() => {
    const initialExpanded = {};
    return initialExpanded;
  });

  const [expandedProjects, setExpandedProjects] = useState({});
  const [expandedTypes, setExpandedTypes] = useState({});

  const [visibleColumns, setVisibleColumns] = useState({
    percentage: true,
    noOfUnits: true,
    sellableArea: true,
    salesValue: true,
    minPSM: true,
    avgPSM: true,
    maxPSM: true,
    minUnitPrice: true,
    avgUnitPrice: true,
    maxUnitPrice: true,
  });

  const [visibleRows, setVisibleRows] = useState({
    cities: true,
    projects: true,
    unitTypes: true,
    areaRanges: true,
  });

  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [showRowDropdown, setShowRowDropdown] = useState(false);
  const [activeCategory, setActiveCategory] = useState("unsold");

  const columnDropdownRef = useRef(null);
  const rowDropdownRef = useRef(null);
  const pivotScrollRef = useRef(null);

  const pivotData = useMemo(() => {
    const cityMap = {};

    units.forEach((unit) => {
      const city = unit.city || "Unknown";
      const project = unit.project || "Unknown";
      const unitType = unit.unit_type || "Unknown";
      const areaRange = unit.area_range || "Unknown";
      const status = unit.status || "Unknown";

      const isSold = status === "Contracted" || status === "Reserved";
      const category = isSold ? "sold" : "unsold";

      if (!cityMap[city]) {
        cityMap[city] = {
          name: city,
          sold: { units: [], count: 0, totalArea: 0, totalValue: 0 },
          unsold: { units: [], count: 0, totalArea: 0, totalValue: 0 },
          projects: {},
        };
      }

      cityMap[city][category].units.push(unit);
      cityMap[city][category].count++;
      cityMap[city][category].totalArea += parseFloat(unit.sellable_area) || 0;
      cityMap[city][category].totalValue += parseFloat(unit.sales_value) || 0;

      if (!cityMap[city].projects[project]) {
        cityMap[city].projects[project] = {
          name: project,
          sold: { units: [], count: 0, totalArea: 0, totalValue: 0 },
          unsold: { units: [], count: 0, totalArea: 0, totalValue: 0 },
          unitTypes: {},
        };
      }

      cityMap[city].projects[project][category].units.push(unit);
      cityMap[city].projects[project][category].count++;
      cityMap[city].projects[project][category].totalArea += parseFloat(unit.sellable_area) || 0;
      cityMap[city].projects[project][category].totalValue += parseFloat(unit.sales_value) || 0;

      if (!cityMap[city].projects[project].unitTypes[unitType]) {
        cityMap[city].projects[project].unitTypes[unitType] = {
          name: unitType,
          sold: { units: [], count: 0, totalArea: 0, totalValue: 0 },
          unsold: { units: [], count: 0, totalArea: 0, totalValue: 0 },
          areaRanges: {},
        };
      }

      cityMap[city].projects[project].unitTypes[unitType][category].units.push(unit);
      cityMap[city].projects[project].unitTypes[unitType][category].count++;
      cityMap[city].projects[project].unitTypes[unitType][category].totalArea += parseFloat(unit.sellable_area) || 0;
      cityMap[city].projects[project].unitTypes[unitType][category].totalValue += parseFloat(unit.sales_value) || 0;

      if (!cityMap[city].projects[project].unitTypes[unitType].areaRanges[areaRange]) {
        cityMap[city].projects[project].unitTypes[unitType].areaRanges[areaRange] = {
          name: areaRange,
          sold: { units: [], count: 0, totalArea: 0, totalValue: 0 },
          unsold: { units: [], count: 0, totalArea: 0, totalValue: 0 },
        };
      }

      const areaData = cityMap[city].projects[project].unitTypes[unitType].areaRanges[areaRange];
      areaData[category].units.push(unit);
      areaData[category].count++;
      areaData[category].totalArea += parseFloat(unit.sellable_area) || 0;
      areaData[category].totalValue += parseFloat(unit.sales_value) || 0;
    });

    return Object.values(cityMap);
  }, [units]);

  useEffect(() => {
    const initialExpandedCities = {};
    pivotData.forEach((city) => {
      initialExpandedCities[city.name] = true;
    });
    setExpandedCities(initialExpandedCities);
  }, [pivotData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target)) {
        setShowColumnDropdown(false);
      }
      if (rowDropdownRef.current && !rowDropdownRef.current.contains(event.target)) {
        setShowRowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (pivotScrollRef.current) {
      pivotScrollRef.current.scrollLeft = 0;
    }
  }, []);

  const calculateMetrics = useMemo(() => {
    return (categoryData, totalUnitsInLevel) => {
      if (!categoryData || categoryData.count === 0) {
        return {
          percentage: "0%",
          count: 0,
          totalArea: 0,
          totalValue: 0,
          minPSM: 0,
          avgPSM: 0,
          maxPSM: 0,
          minPrice: 0,
          avgPrice: 0,
          maxPrice: 0,
        };
      }

      const { units, count, totalArea, totalValue } = categoryData;

      const psmValues = units.map((u) => parseFloat(u.psm) || 0).filter((v) => v > 0);
      const priceValues = units.map((u) => parseFloat(u.interest_free_unit_price) || 0).filter((v) => v > 0);

      const totalUnits = count;
      const percentage = totalUnitsInLevel > 0 ? ((count / totalUnitsInLevel) * 100).toFixed(2) : 0;

      return {
        percentage: `${percentage}%`,
        count: totalUnits,
        totalArea: Math.round(totalArea),
        totalValue: Math.round(totalValue),
        minPSM: psmValues.length > 0 ? Math.round(Math.min(...psmValues)) : 0,
        avgPSM: psmValues.length > 0 ? Math.round(psmValues.reduce((a, b) => a + b, 0) / psmValues.length) : 0,
        maxPSM: psmValues.length > 0 ? Math.round(Math.max(...psmValues)) : 0,
        minPrice: priceValues.length > 0 ? Math.round(Math.min(...priceValues)) : 0,
        avgPrice: priceValues.length > 0 ? Math.round(priceValues.reduce((a, b) => a + b, 0) / priceValues.length) : 0,
        maxPrice: priceValues.length > 0 ? Math.round(Math.max(...priceValues)) : 0,
      };
    };
  }, []);

  const formatNumber = useMemo(() => {
    return (num) => {
      return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
    };
  }, []);

  const toggleCity = (cityName) => {
    setExpandedCities((prev) => ({ ...prev, [cityName]: !prev[cityName] }));
  };

  const toggleProject = (cityName, projectName) => {
    const key = `${cityName}-${projectName}`;
    setExpandedProjects((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleType = (cityName, projectName, typeName) => {
    const key = `${cityName}-${projectName}-${typeName}`;
    setExpandedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) => ({ ...prev, [columnKey]: !prev[columnKey] }));
  };

  const toggleColumnDropdown = (e) => {
    e.stopPropagation();
    setShowColumnDropdown((prev) => !prev);
    setShowRowDropdown(false);
  };

  const toggleRowDropdown = (e) => {
    e.stopPropagation();
    setShowRowDropdown((prev) => !prev);
    setShowColumnDropdown(false);
  };

  const toggleRow = (rowKey) => {
    setVisibleRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

  const expandAll = () => {
    const newExpandedCities = {};
    const newExpandedProjects = {};
    const newExpandedTypes = {};

    pivotData.forEach((city) => {
      newExpandedCities[city.name] = true;
      Object.keys(city.projects).forEach((projectName) => {
        const projectKey = `${city.name}-${projectName}`;
        newExpandedProjects[projectKey] = true;

        const project = city.projects[projectName];
        Object.keys(project.unitTypes).forEach((typeName) => {
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

  // FIX 2: Wrapped in useCallback so it has a stable reference and can be safely
  // listed as a dependency of the useEffect below.
  const collapseToProjectsOnly = useCallback(() => {
    const newExpandedCities = {};
    pivotData.forEach((city) => {
      newExpandedCities[city.name] = true;
    });
    setExpandedCities(newExpandedCities);
    setExpandedProjects({});
    setExpandedTypes({});
  }, [pivotData]);

  const isEverythingExpanded = useMemo(() => {
    const allCitiesExpanded = pivotData.every((city) => expandedCities[city.name]);

    let allProjectsExpanded = true;
    pivotData.forEach((city) => {
      if (expandedCities[city.name]) {
        Object.keys(city.projects).forEach((projectName) => {
          const projectKey = `${city.name}-${projectName}`;
          if (!expandedProjects[projectKey]) allProjectsExpanded = false;
        });
      }
    });

    let allTypesExpanded = true;
    pivotData.forEach((city) => {
      if (expandedCities[city.name]) {
        Object.keys(city.projects).forEach((projectName) => {
          const projectKey = `${city.name}-${projectName}`;
          if (expandedProjects[projectKey]) {
            const project = city.projects[projectName];
            Object.keys(project.unitTypes).forEach((typeName) => {
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
    const allCitiesCollapsed = pivotData.every((city) => !expandedCities[city.name]);
    const allProjectsCollapsed = Object.keys(expandedProjects).length === 0;
    const allTypesCollapsed = Object.keys(expandedTypes).length === 0;
    return allCitiesCollapsed && allProjectsCollapsed && allTypesCollapsed;
  }, [pivotData, expandedCities, expandedProjects, expandedTypes]);

  const isDefaultState = useMemo(() => {
    const allCitiesExpanded = pivotData.every((city) => expandedCities[city.name]);
    const allProjectsCollapsed = Object.keys(expandedProjects).length === 0;
    const allTypesCollapsed = Object.keys(expandedTypes).length === 0;
    return allCitiesExpanded && allProjectsCollapsed && allTypesCollapsed;
  }, [pivotData, expandedCities, expandedProjects, expandedTypes]);

  // FIX 1: Removed unused 'renderRow' useMemo entirely.

  // FIX 2 (cont.): 'collapseToProjectsOnly' added to dependency array now that
  // it's stable via useCallback.
  useEffect(() => {
    if (pivotData.length > 0) {
      collapseToProjectsOnly();
    }
  }, [pivotData, collapseToProjectsOnly]);

  return (
    <div
      className={`pivot-unique-container ${activeCategory === "sold" ? "pivot-theme-unsold" : "pivot-theme-sold"}`}
    >
      {/* Category Toggle */}
      <div className="pivot-category-toggle pivot-centered-tabs">
        <button
          className={`pivot-category-btn ${activeCategory === "unsold" ? "pivot-active" : ""}`}
          onClick={() => setActiveCategory("unsold")}
        >
          📦 UNSOLD
        </button>

        <button
          className={`pivot-category-btn sold-btn ${activeCategory === "sold" ? "pivot-active" : ""}`}
          onClick={() => setActiveCategory("sold")}
        >
          ✅ SOLD
        </button>
      </div>

      {/* Controls */}
      <div className="pivot-controls-always-left">
        <div className="pivot-controls-group">
          {isEverythingCollapsed ? (
            <button className="pivot-control-btn" onClick={collapseToProjectsOnly}>
              ▼ Show Projects
            </button>
          ) : isDefaultState ? (
            <button className="pivot-control-btn" onClick={expandAll}>
              ▼ Expand All
            </button>
          ) : isEverythingExpanded ? (
            <button className="pivot-control-btn" onClick={collapseAll}>
              ◀ Collapse All
            </button>
          ) : (
            <button className="pivot-control-btn" onClick={collapseAll}>
              ◀ Collapse All
            </button>
          )}

          {/* Rows/Fields Dropdown */}
          <div className="pivot-row-toggle" ref={rowDropdownRef}>
            <button className="pivot-control-btn" onClick={toggleRowDropdown}>
              📋 Rows {showRowDropdown ? "▲" : "▼"}
            </button>
            {showRowDropdown && (
              <div className="pivot-row-dropdown">
                <div className="pivot-dropdown-section">
                  <h4>Hierarchy Levels</h4>
                  <label className="pivot-dropdown-label">
                    <input type="checkbox" checked={visibleRows.cities} onChange={() => toggleRow("cities")} />
                    📍 Cities
                  </label>
                  <label className="pivot-dropdown-label">
                    <input
                      type="checkbox"
                      checked={visibleRows.projects}
                      onChange={() => toggleRow("projects")}
                      disabled={!visibleRows.cities}
                    />
                    📁 Projects
                  </label>
                  <label className="pivot-dropdown-label">
                    <input
                      type="checkbox"
                      checked={visibleRows.unitTypes}
                      onChange={() => toggleRow("unitTypes")}
                      disabled={!visibleRows.projects}
                    />
                    🏠 Unit Types
                  </label>
                  <label className="pivot-dropdown-label">
                    <input
                      type="checkbox"
                      checked={visibleRows.areaRanges}
                      onChange={() => toggleRow("areaRanges")}
                      disabled={!visibleRows.unitTypes}
                    />
                    📏 Area Ranges
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Columns Dropdown */}
          <div className="pivot-column-toggle" ref={columnDropdownRef}>
            <button className="pivot-control-btn" onClick={toggleColumnDropdown}>
              ⚙️ Columns {showColumnDropdown ? "▲" : "▼"}
            </button>
            {showColumnDropdown && (
              <div className="pivot-column-dropdown">
                <div className="pivot-dropdown-section">
                  <h4>Data Fields</h4>
                  {Object.keys(visibleColumns).map((key) => (
                    <label className="pivot-dropdown-label" key={key}>
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={() => toggleColumn(key)}
                      />
                      {key === "percentage"
                        ? "%"
                        : key === "noOfUnits"
                          ? "Units"
                          : key === "sellableArea"
                            ? "Total Area"
                            : key === "salesValue"
                              ? " Total Sales"
                              : key === "minPSM"
                                ? "Min PSM"
                                : key === "avgPSM"
                                  ? "Avg PSM"
                                  : key === "maxPSM"
                                    ? "Max PSM"
                                    : key === "minUnitPrice"
                                      ? "Min Price"
                                      : key === "avgUnitPrice"
                                        ? "Avg Price"
                                        : key === "maxUnitPrice"
                                          ? "Max Price"
                                          : key.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pivot Table */}
      <div className="pivot-table-scroll-container" ref={pivotScrollRef}>
        <table className="pivot-unique-table">
          <thead>
            <tr className="pivot-header-row">
              <th className="pivot-group-header"></th>
              {visibleColumns.percentage && <th className="pivot-col-group-1">%</th>}
              {visibleColumns.noOfUnits && <th className="pivot-col-group-1">UNITS</th>}
              {visibleColumns.sellableArea && <th className="pivot-col-group-1">TOTAL AREA</th>}
              {visibleColumns.salesValue && <th className="pivot-col-group-1">TOTAL SALES</th>}
              {visibleColumns.minPSM && <th className="pivot-col-group-2">MIN PSM</th>}
              {visibleColumns.avgPSM && <th className="pivot-col-group-2">AVG PSM</th>}
              {visibleColumns.maxPSM && <th className="pivot-col-group-2">MAX PSM</th>}
              {visibleColumns.minUnitPrice && <th className="pivot-min-price-header">MIN PRICE</th>}
              {visibleColumns.avgUnitPrice && <th className="pivot-avg-price-header">AVG PRICE</th>}
              {visibleColumns.maxUnitPrice && <th className="pivot-max-price-header">MAX PRICE</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.cities &&
              pivotData.map((city) => {
                const cityTotalUnits = city.sold.count + city.unsold.count;
                const cityMetrics = calculateMetrics(city[activeCategory], cityTotalUnits);
                const isCityExpanded = expandedCities[city.name];
                const cityHasExpandable = visibleRows.projects;

                return (
                  <React.Fragment key={city.name}>
                    <tr className="pivot-row pivot-level-0">
                      <td className="pivot-group-column" style={{ paddingLeft: "10px" }}>
                        {cityHasExpandable && (
                          <button
                            className="pivot-expand-btn"
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleCity(city.name); }}
                          >
                            {isCityExpanded ? "▼" : "▶"}
                          </button>
                        )}
                        <span className="pivot-level-0-label">📍 {city.name}</span>
                      </td>
                      {visibleColumns.percentage && <td className="pivot-metric-cell">{cityMetrics.percentage}</td>}
                      {visibleColumns.noOfUnits && <td className="pivot-metric-cell">{formatNumber(cityMetrics.count)}</td>}
                      {visibleColumns.sellableArea && <td className="pivot-metric-cell">{formatNumber(cityMetrics.totalArea)}</td>}
                      {visibleColumns.salesValue && <td className="pivot-metric-cell">{formatNumber(cityMetrics.totalValue)}</td>}
                      {visibleColumns.minPSM && <td className="pivot-metric-cell">{formatNumber(cityMetrics.minPSM)}</td>}
                      {visibleColumns.avgPSM && <td className="pivot-metric-cell">{formatNumber(cityMetrics.avgPSM)}</td>}
                      {visibleColumns.maxPSM && <td className="pivot-metric-cell">{formatNumber(cityMetrics.maxPSM)}</td>}
                      {visibleColumns.minUnitPrice && <td className="pivot-metric-cell">{formatNumber(cityMetrics.minPrice)}</td>}
                      {visibleColumns.avgUnitPrice && <td className="pivot-metric-cell">{formatNumber(cityMetrics.avgPrice)}</td>}
                      {visibleColumns.maxUnitPrice && <td className="pivot-metric-cell">{formatNumber(cityMetrics.maxPrice)}</td>}
                    </tr>

                    {visibleRows.projects &&
                      isCityExpanded &&
                      Object.values(city.projects).map((project) => {
                        const projectTotalUnits = project.sold.count + project.unsold.count;
                        const projectMetrics = calculateMetrics(project[activeCategory], projectTotalUnits);
                        const projectKey = `${city.name}-${project.name}`;
                        const isProjectExpanded = expandedProjects[projectKey];
                        const projectHasExpandable = visibleRows.unitTypes;

                        return (
                          <React.Fragment key={projectKey}>
                            <tr className="pivot-row pivot-level-1">
                              <td className="pivot-group-column" style={{ paddingLeft: "30px" }}>
                                {projectHasExpandable && (
                                  <button
                                    className="pivot-expand-btn"
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleProject(city.name, project.name); }}
                                  >
                                    {isProjectExpanded ? "▼" : "▶"}
                                  </button>
                                )}
                                <span className="pivot-level-1-label">📁 {project.name}</span>
                              </td>
                              {visibleColumns.percentage && <td className="pivot-metric-cell">{projectMetrics.percentage}</td>}
                              {visibleColumns.noOfUnits && <td className="pivot-metric-cell">{formatNumber(projectMetrics.count)}</td>}
                              {visibleColumns.sellableArea && <td className="pivot-metric-cell">{formatNumber(projectMetrics.totalArea)}</td>}
                              {visibleColumns.salesValue && <td className="pivot-metric-cell">{formatNumber(projectMetrics.totalValue)}</td>}
                              {visibleColumns.minPSM && <td className="pivot-metric-cell">{formatNumber(projectMetrics.minPSM)}</td>}
                              {visibleColumns.avgPSM && <td className="pivot-metric-cell">{formatNumber(projectMetrics.avgPSM)}</td>}
                              {visibleColumns.maxPSM && <td className="pivot-metric-cell">{formatNumber(projectMetrics.maxPSM)}</td>}
                              {visibleColumns.minUnitPrice && <td className="pivot-metric-cell">{formatNumber(projectMetrics.minPrice)}</td>}
                              {visibleColumns.avgUnitPrice && <td className="pivot-metric-cell">{formatNumber(projectMetrics.avgPrice)}</td>}
                              {visibleColumns.maxUnitPrice && <td className="pivot-metric-cell">{formatNumber(projectMetrics.maxPrice)}</td>}
                            </tr>

                            {visibleRows.unitTypes &&
                              isProjectExpanded &&
                              Object.values(project.unitTypes).map((unitType) => {
                                const typeTotalUnits = unitType.sold.count + unitType.unsold.count;
                                const typeMetrics = calculateMetrics(unitType[activeCategory], typeTotalUnits);
                                const typeKey = `${city.name}-${project.name}-${unitType.name}`;
                                const isTypeExpanded = expandedTypes[typeKey];
                                const typeHasExpandable = visibleRows.areaRanges;

                                return (
                                  <React.Fragment key={typeKey}>
                                    <tr className="pivot-row pivot-level-2">
                                      <td className="pivot-group-column" style={{ paddingLeft: "50px" }}>
                                        {typeHasExpandable && (
                                          <button
                                            className="pivot-expand-btn"
                                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleType(city.name, project.name, unitType.name); }}
                                          >
                                            {isTypeExpanded ? "▼" : "▶"}
                                          </button>
                                        )}
                                        <span className="pivot-level-2-label">🏠 {unitType.name}</span>
                                      </td>
                                      {visibleColumns.percentage && <td className="pivot-metric-cell">{typeMetrics.percentage}</td>}
                                      {visibleColumns.noOfUnits && <td className="pivot-metric-cell">{formatNumber(typeMetrics.count)}</td>}
                                      {visibleColumns.sellableArea && <td className="pivot-metric-cell">{formatNumber(typeMetrics.totalArea)}</td>}
                                      {visibleColumns.salesValue && <td className="pivot-metric-cell">{formatNumber(typeMetrics.totalValue)}</td>}
                                      {visibleColumns.minPSM && <td className="pivot-metric-cell">{formatNumber(typeMetrics.minPSM)}</td>}
                                      {visibleColumns.avgPSM && <td className="pivot-metric-cell">{formatNumber(typeMetrics.avgPSM)}</td>}
                                      {visibleColumns.maxPSM && <td className="pivot-metric-cell">{formatNumber(typeMetrics.maxPSM)}</td>}
                                      {visibleColumns.minUnitPrice && <td className="pivot-metric-cell">{formatNumber(typeMetrics.minPrice)}</td>}
                                      {visibleColumns.avgUnitPrice && <td className="pivot-metric-cell">{formatNumber(typeMetrics.avgPrice)}</td>}
                                      {visibleColumns.maxUnitPrice && <td className="pivot-metric-cell">{formatNumber(typeMetrics.maxPrice)}</td>}
                                    </tr>

                                    {visibleRows.areaRanges &&
                                      isTypeExpanded &&
                                      Object.values(unitType.areaRanges).map((areaRange) => {
                                        const areaTotalUnits = areaRange.sold.count + areaRange.unsold.count;
                                        const areaMetrics = calculateMetrics(areaRange[activeCategory], areaTotalUnits);

                                        return (
                                          <tr className="pivot-row pivot-level-3" key={areaRange.name}>
                                            <td className="pivot-group-column" style={{ paddingLeft: "70px" }}>
                                              <span className="pivot-level-3-label">📏 {areaRange.name}</span>
                                            </td>
                                            {visibleColumns.percentage && <td className="pivot-metric-cell">{areaMetrics.percentage}</td>}
                                            {visibleColumns.noOfUnits && <td className="pivot-metric-cell">{formatNumber(areaMetrics.count)}</td>}
                                            {visibleColumns.sellableArea && <td className="pivot-metric-cell">{formatNumber(areaMetrics.totalArea)}</td>}
                                            {visibleColumns.salesValue && <td className="pivot-metric-cell">{formatNumber(areaMetrics.totalValue)}</td>}
                                            {visibleColumns.minPSM && <td className="pivot-metric-cell">{formatNumber(areaMetrics.minPSM)}</td>}
                                            {visibleColumns.avgPSM && <td className="pivot-metric-cell">{formatNumber(areaMetrics.avgPSM)}</td>}
                                            {visibleColumns.maxPSM && <td className="pivot-metric-cell">{formatNumber(areaMetrics.maxPSM)}</td>}
                                            {visibleColumns.minUnitPrice && <td className="pivot-metric-cell">{formatNumber(areaMetrics.minPrice)}</td>}
                                            {visibleColumns.avgUnitPrice && <td className="pivot-metric-cell">{formatNumber(areaMetrics.avgPrice)}</td>}
                                            {visibleColumns.maxUnitPrice && <td className="pivot-metric-cell">{formatNumber(areaMetrics.maxPrice)}</td>}
                                          </tr>
                                        );
                                      })}
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
  );
};

export default PivotTable;