import { useEffect, useState } from "react";
import { getLoginUrl, getSignUpUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddymarket-logo-color_856f2d67.jpg";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [animating, setAnimating] = useState(false);

  // If already authenticated, redirect to app
  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/app/dashboard";
    }
  }, [user, loading]);

  const switchMode = (newMode: "login" | "signup") => {
    if (newMode === mode) return;
    setAnimating(true);
    setTimeout(() => {
      setMode(newMode);
      setAnimating(false);
    }, 200);
  };

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  const handleSignUp = () => {
    window.location.href = getSignUpUrl();
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF8F0" }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 1.5s ease-in-out infinite" }}>
          <img src={LOGO_COLOR} alt="BuddyMarket" style={{ width: 32, height: 32, borderRadius: 10, objectFit: "cover" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #FFF8F0 0%, #FFF3E8 50%, #FFF8F0 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative background blobs */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "white",
        borderRadius: 32,
        padding: "40px 32px 36px",
        boxShadow: "0 20px 60px rgba(249,115,22,0.12), 0 4px 20px rgba(0,0,0,0.06)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{
            width: 90,
            height: 90,
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(249,115,22,0.25)",
            border: "3px solid rgba(249,115,22,0.15)",
          }}>
            <img src={LOGO_COLOR} alt="BuddyMarket" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ margin: "0 0 10px", fontSize: 26, fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            {mode === "login" ? "Bienvenid@ a" : "Únete a"}<br />
            <span style={{ color: "#F97316" }}>BuddyMarket</span>
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.6, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
            {mode === "login"
              ? "Donde tus gustos y nuestra inteligencia artificial cocinan juntos la lista de compras perfecta."
              : "Empieza gratis y transforma tu nutrición con inteligencia artificial."}
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{
          display: "flex",
          background: "#F3F4F6",
          borderRadius: 16,
          padding: 4,
          marginBottom: 28,
          gap: 4,
        }}>
          <button
            onClick={() => switchMode("login")}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 12,
              border: "none",
              background: mode === "login" ? "white" : "transparent",
              color: mode === "login" ? "#F97316" : "#6b7280",
              fontWeight: mode === "login" ? 800 : 600,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: mode === "login" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => switchMode("signup")}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 12,
              border: "none",
              background: mode === "signup" ? "white" : "transparent",
              color: mode === "signup" ? "#F97316" : "#6b7280",
              fontWeight: mode === "signup" ? 800 : 600,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: mode === "signup" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            Crear cuenta
          </button>
        </div>

        {/* Content */}
        <div style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(8px)" : "translateY(0)", transition: "all 0.2s ease" }}>
          {mode === "login" ? (
            <>
              {/* Login info */}
              <div style={{
                background: "linear-gradient(135deg, #FFF8F0, #FFF3E8)",
                border: "1.5px solid rgba(249,115,22,0.15)",
                borderRadius: 16,
                padding: "16px 18px",
                marginBottom: 24,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}>
                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>🔐</div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#111827" }}>Acceso seguro con Manus</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                    Usamos autenticación segura. Serás redirigido al portal de acceso y volverás automáticamente.
                  </p>
                </div>
              </div>

              {/* Login button */}
              <button
                onClick={handleLogin}
                style={{
                  width: "100%",
                  padding: "16px 0",
                  background: "linear-gradient(135deg, #F97316, #ea580c)",
                  color: "white",
                  border: "none",
                  borderRadius: 16,
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: "pointer",
                  boxShadow: "0 6px 24px rgba(249,115,22,0.40)",
                  letterSpacing: "-0.01em",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(249,115,22,0.50)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(249,115,22,0.40)"; }}
              >
                <span>🚀</span>
                Iniciar sesión
              </button>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>
                  ¿No tienes cuenta?{" "}
                  <button
                    onClick={() => switchMode("signup")}
                    style={{ background: "none", border: "none", color: "#F97316", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0 }}
                  >
                    Crear una cuenta
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Benefits */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {[
                  { emoji: "🤖", title: "Menús con IA", desc: "Genera menús semanales personalizados en segundos" },
                  { emoji: "🛒", title: "Lista inteligente", desc: "Compra solo lo que necesitas, sin desperdicio" },
                  { emoji: "📊", title: "Seguimiento nutricional", desc: "Controla tus macros y calorías fácilmente" },
                ].map((b) => (
                  <div key={b.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#FAFAFA", borderRadius: 14, border: "1px solid #F3F4F6" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #FFF8F0, #FFF3E8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{b.emoji}</div>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{b.title}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sign up button */}
              <button
                onClick={handleSignUp}
                style={{
                  width: "100%",
                  padding: "16px 0",
                  background: "linear-gradient(135deg, #F97316, #ea580c)",
                  color: "white",
                  border: "none",
                  borderRadius: 16,
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: "pointer",
                  boxShadow: "0 6px 24px rgba(249,115,22,0.40)",
                  letterSpacing: "-0.01em",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(249,115,22,0.50)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(249,115,22,0.40)"; }}
              >
                <span>✨</span>
                Empezar gratis
              </button>

              <p style={{ textAlign: "center", margin: "12px 0 0", fontSize: 12, color: "#9ca3af" }}>
                Sin tarjeta de crédito · Cancela cuando quieras
              </p>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>
                  ¿Ya tienes cuenta?{" "}
                  <button
                    onClick={() => switchMode("login")}
                    style={{ background: "none", border: "none", color: "#F97316", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0 }}
                  >
                    Iniciar sesión
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
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
