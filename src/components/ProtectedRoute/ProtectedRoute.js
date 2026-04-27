import React from "react";
import { Navigate } from "react-router-dom";

// ─── Which roles can access which routes ─────────────────────────────────────
const ROUTE_PERMISSIONS = {
  "/inventory-report":       ['Admin', 'Developer', 'Manager', 'Viewer', 'TeamMember'],
  "/sales-analysis":         ['Admin', 'Developer', 'Manager', 'Viewer', 'TeamMember'],
  "/units-analysis":         ['Admin', 'Developer', 'TeamMember'],
  "/manage-inventory":       ['Admin', 'Developer', 'TeamMember', 'Uploader', 'SalesOperation'],
  "/inventory-hub":          ['Admin', 'Developer', 'TeamMember', 'Uploader'],
  "/masterplans":            ['Admin', 'Developer', 'TeamMember', 'Manager', 'Sales', 'SalesHead', 'Viewer'],
  "/masterplans-settings":   ['Admin', 'Developer', 'TeamMember', 'Uploader'],
  "/manage-projects":        ['Admin', 'Developer', 'TeamMember', 'Uploader'],
  "/manage-users":           ['Admin', 'Developer'],
  "/manage-companies":       ['Admin', 'Developer'],
  "/create-company":         ['Admin', 'Developer'],
  "/users/create":           ['Admin', 'Developer'],
  "/create-project":         ['Admin', 'Developer'],
  "/cataloge":               ['Admin', 'Developer', 'TeamMember', 'Manager', 'Sales', 'SalesHead', 'Viewer'],
  "/unit-brochure-manager":  ['Admin', 'Developer', 'TeamMember', 'Uploader'],
  "/cancellation":           ['Admin', 'Developer', 'TeamMember', 'Uploader', 'SalesOperation'],
  "/sales-team-performance": ['Admin', 'Developer', 'TeamMember', 'Manager', 'SalesHead'],
  "/approvals-history":      ['Admin', 'Developer', 'TeamMember', 'Manager', 'Sales', 'SalesHead'],
  "/customized-report":      ['Admin', 'Developer', 'TeamMember', 'Manager', 'Uploader'],
  "/variable-discount-rate" :['Admin','Developer','Uploader'],
  "/dual-payments" : ["Admin" , "Developer" , 'TeamMember' , 'Uploader'],
  "/user-traffic-analysis" : ["Admin"]
};

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ path, children }) {
  const user = getCurrentUser();

  // ── Not logged in at all → redirect to login ──────────────────────────────
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ── Logged in but role not allowed for this path → Access Denied page ─────
  const allowedRoles = ROUTE_PERMISSIONS[path];
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <AccessDeniedPage userName={user.name} userRole={user.role} />;
  }

  return children;
}

// ─── Access Denied page ───────────────────────────────────────────────────────
function AccessDeniedPage({ userName, userRole }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--color-bg-secondary, #f5f5f5)',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px 60px',
        background: 'var(--color-surface, white)',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        border: '1px solid var(--color-border, #e5e7eb)',
        maxWidth: '480px',
        width: '90%',
      }}>
        <div style={{ fontSize: '72px', marginBottom: '16px' }}>🔒</div>
        <h1 style={{
          fontSize: '1.75rem',
          color: 'var(--color-text-primary, #111)',
          marginBottom: '8px',
          fontWeight: 700,
        }}>
          Access Denied
        </h1>
        {userName && (
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--color-text-secondary, #888)',
            marginBottom: '6px',
          }}>
            Logged in as <strong>{userName}</strong>
            {userRole && <> ({userRole})</>}
          </p>
        )}
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-text-secondary, #666)',
          marginBottom: '28px',
        }}>
          Your account does not have permission to access this page.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '10px 28px',
            background: '#c45a18',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}