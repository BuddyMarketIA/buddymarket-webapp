import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, ChevronLeft, User, Phone, Shield, CheckCircle2, X, WifiOff, AlertTriangle, RefreshCw } from "lucide-react";
import WebSSOButtons from "@/components/WebSSOButtons";

// ─── Hook: detección de estado del servidor ───────────────────────────────────
type ServerStatus = "checking" | "ok" | "slow" | "down";

function useServerStatus(): { status: ServerStatus; latency: number | null; retry: () => void } {
  const [status, setStatus] = useState<ServerStatus>("checking");
  const [latency, setLatency] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Limpiar timer de reintento automático previo
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const check = async () => {
      setStatus("checking");
      const start = Date.now();
      try {
        const res = await fetch("/api/health", {
          method: "GET",
          cache: "no-store",
          signal: AbortSignal.timeout(12000),
        });
        if (cancelled) return;
        const ms = Date.now() - start;
        setLatency(ms);
        if (!res.ok) {
          setStatus("down");
          // Reintento automático en 30 segundos
          retryTimerRef.current = setTimeout(() => {
            if (!cancelled) setTick(t => t + 1);
          }, 30000);
        } else if (ms > 4000) {
          setStatus("slow");
        } else {
          setStatus("ok");
        }
      } catch {
        if (cancelled) return;
        setLatency(null);
        setStatus("down");
        // Reintento automático en 30 segundos
        retryTimerRef.current = setTimeout(() => {
          if (!cancelled) setTick(t => t + 1);
        }, 30000);
      }
    };
    check();
    return () => {
      cancelled = true;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [tick]);

  return { status, latency, retry: () => setTick(t => t + 1) };
}

// ─── Componente: Banner de estado del servidor ────────────────────────────────
function ServerStatusBanner({ status, latency, retry }: { status: ServerStatus; latency: number | null; retry: () => void }) {
  if (status === "ok") return null;

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-400 text-xs mb-3">
        <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
        <span>Verificando conexión...</span>
      </div>
    );
  }

  if (status === "slow") {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-3 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 font-medium">Servidor lento ({latency ? `${latency}ms` : "…"}). Puede tardar un poco más.</span>
        </div>
        <button
          onClick={retry}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 font-semibold transition-colors border-t border-amber-200 text-xs"
        >
          <RefreshCw className="w-3 h-3" /> Reintentar
        </button>
      </div>
    );
  }

  // status === "down"
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-3 overflow-hidden">
      <div className="flex items-start gap-2.5 px-4 py-3">
        <WifiOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-sm">No se puede conectar con el servidor</p>
          <p className="text-red-500 mt-0.5 font-normal leading-relaxed">
            Comprueba tu conexión a internet o inténtalo de nuevo en unos minutos.
          </p>
        </div>
      </div>
      <button
        onClick={retry}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold transition-colors border-t border-red-200"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Reintentar ahora
      </button>
    </div>
  );
}

// ─── TyC Modal para SSO ───────────────────────────────────────────────────────
const SSO_TYC_ACCEPTED_KEY = "buddymarket_sso_tyc_v2";

function hasSSOTyCAccepted(): boolean {
  try {
    const stored = localStorage.getItem(SSO_TYC_ACCEPTED_KEY);
    if (!stored) return false;
    const data = JSON.parse(stored) as { at: number; v: string };
    return data.v === "2.0";
  } catch { return false; }
}

function SSOTermsModal({ provider, onAccept, onClose }: {
  provider: "google" | "apple";
  onAccept: () => void;
  onClose: () => void;
}) {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const providerName = provider === "google" ? "Google" : "Apple";
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-[#F97316]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Antes de continuar con {providerName}</h3>
              <p className="text-gray-400 text-xs mt-0.5">Acepta los términos para crear tu cuenta</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 ml-2 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Checkboxes */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setAcceptTerms(v => !v)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                acceptTerms ? "bg-[#F97316] border-[#F97316]" : "border-gray-300 hover:border-[#F97316]"
              }`}
            >
              {acceptTerms && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </button>
            <span className="text-sm text-gray-600 leading-relaxed">
              He leído y acepto los{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F97316] underline font-medium"
                onClick={e => e.stopPropagation()}
              >
                Términos y Condiciones
              </a>
            </span>
          </div>
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setAcceptPrivacy(v => !v)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                acceptPrivacy ? "bg-[#F97316] border-[#F97316]" : "border-gray-300 hover:border-[#F97316]"
              }`}
            >
              {acceptPrivacy && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </button>
            <span className="text-sm text-gray-600 leading-relaxed">
              He leído y acepto la{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F97316] underline font-medium"
                onClick={e => e.stopPropagation()}
              >
                Política de Privacidad
              </a>
            </span>
          </div>
        </div>
        {/* Actions */}
        <div className="space-y-2 pt-1">
          <Button
            onClick={() => {
              if (!acceptTerms || !acceptPrivacy) {
                toast.error("Debes aceptar ambos documentos para continuar");
                return;
              }
              localStorage.setItem(SSO_TYC_ACCEPTED_KEY, JSON.stringify({ at: Date.now(), v: "2.0" }));
              onAccept();
            }}
            disabled={!acceptTerms || !acceptPrivacy}
            className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] disabled:opacity-50 text-white font-semibold rounded-2xl text-sm shadow-[0_4px_20px_rgba(249,115,22,0.3)] transition-all"
          >
            Continuar con {providerName}
          </Button>
          <button onClick={onClose} className="w-full text-center text-gray-400 text-xs py-2 hover:text-gray-600 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carousel images ──────────────────────────────────────────────────────────
const SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&q=80&auto=format&fit=crop",
    title: "Tu nutrición,\ninteligente",
    sub: "Planificación personalizada con IA",
  },
  {
    img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=80&auto=format&fit=crop",
    title: "Recetas que\nte inspiran",
    sub: "Miles de recetas adaptadas a tus objetivos",
  },
  {
    img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=80&auto=format&fit=crop",
    title: "Alcanza tus\nmetas",
    sub: "Seguimiento de progreso en tiempo real",
  },
  {
    img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=900&q=80&auto=format&fit=crop",
    title: "Come bien,\nvive mejor",
    sub: "Menús semanales listos en segundos",
  },
];

const LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-icon-orange_2cf889cb.png";

type AuthMode = "login" | "register" | "otp-email" | "otp-code" | "phone" | "phone-code" | "forgot" | "forgot-sent";

// ─── Password strength indicator ─────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400"];
  const labels = ["Muy débil", "Débil", "Buena", "Fuerte"];
  return (
    <div className="space-y-1 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : "bg-gray-200"}`} />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-[10px] font-medium ${score <= 1 ? "text-red-400" : score === 2 ? "text-orange-400" : score === 3 ? "text-yellow-500" : "text-green-500"}`}>
          {labels[score - 1]}
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [slide, setSlide] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // Estado del servidor
  const { status: serverStatus, latency: serverLatency, retry: retryServer } = useServerStatus();

  // Auto-redirect if user is already authenticated
  // BUT: if ?logout=1 is present, skip auto-redirect to avoid race condition
  // where the browser sends the old cookie before Set-Cookie maxAge=0 is processed.
  const isJustLoggedOut = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("logout") === "1";
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  useEffect(() => {
    if (meQuery.isLoading) return;
    if (isJustLoggedOut) return; // Don't auto-redirect after logout — user explicitly signed out
    if (meQuery.data) {
      // User is already logged in — always send to dashboard
      setLocation("/app/dashboard");
    }
  }, [meQuery.data, meQuery.isLoading, setLocation, isJustLoggedOut]);

  // Form fields — ALL hooks must be declared before any conditional returns
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [phone, setPhone] = useState("");
  const [phoneOtpCode, setPhoneOtpCode] = useState(["", "", "", "", "", ""]);
  const phoneOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Terms acceptance (registro por email)
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  // TyC modal para SSO (Google/Apple)
  const [ssoTyCModal, setSsoTyCModal] = useState<{ provider: "google" | "apple"; pendingAction: () => void } | null>(null);

  // tRPC mutations — MUST be declared before any conditional return (React rules of hooks)
  const loginMut = trpc.auth.login.useMutation();
  const registerMut = trpc.auth.register.useMutation();
  const acceptTermsMut = trpc.auth.acceptTerms.useMutation();
  const sendOTPMut = trpc.auth.sendOTP.useMutation();
  const verifyOTPMut = trpc.auth.verifyOTP.useMutation();
  const sendPhoneOTPMut = trpc.auth.sendPhoneOTP.useMutation();
  const verifyPhoneOTPMut = trpc.auth.verifyPhoneOTP.useMutation();
  const forgotMut = trpc.auth.forgotPassword.useMutation();
  const utils = trpc.useUtils();

  // Auto-advance carousel — also before conditional return
  useEffect(() => {
    const id = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setSlide(s => (s + 1) % SLIDES.length);
        setTransitioning(false);
      }, 400);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Show loading while checking auth
  if (meQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm text-gray-500">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Wrapper para SSO: muestra TyC si no han sido aceptados aún
  const handleSSOWithTyC = (provider: "google" | "apple", action: () => void) => {
    if (hasSSOTyCAccepted()) {
      action();
    } else {
      setSsoTyCModal({ provider, pendingAction: action });
    }
  };

  const afterAuth = async () => {
    await utils.auth.me.invalidate();
    setLocation("/app/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMut.mutateAsync({ email, password });
      await afterAuth();
    } catch (err: any) {
      toast.error("Error al iniciar sesión", { description: err.message });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return; }
    if (password.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return; }
    if (!acceptTerms) { toast.error("Debes aceptar los Términos y Condiciones para continuar"); return; }
    if (!acceptPrivacy) { toast.error("Debes aceptar la Política de Privacidad para continuar"); return; }
    try {
      await registerMut.mutateAsync({ name, email, password });
      // Save terms acceptance with timestamp
      try {
        await acceptTermsMut.mutateAsync({
          termsVersion: "2.0",
          acceptPrivacy,
          marketingConsent,
        });
      } catch (_) { /* non-critical */ }
      toast.success("¡Cuenta creada!", { description: `Bienvenido a BuddyMarket, ${name.split(" ")[0]}` });
      await afterAuth();
    } catch (err: any) {
      toast.error("Error al registrarse", { description: err.message });
    }
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await sendOTPMut.mutateAsync({ email });
      setMode("otp-code");
      toast.success("Código enviado", { description: "Revisa tu bandeja de entrada." });
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.join("");
    if (code.length < 6) return;
    try {
      await verifyOTPMut.mutateAsync({ email, code });
      await afterAuth();
    } catch (err: any) {
      toast.error("Código incorrecto", { description: err.message });
    }
  };

  const handleOtpInput = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    if (val.length > 1) {
      // Handle paste
      const digits = val.replace(/\D/g, "").slice(0, 6).split("");
      const next = [...otpCode];
      digits.forEach((d, i) => { if (idx + i < 6) next[idx + i] = d; });
      setOtpCode(next);
      const focusIdx = Math.min(idx + digits.length, 5);
      otpRefs.current[focusIdx]?.focus();
      return;
    }
    const next = [...otpCode];
    next[idx] = val;
    setOtpCode(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotMut.mutateAsync({ email: forgotEmail, origin: window.location.origin });
      setMode("forgot-sent");
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    }
  };

  const handleSendPhoneOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await sendPhoneOTPMut.mutateAsync({ phone });
      setMode("phone-code");
      setPhoneOtpCode(["", "", "", "", "", ""]);
      toast.success("Código enviado", { description: "Revisa tus mensajes SMS." });
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    }
  };

  const handleVerifyPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = phoneOtpCode.join("");
    if (code.length < 6) return;
    try {
      await verifyPhoneOTPMut.mutateAsync({ phone, code });
      await afterAuth();
    } catch (err: any) {
      toast.error("Código incorrecto", { description: err.message });
    }
  };

  const handlePhoneOtpInput = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    if (val.length > 1) {
      const digits = val.replace(/\D/g, "").slice(0, 6).split("");
      const next = [...phoneOtpCode];
      digits.forEach((d, i) => { if (idx + i < 6) next[idx + i] = d; });
      setPhoneOtpCode(next);
      const focusIdx = Math.min(idx + digits.length, 5);
      phoneOtpRefs.current[focusIdx]?.focus();
      return;
    }
    const next = [...phoneOtpCode];
    next[idx] = val;
    setPhoneOtpCode(next);
    if (val && idx < 5) phoneOtpRefs.current[idx + 1]?.focus();
  };

  const handlePhoneOtpKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !phoneOtpCode[idx] && idx > 0) phoneOtpRefs.current[idx - 1]?.focus();
  };

  const isLoading = loginMut.isPending || registerMut.isPending || sendOTPMut.isPending || verifyOTPMut.isPending || sendPhoneOTPMut.isPending || verifyPhoneOTPMut.isPending || forgotMut.isPending;

  const inp = "bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:border-[#F97316] focus-visible:ring-0 focus-visible:ring-offset-0 rounded-2xl h-13 text-sm transition-colors";
  const ssoWrapper = "[&_button]:rounded-2xl [&_button]:h-12 [&_button]:text-sm [&_button]:font-semibold [&_button]:border-gray-200 [&_button]:bg-gray-50 [&_button]:text-gray-700 [&_button:hover]:bg-gray-100";

  const currentSlide = SLIDES[slide];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0a] flex flex-col">

      {/* ── Background carousel ── */}
      <div className="absolute inset-0 z-0">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === slide ? 1 : 0 }}
          >
            <img src={s.img} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" style={{ top: "45%" }} />
      </div>

      {/* ── Top: Logo + slide text ── */}
      <div className="relative z-10 flex flex-col items-center pt-14 pb-6 px-6 text-center">
        {/* Logo + Brand name */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src={LOGO} alt="BuddyMarket" className="h-36 w-36 object-contain drop-shadow-2xl" />
          <span className="text-white text-3xl font-extrabold tracking-tight drop-shadow-lg">
            Buddy<span className="text-[#F97316]">Market</span>
          </span>
        </div>

        <div className={`transition-all duration-400 ${transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
          <h1 className="text-[2.1rem] font-extrabold text-white leading-tight tracking-tight whitespace-pre-line drop-shadow-md">
            {currentSlide.title}
          </h1>
          <p className="mt-2 text-white/70 text-sm font-medium drop-shadow">
            {currentSlide.sub}
          </p>
        </div>

        {/* Dots */}
        <div className="flex gap-1.5 mt-5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`rounded-full transition-all duration-300 ${i === slide ? "w-5 h-1.5 bg-[#F97316]" : "w-1.5 h-1.5 bg-white/30"}`}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom: Form card ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-end">
        <div className="bg-white rounded-t-[2rem] px-6 pt-7 pb-10 shadow-2xl min-h-[420px]">

          {/* ── Banner de estado del servidor ── */}
          <ServerStatusBanner status={serverStatus} latency={serverLatency} retry={retryServer} />

          {/* Back button for sub-modes */}
          {(mode !== "login") && (
            <button
              onClick={() => setMode(mode === "otp-code" ? "otp-email" : mode === "phone-code" ? "phone" : "login")}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-700 text-sm mb-5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
          )}

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Bienvenido de nuevo</h2>
                <p className="text-gray-400 text-xs mt-0.5">Accede a tu cuenta BuddyMarket</p>
              </div>
              {/* SSO buttons — Google + Apple */}
              {/* No TyC modal for login mode: existing users should not be asked to accept terms again */}
              <div className={ssoWrapper}>
                <WebSSOButtons onSuccess={() => { window.location.href = "/app/dashboard"; }} />
              </div>
              <div className="relative flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">o con email y contraseña</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" className={`${inp} pl-10`} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Contraseña" className={`${inp} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setMode("forgot")}
                    className="text-[#F97316] text-xs hover:text-[#fb923c] transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <Button type="submit" disabled={isLoading}
                  className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl text-sm shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98]">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Iniciar sesión <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>

              <Button type="button" onClick={() => setMode("otp-email")} variant="outline"
                className="w-full h-12 bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 rounded-2xl text-sm transition-all active:scale-[0.98]">
                <Mail className="w-4 h-4 mr-2 text-[#F97316]" /> Acceder con código por email
              </Button>

              <Button type="button" onClick={() => setMode("phone")} variant="outline"
                className="w-full h-12 bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 rounded-2xl text-sm transition-all active:scale-[0.98]">
                <Phone className="w-4 h-4 mr-2 text-[#F97316]" /> Acceder con número de teléfono
              </Button>

              <p className="text-center text-gray-400 text-xs">
                ¿No tienes cuenta?{" "}
                <button onClick={() => setMode("register")} className="text-[#F97316] font-semibold hover:text-[#fb923c] transition-colors">
                  Regístrate gratis
                </button>
              </p>
            </div>
          )}

          {/* ── REGISTER ── */}
          {mode === "register" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Crea tu cuenta</h2>
                <p className="text-gray-400 text-xs mt-0.5">Únete a la comunidad BuddyMarket — es gratis</p>
              </div>
              {/* SSO buttons — Google + Apple */}
              {/* TyC modal for register mode: new users must accept terms before signing up via SSO */}
              <div className={ssoWrapper}>
                <WebSSOButtons onSuccess={() => { window.location.href = "/app/dashboard"; }} onBeforeSSO={handleSSOWithTyC} />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-xs">o regístrate con email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input type="text" required autoComplete="name" minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre completo" className={`${inp} pl-10`} />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" className={`${inp} pl-10`} />
                </div>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input type={showPassword ? "text" : "password"} required autoComplete="new-password" minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Contraseña (mín. 8 caracteres)" className={`${inp} pl-10 pr-10`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input type={showConfirm ? "text" : "password"} required autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar contraseña"
                    className={`${inp} pl-10 pr-10 ${confirmPassword && confirmPassword !== password ? "border-red-400" : confirmPassword && confirmPassword === password ? "border-green-400" : ""}`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[10px] text-red-400 -mt-1">Las contraseñas no coinciden</p>
                )}
                {/* ── Terms & Privacy checkboxes ── */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={e => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#F97316] cursor-pointer flex-shrink-0"
                    />
                    <span className="text-[11px] text-gray-500 leading-relaxed">
                      He leído y acepto los{" "}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#F97316] underline font-medium hover:text-[#ea6c0f]">
                        Términos y Condiciones
                      </a>
                      {" "}de BuddyMarket{" "}
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptPrivacy}
                      onChange={e => setAcceptPrivacy(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#F97316] cursor-pointer flex-shrink-0"
                    />
                    <span className="text-[11px] text-gray-500 leading-relaxed">
                      He leído y acepto la{" "}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#F97316] underline font-medium hover:text-[#ea6c0f]">
                        Política de Privacidad
                      </a>
                      {" "}y el tratamiento de mis datos{" "}
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={e => setMarketingConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#F97316] cursor-pointer flex-shrink-0"
                    />
                    <span className="text-[11px] text-gray-500 leading-relaxed">
                      Acepto recibir comunicaciones y novedades de BuddyMarket{" "}
                      <span className="text-gray-400">(opcional)</span>
                    </span>
                  </label>
                </div>
                <Button type="submit" disabled={isLoading || !acceptTerms || !acceptPrivacy || (!!confirmPassword && confirmPassword !== password)}
                  className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl text-sm shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98] disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Crear cuenta gratis <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>
              <p className="text-center text-gray-400 text-xs">
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => setMode("login")} className="text-[#F97316] font-semibold hover:text-[#fb923c] transition-colors">
                  Inicia sesión
                </button>
              </p>
              <p className="text-center text-gray-400 text-[10px] leading-relaxed">
                <span className="text-red-500">*</span> Campos obligatorios · El contenido no constituye asesoramiento profesional.
              </p>
            </div>
          )}

          {/* ── OTP EMAIL ── */}
          {mode === "otp-email" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Acceso sin contraseña</h2>
                <p className="text-gray-400 text-xs mt-0.5">Te enviaremos un código de 6 dígitos</p>
              </div>
              <form onSubmit={handleSendOTP} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" className={`${inp} pl-10`} />
                </div>
                <Button type="submit" disabled={isLoading}
                  className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl text-sm shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98]">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Enviar código <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>
            </div>
          )}

          {/* ── OTP CODE ── */}
          {mode === "otp-code" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Introduce el código</h2>
                <p className="text-gray-400 text-xs mt-0.5">Enviado a <span className="text-white/70">{email}</span></p>
              </div>
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="flex gap-2 justify-center">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => { otpRefs.current[idx] = el; }}
                      type="text" inputMode="numeric" maxLength={6}
                      value={digit}
                      onChange={e => handleOtpInput(idx, e.target.value)}
                      onKeyDown={e => handleOtpKey(idx, e)}
                      className="w-11 h-14 text-center text-xl font-bold text-white bg-white/[0.08] border border-white/[0.14] rounded-xl focus:border-[#F97316] focus:outline-none transition-colors"
                    />
                  ))}
                </div>
                <Button type="submit" disabled={isLoading || otpCode.join("").length < 6}
                  className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl text-sm shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98] disabled:opacity-40">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Verificar código <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>
              <p className="text-center text-gray-400 text-xs">
                ¿No recibiste el código?{" "}
                <button onClick={() => handleSendOTP()} className="text-[#F97316] font-semibold hover:text-[#fb923c] transition-colors">
                  Reenviar
                </button>
              </p>
            </div>
          )}

          {/* ── PHONE OTP ── */}
          {mode === "phone" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Acceso por teléfono</h2>
                <p className="text-gray-400 text-xs mt-0.5">Te enviaremos un código de 6 dígitos por SMS</p>
              </div>
              <form onSubmit={handleSendPhoneOTP} className="space-y-3">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+34 612 345 678"
                    className={`${inp} pl-10`}
                  />
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Introduce tu número con el prefijo de país (ej: <span className="text-gray-600">+34</span> para España, <span className="text-gray-600">+1</span> para EE.UU.)
                </p>
                <Button type="submit" disabled={isLoading}
                  className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl text-sm shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98]">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Enviar código SMS <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>
            </div>
          )}

          {/* ── PHONE OTP CODE ── */}
          {mode === "phone-code" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Introduce el código</h2>
                <p className="text-gray-400 text-xs mt-0.5">Enviado por SMS a <span className="font-medium text-gray-700">{phone}</span></p>
              </div>
              <form onSubmit={handleVerifyPhoneOTP} className="space-y-5">
                <div className="flex gap-2 justify-center">
                  {phoneOtpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => { phoneOtpRefs.current[idx] = el; }}
                      type="text" inputMode="numeric" maxLength={6}
                      value={digit}
                      onChange={e => handlePhoneOtpInput(idx, e.target.value)}
                      onKeyDown={e => handlePhoneOtpKey(idx, e)}
                      className="w-11 h-14 text-center text-xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#F97316] focus:outline-none transition-colors"
                    />
                  ))}
                </div>
                <Button type="submit" disabled={isLoading || phoneOtpCode.join("").length < 6}
                  className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl text-sm shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98] disabled:opacity-40">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Verificar código <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>
              <p className="text-center text-gray-400 text-xs">
                ¿No recibiste el SMS?{" "}
                <button onClick={() => handleSendPhoneOTP()} className="text-[#F97316] font-semibold hover:text-[#fb923c] transition-colors">
                  Reenviar
                </button>
              </p>
            </div>
          )}

          {/* ── FORGOT ── */}
          {mode === "forgot" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Recuperar contraseña</h2>
                <p className="text-gray-400 text-xs mt-0.5">Te enviaremos un enlace de recuperación</p>
              </div>
              <form onSubmit={handleForgot} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    placeholder="tu@email.com" className={`${inp} pl-10`} />
                </div>
                <Button type="submit" disabled={isLoading}
                  className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl text-sm shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98]">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Enviar enlace <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>
            </div>
          )}

          {/* ── FORGOT SENT ── */}
          {mode === "forgot-sent" && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">¡Revisa tu email!</h2>
                <p className="text-white/40 text-sm mt-1 leading-relaxed">
                  Hemos enviado un enlace de recuperación a <span className="text-white/70">{forgotEmail}</span>
                </p>
              </div>
              <Button onClick={() => setMode("login")}
                className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl text-sm shadow-[0_4px_20px_rgba(249,115,22,0.4)]">
                Volver al login
              </Button>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-center text-white/15 text-[10px] mt-6 leading-relaxed">
            © {new Date().getFullYear()} BuddyMarket · El contenido no constituye asesoramiento profesional.
          </p>
        </div>
      </div>

      {/* ─── Modal TyC para SSO ─────────────────────────────────────────────────────── */}
      {ssoTyCModal && (
        <SSOTermsModal
          provider={ssoTyCModal.provider}
          onAccept={() => {
            setSsoTyCModal(null);
            ssoTyCModal.pendingAction();
          }}
          onClose={() => setSsoTyCModal(null)}
        />
      )}
    </div>
  );
}
