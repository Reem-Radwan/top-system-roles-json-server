import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
import TopHeader from "./components/Header/TopHeader";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import ManageUsers from "./pages/ManageUsers/ManageUsers";
import CreateUser from "./pages/CreateUser/CreateUser";
import ManageCompanies from "./pages/ManageCompanies/manageCompanies";
import CreateCompany from "./pages/CreateCompany/CreateCompany";
import Cataloge from "./pages/Cataloge/cataloge";
import CreateNewProject from "./pages/CreateProject/createProject";
import ManageProjects from "./pages/ManageProjects/manageProjects";
import InventoryDashboardPage from "./pages/InventoryDashboard/InventoryDashboard";
import { ThemeProvider } from "./components/InventoryDashboard/Themecontext";
import SalesPerformanceAnalysis from "./components/SalesPerformanceAnalysis/SalesPerformanceAnalysis";
import UnitsAnalysis from "./pages/UnitsAnalysis/unitsAnalysis";
import RealEstateLogin from "./pages/LoginPage/login";
import ManageInventory from "./pages/ManageInventory/manageinventory";
import InventoryHub from "./pages/InventoryHub/inventoryhub";
import Masterplans from "./pages/MasterPlans/masterplans";
import MasterplansSettings from "./pages/MasterPlansSettings/masterplanssettings";
import UnitBrochureManager from "./pages/UnitBrochureManager/unitbrochuremanager";
import CancellationPage from "./pages/Cancellation/cancellation";
import SalesTeamPerformance from "./pages/SalesTeamPerformance/salesteamperformance";
import ApprovalsHistory from "./pages/ApprovalsHistory/approvalshistory";
import CustomizedReport from "./pages/CustomizedReport/customizedreport";
import VariableDiscountRate from "./pages/VariableDiscountRate/variable-discount-rate";
import DualPayment from "./pages/DualPaymentsInput/dual-payments";
import UserTrafficAnalysis from "./pages/UserTrafficAnalysis/user-traffic-analysis";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Layout({ user, onLogout }) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/" || location.pathname === "/login";
  if (isLoginPage || !user) return null;
  return (
    <TopHeader
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
      isSuperuser={user.isSuperuser ?? false}
      viewerPages={user.viewerPages ?? []}
      onLogout={onLogout}
    />
  );
}

// ─── Shorthand wrapper so App stays readable ──────────────────────────────────
function P({ path, children }) {
  return <ProtectedRoute path={path}>{children}</ProtectedRoute>;
}

export default function App() {
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    const onStorage = () => setUser(getStoredUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function handleLogout() {
    localStorage.removeItem("auth_user");
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout user={user} onLogout={handleLogout} />
        <Routes>
          {/* ── Public ── */}
          <Route path="/"      element={<RealEstateLogin onLogin={setUser} />} />
          <Route path="/login" element={<RealEstateLogin onLogin={setUser} />} />

          {/* ── Protected ── */}
          <Route path="/manage-users"          element={<P path="/manage-users">          <ManageUsers />           </P>} />
          <Route path="/users/create"          element={<P path="/users/create">          <CreateUser />            </P>} />
          <Route path="/manage-companies"      element={<P path="/manage-companies">      <ManageCompanies />       </P>} />
          <Route path="/create-company"        element={<P path="/create-company">        <CreateCompany />         </P>} />
          <Route path="/cataloge"              element={<P path="/cataloge">              <Cataloge />              </P>} />
          <Route path="/create-project"        element={<P path="/create-project">        <CreateNewProject />      </P>} />
          <Route path="/manage-projects"       element={<P path="/manage-projects">       <ManageProjects />        </P>} />
          <Route path="/inventory-report"      element={<P path="/inventory-report">      <InventoryDashboardPage /></P>} />
          <Route path="/sales-analysis"        element={<P path="/sales-analysis">        <SalesPerformanceAnalysis /></P>} />
          <Route path="/units-analysis"        element={<P path="/units-analysis">        <UnitsAnalysis />         </P>} />
          <Route path="/manage-inventory"      element={<P path="/manage-inventory">      <ManageInventory />       </P>} />
          <Route path="/inventory-hub"         element={<P path="/inventory-hub">         <InventoryHub />          </P>} />
          <Route path="/masterplans"           element={<P path="/masterplans">           <Masterplans />           </P>} />
          <Route path="/masterplans-settings"  element={<P path="/masterplans-settings">  <MasterplansSettings />   </P>} />
          <Route path="/unit-brochure-manager" element={<P path="/unit-brochure-manager"> <UnitBrochureManager />   </P>} />
          <Route path="/cancellation"          element={<P path="/cancellation">          <CancellationPage />      </P>} />
          <Route path="/sales-team-performance"element={<P path="/sales-team-performance"><SalesTeamPerformance /> </P>} />
          <Route path="/approvals-history"     element={<P path="/approvals-history">     <ApprovalsHistory />      </P>} />
          <Route path="/customized-report"     element={<P path="/customized-report">     <CustomizedReport />      </P>} />
          <Route path="/variable-discount-rate"element={<P path="/variable-discount-rate">     <VariableDiscountRate /> </P>} />
          <Route path="/dual-payments"element={<P path="/dual-payments">     <DualPayment /> </P>} />
          <Route path="/user-traffic-analysis"element={<P path="/user-traffic-analysis">     <UserTrafficAnalysis /> </P>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
