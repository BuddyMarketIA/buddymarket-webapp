import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowRight, ChevronLeft } from "lucide-react";
import WebSSOButtons from "@/components/WebSSOButtons";

const LOGO = "/favicon-192x192.png";

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
];

type Mode = "login" | "register" | "forgot" | "forgot-sent" | "otp-email" | "otp-code";

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400"];
  const labels = ["Muy débil", "Débil", "Buena", "Fuerte"];
  return (
    <div className="space-y-1 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : "bg-muted"}`} />
        ))}
      </div>
      {score > 0 && <p className={`text-[10px] font-medium ${score <= 1 ? "text-red-400" : score === 2 ? "text-orange-400" : score === 3 ? "text-yellow-500" : "text-green-500"}`}>{labels[score - 1]}</p>}
    </div>
  );
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [slide, setSlide] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => localStorage.getItem("bm_remembered_email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem("bm_remembered_email"));
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // tRPC
  const utils = trpc.useUtils();
  const loginMut = trpc.auth.login.useMutation();
  const registerMut = trpc.auth.register.useMutation();
  const forgotMut = trpc.auth.forgotPassword.useMutation();
  const sendOTPMut = trpc.auth.sendOTP.useMutation();
  const verifyOTPMut = trpc.auth.verifyOTP.useMutation();
  const acceptTermsMut = trpc.auth.acceptTerms.useMutation();

  // Check if already logged in — single redirect path
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  // Check if user just logged out — use localStorage (persists across reloads)
  // Also support legacy ?logout=1 URL param for backwards compatibility
  const isJustLoggedOut = (
    localStorage.getItem("bm_just_logged_out") === "1" ||
    new URLSearchParams(window.location.search).get("logout") === "1"
  );

  useEffect(() => {
    // Never redirect if user just logged out (even if session briefly still active)
    if (meQuery.isLoading || isJustLoggedOut) return;
    // If already authenticated, always go to dashboard (never to buddy-setup from login page)
    if (meQuery.data) {
      setLocation("/app/dashboard");
    }
  }, [meQuery.data, meQuery.isLoading, isJustLoggedOut, setLocation]);

  // Clear the logout flag ONLY when user actively starts a new login.
  // This prevents the flag from blocking the redirect after a successful login.
  const clearLogoutFlag = () => localStorage.removeItem("bm_just_logged_out");

  // Carousel auto-advance
  useEffect(() => {
    const id = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => { setSlide(s => (s + 1) % SLIDES.length); setTransitioning(false); }, 350);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  // Single post-auth redirect function
  const afterAuth = async (isNewRegistration = false) => {
    try {
      const user = await utils.auth.me.fetch();
      // Only go to buddy-setup if this is a brand new registration AND onboarding not done
      const dest = (isNewRegistration && user && !user.onboardingCompleted)
        ? "/buddy-setup"
        : "/app/dashboard";
      setLocation(dest);
    } catch {
      setLocation("/app/dashboard");
    }
  };

  const isLoading = loginMut.isPending || registerMut.isPending || forgotMut.isPending || sendOTPMut.isPending || verifyOTPMut.isPending;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Completa todos los campos"); return; }
    try {
      await loginMut.mutateAsync({ email, password });
      if (rememberMe) localStorage.setItem("bm_remembered_email", email);
      else localStorage.removeItem("bm_remembered_email");
      clearLogoutFlag();
      // Login existing user: always go to dashboard, never to buddy-setup
      await afterAuth(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Email o contraseña incorrectos");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Introduce tu nombre"); return; }
    if (password.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return; }
    if (password !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return; }
    if (!acceptTerms || !acceptPrivacy) { toast.error("Debes aceptar los términos y la política de privacidad"); return; }
    try {
      await registerMut.mutateAsync({ name, email, password });
      try { await acceptTermsMut.mutateAsync({ termsVersion: "2.0", acceptPrivacy, marketingConsent: false }); } catch { /* non-critical */ }
      toast.success(`¡Bienvenido, ${name.split(" ")[0]}!`);
      clearLogoutFlag();
      // New registration: allow redirect to buddy-setup
      await afterAuth(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Error al crear la cuenta");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { toast.error("Introduce tu email"); return; }
    try {
      await forgotMut.mutateAsync({ email: forgotEmail, origin: window.location.origin });
      setMode("forgot-sent");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al enviar el email");
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail) { toast.error("Introduce tu email"); return; }
    try {
      await sendOTPMut.mutateAsync({ email: otpEmail });
      setMode("otp-code");
      toast.success("Código enviado — revisa tu bandeja de entrada");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al enviar el código");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) { toast.error("Introduce el código de 6 dígitos"); return; }
    try {
      await verifyOTPMut.mutateAsync({ email: otpEmail, code: otpCode });
      clearLogoutFlag();
      // OTP login = existing user, always go to dashboard
      await afterAuth(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Código incorrecto");
    }
  };

  if (meQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  const inp = "bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground/70 focus-visible:border-[#F97316] focus-visible:ring-0 focus-visible:ring-offset-0 rounded-2xl h-12 text-sm transition-colors";
  const currentSlide = SLIDES[slide];

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-[#0a0a0a]">

      {/* ── Left panel: carousel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url(${currentSlide.img})`, opacity: transitioning ? 0 : 1 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <a href="/" className="flex items-center gap-3 no-underline">
            <img src={LOGO} alt="BuddyMarket" className="w-10 h-10" />
            <span className="text-white text-2xl font-black tracking-tight">BuddyMarket</span>
          </a>
          <div>
            <h2 className="text-white text-4xl font-black leading-tight mb-3 whitespace-pre-line">{currentSlide.title}</h2>
            <p className="text-white/70 text-lg">{currentSlide.sub}</p>
            <div className="flex gap-2 mt-6">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-[#F97316]" : "w-4 bg-background/30"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background min-h-screen">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <img src={LOGO} alt="BuddyMarket" className="w-9 h-9" />
            <span className="text-[#F97316] text-xl font-black">BuddyMarket</span>
          </div>

          {/* Back button */}
          {mode !== "login" && mode !== "register" && (
            <button onClick={() => setMode("login")} className="flex items-center gap-1 text-muted-foreground/70 hover:text-foreground/80 text-sm mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
          )}
          {mode === "register" && (
            <button onClick={() => setMode("login")} className="flex items-center gap-1 text-muted-foreground/70 hover:text-foreground/80 text-sm mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Volver al inicio de sesión
            </button>
          )}
          {mode === "otp-code" && (
            <button onClick={() => setMode("otp-email")} className="flex items-center gap-1 text-muted-foreground/70 hover:text-foreground/80 text-sm mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
          )}

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Bienvenido de nuevo</h1>
                <p className="text-muted-foreground/70 text-sm mt-1">Accede a tu cuenta BuddyMarket</p>
              </div>

              {/* SSO */}
              <WebSSOButtons onSuccess={() => { clearLogoutFlag(); afterAuth(); }} onBeforeSSO={(_, action) => { clearLogoutFlag(); action(); }} />

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-muted" />
                <span className="text-xs text-muted-foreground/70">o con email</span>
                <div className="flex-1 h-px bg-muted" />
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className={`${inp} pl-10`} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
                  <Input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className={`${inp} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 rounded accent-[#F97316]" />
                    <span className="text-xs text-muted-foreground">Recordar sesión</span>
                  </label>
                  <button type="button" onClick={() => setMode("forgot")} className="text-[#F97316] text-xs hover:underline">
                    ¿Olvidaste la contraseña?
                  </button>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl shadow-[0_4px_20px_rgba(249,115,22,0.35)]">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Iniciar sesión <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>

              <button onClick={() => setMode("otp-email")} className="w-full h-11 rounded-2xl border border-border bg-muted/30 text-foreground/80 text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2">
                <Mail className="w-4 h-4 text-[#F97316]" /> Acceder con código por email
              </button>

              <p className="text-center text-muted-foreground/70 text-sm">
                ¿No tienes cuenta?{" "}
                <button onClick={() => setMode("register")} className="text-[#F97316] font-semibold hover:underline">
                  Regístrate gratis
                </button>
              </p>
            </div>
          )}

          {/* ── REGISTER ── */}
          {mode === "register" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Crea tu cuenta</h1>
                <p className="text-muted-foreground/70 text-sm mt-1">Únete a BuddyMarket — es gratis</p>
              </div>

              {/* SSO */}
              <WebSSOButtons onSuccess={() => { clearLogoutFlag(); afterAuth(); }} onBeforeSSO={(_, action) => { clearLogoutFlag(); action(); }} />

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-muted" />
                <span className="text-xs text-muted-foreground/70">o con email</span>
                <div className="flex-1 h-px bg-muted" />
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
                  <Input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre completo" className={`${inp} pl-10`} minLength={2} maxLength={100} />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className={`${inp} pl-10`} />
                </div>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
                    <Input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña (mín. 8 caracteres)" className={`${inp} pl-10 pr-10`} minLength={8} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
                  <Input
                    type={showConfirm ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar contraseña"
                    className={`${inp} pl-10 pr-10 ${confirmPassword && confirmPassword !== password ? "border-red-400" : confirmPassword && confirmPassword === password ? "border-green-400" : ""}`}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && <p className="text-[10px] text-red-400 -mt-1">Las contraseñas no coinciden</p>}

                {/* Terms */}
                <div className="space-y-2 pt-1 border-t border-border/50">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-[#F97316] flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      Acepto los <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#F97316] underline">Términos y Condiciones</a> <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={acceptPrivacy} onChange={e => setAcceptPrivacy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-[#F97316] flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      Acepto la <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#F97316] underline">Política de Privacidad</a> <span className="text-red-500">*</span>
                    </span>
                  </label>
                </div>

                <Button type="submit" disabled={isLoading || !acceptTerms || !acceptPrivacy || (!!confirmPassword && confirmPassword !== password)}
                  className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl shadow-[0_4px_20px_rgba(249,115,22,0.35)] disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Crear cuenta <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>

              <p className="text-center text-muted-foreground/70 text-sm">
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => setMode("login")} className="text-[#F97316] font-semibold hover:underline">
                  Iniciar sesión
                </button>
              </p>
            </div>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Recuperar contraseña</h1>
                <p className="text-muted-foreground/70 text-sm mt-1">Te enviaremos un enlace para restablecer tu contraseña</p>
              </div>
              <form onSubmit={handleForgot} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
                  <Input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="tu@email.com" className={`${inp} pl-10`} />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar enlace de recuperación"}
                </Button>
              </form>
            </div>
          )}

          {/* ── FORGOT SENT ── */}
          {mode === "forgot-sent" && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Email enviado</h1>
                <p className="text-muted-foreground/70 text-sm mt-2">Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</p>
              </div>
              <button onClick={() => setMode("login")} className="text-[#F97316] text-sm font-semibold hover:underline">
                Volver al inicio de sesión
              </button>
            </div>
          )}

          {/* ── OTP EMAIL ── */}
          {mode === "otp-email" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Acceso sin contraseña</h1>
                <p className="text-muted-foreground/70 text-sm mt-1">Te enviaremos un código de 6 dígitos a tu email</p>
              </div>
              <form onSubmit={handleSendOTP} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
                  <Input type="email" required value={otpEmail} onChange={e => setOtpEmail(e.target.value)} placeholder="tu@email.com" className={`${inp} pl-10`} />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar código"}
                </Button>
              </form>
            </div>
          )}

          {/* ── OTP CODE ── */}
          {mode === "otp-code" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Introduce el código</h1>
                <p className="text-muted-foreground/70 text-sm mt-1">Enviado a <strong className="text-foreground/80">{otpEmail}</strong></p>
              </div>
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <Input
                  type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} required
                  value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className={`${inp} text-center text-2xl font-bold tracking-[0.5em] letter-spacing-widest`}
                />
                <Button type="submit" disabled={isLoading || otpCode.length < 6} className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar código"}
                </Button>
                <button type="button" onClick={() => { setOtpCode(""); sendOTPMut.mutate({ email: otpEmail }); toast.success("Código reenviado"); }} className="w-full text-center text-muted-foreground/70 text-xs hover:text-muted-foreground">
                  ¿No recibiste el código? Reenviar
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
