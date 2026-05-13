import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import API_URL from "../api";

function Dashboard() {
  const navigate = useNavigate();

  const [workouts, setWorkouts]                   = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState("");
  const [progressPercent, setProgressPercent]     = useState(0);
  const [completedExercises, setCompletedExercises] = useState(0);
  const [totalExercises, setTotalExercises]       = useState(0);
  const [weeklyData, setWeeklyData]               = useState([0,0,0,0,0,0,0]);
  const [user, setUser]                           = useState(null);

  const goWorkout = (id) => navigate(`/workout/${id}`);

  // ── WORKOUTS (lógica original intacta) ──────────────────────────
  useEffect(() => {
    const fetchWorkouts = async () => {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/"); return; }
      try {
        const res  = await fetch(`${API_URL}/workouts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setWorkouts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkouts();
  }, []);

  // ── PROGRESS (lógica original intacta) ──────────────────────────
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (u) setUser(u);

    const fetchProgress = async () => {
      if (!u) return;
      try {
        const userId = u._id || u.id;
        const res    = await fetch(`${API_URL}/progress/${userId}`);
        const data   = await res.json();
        if (!Array.isArray(data)) return;

        let completed = 0, total = 0;
        const days = [0,0,0,0,0,0,0];

        data.forEach(p => {
          const day = new Date(p.date).getDay();
          (p.exercises || []).forEach(e => {
            total++;
            if (e.completed) { completed++; days[day]++; }
          });
        });

        setCompletedExercises(completed);
        setTotalExercises(total);
        setProgressPercent(total ? Math.round((completed / total) * 100) : 0);
        setWeeklyData(days);
      } catch (err) {
        console.error("error progress", err);
      }
    };
    fetchProgress();
  }, []);

  const daysLabel = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const maxBar    = Math.max(...weeklyData, 1);

  const getExerciseCount = (w) =>
    w.blocks?.length > 0
      ? w.blocks.reduce((t, b) => t + b.exercises.length, 0)
      : w.exercises?.length || 0;

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  return (
    <>
      <style>{CSS}</style>
      <div className="db-layout">
        <Sidebar />

        <div className="db-main">

          {/* ── TOP BAR ── */}
          <header className="db-topbar">
            <div>
              <h1 className="db-greeting">Bienvenido, {user?.name?.split(" ")[0] || "Atleta"} </h1>
              <p className="db-subtitle">Seguí tu progreso y seguí entrenando</p>
            </div>
            <div className="db-user-chip">
              <div className="db-chip-avatar">{initials}</div>
              <span className="db-chip-name">{user?.name}</span>
            </div>
          </header>

          {/* ── STAT CARDS ── */}
          <div className="db-stat-grid">
            <div className="db-stat-card">
              <div className="db-stat-label">Ejercicios completados</div>
              <div className="db-stat-value text-green">{completedExercises}</div>
              <div className="db-stat-delta">de {totalExercises} totales</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Progreso general</div>
              <div className="db-stat-value text-orange">{progressPercent}%</div>
              <div className="db-stat-delta">completado</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Rutinas asignadas</div>
              <div className="db-stat-value">{workouts.length}</div>
              <div className="db-stat-delta">disponibles</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Días activos</div>
              <div className="db-stat-value">{weeklyData.filter(d => d > 0).length}</div>
              <div className="db-stat-delta">esta semana</div>
            </div>
          </div>

          {/* ── PROGRESS + CHART ── */}
          <div className="db-two-col">

            <div className="db-card">
              <div className="db-card-title">Progreso semanal</div>
              <div className="db-progress-wrap">
                <div className="db-progress-bg">
                  <div className="db-progress-fill" style={{ width: progressPercent + "%" }} />
                </div>
                <span className="db-progress-label">{progressPercent}%</span>
              </div>
              <p className="db-progress-text">
                {completedExercises} de {totalExercises} ejercicios completados
              </p>

              {/* Donut visual */}
              <div className="db-donut-row">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#1e1e23" strokeWidth="9" />
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke="#39d98a" strokeWidth="9"
                    strokeDasharray={`${Math.round(progressPercent * 2.01)} 201`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <div className="db-donut-info">
                  <div className="db-donut-pct text-green">{progressPercent}%</div>
                  <div className="db-donut-sub">Meta semanal</div>
                </div>
              </div>
            </div>

            <div className="db-card">
              <div className="db-card-title">Actividad por día</div>
              <div className="db-bar-chart">
                {weeklyData.map((v, i) => (
                  <div key={i} className="db-bar-col">
                    <div
                      className={`db-bar ${v > 0 ? "active" : ""}`}
                      style={{ height: Math.max(Math.round((v / maxBar) * 80), v > 0 ? 8 : 4) + "px" }}
                    />
                    <span className="db-bar-label">{daysLabel[i]}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── WORKOUTS ── */}
          <div className="db-section-header">
            <h2 className="db-section-title">Tus días de entrenamiento</h2>
            {!loading && <span className="db-badge">{workouts.length} rutinas</span>}
          </div>

          {loading && <div className="db-loading">Cargando rutinas...</div>}
          {error   && <div className="db-error">{error}</div>}

          <div className="db-workout-grid">
            {!loading && workouts.length === 0 && (
              <div className="db-empty">No hay rutinas asignadas todavía.</div>
            )}

            {workouts.map((workout) => {
              const exCount = getExerciseCount(workout);
              return (
                <div key={workout._id} className="db-workout-card">
                  <div className="db-workout-top">
                    <div className="db-workout-icon">⊞</div>
                    <div className="db-workout-badge">
                      {exCount} ejercicios
                    </div>
                  </div>

                  <h3 className="db-workout-title">{workout.title}</h3>
                  <p className="db-workout-desc">
                    {workout.description || "Entrenamiento personalizado"}
                  </p>

                  <div className="db-workout-meta">
                    {workout.createdBy?.name && (
                      <span className="db-meta-item">Coach: {workout.createdBy.name}</span>
                    )}
                    <span className="db-meta-item">{exCount} ejercicios</span>
                  </div>

                  {/* Bloques preview */}
                  {workout.blocks?.length > 0 && (
                    <div className="db-blocks-preview">
                      {workout.blocks.slice(0, 3).map((b, i) => (
                        <span key={i} className="db-block-tag">{b.name}</span>
                      ))}
                      {workout.blocks.length > 3 && (
                        <span className="db-block-tag">+{workout.blocks.length - 3}</span>
                      )}
                    </div>
                  )}

                  <button
                    className="db-workout-btn"
                    onClick={() => goWorkout(workout._id)}
                  >
                    Entrar al día →
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}

const CSS = `
  * { box-sizing: border-box; }

  .db-layout {
    display: flex;
    min-height: 100vh;
    background: #0d0d0f;
    color: #f0f0f0;
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* ── MAIN ── */
  .db-main {
    flex: 1;
    padding: 32px 36px;
    overflow-y: auto;
    animation: dbFade 0.4s ease;
    min-width: 0;
  }
  @keyframes dbFade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── TOPBAR ── */
  .db-topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .db-greeting {
    font-size: 26px;
    font-weight: 600;
    margin: 0 0 4px;
  }
  .db-subtitle {
    font-size: 13px;
    color: #555;
    margin: 0;
  }
  .db-user-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #161619;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 40px;
    padding: 6px 14px 6px 6px;
  }
  .db-chip-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(255,107,53,0.2);
    color: #ff6b35;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }
  .db-chip-name { font-size: 13px; color: #aaa; }

  /* ── STAT GRID ── */
  .db-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }
  @media (max-width: 700px) { .db-stat-grid { grid-template-columns: repeat(2, 1fr); } }

  .db-stat-card {
    background: #161619;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 16px;
  }
  .db-stat-label {
    font-size: 10px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  .db-stat-value {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .db-stat-delta { font-size: 11px; color: #444; }

  .text-green  { color: #39d98a; }
  .text-orange { color: #ff6b35; }

  /* ── TWO COL ── */
  .db-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 28px;
  }
  @media (max-width: 640px) { .db-two-col { grid-template-columns: 1fr; } }

  /* ── CARD ── */
  .db-card {
    background: #161619;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 18px;
  }
  .db-card-title {
    font-size: 11px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 14px;
  }

  /* ── PROGRESS ── */
  .db-progress-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .db-progress-bg {
    flex: 1;
    height: 6px;
    background: #1e1e23;
    border-radius: 3px;
    overflow: hidden;
  }
  .db-progress-fill {
    height: 100%;
    background: #39d98a;
    border-radius: 3px;
    transition: width 1s ease;
  }
  .db-progress-label { font-size: 13px; color: #39d98a; font-weight: 500; min-width: 36px; }
  .db-progress-text  { font-size: 12px; color: #555; margin-bottom: 16px; }

  /* ── DONUT ── */
  .db-donut-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 4px;
  }
  .db-donut-info { }
  .db-donut-pct { font-size: 22px; font-weight: 600; }
  .db-donut-sub { font-size: 11px; color: #555; margin-top: 2px; }

  /* ── BAR CHART ── */
  .db-bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 110px;
    margin-top: 4px;
  }
  .db-bar-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    height: 100%;
    justify-content: flex-end;
  }
  .db-bar {
    width: 100%;
    border-radius: 3px 3px 0 0;
    background: #1e1e23;
    min-height: 4px;
    transition: height 0.6s ease;
  }
  .db-bar.active { background: #ff6b35; }
  .db-bar-label { font-size: 9px; color: #444; }

  /* ── SECTION HEADER ── */
  .db-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .db-section-title { font-size: 16px; font-weight: 500; margin: 0; }
  .db-badge {
    font-size: 11px;
    padding: 3px 10px;
    background: rgba(255,107,53,0.12);
    color: #ff6b35;
    border-radius: 20px;
  }

  .db-loading { font-size: 13px; color: #555; padding: 20px 0; }
  .db-error   { font-size: 13px; color: #ff5555; padding: 10px 0; }
  .db-empty   { font-size: 13px; color: #444; padding: 20px 0; }

  /* ── WORKOUT GRID ── */
  .db-workout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .db-workout-card {
    background: #141419;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 0;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  }
  .db-workout-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255,107,53,0.3);
    box-shadow: 0 12px 30px rgba(0,0,0,0.5);
  }

  .db-workout-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }
  .db-workout-icon {
    font-size: 20px;
    width: 40px;
    height: 40px;
    background: rgba(255,107,53,0.1);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ff6b35;
  }
  .db-workout-badge {
    font-size: 11px;
    padding: 3px 10px;
    background: rgba(57,217,138,0.1);
    color: #39d98a;
    border-radius: 20px;
  }

  .db-workout-title {
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 6px;
  }
  .db-workout-desc {
    font-size: 12px;
    color: #555;
    margin: 0 0 12px;
    line-height: 1.5;
  }

  .db-workout-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .db-meta-item {
    font-size: 11px;
    color: #555;
  }

  .db-blocks-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 16px;
  }
  .db-block-tag {
    font-size: 10px;
    padding: 3px 9px;
    background: #1e1e23;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 4px;
    color: #888;
  }

  .db-workout-btn {
    margin-top: auto;
    padding: 11px;
    background: #ff6b35;
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
    width: 100%;
  }
  .db-workout-btn:hover { background: #ff8555; }
`;

export default Dashboard;