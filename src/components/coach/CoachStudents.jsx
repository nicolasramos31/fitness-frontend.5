import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API_URL from "../../api";

const LEVELS = ["beginner", "intermediate", "advanced"];
const GOALS = ["Perder peso", "Ganar músculo", "Tonificar", "Resistencia", "Flexibilidad", "Rendimiento"];
const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: i * 0.06 } });

export default function CoachStudents() {
  const token = localStorage.getItem("token");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setStudents(d.students || d || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const openEdit = (s) => {
    setSelected(s);
    setForm({
      weight: s.weight ?? "",
      height: s.height ?? "",
      age:    s.age    ?? "",
      goal:   s.goal   || "",
      level:  s.level  || "beginner",
    });
  };

  // 🔥 FIX: manejo de error real + URL corregida
  const handleSave = async () => {
    setSaving(true);
    try {
      const url = `${API_URL}/auth/students/${selected._id}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      // 🔥 Verificar que la respuesta sea JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`El servidor respondió inesperadamente (${res.status}). Verificá que el backend esté corriendo.`);
      }

      const data = await res.json();

      if (!res.ok) {
        // Mostrar el mensaje real del backend (ej: "Solo el coach puede modificar datos del alumno")
        throw new Error(data.message || `Error ${res.status}`);
      }

      await fetchStudents();
      setSelected(null);
      showToast("✅ Perfil actualizado");

    } catch (err) {
      showToast("❌ " + err.message, "err");
    }
    setSaving(false);
  };

  const filtered = students.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        .cs-wrap { max-width: 1100px; }

        .cs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .cs-title { font-size: 22px; font-weight: 800; color: #f0f0fa; }
        .cs-sub   { font-size: 13px; color: #55556a; margin-top: 2px; }

        .cs-search {
          display: flex; align-items: center; gap: 10px;
          background: #0c0c18; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 11px; padding: 9px 14px; width: 260px;
        }
        .cs-search input { background: none; border: none; outline: none; color: #e2e2ee; font-size: 13px; flex: 1; }
        .cs-search input::placeholder { color: #44445a; }

        .cs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }

        .cs-card {
          background: #0c0c18; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 20px;
          transition: border-color .2s, transform .2s;
        }
        .cs-card:hover { border-color: rgba(255,107,53,.2); transform: translateY(-2px); }

        .cs-card-top { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .cs-avatar {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(255,107,53,.15); color: #FF6B35;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 800; flex-shrink: 0; overflow: hidden;
        }
        .cs-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .cs-name  { font-size: 15px; font-weight: 700; color: #f0f0fa; }
        .cs-email { font-size: 12px; color: #44445a; margin-top: 2px; }

        .cs-level {
          margin-left: auto; font-size: 10px; font-weight: 700;
          padding: 3px 10px; border-radius: 20px; text-transform: capitalize;
        }
        .cs-level.beginner     { background: rgba(16,185,129,.12); color: #10B981; }
        .cs-level.intermediate { background: rgba(59,130,246,.12); color: #3B82F6; }
        .cs-level.advanced     { background: rgba(255,107,53,.12); color: #FF6B35; }

        .cs-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .cs-meta-item { background: rgba(255,255,255,0.03); border-radius: 9px; padding: 10px 12px; }
        .cs-meta-val  { font-size: 16px; font-weight: 700; color: #e2e2ee; }
        .cs-meta-key  { font-size: 10px; color: #44445a; margin-top: 2px; text-transform: uppercase; letter-spacing: .5px; }

        .cs-goal { font-size: 12px; color: #8888a0; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 9px; margin-bottom: 14px; }
        .cs-goal span { color: #FF6B35; font-weight: 600; }

        .cs-edit-btn {
          width: 100%; padding: 9px; border-radius: 10px;
          background: rgba(255,107,53,.08); border: 1px solid rgba(255,107,53,.15);
          color: #FF6B35; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all .18s;
        }
        .cs-edit-btn:hover { background: rgba(255,107,53,.15); }

        .cs-empty { text-align: center; padding: 60px 20px; color: #33334a; }
        .cs-empty svg { width: 48px; height: 48px; opacity: .3; margin-bottom: 12px; }

        /* MODAL */
        .cs-backdrop {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(0,0,0,.75); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .cs-modal {
          background: #0f0f1e; border: 1px solid rgba(255,107,53,.15);
          border-radius: 18px; padding: 28px; width: 100%; max-width: 460px;
        }
        .cs-modal h2 { font-size: 18px; font-weight: 700; color: #f0f0fa; margin-bottom: 4px; }
        .cs-modal-sub { font-size: 12px; color: #55556a; margin-bottom: 22px; }

        .cs-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cs-field { display: flex; flex-direction: column; gap: 5px; }
        .cs-field.full { grid-column: 1 / -1; }
        .cs-label { font-size: 11px; font-weight: 600; color: #55556a; text-transform: uppercase; letter-spacing: .8px; }
        .cs-inp {
          padding: 10px 13px; border-radius: 9px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: #e2e2ee; font-size: 14px; outline: none; transition: border-color .18s;
        }
        .cs-inp:focus { border-color: rgba(255,107,53,.4); }
        select.cs-inp { cursor: pointer; }

        .cs-note { font-size: 11px; color: #44445a; background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.04); border-radius: 8px; padding: 10px 12px; grid-column: 1/-1; }

        .cs-modal-actions { display: flex; gap: 10px; margin-top: 22px; justify-content: flex-end; }
        .cs-btn { padding: 9px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all .18s; }
        .cs-btn-primary { background: #FF6B35; color: #fff; }
        .cs-btn-primary:hover { background: #ff8050; }
        .cs-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .cs-btn-ghost { background: rgba(255,255,255,0.05); color: #c8c8dc; border: 1px solid rgba(255,255,255,0.08); }
        .cs-btn-ghost:hover { background: rgba(255,255,255,0.09); }

        /* toast */
        .cs-toast {
          position: fixed; bottom: 28px; right: 28px; z-index: 999;
          padding: 12px 20px; border-radius: 12px; font-size: 13px; font-weight: 600;
          animation: stUp .3s ease; max-width: 380px; line-height: 1.4;
        }
        .cs-toast.ok  { background: rgba(16,185,129,.15); border: 1px solid rgba(16,185,129,.3); color: #10B981; }
        .cs-toast.err { background: rgba(255,80,80,.12); border: 1px solid rgba(255,80,80,.25); color: #ff7070; }
        @keyframes stUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        @media(max-width:600px) { .cs-form-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="cs-wrap">
        <div className="cs-header">
          <div>
            <h1 className="cs-title">Mis Alumnos</h1>
            <p className="cs-sub">{students.length} alumnos registrados</p>
          </div>
          <div className="cs-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#55556a" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar alumno..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="cs-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 220, background: "#0c0c18", borderRadius: 16, animation: "blink 1.5s infinite" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="cs-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p>{search ? "Sin resultados para tu búsqueda" : "No hay alumnos registrados aún"}</p>
          </div>
        ) : (
          <div className="cs-grid">
            {filtered.map((s, i) => (
              <motion.div key={s._id} className="cs-card" {...fade(i)}>
                <div className="cs-card-top">
                  <div className="cs-avatar">
                    {s.profileImage
                      ? <img src={s.profileImage} alt={s.name} />
                      : (s.name || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="cs-name">{s.name}</div>
                    <div className="cs-email">{s.email}</div>
                  </div>
                  <span className={`cs-level ${s.level || "beginner"}`}>
                    {s.level === "intermediate" ? "Intermedio" : s.level === "advanced" ? "Avanzado" : "Básico"}
                  </span>
                </div>

                <div className="cs-meta">
                  <div className="cs-meta-item">
                    <div className="cs-meta-val">{s.weight ? `${s.weight} kg` : "—"}</div>
                    <div className="cs-meta-key">Peso</div>
                  </div>
                  <div className="cs-meta-item">
                    <div className="cs-meta-val">{s.height ? `${s.height} cm` : "—"}</div>
                    <div className="cs-meta-key">Altura</div>
                  </div>
                  <div className="cs-meta-item">
                    <div className="cs-meta-val">{s.age ? `${s.age} años` : "—"}</div>
                    <div className="cs-meta-key">Edad</div>
                  </div>
                  <div className="cs-meta-item">
                    <div className="cs-meta-val">{s.workoutsCount || "0"}</div>
                    <div className="cs-meta-key">Entrenos</div>
                  </div>
                </div>

                <div className="cs-goal">
                  Objetivo: <span>{s.goal || "Sin definir"}</span>
                </div>

                <button className="cs-edit-btn" onClick={() => openEdit(s)}>
                  ✏️ Editar perfil del alumno
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de edición */}
      <AnimatePresence>
        {selected && (
          <div className="cs-backdrop" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
            <motion.div
              className="cs-modal"
              initial={{ opacity: 0, scale: .95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: .95 }}
              transition={{ duration: .22 }}
            >
              <h2>Editar alumno</h2>
              <p className="cs-modal-sub">{selected.name} · {selected.email}</p>

              <div className="cs-form-grid">
                <div className="cs-field">
                  <label className="cs-label">Peso (kg)</label>
                  <input
                    type="number" className="cs-inp"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="70"
                  />
                </div>
                <div className="cs-field">
                  <label className="cs-label">Altura (cm)</label>
                  <input
                    type="number" className="cs-inp"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    placeholder="170"
                  />
                </div>
                <div className="cs-field">
                  <label className="cs-label">Edad</label>
                  <input
                    type="number" className="cs-inp"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="25"
                  />
                </div>
                <div className="cs-field">
                  <label className="cs-label">Nivel</label>
                  <select
                    className="cs-inp"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l === "beginner" ? "Principiante" : l === "intermediate" ? "Intermedio" : "Avanzado"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cs-field full">
                  <label className="cs-label">Objetivo</label>
                  <select
                    className="cs-inp"
                    value={form.goal}
                    onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <p className="cs-note">
                  ℹ️ Solo el coach puede modificar estos datos. El atleta solo puede cambiar su foto de perfil.
                </p>
              </div>

              <div className="cs-modal-actions">
                <button className="cs-btn cs-btn-ghost" onClick={() => setSelected(null)}>
                  Cancelar
                </button>
                <button className="cs-btn cs-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {toast && <div className={`cs-toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}