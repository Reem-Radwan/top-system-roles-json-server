import React, { useEffect, useState, useRef } from "react";
import "./inventoryDashboard.css";

import Dashboard from "../../components/InventoryDashboard/DashBoard/Dashboard";
import ThemeToggle from "../../components/InventoryDashboard/Themetoggle";

// ✅ CHANGED: import from API service instead of mock data
import { getCompanies } from "../../services/inventorydashboardapi";

// ─── Role buckets ─────────────────────────────────────────────────────────────
const UNBOUND_ROLES = ['Admin', 'Developer'];
const DENIED_ROLES  = ['Sales', 'SalesHead', 'SalesOperation'];

export default function InventoryDashboardPage() {
  const [companies, setCompanies]                     = useState([]);
  const [selectedCompanyId, setSelectedCompanyId]     = useState(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [loading, setLoading]                         = useState(true);
  const [currentView, setCurrentView]                 = useState('home');
  const [accessDenied, setAccessDenied]               = useState(false);
  const [isRestrictedUser, setIsRestrictedUser]       = useState(false);

  const tabsContainerRef = useRef(null);

  const getCurrentUser = () => {
    try {
      const raw = localStorage.getItem("auth_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  useEffect(() => { loadCompanies(); }, []); // eslint-disable-line

  const loadCompanies = async () => {
    try {
      const currentUser = getCurrentUser();

      if (!currentUser) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const { role, company_id } = currentUser;
      console.log("InventoryDashboard — user role:", role, "| company_id:", company_id);

      if (DENIED_ROLES.includes(role)) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // ✅ CHANGED: real API call
      const companiesData = await getCompanies();
      setCompanies(companiesData);

      if (!UNBOUND_ROLES.includes(role) && company_id) {
        const bound = companiesData.find(c => String(c.id) === String(company_id));
        setSelectedCompanyId(company_id);
        setSelectedCompanyName(bound ? bound.name : '');
        setIsRestrictedUser(true);
      } else {
        setSelectedCompanyId(null);
        setSelectedCompanyName('');
        setIsRestrictedUser(false);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading companies:", error);
      setLoading(false);
    }
  };

  const handleCompanyChange = (companyId) => {
    if (!companyId) {
      setSelectedCompanyId(null);
      setSelectedCompanyName('');
      return;
    }
    setLoading(true);
    const company = companies.find(c => String(c.id) === String(companyId));
    setSelectedCompanyId(companyId);
    setSelectedCompanyName(company ? company.name : '');
    setCurrentView('home');
    setTimeout(() => setLoading(false), 300);
  };

  const handleTabChange = (view) => {
    setCurrentView(view);
    if (window.innerWidth <= 768 && tabsContainerRef.current) {
      setTimeout(() => {
        const activeTab = tabsContainerRef.current.querySelector('.dashboard-tab.active');
        if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }, 50);
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'home':           return '📊 Inventory Dashboard';
      case 'project-data':   return '📊 Un/Sold Analysis';
      case 'inv-status':     return '📦 Inventory Status Analysis';
      case 'sales-progress': return '📈 Sales Progress';
      case 'delivery-plan':  return '🚚 Delivery Plan';
      default:               return '📊 Inventory Dashboard';
    }
  };

  const selectedCompany = companies.find(c => String(c.id) === String(selectedCompanyId));

  if (accessDenied) {
    return (
      <div className="access-denied-wrapper">
        <div className="access-denied-box">
          <div className="access-denied-icon">🔒</div>
          <h1>Access Denied</h1>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner spinner-large"></div>
        <p className="loading-text">
          {selectedCompanyName ? `Loading ${selectedCompanyName}...` : "Loading inventory data..."}
        </p>
      </div>
    );
  }

  return (
    <div className="inv-page-root">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">{getPageTitle()}</h1>

          {selectedCompanyId && (
            <div className="dashboard-tabs" ref={tabsContainerRef}>
              {[
                { key: 'home',           label: '🏠 Home' },
                { key: 'project-data',   label: '📊 Project Data' },
                { key: 'inv-status',     label: '📦 Inv Status' },
                { key: 'sales-progress', label: '📈 Sales Progress' },
                { key: 'delivery-plan',  label: '🚚 Delivery Plan' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`dashboard-tab ${currentView === key ? 'active' : ''}`}
                  onClick={() => handleTabChange(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="dashboard-controls">
            <div className="company-selector-wrapper">
              <label className="company-selector-label">Select Company</label>
              {isRestrictedUser ? (
                <div className="locked-company-display">
                  🏢 {selectedCompanyName || "Loading..."}
                </div>
              ) : (
                <div className="company-selector">
                  <select
                    value={selectedCompanyId || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleCompanyChange(val ? val : null);
                    }}
                  >
                    <option value="" disabled>-- Select Company --</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="dashboard-content-wrapper">
          {selectedCompanyId && selectedCompany ? (
            <Dashboard
              companyId={selectedCompanyId}
              companyName={selectedCompany.name}
              onViewChange={setCurrentView}
              currentView={currentView}
              onTabChange={handleTabChange}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}