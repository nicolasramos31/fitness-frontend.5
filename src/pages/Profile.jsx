import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import API_URL from "../api";

function Profile() {
  const [athlete, setAthlete]               = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [newAvatar, setNewAvatar]           = useState("");
  const [saving, setSaving]                 = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;
    setAthlete(user);
    setNewAvatar(user.avatar || "");
  }, []);

  const savePhoto = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/update/${athlete._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: newAvatar })
      });
      const data = await res.json();
      const updated = { ...athlete, avatar: data.avatar || newAvatar };
      localStorage.setItem("user", JSON.stringify(updated));
      setAthlete(updated);
      setShowPhotoModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!athlete) return null;

  const initials = athlete.name
    ? athlete.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
      <style>{CSS}</style>
      <div className="pf-layout">
        <Sidebar />

        <div className="pf-main">
          <div className="pf-content">

            {/* ── HEADER ── */}
            <div className="pf-header fade-in">
              <div className="pf-avatar-wrap" onClick={() => setShowPhotoModal(true)}>
                {athlete.avatar
                  ? <img src={athlete.avatar} alt="profile" className="pf-avatar-img" />
                  : <div className="pf-avatar-initials">{initials}</div>
                }
                <div className="pf-avatar-overlay">Cambiar foto</div>
              </div>

              <div className="pf-header-info">
                <h1 className="pf-name">{athlete.name}</h1>
                <div className="pf-goal-tag">{athlete.goal || "Sin objetivo definido"}</div>
                <div className="pf-tags">
                  {athlete.level && <span className="pf-badge green">{athlete.level}</span>}
                  {athlete.goal  && <span className="pf-badge orange">{athlete.goal}</span>}
                </div>
              </div>

              <button className="pf-edit-btn" onClick={() => setShowPhotoModal(true)}>
                Cambiar foto
              </button>
            </div>

            {/* ── AVISO BLOQUEO ── */}
            <div className="pf-lock-notice fade-in">
              <span className="pf-lock-icon">🔒</span>
              <span>Los datos físicos solo pueden ser modificados por tu profe</span>
            </div>

            {/* ── DATOS FÍSICOS ── */}
            <div className="pf-section-label fade-in">Datos físicos</div>
            <div className="pf-data-grid fade-in">
              {[
                { label: "Peso",     value: athlete.weight ? `${athlete.weight} kg` : "—",   note: "Actualizado por profe" },
                { label: "Altura",   value: athlete.height ? `${athlete.height} cm` : "—",   note: "Actualizado por profe" },
                { label: "Edad",     value: athlete.age    ? `${athlete.age} años`   : "—",   note: "Actualizado por profe" },
                { label: "Nivel",    value: athlete.level  || "—",                             note: "Definido por profe" },
                { label: "Objetivo", value: athlete.goal   || "—",                             note: "Definido por profe" },
              ].map(d => (
                <div key={d.label} className="pf-data-card">
                  <div className="pf-data-label">{d.label}</div>
                  <div className="pf-data-value">{d.value}</div>
                  <div className="pf-data-note">{d.note}</div>
                </div>
              ))}
            </div>

            {/* ── STATS ── */}
            <div className="pf-section-label fade-in">Estadísticas de entrenamiento</div>
            <div className="pf-stats-grid fade-in">
              {[
                { label: "Entrenamientos", value: athlete.workouts   || 0, color: "green"  },
                { label: "Días activos",   value: athlete.activeDays || 0, color: "orange" },
                { label: "Calorías",       value: athlete.calories   || 0, color: ""       },
                { label: "Racha actual",   value: `${athlete.streak  || 0}d`, color: ""    },
              ].map(s => (
                <div key={s.label} className="pf-stat-card">
                  <div className={`pf-stat-value ${s.color === "green" ? "text-green" : s.color === "orange" ? "text-orange" : ""}`}>
                    {s.value}
                  </div>
                  <div className="pf-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── MODAL FOTO ── */}
        {showPhotoModal && (
          <div className="pf-modal-overlay" onClick={() => setShowPhotoModal(false)}>
            <div className="pf-modal" onClick={e => e.stopPropagation()}>
              <div className="pf-modal-header">
                <h2>Cambiar foto de perfil</h2>
                <button className="pf-modal-close" onClick={() => setShowPhotoModal(false)}>✕</button>
              </div>

              <div className="pf-photo-preview">
                {newAvatar
                  ? <img src={newAvatar} alt="preview" className="pf-preview-img" />
                  : <div className="pf-preview-placeholder">{initials}</div>
                }
              </div>

              <div className="pf-modal-field">
                <label>URL de la imagen</label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com/foto.jpg"
                  value={newAvatar}
                  onChange={e => setNewAvatar(e.target.value)}
                />
              </div>

              <div className="pf-modal-actions">
                <button className="pf-btn-primary" onClick={savePhoto} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar foto"}
                </button>
                <button className="pf-btn-ghost" onClick={() => setShowPhotoModal(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

const CSS = `
  * { box-sizing: border-box; }

  .pf-layout {
    display: flex;
    min-height: 100vh;
    width: 100%;
    background: #0d0d0f;
    color: #f0f0f0;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .pf-main {
    flex: 1;
    overflow-y: auto;
    padding: 32px 36px;
    min-width: 0;
  }

  .pf-content {
    max-width: 860px;
    width: 100%;
  }

  .fade-in {
    animation: pfFade 0.4s ease;
  }
  @keyframes pfFade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pf-header {
    display: flex;
    align-items: center;
    gap: 20px;
    background: #161619;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 22px 26px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .pf-avatar-wrap {
    position: relative;
    width: 76px; height: 76px;
    border-radius: 50%;
    flex-shrink: 0;
    cursor: pointer;
    border: 2px solid rgba(255,107,53,0.35);
    overflow: hidden;
  }
  .pf-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pf-avatar-initials {
    width: 100%; height: 100%;
    background: rgba(255,107,53,0.15); color: #ff6b35;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: 600;
  }
  .pf-avatar-overlay {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.65); color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; opacity: 0; transition: opacity 0.2s;
    text-align: center; padding: 4px;
  }
  .pf-avatar-wrap:hover .pf-avatar-overlay { opacity: 1; }

  .pf-header-info { flex: 1; min-width: 160px; }
  .pf-name { font-size: 22px; font-weight: 600; margin: 0 0 4px; }
  .pf-goal-tag { font-size: 13px; color: #ff6b35; margin-bottom: 10px; }
  .pf-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .pf-badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; }
  .pf-badge.green  { background: rgba(57,217,138,0.12); color: #39d98a; }
  .pf-badge.orange { background: rgba(255,107,53,0.12);  color: #ff6b35; }

  .pf-edit-btn {
    font-size: 12px; padding: 8px 18px;
    background: none; border: 1px solid rgba(255,107,53,0.4);
    color: #ff6b35; border-radius: 9px; cursor: pointer;
    transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
  }
  .pf-edit-btn:hover { background: rgba(255,107,53,0.1); }

  .pf-lock-notice {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: #555;
    background: #161619; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 9px; padding: 10px 14px; margin-bottom: 22px;
  }
  .pf-lock-icon { font-size: 14px; }

  .pf-section-label {
    font-size: 11px; color: #444;
    text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px;
  }

  .pf-data-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px; margin-bottom: 28px;
  }
  @media (max-width: 800px) { .pf-data-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 500px) { .pf-data-grid { grid-template-columns: repeat(2, 1fr); } }

  .pf-data-card {
    background: #161619; border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; padding: 14px 16px;
  }
  .pf-data-label { font-size: 10px; color: #444; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; }
  .pf-data-value { font-size: 17px; font-weight: 500; margin-bottom: 3px; }
  .pf-data-note  { font-size: 10px; color: #383838; }

  .pf-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px; margin-bottom: 28px;
  }
  @media (max-width: 600px) { .pf-stats-grid { grid-template-columns: repeat(2, 1fr); } }

  .pf-stat-card {
    background: #161619; border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; padding: 16px; text-align: center;
  }
  .pf-stat-value { font-size: 24px; font-weight: 600; margin-bottom: 4px; }
  .pf-stat-label { font-size: 11px; color: #444; }
  .text-green  { color: #39d98a; }
  .text-orange { color: #ff6b35; }

  .pf-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.78);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px;
  }
  .pf-modal {
    background: #161619; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px; padding: 28px; width: 100%; max-width: 420px;
  }
  .pf-modal-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px;
  }
  .pf-modal-header h2 { font-size: 16px; font-weight: 500; margin: 0; }
  .pf-modal-close {
    background: none; border: none; color: #555; font-size: 18px; cursor: pointer; line-height: 1;
  }
  .pf-modal-close:hover { color: #f0f0f0; }

  .pf-photo-preview {
    width: 90px; height: 90px; border-radius: 50%;
    margin: 0 auto 22px; overflow: hidden;
    border: 2px solid rgba(255,107,53,0.3);
  }
  .pf-preview-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pf-preview-placeholder {
    width: 100%; height: 100%;
    background: rgba(255,107,53,0.15); color: #ff6b35;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 600;
  }

  .pf-modal-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 22px; }
  .pf-modal-field label { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.4px; }
  .pf-modal-field input {
    background: #1e1e23; border: 1px solid rgba(255,255,255,0.1);
    color: #f0f0f0; border-radius: 8px; padding: 10px 12px;
    font-size: 13px; outline: none; transition: border-color 0.15s; font-family: inherit;
  }
  .pf-modal-field input:focus { border-color: #ff6b35; }

  .pf-modal-actions { display: flex; gap: 10px; }
  .pf-btn-primary {
    flex: 1; padding: 11px; background: #ff6b35; border: none;
    color: white; border-radius: 10px; font-size: 14px; font-weight: 500;
    cursor: pointer; transition: background 0.15s; font-family: inherit;
  }
  .pf-btn-primary:hover:not(:disabled) { background: #ff8555; }
  .pf-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .pf-btn-ghost {
    padding: 11px 20px; background: none;
    border: 1px solid rgba(255,255,255,0.12); color: #777;
    border-radius: 10px; font-size: 14px; cursor: pointer;
    transition: all 0.15s; font-family: inherit;
  }
  .pf-btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: #f0f0f0; }
`;

export default Profile;