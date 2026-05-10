import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, ArrowRight, Loader2, CheckCircle2, XCircle } from "lucide-react";

const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-horizontal-orange_0dcbe0a8.png";
const FOOD_BG = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80&auto=format&fit=crop";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const resetMut = trpc.auth.resetPassword.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
    } else {
      setInvalid(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    try {
      await resetMut.mutateAsync({ token, password });
      setDone(true);
    } catch (err: any) {
      toast.error("Error al restablecer contraseña", { description: err.message });
    }
  };

  const inputCls = "bg-background/[0.06] border-white/[0.12] text-white placeholder:text-white/25 focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20 rounded-xl h-12";

  return (
    <div className="min-h-screen flex bg-[#0F0D0B] font-sans">
      {/* Left panel */}
      <div className="flex-1 flex flex-col min-h-screen px-8 py-10 md:px-14 lg:px-20 max-w-[520px] w-full">
        <a href="/" className="inline-block shrink-0">
          <img src={LOGO_COLOR} alt="Buddy One" className="h-9 w-auto object-contain" />
        </a>

        <div className="flex-1 flex flex-col justify-center py-10 space-y-7">

          {/* Invalid token */}
          {invalid && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mx-auto">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Enlace no válido</h1>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">
                  Este enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.
                </p>
              </div>
              <Button onClick={() => setLocation("/login")} className="bg-[#F97316] hover:bg-[#ea6c0f] text-white rounded-xl h-12 px-8 shadow-[0_6px_24px_rgba(249,115,22,0.35)]">
                Volver al login
              </Button>
            </div>
          )}

          {/* Success */}
          {done && !invalid && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">¡Contraseña actualizada!</h1>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">
                  Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.
                </p>
              </div>
              <Button onClick={() => setLocation("/login")} className="bg-[#F97316] hover:bg-[#ea6c0f] text-white rounded-xl h-12 px-8 shadow-[0_6px_24px_rgba(249,115,22,0.35)]">
                Ir al login
              </Button>
            </div>
          )}

          {/* Form */}
          {!done && !invalid && (
            <>
              <div>
                <h1 className="text-[2rem] font-bold text-white tracking-tight leading-tight">Nueva contraseña</h1>
                <p className="mt-2 text-sm text-white/50">Elige una contraseña segura para tu cuenta</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">Nueva contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"} required minLength={8}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className={`${inputCls} pl-10 pr-10`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <Input
                      type={showConfirm ? "text" : "password"} required
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      className={`${inputCls} pl-10 pr-10`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                          password.length >= i * 3
                            ? i <= 1 ? "bg-red-500" : i <= 2 ? "bg-yellow-500" : i <= 3 ? "bg-blue-500" : "bg-green-500"
                            : "bg-background/10"
                        }`} />
                      ))}
                    </div>
                    <p className="text-xs text-white/30">
                      {password.length < 4 ? "Muy débil" : password.length < 7 ? "Débil" : password.length < 10 ? "Buena" : "Muy segura"}
                    </p>
                  </div>
                )}

                <Button type="submit" disabled={resetMut.isPending}
                  className="w-full h-12 bg-[#F97316] hover:bg-[#ea6c0f] text-white font-semibold rounded-xl text-sm tracking-wide shadow-[0_6px_24px_rgba(249,115,22,0.35)] transition-all">
                  {resetMut.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <span className="flex items-center gap-2">Guardar nueva contraseña <ArrowRight className="w-4 h-4" /></span>
                  }
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-[11px] text-white/20 text-center shrink-0">
          © {new Date().getFullYear()} Buddy One · El contenido no constituye asesoramiento profesional.
        </p>
      </div>

      {/* Right panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={FOOD_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0D0B] via-[#0F0D0B]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0D0B]/70 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-10 right-10">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-sm">
            <p className="text-white/85 text-sm leading-relaxed italic">
              "Tu seguridad es nuestra prioridad. Usamos cifrado de extremo a extremo para proteger tus datos."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F97316] to-[#ea580c] flex items-center justify-center text-white text-sm font-bold shrink-0">B</div>
              <div>
                <p className="text-white text-xs font-semibold">Equipo Buddy One</p>
                <p className="text-white/40 text-xs">Seguridad & Privacidad</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
