import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API_URL from "../api";

const FILE_CATEGORIES = [
  { id: "apto_fisico",   label: "Apto Físico",        icon: "🏃", color: "#10B981" },
  { id: "estudios",      label: "Estudios / Lab",      icon: "🧪", color: "#3B82F6" },
  { id: "radiografia",   label: "Radiografía / Eco",   icon: "🩻", color: "#A855F7" },
  { id: "cardiologia",   label: "Cardiología",         icon: "❤️", color: "#EF4444" },
  { id: "otro",          label: "Otro",                icon: "📎", color: "#F59E0B" },
];

const MAX_SIZE_MB = 10;

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(str) {
  return new Date(str).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function getCat(id) {
  return FILE_CATEGORIES.find(c => c.id === id) || FILE_CATEGORIES[4];
}

export default function MedicalFiles() {
  const token  = localStorage.getItem("token");
  const user   = JSON.parse(localStorage.getItem("user") || "{}");
  const fileRef = useRef(null);

  const [files,    setFiles]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast,    setToast]    = useState(null);
  const [deleting, setDeleting] = useState(null);

  // form
  const [category,    setCategory]    = useState("apto_fisico");
  const [description, setDescription] = useState("");
  const [fileData,    setFileData]    = useState(null); // { name, size, type, base64 }
  const [uploading,   setUploading]   = useState(false);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── Cargar archivos ── */
  const loadFiles = async () => {
    try {
      const res = await fetch(`${API_URL}/medical-files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setFiles(d.files || d || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadFiles(); }, []);

  /* ── Seleccionar archivo ── */
  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      showToast(`❌ El archivo supera los ${MAX_SIZE_MB}MB`, "err");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileData({ name: f.name, size: f.size, type: f.type, base64: reader.result });
    };
    reader.readAsDataURL(f);
  };

  /* ── Subir archivo ── */
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileData) { showToast("❌ Seleccioná un archivo", "err"); return; }
    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/medical-files`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category,
          description,
          fileName:  fileData.name,
          fileSize:  fileData.size,
          fileType:  fileData.type,
          fileData:  fileData.base64,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Error al subir");
      }
      showToast("✅ Archivo subido correctamente");
      setShowForm(false);
      setFileData(null);
      setDescription("");
      setCategory("apto_fisico");
      loadFiles();
    } catch (err) {
      showToast("❌ " + err.message, "err");
    }
    setUploading(false);
  };

  /* ── Eliminar archivo ── */
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/medical-files/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      showToast("🗑️ Archivo eliminado");
      setDeleting(null);
      loadFiles();
    } catch (err) {
      showToast("❌ " + err.message, "err");
    }
  };

  const grouped = FILE_CATEGORIES.map(cat => ({
    ...cat,
    items: files.filter(f => f.category === cat.id),
  })).filter(g => g.items.length > 0);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .mf-page {
          min-height: 100vh;
          background: #080810;
          padding: 40px 28px 60px;
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #e2e2ee;
        }
        .mf-wrap { max-width: 900px; margin: 0 auto; }

        /* header */
        .mf-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:28px; flex-wrap:wrap; gap:12px; }
        .mf-title { font-size:22px; font-weight:800; color:#f0f0fa; }
        .mf-sub   { font-size:13px; color:#55556a; margin-top:3px; }

        .mf-upload-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:10px 20px; border-radius:11px;
          background:#FF6B35; border:none; color:#fff;
          font-size:13px; font-weight:700; cursor:pointer;
          transition:all .18s;
        }
        .mf-upload-btn:hover { background:#ff8050; transform:translateY(-1px); box-shadow:0 6px 20px rgba(255,107,53,.3); }

        /* info banner */
        .mf-info {
          display:flex; align-items:center; gap:12px;
          background:rgba(59,130,246,.07); border:1px solid rgba(59,130,246,.15);
          border-radius:12px; padding:14px 18px; margin-bottom:28px;
          font-size:12px; color:#8888a0; line-height:1.6;
        }
        .mf-info-icon { font-size:22px; flex-shrink:0; }

        /* categories */
        .mf-cats { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:24px; }
        .mf-cat-chip {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600;
          background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
          color:#8888a0; cursor:pointer; transition:all .15s;
        }
        .mf-cat-chip.active { color:#fff; }

        /* file groups */
        .mf-group { margin-bottom:28px; }
        .mf-group-header {
          display:flex; align-items:center; gap:8px;
          margin-bottom:12px;
        }
        .mf-group-icon { font-size:18px; }
        .mf-group-name { font-size:14px; font-weight:700; color:#e2e2ee; }
        .mf-group-count { font-size:11px; color:#55556a; background:rgba(255,255,255,.04); padding:2px 9px; border-radius:20px; }

        /* file cards */
        .mf-files { display:flex; flex-direction:column; gap:10px; }
        .mf-file {
          display:flex; align-items:center; gap:14px;
          background:#0c0c18; border:1px solid rgba(255,255,255,.06);
          border-radius:14px; padding:16px 18px;
          transition:border-color .18s;
        }
        .mf-file:hover { border-color:rgba(255,107,53,.2); }
        .mf-file-ico {
          width:46px; height:46px; border-radius:13px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          font-size:22px;
        }
        .mf-file-name { font-size:14px; font-weight:600; color:#f0f0fa; margin-bottom:3px; }
        .mf-file-meta { font-size:11px; color:#55556a; display:flex; gap:12px; flex-wrap:wrap; }
        .mf-file-desc { font-size:12px; color:#8888a0; margin-top:3px; font-style:italic; }

        .mf-file-actions { margin-left:auto; display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .mf-view-btn {
          display:inline-flex; align-items:center; gap:5px;
          padding:7px 14px; border-radius:9px;
          background:rgba(59,130,246,.1); border:1px solid rgba(59,130,246,.18);
          color:#3B82F6; font-size:12px; font-weight:600;
          text-decoration:none; cursor:pointer; transition:all .15s;
        }
        .mf-view-btn:hover { background:rgba(59,130,246,.18); }
        .mf-del-btn {
          width:34px; height:34px; border-radius:9px;
          background:rgba(255,80,80,.08); border:1px solid rgba(255,80,80,.15);
          color:#ff7070; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          transition:all .15s;
        }
        .mf-del-btn:hover { background:rgba(255,80,80,.18); }

        /* empty */
        .mf-empty {
          text-align:center; padding:60px 20px; color:#33334a;
        }
        .mf-empty-ico { font-size:48px; margin-bottom:14px; opacity:.4; }
        .mf-empty-text { font-size:14px; margin-bottom:20px; }

        /* skeleton */
        .mf-skel { height:78px; background:#0c0c18; border-radius:14px; margin-bottom:10px; animation:mfBl 1.5s infinite; }
        @keyframes mfBl { 0%,100%{opacity:.4} 50%{opacity:.7} }

        /* ── MODAL ── */
        .mf-backdrop {
          position:fixed; inset:0; z-index:500;
          background:rgba(0,0,0,.78); backdrop-filter:blur(5px);
          display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .mf-modal {
          background:#0f0f1e; border:1px solid rgba(255,107,53,.15);
          border-radius:20px; padding:28px;
          width:100%; max-width:500px;
        }
        .mf-modal-title { font-size:18px; font-weight:700; color:#f0f0fa; margin-bottom:5px; }
        .mf-modal-sub   { font-size:12px; color:#55556a; margin-bottom:22px; }

        .mf-cat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:18px; }
        .mf-cat-opt {
          padding:10px 8px; border-radius:11px; border:2px solid rgba(255,255,255,.06);
          cursor:pointer; text-align:center; transition:all .18s; background:transparent;
        }
        .mf-cat-opt:hover { border-color:rgba(255,255,255,.15); }
        .mf-cat-opt.sel { border-color:var(--c); background:rgba(255,255,255,.04); }
        .mf-cat-opt-ico  { font-size:20px; margin-bottom:4px; }
        .mf-cat-opt-name { font-size:11px; font-weight:600; color:#c8c8dc; }

        .mf-label { display:block; font-size:11px; font-weight:700; color:#55556a; text-transform:uppercase; letter-spacing:.7px; margin-bottom:6px; }
        .mf-input {
          width:100%; padding:11px 13px; border-radius:10px;
          background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
          color:#e2e2ee; font-size:14px; outline:none; transition:border-color .18s;
          font-family:inherit; margin-bottom:14px;
        }
        .mf-input:focus { border-color:rgba(255,107,53,.4); }
        .mf-input::placeholder { color:#2a2a40; }
        .mf-input.ta { resize:vertical; min-height:70px; }

        .mf-drop {
          border:2px dashed rgba(255,255,255,.1); border-radius:12px;
          padding:28px; text-align:center; cursor:pointer;
          transition:all .2s; background:rgba(255,255,255,.01); margin-bottom:16px;
        }
        .mf-drop:hover { border-color:rgba(255,107,53,.4); background:rgba(255,107,53,.04); }
        .mf-drop-ico  { font-size:32px; margin-bottom:8px; }
        .mf-drop-text { font-size:13px; color:#8888a0; }
        .mf-drop-text span { color:#FF6B35; font-weight:600; }
        .mf-drop-hint { font-size:11px; color:#33334a; margin-top:4px; }
        .mf-selected-file {
          display:flex; align-items:center; gap:10px;
          background:rgba(255,107,53,.07); border:1px solid rgba(255,107,53,.15);
          border-radius:10px; padding:10px 14px; margin-bottom:16px;
          font-size:13px; color:#c8c8dc;
        }
        .mf-selected-file-name { font-weight:600; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .mf-selected-file-size { font-size:11px; color:#55556a; flex-shrink:0; }

        .mf-modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:4px; }
        .mf-btn { padding:10px 22px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .18s; }
        .mf-btn-p { background:#FF6B35; color:#fff; }
        .mf-btn-p:hover { background:#ff8050; }
        .mf-btn-p:disabled { opacity:.5; cursor:not-allowed; }
        .mf-btn-g { background:rgba(255,255,255,.05); color:#c8c8dc; border:1px solid rgba(255,255,255,.08); }
        .mf-btn-g:hover { background:rgba(255,255,255,.09); }

        /* confirm delete */
        .mf-confirm {
          position:fixed; inset:0; z-index:600;
          background:rgba(0,0,0,.8); display:flex; align-items:center; justify-content:center;
          backdrop-filter:blur(4px);
        }
        .mf-confirm-box {
          background:#0f0f1e; border:1px solid rgba(255,80,80,.2);
          border-radius:16px; padding:28px 32px; max-width:360px; text-align:center;
        }
        .mf-confirm-box h3 { font-size:16px; font-weight:700; color:#f0f0fa; margin-bottom:8px; }
        .mf-confirm-box p  { font-size:13px; color:#55556a; margin-bottom:22px; }

        /* toast */
        .mf-toast {
          position:fixed; bottom:28px; right:28px; z-index:999;
          padding:12px 20px; border-radius:12px; font-size:13px; font-weight:600;
          animation:mfUp .3s ease;
        }
        .mf-toast.ok  { background:rgba(16,185,129,.15); border:1px solid rgba(16,185,129,.3); color:#10B981; }
        .mf-toast.err { background:rgba(255,80,80,.12); border:1px solid rgba(255,80,80,.25); color:#ff7070; }
        @keyframes mfUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        @media(max-width:600px) {
          .mf-page { padding:24px 14px 40px; }
          .mf-cat-grid { grid-template-columns:repeat(2,1fr); }
          .mf-file-actions { flex-direction:column; }
        }
      `}</style>

      <div className="mf-page">
        <div className="mf-wrap">

          {/* Header */}
          <div className="mf-header">
            <div>
              <h1 className="mf-title">Mis Archivos Médicos</h1>
              <p className="mf-sub">Aptos físicos, estudios, análisis y documentación de salud</p>
            </div>
            <button className="mf-upload-btn" onClick={() => setShowForm(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Subir archivo
            </button>
          </div>

          {/* Info */}
          <div className="mf-info">
            <span className="mf-info-icon">🔒</span>
            <span>
              Tus archivos son privados y solo tu coach puede verlos. Podés subir aptos físicos, resultados de análisis, electrocardiogramas, radiografías o cualquier documentación relacionada con tu salud y aptitud física.
              Formatos: <strong style={{color:"#c8c8dc"}}>PDF, JPG, PNG</strong> · Máximo <strong style={{color:"#c8c8dc"}}>{MAX_SIZE_MB}MB</strong> por archivo.
            </span>
          </div>

          {/* Contenido */}
          {loading ? (
            <><div className="mf-skel"/><div className="mf-skel"/><div className="mf-skel"/></>
          ) : files.length === 0 ? (
            <motion.div className="mf-empty" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
              <div className="mf-empty-ico">🩺</div>
              <p className="mf-empty-text">Todavía no subiste ningún archivo</p>
              <button className="mf-upload-btn" onClick={() => setShowForm(true)}>
                Subir primer archivo
              </button>
            </motion.div>
          ) : (
            <div>
              {grouped.map((group, gi) => (
                <motion.div key={group.id} className="mf-group" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay: gi * 0.07}}>
                  <div className="mf-group-header">
                    <span className="mf-group-icon">{group.icon}</span>
                    <span className="mf-group-name">{group.label}</span>
                    <span className="mf-group-count">{group.items.length}</span>
                  </div>
                  <div className="mf-files">
                    {group.items.map((file, i) => (
                      <motion.div key={file._id || i} className="mf-file" initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay: i * 0.05}}>
                        <div className="mf-file-ico" style={{background:`${group.color}14`}}>
                          {group.icon}
                        </div>
                        <div style={{flex:1, minWidth:0}}>
                          <div className="mf-file-name">{file.fileName || file.name}</div>
                          <div className="mf-file-meta">
                            <span>📅 {formatDate(file.createdAt || file.date)}</span>
                            {file.fileSize && <span>📦 {formatSize(file.fileSize)}</span>}
                            <span style={{color: group.color}}>{group.label}</span>
                          </div>
                          {file.description && <div className="mf-file-desc">"{file.description}"</div>}
                        </div>
                        <div className="mf-file-actions">
                          {file.fileData && (
                            <a
                              className="mf-view-btn"
                              href={file.fileData}
                              download={file.fileName}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              Ver / Descargar
                            </a>
                          )}
                          <button className="mf-del-btn" onClick={() => setDeleting(file)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Archivos sin categoría coincidente */}
              {files.filter(f => !FILE_CATEGORIES.find(c => c.id === f.category)).length > 0 && (
                <div className="mf-group">
                  <div className="mf-group-header">
                    <span className="mf-group-icon">📎</span>
                    <span className="mf-group-name">Otros</span>
                  </div>
                  <div className="mf-files">
                    {files.filter(f => !FILE_CATEGORIES.find(c => c.id === f.category)).map((file, i) => (
                      <div key={file._id || i} className="mf-file">
                        <div className="mf-file-ico" style={{background:"rgba(245,158,11,.12)"}}>📎</div>
                        <div style={{flex:1}}>
                          <div className="mf-file-name">{file.fileName || file.name}</div>
                          <div className="mf-file-meta"><span>{formatDate(file.createdAt)}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL SUBIR ARCHIVO ── */}
      <AnimatePresence>
        {showForm && (
          <div className="mf-backdrop" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div className="mf-modal" initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.95}} transition={{duration:.22}}>
              <div className="mf-modal-title">📎 Subir archivo</div>
              <div className="mf-modal-sub">Elegí la categoría y adjuntá tu documento</div>

              <form onSubmit={handleUpload}>
                {/* Categoría */}
                <label className="mf-label">Categoría</label>
                <div className="mf-cat-grid">
                  {FILE_CATEGORIES.map(cat => (
                    <div
                      key={cat.id}
                      className={`mf-cat-opt ${category === cat.id ? "sel" : ""}`}
                      style={{"--c": cat.color}}
                      onClick={() => setCategory(cat.id)}
                    >
                      <div className="mf-cat-opt-ico">{cat.icon}</div>
                      <div className="mf-cat-opt-name">{cat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Descripción */}
                <label className="mf-label">Descripción (opcional)</label>
                <textarea
                  className="mf-input ta"
                  placeholder="Ej: Apto para actividad física emitido en enero 2025..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />

                {/* Archivo */}
                <label className="mf-label">Archivo</label>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{display:"none"}} onChange={handleFileSelect} />

                {fileData ? (
                  <div className="mf-selected-file">
                    <span style={{fontSize:20}}>
                      {fileData.type.includes("pdf") ? "📄" : "🖼️"}
                    </span>
                    <span className="mf-selected-file-name">{fileData.name}</span>
                    <span className="mf-selected-file-size">{formatSize(fileData.size)}</span>
                    <button type="button" onClick={() => { setFileData(null); fileRef.current.value = ""; }}
                      style={{background:"none",border:"none",color:"#ff7070",cursor:"pointer",fontSize:16}}>✕</button>
                  </div>
                ) : (
                  <div className="mf-drop" onClick={() => fileRef.current?.click()}>
                    <div className="mf-drop-ico">📂</div>
                    <div className="mf-drop-text"><span>Hacer click</span> para seleccionar</div>
                    <div className="mf-drop-hint">PDF, JPG, PNG · máximo {MAX_SIZE_MB}MB</div>
                  </div>
                )}

                <div className="mf-modal-actions">
                  <button type="button" className="mf-btn mf-btn-g" onClick={() => { setShowForm(false); setFileData(null); }}>
                    Cancelar
                  </button>
                  <button type="submit" className="mf-btn mf-btn-p" disabled={uploading || !fileData}>
                    {uploading ? "Subiendo..." : "Subir archivo"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DELETE ── */}
      {deleting && (
        <div className="mf-confirm" onClick={e => e.target === e.currentTarget && setDeleting(null)}>
          <motion.div className="mf-confirm-box" initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}}>
            <h3>¿Eliminar archivo?</h3>
            <p>Se eliminará <strong style={{color:"#e2e2ee"}}>{deleting.fileName}</strong>. Esta acción no se puede deshacer.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button className="mf-btn mf-btn-g" onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="mf-btn mf-btn-p" style={{background:"#ef4444"}} onClick={() => handleDelete(deleting._id)}>
                Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {toast && <div className={`mf-toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}