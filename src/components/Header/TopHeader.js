// import React, { useEffect, useMemo, useState } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import Swal from "sweetalert2";
// import "./TopHeader.css";
// import {
//   getMenusForRole,
//   shouldHideNavbar,
// } from "../../data/permissions";

// const RealEstateIcon = () => (
//   <svg
//     className="real-estate-icon"
//     viewBox="0 0 24 24"
//     fill="none"
//     xmlns="http://www.w3.org/2000/svg"
//   >
//     <path d="M3 21V10L12 3L21 10V21H14V14H10V21H3Z" fill="currentColor" />
//   </svg>
// );

// export default function TopHeader({
//   userName    = "Reem Radwan",
//   userEmail   = "",
//   userRole    = "",
//   isSuperuser = false,
//   viewerPages = [],
//   onLogout,
// }) {
//   const navigate = useNavigate();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [openMenu,   setOpenMenu]   = useState(null);
//   const [openUser,   setOpenUser]   = useState(false);

//   // ── 1. Hidden-navbar check ───────────────────────────────────────────────
//   const hideNavbar = shouldHideNavbar(userEmail);

//   // ── 2. Build menus from the central permissions map ─────────────────────
//   const menus = useMemo(
//     () => getMenusForRole(userRole, { isSuperuser, viewerPages }),
//     [userRole, isSuperuser, viewerPages]
//   );

//   // ── 3. Avatar initials ───────────────────────────────────────────────────
//   const userInitials = useMemo(
//     () =>
//       userName
//         .split(" ")
//         .map((n) => n[0])
//         .join("")
//         .toUpperCase()
//         .slice(0, 2),
//     [userName]
//   );

//   // ── 4. Close on resize / ESC ────────────────────────────────────────────
//   useEffect(() => {
//     const onResize = () => {
//       if (window.innerWidth > 900) {
//         setMobileOpen(false);
//         setOpenMenu(null);
//         setOpenUser(false);
//       }
//     };
//     window.addEventListener("resize", onResize);
//     return () => window.removeEventListener("resize", onResize);
//   }, []);

//   useEffect(() => {
//     const onKeyDown = (e) => {
//       if (e.key !== "Escape") return;
//       setMobileOpen(false);
//       setOpenMenu(null);
//       setOpenUser(false);
//     };
//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, []);

//   function go(to) {
//     navigate(to);
//     setMobileOpen(false);
//     setOpenMenu(null);
//     setOpenUser(false);
//   }

//   async function handleLogout() {
//     const res = await Swal.fire({
//       title: "Logout?",
//       text: "Are you sure you want to logout?",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Logout",
//       cancelButtonText: "Cancel",
//       confirmButtonColor: "#c45a18",
//       cancelButtonColor: "#7a7a7a",
//     });

//     if (!res.isConfirmed) return;

//     localStorage.removeItem("auth_user");
//     if (onLogout) onLogout();
//     else navigate("/login");
//   }

//   // ── 5. Hidden navbar ────────────────────────────────────────────────────
//   if (hideNavbar) return null;

//   // ── 6. Render ────────────────────────────────────────────────────────────
//   return (
//     <header className="topheader">
//       <div className="topheader-inner">

//         {/* Left side — Logo + Nav */}
//         <div className="topheader-left">
//           <div className="topheader-logo">
//             <div className="logo-icon">
//               <RealEstateIcon />
//             </div>
//             <div className="logo-text">Prometheus</div>
//           </div>

//           {/* Mobile burger — only shown for roles that have menus */}
//           {menus.length > 0 && (
//             <button
//               type="button"
//               className="topheader-burger"
//               aria-label="Toggle menu"
//               aria-expanded={mobileOpen}
//               onClick={() => setMobileOpen((v) => !v)}
//             >
//               {mobileOpen ? "✕" : "☰"}
//             </button>
//           )}

//           {/* Nav menus */}
//           <div className={mobileOpen ? "topheader-menus open" : "topheader-menus"}>
//             {menus.map((m) => {

//               /**
//                * FLAT links (Sales, SalesHead, SalesOperation, Viewer)
//                * ── rendered as NavLink but styled with topheader-dd-btn
//                *    so they look 100% identical to dropdown trigger buttons.
//                */
//               if (m.flat) {
//                 return (
//                   <NavLink
//                     key={m.to}
//                     to={m.to}
//                     className={({ isActive }) =>
//                       isActive
//                         ? "topheader-dd-btn topheader-flat-link active"
//                         : "topheader-dd-btn topheader-flat-link"
//                     }
//                     onClick={(e) => { e.preventDefault(); go(m.to); }}
//                   >
//                     {m.label}
//                   </NavLink>
//                 );
//               }

//               /* Dropdown menus (Admin, Developer, Manager, TeamMember, Uploader) */
//               return (
//                 <div
//                   className="topheader-dd"
//                   key={m.label}
//                   onMouseEnter={() => window.innerWidth > 900 && setOpenMenu(m.label)}
//                   onMouseLeave={() => window.innerWidth > 900 && setOpenMenu(null)}
//                 >
//                   <button
//                     className="topheader-dd-btn"
//                     type="button"
//                     onClick={() => {
//                       if (window.innerWidth <= 900) {
//                         setOpenMenu((prev) => (prev === m.label ? null : m.label));
//                       }
//                     }}
//                   >
//                     {m.label}
//                     <span className="topheader-caret">▼</span>
//                   </button>

//                   <div
//                     className={
//                       window.innerWidth <= 900 && openMenu === m.label
//                         ? "topheader-dd-menu mobile-open"
//                         : "topheader-dd-menu"
//                     }
//                     onMouseEnter={() => window.innerWidth > 900 && setOpenMenu(m.label)}
//                     onMouseLeave={() => window.innerWidth > 900 && setOpenMenu(null)}
//                   >
//                     {m.items.map((it) => (
//                       <NavLink
//                         key={it.to}
//                         to={it.to}
//                         className={({ isActive }) =>
//                           isActive ? "topheader-dd-item active" : "topheader-dd-item"
//                         }
//                         onClick={(e) => { e.preventDefault(); go(it.to); }}
//                       >
//                         {it.label}
//                       </NavLink>
//                     ))}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Right side — User + Logout */}
//         <div className="topheader-right">
//           <div className="topheader-dd">
//             <div
//               className="user-section"
//               onClick={() => setOpenUser((v) => !v)}
//               onMouseEnter={() => window.innerWidth > 900 && setOpenUser(true)}
//               onMouseLeave={() => window.innerWidth > 900 && setOpenUser(false)}
//             >
//               <div className="user-avatar">{userInitials}</div>
//               <div className="user-name">{userName}</div>
//               <span className="user-arrow">▼</span>
//             </div>

//             <div
//               className={
//                 openUser
//                   ? "topheader-dd-menu right mobile-open"
//                   : "topheader-dd-menu right"
//               }
//               onMouseEnter={() => window.innerWidth > 900 && setOpenUser(true)}
//               onMouseLeave={() => window.innerWidth > 900 && setOpenUser(false)}
//             >
//               <button
//                 className="topheader-dd-item"
//                 type="button"
//                 onClick={() => go("/change-password")}
//               >
//                 Change Password
//               </button>
//             </div>
//           </div>

//           <button className="topheader-logout" type="button" onClick={handleLogout}>
//             Logout
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// }










import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./TopHeader.css";
import { getMenusForRole, shouldHideNavbar } from "../../data/permissions";
import { logoutUser } from "../../services/logoutapi"; // ← logout only


const RealEstateIcon = () => (
  <svg
    className="real-estate-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 21V10L12 3L21 10V21H14V14H10V21H3Z" fill="currentColor" />
  </svg>
);

export default function TopHeader({
  userName    = "Reem Radwan",
  userEmail   = "",
  userRole    = "",
  isSuperuser = false,
  viewerPages = [],
  onLogout,
}) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu,   setOpenMenu]   = useState(null);
  const [openUser,   setOpenUser]   = useState(false);

  const hideNavbar = shouldHideNavbar(userEmail);

  const menus = useMemo(
    () => getMenusForRole(userRole, { isSuperuser, viewerPages }),
    [userRole, isSuperuser, viewerPages]
  );

  const userInitials = useMemo(
    () =>
      userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    [userName]
  );

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) {
        setMobileOpen(false);
        setOpenMenu(null);
        setOpenUser(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      setMobileOpen(false);
      setOpenMenu(null);
      setOpenUser(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(to) {
    navigate(to);
    setMobileOpen(false);
    setOpenMenu(null);
    setOpenUser(false);
  }

  async function handleLogout() {
    const res = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#c45a18",
      cancelButtonColor: "#7a7a7a",
    });

    if (!res.isConfirmed) return;

    logoutUser(); // clears localStorage

    if (onLogout) onLogout();
    else navigate("/login");
  }

  if (hideNavbar) return null;

  return (
    <header className="topheader">
      <div className="topheader-inner">

        {/* Left side — Logo + Nav */}
        <div className="topheader-left">
          <div className="topheader-logo">
            <div className="logo-icon">
              <RealEstateIcon />
            </div>
            <div className="logo-text">Prometheus</div>
          </div>

          {menus.length > 0 && (
            <button
              type="button"
              className="topheader-burger"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          )}

          <div className={mobileOpen ? "topheader-menus open" : "topheader-menus"}>
            {menus.map((m) => {
              if (m.flat) {
                return (
                  <NavLink
                    key={m.to}
                    to={m.to}
                    className={({ isActive }) =>
                      isActive
                        ? "topheader-dd-btn topheader-flat-link active"
                        : "topheader-dd-btn topheader-flat-link"
                    }
                    onClick={(e) => { e.preventDefault(); go(m.to); }}
                  >
                    {m.label}
                  </NavLink>
                );
              }

              return (
                <div
                  className="topheader-dd"
                  key={m.label}
                  onMouseEnter={() => window.innerWidth > 900 && setOpenMenu(m.label)}
                  onMouseLeave={() => window.innerWidth > 900 && setOpenMenu(null)}
                >
                  <button
                    className="topheader-dd-btn"
                    type="button"
                    onClick={() => {
                      if (window.innerWidth <= 900) {
                        setOpenMenu((prev) => (prev === m.label ? null : m.label));
                      }
                    }}
                  >
                    {m.label}
                    <span className="topheader-caret">▼</span>
                  </button>

                  <div
                    className={
                      window.innerWidth <= 900 && openMenu === m.label
                        ? "topheader-dd-menu mobile-open"
                        : "topheader-dd-menu"
                    }
                    onMouseEnter={() => window.innerWidth > 900 && setOpenMenu(m.label)}
                    onMouseLeave={() => window.innerWidth > 900 && setOpenMenu(null)}
                  >
                    {m.items.map((it) => (
                      <NavLink
                        key={it.to}
                        to={it.to}
                        className={({ isActive }) =>
                          isActive ? "topheader-dd-item active" : "topheader-dd-item"
                        }
                        onClick={(e) => { e.preventDefault(); go(it.to); }}
                      >
                        {it.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side — User + Logout */}
        <div className="topheader-right">
          <div className="topheader-dd">
            <div
              className="user-section"
              onClick={() => setOpenUser((v) => !v)}
              onMouseEnter={() => window.innerWidth > 900 && setOpenUser(true)}
              onMouseLeave={() => window.innerWidth > 900 && setOpenUser(false)}
            >
              <div className="user-avatar">{userInitials}</div>
              <div className="user-name">{userName}</div>
              <span className="user-arrow">▼</span>
            </div>

            <div
              className={
                openUser
                  ? "topheader-dd-menu right mobile-open"
                  : "topheader-dd-menu right"
              }
              onMouseEnter={() => window.innerWidth > 900 && setOpenUser(true)}
              onMouseLeave={() => window.innerWidth > 900 && setOpenUser(false)}
            >
              <button
                className="topheader-dd-item"
                type="button"
                onClick={() => go("/change-password")}
              >
                Change Password
              </button>
            </div>
          </div>

          <button className="topheader-logout" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}