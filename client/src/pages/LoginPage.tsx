import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, ChevronLeft, User } from "lucide-react";
import WebSSOButtons from "@/components/WebSSOButtons";

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

const LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddymarket-logo_bcd5af5e.png";

type AuthMode = "login" | "register" | "otp-email" | "otp-code" | "forgot" | "forgot-sent";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [slide, setSlide] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // tRPC mutations
  const loginMut = trpc.auth.login.useMutation();
  const registerMut = trpc.auth.register.useMutation();
  const sendOTPMut = trpc.auth.sendOTP.useMutation();
  const verifyOTPMut = trpc.auth.verifyOTP.useMutation();
  const forgotMut = trpc.auth.forgotPassword.useMutation();
  const utils = trpc.useUtils();

  // Auto-advance carousel
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
    try {
      await registerMut.mutateAsync({ name, email, password });
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

  const isLoading = loginMut.isPending || registerMut.isPending || sendOTPMut.isPending || verifyOTPMut.isPending || forgotMut.isPending;

  const inp = "bg-white/[0.08] border border-white/[0.14] text-white placeholder:text-white/30 focus-visible:border-[#F97316] focus-visible:ring-0 focus-visible:ring-offset-0 rounded-2xl h-13 text-sm transition-colors";

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
          <img src={LOGO} alt="BuddyMarket" className="h-20 w-20 object-contain drop-shadow-2xl" />
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
        <div className="bg-[#111110] rounded-t-[2rem] px-6 pt-7 pb-10 shadow-2xl min-h-[420px]">

          {/* Back button for sub-modes */}
          {(mode !== "login") && (
            <button
              onClick={() => setMode(mode === "otp-code" ? "otp-email" : "login")}
              className="flex items-center gap-1 text-white/50 hover:text-white text-sm mb-5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
          )}

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Bienvenido de nuevo</h2>
                <p className="text-white/40 text-xs mt-0.5">Accede a tu cuenta BuddyMarket</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" className={`${inp} pl-10`} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <Input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Contraseña" className={`${inp} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
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

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/25 text-xs">o continúa con</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <Button type="button" onClick={() => setMode("otp-email")} variant="outline"
                className="w-full h-12 bg-white/[0.05] border-white/[0.12] text-white hover:bg-white/[0.10] rounded-2xl text-sm transition-all active:scale-[0.98]">
                <Mail className="w-4 h-4 mr-2 text-[#F97316]" /> Acceder con código por email
              </Button>

              <p className="text-center text-white/40 text-xs">
                ¿No tienes cuenta?{" "}
                <button onClick={() => setMode("register")} className="text-[#F97316] font-semibold hover:text-[#fb923c] transition-colors">
                  Regístrate gratis
                </button>
              </p>
            </div>
          )}

          {/* ── REGISTER ── */}
          {mode === "register" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Crea tu cuenta</h2>
                <p className="text-white/40 text-xs mt-0.5">Únete a la comunidad BuddyMarket</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <Input type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre" className={`${inp} pl-10`} />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" className={`${inp} pl-10`} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <Input type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Contraseña (mín. 8 caracteres)" className={`${inp} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <Input type={showConfirm ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar contraseña" className={`${inp} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="submit" disabled={isLoading}
                  className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-2xl text-sm shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98]">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Crear cuenta <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/25 text-xs">o regístrate con</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="[&_button]:rounded-2xl [&_button]:h-12 [&_button]:text-sm [&_button]:font-semibold [&_button]:border-white/[0.12] [&_button]:bg-white/[0.05] [&_button]:text-white [&_button:hover]:bg-white/[0.10]">
                <WebSSOButtons onSuccess={() => { window.location.href = "/app/dashboard"; }} />
              </div>
              <p className="text-center text-white/40 text-xs">
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => setMode("login")} className="text-[#F97316] font-semibold hover:text-[#fb923c] transition-colors">
                  Inicia sesión
                </button>
              </p>
              <p className="text-center text-white/20 text-[10px] leading-relaxed">
                Al registrarte aceptas nuestros <a href="/terms" className="underline">Términos</a> y <a href="/privacy" className="underline">Privacidad</a>.<br />
                El contenido no constituye asesoramiento profesional.
              </p>
            </div>
          )}

          {/* ── OTP EMAIL ── */}
          {mode === "otp-email" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Acceso sin contraseña</h2>
                <p className="text-white/40 text-xs mt-0.5">Te enviaremos un código de 6 dígitos</p>
              </div>
              <form onSubmit={handleSendOTP} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
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
                <h2 className="text-xl font-bold text-white">Introduce el código</h2>
                <p className="text-white/40 text-xs mt-0.5">Enviado a <span className="text-white/70">{email}</span></p>
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
              <p className="text-center text-white/40 text-xs">
                ¿No recibiste el código?{" "}
                <button onClick={() => handleSendOTP()} className="text-[#F97316] font-semibold hover:text-[#fb923c] transition-colors">
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
                <p className="text-white/40 text-xs mt-0.5">Te enviaremos un enlace de recuperación</p>
              </div>
              <form onSubmit={handleForgot} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
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
    </div>
  );
}
