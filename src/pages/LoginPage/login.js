import React, { useState } from "react";
import "./login.css";
import { mockLogin, MOCK_USERS } from "../../data/permissions";

const ROLE_DISPLAY_NAMES = {
  Admin: "Admin",
  Developer: "Developer",
  TeamMember: "Team Member",
  Uploader: "Uploader",
  SalesOperation: "Sales Op",
  Manager: "Manager",
  Sales: "Sales",
  SalesHead: "Sales Head",
  Viewer: "Viewer",
};

const SWITCHER_USERS = MOCK_USERS.filter(
  (u) => u.email !== "test@prometheus.com.eg"
);

const RealEstateLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleRoleSelect = (user) => {
    setSelectedRole(user.email);
    setEmail(user.email);
    setPassword(user.password);
    setErrors({ email: "", password: "" });
    setServerError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({ email: "", password: "" });
    setServerError("");

    const newErrors = { email: "", password: "" };
    let hasErrors = false;

    if (!email) {
      newErrors.email = "Email is required";
      hasErrors = true;
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
      hasErrors = true;
    }

    if (!password) {
      newErrors.password = "Password is required";
      hasErrors = true;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const user = mockLogin(email, password);
      localStorage.setItem("auth_user", JSON.stringify(user));
      if (onLogin) onLogin(user);
      window.location.href = "/cataloge";
    } catch (err) {
      setServerError(err.message || "Login failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="re-login-container">
      <div className="re-login-wrapper">
        <div className="re-login-card">
          {/* Left Side */}
          <div className="re-login-left">
            <div className="re-brand">
              <svg
                className="re-brand-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>PROMETHEUS</span>
            </div>
            <div className="re-welcome-content">
              <h1 className="re-welcome-title">
                WELCOME
                <br />
                BACK
              </h1>
              <p className="re-welcome-subtitle">Nice to see you again</p>
            </div>
            <div></div>
          </div>

          {/* Right Side */}
          <div className="re-login-right">
            <div className="re-login-header">
              <h2 className="re-login-title">Login</h2>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="re-form-group">
                <label className="re-form-label">Email</label>
                <input
                  type="email"
                  className={`re-form-input ${
                    errors.email ? "re-form-input-error" : ""
                  }`}
                  placeholder="Enter Your Email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedRole(null);
                    if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                  }}
                />
                {errors.email && (
                  <div className="re-error-message">{errors.email}</div>
                )}
              </div>

              <div className="re-form-group">
                <label className="re-form-label">Password</label>
                <div className="re-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`re-form-input ${
                      errors.password ? "re-form-input-error" : ""
                    }`}
                    placeholder="Enter Your Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors((p) => ({ ...p, password: "" }));
                    }}
                  />
                  <button
                    type="button"
                    className="re-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div className="re-error-message">{errors.password}</div>
                )}
              </div>

              {/* Server Error */}
              {serverError && (
                <div className="re-server-error" key={serverError}>
                  <svg
                    className="re-server-error-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{serverError}</span>
                </div>
              )}

              <button
                type="submit"
                className="re-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing In..." : "Login"}
              </button>
            </form>

            {/* ── Quick Role Switcher ── */}
            <div className="re-switcher">
              <div className="re-switcher-header">
                <div className="re-switcher-line"></div>
                <span className="re-switcher-label">Quick Login</span>
                <div className="re-switcher-line"></div>
              </div>
              <div className="re-switcher-grid">
                {SWITCHER_USERS.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    className={`re-role-chip ${
                      selectedRole === u.email ? "re-role-chip--active" : ""
                    }`}
                    onClick={() => handleRoleSelect(u)}
                    title={`${u.email} / ${u.password}`}
                  >
                    {ROLE_DISPLAY_NAMES[u.role] || u.role}
                  </button>
                ))}
              </div>
              {selectedRole && (
                <div className="re-switcher-creds">
                  <div className="re-cred-item">
                    <span className="re-cred-key">Email</span>
                    <span className="re-cred-val">{email}</span>
                  </div>
                  <div className="re-cred-item">
                    <span className="re-cred-key">Password</span>
                    <span className="re-cred-val">{password}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEstateLogin;