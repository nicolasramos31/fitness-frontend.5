import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API_URL from "../../api";

const fade = (i = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.33, delay: i * 0.06 } });

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}
function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const FILE_CATEGORIES = [
  { id: "apto_fisico",  label: "Apto Físico",      icon: "🏃", color: "#10B981" },
  { id: "estudios",     label: "Estudios / Lab",    icon: "🧪", color: "#3B82F6" },
  { id: "radiografia",  label: "Radiografía / Eco", icon: "🩻", color: "#A855F7" },
  { id: "cardiologia",  label: "Cardiología",       icon: "❤️", color: "#EF4444" },
  { id: "otro",         label: "Otro",              icon: "📎", color: "#F59E0B" },
];
const getCat = (id) => FILE_CATEGORIES.find(c => c.id === id) || FILE_CATEGORIES[4];

// 🔥 FIX: normaliza IDs que pueden venir como string u ObjectId/objeto
const normalizeId = (val) => val?._id?.toString() || val?.toString() || "";

/* ── Grupo colapsable por alumno ── */
function StudentFileGroup({ group, index, onPreview }) {
  const [open, setOpen] = useState(true);
  const { student, files } = group;
  return (
    <motion.div style={{marginBottom:20}} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:index*0.07}}>
      {/* Header alumno */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"14px 18px",
          background:"#0c0c18", border:"1px solid rgba(255,255,255,.07)",
          borderRadius:14, marginBottom:open ? 8 : 0, cursor:"pointer",
          transition:"border-color .18s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,107,53,.25)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"}
      >
        <div style={{
          width:42, height:42, borderRadius:12, background:"rgba(255,107,53,.14)",
          color:"#FF6B35", display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:700, fontSize:16, flexShrink:0, overflow:"hidden"
        }}>
          {student.profileImage
            ? <img src={student.profileImage} alt={student.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : (student.name||"?")[0].toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:"#f0f0fa"}}>{student.name}</div>
          <div style={{fontSize:12,color:"#55556a"}}>{student.email}</div>
        </div>
        <span style={{
          fontSize:11, fontWeight:700, background:"rgba(255,107,53,.1)", color:"#FF6B35",
          padding:"4px 12px", borderRadius:20, flexShrink:0
        }}>
          {files.length} archivo{files.length !== 1 ? "s" : ""}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#55556a" strokeWidth="2" strokeLinecap="round"
          style={{transform: open ? "rotate(90deg)" : "rotate(0deg)", transition:"transform .2s", flexShrink:0}}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}
            exit={{opacity:0,height:0}} transition={{duration:.22}}
            style={{display:"flex",flexDirection:"column",gap:8,paddingLeft:8,overflow:"hidden"}}
          >
            {files.map((file, i) => {
              const cat = getCat(file.category);
              return (
                <div key={file._id || i} style={{
                  display:"flex", alignItems:"center", gap:12,
                  background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.04)",
                  borderRadius:12, padding:"12px 16px", transition:"border-color .18s",
                }}>
                  <span style={{fontSize:22, flexShrink:0}}>{cat.icon}</span>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#e2e2ee",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {file.fileName || file.name}
                    </div>
                    <div style={{fontSize:11,color:"#55556a",display:"flex",gap:10,marginTop:2,flexWrap:"wrap"}}>
                      <span>📅 {formatDate(file.createdAt)}</span>
                      {file.fileSize && <span>📦 {formatSize(file.fileSize)}</span>}
                    </div>
                    {file.description && (
                      <div style={{fontSize:11,color:"#8888a0",marginTop:3,fontStyle:"italic"}}>"{file.description}"</div>
                    )}
                  </div>
                  <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,background:`${cat.color}18`,color:cat.color,flexShrink:0}}>
                    {cat.label}
                  </span>
                  {file.fileData && (
                    <div style={{display:"flex",gap:8,flexShrink:0}}>
                      <button onClick={() => onPreview(file)} style={{
                        padding:"6px 13px", borderRadius:8,
                        background:"rgba(168,85,247,.1)", border:"1px solid rgba(168,85,247,.18)",
                        color:"#A855F7", fontSize:12, fontWeight:600, cursor:"pointer",
                      }}>
                        👁 Ver
                      </button>
                      <a href={file.fileData} download={file.fileName} target="_blank" rel="noreferrer" style={{
                        display:"inline-flex", alignItems:"center", gap:5,
                        padding:"6px 13px", borderRadius:8,
                        background:"rgba(59,130,246,.1)", border:"1px solid rgba(59,130,246,.18)",
                        color:"#3B82F6", fontSize:12, fontWeight:600, textDecoration:"none",
                      }}>
                        ⬇ Descargar
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CoachHistory() {
  const token = localStorage.getItem("token");
  const [tab,      setTab]      = useState("workouts");
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState("all");
  const [history,  setHistory]  = useState([]);
  const [medFiles, setMedFiles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [preview,  setPreview]  = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, hRes, fRes] = await Promise.all([
          fetch(`${API_URL}/auth/students`,     { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/progress`,           { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/medical-files/all`,  { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (sRes.ok) { const d = await sRes.json(); setStudents(d.students || d || []); }
        if (hRes.ok) { const d = await hRes.json(); setHistory(d.progress || d || []); }
        if (fRes.ok) { const d = await fRes.json(); setMedFiles(d.files || d || []); }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  // 🔥 FIX: normaliza uid que puede ser string o { _id: "..." }
  const studentName = (uid) => {
    const id = normalizeId(uid);
    const s = students.find(s => normalizeId(s._id) === id);
    return s ? s.name : "Alumno";
  };

  // 🔥 FIX: normaliza IDs para filtrar history
  const filteredHistory = selected === "all"
    ? history
    : history.filter(h => normalizeId(h.user || h.userId) === selected);

  // 🔥 FIX: normaliza IDs para filtrar archivos médicos
  const filteredFiles = selected === "all"
    ? medFiles
    : medFiles.filter(f => normalizeId(f.user || f.userId) === selected);

  // 🔥 FIX: agrupación correcta usando normalizeId en todos los campos
  const filesByStudent = selected === "all"
    ? students
        .map(s => ({
          student: s,
          files: medFiles.filter(f => normalizeId(f.user || f.userId) === normalizeId(s._id)),
        }))
        .filter(g => g.files.length > 0)
    : [{
        student: students.find(s => normalizeId(s._id) === selected) || { name: "Alumno", _id: selected },
        files: filteredFiles,
      }].filter(g => g.files.length > 0);

  return (
    <>
      <style>{`
        .ch-wrap { max-width: 1000px; }
        .ch-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; flex-wrap:wrap; gap:12px; }
        .ch-title { font-size:22px; font-weight:800; color:#f0f0fa; }
        .ch-sub   { font-size:13px; color:#55556a; margin-top:2px; }

        .ch-tab-bar { display:flex; gap:4px; margin-bottom:22px; background:rgba(255,255,255,.03); padding:4px; width:fit-content; border-radius:12px; }
        .ch-tab-btn {
          padding:9px 20px; border-radius:9px; border:none; cursor:pointer;
          font-size:13px; font-weight:600; transition:all .18s;
        }
        .ch-tab-btn.active { background:#0f0f1e; color:#f0f0fa; box-shadow:0 1px 4px rgba(0,0,0,.4); }
        .ch-tab-btn:not(.active) { background:transparent; color:#55556a; }

        .ch-filters { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:22px; }
        .ch-filter {
          padding:7px 16px; border-radius:20px;
          font-size:12px; font-weight:600; cursor:pointer; border:none;
          background:rgba(255,255,255,.04); color:#8888a0; transition:all .18s;
        }
        .ch-filter.active { background:rgba(255,107,53,.12); color:#FF6B35; }
        .ch-filter:hover:not(.active) { background:rgba(255,255,255,.07); color:#c8c8dc; }

        .ch-list { display:flex; flex-direction:column; gap:12px; }
        .ch-entry { background:#0c0c18; border:1px solid rgba(255,255,255,.06); border-radius:14px; padding:18px 20px; transition:border-color .2s; }
        .ch-entry:hover { border-color:rgba(255,107,53,.18); }
        .ch-entry-top { display:flex; align-items:center; gap:14px; margin-bottom:10px; }
        .ch-av { width:40px; height:40px; border-radius:11px; background:rgba(255,107,53,.12); color:#FF6B35; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:15px; flex-shrink:0; }
        .ch-name { font-size:14px; font-weight:700; color:#f0f0fa; }
        .ch-workout { font-size:12px; color:#8888a0; margin-top:1px; }
        .ch-date { margin-left:auto; font-size:11px; font-weight:600; background:rgba(255,255,255,.04); color:#8888a0; padding:4px 11px; border-radius:20px; flex-shrink:0; }
        .ch-status { font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; background:rgba(16,185,129,.1); color:#10B981; flex-shrink:0; }
        .ch-exs { display:flex; flex-wrap:wrap; gap:6px; }
        .ch-ex-tag { font-size:11px; font-weight:500; background:rgba(255,255,255,.04); color:#8888a0; padding:4px 11px; border-radius:20px; }
        .ch-ex-tag.done { background:rgba(16,185,129,.08); color:#10B981; }

        .ch-empty { text-align:center; padding:60px 20px; color:#33334a; font-size:13px; }
        .ch-skel  { height:88px; background:#0c0c18; border-radius:14px; animation:chl 1.5s infinite; margin-bottom:10px; }
        @keyframes chl { 0%,100%{opacity:.4} 50%{opacity:.7} }

        /* preview modal */
        .mh-back {
          position:fixed; inset:0; z-index:600;
          background:rgba(0,0,0,.88); backdrop-filter:blur(6px);
          display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .mh-box {
          background:#0f0f1e; border:1px solid rgba(255,255,255,.1);
          border-radius:18px; padding:24px;
          max-width:760px; width:100%; max-height:90vh;
          display:flex; flex-direction:column; gap:16px;
        }
        .mh-box-head { display:flex; justify-content:space-between; align-items:flex-start; }
        .mh-close { width:34px; height:34px; border-radius:9px; background:rgba(255,255,255,.06); border:none; color:#8888a0; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:18px; flex-shrink:0; }
        .mh-close:hover { background:rgba(255,80,80,.15); color:#ff7070; }
        .mh-preview-img { max-width:100%; max-height:60vh; border-radius:10px; object-fit:contain; margin:0 auto; display:block; }
        .mh-preview-pdf { width:100%; height:62vh; border-radius:10px; border:1px solid rgba(255,255,255,.08); }
      `}</style>

      <div className="ch-wrap">
        <div className="ch-header">
          <div>
            <h1 className="ch-title">Historial</h1>
            <p className="ch-sub">
              {tab === "workouts"
                ? `${filteredHistory.length} entrenamientos registrados`
                : `${medFiles.length} archivos médicos · ${filesByStudent.length} alumnos con archivos`}
            </p>
          </div>
        </div>

        {/* Tabs principales */}
        <div className="ch-tab-bar">
          <button className={`ch-tab-btn ${tab === "workouts" ? "active" : ""}`} onClick={() => setTab("workouts")}>
            🏋️ Entrenamientos
          </button>
          <button className={`ch-tab-btn ${tab === "files" ? "active" : ""}`} onClick={() => setTab("files")}>
            🩺 Archivos médicos {medFiles.length > 0 && `(${medFiles.length})`}
          </button>
        </div>

        {/* Filtro por alumno */}
        <div className="ch-filters">
          <button className={`ch-filter ${selected === "all" ? "active" : ""}`} onClick={() => setSelected("all")}>
            Todos
          </button>
          {students.map(s => (
            <button
              key={s._id}
              className={`ch-filter ${selected === normalizeId(s._id) ? "active" : ""}`}
              onClick={() => setSelected(normalizeId(s._id))}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* ── ENTRENAMIENTOS ── */}
        {tab === "workouts" && (
          loading ? (
            <div className="ch-list">{[1,2,3,4].map(i => <div key={i} className="ch-skel"/>)}</div>
          ) : filteredHistory.length === 0 ? (
            <div className="ch-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{opacity:.3,marginBottom:12,display:"block",margin:"0 auto 12px"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p>No hay entrenamientos registrados aún</p>
            </div>
          ) : (
            <div className="ch-list">
              {filteredHistory.map((entry, i) => (
                <motion.div key={entry._id || i} className="ch-entry" {...fade(i)}>
                  <div className="ch-entry-top">
                    <div className="ch-av">
                      {(studentName(entry.user || entry.userId) || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="ch-name">{studentName(entry.user || entry.userId)}</div>
                      {/* 🔥 FIX: workout puede venir populado como objeto */}
                      <div className="ch-workout">
                        {entry.workout?.title || entry.workout?.name || entry.workoutTitle || "Entrenamiento"}
                      </div>
                    </div>
                    <span className="ch-date">{formatDate(entry.date || entry.createdAt)}</span>
                    <span className="ch-status">✓ Completado</span>
                  </div>
                  {(entry.exercises || entry.completedExercises || []).length > 0 && (
                    <div className="ch-exs">
                      {(entry.exercises || entry.completedExercises).map((ex, ei) => (
                        <span key={ei} className={`ch-ex-tag ${ex.done || ex.completed ? "done" : ""}`}>
                          {ex.name || ex.exerciseId}{ex.reps ? ` · ${ex.reps}` : ""}
                          {(ex.done || ex.completed) ? " ✓" : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  {entry.notes && <p style={{fontSize:12,color:"#55556a",marginTop:10,fontStyle:"italic"}}>"{entry.notes}"</p>}
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* ── ARCHIVOS MÉDICOS ── */}
        {tab === "files" && (
          loading ? (
            <div className="ch-list">{[1,2,3].map(i => <div key={i} className="ch-skel"/>)}</div>
          ) : filesByStudent.length === 0 ? (
            <div className="ch-empty">
              <div style={{fontSize:44,marginBottom:14,opacity:.4}}>🩺</div>
              <p>{selected === "all" ? "Ningún alumno ha subido archivos médicos aún" : "Este alumno todavía no subió archivos"}</p>
              <p style={{fontSize:12,color:"#33334a",marginTop:8}}>Los alumnos pueden subir sus aptos y estudios desde "Mis Archivos Médicos"</p>
            </div>
          ) : (
            <div>
              {filesByStudent.map((group, gi) => (
                <StudentFileGroup key={normalizeId(group.student._id)} group={group} index={gi} onPreview={setPreview} />
              ))}
            </div>
          )
        )}
      </div>

      {/* ── MODAL PREVIEW ── */}
      <AnimatePresence>
        {preview && (
          <div className="mh-back" onClick={e => e.target === e.currentTarget && setPreview(null)}>
            <motion.div className="mh-box" initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.95}} transition={{duration:.22}}>
              <div className="mh-box-head">
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"#f0f0fa"}}>{preview.fileName}</div>
                  <div style={{fontSize:11,color:"#55556a",marginTop:3}}>
                    {getCat(preview.category).label} · {formatDate(preview.createdAt)}
                    {preview.fileSize && ` · ${formatSize(preview.fileSize)}`}
                  </div>
                  {preview.description && (
                    <div style={{fontSize:12,color:"#8888a0",marginTop:4,fontStyle:"italic"}}>"{preview.description}"</div>
                  )}
                </div>
                <button className="mh-close" onClick={() => setPreview(null)}>✕</button>
              </div>

              {preview.fileData && (
                preview.fileType?.includes("pdf")
                  ? <iframe src={preview.fileData} className="mh-preview-pdf" title={preview.fileName}/>
                  : <img src={preview.fileData} alt={preview.fileName} className="mh-preview-img"/>
              )}

              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <a href={preview.fileData} download={preview.fileName} target="_blank" rel="noreferrer"
                  style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,background:"rgba(59,130,246,.1)",border:"1px solid rgba(59,130,246,.2)",color:"#3B82F6",fontSize:13,fontWeight:600,textDecoration:"none"}}>
                  ⬇ Descargar
                </a>
                <button onClick={() => setPreview(null)}
                  style={{padding:"9px 18px",borderRadius:10,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",color:"#c8c8dc",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}