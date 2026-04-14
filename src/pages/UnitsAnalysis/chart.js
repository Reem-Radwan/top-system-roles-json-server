import React, { useMemo, useRef } from 'react';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const Chart = ({ title, data, filterInfo, valueFormatter, selectedFilters }) => {
  const containerScrollRef = useRef(null);

  const { locationSpans, flattenedColumns, maxValue } = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];

    // Build 6-level hierarchy: Location > Unit Type > Finishing > Developer > Project > Payment
    const hierarchicalData = {};
    safeData.forEach(item => {
      const location = item.location || 'Unknown';
      const unitType = item.unitType || 'Unknown';
      const finishing = item.finishing || 'Unknown';
      const developer = item.developer || 'Unknown';
      const project = item.project || 'Unknown';
      const payment = item.payment || 'Unknown';

      hierarchicalData[location] ??= {};
      hierarchicalData[location][unitType] ??= {};
      hierarchicalData[location][unitType][finishing] ??= {};
      hierarchicalData[location][unitType][finishing][developer] ??= {};
      hierarchicalData[location][unitType][finishing][developer][project] ??= [];

      hierarchicalData[location][unitType][finishing][developer][project].push({
        payment,
        max: Number(item.max) || 0,
        avg: Number(item.avg) || 0,
        min: Number(item.min) || 0,
        fullData: item
      });
    });

    const locationSpansLocal = [];
    const flattenedColumnsLocal = [];

    Object.keys(hierarchicalData).forEach(location => {
      let locationColCount = 0;
      const unitTypeSpans = [];

      Object.keys(hierarchicalData[location]).forEach(unitType => {
        let unitTypeColCount = 0;
        const finishingSpans = [];

        Object.keys(hierarchicalData[location][unitType]).forEach(finishing => {
          let finishingColCount = 0;
          const developerSpans = [];

          Object.keys(hierarchicalData[location][unitType][finishing]).forEach(developer => {
            let developerColCount = 0;
            const projectSpans = [];

            Object.keys(hierarchicalData[location][unitType][finishing][developer]).forEach(project => {
              const payments = hierarchicalData[location][unitType][finishing][developer][project];

              payments.forEach(paymentData => {
                flattenedColumnsLocal.push({
                  location,
                  unitType,
                  finishing,
                  developer,
                  project,
                  payment: paymentData.payment,
                  max: paymentData.max,
                  avg: paymentData.avg,
                  min: paymentData.min,
                  fullData: paymentData.fullData
                });
                developerColCount++;
                finishingColCount++;
                unitTypeColCount++;
                locationColCount++;
              });

              projectSpans.push({ label: project, span: payments.length });
            });

            developerSpans.push({ label: developer, span: developerColCount, projects: projectSpans });
          });

          finishingSpans.push({ label: finishing, span: finishingColCount, developers: developerSpans });
        });

        unitTypeSpans.push({ label: unitType, span: unitTypeColCount, finishings: finishingSpans });
      });

      locationSpansLocal.push({ label: location, span: locationColCount, unitTypes: unitTypeSpans });
    });

    const allValues = flattenedColumnsLocal.flatMap(c => [c.max, c.avg, c.min]);
    const maxValueLocal = Math.max(1, ...allValues);

    return { locationSpans: locationSpansLocal, flattenedColumns: flattenedColumnsLocal, maxValue: maxValueLocal };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="chart-section">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          {filterInfo && <div className="chart-filters-info">{filterInfo}</div>}
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">No data available for the selected filters</div>
        </div>
      </div>
    );
  }

  const STACK_HEIGHT = 320;
  const RECT_H = 36;
  const RECT_HALF = RECT_H / 2;
  const TOP_PAD = 8;
  const BOTTOM_PAD = 8;

  const yFromValue = (value) => {
    const pct = clamp(value / maxValue, 0, 1);
    const usable = STACK_HEIGHT - TOP_PAD - BOTTOM_PAD;
    return TOP_PAD + (1 - pct) * usable;
  };

  // CRITICAL: Column width calculation
  const LABEL_COLUMN_WIDTH = 120;
  const MIN_TOTAL_WIDTH = 1200;
  const BASE_COLUMN_WIDTH = 140;
  
  const columnCount = flattenedColumns.length;
  const availableSpaceForColumns = MIN_TOTAL_WIDTH - LABEL_COLUMN_WIDTH;
  
  let COLUMN_WIDTH;
  let totalWidth;
  
  if (columnCount * BASE_COLUMN_WIDTH < availableSpaceForColumns) {
    COLUMN_WIDTH = Math.floor(availableSpaceForColumns / columnCount);
    totalWidth = MIN_TOTAL_WIDTH;
  } else {
    COLUMN_WIDTH = BASE_COLUMN_WIDTH;
    totalWidth = LABEL_COLUMN_WIDTH + (columnCount * COLUMN_WIDTH);
  }

  return (
    <div className="chart-section">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        {filterInfo && <div className="chart-filters-info">{filterInfo}</div>}
      </div>

      <div className="chart-content">
        <div className="chart-scroll-container" ref={containerScrollRef}>
          <div className="chart-scroll-content" style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px` }}>
            
            {/* TABLE SECTION - 6 LEVELS */}
            <div className="chart-table-wrapper-inner">
              <table className="chart-x-axis-table" style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px` }}>
                <colgroup>
                  <col style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }} />
                  {flattenedColumns.map((_, idx) => (
                    <col key={`col-${idx}`} style={{ width: `${COLUMN_WIDTH}px`, minWidth: `${COLUMN_WIDTH}px`, maxWidth: `${COLUMN_WIDTH}px` }} />
                  ))}
                </colgroup>
                <thead>
                  {/* Level 1: Location */}
                  <tr className="hierarchy-level-1">
                    <th className="fixed-label-column">Location</th>
                    {locationSpans.map((location, idx) => (
                      <th key={`location-${idx}`} colSpan={location.span}>
                        {location.label}
                      </th>
                    ))}
                  </tr>

                  {/* Level 2: Unit Type */}
                  <tr className="hierarchy-level-2">
                    <th className="fixed-label-column">Unit Type</th>
                    {locationSpans.map((location, lIdx) =>
                      location.unitTypes.map((unitType, uIdx) => (
                        <th key={`unitType-${lIdx}-${uIdx}`} colSpan={unitType.span}>
                          {unitType.label}
                        </th>
                      ))
                    )}
                  </tr>

                  {/* Level 3: Finishing */}
                  <tr className="hierarchy-level-3">
                    <th className="fixed-label-column">Finishing</th>
                    {locationSpans.map((location, lIdx) =>
                      location.unitTypes.map((unitType, uIdx) =>
                        unitType.finishings.map((finishing, fIdx) => (
                          <th key={`finishing-${lIdx}-${uIdx}-${fIdx}`} colSpan={finishing.span}>
                            {finishing.label}
                          </th>
                        ))
                      )
                    )}
                  </tr>

                  {/* Level 4: Developer */}
                  <tr className="hierarchy-level-4">
                    <th className="fixed-label-column">Developer</th>
                    {locationSpans.map((location, lIdx) =>
                      location.unitTypes.map((unitType, uIdx) =>
                        unitType.finishings.map((finishing, fIdx) =>
                          finishing.developers.map((developer, dIdx) => (
                            <th key={`developer-${lIdx}-${uIdx}-${fIdx}-${dIdx}`} colSpan={developer.span}>
                              {developer.label}
                            </th>
                          ))
                        )
                      )
                    )}
                  </tr>

                  {/* Level 5: Project */}
                  <tr className="hierarchy-level-5">
                    <th className="fixed-label-column">Project</th>
                    {locationSpans.map((location, lIdx) =>
                      location.unitTypes.map((unitType, uIdx) =>
                        unitType.finishings.map((finishing, fIdx) =>
                          finishing.developers.map((developer, dIdx) =>
                            developer.projects.map((project, pIdx) => (
                              <th key={`project-${lIdx}-${uIdx}-${fIdx}-${dIdx}-${pIdx}`} colSpan={project.span}>
                                {project.label}
                              </th>
                            ))
                          )
                        )
                      )
                    )}
                  </tr>

                  {/* Level 6: Payment */}
                  <tr className="hierarchy-level-6">
                    <th className="fixed-label-column">Payment</th>
                    {flattenedColumns.map((col, idx) => (
                      <th key={`payment-${idx}`}>
                        {col.payment}
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>

            {/* CHART VISUALIZATION SECTION */}
            <div className="chart-visualization-wrapper-inner">
              <div className="chart-visualization" style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px` }}>
                
                <div className="chart-grid-lines" style={{ position: 'absolute', top: '40px', left: '120px', right: 0, bottom: '40px' }}>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="grid-line" style={{ top: `${i * 20}%` }} />
                  ))}
                </div>

                <div style={{ display: 'flex', width: '100%', paddingTop: '40px', paddingBottom: '40px' }}>
                  {/* STICKY PLACEHOLDER COLUMN - stays fixed while scrolling */}
                  <div className="chart-sticky-placeholder"></div>
                  
                  {flattenedColumns.map((item, index) => {
                    const yMax = yFromValue(item.max);
                    const yAvg = yFromValue(item.avg);
                    const yMin = yFromValue(item.min);

                    const topCenter = Math.min(yMax, yAvg, yMin) + RECT_HALF;
                    const bottomCenter = Math.max(yMax, yAvg, yMin) + RECT_HALF;

                    // Prepare tooltip data
                    const assetType = selectedFilters?.assetType || item.fullData?.['Asset Type'] || item.fullData?.assetType || '—';

                    return (
                      <div 
                        key={index} 
                        className="chart-bar-column"
                        style={{ 
                          width: `${COLUMN_WIDTH}px`, 
                          minWidth: `${COLUMN_WIDTH}px`, 
                          maxWidth: `${COLUMN_WIDTH}px`,
                          flexShrink: 0,
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          const tooltip = e.currentTarget.querySelector('.chart-tooltip');
                          if (tooltip) {
                            // Find any visible rectangle to get the actual position
                            const rectangle = e.currentTarget.querySelector('.chart-rectangle');
                            if (!rectangle) return;
                            
                            const rect = rectangle.getBoundingClientRect();
                            const tooltipWidth = 320;
                            const tooltipHeight = 280;
                            const rightGap = 10;
                            
                            // Calculate vertical position (centered on rectangles area)
                            const chartStack = e.currentTarget.querySelector('.chart-stack');
                            const stackRect = chartStack.getBoundingClientRect();
                            let top = stackRect.top + stackRect.height / 2;
                            
                            // Check if tooltip goes off bottom edge
                            if (top + tooltipHeight / 2 > window.innerHeight) {
                              top = window.innerHeight - tooltipHeight / 2 - 20;
                            }
                            
                            // Check if tooltip goes off top edge
                            if (top - tooltipHeight / 2 < 0) {
                              top = tooltipHeight / 2 + 20;
                            }
                            
                            // Position based on the RIGHTMOST edge of the rectangles
                            let left = rect.right + rightGap;
                            
                            // Check if tooltip goes off right edge of screen
                            if (left + tooltipWidth > window.innerWidth) {
                              // Position on the left side of rectangles
                              left = rect.left - 180;
                            }
                            
                            tooltip.style.left = `${left}px`;
                            tooltip.style.top = `${top}px`;
                            tooltip.style.transform = 'translateY(-50%)';
                          }
                        }}
                      >
                        <div className="chart-stack" style={{ height: `${STACK_HEIGHT}px`, position: 'relative' }}>
                          <div
                            className="value-connector"
                            style={{ top: `${topCenter}px`, height: `${Math.max(0, bottomCenter - topCenter)}px` }}
                          />

                          <div className="chart-rectangle max" style={{ top: `${yMax}px` }}>
                            {valueFormatter(item.max)}
                          </div>

                          <div className="chart-rectangle avg" style={{ top: `${yAvg}px` }}>
                            {valueFormatter(item.avg)}
                          </div>

                          <div className="chart-rectangle min" style={{ top: `${yMin}px` }}>
                            {valueFormatter(item.min)}
                          </div>

                          {/* Pure CSS Tooltip */}
                          <div className="chart-tooltip">
                            <div className="tooltip-title">Details</div>
                            <div className="tooltip-item"><span className="tooltip-label">Location:</span> {item.location}</div>
                            <div className="tooltip-item"><span className="tooltip-label">Unit Type:</span> {item.unitType}</div>
                            <div className="tooltip-item"><span className="tooltip-label">Asset Type:</span> {assetType}</div>
                            <div className="tooltip-item"><span className="tooltip-label">Finishing:</span> {item.finishing}</div>
                            <div className="tooltip-item"><span className="tooltip-label">Developer:</span> {item.developer}</div>
                            <div className="tooltip-item"><span className="tooltip-label">Project:</span> {item.project}</div>
                            <div className="tooltip-item"><span className="tooltip-label">Payment:</span> {item.payment}</div>
                            <div className="tooltip-item"><span className="tooltip-label">Min:</span> {valueFormatter(item.min)}</div>
                            <div className="tooltip-item"><span className="tooltip-label">Avg:</span> {valueFormatter(item.avg)}</div>
                            <div className="tooltip-item"><span className="tooltip-label">Max:</span> {valueFormatter(item.max)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Chart;