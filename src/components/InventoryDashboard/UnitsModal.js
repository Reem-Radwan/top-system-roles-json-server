import React from 'react';

const UnitsModal = ({ isOpen, onClose, units, title }) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatNumber = (num) => {
    if (!num) return 'N/A';
    return `EGP ${Math.round(num).toLocaleString('en-US')}`;
  };

  const calculateCompliance = (unit) => {
    if (!unit.contract_delivery_date || !unit.development_delivery_date) return 'N/A';
    
    try {
      const contractDate = new Date(unit.contract_delivery_date);
      const developmentDate = new Date(unit.development_delivery_date);
      
      if (isNaN(contractDate.getTime()) || isNaN(developmentDate.getTime())) return 'N/A';
      
      const adjustedContractDate = new Date(contractDate);
      adjustedContractDate.setMonth(adjustedContractDate.getMonth() + (parseInt(unit.grace_period_months) || 0));
      
      const diffTime = developmentDate - adjustedContractDate;
      const diffMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30));
      
      if (diffMonths <= 0) {
        return 'On Time';
      } else {
        return `${diffMonths} months late`;
      }
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          zIndex: 9999,
          maxWidth: '97vw',
          maxHeight: '90vh',
          width: '1400px',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '25px 30px',
          borderBottom: '2px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            {title} • {units.length} units
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#dc3545',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#c82333';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#dc3545';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Body - Scrollable Table */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px 25px'
        }}>
          <div style={{
            overflowX: 'auto',
            position: 'relative',
            maxHeight: '60vh'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#f8f9fa',
                  position: 'sticky',
                  top: 0,
                  zIndex: 3
                }}>
                  <th style={{
                    ...headerStyle,
                    position: 'sticky',
                    left: 0,
                    zIndex: 4,
                    minWidth: '100px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    border: 'none',
                    boxShadow: '3px 0 8px rgba(0,0,0,0.15)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}>UNIT CODE</th>
                  <th style={headerStyle}>PROJECT</th>
                  <th style={headerStyle}>UNIT TYPE</th>
                  <th style={headerStyle}>AREA</th>
                  <th style={headerStyle}>STATUS</th>
                  <th style={headerStyle}>PRICE</th>
                  <th style={headerStyle}>PSM</th>
                  <th style={headerStyle}>CONTRACT DELIVERY DATE</th>
                  <th style={headerStyle}>GRACE (M)</th>
                  <th style={headerStyle}>DELIVERY DATE</th>
                  <th style={headerStyle}>COMPLIANCE</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit, index) => {
                  const compliance = calculateCompliance(unit);
                  const isLate = compliance !== 'On Time' && compliance !== 'N/A';
                  
                  return (
                    <tr 
                      key={index}
                      style={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                        borderBottom: '1px solid #e0e0e0',
                        position: 'relative'
                      }}
                    >
                      <td style={{
                        ...cellStyle,
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        Width: '80px',
                        backgroundColor: '#fff3e0',
                        color: '#e65100',
                        fontWeight: '700',
                        fontSize: '13px',
                        fontFamily: "'Roboto Mono', 'Courier New', monospace",
                        letterSpacing: '0.3px',
                        border: 'none',
                        borderRight: '2px solid #ff9800',
                        boxShadow: '3px 0 8px rgba(0,0,0,0.1)',
                        padding: '10px 8px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}>{unit.unit_code || 'N/A'}</td>
                      <td style={cellStyle}>{unit.project_name || 'N/A'}</td>
                      <td style={cellStyle}>{unit.unit_type || 'N/A'}</td>
                      <td style={cellStyle}>{unit.sellable_area ? Math.round(unit.sellable_area) : 'N/A'}</td>
                      <td style={cellStyle}>{unit.status || 'N/A'}</td>
                      <td style={cellStyle}>{formatNumber(unit.interest_free_unit_price)}</td>
                      <td style={cellStyle}>{unit.psm ? Math.round(unit.psm).toLocaleString('en-US') : 'N/A'}</td>
                      <td style={cellStyle}>{formatDate(unit.contract_delivery_date)}</td>
                      <td style={cellStyle}>{unit.grace_period_months || 'N/A'}</td>
                      <td style={cellStyle}>{formatDate(unit.development_delivery_date)}</td>
                      <td style={{
                        ...cellStyle,
                        color: isLate ? '#dc3545' : '#28a745',
                        fontWeight: 'bold'
                      }}>
                        {compliance}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '20px 30px',
          borderTop: '2px solid #e0e0e0',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Showing {units.length} units
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            fontSize: '12px',
            color: '#666'
          }}>
           
          
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px 30px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

// Styles
const headerStyle = {
  padding: '10px 8px',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '12px',
  color: '#333',
  borderBottom: '2px solid #dee2e6',
  whiteSpace: 'nowrap',
  Width: '60px'
};

const cellStyle = {
  padding: '8px',
  textAlign: 'center',
  fontSize: '13px',
  color: '#333',
  whiteSpace: 'nowrap'
};

export default UnitsModal;