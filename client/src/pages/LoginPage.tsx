import { useEffect, useRef, useState } from "react";
import { getLoginUrl, getSignUpUrl, getGoogleLoginUrl, getGoogleSignUpUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddymarket-logo-color_856f2d67.jpg";

// Google SVG icon
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function GoogleButton({ onClick, label }: { onClick: () => void; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", padding: "14px 0",
        background: hovered ? "#f8f9fa" : "white",
        color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 16,
        fontWeight: 700, fontSize: 15, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        transition: "all 0.2s ease",
        boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
        letterSpacing: "-0.01em",
      }}
    >
      <GoogleIcon />
      {label}
    </button>
  );
}

function Divider({ label = "o" }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
      <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
      <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
    </div>
  );
}

// ── OTP step 1: email input ───────────────────────────────────────────────────
function OTPEmailStep({
  email,
  setEmail,
  onSend,
  loading,
  onBack,
}: {
  email: string;
  setEmail: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  onBack: () => void;
}) {
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
          Introduce tu email y te enviaremos un código de 6 dígitos para acceder sin contraseña.
        </p>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="tu@email.com"
          autoFocus
          style={{
            width: "100%", padding: "13px 16px", borderRadius: 14,
            border: "1.5px solid #E5E7EB", fontSize: 15, outline: "none",
            boxSizing: "border-box", transition: "border-color 0.2s",
            fontFamily: "inherit",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
        />
      </div>
      <button
        onClick={onSend}
        disabled={loading || !email.trim()}
        style={{
          width: "100%", padding: "15px 0",
          background: loading || !email.trim() ? "#FED7AA" : "linear-gradient(135deg, #F97316, #ea580c)",
          color: "white", border: "none", borderRadius: 16,
          fontWeight: 800, fontSize: 15, cursor: loading || !email.trim() ? "not-allowed" : "pointer",
          boxShadow: loading || !email.trim() ? "none" : "0 6px 24px rgba(249,115,22,0.40)",
          letterSpacing: "-0.01em", transition: "all 0.2s ease",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {loading ? (
          <>
            <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Enviando...
          </>
        ) : (
          <><span>📧</span> Enviar código</>
        )}
      </button>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 13, cursor: "pointer", padding: 0 }}>
          ← Volver a las opciones de acceso
        </button>
      </div>
    </>
  );
}

// ── OTP step 2: code input ────────────────────────────────────────────────────
function OTPCodeStep({
  email,
  onVerify,
  onResend,
  loading,
  resending,
  onBack,
}: {
  email: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  loading: boolean;
  resending: boolean;
  onBack: () => void;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleChange = (idx: number, val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = cleaned;
    setDigits(next);
    if (cleaned && idx < 5) refs[idx + 1].current?.focus();
    if (next.every((d) => d !== "")) {
      onVerify(next.join(""));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setDigits(next);
      refs[5].current?.focus();
      onVerify(pasted);
    }
  };

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", border: "2px solid #FED7AA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>
          📬
        </div>
        <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#111827" }}>
          Revisa tu email
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
          Hemos enviado un código de 6 dígitos a<br />
          <strong style={{ color: "#374151" }}>{email}</strong>
        </p>
      </div>

      {/* 6-digit input */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }} onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={i === 0}
            style={{
              width: 46, height: 56, textAlign: "center",
              fontSize: 24, fontWeight: 800, fontFamily: "'Courier New', monospace",
              border: `2px solid ${d ? "#F97316" : "#E5E7EB"}`,
              borderRadius: 14, outline: "none",
              background: d ? "#FFF7ED" : "white",
              color: "#111827",
              transition: "all 0.15s ease",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = d ? "#F97316" : "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
          />
        ))}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, color: "#F97316", fontSize: 14 }}>
          <div style={{ width: 16, height: 16, border: "2px solid rgba(249,115,22,0.3)", borderTopColor: "#F97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Verificando...
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 8 }}>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#9ca3af" }}>
          ¿No has recibido el código?{" "}
          <button
            onClick={onResend}
            disabled={resending}
            style={{ background: "none", border: "none", color: "#F97316", fontWeight: 700, fontSize: 13, cursor: resending ? "not-allowed" : "pointer", padding: 0 }}
          >
            {resending ? "Enviando..." : "Reenviar"}
          </button>
        </p>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 13, cursor: "pointer", padding: 0 }}>
          ← Cambiar email
        </button>
      </div>
    </>
  );
}

// ── Main LoginPage ────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [animating, setAnimating] = useState(false);
  // OTP flow
  const [otpStep, setOtpStep] = useState<"idle" | "email" | "code">("idle");
  const [otpEmail, setOtpEmail] = useState("");

  const sendOTP = trpc.auth.sendOTP.useMutation();
  const verifyOTP = trpc.auth.verifyOTP.useMutation();

  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/app/dashboard";
    }
  }, [user, loading]);

  const switchMode = (newMode: "login" | "signup") => {
    if (newMode === mode) return;
    setAnimating(true);
    setOtpStep("idle");
    setTimeout(() => {
      setMode(newMode);
      setAnimating(false);
    }, 200);
  };

  const handleSendOTP = async () => {
    if (!otpEmail.trim()) return;
    try {
      await sendOTP.mutateAsync({ email: otpEmail.trim() });
      setOtpStep("code");
      toast.success("Código enviado. Revisa tu bandeja de entrada.");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Error al enviar el código.";
      toast.error(msg);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    try {
      await verifyOTP.mutateAsync({ email: otpEmail.trim(), code });
      toast.success("¡Acceso correcto! Redirigiendo...");
      setTimeout(() => { window.location.href = "/app/dashboard"; }, 800);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Código incorrecto.";
      toast.error(msg);
    }
  };

  const handleResendOTP = async () => {
    try {
      await sendOTP.mutateAsync({ email: otpEmail.trim() });
      toast.success("Nuevo código enviado.");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Error al reenviar el código.";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF8F0" }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={LOGO_COLOR} alt="BuddyMarket" style={{ width: 32, height: 32, borderRadius: 10, objectFit: "cover" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #FFF8F0 0%, #FFF3E8 50%, #FFF8F0 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px 20px", position: "relative", overflow: "hidden",
    }}>
      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 420,
        background: "white", borderRadius: 32, padding: "40px 32px 36px",
        boxShadow: "0 20px 60px rgba(249,115,22,0.12), 0 4px 20px rgba(0,0,0,0.06)",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ width: 90, height: 90, borderRadius: 28, overflow: "hidden", boxShadow: "0 8px 32px rgba(249,115,22,0.25)", border: "3px solid rgba(249,115,22,0.15)" }}>
            <img src={LOGO_COLOR} alt="BuddyMarket" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            {otpStep !== "idle" ? "Acceso con código" : mode === "login" ? "Bienvenid@ a" : "Únete a"}<br />
            {otpStep === "idle" && <span style={{ color: "#F97316" }}>BuddyMarket</span>}
          </h1>
          {otpStep === "idle" && (
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.6, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
              {mode === "login"
                ? "Tu nutrición inteligente y personalizada en un solo lugar."
                : "Empieza gratis y transforma tu nutrición con inteligencia artificial."}
            </p>
          )}
        </div>

        {/* OTP flow */}
        {otpStep !== "idle" ? (
          <div style={{ opacity: animating ? 0 : 1, transition: "opacity 0.2s ease" }}>
            {otpStep === "email" ? (
              <OTPEmailStep
                email={otpEmail}
                setEmail={setOtpEmail}
                onSend={handleSendOTP}
                loading={sendOTP.isPending}
                onBack={() => setOtpStep("idle")}
              />
            ) : (
              <OTPCodeStep
                email={otpEmail}
                onVerify={handleVerifyOTP}
                onResend={handleResendOTP}
                loading={verifyOTP.isPending}
                resending={sendOTP.isPending}
                onBack={() => setOtpStep("email")}
              />
            )}
          </div>
        ) : (
          <>
            {/* Mode tabs */}
            <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 16, padding: 4, marginBottom: 24, gap: 4 }}>
              <button onClick={() => switchMode("login")} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: mode === "login" ? "white" : "transparent", color: mode === "login" ? "#F97316" : "#6b7280", fontWeight: mode === "login" ? 800 : 600, fontSize: 14, cursor: "pointer", boxShadow: mode === "login" ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s ease" }}>
                Iniciar sesión
              </button>
              <button onClick={() => switchMode("signup")} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: mode === "signup" ? "white" : "transparent", color: mode === "signup" ? "#F97316" : "#6b7280", fontWeight: mode === "signup" ? 800 : 600, fontSize: 14, cursor: "pointer", boxShadow: mode === "signup" ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s ease" }}>
                Crear cuenta
              </button>
            </div>

            {/* Content */}
            <div style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(8px)" : "translateY(0)", transition: "all 0.2s ease" }}>
              {mode === "login" ? (
                <>
                  <GoogleButton onClick={() => { window.location.href = getGoogleLoginUrl(); }} label="Continuar con Google" />
                  <Divider />
                  {/* OTP login button */}
                  <button
                    onClick={() => { setOtpStep("email"); }}
                    style={{ width: "100%", padding: "14px 0", background: "white", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 16, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s ease", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", letterSpacing: "-0.01em", marginBottom: 12 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f8f9fa"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
                  >
                    <span style={{ fontSize: 18 }}>📧</span>
                    Acceder con código por email
                  </button>
                  {/* Manus login */}
                  <button
                    onClick={() => { window.location.href = getLoginUrl(); }}
                    style={{ width: "100%", padding: "15px 0", background: "linear-gradient(135deg, #F97316, #ea580c)", color: "white", border: "none", borderRadius: 16, fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 24px rgba(249,115,22,0.40)", letterSpacing: "-0.01em", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(249,115,22,0.50)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(249,115,22,0.40)"; }}
                  >
                    <span>🚀</span>
                    Iniciar sesión con Manus
                  </button>
                  <div style={{ textAlign: "center", marginTop: 20 }}>
                    <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>
                      ¿No tienes cuenta?{" "}
                      <button onClick={() => switchMode("signup")} style={{ background: "none", border: "none", color: "#F97316", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0 }}>
                        Crear una cuenta
                      </button>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <GoogleButton onClick={() => { window.location.href = getGoogleSignUpUrl(); }} label="Registrarse con Google" />
                  <Divider />
                  {/* OTP signup button */}
                  <button
                    onClick={() => { setOtpStep("email"); }}
                    style={{ width: "100%", padding: "14px 0", background: "white", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 16, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s ease", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", letterSpacing: "-0.01em", marginBottom: 12 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f8f9fa"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
                  >
                    <span style={{ fontSize: 18 }}>📧</span>
                    Registrarse con código por email
                  </button>
                  {/* Benefits */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                    {[
                      { emoji: "🤖", title: "Menús con IA", desc: "Genera menús semanales personalizados en segundos" },
                      { emoji: "🛒", title: "Lista inteligente", desc: "Compra solo lo que necesitas, sin desperdicio" },
                      { emoji: "📊", title: "Seguimiento nutricional", desc: "Controla tus macros y calorías fácilmente" },
                    ].map((b) => (
                      <div key={b.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#FAFAFA", borderRadius: 12, border: "1px solid #F3F4F6" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #FFF8F0, #FFF3E8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{b.emoji}</div>
                        <div>
                          <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{b.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Sign up with Manus */}
                  <button
                    onClick={() => { window.location.href = getSignUpUrl(); }}
                    style={{ width: "100%", padding: "15px 0", background: "linear-gradient(135deg, #F97316, #ea580c)", color: "white", border: "none", borderRadius: 16, fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 24px rgba(249,115,22,0.40)", letterSpacing: "-0.01em", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(249,115,22,0.50)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(249,115,22,0.40)"; }}
                  >
                    <span>✨</span>
                    Empezar gratis con Manus
                  </button>
                  <p style={{ textAlign: "center", margin: "10px 0 0", fontSize: 12, color: "#9ca3af" }}>
                    Sin tarjeta de crédito · Cancela cuando quieras
                  </p>
                  <div style={{ textAlign: "center", marginTop: 14 }}>
                    <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>
                      ¿Ya tienes cuenta?{" "}
                      <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "#F97316", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0 }}>
                        Iniciar sesión
                      </button>
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, fontSize: 12, color: "#9ca3af", textAlign: "center", zIndex: 1 }}>
        Al continuar aceptas nuestros{" "}
        <a href="/terms" style={{ color: "#F97316", textDecoration: "none" }}>Términos</a>
        {" "}y{" "}
        <a href="/privacy" style={{ color: "#F97316", textDecoration: "none" }}>Privacidad</a>
      </p>
    </div>
  );
}
