import React, { useState } from 'react';
import PivotTable from './PivotTable';
import './projectdataview.css';

const ProjectDataView = ({ units }) => {
  const [activeTab, setActiveTab] = useState('project-data');

  return (
    <div className="project-data-view">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'project-data' ? 'active' : ''}`}
          onClick={() => setActiveTab('project-data')}
        >
          📊 Project Data
        </button>
        <button 
          className={`tab-btn ${activeTab === 'inv-status' ? 'active' : ''}`}
          onClick={() => setActiveTab('inv-status')}
        >
          📦 Inv Status
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sales-progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales-progress')}
        >
          📈 Sales Progress
        </button>
        <button 
          className={`tab-btn ${activeTab === 'delivery-plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivery-plan')}
        >
          🚚 Delivery Plan
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'project-data' && (
          <div className="pivot-section">
            <div className="section-header">
              <h2>Pivot Table: Units by Status</h2>
            </div>
            <PivotTable units={units} />
          </div>
        )}

        {activeTab === 'inv-status' && (
          <div className="coming-soon">
            <div className="coming-soon-icon">📦</div>
            <h3>Inventory Status View</h3>
            <p>Coming soon...</p>
          </div>
        )}

        {activeTab === 'sales-progress' && (
          <div className="coming-soon">
            <div className="coming-soon-icon">📈</div>
            <h3>Sales Progress View</h3>
            <p>Coming soon...</p>
          </div>
        )}

        {activeTab === 'delivery-plan' && (
          <div className="coming-soon">
            <div className="coming-soon-icon">🚚</div>
            <h3>Delivery Plan View</h3>
            <p>Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDataView;