import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API_URL from "../../api";

const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: i * 0.06 } });

export default function CoachWorkouts() {
  const token = localStorage.getItem("token");
  const [workouts, setWorkouts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  /* form state */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState("");
  const [blocks, setBlocks] = useState([{ name: "Bloque A", exercises: [{ name: "", reps: "", video: "" }] }]);
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };

  const load = async () => {
    setLoading(true);
    try {
      const [wRes, sRes] = await Promise.all([
        fetch(`${API_URL}/workouts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/auth/students`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (wRes.ok) { const d = await wRes.json(); setWorkouts(d.workouts || d || []); }
      if (sRes.ok) { const d = await sRes.json(); setStudents(d.students || d || []); }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  /* ── form helpers ── */
  const resetForm = () => {
    setTitle(""); setDescription(""); setUserId("");
    setBlocks([{ name: "Bloque A", exercises: [{ name: "", reps: "", video: "" }] }]);
    setEditing(null);
  };
  const openNew = () => { resetForm(); setShowForm(true); };
  const openEdit = (w) => {
    setEditing(w);
    setTitle(w.title || "");
    setDescription(w.description || "");
    setUserId(w.userId || w.user || "");
    setBlocks(w.blocks || [{ name: "Bloque A", exercises: [{ name: "", reps: "", video: "" }] }]);
    setShowForm(true);
  };

  const addBlock = () => setBlocks([...blocks, { name: `Bloque ${String.fromCharCode(65 + blocks.length)}`, exercises: [{ name: "", reps: "", video: "" }] }]);
  const addExercise = (bi) => { const u = [...blocks]; u[bi].exercises.push({ name: "", reps: "", video: "" }); setBlocks(u); };
  const handleBlockName = (i, v) => { const u = [...blocks]; u[i].name = v; setBlocks(u); };
  const handleEx = (bi, ei, f, v) => { const u = [...blocks]; u[bi].exercises[ei][f] = v; setBlocks(u); };
  const removeBlock = (i) => setBlocks(blocks.filter((_, idx) => idx !== i));
  const removeEx = (bi, ei) => { const u = [...blocks]; u[bi].exercises = u[bi].exercises.filter((_, idx) => idx !== ei); setBlocks(u); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !userId) { showToast("❌ Faltan datos", "err"); return; }
    setSaving(true);
    try {
      const url = editing ? `${API_URL}/workouts/${editing._id}` : `${API_URL}/workouts`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, blocks, userId }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      showToast(editing ? "✅ Rutina actualizada" : "🔥 Rutina creada");
      setShowForm(false); resetForm(); load();
    } catch (err) { showToast("❌ " + err.message, "err"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/workouts/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      showToast("🗑️ Rutina eliminada");
      setConfirmDel(null); load();
    } catch (err) { showToast("❌ " + err.message, "err"); }
  };

  const studentName = (uid) => {
    const s = students.find((s) => s._id === uid || s._id === uid?.toString());
    return s ? s.name : uid;
  };

  return (
    <>
      <style>{`
        .cw-wrap { max-width: 1100px; }
        .cw-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .cw-title { font-size: 22px; font-weight: 800; color: #f0f0fa; }
        .cw-sub   { font-size: 13px; color: #55556a; margin-top: 2px; }
        .cw-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 11px;
          font-size: 13px; font-weight: 600; cursor: pointer; border: none;
          background: #FF6B35; color: #fff; transition: all .18s;
        }
        .cw-btn:hover { background: #ff8050; transform: translateY(-1px); }

        /* grid */
        .cw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }

        .cw-card {
          background: #0c0c18; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 20px;
          transition: border-color .2s, transform .18s;
        }
        .cw-card:hover { border-color: rgba(255,107,53,.2); transform: translateY(-2px); }

        .cw-card-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
        .cw-card-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(255,107,53,.12); color: #FF6B35;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .cw-card-name { font-size: 15px; font-weight: 700; color: #f0f0fa; }
        .cw-card-desc { font-size: 12px; color: #55556a; margin-top: 2px; }
        .cw-card-assignee {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; background: rgba(59,130,246,.1); color: #3B82F6;
          padding: 3px 10px; border-radius: 20px; margin-top: 8px; font-weight: 600;
        }

        .cw-blocks { margin: 12px 0; display: flex; flex-direction: column; gap: 6px; }
        .cw-block {
          background: rgba(255,255,255,0.02); border-radius: 9px;
          padding: 10px 12px;
        }
        .cw-block-name { font-size: 11px; font-weight: 700; color: #8888a0; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 6px; }
        .cw-ex { font-size: 12px; color: #c8c8dc; padding: 3px 0; display: flex; justify-content: space-between; }
        .cw-ex-reps { color: #FF6B35; font-weight: 600; }

        .cw-card-actions { display: flex; gap: 8px; margin-top: 14px; }
        .cw-action-btn {
          flex: 1; padding: 8px; border-radius: 9px;
          font-size: 12px; font-weight: 600; cursor: pointer; border: none;
          transition: all .15s;
        }
        .cw-edit-btn { background: rgba(255,107,53,.08); color: #FF6B35; border: 1px solid rgba(255,107,53,.15); }
        .cw-edit-btn:hover { background: rgba(255,107,53,.15); }
        .cw-del-btn  { background: rgba(255,80,80,.06); color: #ff7070; border: 1px solid rgba(255,80,80,.12); }
        .cw-del-btn:hover  { background: rgba(255,80,80,.14); }

        /* empty */
        .cw-empty { text-align: center; padding: 60px 20px; color: #33334a; }

        /* skeleton */
        .cw-skel { height: 200px; background: #0c0c18; border-radius: 16px; animation: bl 1.5s ease-in-out infinite; }
        @keyframes bl { 0%,100%{opacity:.4} 50%{opacity:.7} }

        /* ── MODAL ── */
        .cw-backdrop {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(0,0,0,.75); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .cw-modal {
          background: #0f0f1e; border: 1px solid rgba(255,107,53,.15);
          border-radius: 18px; padding: 28px;
          width: 100%; max-width: 620px; max-height: 88vh; overflow-y: auto;
        }
        .cw-modal h2 { font-size: 18px; font-weight: 700; color: #f0f0fa; margin-bottom: 20px; }
        .cw-field { margin-bottom: 12px; }
        .cw-label { display: block; font-size: 11px; font-weight: 600; color: #55556a; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 5px; }
        .cw-inp {
          width: 100%; padding: 10px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: #e2e2ee; font-size: 14px; outline: none; transition: border-color .18s;
          font-family: inherit;
        }
        .cw-inp:focus { border-color: rgba(255,107,53,.4); }
        .cw-inp.ta { resize: vertical; min-height: 64px; }

        .cw-block-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 14px; margin-bottom: 12px;
        }
        .cw-block-header { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
        .cw-ex-row { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
        .cw-ex-row .cw-inp { flex: 1; min-width: 100px; }
        .cw-rm {
          background: rgba(255,80,80,.1); border: none; color: #ff7070;
          width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          align-self: center;
        }
        .cw-rm:hover { background: rgba(255,80,80,.2); }
        .cw-add {
          background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.1);
          color: #8888a0; padding: 7px 14px; border-radius: 9px;
          cursor: pointer; font-size: 12px; font-weight: 500; transition: all .15s;
        }
        .cw-add:hover { background: rgba(255,255,255,0.06); color: #c8c8dc; }
        .cw-modal-actions { display: flex; gap: 10px; margin-top: 22px; justify-content: flex-end; }
        .cw-sbtn { padding: 9px 22px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all .18s; }
        .cw-sbtn-p { background: #FF6B35; color: #fff; }
        .cw-sbtn-p:hover { background: #ff8050; }
        .cw-sbtn-p:disabled { opacity: .5; cursor: not-allowed; }
        .cw-sbtn-g { background: rgba(255,255,255,0.05); color: #c8c8dc; border: 1px solid rgba(255,255,255,0.08); }
        .cw-sbtn-g:hover { background: rgba(255,255,255,0.09); }

        /* confirm */
        .cw-confirm {
          position: fixed; inset: 0; z-index: 600;
          background: rgba(0,0,0,.8); display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px);
        }
        .cw-confirm-box {
          background: #0f0f1e; border: 1px solid rgba(255,80,80,.2);
          border-radius: 16px; padding: 28px 32px; max-width: 380px; text-align: center;
        }
        .cw-confirm-box h3 { font-size: 16px; font-weight: 700; color: #f0f0fa; margin-bottom: 8px; }
        .cw-confirm-box p  { font-size: 13px; color: #55556a; margin-bottom: 22px; }

        /* toast */
        .cw-toast {
          position: fixed; bottom: 28px; right: 28px; z-index: 999;
          padding: 12px 20px; border-radius: 12px; font-size: 13px; font-weight: 600;
          animation: stUp .3s ease;
        }
        .cw-toast.ok  { background: rgba(16,185,129,.15); border: 1px solid rgba(16,185,129,.3); color: #10B981; }
        .cw-toast.err { background: rgba(255,80,80,.12); border: 1px solid rgba(255,80,80,.25); color: #ff7070; }
        @keyframes stUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="cw-wrap">
        {/* Header */}
        <div className="cw-header">
          <div>
            <h1 className="cw-title">Rutinas</h1>
            <p className="cw-sub">{workouts.length} rutinas creadas</p>
          </div>
          <button className="cw-btn" onClick={openNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva Rutina
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="cw-grid">{[1, 2, 3].map((i) => <div key={i} className="cw-skel" />)}</div>
        ) : workouts.length === 0 ? (
          <div className="cw-empty"><p>No hay rutinas creadas.</p></div>
        ) : (
          <div className="cw-grid">
            {workouts.map((w, i) => (
              <motion.div key={w._id} className="cw-card" {...fade(i)}>
                <div className="cw-card-top">
                  <div className="cw-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 6.5h11M6.5 17.5h11M2 12h20M4.5 9.5v5M19.5 9.5v5"/></svg>
                  </div>
                  <div>
                    <div className="cw-card-name">{w.title}</div>
                    {w.description && <div className="cw-card-desc">{w.description}</div>}
                    {(w.userId || w.user) && (
                      <div className="cw-card-assignee">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        {studentName(w.userId || w.user)}
                      </div>
                    )}
                  </div>
                </div>

                {w.blocks && w.blocks.length > 0 && (
                  <div className="cw-blocks">
                    {w.blocks.slice(0, 2).map((b, bi) => (
                      <div key={bi} className="cw-block">
                        <div className="cw-block-name">{b.name}</div>
                        {(b.exercises || []).slice(0, 3).map((ex, ei) => (
                          <div key={ei} className="cw-ex">
                            <span>{ex.name}</span>
                            <span className="cw-ex-reps">{ex.reps}</span>
                          </div>
                        ))}
                        {b.exercises?.length > 3 && <div style={{ fontSize: 11, color: "#44445a" }}>+{b.exercises.length - 3} más</div>}
                      </div>
                    ))}
                    {w.blocks.length > 2 && <div style={{ fontSize: 11, color: "#44445a", paddingLeft: 4 }}>+{w.blocks.length - 2} bloques más</div>}
                  </div>
                )}

                <div className="cw-card-actions">
                  <button className="cw-action-btn cw-edit-btn" onClick={() => openEdit(w)}>✏️ Editar</button>
                  <button className="cw-action-btn cw-del-btn" onClick={() => setConfirmDel(w)}>🗑️ Eliminar</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL FORM ── */}
      <AnimatePresence>
        {showForm && (
          <div className="cw-backdrop" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div className="cw-modal" initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .95 }} transition={{ duration: .22 }}>
              <h2>{editing ? "✏️ Editar Rutina" : "🏋️ Nueva Rutina"}</h2>

              <form onSubmit={handleSubmit}>
                <div className="cw-field">
                  <label className="cw-label">Título</label>
                  <input className="cw-inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Día 1 — Piernas" required />
                </div>
                <div className="cw-field">
                  <label className="cw-label">Descripción</label>
                  <textarea className="cw-inp ta" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción..." />
                </div>
                <div className="cw-field">
                  <label className="cw-label">Asignar a alumno</label>
                  <select className="cw-inp" value={userId} onChange={(e) => setUserId(e.target.value)} required>
                    <option value="">Seleccionar alumno...</option>
                    {students.map((s) => <option key={s._id} value={s._id}>{s.name} — {s.email}</option>)}
                  </select>
                </div>

                <p style={{ fontSize: 11, fontWeight: 700, color: "#55556a", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 12 }}>Bloques</p>

                {blocks.map((block, bi) => (
                  <div key={bi} className="cw-block-card">
                    <div className="cw-block-header">
                      <input className="cw-inp" value={block.name} onChange={(e) => handleBlockName(bi, e.target.value)} placeholder="Nombre del bloque" style={{ flex: 1 }} />
                      <button type="button" className="cw-rm" onClick={() => removeBlock(bi)} title="Eliminar bloque">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    {block.exercises.map((ex, ei) => (
                      <div key={ei} className="cw-ex-row">
                        <input className="cw-inp" placeholder="Ejercicio" value={ex.name} onChange={(e) => handleEx(bi, ei, "name", e.target.value)} required />
                        <input className="cw-inp" placeholder="Reps" value={ex.reps} onChange={(e) => handleEx(bi, ei, "reps", e.target.value)} style={{ maxWidth: 90 }} required />
                        <input className="cw-inp" placeholder="Video URL" value={ex.video} onChange={(e) => handleEx(bi, ei, "video", e.target.value)} style={{ maxWidth: 160 }} />
                        <button type="button" className="cw-rm" onClick={() => removeEx(bi, ei)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ))}
                    <button type="button" className="cw-add" onClick={() => addExercise(bi)}>+ Ejercicio</button>
                  </div>
                ))}

                <button type="button" className="cw-add" style={{ width: "100%", marginBottom: 4 }} onClick={addBlock}>+ Agregar bloque</button>

                <div className="cw-modal-actions">
                  <button type="button" className="cw-sbtn cw-sbtn-g" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</button>
                  <button type="submit" className="cw-sbtn cw-sbtn-p" disabled={saving}>{saving ? "Guardando..." : editing ? "Actualizar" : "Crear Rutina"}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DELETE ── */}
      {confirmDel && (
        <div className="cw-confirm" onClick={(e) => e.target === e.currentTarget && setConfirmDel(null)}>
          <motion.div className="cw-confirm-box" initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}>
            <h3>¿Eliminar rutina?</h3>
            <p>Esta acción no se puede deshacer. Se eliminará <strong style={{ color: "#e2e2ee" }}>{confirmDel.title}</strong>.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="cw-sbtn cw-sbtn-g" onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="cw-sbtn cw-sbtn-p" style={{ background: "#ff4444" }} onClick={() => handleDelete(confirmDel._id)}>Eliminar</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`cw-toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}