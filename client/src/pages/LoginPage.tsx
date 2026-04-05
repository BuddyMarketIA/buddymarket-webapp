import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, ChevronLeft } from "lucide-react";

const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddymarket-logo-color_856f2d67.jpg";
const FOOD_BG = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80&auto=format&fit=crop";

type AuthMode = "login" | "register" | "otp-email" | "otp-code" | "forgot" | "forgot-sent";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [forgotEmail, setForgotEmail] = useState("");

  // tRPC mutations
  const loginMut = trpc.auth.login.useMutation();
  const registerMut = trpc.auth.register.useMutation();
  const sendOTPMut = trpc.auth.sendOTP.useMutation();
  const verifyOTPMut = trpc.auth.verifyOTP.useMutation();
  const forgotMut = trpc.auth.forgotPassword.useMutation();
  const utils = trpc.useUtils();

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
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
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
    const next = [...otpCode];
    next[idx] = val.slice(-1);
    setOtpCode(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtpCode(text.split(""));
      document.getElementById("otp-5")?.focus();
    }
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

  const inputCls = "bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/25 focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20 rounded-xl h-12";

  return (
    <div className="min-h-screen flex bg-[#0F0D0B] font-sans">
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen px-8 py-10 md:px-14 lg:px-20 max-w-[520px] w-full">
        {/* Logo */}
        <a href="/" className="inline-block shrink-0">
          <img src={LOGO_COLOR} alt="BuddyMarket" className="h-9 w-auto object-contain" />
        </a>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center py-10 space-y-7">

          {/* LOGIN */}
          {mode === "login" && (
            <>
              <div>
                <h1 className="text-[2rem] font-bold text-white tracking-tight leading-tight">Bienvenido de nuevo</h1>
                <p className="mt-2 text-sm text-white/50">Accede a tu cuenta BuddyMarket</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className={`${inputCls} pl-10`} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">Contraseña</Label>
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-[#F97316] hover:text-[#fb923c] transition-colors font-medium">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <Input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={`${inputCls} pl-10 pr-10`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-xl text-sm tracking-wide shadow-[0_6px_24px_rgba(249,115,22,0.35)] hover:shadow-[0_8px_28px_rgba(249,115,22,0.45)] transition-all">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Iniciar sesión <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.08]" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-[#0F0D0B] px-3 text-white/25">o continúa con</span></div>
              </div>

              <Button type="button" variant="outline" onClick={() => setMode("otp-email")}
                className="w-full h-12 bg-white/[0.04] border-white/[0.10] text-white/80 hover:bg-white/[0.08] hover:text-white rounded-xl text-sm font-medium transition-all">
                <Mail className="w-4 h-4 mr-2 text-[#F97316]" />
                Acceder con código por email
              </Button>

              <p className="text-center text-sm text-white/35">
                ¿No tienes cuenta?{" "}
                <button onClick={() => setMode("register")} className="text-[#F97316] hover:text-[#fb923c] font-semibold transition-colors">
                  Regístrate gratis
                </button>
              </p>
            </>
          )}

          {/* REGISTER */}
          {mode === "register" && (
            <>
              <div>
                <button onClick={() => setMode("login")} className="flex items-center gap-1 text-white/35 hover:text-white/60 text-sm mb-5 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>
                <h1 className="text-[2rem] font-bold text-white tracking-tight leading-tight">Crea tu cuenta</h1>
                <p className="mt-2 text-sm text-white/50">Empieza tu camino hacia una alimentación mejor</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">Nombre completo</Label>
                  <Input type="text" required minLength={2} value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" className={`${inputCls} px-4`} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className={`${inputCls} pl-10`} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <Input type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className={`${inputCls} pl-10 pr-10`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <Input type={showConfirm ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repite tu contraseña" className={`${inputCls} pl-10 pr-10`} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-xl text-sm tracking-wide shadow-[0_6px_24px_rgba(249,115,22,0.35)] transition-all">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Crear cuenta <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>
              <p className="text-center text-xs text-white/25">
                Al registrarte aceptas nuestros{" "}
                <a href="/terms" className="text-[#F97316]/80 hover:text-[#F97316] transition-colors">Términos</a>{" "}
                y{" "}
                <a href="/privacy" className="text-[#F97316]/80 hover:text-[#F97316] transition-colors">Privacidad</a>
              </p>
              <p className="text-center text-sm text-white/35">
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => setMode("login")} className="text-[#F97316] hover:text-[#fb923c] font-semibold transition-colors">
                  Inicia sesión
                </button>
              </p>
            </>
          )}

          {/* OTP EMAIL */}
          {mode === "otp-email" && (
            <>
              <div>
                <button onClick={() => setMode("login")} className="flex items-center gap-1 text-white/35 hover:text-white/60 text-sm mb-5 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>
                <h1 className="text-[2rem] font-bold text-white tracking-tight leading-tight">Acceso sin contraseña</h1>
                <p className="mt-2 text-sm text-white/50">Te enviaremos un código de 6 dígitos a tu email</p>
              </div>
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className={`${inputCls} pl-10`} />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-xl text-sm tracking-wide shadow-[0_6px_24px_rgba(249,115,22,0.35)] transition-all">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Enviar código <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>
            </>
          )}

          {/* OTP CODE */}
          {mode === "otp-code" && (
            <>
              <div>
                <button onClick={() => setMode("otp-email")} className="flex items-center gap-1 text-white/35 hover:text-white/60 text-sm mb-5 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Cambiar email
                </button>
                <h1 className="text-[2rem] font-bold text-white tracking-tight leading-tight">Introduce el código</h1>
                <p className="mt-2 text-sm text-white/50">
                  Enviado a <span className="text-[#F97316] font-medium">{email}</span>. Válido 10 minutos.
                </p>
              </div>
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      className="w-12 h-14 text-center text-2xl font-bold bg-white/[0.06] border border-white/[0.12] text-white rounded-xl focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 transition-all"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    />
                  ))}
                </div>
                <Button type="submit" disabled={isLoading || otpCode.join("").length < 6}
                  className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-xl text-sm tracking-wide shadow-[0_6px_24px_rgba(249,115,22,0.35)] transition-all disabled:opacity-40 disabled:shadow-none">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Verificar código <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>
              <p className="text-center text-sm text-white/35">
                ¿No recibiste el código?{" "}
                <button onClick={() => handleSendOTP()} disabled={sendOTPMut.isPending} className="text-[#F97316] hover:text-[#fb923c] font-semibold transition-colors disabled:opacity-50">
                  Reenviar
                </button>
              </p>
            </>
          )}

          {/* FORGOT PASSWORD */}
          {mode === "forgot" && (
            <>
              <div>
                <button onClick={() => setMode("login")} className="flex items-center gap-1 text-white/35 hover:text-white/60 text-sm mb-5 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Volver al login
                </button>
                <h1 className="text-[2rem] font-bold text-white tracking-tight leading-tight">Recupera tu acceso</h1>
                <p className="mt-2 text-sm text-white/50">Te enviaremos un enlace para restablecer tu contraseña</p>
              </div>
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">Email de tu cuenta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <Input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="tu@email.com" className={`${inputCls} pl-10`} />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-xl text-sm tracking-wide shadow-[0_6px_24px_rgba(249,115,22,0.35)] transition-all">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Enviar enlace <ArrowRight className="w-4 h-4" /></span>}
                </Button>
              </form>
            </>
          )}

          {/* FORGOT SENT */}
          {mode === "forgot-sent" && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/20 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-[#F97316]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Revisa tu email</h1>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">
                  Si existe una cuenta con <span className="text-[#F97316] font-medium">{forgotEmail}</span>, recibirás un enlace en los próximos minutos.
                </p>
              </div>
              <Button onClick={() => setMode("login")} variant="outline"
                className="bg-white/[0.05] border-white/[0.10] text-white hover:bg-white/[0.09] rounded-xl h-12 px-8 transition-all">
                Volver al inicio de sesión
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-[11px] text-white/20 text-center shrink-0">
          © {new Date().getFullYear()} BuddyMarket · El contenido no constituye asesoramiento profesional.
        </p>
      </div>

      {/* ── Right panel: image ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={FOOD_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0D0B] via-[#0F0D0B]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0D0B]/70 via-transparent to-transparent" />
        {/* Feature pills */}
        <div className="absolute top-10 right-10 flex flex-col gap-2.5">
          {["Planificación nutricional IA", "Recetas personalizadas", "Seguimiento de objetivos"].map((feat) => (
            <div key={feat} className="bg-black/35 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-white/80 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] shrink-0" />
              {feat}
            </div>
          ))}
        </div>
        {/* Quote card */}
        <div className="absolute bottom-12 left-10 right-10">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-sm">
            <p className="text-white/85 text-sm leading-relaxed italic">
              "BuddyMarket transformó mi relación con la alimentación. Nunca había sido tan fácil comer bien y alcanzar mis objetivos."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F97316] to-[#ea580c] flex items-center justify-center text-white text-sm font-bold shrink-0">M</div>
              <div>
                <p className="text-white text-xs font-semibold">María G.</p>
                <p className="text-white/40 text-xs">Usuario Premium · -8 kg en 3 meses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
