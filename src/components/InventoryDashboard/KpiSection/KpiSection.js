import React from 'react';
import './kpisection.css'
const KPISection = ({ units }) => {
  const formatNumber = (num) => {
    if (isNaN(num)) return '-';
    return Math.round(num).toLocaleString();
  };

  // Calculate totals
  const totalUnits = units.length;
  const totalValue = units.reduce((sum, u) => sum + (parseFloat(u.sales_value) || 0), 0);
  const totalPSM = units.reduce((sum, u) => sum + (parseFloat(u.psm) || 0), 0);

  // Calculate sold units (Contracted status)
  const soldUnits = units.filter(u => u.status === 'Contracted');
  const soldCount = soldUnits.length;
  const soldValue = soldUnits.reduce((sum, u) => sum + (parseFloat(u.sales_value) || 0), 0);
  const soldPSM = soldUnits.reduce((sum, u) => sum + (parseFloat(u.psm) || 0), 0);

  // Calculate unsold units
  const unsoldUnits = units.filter(u => u.status !== 'Contracted');
  const unsoldCount = unsoldUnits.length;
  const unsoldValue = unsoldUnits.reduce((sum, u) => sum + (parseFloat(u.sales_value) || 0), 0);
  const unsoldPSM = unsoldUnits.reduce((sum, u) => sum + (parseFloat(u.psm) || 0), 0);

  // Calculate averages
  const avgTotalPrice = totalUnits > 0 ? totalValue / totalUnits : 0;
  const avgSoldPrice = soldCount > 0 ? soldValue / soldCount : 0;
  const avgUnsoldPrice = unsoldCount > 0 ? unsoldValue / unsoldCount : 0;

  const avgTotalPSM = totalUnits > 0 ? totalPSM / totalUnits : 0;
  const avgSoldPSM = soldCount > 0 ? soldPSM / soldCount : 0;
  const avgUnsoldPSM = unsoldCount > 0 ? unsoldPSM / unsoldCount : 0;

  return (
    <div className="kpi-section">
      {/* Total Inventory Card */}
      <div className="kpi-card">
        <div className="kpi-header">
          <div>
            <div className="kpi-title">Total Inventory</div>
            {/* <div className="kpi-value">{formatNumber(totalUnits)}</div> */}
          </div>
          <div className="kpi-icon">🏢</div>
        </div>

        <div className="kpi-metrics">

          <div className="kpi-metric">
            <div className="kpi-metric-label">Total Units</div>
            <div className="kpi-metric-value">{formatNumber(totalUnits)}</div> 
          </div>

          <div className="kpi-metric">
            <div className="kpi-metric-label">Total Sales Value</div>
            <div className="kpi-metric-value">{formatNumber(totalValue)}</div>
          </div>

          <div className="kpi-metric">
            <div className="kpi-metric-label">Avg. Sales Value</div>
            <div className="kpi-metric-value">{formatNumber(avgTotalPrice)}</div>
          </div>

          <div className="kpi-metric">
            <div className="kpi-metric-label">Avg. PSM</div>
            <div className="kpi-metric-value">{formatNumber(avgTotalPSM)}</div>
          </div>

        </div> 

      </div>

      {/* Sold Units Card */}
      <div className="kpi-card">
        <div className="kpi-header">
          <div>
            <div className="kpi-title">Sold Units</div>
            {/* <div className="kpi-value">{formatNumber(soldCount)}</div> */}
          </div>
          <div className="kpi-icon">✅</div>
        </div>
        <div className="kpi-metrics">

          <div className="kpi-metric">
            <div className="kpi-metric-label">Total Units</div>
            <div className="kpi-metric-value">{formatNumber(soldCount)}</div>
          </div>

          <div className="kpi-metric">
            <div className="kpi-metric-label">Total Sales Value</div>
            <div className="kpi-metric-value">{formatNumber(soldValue)}</div>
          </div>
          <div className="kpi-metric">
            <div className="kpi-metric-label">Avg. Sales Value</div>
            <div className="kpi-metric-value">{formatNumber(avgSoldPrice)}</div>
          </div>
          <div className="kpi-metric">
            <div className="kpi-metric-label">Avg. PSM</div>
            <div className="kpi-metric-value">{formatNumber(avgSoldPSM)}</div>
          </div>
        </div>
      </div>

      {/* Unsold Units Card */}
      <div className="kpi-card">
        <div className="kpi-header">
          <div>
            <div className="kpi-title">Unsold Units</div>
            {/* <div className="kpi-value">{formatNumber(unsoldCount)}</div> */}
          </div>
          <div className="kpi-icon">📦</div>
        </div>
        <div className="kpi-metrics">

          <div className="kpi-metric">
            <div className="kpi-metric-label">Total Units</div>
            <div className="kpi-metric-value">{formatNumber(unsoldCount)}</div>
          </div>

          <div className="kpi-metric">
            <div className="kpi-metric-label">Total Sales Value</div>
            <div className="kpi-metric-value">{formatNumber(unsoldValue)}</div>
          </div>
          <div className="kpi-metric">
            <div className="kpi-metric-label">Avg. Interest-Free Price</div>
            <div className="kpi-metric-value">{formatNumber(avgUnsoldPrice)}</div>
          </div>
          <div className="kpi-metric">
            <div className="kpi-metric-label">Avg. PSM</div>
            <div className="kpi-metric-value">{formatNumber(avgUnsoldPSM)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPISection;