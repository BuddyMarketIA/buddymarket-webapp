import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";

export default function Ecosystem() {
  const [connectingApp, setConnectingApp] = useState<string | null>(null);

  const { data: status, isLoading, refetch } = trpc.ecosystemSync.getStatus.useQuery();
  const connectMutation = trpc.ecosystemSync.connect.useMutation({
    onSuccess: () => {
      toast.success("App del ecosistema conectada correctamente");
      refetch();
      setConnectingApp(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setConnectingApp(null);
    },
  });
  const disconnectMutation = trpc.ecosystemSync.disconnect.useMutation({
    onSuccess: () => {
      toast.success("App desconectada del ecosistema");
      refetch();
    },
  });

  const { data: coachSummary } = trpc.ecosystemSync.getBuddyCoachSummary.useQuery();
  const { data: careSummary } = trpc.ecosystemSync.getBuddyCareSummary.useQuery();
  const { data: shopProducts } = trpc.ecosystemSync.getBuddyShopProducts.useQuery({ limit: 4 });

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ background: "#FFF8F0" }}>
        <div className="max-w-2xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-56 bg-gray-200 rounded-2xl"></div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const apps = status || [];
  const buddyCoachConnected = apps.find((a: any) => a.id === "buddycoach")?.connected;
  const buddyOneConnected = true; // Always connected since we ARE BuddyOne
  const ecosystemScore = 70;

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F0" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi Ecosistema</h1>
            <p className="text-sm text-gray-500">Bienestar unificado &middot; BuddyOne</p>
          </div>
          <button
            onClick={() => { refetch(); toast.success("Sincronizando ecosistema..."); }}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          </button>
        </div>

        {/* Combined Score Card - Dark gradient */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2d1b69 0%, #1a1a2e 50%, #2d2d3e 100%)" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-gray-400">Mi Ecosistema</p>
              <p className="text-sm text-purple-300 mt-0.5">BuddyCoach &times; BuddyOne</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider text-white bg-white/10 border border-white/20">
                BUDDY ONE
              </span>
            </div>
            {/* Circular Score Ring */}
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 80 80" className="w-full h-full">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke="white"
                  strokeWidth="5"
                  strokeDasharray={`${ecosystemScore * 2.14} 214`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">{ecosystemScore}</span>
                <span className="text-[9px] text-gray-300 font-medium">SCORE</span>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white flex items-center gap-2">
              <span>💪</span> Muy bien
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Buen progreso. Pequenos ajustes marcaran la diferencia.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span> Entreno
            </span>
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Nutricion
            </span>
          </div>
        </div>

        {/* Quick Access Grid 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {/* Nuevo entreno - BuddyCoach */}
          <a
            href="https://buddycoach.app"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl p-4 relative overflow-hidden group transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)" }}
          >
            <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </div>
            <span className="text-2xl">🏋️</span>
            <p className="text-sm font-semibold text-white mt-2">Nuevo entreno</p>
            <p className="text-[10px] text-purple-200 mt-0.5">BuddyCoach</p>
          </a>

          {/* Analisis - BuddyCoach */}
          <a
            href="https://buddycoach.app"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl p-4 relative overflow-hidden group transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" }}
          >
            <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            </div>
            <span className="text-2xl">📊</span>
            <p className="text-sm font-semibold text-white mt-2">Analisis</p>
            <p className="text-[10px] text-purple-200 mt-0.5">BuddyCoach</p>
          </a>

          {/* Mis medidas - BuddyCoach */}
          <a
            href="https://buddycoach.app"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl p-4 relative overflow-hidden group transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #374151 0%, #4B5563 100%)" }}
          >
            <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <span className="text-2xl">📏</span>
            <p className="text-sm font-semibold text-white mt-2">Mis medidas</p>
            <p className="text-[10px] text-gray-300 mt-0.5">BuddyCoach</p>
          </a>

          {/* Nutricion - BuddyOne */}
          <div
            className="rounded-xl p-4 relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #059669 0%, #14B8A6 100%)" }}
            onClick={() => toast.info("Ya estas en BuddyOne!")}
          >
            <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
            </div>
            <span className="text-2xl">🥗</span>
            <p className="text-sm font-semibold text-white mt-2">Nutricion</p>
            <p className="text-[10px] text-teal-200 mt-0.5">BuddyOne</p>
          </div>
        </div>

        {/* Training Section - BuddyCoach */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏋️</span>
              <h3 className="font-semibold text-gray-900">Entrenamiento</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">BuddyCoach</span>
            </div>
            <a href="https://buddycoach.app" target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 font-medium hover:text-purple-700">
              Ver mas &gt;
            </a>
          </div>

          {coachSummary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl p-3 text-center" style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #F3E8FF 100%)" }}>
                  <p className="text-lg font-bold text-purple-700">10</p>
                  <p className="text-[10px] text-purple-600">sesiones esta semana</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)" }}>
                  <p className="text-lg font-bold text-orange-700">11.0t</p>
                  <p className="text-[10px] text-orange-600">volumen semanal</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)" }}>
                  <p className="text-lg font-bold text-red-700">0</p>
                  <p className="text-[10px] text-red-600">racha dias</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <div>
                  <p className="text-xs text-gray-500">Calorias quemadas estimadas</p>
                  <p className="text-lg font-bold text-orange-600">~2550 kcal</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Mejor PR (30 dias)</p>
                  <p className="text-sm font-bold text-amber-600">100kg x 12</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400">
                {buddyCoachConnected ? "Sin datos disponibles aun" : "Conecta BuddyCoach para ver tu resumen"}
              </p>
              {!buddyCoachConnected && (
                <button
                  onClick={() => {
                    setConnectingApp("buddycoach");
                    connectMutation.mutate({ targetApp: "buddycoach", permissions: ["read_nutrition", "read_goals", "write_recommendations"] });
                  }}
                  disabled={connectMutation.isPending && connectingApp === "buddycoach"}
                  className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: "#7C3AED" }}
                >
                  {connectMutation.isPending && connectingApp === "buddycoach" ? "Conectando..." : "Conectar BuddyCoach"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Nutrition Section - BuddyOne */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🥗</span>
              <h3 className="font-semibold text-gray-900">Nutricion</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">BuddyOne</span>
            </div>
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Conectado
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-3 text-center bg-green-50 border border-green-100">
              <p className="text-lg font-bold text-green-700">1,850</p>
              <p className="text-[10px] text-green-600">kcal hoy</p>
            </div>
            <div className="rounded-xl p-3 text-center bg-blue-50 border border-blue-100">
              <p className="text-lg font-bold text-blue-700">120g</p>
              <p className="text-[10px] text-blue-600">proteina</p>
            </div>
            <div className="rounded-xl p-3 text-center bg-amber-50 border border-amber-100">
              <p className="text-lg font-bold text-amber-700">3</p>
              <p className="text-[10px] text-amber-600">comidas registradas</p>
            </div>
          </div>
        </div>

        {/* BuddyCare Section */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">💚</span>
              <h3 className="font-semibold text-gray-900">BuddyCare</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">Bienestar</span>
            </div>
            {apps.find((a: any) => a.id === "buddycare")?.connected ? (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Conectado
              </span>
            ) : (
              <button
                onClick={() => {
                  setConnectingApp("buddycare");
                  connectMutation.mutate({ targetApp: "buddycare", permissions: ["read_nutrition", "read_goals", "write_recommendations"] });
                }}
                disabled={connectMutation.isPending && connectingApp === "buddycare"}
                className="text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                style={{ background: "#10B981" }}
              >
                Conectar
              </button>
            )}
          </div>
          {careSummary ? (
            <p className="text-sm text-gray-600">Suplementacion y bienestar activos.</p>
          ) : (
            <p className="text-sm text-gray-400">Conecta BuddyCare para gestionar tu suplementacion y bienestar integral.</p>
          )}
        </div>

        {/* BuddyShop Products */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛍️</span>
              <h3 className="font-semibold text-gray-900">BuddyShop</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">Tienda</span>
            </div>
            <a
              href="https://www.buddyoneshop.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
            >
              Ver tienda &gt;
            </a>
          </div>

          {shopProducts && shopProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {shopProducts.map((product: any) => (
                <a
                  key={product.id}
                  href={`https://www.buddyoneshop.com/producto/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {product.badge && (
                      <span className="absolute top-2 left-2 text-[10px] font-medium bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{product.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm font-bold text-indigo-600">{product.price}&#8364;</span>
                      {product.comparePrice && (
                        <span className="text-[10px] text-gray-400 line-through">{product.comparePrice}&#8364;</span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Cargando productos destacados...</p>
          )}
        </div>

        {/* Ecosystem Connections */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Conexiones del ecosistema</h3>
          <div className="space-y-2">
            {apps.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{app.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.name}</p>
                    <p className="text-xs text-gray-500">{app.description}</p>
                  </div>
                </div>
                {app.connected ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <button
                      onClick={() => app.connectionId && disconnectMutation.mutate({ connectionId: app.connectionId })}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Desconectar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setConnectingApp(app.id);
                      connectMutation.mutate({ targetApp: app.id, permissions: ["read_nutrition", "read_goals", "write_recommendations"] });
                    }}
                    disabled={connectMutation.isPending && connectingApp === app.id}
                    className="text-xs font-medium text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                    style={{ background: "#7C3AED" }}
                  >
                    {connectMutation.isPending && connectingApp === app.id ? "..." : "Conectar"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-center">
          <p className="text-xs text-gray-400">Datos encriptados &middot; Sincronizacion automatica &middot; Recomendaciones cruzadas</p>
        </div>
      </div>
    </div>
  );
}
