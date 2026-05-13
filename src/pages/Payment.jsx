import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import API_URL from "../api";

/* ── EDITÁ ESTOS DATOS CON LOS TUYOS ── */
const TRANSFER = {
  alias:   "maria.luisa.memoli",          // ← tu alias real
  cbu:     "0140190103520752384045",  // ← tu CBU real
  titular: "Mmemoli maria luisa",          // ← nombre real del titular
  banco:   "Banco provinicia",
  whatsapp: "2215625486",
};

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="pt-copy" onClick={handle} title="Copiar">
      {copied
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
    </button>
  );
}

export default function Payment() {
  const [params] = useSearchParams();

  // El monto puede venir por URL: /pago?monto=15000
  // O el coach lo puede editar manualmente en la plataforma.
  // Por ahora se muestra como campo editable si no viene por URL.
  const montoUrl = params.get("monto") || "";

  const [monto,   setMonto]   = useState(montoUrl);
  const [step,    setStep]    = useState(montoUrl ? 2 : 1); // si viene monto, salta directo
  const [nombre,  setNombre]  = useState("");
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);

  /* formato pesos */
  const fmt = (n) =>
    Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onloadend = () => setPreview(r.result);
    r.readAsDataURL(file);
  };

  const handleWhatsApp = () => {
    setSending(true);
    const msg = encodeURIComponent(
      `Hola! Te mando el comprobante de pago 🏋️\n\n` +
      `👤 Nombre: ${nombre || "—"}\n` +
      `💰 Monto: $${fmt(monto)}\n\n` +
      `¡Gracias!`
    );
    window.open(`https://wa.me/${TRANSFER.whatsapp}?text=${msg}`, "_blank");
    setTimeout(() => { setSending(false); setStep(3); }, 600);
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pt-page {
          min-height: 100vh;
          background: #080810;
          display: flex; align-items: center; justify-content: center;
          padding: 32px 20px;
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #e2e2ee;
        }

        .pt-card {
          width: 100%; max-width: 480px;
          background: #0c0c18;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 22px;
          overflow: hidden;
        }

        /* top banner */
        .pt-banner {
          background: linear-gradient(135deg, rgba(255,107,53,.15), rgba(255,107,53,.04));
          border-bottom: 1px solid rgba(255,107,53,.12);
          padding: 28px 28px 24px;
          display: flex; align-items: center; gap: 14px;
        }
        .pt-banner-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(255,107,53,.15); border: 1px solid rgba(255,107,53,.25);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 22px;
        }
        .pt-banner-title { font-size: 18px; font-weight: 800; color: #f0f0fa; }
        .pt-banner-sub   { font-size: 12px; color: #8888a0; margin-top: 2px; }

        /* body */
        .pt-body { padding: 28px; }

        /* step indicator */
        .pt-steps {
          display: flex; align-items: center;
          gap: 0; margin-bottom: 28px;
        }
        .pt-sc {
          width: 28px; height: 28px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #55556a;
          transition: all .25s; flex-shrink: 0;
        }
        .pt-sc.active { border-color: #FF6B35; background: #FF6B35; color: #fff; }
        .pt-sc.done   { border-color: #10B981; color: #10B981; background: rgba(16,185,129,.1); }
        .pt-sl { flex: 1; height: 2px; background: rgba(255,255,255,.06); transition: background .25s; }
        .pt-sl.done { background: rgba(16,185,129,.3); }
        .pt-slabel { font-size: 11px; color: #44445a; margin-left: 6px; white-space: nowrap; }
        .pt-slabel.active { color: #e2e2ee; }

        /* fields */
        .pt-label {
          display: block; font-size: 11px; font-weight: 700;
          color: #55556a; text-transform: uppercase; letter-spacing: .7px;
          margin-bottom: 6px;
        }
        .pt-input {
          width: 100%; padding: 12px 14px; border-radius: 11px;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
          color: #f0f0fa; font-size: 14px; outline: none;
          transition: border-color .18s; font-family: inherit;
          margin-bottom: 16px;
        }
        .pt-input:focus { border-color: rgba(255,107,53,.5); }
        .pt-input::placeholder { color: #33334a; }

        /* monto display */
        .pt-monto-box {
          background: linear-gradient(135deg, rgba(255,107,53,.1), rgba(255,107,53,.03));
          border: 1px solid rgba(255,107,53,.2); border-radius: 14px;
          padding: 20px; text-align: center; margin-bottom: 20px;
        }
        .pt-monto-label { font-size: 11px; font-weight: 700; color: #FF6B35; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 6px; }
        .pt-monto-value { font-size: 38px; font-weight: 900; color: #f0f0fa; line-height: 1; }
        .pt-monto-note  { font-size: 11px; color: #55556a; margin-top: 4px; }

        /* banco */
        .pt-banco-title {
          font-size: 11px; font-weight: 700; color: #55556a;
          text-transform: uppercase; letter-spacing: .7px;
          margin-bottom: 12px;
          display: flex; align-items: center; gap: 6px;
        }
        .pt-banco-rows { background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.05); border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
        .pt-banco-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 11px 14px; border-bottom: 1px solid rgba(255,255,255,.04);
        }
        .pt-banco-row:last-child { border-bottom: none; }
        .pt-banco-key { font-size: 11px; color: #55556a; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
        .pt-banco-val { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #f0f0fa; }
        .pt-banco-val.hi { color: #FF6B35; font-size: 15px; }

        .pt-copy {
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
          border-radius: 6px; width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #8888a0; transition: all .15s;
        }
        .pt-copy:hover { background: rgba(255,255,255,.1); color: #e2e2ee; }

        /* comprobante drop */
        .pt-drop {
          border: 2px dashed rgba(255,255,255,.09); border-radius: 12px;
          padding: 24px; text-align: center; cursor: pointer;
          transition: all .2s; background: rgba(255,255,255,.01);
          margin-bottom: 16px;
        }
        .pt-drop:hover { border-color: rgba(255,107,53,.35); background: rgba(255,107,53,.04); }
        .pt-drop img { max-height: 110px; border-radius: 8px; margin: 0 auto 10px; display: block; }
        .pt-drop-ico { font-size: 28px; margin-bottom: 6px; }
        .pt-drop-txt { font-size: 12px; color: #8888a0; }
        .pt-drop-txt span { color: #FF6B35; font-weight: 600; }

        /* buttons */
        .pt-btn {
          width: 100%; padding: 13px; border-radius: 12px;
          font-size: 14px; font-weight: 700; cursor: pointer; border: none;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all .18s; margin-bottom: 8px;
        }
        .pt-btn-orange { background: #FF6B35; color: #fff; }
        .pt-btn-orange:hover { background: #ff8050; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(255,107,53,.3); }
        .pt-btn-orange:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
        .pt-btn-wa { background: #25D366; color: #fff; }
        .pt-btn-wa:hover:not(:disabled) { background: #1fb958; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(37,211,102,.3); }
        .pt-btn-wa:disabled { opacity: .5; cursor: not-allowed; }
        .pt-btn-green { background: rgba(16,185,129,.1); color: #10B981; border: 1px solid rgba(16,185,129,.2); }
        .pt-btn-green:hover { background: rgba(16,185,129,.18); }

        .pt-wa-note { font-size: 11px; color: #44445a; text-align: center; margin-bottom: 12px; }

        /* success */
        .pt-success { text-align: center; padding: 12px 0 4px; }
        .pt-success-ico { font-size: 52px; margin-bottom: 14px; }
        .pt-success-title { font-size: 20px; font-weight: 800; color: #f0f0fa; margin-bottom: 8px; }
        .pt-success-sub { font-size: 13px; color: #8888a0; line-height: 1.6; margin-bottom: 22px; }
        .pt-success-box {
          background: rgba(16,185,129,.06); border: 1px solid rgba(16,185,129,.15);
          border-radius: 12px; padding: 16px; text-align: left;
          font-size: 12px; color: #8888a0; margin-bottom: 22px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .pt-success-row { display: flex; gap: 8px; }
        .pt-success-row span:first-child { color: #10B981; font-weight: 700; width: 72px; flex-shrink: 0; }

        /* back */
        .pt-back {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; color: #44445a;
          font-size: 12px; cursor: pointer; margin-bottom: 18px;
          padding: 0; transition: color .15s;
        }
        .pt-back:hover { color: #e2e2ee; }

        .pt-divider { height: 1px; background: rgba(255,255,255,.05); margin: 14px 0; }

        @media(max-width: 520px) {
          .pt-monto-value { font-size: 30px; }
          .pt-body { padding: 20px; }
        }
      `}</style>

      <div className="pt-page">
        <div className="pt-card">

          {/* Banner */}
          <div className="pt-banner">
            <div className="pt-banner-icon">🏋️</div>
            <div>
              <div className="pt-banner-title">AREOMIX · Pago</div>
              <div className="pt-banner-sub">Transferencia bancaria </div>
            </div>
          </div>

          <div className="pt-body">

            {/* Steps */}
            <div className="pt-steps">
              <div className={`pt-sc ${step >= 1 ? (step > 1 ? "done" : "active") : ""}`}>
                {step > 1
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  : "1"}
              </div>
              <span className={`pt-slabel ${step === 1 ? "active" : ""}`} style={{ marginRight: 6 }}>Monto</span>
              <div className={`pt-sl ${step > 1 ? "done" : ""}`} />
              <div className={`pt-sc ${step >= 2 ? (step > 2 ? "done" : "active") : ""}`} style={{ marginLeft: 6 }}>
                {step > 2
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  : "2"}
              </div>
              <span className={`pt-slabel ${step === 2 ? "active" : ""}`} style={{ marginRight: 6 }}>Transferir</span>
              <div className={`pt-sl ${step > 2 ? "done" : ""}`} />
              <div className={`pt-sc ${step === 3 ? "done" : ""}`} style={{ marginLeft: 6 }}>
                {step === 3
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  : "3"}
              </div>
              <span className={`pt-slabel ${step === 3 ? "active" : ""}`} style={{ marginLeft: 6 }}>Listo</span>
            </div>

            <AnimatePresence mode="wait">

              {/* ── STEP 1: INGRESAR MONTO ── */}
              {step === 1 && (
                <motion.div key="s1"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: .22 }}
                >
                  <label className="pt-label">Monto a pagar (ARS $)</label>
                  <input
                    className="pt-input"
                    type="number"
                    placeholder="Ej: 15000"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    min="1"
                  />

                  <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#55556a", marginBottom: 20 }}>
                    💡 Tu profe te informó el monto a pagar. Ingresalo arriba antes de continuar.
                  </div>

                  <button
                    className="pt-btn pt-btn-orange"
                    disabled={!monto || Number(monto) <= 0}
                    onClick={() => setStep(2)}
                  >
                    Ver datos para transferir
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2: DATOS + COMPROBANTE ── */}
              {step === 2 && (
                <motion.div key="s2"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: .22 }}
                >
                  <button className="pt-back" onClick={() => setStep(1)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    Volver
                  </button>

                  {/* Monto */}
                  <div className="pt-monto-box">
                    <div className="pt-monto-label">Total a transferir</div>
                    <div className="pt-monto-value">${fmt(monto)}</div>
                    <div className="pt-monto-note">Transferí exactamente este monto</div>
                  </div>

                  {/* Datos bancarios */}
                  <div className="pt-banco-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Datos de transferencia
                  </div>
                  <div className="pt-banco-rows">
                    <div className="pt-banco-row">
                      <span className="pt-banco-key">Titular</span>
                      <div className="pt-banco-val hi">
                        {TRANSFER.titular}
                        <CopyBtn text={TRANSFER.titular} />
                      </div>
                    </div>
                    <div className="pt-banco-row">
                      <span className="pt-banco-key">Alias</span>
                      <div className="pt-banco-val">
                        {TRANSFER.alias}
                        <CopyBtn text={TRANSFER.alias} />
                      </div>
                    </div>
                    <div className="pt-banco-row">
                      <span className="pt-banco-key">CBU</span>
                      <div className="pt-banco-val" style={{ fontSize: 11 }}>
                        {TRANSFER.cbu}
                        <CopyBtn text={TRANSFER.cbu} />
                      </div>
                    </div>
                    <div className="pt-banco-row">
                      <span className="pt-banco-key">Banco</span>
                      <div className="pt-banco-val" style={{ fontWeight: 500 }}>{TRANSFER.banco}</div>
                    </div>
                  </div>

                  <div className="pt-divider" />

                  {/* Tu nombre */}
                  <label className="pt-label">Tu nombre completo</label>
                  <input
                    className="pt-input"
                    placeholder="Ej: Juan García"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />

                  {/* Comprobante */}
                  <label className="pt-label">Foto del comprobante <span style={{ color: "#33334a", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span></label>
                  <div className="pt-drop" onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
                    {preview
                      ? <><img src={preview} alt="comprobante" /><div className="pt-drop-txt"><span>Cambiar imagen</span></div></>
                      : <><div className="pt-drop-ico">📎</div><div className="pt-drop-txt"><span>Subir comprobante</span> · JPG / PNG</div></>
                    }
                  </div>

                  {/* WhatsApp */}
                  <button className="pt-btn pt-btn-wa" onClick={handleWhatsApp} disabled={sending}>
                    {sending ? "Abriendo WhatsApp..." : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        Enviar comprobante por WhatsApp
                      </>
                    )}
                  </button>
                  <p className="pt-wa-note">Se abre WhatsApp listo para mandar al +54 {TRANSFER.whatsapp}</p>

                  <button className="pt-btn pt-btn-green" onClick={() => setStep(3)}>
                    Ya transferí, confirmar envío ✓
                  </button>
                </motion.div>
              )}

              {/* ── STEP 3: CONFIRMACIÓN ── */}
              {step === 3 && (
                <motion.div key="s3"
                  initial={{ opacity: 0, scale: .95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: .28 }}
                >
                  <div className="pt-success">
                    <div className="pt-success-ico">✅</div>
                    <h2 className="pt-success-title">¡Listo, gracias!</h2>
                    <p className="pt-success-sub">
                      Tu pago está en proceso de verificación.<br />
                      En menos de 24hs tu plan va a estar activo.
                    </p>

                    <div className="pt-success-box">
                      <div className="pt-success-row"><span>Nombre:</span><span>{nombre || "—"}</span></div>
                      <div className="pt-success-row"><span>Monto:</span><span>${fmt(monto)}</span></div>
                      <div className="pt-success-row"><span>Estado:</span><span style={{ color: "#10B981", fontWeight: 700 }}>⏳ En verificación</span></div>
                    </div>

                    <a href="/dashboard"
                      style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 12, background: "#FF6B35", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}
                    >
                      Ir al dashboard
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </a>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}