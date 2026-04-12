/**
 * Página /activar
 * Permite a los empleados activar su código de empresa (o referido) en cualquier momento.
 * También accesible desde el perfil de usuario.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-horizontal-orange_0dcbe0a8.png";

export default function ActivarCodigo() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [codeInput, setCodeInput] = useState(() => {
    // Pre-rellenar desde query param ?code=EMPRESA2025
    const params = new URLSearchParams(window.location.search);
    return params.get("code")?.toUpperCase() ?? "";
  });
  const [codeDebounced, setCodeDebounced] = useState(codeInput);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [activationDone, setActivationDone] = useState(false);
  const [activationResult, setActivationResult] = useState<{ companyName: string; welcomeMessage?: string | null } | null>(null);

  const handleCodeChange = (val: string) => {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setCodeInput(upper);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setCodeDebounced(upper), 600);
    setTimer(t);
  };

  const { data: codeInfo, isFetching: codeChecking } = trpc.codes.validate.useQuery(
    { code: codeDebounced },
    { enabled: codeDebounced.length >= 4, retry: false, staleTime: 30000 }
  );

  const applyCompanyCode = trpc.codes.applyCompanyCode.useMutation();

  const { data: existingAccess } = trpc.codes.getMyCompanyAccess.useQuery(undefined, {
    enabled: !!user,
  });

  const handleActivate = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión primero");
      navigate("/registro");
      return;
    }
    if (!codeInfo || !codeInfo.hasCapacity) return;

    try {
      if (codeInfo.type === "company") {
        const result = await applyCompanyCode.mutateAsync({ code: codeInput });
        setActivationResult({ companyName: result.companyName, welcomeMessage: result.welcomeMessage });
        setActivationDone(true);
        toast.success(result.message);
      } else {
        // Para códigos de referido de expertos/makers, redirigir al checkout con el código
        toast.info(`El código ${codeInput} se aplicará automáticamente al suscribirte. Redirigiendo...`);
        setTimeout(() => navigate("/suscripcion"), 1500);
      }
    } catch (e: any) {
      toast.error(e?.message || "No se pudo activar el código");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si ya tiene acceso empresarial activo
  if (existingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white p-4">
        <Card className="w-full max-w-md shadow-xl border-green-200">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-black text-green-800 mb-2">¡Ya tienes acceso empresarial!</h2>
            <p className="text-green-700 mb-4">
              Tu cuenta está vinculada al plan de <strong>{existingAccess.companyName}</strong>.
            </p>
            <Badge className="bg-green-100 text-green-800 border-green-300 mb-6">
              Pro Max activo hasta {existingAccess.contractEndAt
                ? new Date(existingAccess.contractEndAt).toLocaleDateString("es-ES")
                : "indefinido"}
            </Badge>
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold" onClick={() => navigate("/")}>
              Ir a BuddyMarket
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pantalla de éxito tras activar
  if (activationDone && activationResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white p-4">
        <Card className="w-full max-w-md shadow-xl border-green-200">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-green-800 mb-2">
              ¡Bienvenido al plan de {activationResult.companyName}!
            </h2>
            {activationResult.welcomeMessage && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-left">
                <p className="text-green-800 text-sm font-medium leading-relaxed">
                  {activationResult.welcomeMessage}
                </p>
              </div>
            )}
            <p className="text-gray-600 mb-6">
              Tu cuenta ya tiene acceso <strong>Pro Max</strong> activado. Disfruta de todas las funcionalidades sin coste adicional.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {["🤖 BuddyIA sin límites", "📅 Menús personalizados", "🛒 Compra inteligente", "📊 Análisis nutricional"].map(f => (
                <div key={f} className="bg-orange-50 rounded-lg p-3 text-xs font-bold text-orange-800 text-center">
                  {f}
                </div>
              ))}
            </div>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-base py-3"
              onClick={() => navigate("/")}
            >
              Empezar a usar BuddyMarket →
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const codeValid = codeInfo && codeInfo.hasCapacity;
  const codeInvalid = codeInput.length >= 4 && !codeChecking && codeDebounced === codeInput && !codeInfo;
  const codeNoCapacity = codeInfo && !codeInfo.hasCapacity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={LOGO} alt="BuddyMarket" className="h-10 mx-auto mb-2" />
          <p className="text-white/60 text-sm">Activa tu acceso empresarial</p>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
            <h1 className="text-2xl font-black mb-1">🏢 Activar código de empresa</h1>
            <p className="text-orange-100 text-sm">
              Tu empresa te ha enviado un código de acceso. Introdúcelo aquí para activar tu plan Pro Max gratuito.
            </p>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* Campo de código */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Código de acceso
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={codeInput}
                  onChange={e => handleCodeChange(e.target.value)}
                  placeholder="Ej: MERCADONA2025"
                  maxLength={30}
                  className={`font-mono font-black text-lg tracking-widest pr-12 h-14 text-center uppercase border-2 ${
                    codeValid ? "border-green-500 bg-green-50" :
                    codeInvalid || codeNoCapacity ? "border-red-400 bg-red-50" :
                    "border-gray-300"
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">
                  {codeChecking ? "⏳" :
                    codeValid ? "✅" :
                    (codeInvalid || codeNoCapacity) ? "❌" : ""}
                </span>
              </div>

              {/* Feedback del código */}
              {codeValid && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  {codeInfo.type === "company" ? (
                    <>
                      <div className="font-black text-green-800 text-sm">🏢 {codeInfo.companyName}</div>
                      <div className="text-green-700 text-xs mt-1">✨ {codeInfo.benefit}</div>
                      {codeInfo.licensesLeft !== null && (
                        <div className="text-green-600 text-xs mt-1">
                          {codeInfo.licensesLeft} licencias disponibles
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="font-black text-green-800 text-sm">
                        👤 Código de {codeInfo.ownerName || "creador"}
                      </div>
                      <div className="text-green-700 text-xs mt-1">
                        ✨ {codeInfo.benefit} — se aplicará al suscribirte
                      </div>
                    </>
                  )}
                </div>
              )}

              {codeNoCapacity && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="font-bold text-red-800 text-sm">
                    🚫 {codeInfo?.companyName} — Sin licencias disponibles
                  </div>
                  <div className="text-red-600 text-xs mt-1">
                    Contacta con tu departamento de RRHH para ampliar el plan.
                  </div>
                </div>
              )}

              {codeInvalid && (
                <p className="mt-2 text-sm text-red-600 font-semibold">
                  Código no encontrado. Verifica que lo has escrito correctamente.
                </p>
              )}
            </div>

            {/* Botón de activar */}
            <Button
              className="w-full h-14 text-base font-black bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
              disabled={!codeValid || applyCompanyCode.isPending}
              onClick={handleActivate}
            >
              {applyCompanyCode.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Activando...
                </span>
              ) : (
                "Activar acceso Pro Max →"
              )}
            </Button>

            {/* Si no está logueado */}
            {!user && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-blue-800 text-sm font-semibold mb-3">
                  Para activar el código necesitas una cuenta de BuddyMarket
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-sm font-bold border-blue-300 text-blue-700"
                    onClick={() => navigate(`/registro?code=${codeInput}`)}
                  >
                    Crear cuenta
                  </Button>
                  <Button
                    className="flex-1 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => navigate(`/login?redirect=/activar?code=${codeInput}`)}
                  >
                    Iniciar sesión
                  </Button>
                </div>
              </div>
            )}

            {/* Separador */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 text-center">
                ¿Eres una empresa y quieres ofrecer BuddyMarket a tus empleados?{" "}
                <a href="/empresas" className="text-orange-500 font-bold hover:underline">
                  Ver planes empresariales →
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: "🤖", title: "BuddyIA", desc: "Sin límites" },
            { icon: "📅", title: "Menús", desc: "Personalizados" },
            { icon: "🛒", title: "Compra", desc: "Inteligente" },
          ].map(item => (
            <div key={item.title} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/20">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-white font-bold text-xs">{item.title}</div>
              <div className="text-white/60 text-xs">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
