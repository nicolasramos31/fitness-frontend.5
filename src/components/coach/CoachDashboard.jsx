import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import API_URL from "../../api";

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay: i * 0.07, ease: "easeOut" },
});

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function StatCard({ icon, label, value, sub, accent, index }) {
  return (
    <motion.div className="cd-stat" style={{ "--accent": accent }} {...fade(index)}>
      <div className="cd-stat-icon" style={{ background: `${accent}18`, color: accent }}>{icon}</div>
      <div>
        <div className="cd-stat-value">{value}</div>
        <div className="cd-stat-label">{label}</div>
        {sub && <div className="cd-stat-sub">{sub}</div>}
      </div>
      <div className="cd-stat-shine" />
    </motion.div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="cd-minibar">
      <div className="cd-minibar-head">
        <span>{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="cd-minibar-track">
        <motion.div
          className="cd-minibar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export default function CoachDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [students, setStudents] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal rutina
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState("");
  const [blocks, setBlocks] = useState([{ name: "Bloque A", exercises: [{ name: "", reps: "", video: "" }] }]);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  // Modal crear usuario
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "student" });
  const [newUserLoading, setNewUserLoading] = useState(false);
  const [newUserMsg, setNewUserMsg] = useState("");
  const [newUserErr, setNewUserErr] = useState("");

  useEffect(() => {
    if (!user || user.role !== "coach") navigate("/dashboard");
  }, []);

  const loadData = async () => {
    try {
      const [sRes, wRes] = await Promise.all([
        fetch(`${API_URL}/auth/students`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/workouts`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (sRes.ok) { const d = await sRes.json(); setStudents(d.students || d || []); }
      if (wRes.ok) { const d = await wRes.json(); setWorkouts(d.workouts || d || []); }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [token]);

  // ── Rutina helpers (lógica original intacta) ──
  const addBlock = () => setBlocks([...blocks, { name: `Bloque ${String.fromCharCode(65 + blocks.length)}`, exercises: [{ name: "", reps: "", video: "" }] }]);
  const addExercise = (bi) => { const u = [...blocks]; u[bi].exercises.push({ name: "", reps: "", video: "" }); setBlocks(u); };
  const handleBlockNameChange = (i, v) => { const u = [...blocks]; u[i].name = v; setBlocks(u); };
  const handleExerciseChange = (bi, ei, field, v) => { const u = [...blocks]; u[bi].exercises[ei][field] = v; setBlocks(u); };
  const removeBlock = (i) => setBlocks(blocks.filter((_, idx) => idx !== i));
  const removeExercise = (bi, ei) => { const u = [...blocks]; u[bi].exercises = u[bi].exercises.filter((_, idx) => idx !== ei); setBlocks(u); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setFormError("");
    if (!title || !userId) { setFormError("Faltan datos"); return; }
    try {
      const res = await fetch(`${API_URL}/workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, blocks, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear rutina");
      setMessage("🔥 Rutina creada con éxito");
      setTitle(""); setDescription(""); setUserId("");
      setBlocks([{ name: "Bloque A", exercises: [{ name: "", reps: "", video: "" }] }]);
      setShowForm(false);
      const wRes = await fetch(`${API_URL}/workouts`, { headers: { Authorization: `Bearer ${token}` } });
      if (wRes.ok) { const d = await wRes.json(); setWorkouts(d.workouts || d || []); }
    } catch (err) { setFormError(err.message); }
  };

  // ── CREAR NUEVO USUARIO ──
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setNewUserMsg(""); setNewUserErr("");

    const { name, email, password, role } = newUser;

    if (!name.trim() || !email.trim() || !password.trim()) {
      setNewUserErr("Completá todos los campos: nombre, email y contraseña.");
      return;
    }

    setNewUserLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || `Error ${res.status}`);
      }

      setNewUserMsg(`✅ Usuario "${name}" creado como ${role === "coach" ? "Coach" : "Atleta"}`);
      setNewUser({ name: "", email: "", password: "", role: "student" });
      await loadData();
      setTimeout(() => { setShowNewUser(false); setNewUserMsg(""); }, 2200);

    } catch (err) {
      setNewUserErr(`❌ ${err.message}`);
    } finally {
      setNewUserLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const barData = weekDays.map((d, i) => ({ d, v: [3, 5, 2, 7, 4, 1, 0][i] }));
  const maxBar = Math.max(...barData.map((x) => x.v), 1);

  const closeNewUserModal = () => {
    setShowNewUser(false);
    setNewUserErr("");
    setNewUserMsg("");
    setNewUser({ name: "", email: "", password: "", role: "student" });
  };

  return (
    <>
      <style>{`
        .cd-wrap { max-width: 1280px; }

        .cd-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:28px; flex-wrap:wrap; gap:14px; }
        .cd-greeting { font-size:12px; color:#55556a; margin-bottom:3px; letter-spacing:.5px; text-transform:uppercase; }
        .cd-title    { font-size:26px; font-weight:800; color:#f0f0fa; letter-spacing:-.5px; }
        .cd-sub      { font-size:13px; color:#55556a; margin-top:3px; }
        .cd-header-btns { display:flex; gap:10px; flex-wrap:wrap; }

        .cd-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:9px 18px; border-radius:10px;
          font-size:13px; font-weight:600;
          text-decoration:none; cursor:pointer; border:none; transition:all .18s;
        }
        .cd-btn-primary { background:#FF6B35; color:#fff; }
        .cd-btn-primary:hover { background:#ff8050; transform:translateY(-1px); }
        .cd-btn-ghost { background:rgba(255,255,255,.05); color:#c8c8dc; border:1px solid rgba(255,255,255,.08); }
        .cd-btn-ghost:hover { background:rgba(255,255,255,.09); }
        .cd-btn-green { background:rgba(16,185,129,.12); color:#10B981; border:1px solid rgba(16,185,129,.2); }
        .cd-btn-green:hover { background:rgba(16,185,129,.2); }

        .cd-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:22px; }
        .cd-stat {
          position:relative; overflow:hidden;
          background:#0c0c18; border:1px solid rgba(255,255,255,.06);
          border-radius:14px; padding:18px 20px;
          display:flex; align-items:center; gap:14px; transition:border-color .2s;
        }
        .cd-stat:hover { border-color:rgba(255,107,53,.2); }
        .cd-stat-icon { width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .cd-stat-value { font-size:24px; font-weight:800; color:#f0f0fa; line-height:1; }
        .cd-stat-label { font-size:12px; color:#55556a; margin-top:4px; font-weight:500; }
        .cd-stat-sub   { font-size:11px; color:#33334a; margin-top:2px; }
        .cd-stat-shine { position:absolute; top:0; right:0; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,107,53,0.03)); pointer-events:none; }

        .cd-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
        .cd-panel { background:#0c0c18; border:1px solid rgba(255,255,255,.06); border-radius:16px; padding:22px; }
        .cd-panel-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
        .cd-panel-title { font-size:14px; font-weight:700; color:#e2e2ee; }
        .cd-panel-tag { font-size:11px; background:rgba(255,107,53,.1); color:#FF6B35; padding:3px 10px; border-radius:20px; font-weight:600; }
        .cd-panel-link { font-size:12px; color:#FF6B35; text-decoration:none; }
        .cd-panel-link:hover { color:#ff8050; }

        .cd-bars { display:flex; align-items:flex-end; gap:8px; height:120px; }
        .cd-bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; height:100%; }
        .cd-bar-track { flex:1; width:100%; background:rgba(255,255,255,.04); border-radius:6px; display:flex; align-items:flex-end; overflow:hidden; }
        .cd-bar-fill { width:100%; border-radius:5px; min-height:3px; }
        .cd-bar-day { font-size:10px; color:#55556a; }
        .cd-bar-n   { font-size:10px; color:#33334a; }

        .cd-s-list { display:flex; flex-direction:column; gap:8px; }
        .cd-s-row { display:flex; align-items:center; gap:11px; padding:9px 10px; border-radius:10px; background:rgba(255,255,255,.02); transition:background .15s; }
        .cd-s-row:hover { background:rgba(255,255,255,.04); }
        .cd-s-av { width:36px; height:36px; border-radius:10px; background:rgba(255,107,53,.15); color:#FF6B35; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0; overflow:hidden; }
        .cd-s-av img { width:100%; height:100%; object-fit:cover; }
        .cd-s-name { font-size:13px; font-weight:600; color:#e2e2ee; }
        .cd-s-meta { font-size:11px; color:#55556a; }
        .cd-s-badge { margin-left:auto; font-size:10px; font-weight:700; padding:3px 9px; border-radius:6px; text-transform:capitalize; }
        .cd-s-badge.beginner     { background:rgba(16,185,129,.12); color:#10B981; }
        .cd-s-badge.intermediate { background:rgba(59,130,246,.12); color:#3B82F6; }
        .cd-s-badge.advanced     { background:rgba(255,107,53,.12); color:#FF6B35; }

        .cd-minibars { display:flex; flex-direction:column; gap:14px; }
        .cd-minibar-head { display:flex; justify-content:space-between; font-size:12px; color:#8888a0; margin-bottom:6px; }
        .cd-minibar-track { height:5px; background:rgba(255,255,255,.05); border-radius:3px; overflow:hidden; }
        .cd-minibar-fill { height:100%; border-radius:3px; }

        .cd-qas { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .cd-qa {
          display:flex; align-items:center; gap:10px; padding:13px; border-radius:11px;
          background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.05);
          text-decoration:none; color:#c8c8dc; font-size:13px; font-weight:500;
          transition:all .18s; cursor:pointer;
        }
        .cd-qa:hover { background:rgba(255,255,255,.05); border-color:var(--c,#FF6B35); transform:translateY(-1px); }
        .cd-qa-ic { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* toast */
        .cd-toast { position:fixed; bottom:28px; right:28px; z-index:999; padding:12px 20px; border-radius:12px; font-size:13px; font-weight:600; animation:slideUp .3s ease; }
        .cd-toast.ok  { background:rgba(16,185,129,.15); border:1px solid rgba(16,185,129,.3); color:#10B981; }
        .cd-toast.err { background:rgba(255,80,80,.12); border:1px solid rgba(255,80,80,.25); color:#ff7070; }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        /* ── MODAL BASE ── */
        .cd-backdrop {
          position:fixed; inset:0; z-index:500;
          background:rgba(0,0,0,.78); backdrop-filter:blur(5px);
          display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .cd-modal {
          background:#0f0f1e; border:1px solid rgba(255,107,53,.15);
          border-radius:18px; padding:28px;
          width:100%; max-width:600px; max-height:88vh; overflow-y:auto;
        }
        .cd-modal h2 { font-size:18px; font-weight:700; color:#f0f0fa; margin-bottom:20px; }

        .cd-field { margin-bottom:12px; }
        .cd-field label { display:block; font-size:11px; font-weight:600; color:#55556a; text-transform:uppercase; letter-spacing:.8px; margin-bottom:5px; }
        .cd-input {
          width:100%; padding:10px 14px; border-radius:10px;
          background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
          color:#e2e2ee; font-size:14px; outline:none; transition:border-color .18s;
          font-family:inherit;
        }
        .cd-input:focus { border-color:rgba(255,107,53,.4); }
        .cd-input.textarea { resize:vertical; min-height:72px; }

        .cd-block-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:12px; padding:14px; margin-bottom:12px; }
        .cd-block-title { display:flex; gap:10px; align-items:center; margin-bottom:12px; }
        .cd-ex-row { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
        .cd-ex-row .cd-input { flex:1; }
        .cd-rm-btn { background:rgba(255,80,80,.1); border:none; color:#ff7070; width:32px; height:32px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background .15s; }
        .cd-rm-btn:hover { background:rgba(255,80,80,.2); }
        .cd-add-btn { background:rgba(255,255,255,.04); border:1px dashed rgba(255,255,255,.1); color:#8888a0; padding:8px 14px; border-radius:9px; cursor:pointer; font-size:12px; font-weight:500; transition:all .15s; }
        .cd-add-btn:hover { background:rgba(255,255,255,.07); color:#c8c8dc; }
        .cd-modal-actions { display:flex; gap:10px; margin-top:20px; justify-content:flex-end; }

        /* ── MODAL NUEVO USUARIO ── */
        .nu-modal {
          background:#0f0f1e; border:1px solid rgba(16,185,129,.18);
          border-radius:18px; padding:28px;
          width:100%; max-width:480px;
        }
        .nu-modal h2 { font-size:18px; font-weight:700; color:#f0f0fa; margin-bottom:6px; }
        .nu-modal-sub { font-size:13px; color:#55556a; margin-bottom:24px; }

        .nu-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .nu-field { display:flex; flex-direction:column; gap:5px; }
        .nu-field.full { grid-column:1/-1; }
        .nu-label { font-size:11px; font-weight:700; color:#55556a; text-transform:uppercase; letter-spacing:.7px; }
        .nu-input {
          padding:11px 13px; border-radius:10px;
          background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
          color:#e2e2ee; font-size:14px; outline:none;
          transition:border-color .18s; font-family:inherit;
        }
        .nu-input:focus { border-color:rgba(16,185,129,.4); }
        .nu-input::placeholder { color:#2a2a40; }

        /* role selector */
        .nu-roles { display:grid; grid-template-columns:1fr 1fr; gap:8px; grid-column:1/-1; }
        .nu-role {
          padding:12px; border-radius:11px;
          border:2px solid rgba(255,255,255,.06);
          cursor:pointer; transition:all .18s;
          display:flex; flex-direction:column; align-items:center; gap:6px;
          text-align:center; background: transparent;
        }
        .nu-role:hover { border-color: rgba(255,255,255,.15); }
        .nu-role.selected-athlete { border-color:#3B82F6; background:rgba(59,130,246,.08); }
        .nu-role.selected-coach   { border-color:#FF6B35; background:rgba(255,107,53,.08); }
        .nu-role-ico { font-size:22px; }
        .nu-role-name { font-size:12px; font-weight:700; color:#c8c8dc; }
        .nu-role-desc { font-size:10px; color:#55556a; }

        .nu-ok  { background:rgba(16,185,129,.12); border:1px solid rgba(16,185,129,.25); color:#10B981; padding:10px 14px; border-radius:10px; font-size:13px; font-weight:600; margin-top:8px; text-align:center; }
        .nu-err { background:rgba(255,80,80,.08); border:1px solid rgba(255,80,80,.2); color:#ff7070; padding:10px 14px; border-radius:10px; font-size:13px; margin-top:8px; line-height:1.5; }

        .nu-pass-note { font-size:11px; color:#44445a; background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.04); border-radius:8px; padding:9px 12px; grid-column:1/-1; }

        /* debug info box */
        .nu-debug { font-size:11px; color:#44445a; background:rgba(255,255,255,.02); border:1px dashed rgba(255,255,255,.07); border-radius:8px; padding:10px 12px; margin-top:8px; grid-column:1/-1; line-height:1.6; }
        .nu-debug strong { color:#8888a0; }

        .cd-skel { height:44px; background:rgba(255,255,255,.03); border-radius:10px; margin-bottom:8px; animation:bl 1.5s infinite; }
        @keyframes bl { 0%,100%{opacity:.4} 50%{opacity:.8} }
        .cd-empty { text-align:center; color:#33334a; padding:24px; font-size:13px; }

        @media(max-width:900px) {
          .cd-stats { grid-template-columns:1fr 1fr; }
          .cd-grid  { grid-template-columns:1fr; }
        }
        @media(max-width:500px) { .cd-stats { grid-template-columns:1fr; } }
      `}</style>

      <div className="cd-wrap">
        {/* Header */}
        <div className="cd-header">
          <div>
            <p className="cd-greeting">{greeting}, profe</p>
            <h1 className="cd-title">{user.name || "Coach"} 👋</h1>
            <p className="cd-sub">Resumen de actividad de tus alumnos</p>
          </div>
          <div className="cd-header-btns">
            <button className="cd-btn cd-btn-green" onClick={() => setShowNewUser(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              Nuevo Usuario
            </button>
            <button className="cd-btn cd-btn-primary" onClick={() => setShowForm(true)}>
              + Nueva Rutina
            </button>
            <Link to="/coach/students" className="cd-btn cd-btn-ghost">Ver Alumnos</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="cd-stats">
          <StatCard index={0} icon={<IcoUsers />} label="Alumnos" value={loading ? "—" : students.length} sub="Registrados" accent="#FF6B35" />
          <StatCard index={1} icon={<IcoDumbbell />} label="Rutinas" value={loading ? "—" : workouts.length} sub="Creadas" accent="#3B82F6" />
          <StatCard index={2} icon={<IcoFire />} label="Activos Hoy" value="—" sub="En entrenamiento" accent="#10B981" />
          <StatCard index={3} icon={<IcoTrend />} label="Adherencia" value="—%" sub="Promedio" accent="#A855F7" />
        </div>

        {/* Grid */}
        <div className="cd-grid">
          <motion.div className="cd-panel" {...fade(4)}>
            <div className="cd-panel-head">
              <span className="cd-panel-title">Actividad Semanal</span>
              <span className="cd-panel-tag">Esta semana</span>
            </div>
            <div className="cd-bars">
              {barData.map((b, i) => (
                <div key={b.d} className="cd-bar-col">
                  <div className="cd-bar-track">
                    <motion.div
                      className="cd-bar-fill"
                      initial={{ height: 0 }}
                      animate={{ height: `${(b.v / maxBar) * 100}%` }}
                      transition={{ delay: 0.4 + i * 0.06, duration: 0.55, ease: "easeOut" }}
                      style={{ background: b.v === maxBar ? "linear-gradient(180deg,#FF6B35,#ff9060)" : "rgba(255,107,53,.25)" }}
                    />
                  </div>
                  <span className="cd-bar-day">{b.d}</span>
                  <span className="cd-bar-n">{b.v}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="cd-panel" {...fade(5)}>
            <div className="cd-panel-head"><span className="cd-panel-title">Progreso General</span></div>
            <div className="cd-minibars">
              <MiniBar label="Adherencia"          value={78} max={100} color="#FF6B35" />
              <MiniBar label="Rutinas completadas" value={64} max={100} color="#10B981" />
              <MiniBar label="Nuevos alumnos"      value={30} max={100} color="#3B82F6" />
              <MiniBar label="Obj. mensuales"      value={62} max={100} color="#A855F7" />
            </div>
          </motion.div>

          <motion.div className="cd-panel" {...fade(6)}>
            <div className="cd-panel-head">
              <span className="cd-panel-title">Alumnos Recientes</span>
              <Link to="/coach/students" className="cd-panel-link">Ver todos →</Link>
            </div>
            {loading ? (
              <><div className="cd-skel"/><div className="cd-skel"/><div className="cd-skel"/></>
            ) : students.length === 0 ? (
              <div className="cd-empty">
                <p>Sin alumnos aún</p>
                <button className="cd-btn cd-btn-green" style={{ margin: "12px auto 0", fontSize: 12 }} onClick={() => setShowNewUser(true)}>
                  + Crear primer alumno
                </button>
              </div>
            ) : (
              <div className="cd-s-list">
                {students.slice(0, 5).map((s, i) => (
                  <motion.div key={s._id} className="cd-s-row" {...fade(i)}>
                    <div className="cd-s-av">
                      {s.profileImage ? <img src={s.profileImage} alt={s.name}/> : (s.name||"?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="cd-s-name">{s.name}</div>
                      <div className="cd-s-meta">{s.goal || "Sin objetivo"}</div>
                    </div>
                    <span className={`cd-s-badge ${s.level || "beginner"}`}>{s.level || "Básico"}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div className="cd-panel" {...fade(7)}>
            <div className="cd-panel-head"><span className="cd-panel-title">Acciones Rápidas</span></div>
            <div className="cd-qas">
              {[
                { label: "Nuevo Usuario", icon: "👤", onClick: () => setShowNewUser(true), to: null, color: "#10B981" },
                { label: "Crear Rutina",  icon: "🏋️", onClick: () => setShowForm(true),   to: null, color: "#FF6B35" },
                { label: "Ver Alumnos",   icon: "👥", to: "/coach/students",               color: "#3B82F6" },
                { label: "Estadísticas",  icon: "📊", to: "/coach/stats",                  color: "#A855F7" },
              ].map((a) =>
                a.to ? (
                  <Link key={a.label} to={a.to} className="cd-qa" style={{ "--c": a.color }}>
                    <span className="cd-qa-ic" style={{ background: `${a.color}18`, fontSize: 18 }}>{a.icon}</span>
                    {a.label}
                  </Link>
                ) : (
                  <button key={a.label} className="cd-qa" style={{ "--c": a.color }} onClick={a.onClick}>
                    <span className="cd-qa-ic" style={{ background: `${a.color}18`, fontSize: 18 }}>{a.icon}</span>
                    {a.label}
                  </button>
                )
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── MODAL: NUEVO USUARIO ── */}
      {showNewUser && (
        <div className="cd-backdrop" onClick={(e) => e.target === e.currentTarget && closeNewUserModal()}>
          <motion.div className="nu-modal" initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .25 }}>
            <h2>👤 Crear nuevo usuario</h2>
            <p className="nu-modal-sub">El usuario recibirá sus credenciales para ingresar a la plataforma</p>

            <form onSubmit={handleCreateUser}>
              <div className="nu-grid">

                {/* Tipo de usuario */}
                <div style={{ gridColumn: "1/-1", marginBottom: 4 }}>
                  <div className="nu-label" style={{ marginBottom: 8 }}>Tipo de usuario</div>
                  <div className="nu-roles">
                    <div
                      className={`nu-role ${newUser.role === "student" ? "selected-athlete" : ""}`}
                      onClick={() => setNewUser({ ...newUser, role: "student" })}
                    >
                      <span className="nu-role-ico">🏃</span>
                      <span className="nu-role-name">Atleta</span>
                      <span className="nu-role-desc">Acceso al panel de alumno</span>
                    </div>
                    <div
                      className={`nu-role ${newUser.role === "coach" ? "selected-coach" : ""}`}
                      onClick={() => setNewUser({ ...newUser, role: "coach" })}
                    >
                      <span className="nu-role-ico">👨‍🏫</span>
                      <span className="nu-role-name">profe</span>
                      <span className="nu-role-desc">Acceso al panel de profe</span>
                    </div>
                  </div>
                </div>

                <div className="nu-field">
                  <label className="nu-label">Nombre completo *</label>
                  <input
                    className="nu-input" placeholder="Juan García"
                    value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required
                  />
                </div>

                <div className="nu-field">
                  <label className="nu-label">Email *</label>
                  <input
                    className="nu-input" type="email" placeholder="juan@email.com"
                    value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required
                  />
                </div>

                <div className="nu-field full">
                  <label className="nu-label">Contraseña *</label>
                  <input
                    className="nu-input" type="text" placeholder="Contraseña inicial"
                    value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required
                  />
                </div>

                <p className="nu-pass-note">
                  💡 Compartí las credenciales con el usuario. Se enviará <strong style={{color:"#8888a0"}}>role: "{newUser.role}"</strong> al backend.
                </p>

              </div>

              {newUserErr && <div className="nu-err">{newUserErr}</div>}
              {newUserMsg && <div className="nu-ok">{newUserMsg}</div>}

              <div className="cd-modal-actions">
                <button type="button" className="cd-btn cd-btn-ghost" onClick={closeNewUserModal}>
                  Cancelar
                </button>
                <button type="submit" className="cd-btn" style={{ background: "#10B981", color: "#fff" }} disabled={newUserLoading}>
                  {newUserLoading ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── MODAL: NUEVA RUTINA ── */}
      {showForm && (
        <div className="cd-backdrop" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <motion.div className="cd-modal" initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .25 }}>
            <h2>🏋️ Nueva Rutina</h2>
            <form onSubmit={handleSubmit}>
              <div className="cd-field">
                <label>Título del día</label>
                <input className="cd-input" placeholder="Ej: Día 1 — Piernas" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="cd-field">
                <label>Descripción</label>
                <textarea className="cd-input textarea" placeholder="Descripción opcional" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="cd-field">
                <label>Asignar a alumno</label>
                <select className="cd-input" value={userId} onChange={(e) => setUserId(e.target.value)} required>
                  <option value="">Seleccionar alumno...</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} — {s.email}</option>
                  ))}
                </select>
              </div>

              <h3 style={{ fontSize:13, fontWeight:700, color:"#8888a0", textTransform:"uppercase", letterSpacing:".8px", marginBottom:12 }}>Bloques</h3>

              {blocks.map((block, bi) => (
                <div key={bi} className="cd-block-card">
                  <div className="cd-block-title">
                    <input className="cd-input" value={block.name} onChange={(e) => handleBlockNameChange(bi, e.target.value)} placeholder="Nombre del bloque" style={{ flex:1 }} />
                    <button type="button" className="cd-rm-btn" onClick={() => removeBlock(bi)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  {block.exercises.map((ex, ei) => (
                    <div key={ei} className="cd-ex-row">
                      <input className="cd-input" placeholder="Ejercicio" value={ex.name} onChange={(e) => handleExerciseChange(bi, ei, "name", e.target.value)} required />
                      <input className="cd-input" placeholder="Reps (3x12)" value={ex.reps} onChange={(e) => handleExerciseChange(bi, ei, "reps", e.target.value)} style={{ maxWidth:100 }} required />
                      <input className="cd-input" placeholder="Video URL" value={ex.video} onChange={(e) => handleExerciseChange(bi, ei, "video", e.target.value)} style={{ maxWidth:160 }} />
                      <button type="button" className="cd-rm-btn" onClick={() => removeExercise(bi, ei)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                  <button type="button" className="cd-add-btn" onClick={() => addExercise(bi)}>+ Ejercicio</button>
                </div>
              ))}

              <button type="button" className="cd-add-btn" style={{ width:"100%", marginBottom:4 }} onClick={addBlock}>+ Agregar bloque</button>
              {formError && <p style={{ color:"#ff7070", fontSize:13, marginTop:8 }}>⚠ {formError}</p>}

              <div className="cd-modal-actions">
                <button type="button" className="cd-btn cd-btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="cd-btn cd-btn-primary">Crear Rutina</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {message && <div className="cd-toast ok" onClick={() => setMessage("")}>{message}</div>}
    </>
  );
}

function IcoUsers() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IcoDumbbell() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.5 6.5h11M6.5 17.5h11M2 12h20M4.5 9.5v5M19.5 9.5v5"/></svg>;
}
function IcoFire() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
}
function IcoTrend() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}