import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_URL from "../api";

export default function Workout() {
  const { id }       = useParams();
  const navigate     = useNavigate();

  const [exercises, setExercises]           = useState([]);
  const [workout, setWorkout]               = useState(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [closing, setClosing]               = useState(false);
  const [completed, setCompleted]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  // ── FETCH (lógica original intacta) ────────────────────────────
  useEffect(() => {
    const fetchWorkout = async () => {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/"); return; }

      try {
        const res  = await fetch(`${API_URL}/workouts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        const selected = data.find((w) => w._id === id);
        if (!selected) throw new Error("Rutina no encontrada");

        setWorkout(selected);

        let formattedExercises = [];
        if (selected.blocks && selected.blocks.length > 0) {
          formattedExercises = selected.blocks.flatMap((block) =>
            block.exercises.map((ex, i) => ({
              id:    `${block.name}-${i}`,
              name:  ex.name,
              sets:  ex.reps?.split("x")[0] || "-",
              reps:  ex.reps || "-",
              rest:  "45s",
              block: block.name,
              video: ex.video,
            }))
          );
        } else {
          formattedExercises = selected.exercises.map((ex, i) => ({
            id:    `general-${i}`,
            name:  ex.name,
            sets:  ex.reps?.split("x")[0] || "-",
            reps:  ex.reps || "-",
            rest:  "45s",
            block: "General",
            video: ex.video,
          }));
        }

        setExercises(formattedExercises);

        if (user?._id) {
          try {
            const progressRes  = await fetch(`${API_URL}/progress/${user._id}/${id}`);
            const progressData = await progressRes.json();
            if (progressData.length > 0) {
              const latest       = progressData[0];
              const completedIds = latest.exercises
                .filter((ex) => ex.completed)
                .map((ex) => ex.exerciseId);
              setCompleted(completedIds);
            }
          } catch (err) { console.error("Error cargando progreso:", err); }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [id]);

  // ── MODAL LOGIC (original intacta) ─────────────────────────────
  const openModal  = (exercise, index) => {
    setCurrentExercise(index);
    setSelectedExercise(exercise);
  };

  const closeModal = () => {
    setClosing(true);
    setTimeout(() => { setSelectedExercise(null); setClosing(false); }, 300);
  };

  const completeExercise = async () => {
    const userData = localStorage.getItem("user");
    if (!userData) { alert("Usuario no encontrado"); return; }
    const user   = JSON.parse(userData);
    const userId = user._id || user.id;
    if (!userId) { alert("Usuario inválido"); return; }

    const exerciseId = exercises[currentExercise].id;

    try {
      const res = await fetch(`${API_URL}/progress/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, workoutId: id, exerciseId })
      });
      const data = await res.json();
      console.log("progress saved", data);
    } catch (err) { console.error("Error guardando progreso:", err); }

    const newCompleted = [...completed, exerciseId];
    setCompleted(newCompleted);
    const next = currentExercise + 1;
    closeModal();

    if (next < exercises.length) {
      setTimeout(() => { openModal(exercises[next], next); }, 400);
    } else {
      alert("Rutina finalizada");
      navigate("/progress");
    }
  };

  // ── RENDER ──────────────────────────────────────────────────────
  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="wk-page"><div className="wk-loading">Cargando rutina...</div></div>
    </>
  );
  if (error) return (
    <>
      <style>{CSS}</style>
      <div className="wk-page"><div className="wk-error">{error}</div></div>
    </>
  );

  const grouped = exercises.reduce((acc, ex, i) => {
    if (!acc[ex.block]) acc[ex.block] = [];
    acc[ex.block].push({ ...ex, index: i });
    return acc;
  }, {});

  const totalCompleted = exercises.filter(ex => completed.includes(ex.id)).length;
  const pct = exercises.length > 0 ? Math.round(totalCompleted / exercises.length * 100) : 0;

  const getYouTubeEmbed = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : url;
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="wk-page">

        {/* HEADER */}
        <div className="wk-header">
          <div className="wk-header-top">
            <button className="wk-back" onClick={() => navigate(-1)}>← Volver</button>
            <div className="wk-progress-badge">{totalCompleted}/{exercises.length} completados</div>
          </div>
          <h1 className="wk-title">{workout?.title || "Workout"}</h1>
          {workout?.description && <p className="wk-desc">{workout.description}</p>}

          {/* BARRA DE PROGRESO */}
          <div className="wk-progress-bar-wrap">
            <div className="wk-progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="wk-progress-pct">{pct}% completado</div>
        </div>

        {/* BLOQUES */}
        {Object.entries(grouped).map(([blockName, list]) => (
          <div key={blockName} className="wk-block">
            <div className="wk-block-title">{blockName}</div>
            <div className="wk-exercise-grid">
              {list.map((ex) => {
                const isCompleted = completed.includes(ex.id);
                const isCurrent   = ex.index === currentExercise;

                return (
                  <div
                    key={ex.index}
                    className={`wk-card ${isCurrent ? "current" : ""} ${isCompleted ? "done" : ""}`}
                  >
                    {isCompleted && <div className="wk-done-badge">✓</div>}

                    <div className="wk-card-name">{ex.name}</div>
                    <div className="wk-card-meta">
                      <span>{ex.sets} series</span>
                      <span>{ex.reps}</span>
                      <span>Descanso: {ex.rest}</span>
                    </div>

                    <button
                      className="wk-view-btn"
                      onClick={() => openModal(ex, ex.index)}
                      disabled={isCompleted}
                    >
                      {isCompleted ? "Completado ✓" : "Ver ejercicio"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* MODAL */}
        {selectedExercise && (
          <div
            className={`wk-modal-overlay ${closing ? "closing" : ""}`}
            onClick={closeModal}
          >
            <div className="wk-modal" onClick={e => e.stopPropagation()}>
              <div className="wk-modal-header">
                <div>
                  <div className="wk-modal-counter">
                    Ejercicio {currentExercise + 1} de {exercises.length}
                  </div>
                  <h2 className="wk-modal-title">{selectedExercise.name}</h2>
                </div>
                <button className="wk-modal-close" onClick={closeModal}>✕</button>
              </div>

              <div className="wk-modal-info">
                <div className="wk-info-pill">{selectedExercise.sets} series</div>
                <div className="wk-info-pill">{selectedExercise.reps}</div>
                <div className="wk-info-pill">Descanso {selectedExercise.rest}</div>
              </div>

              {selectedExercise.video && (
                <iframe
                  src={getYouTubeEmbed(selectedExercise.video)}
                  title={selectedExercise.name}
                  allowFullScreen
                  className="wk-iframe"
                />
              )}

              {!selectedExercise.video && (
                <div className="wk-no-video">Sin video disponible</div>
              )}

              <button className="wk-complete-btn" onClick={completeExercise}>
                Marcar como completado ✓
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

const CSS = `
  .wk-page {
    min-height: 100vh;
    background: #0d0d0f;
    padding: 32px 24px;
    color: #f0f0f0;
    font-family: system-ui, -apple-system, sans-serif;
    animation: wkFade 0.4s ease;
  }
  @keyframes wkFade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .wk-loading { color: #555; padding: 40px 0; font-size: 14px; }
  .wk-error   { color: #ff5555; padding: 40px 0; font-size: 14px; }

  /* ── HEADER ── */
  .wk-header { margin-bottom: 32px; }
  .wk-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .wk-back {
    font-size: 13px; color: #666; background: none; border: none;
    cursor: pointer; padding: 0; transition: color 0.15s;
  }
  .wk-back:hover { color: #f0f0f0; }
  .wk-progress-badge {
    font-size: 12px; color: #39d98a;
    background: rgba(57,217,138,0.1);
    border: 1px solid rgba(57,217,138,0.2);
    padding: 4px 12px; border-radius: 20px;
  }
  .wk-title { font-size: 24px; font-weight: 600; margin: 0 0 6px; }
  .wk-desc  { font-size: 13px; color: #666; margin-bottom: 16px; }

  .wk-progress-bar-wrap {
    height: 4px; background: #1e1e23; border-radius: 2px; overflow: hidden; margin-bottom: 6px;
  }
  .wk-progress-bar-fill {
    height: 100%; background: #39d98a; border-radius: 2px;
    transition: width 0.4s ease;
  }
  .wk-progress-pct { font-size: 11px; color: #555; }

  /* ── BLOCKS ── */
  .wk-block { margin-bottom: 28px; }
  .wk-block-title {
    font-size: 12px; color: #ff6b35; text-transform: uppercase;
    letter-spacing: 1px; margin-bottom: 14px;
    padding-bottom: 8px; border-bottom: 1px solid rgba(255,107,53,0.2);
  }

  /* ── EXERCISE GRID ── */
  .wk-exercise-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px;
  }

  .wk-card {
    background: #141419;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 18px;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    position: relative;
    cursor: default;
  }
  .wk-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.5);
  }
  .wk-card.current {
    border-color: #ff6b35;
    box-shadow: 0 0 18px rgba(255,107,53,0.25);
  }
  .wk-card.done {
    opacity: 0.5;
  }

  .wk-done-badge {
    position: absolute; top: 12px; right: 12px;
    width: 22px; height: 22px; border-radius: 50%;
    background: rgba(57,217,138,0.2); color: #39d98a;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
  }

  .wk-card-name {
    font-size: 15px; font-weight: 500; margin-bottom: 10px;
    padding-right: 28px;
  }
  .wk-card-meta {
    display: flex; flex-direction: column; gap: 3px; margin-bottom: 14px;
  }
  .wk-card-meta span { font-size: 12px; color: #666; }

  .wk-view-btn {
    width: 100%; padding: 9px;
    background: linear-gradient(135deg, #ff6b35, #ff3c3c);
    border: none; border-radius: 9px; color: white;
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: opacity 0.15s;
  }
  .wk-view-btn:hover:not(:disabled) { opacity: 0.85; }
  .wk-view-btn:disabled {
    background: rgba(57,217,138,0.15); color: #39d98a; cursor: default;
  }

  /* ── MODAL ── */
  .wk-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; padding: 20px;
    animation: wkOverlayIn 0.2s ease;
  }
  .wk-modal-overlay.closing { animation: wkOverlayOut 0.3s ease forwards; }
  @keyframes wkOverlayIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes wkOverlayOut { from { opacity: 1; } to { opacity: 0; } }

  .wk-modal {
    background: #141419; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px; padding: 24px;
    width: 100%; max-width: 680px;
    animation: wkModalIn 0.25s ease;
  }
  @keyframes wkModalIn {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .wk-modal-header {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;
  }
  .wk-modal-counter { font-size: 11px; color: #555; margin-bottom: 4px; }
  .wk-modal-title   { font-size: 18px; font-weight: 600; margin: 0; }
  .wk-modal-close {
    background: none; border: none; color: #555; font-size: 20px;
    cursor: pointer; line-height: 1; padding: 0;
  }
  .wk-modal-close:hover { color: #f0f0f0; }

  .wk-modal-info { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .wk-info-pill {
    font-size: 12px; padding: 4px 12px;
    background: #1e1e23; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px; color: #aaa;
  }

  .wk-iframe {
    width: 100%; height: 340px;
    border: none; border-radius: 12px; margin-bottom: 16px;
    background: #0d0d0f;
  }

  .wk-no-video {
    height: 160px; border: 1px dashed rgba(255,255,255,0.1);
    border-radius: 12px; display: flex; align-items: center;
    justify-content: center; color: #444; font-size: 13px; margin-bottom: 16px;
  }

  .wk-complete-btn {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #39d98a, #2ecc71);
    border: none; border-radius: 12px; color: white;
    font-size: 15px; font-weight: 500; cursor: pointer;
    transition: opacity 0.15s;
  }
  .wk-complete-btn:hover { opacity: 0.88; }
`;