import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  {
    path: "/coach",
    end: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
    label: "Dashboard",
  },
  {
    path: "/coach/students",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: "Alumnos",
  },
  {
    path: "/coach/workouts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11M6.5 17.5h11M2 12h20M4.5 9.5v5M19.5 9.5v5"/>
      </svg>
    ),
    label: "Rutinas",
  },
  {
    path: "/coach/history",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: "Historial",
  },
  {
    path: "/coach/stats",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    label: "Estadísticas",
  },
];

export default function CoachLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080810; }

        .cl-layout {
          display: flex;
          min-height: 100vh;
          background: #080810;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: #e2e2ee;
        }

        /* ── SIDEBAR ── */
        .cl-sidebar {
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          background: #0c0c18;
          border-right: 1px solid rgba(255,107,53,0.1);
          display: flex;
          flex-direction: column;
          padding: 20px 10px;
          z-index: 200;
          overflow: hidden;
          transition: width 0.3s cubic-bezier(.4,0,.2,1);
        }
        .cl-sidebar.open  { width: 240px; }
        .cl-sidebar.closed { width: 68px; }

        /* logo */
        .cl-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 6px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 8px;
          overflow: hidden;
        }
        .cl-logo-icon {
          width: 42px; height: 42px;
          background: rgba(255,107,53,0.14);
          border: 1px solid rgba(255,107,53,0.25);
          border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cl-logo-text {
          font-size: 18px; font-weight: 800;
          color: #fff;
          white-space: nowrap;
          letter-spacing: -0.5px;
        }
        .cl-logo-text span { color: #FF6B35; }

        /* badge */
        .cl-badge {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 10px;
          background: rgba(255,107,53,0.07);
          border: 1px solid rgba(255,107,53,0.12);
          border-radius: 8px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.4px;
          color: #FF6B35;
          margin-bottom: 16px;
          white-space: nowrap;
          overflow: hidden;
        }
        .cl-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #FF6B35;
          box-shadow: 0 0 7px #FF6B35;
          flex-shrink: 0;
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.4} }

        /* nav */
        .cl-nav { display: flex; flex-direction: column; gap: 3px; flex: 1; overflow: hidden; }

        .cl-nav-item {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 10px;
          border-radius: 10px;
          text-decoration: none;
          color: #55556a;
          transition: color .18s, background .18s;
          white-space: nowrap;
          overflow: hidden;
          position: relative;
        }
        .cl-nav-item:hover { color: #c8c8dc; background: rgba(255,255,255,0.04); }
        .cl-nav-item.active { color: #FF6B35; background: rgba(255,107,53,0.1); }
        .cl-nav-item.active::before {
          content: '';
          position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: #FF6B35;
        }
        .cl-nav-icon { flex-shrink: 0; display: flex; align-items: center; }
        .cl-nav-label { font-size: 13.5px; font-weight: 500; }

        /* bottom */
        .cl-bottom {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 12px;
          display: flex; flex-direction: column; gap: 3px;
          overflow: hidden;
        }
        .cl-user-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 10px;
          overflow: hidden; white-space: nowrap;
          background: rgba(255,255,255,0.02);
          margin-bottom: 6px;
        }
        .cl-user-av {
          width: 32px; height: 32px; border-radius: 9px;
          background: linear-gradient(135deg, #FF6B35, #ff9a6b);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff;
          flex-shrink: 0;
        }
        .cl-user-name { font-size: 13px; font-weight: 600; color: #c8c8dc; }
        .cl-sidebar-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 10px;
          border: none; cursor: pointer;
          font-size: 13px; font-weight: 500;
          background: transparent; white-space: nowrap;
          transition: background .18s, color .18s;
          overflow: hidden;
        }
        .cl-collapse-btn { color: #55556a; }
        .cl-collapse-btn:hover { background: rgba(255,255,255,0.04); color: #c8c8dc; }
        .cl-logout-btn { color: #55556a; }
        .cl-logout-btn:hover { background: rgba(255,80,80,0.1); color: #ff7070; }

        /* ── MAIN ── */
        .cl-main {
          flex: 1;
          min-height: 100vh;
          padding: 32px 36px;
          transition: margin-left 0.3s cubic-bezier(.4,0,.2,1);
          overflow-x: hidden;
        }
        .cl-main.open   { margin-left: 240px; }
        .cl-main.closed { margin-left: 68px; }
      `}</style>

      <div className="cl-layout">
        <aside className={`cl-sidebar ${collapsed ? "closed" : "open"}`}>
          {/* Logo */}
          <div className="cl-logo">
            <div className="cl-logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6.5 6.5h11M6.5 17.5h11M2 12h20M4.5 9.5v5M19.5 9.5v5" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            {!collapsed && (
              <span className="cl-logo-text">Fit<span>Coach</span></span>
            )}
          </div>

          {/* Badge */}
          {!collapsed && (
            <div className="cl-badge">
              <span className="cl-dot" />
              COACH PANEL
            </div>
          )}

          {/* Nav */}
          <nav className="cl-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `cl-nav-item ${isActive ? "active" : ""}`}
              >
                <span className="cl-nav-icon">{item.icon}</span>
                {!collapsed && <span className="cl-nav-label">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Bottom */}
          <div className="cl-bottom">
            {!collapsed && (
              <div className="cl-user-row">
                <div className="cl-user-av">
                  {(user.name || "C")[0].toUpperCase()}
                </div>
                <span className="cl-user-name">{user.name || "Coach"}</span>
              </div>
            )}

            <button className="cl-sidebar-btn cl-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .3s", flexShrink: 0 }}>
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              {!collapsed && <span>Colapsar</span>}
            </button>

            <button className="cl-sidebar-btn cl-logout-btn" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              {!collapsed && <span>Cerrar sesión</span>}
            </button>
          </div>
        </aside>

        <main className={`cl-main ${collapsed ? "closed" : "open"}`}>
          <Outlet />
        </main>
      </div>
    </>
  );
}