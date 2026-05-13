import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API_URL from "../api";

export default function Progress() {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user?.id && !user?._id) { setLoading(false); return; }
      try {
        const userId = user._id || user.id;
        const res = await fetch(`${API_URL}/progress/${userId}`);
        const data = await res.json();
        setProgressData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading progress:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  /* ── helpers ── */
  const calculateStreak = (progress) => {
    if (!progress.length) return 0;
    const days = progress
      .map((p) => new Date(p.date).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    const current = new Date();
    for (let d of days) {
      const diff = Math.floor((current - new Date(d)) / (1000 * 60 * 60 * 24));
      if (diff === streak) streak++;
      else break;
    }
    return streak;
  };

  const totalExercises = progressData.reduce((acc, p) => acc + (p.exercises?.length || 0), 0);
  const totalCompleted = progressData.reduce((acc, p) => acc + (p.exercises?.filter((e) => e.completed).length || 0), 0);
  const globalPercent = totalExercises > 0 ? Math.round((totalCompleted / totalExercises) * 100) : 0;
  const streak = calculateStreak(progressData);
  const completedWorkouts = progressData.filter((p) => p.completedWorkout).length;

  /* ── historial agrupado ── */
  const historyMap = {};
  progressData.forEach((p) => {
    const day = new Date(p.date).toDateString();
    if (!historyMap[day]) {
      historyMap[day] = {
        name: p.workout?.title || p.workout?.name || "Entrenamiento",
        total: 0, completed: 0, date: p.date,
      };
    }
    historyMap[day].total += (p.exercises || []).length;
    historyMap[day].completed += (p.exercises || []).filter((e) => e.completed).length;
  });
  const history = Object.values(historyMap)
    .map((h) => ({ ...h, percent: h.total > 0 ? (h.completed / h.total) * 100 : 0 }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  /* ── actividad semanal (últimos 7 días) ── */
  const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const now = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const count = progressData.filter(
      (p) => new Date(p.date).toDateString() === d.toDateString()
    ).length;
    return { label: DAYS[d.getDay()], count, isToday: i === 6 };
  });
  const maxBar = Math.max(...last7.map((d) => d.count), 1);

  const fmtDate = (str) =>
    new Date(str).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(255,107,53,.2)", borderTopColor: "#FF6B35", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pr-page {
          min-height: 100vh;
          background: #080810;
          padding: 40px 28px 60px;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: #e2e2ee;
        }
        .pr-wrap { max-width: 1000px; margin: 0 auto; }

        /* header */
        .pr-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 12px; }
        .pr-title-group {}
        .pr-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; color: #55556a; cursor: pointer;
          background: none; border: none; padding: 0; margin-bottom: 8px;
          transition: color .15s;
        }
        .pr-back:hover { color: #e2e2ee; }
        .pr-title { font-size: 24px; font-weight: 800; color: #f0f0fa; }
        .pr-sub   { font-size: 13px; color: #55556a; margin-top: 3px; }

        /* KPI grid */
        .pr-kpis { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 24px; }
        .pr-kpi {
          background: #0c0c18; border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px; padding: 18px 20px;
          transition: border-color .2s;
        }
        .pr-kpi:hover { border-color: rgba(255,107,53,.2); }
        .pr-kpi-val { font-size: 28px; font-weight: 900; line-height: 1; margin-bottom: 5px; }
        .pr-kpi-label { font-size: 12px; color: #55556a; font-weight: 500; }

        /* panels */
        .pr-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; margin-bottom: 24px; }
        .pr-panel {
          background: #0c0c18; border: 1px solid rgba(255,255,255,.06);
          border-radius: 16px; padding: 22px;
        }
        .pr-panel-title { font-size: 14px; font-weight: 700; color: #e2e2ee; margin-bottom: 18px; }

        /* progress ring */
        .pr-ring-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .pr-ring-text { text-align: center; }
        .pr-ring-pct  { font-size: 32px; font-weight: 900; color: #FF6B35; }
        .pr-ring-sub  { font-size: 12px; color: #55556a; margin-top: 3px; }

        /* bars */
        .pr-bars { display: flex; align-items: flex-end; gap: 10px; height: 100px; }
        .pr-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; height: 100%; }
        .pr-bar-track { flex: 1; width: 100%; background: rgba(255,255,255,.04); border-radius: 5px; display: flex; align-items: flex-end; overflow: hidden; }
        .pr-bar-fill  { width: 100%; border-radius: 5px; min-height: 3px; transition: height .6s ease; }
        .pr-bar-day   { font-size: 10px; color: #44445a; }
        .pr-bar-today { color: #FF6B35; font-weight: 700; }

        /* historial */
        .pr-history-panel {
          background: #0c0c18; border: 1px solid rgba(255,255,255,.06);
          border-radius: 16px; padding: 22px;
        }
        .pr-history-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .pr-history-title { font-size: 14px; font-weight: 700; color: #e2e2ee; }
        .pr-history-count { font-size: 11px; background: rgba(255,107,53,.1); color: #FF6B35; padding: 3px 10px; border-radius: 20px; font-weight: 600; }

        .pr-hist-list { display: flex; flex-direction: column; gap: 10px; }
        .pr-hist-row {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 14px; border-radius: 12px;
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.04);
          transition: border-color .18s;
        }
        .pr-hist-row:hover { border-color: rgba(255,107,53,.15); }
        .pr-hist-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(16,185,129,.12); color: #10B981;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .pr-hist-name { font-size: 13px; font-weight: 600; color: #e2e2ee; }
        .pr-hist-date { font-size: 11px; color: #55556a; margin-top: 2px; }
        .pr-hist-right { margin-left: auto; text-align: right; }
        .pr-hist-pct  { font-size: 14px; font-weight: 800; color: #FF6B35; }
        .pr-hist-ratio{ font-size: 11px; color: #55556a; }
        .pr-hist-bar  { width: 80px; height: 4px; background: rgba(255,255,255,.05); border-radius: 2px; margin-top: 4px; overflow: hidden; }
        .pr-hist-bfill{ height: 100%; border-radius: 2px; }

        /* empty */
        .pr-empty { text-align: center; padding: 48px; color: #33334a; font-size: 13px; }
        .pr-empty-ico { font-size: 40px; margin-bottom: 12px; opacity: .4; }

        @media(max-width:800px) {
          .pr-kpis { grid-template-columns: 1fr 1fr; }
          .pr-grid  { grid-template-columns: 1fr; }
          .pr-page  { padding: 24px 16px 40px; }
        }
        @media(max-width:480px) {
          .pr-kpis { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pr-page">
        <div className="pr-wrap">

          {/* Header */}
          <div className="pr-header">
            <div className="pr-title-group">
              <button className="pr-back" onClick={() => navigate("/dashboard")}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                Volver al dashboard
              </button>
              <h1 className="pr-title">Mi Progreso</h1>
              <p className="pr-sub">{progressData.length} sesiones registradas</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="pr-kpis">
            <div className="pr-kpi">
              <div className="pr-kpi-val" style={{ color: "#FF6B35" }}>{completedWorkouts}</div>
              <div className="pr-kpi-label">Entrenamientos completados</div>
            </div>
            <div className="pr-kpi">
              <div className="pr-kpi-val" style={{ color: "#10B981" }}>{totalCompleted}</div>
              <div className="pr-kpi-label">Ejercicios completados</div>
            </div>
            <div className="pr-kpi">
              <div className="pr-kpi-val" style={{ color: "#3B82F6" }}>{streak}</div>
              <div className="pr-kpi-label">Racha actual (días)</div>
            </div>
            <div className="pr-kpi">
              <div className="pr-kpi-val" style={{ color: "#A855F7" }}>{globalPercent}%</div>
              <div className="pr-kpi-label">Progreso total</div>
            </div>
          </div>

          {/* Charts */}
          <div className="pr-grid">

            {/* Actividad semanal */}
            <div className="pr-panel">
              <div className="pr-panel-title">Actividad — últimos 7 días</div>
              <div className="pr-bars">
                {last7.map((d, i) => (
                  <div key={i} className="pr-bar-col">
                    <div className="pr-bar-track">
                      <div
                        className="pr-bar-fill"
                        style={{
                          height: `${(d.count / maxBar) * 100}%`,
                          background: d.isToday
                            ? "linear-gradient(180deg,#FF6B35,#ff9060)"
                            : d.count > 0
                              ? "rgba(255,107,53,.35)"
                              : "rgba(255,255,255,.04)",
                        }}
                      />
                    </div>
                    <span className={`pr-bar-day ${d.isToday ? "pr-bar-today" : ""}`}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progreso global (ring) */}
            <div className="pr-panel">
              <div className="pr-panel-title">Progreso Global</div>
              <div className="pr-ring-wrap">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="10"/>
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke="#FF6B35" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - globalPercent / 100)}`}
                    style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div className="pr-ring-text">
                  <div className="pr-ring-pct">{globalPercent}%</div>
                  <div className="pr-ring-sub">{totalCompleted} de {totalExercises} ejercicios</div>
                </div>
              </div>
            </div>

          </div>

          {/* Historial */}
          <div className="pr-history-panel">
            <div className="pr-history-head">
              <span className="pr-history-title">Historial de entrenamientos</span>
              <span className="pr-history-count">{history.length} sesiones</span>
            </div>

            {history.length === 0 ? (
              <div className="pr-empty">
                <div className="pr-empty-ico">🏋️</div>
                <p>No hay entrenamientos registrados aún</p>
              </div>
            ) : (
              <div className="pr-hist-list">
                {history.map((h, i) => (
                  <div key={i} className="pr-hist-row">
                    <div className="pr-hist-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M6.5 6.5h11M6.5 17.5h11M2 12h20M4.5 9.5v5M19.5 9.5v5"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="pr-hist-name">{h.name}</div>
                      <div className="pr-hist-date">{fmtDate(h.date)}</div>
                    </div>
                    <div className="pr-hist-right">
                      <div className="pr-hist-pct">{h.percent.toFixed(0)}%</div>
                      <div className="pr-hist-ratio">{h.completed}/{h.total} ejercicios</div>
                      <div className="pr-hist-bar">
                        <div
                          className="pr-hist-bfill"
                          style={{
                            width: `${h.percent}%`,
                            background: h.percent >= 80
                              ? "#10B981"
                              : h.percent >= 50
                                ? "#FF6B35"
                                : "#3B82F6",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}