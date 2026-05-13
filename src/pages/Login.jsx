import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al iniciar sesión");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user?.role === "coach") navigate("/coach");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lg-page {
          min-height: 100vh;
          display: flex;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          background: #050508;
          overflow: hidden;
        }

        /* ── LADO IZQUIERDO: FOTO ── */
        .lg-photo {
          flex: 1;
          position: relative;
          overflow: hidden;
          min-height: 100vh;
        }

          .lg-photo-sub {
  font-size: 14px;
  color: rgba(255,255,255,0.9);
  line-height: 1.7;
  max-width: 340px;
}
        /* La imagen viene del public folder: /coach-bg.png */
        .lg-photo-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          filter: contrast(1.1) brightness(0.75) saturate(0.3);
        }

        /* overlay degradado para fundir hacia el formulario */
        .lg-photo::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to right, transparent 40%, #050508 100%),
            linear-gradient(to bottom, rgba(0,0,0,.3) 0%, rgba(0,0,0,.1) 60%, rgba(0,0,0,.5) 100%);
        }

        /* texto sobre la foto */
        .lg-photo-content {
          position: absolute;
          bottom: 48px;
          left: 48px;
          z-index: 2;
          max-width: 420px;
        }
        .lg-photo-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: 2px;
          color: #FF6B35; text-transform: uppercase;
          background: rgba(255,107,53,.1);
          border: 1px solid rgba(255,107,53,.25);
          border-radius: 20px; padding: 5px 14px;
          margin-bottom: 16px;
        }
        .lg-photo-tag-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #FF6B35; box-shadow: 0 0 6px #FF6B35;
          animation: pdot 2s ease-in-out infinite;
        }
        @keyframes pdot { 0%,100%{opacity:1} 50%{opacity:.3} }

        .lg-photo-headline {
          font-size: 38px; font-weight: 900;
          color: #000000; line-height: 1.15;
          letter-spacing: -1px;
          margin-bottom: 14px;
          text-shadow: 0 2px 20px rgb(137, 129, 129);
        }
       .train {
  color: #078736; /* verde */
}

.rehab {
  color: #ff0090; /* fucsia */
}
        /* ── LADO DERECHO: FORM ── */
        .lg-right {
          width: 440px;
          flex-shrink: 0;
          background: #050508;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          position: relative;
          z-index: 3;
        }

        /* glow de fondo naranja sutil */
        .lg-right::before {
          content: '';
          position: absolute;
          top: -100px; right: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(255,107,53,.08), transparent 65%);
          pointer-events: none;
        }

        .lg-card {
          width: 100%;
          position: relative; z-index: 1;
        }

        .lg-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 40px;
        }
        .lg-logo-icon {
          width: 44px; height: 44px;
          background: rgba(255,107,53,.14);
          border: 1px solid rgba(255,107,53,.3);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .lg-logo-text { font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -.5px; }
        .lg-logo-text span { color: #FF6B35; }
        .lg-logo-badge {
          margin-left: auto;
          font-size: 9px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; color: #FF6B35;
          background: rgba(255,107,53,.1);
          border: 1px solid rgba(255,107,53,.18);
          border-radius: 6px; padding: 3px 8px;
        }

        .lg-heading { font-size: 24px; font-weight: 800; color: #f0f0fa; letter-spacing: -.5px; margin-bottom: 5px; }
        .lg-sub { font-size: 13px; color: #44445a; margin-bottom: 32px; line-height: 1.5; }

        /* form */
        .lg-form { display: flex; flex-direction: column; gap: 14px; }
        .lg-field { display: flex; flex-direction: column; gap: 6px; }
        .lg-label { font-size: 11px; font-weight: 700; color: #55556a; text-transform: uppercase; letter-spacing: .8px; }
        .lg-wrap { position: relative; }
        .lg-input {
          width: 100%; padding: 13px 16px; padding-right: 46px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 12px; color: #f0f0fa; font-size: 14px;
          outline: none; transition: border-color .2s, background .2s;
          font-family: inherit;
        }
        .lg-input:focus {
          border-color: rgba(255,107,53,.5);
          background: rgba(255,107,53,.03);
        }
        .lg-input::placeholder { color: #2a2a40; }

        .lg-eye {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          color: #44445a; cursor: pointer;
          display: flex; align-items: center; transition: color .15s;
        }
        .lg-eye:hover { color: #FF6B35; }

        .lg-error {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px;
          background: rgba(255,80,80,.07);
          border: 1px solid rgba(255,80,80,.18);
          border-radius: 10px;
          color: #ff7070; font-size: 13px; font-weight: 500;
        }

        .lg-submit {
          width: 100%; padding: 14px;
          background: #FF6B35; border: none; border-radius: 12px;
          color: #fff; font-size: 15px; font-weight: 700;
          cursor: pointer; margin-top: 4px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all .2s; position: relative; overflow: hidden;
        }
        .lg-submit::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,.12), transparent);
        }
        .lg-submit:hover:not(:disabled) {
          background: #ff8050; transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(255,107,53,.4);
        }
        .lg-submit:disabled { opacity: .55; cursor: not-allowed; transform: none; }

        .lg-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* divider sutil */
        .lg-divider {
          display: flex; align-items: center; gap: 12px; margin: 4px 0;
        }
        .lg-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,.06); }
        .lg-divider-text { font-size: 11px; color: #2a2a40; }

        /* credenciales hint */
        .lg-hint {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; color: #33334a;
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 9px; padding: 10px 12px;
        }

        /* responsive */
        @media(max-width: 900px) {
          .lg-photo { display: none; }
          .lg-right { width: 100%; padding: 40px 24px; }
        }
      `}</style>

      <div className="lg-page">

        {/* ── FOTO IZQUIERDA ── */}
        <div className="lg-photo">
          {/* 
            IMPORTANTE: copiá coach-bg.png a tu carpeta public/
            Ruta: fitness-app/public/coach-bg.png
          */}
          <img
            src="/ciach-bg.png"
            alt="Coach"
            className="lg-photo-img"
          />
          <div className="lg-photo-content">
            <div className="lg-photo-tag">
              <span className="lg-photo-tag-dot" />
              Plataforma Profesional
            </div>
           <h2 className="lg-photo-headline">
  <span className="train">Entrenamiento</span><br/>
  y <span className="rehab">Rehabilitación</span><br/>

</h2>
            <p className="lg-photo-sub">
              Un programa personalizado diseñado para acompañarte en tu progreso.
            </p>
          </div>
        </div>

        {/* ── FORMULARIO DERECHA ── */}
        <div className="lg-right">
          <div className="lg-card">

            <div className="lg-logo">
              <div className="lg-logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6.5 6.5h11M6.5 17.5h11M2 12h20M4.5 9.5v5M19.5 9.5v5"
                    stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="lg-logo-text">Aereo<span>mix</span></span>
              <span className="lg-logo-badge"></span>
            </div>

            <h1 className="lg-heading">Bienvenido de nuevo</h1>
            <p className="lg-sub">Ingresá a tu plataforma de entrenamiento</p>

            <form className="lg-form" onSubmit={handleSubmit}>

              <div className="lg-field">
                <label className="lg-label">Email</label>
                <div className="lg-wrap">
                  <input
                    className="lg-input" type="email" placeholder="tu@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    required autoComplete="email"
                  />
                </div>
              </div>

              <div className="lg-field">
                <label className="lg-label">Contraseña</label>
                <div className="lg-wrap">
                  <input
                    className="lg-input"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required autoComplete="current-password"
                  />
                  <span className="lg-eye" onClick={() => setShowPass(!showPass)}>
                    {showPass ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </span>
                </div>
              </div>

              {error && (
                <div className="lg-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button className="lg-submit" type="submit" disabled={loading}>
                {loading ? (
                  <><div className="lg-spinner" /> Ingresando...</>
                ) : (
                  <>
                    Iniciar sesión
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

      </div>
    </>
  );
}