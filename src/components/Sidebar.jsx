import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "◈", label: "inicio" },
 
  { to: "/progress",  icon: "◌", label: "Progreso" },
  { to: "/profile",   icon: "◉", label: "Perfil" },
  { to: "/payment",   icon: "◉", label: "pagos" },
   { to: "/medicalfiles",   icon: "◉", label: "archivos" },
];

function Sidebar() {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  return (
    <>
      <style>{CSS}</style>
      <div className="sb-wrap">
        <aside className={`sb-sidebar ${open ? "open" : "closed"}`}>

          <div className="sb-logo">
            {open
              ? <><span className="sb-logo-main">AEREO MIX</span><span className="sb-logo-sub">menu de alumno</span></>
              : <span className="sb-logo-icon">A</span>
            }
          </div>

          <nav className="sb-nav">
            {open && <div className="sb-nav-label">Menú</div>}
            {NAV_ITEMS.map(item => {
              const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`sb-item ${active ? "active" : ""}`}
                  title={!open ? item.label : undefined}
                >
                  <span className="sb-icon">{item.icon}</span>
                  {open && <span className="sb-label">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="sb-footer">
            <button
              className="sb-logout"
              onClick={() => { localStorage.clear(); window.location.href = "/"; }}
            >
              <span>⎋</span>
              {open && <span>Salir</span>}
            </button>
          </div>
        </aside>

        <button
          className={`sb-toggle ${open ? "left-open" : "left-closed"}`}
          onClick={() => setOpen(!open)}
          aria-label="Toggle sidebar"
        >
          {open ? "‹" : "›"}
        </button>
      </div>
    </>
  );
}

const CSS = `
  .sb-wrap {
    position: relative;
    display: flex;
    height: 100vh;
    flex-shrink: 0;
  }

  .sb-sidebar {
    display: flex;
    flex-direction: column;
    background: #161619;
    border-right: 1px solid rgba(255,255,255,0.07);
    height: 100vh;
    transition: width 0.25s ease;
    overflow: hidden;
    position: sticky;
    top: 0;
  }
  .sb-sidebar.open   { width: 210px; }
  .sb-sidebar.closed { width: 64px; }

  /* LOGO */
  .sb-logo {
    padding: 20px 16px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    min-height: 64px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .sb-logo-main { font-size: 16px; font-weight: 600; color: #ff6b35; }
  .sb-logo-sub  { font-size: 11px; color: #555; margin-top: 2px; }
  .sb-logo-icon { font-size: 18px; font-weight: 700; color: #ff6b35; }

  /* NAV */
  .sb-nav { flex: 1; padding: 12px 0; display: flex; flex-direction: column; }
  .sb-nav-label {
    font-size: 10px; color: #444; padding: 8px 16px 4px;
    text-transform: uppercase; letter-spacing: 0.8px;
  }

  .sb-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px; color: #777; text-decoration: none;
    font-size: 13px; transition: background 0.15s, color 0.15s;
    border-left: 2px solid transparent;
  }
  .sb-item:hover { background: #1e1e23; color: #f0f0f0; }
  .sb-item.active {
    background: rgba(255,107,53,0.1);
    color: #ff6b35;
    border-left-color: #ff6b35;
  }
  .sb-icon { font-size: 15px; flex-shrink: 0; }
  .sb-label { white-space: nowrap; }

  /* FOOTER */
  .sb-footer {
    padding: 12px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }
  .sb-logout {
    display: flex; align-items: center; gap: 8px;
    background: none; border: 1px solid rgba(255,255,255,0.1);
    color: #666; padding: 7px 12px; border-radius: 8px;
    font-size: 12px; cursor: pointer; width: 100%;
    transition: all 0.15s; white-space: nowrap; overflow: hidden;
  }
  .sb-logout:hover { border-color: #ff6b35; color: #ff6b35; }

  /* TOGGLE BUTTON */
  .sb-toggle {
    position: absolute;
    top: 20px;
    background: #1e1e23;
    border: 1px solid rgba(255,255,255,0.1);
    color: #888;
    width: 22px; height: 22px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px; line-height: 1;
    transition: all 0.15s; z-index: 10;
  }
  .sb-toggle.left-open   { left: calc(210px - 11px); }
  .sb-toggle.left-closed { left: calc(64px - 11px); }
  .sb-toggle:hover { border-color: #ff6b35; color: #ff6b35; background: #161619; }
`;

export default Sidebar;