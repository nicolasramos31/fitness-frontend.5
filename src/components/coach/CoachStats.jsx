import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import API_URL from "../../api";

const fade = (i = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: i * 0.07 } });

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function RingChart({ pct, color, size = 80, stroke = 8, label, value }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#f0f0fa" }}>{value}</span>
        </div>
      </div>
      <span style={{ fontSize: 12, color: "#8888a0", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export default function CoachStats() {
  const token = localStorage.getItem("token");
  const [students, setStudents] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, wRes, hRes] = await Promise.all([
          fetch(`${API_URL}/auth/students`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/workouts`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/progress`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (sRes.ok) { const d = await sRes.json(); setStudents(d.students || d || []); }
        if (wRes.ok) { const d = await wRes.json(); setWorkouts(d.workouts || d || []); }
        if (hRes.ok) { const d = await hRes.json(); setHistory(d.progress || d || []); }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  // Activity per student
  const studentActivity = students.map((s) => ({
    ...s,
    count: history.filter((h) => (h.userId || h.user) === s._id).length,
  })).sort((a, b) => b.count - a.count);

  // Monthly activity (current year)
  const year = new Date().getFullYear();
  const monthlyData = MONTHS.map((m, i) =>
    history.filter((h) => {
      const d = new Date(h.date || h.createdAt);
      return d.getFullYear() === year && d.getMonth() === i;
    }).length
  );
  const maxMonth = Math.max(...monthlyData, 1);

  // Level distribution
  const levels = { beginner: 0, intermediate: 0, advanced: 0 };
  students.forEach((s) => { if (levels[s.level] !== undefined) levels[s.level]++; });

  return (
    <>
      <style>{`
        .cst-wrap { max-width: 1100px; }
        .cst-header { margin-bottom: 28px; }
        .cst-title { font-size: 22px; font-weight: 800; color: #f0f0fa; }
        .cst-sub { font-size: 13px; color: #55556a; margin-top: 2px; }

        .cst-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 22px; }
        .cst-kpi {
          background: #0c0c18; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px; padding: 18px 20px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .cst-kpi-val { font-size: 28px; font-weight: 800; color: #f0f0fa; line-height: 1; }
        .cst-kpi-label { font-size: 12px; color: #55556a; font-weight: 500; }

        .cst-panels { display: grid; grid-template-columns: 2fr 1fr; gap: 18px; margin-bottom: 18px; }
        .cst-panel {
          background: #0c0c18; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 22px;
        }
        .cst-panel-title { font-size: 14px; font-weight: 700; color: #e2e2ee; margin-bottom: 18px; }

        /* monthly bar */
        .cst-mbars { display: flex; align-items: flex-end; gap: 8px; height: 120px; }
        .cst-mbar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
        .cst-mbar-track { flex: 1; width: 100%; background: rgba(255,255,255,0.04); border-radius: 5px; display: flex; align-items: flex-end; overflow: hidden; }
        .cst-mbar-fill { width: 100%; border-radius: 5px; min-height: 3px; }
        .cst-mbar-label { font-size: 9px; color: #44445a; }

        /* rings */
        .cst-rings { display: flex; justify-content: space-around; align-items: center; padding: 10px 0; flex-wrap: wrap; gap: 16px; }

        /* student leaderboard */
        .cst-lb { display: flex; flex-direction: column; gap: 8px; }
        .cst-lb-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px; border-radius: 10px;
          background: rgba(255,255,255,0.02); transition: background .15s;
        }
        .cst-lb-row:hover { background: rgba(255,255,255,0.04); }
        .cst-lb-rank { width: 22px; font-size: 12px; font-weight: 700; color: #44445a; text-align: center; }
        .cst-lb-rank.top { color: #FF6B35; }
        .cst-lb-av {
          width: 34px; height: 34px; border-radius: 9px;
          background: rgba(255,107,53,.12); color: #FF6B35;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 13px; flex-shrink: 0;
        }
        .cst-lb-name { flex: 1; font-size: 13px; font-weight: 600; color: #e2e2ee; }
        .cst-lb-count {
          font-size: 11px; font-weight: 700;
          background: rgba(255,107,53,.1); color: #FF6B35;
          padding: 3px 10px; border-radius: 20px;
        }
        .cst-lb-bar { flex: 1; height: 4px; background: rgba(255,255,255,.05); border-radius: 2px; overflow: hidden; }
        .cst-lb-bfill { height: 100%; border-radius: 2px; background: rgba(255,107,53,.5); }

        .cst-empty { color: #33334a; font-size: 13px; text-align: center; padding: 24px; }

        .cst-skel { height: 120px; background: #0c0c18; border-radius: 16px; animation: bl 1.5s infinite; }
        @keyframes bl { 0%,100%{opacity:.4} 50%{opacity:.7} }

        @media(max-width:900px) {
          .cst-grid { grid-template-columns: 1fr 1fr; }
          .cst-panels { grid-template-columns: 1fr; }
        }
        @media(max-width:480px) {
          .cst-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cst-wrap">
        <div className="cst-header">
          <h1 className="cst-title">Estadísticas</h1>
          <p className="cst-sub">Resumen de actividad de tu plataforma</p>
        </div>

        {/* KPIs */}
        <div className="cst-grid">
          {[
            { val: loading ? "—" : students.length, label: "Alumnos totales", accent: "#FF6B35" },
            { val: loading ? "—" : workouts.length, label: "Rutinas creadas", accent: "#3B82F6" },
            { val: loading ? "—" : history.length, label: "Entrenamientos registrados", accent: "#10B981" },
            { val: loading ? "—" : studentActivity[0]?.name?.split(" ")[0] || "—", label: "Alumno más activo", accent: "#A855F7" },
          ].map((k, i) => (
            <motion.div key={i} className="cst-kpi" {...fade(i)}>
              <div className="cst-kpi-val" style={{ color: k.accent }}>{k.val}</div>
              <div className="cst-kpi-label">{k.label}</div>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
            <div className="cst-skel" />
            <div className="cst-skel" />
          </div>
        ) : (
          <>
            <div className="cst-panels">
              {/* Monthly chart */}
              <motion.div className="cst-panel" {...fade(4)}>
                <div className="cst-panel-title">Actividad Mensual {year}</div>
                <div className="cst-mbars">
                  {monthlyData.map((v, i) => (
                    <div key={i} className="cst-mbar-col">
                      <div className="cst-mbar-track">
                        <motion.div
                          className="cst-mbar-fill"
                          initial={{ height: 0 }}
                          animate={{ height: `${(v / maxMonth) * 100}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: "easeOut" }}
                          style={{ background: v === maxMonth ? "linear-gradient(180deg,#FF6B35,#ff9060)" : "rgba(255,107,53,.25)" }}
                        />
                      </div>
                      <span className="cst-mbar-label">{MONTHS[i]}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Level distribution rings */}
              <motion.div className="cst-panel" {...fade(5)}>
                <div className="cst-panel-title">Distribución de Niveles</div>
                <div className="cst-rings">
                  <RingChart
                    pct={students.length ? (levels.beginner / students.length) * 100 : 0}
                    color="#10B981" size={76} stroke={7}
                    label="Básico" value={levels.beginner}
                  />
                  <RingChart
                    pct={students.length ? (levels.intermediate / students.length) * 100 : 0}
                    color="#3B82F6" size={76} stroke={7}
                    label="Intermedio" value={levels.intermediate}
                  />
                  <RingChart
                    pct={students.length ? (levels.advanced / students.length) * 100 : 0}
                    color="#FF6B35" size={76} stroke={7}
                    label="Avanzado" value={levels.advanced}
                  />
                </div>
              </motion.div>
            </div>

            {/* Leaderboard */}
            <motion.div className="cst-panel" {...fade(6)}>
              <div className="cst-panel-title">Ranking de Alumnos — Entrenamientos</div>
              {studentActivity.length === 0 ? (
                <p className="cst-empty">Sin datos de actividad aún</p>
              ) : (
                <div className="cst-lb">
                  {studentActivity.map((s, i) => {
                    const maxC = studentActivity[0]?.count || 1;
                    return (
                      <motion.div key={s._id} className="cst-lb-row" {...fade(i)}>
                        <span className={`cst-lb-rank ${i === 0 ? "top" : ""}`}>{i + 1}</span>
                        <div className="cst-lb-av">{(s.name || "?")[0].toUpperCase()}</div>
                        <span className="cst-lb-name">{s.name}</span>
                        <div className="cst-lb-bar">
                          <motion.div
                            className="cst-lb-bfill"
                            initial={{ width: 0 }}
                            animate={{ width: `${(s.count / maxC) * 100}%` }}
                            transition={{ delay: 0.4 + i * 0.06, duration: 0.7 }}
                          />
                        </div>
                        <span className="cst-lb-count">{s.count}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </>
  );
}