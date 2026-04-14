import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import MultiSelect from './multiselect';
import Chart from './chart';
import './unitsanalysis.css';

function UnitAnalysis() {
  const [offering, setOffering] = useState('Sell');
  const [assetType, setAssetType] = useState('Commercial'); // New toggle state
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 5 filters (removed Asset Type from filters)
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedUnitTypes, setSelectedUnitTypes] = useState([]);
  const [selectedFinishing, setSelectedFinishing] = useState([]);
  const [selectedDevelopers, setSelectedDevelopers] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  
  // Available options for dropdowns
  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableUnitTypes, setAvailableUnitTypes] = useState([]);
  const [availableFinishing, setAvailableFinishing] = useState([]);
  const [availableDevelopers, setAvailableDevelopers] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [availablePayments, setAvailablePayments] = useState([]);

  // Load CSV data
  useEffect(() => {
    fetch('/data.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setRawData(results.data);
            setLoading(false);
          }
        });
      })
      .catch(error => {
        console.error('Error loading CSV:', error);
        setLoading(false);
      });
  }, []);

  // Get unique values from data
  const getUniqueValues = (data, field) => {
    return [...new Set(data.map(row => row[field]).filter(val => val && val.trim()))].sort();
  };

  // Filter data by offering AND asset type
  const filteredByOfferingAndAsset = rawData.filter(
    row => row.Offering === offering && row['Asset Type'] === assetType
  );

  // Update available options based on ALL current selections (dependent filters)
  useEffect(() => {
    // Location options
    let tempFiltered = filteredByOfferingAndAsset;
    if (selectedUnitTypes.length > 0) tempFiltered = tempFiltered.filter(row => selectedUnitTypes.includes(row['Unit Type']));
    if (selectedFinishing.length > 0) tempFiltered = tempFiltered.filter(row => selectedFinishing.includes(row['Finishing Specs.']));
    if (selectedDevelopers.length > 0) tempFiltered = tempFiltered.filter(row => selectedDevelopers.includes(row['Developer Name']));
    if (selectedProjects.length > 0) tempFiltered = tempFiltered.filter(row => selectedProjects.includes(row['Project Name ']));
    if (selectedPayments.length > 0) tempFiltered = tempFiltered.filter(row => selectedPayments.includes(row['Payment Yrs']));
    setAvailableLocations(getUniqueValues(tempFiltered, 'Location'));

    // Unit Type options
    tempFiltered = filteredByOfferingAndAsset;
    if (selectedLocations.length > 0) tempFiltered = tempFiltered.filter(row => selectedLocations.includes(row.Location));
    if (selectedFinishing.length > 0) tempFiltered = tempFiltered.filter(row => selectedFinishing.includes(row['Finishing Specs.']));
    if (selectedDevelopers.length > 0) tempFiltered = tempFiltered.filter(row => selectedDevelopers.includes(row['Developer Name']));
    if (selectedProjects.length > 0) tempFiltered = tempFiltered.filter(row => selectedProjects.includes(row['Project Name ']));
    if (selectedPayments.length > 0) tempFiltered = tempFiltered.filter(row => selectedPayments.includes(row['Payment Yrs']));
    setAvailableUnitTypes(getUniqueValues(tempFiltered, 'Unit Type'));

    // Finishing options
    tempFiltered = filteredByOfferingAndAsset;
    if (selectedLocations.length > 0) tempFiltered = tempFiltered.filter(row => selectedLocations.includes(row.Location));
    if (selectedUnitTypes.length > 0) tempFiltered = tempFiltered.filter(row => selectedUnitTypes.includes(row['Unit Type']));
    if (selectedDevelopers.length > 0) tempFiltered = tempFiltered.filter(row => selectedDevelopers.includes(row['Developer Name']));
    if (selectedProjects.length > 0) tempFiltered = tempFiltered.filter(row => selectedProjects.includes(row['Project Name ']));
    if (selectedPayments.length > 0) tempFiltered = tempFiltered.filter(row => selectedPayments.includes(row['Payment Yrs']));
    setAvailableFinishing(getUniqueValues(tempFiltered, 'Finishing Specs.'));

    // Developer options
    tempFiltered = filteredByOfferingAndAsset;
    if (selectedLocations.length > 0) tempFiltered = tempFiltered.filter(row => selectedLocations.includes(row.Location));
    if (selectedUnitTypes.length > 0) tempFiltered = tempFiltered.filter(row => selectedUnitTypes.includes(row['Unit Type']));
    if (selectedFinishing.length > 0) tempFiltered = tempFiltered.filter(row => selectedFinishing.includes(row['Finishing Specs.']));
    if (selectedProjects.length > 0) tempFiltered = tempFiltered.filter(row => selectedProjects.includes(row['Project Name ']));
    if (selectedPayments.length > 0) tempFiltered = tempFiltered.filter(row => selectedPayments.includes(row['Payment Yrs']));
    setAvailableDevelopers(getUniqueValues(tempFiltered, 'Developer Name'));

    // Project options
    tempFiltered = filteredByOfferingAndAsset;
    if (selectedLocations.length > 0) tempFiltered = tempFiltered.filter(row => selectedLocations.includes(row.Location));
    if (selectedUnitTypes.length > 0) tempFiltered = tempFiltered.filter(row => selectedUnitTypes.includes(row['Unit Type']));
    if (selectedFinishing.length > 0) tempFiltered = tempFiltered.filter(row => selectedFinishing.includes(row['Finishing Specs.']));
    if (selectedDevelopers.length > 0) tempFiltered = tempFiltered.filter(row => selectedDevelopers.includes(row['Developer Name']));
    if (selectedPayments.length > 0) tempFiltered = tempFiltered.filter(row => selectedPayments.includes(row['Payment Yrs']));
    setAvailableProjects(getUniqueValues(tempFiltered, 'Project Name '));

    // Payment options
    tempFiltered = filteredByOfferingAndAsset;
    if (selectedLocations.length > 0) tempFiltered = tempFiltered.filter(row => selectedLocations.includes(row.Location));
    if (selectedUnitTypes.length > 0) tempFiltered = tempFiltered.filter(row => selectedUnitTypes.includes(row['Unit Type']));
    if (selectedFinishing.length > 0) tempFiltered = tempFiltered.filter(row => selectedFinishing.includes(row['Finishing Specs.']));
    if (selectedDevelopers.length > 0) tempFiltered = tempFiltered.filter(row => selectedDevelopers.includes(row['Developer Name']));
    if (selectedProjects.length > 0) tempFiltered = tempFiltered.filter(row => selectedProjects.includes(row['Project Name ']));
    setAvailablePayments(getUniqueValues(tempFiltered, 'Payment Yrs'));

  }, [filteredByOfferingAndAsset, selectedLocations, selectedUnitTypes, 
      selectedFinishing, selectedDevelopers, selectedProjects, selectedPayments]);

  // Check if any filter is selected
  const hasAnyFilter = () => {
    return selectedLocations.length > 0 ||
           selectedUnitTypes.length > 0 ||
           selectedFinishing.length > 0 ||
           selectedDevelopers.length > 0 ||
           selectedProjects.length > 0 ||
           selectedPayments.length > 0;
  };

  // Get filtered data for charts
  const getFilteredData = () => {
    // Don't return any data if no filters are selected
    if (!hasAnyFilter()) {
      return [];
    }

    let filtered = filteredByOfferingAndAsset;

    if (selectedLocations.length > 0) {
      filtered = filtered.filter(row => selectedLocations.includes(row.Location));
    }
    if (selectedUnitTypes.length > 0) {
      filtered = filtered.filter(row => selectedUnitTypes.includes(row['Unit Type']));
    }
    if (selectedFinishing.length > 0) {
      filtered = filtered.filter(row => selectedFinishing.includes(row['Finishing Specs.']));
    }
    if (selectedDevelopers.length > 0) {
      filtered = filtered.filter(row => selectedDevelopers.includes(row['Developer Name']));
    }
    if (selectedProjects.length > 0) {
      filtered = filtered.filter(row => selectedProjects.includes(row['Project Name ']));
    }
    if (selectedPayments.length > 0) {
      filtered = filtered.filter(row => selectedPayments.includes(row['Payment Yrs']));
    }

    return filtered;
  };

  // Calculate aggregated data for charts
  const calculateChartData = () => {
    const filtered = getFilteredData();
    
    if (filtered.length === 0) return [];

    // Group by combination of location, unitType, finishing, developer, project, payment
    const grouped = {};
    
    filtered.forEach(row => {
      const key = `${row.Location}_${row['Unit Type']}_${row['Finishing Specs.']}_${row['Developer Name']}_${row['Project Name ']}_${row['Payment Yrs']}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          location: row.Location || 'N/A',
          unitType: row['Unit Type'] || 'N/A',
          finishing: row['Finishing Specs.'] || 'N/A',
          developer: row['Developer Name'] || 'N/A',
          project: row['Project Name '] || 'N/A',
          payment: row['Payment Yrs'] || 'N/A',
          unitPrices: [],
          buas: [],
          psms: []
        };
      }
      
      const unitPrice = parseFloat(row['Unit Price']);
      const bua = parseFloat(row['BUA']);
      const psm = parseFloat(row['PSM']);
      
      if (!isNaN(unitPrice)) grouped[key].unitPrices.push(unitPrice);
      if (!isNaN(bua)) grouped[key].buas.push(bua);
      if (!isNaN(psm)) grouped[key].psms.push(psm);
    });

    // Calculate min, avg, max for each group
    const chartData = Object.values(grouped).map(group => {
      const calcStats = (arr) => {
        if (arr.length === 0) return { min: 0, avg: 0, max: 0 };
        return {
          min: Math.min(...arr),
          avg: arr.reduce((a, b) => a + b, 0) / arr.length,
          max: Math.max(...arr)
        };
      };

      return {
        location: group.location,
        unitType: group.unitType,
        finishing: group.finishing,
        developer: group.developer,
        project: group.project,
        payment: group.payment,
        unitPrice: calcStats(group.unitPrices),
        bua: calcStats(group.buas),
        psm: calcStats(group.psms)
      };
    });

    return chartData;
  };

  const chartData = calculateChartData();

  // Format chart data for each metric
  const unitPriceData = chartData.map(item => ({
    ...item,
    min: item.unitPrice.min,
    avg: item.unitPrice.avg,
    max: item.unitPrice.max
  }));

  const buaData = chartData.map(item => ({
    ...item,
    min: item.bua.min,
    avg: item.bua.avg,
    max: item.bua.max
  }));

  const psmData = chartData.map(item => ({
    ...item,
    min: item.psm.min,
    avg: item.psm.avg,
    max: item.psm.max
  }));

  // Get filter info text
  const getFilterInfo = () => {
    const parts = [];
    if (selectedLocations.length > 0) parts.push(`Location: ${selectedLocations.join(', ')}`);
    if (selectedUnitTypes.length > 0) parts.push(`Unit Type: ${selectedUnitTypes.join(', ')}`);
    if (selectedFinishing.length > 0) parts.push(`Finishing: ${selectedFinishing.join(', ')}`);
    if (selectedDevelopers.length > 0) parts.push(`Developer: ${selectedDevelopers.join(', ')}`);
    if (selectedProjects.length > 0) parts.push(`Project: ${selectedProjects.join(', ')}`);
    if (selectedPayments.length > 0) parts.push(`Payment: ${selectedPayments.join(', ')}`);
    return parts.length > 0 ? parts.join(' • ') : 'All data';
  };

  // Reset all filters
  const handleReset = () => {
    setSelectedLocations([]);
    setSelectedUnitTypes([]);
    setSelectedFinishing([]);
    setSelectedDevelopers([]);
    setSelectedProjects([]);
    setSelectedPayments([]);
  };

  // Format functions for chart values
  const formatCurrency = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 1
    }).format(value);
  };

  const showSecondaryFilters = selectedLocations.length > 0 || selectedUnitTypes.length > 0;

  if (loading) {
    return (
      <div className="loading-container">
        {/* <div className="spinner"></div> */}
      </div>
    );
  }

  return (
    <div className="unitsanalysis-container">
      {/* Header */}
      <div className="unitsanalysis-header">
        <h1 className='unitsanalysis-h1'>Units Analysis</h1>
        <div className="nav-buttons">
          <button className="nav-btn">Report View</button>
          <button className="nav-btn">Map View</button>
          <button className="nav-btn">Market Analysis</button>
        </div>
      </div>

      {/* Toggle Switches Container */}
      <div className="toggle-switches-container">
        {/* Data Type Toggle (Sell/Rent) */}
        <div className="toggle-container">
          <span className="toggle-label">Data Type:</span>
          <div
            className={`toggle-switch ${offering.toLowerCase()}`}
            onClick={() => {
              setOffering(prev => (prev === 'Sell' ? 'Rent' : 'Sell'));
              handleReset();
            }}
          >
            <div className="toggle-slider" />
            <div className="toggle-options">
              <span className={`toggle-option ${offering === 'Sell' ? 'active' : ''}`}>Sale</span>
              <span className={`toggle-option ${offering === 'Rent' ? 'active' : ''}`}>Rent</span>
            </div>
          </div>
        </div>

        {/* Asset Type Toggle (Commercial/Residential) */}
        <div className="toggle-container">
          <span className="toggle-label">Asset Type:</span>
          <div
            className={`toggle-switch ${assetType.toLowerCase()}`}
            onClick={() => {
              setAssetType(prev => (prev === 'Commercial' ? 'Residential' : 'Commercial'));
              handleReset();
            }}
          >
            <div className="toggle-slider" />
            <div className="toggle-options">
              <span className={`toggle-option ${assetType === 'Commercial' ? 'active' : ''}`}>Commercial</span>
              <span className={`toggle-option ${assetType === 'Residential' ? 'active' : ''}`}>Residential</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="unitsanalysis-header-filters-header">
          <h2 className="filters-title">Filters</h2>
          <button className="reset-btn" onClick={handleReset}>
            Reset All
          </button>
        </div>

        {/* Primary Filters */}
        <div className="filters-grid">
          <MultiSelect
            label="Location"
            options={availableLocations}
            selectedValues={selectedLocations}
            onChange={setSelectedLocations}
            placeholder="Select locations..."
          />
          <MultiSelect
            label="Unit Type"
            options={availableUnitTypes}
            selectedValues={selectedUnitTypes}
            onChange={setSelectedUnitTypes}
            placeholder="Select unit types..."
          />
        </div>

        {/* Secondary Filters */}
        {showSecondaryFilters && (
          <div className="filters-grid" style={{ marginTop: '20px' }}>
            <MultiSelect
              label="Finishing Specs"
              options={availableFinishing}
              selectedValues={selectedFinishing}
              onChange={setSelectedFinishing}
              placeholder="Select finishing..."
            />
            <MultiSelect
              label="Developer"
              options={availableDevelopers}
              selectedValues={selectedDevelopers}
              onChange={setSelectedDevelopers}
              placeholder="Select developers..."
            />
            <MultiSelect
              label="Project"
              options={availableProjects}
              selectedValues={selectedProjects}
              onChange={setSelectedProjects}
              placeholder="Select projects..."
            />
            <MultiSelect
              label="Payment Years"
              options={availablePayments}
              selectedValues={selectedPayments}
              onChange={setSelectedPayments}
              placeholder="Select payment years..."
            />
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="charts-container">
        {!hasAnyFilter() ? (
          <div className="chart-section">
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-text">Please select at least one filter to view data</div>
            </div>
          </div>
        ) : (
          <>
            <Chart
              title="Unit Price Range"
              data={unitPriceData}
              filterInfo={getFilterInfo()}
              valueFormatter={formatCurrency}
              selectedFilters={{
                location: selectedLocations,
                assetType: assetType,
                unitType: selectedUnitTypes
              }}
            />
             <Chart
              title="Price per Square Meter Range"
              data={psmData}
              filterInfo={getFilterInfo()}
              valueFormatter={formatCurrency}
              selectedFilters={{
                location: selectedLocations,
                assetType: assetType,
                unitType: selectedUnitTypes
              }}
            />
            <Chart
              title="Area Range"
              data={buaData}
              filterInfo={getFilterInfo()}
              valueFormatter={formatNumber}
              selectedFilters={{
                location: selectedLocations,
                assetType: assetType,
                unitType: selectedUnitTypes
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default UnitAnalysis;