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

  // BuddyCoach summary
  const { data: coachSummary } = trpc.ecosystemSync.getBuddyCoachSummary.useQuery();
  // BuddyCare summary
  const { data: careSummary } = trpc.ecosystemSync.getBuddyCareSummary.useQuery();
  // BuddyShop products
  const { data: shopProducts } = trpc.ecosystemSync.getBuddyShopProducts.useQuery({ limit: 4 });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const apps = status || [];

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ecosistema BuddyOne</h1>
        <p className="text-gray-600 mt-1">
          Conecta tus apps del ecosistema para una experiencia de bienestar integrada
        </p>
      </div>

      {/* Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {apps.map((app) => (
          <div
            key={app.id}
            className={`rounded-2xl border-2 p-6 transition-all ${
              app.connected
                ? "border-green-200 bg-green-50/50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{app.icon}</span>
              {app.connected && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Conectado
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">{app.description}</p>

            {app.connected ? (
              <div className="space-y-3">
                {app.connectedAt && (
                  <p className="text-xs text-gray-500">
                    Desde: {new Date(app.connectedAt).toLocaleDateString("es-ES")}
                  </p>
                )}
                <div className="flex gap-2">
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    Abrir App
                  </a>
                  <button
                    onClick={() => app.connectionId && disconnectMutation.mutate({ connectionId: app.connectionId })}
                    disabled={disconnectMutation.isPending}
                    className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setConnectingApp(app.id);
                  connectMutation.mutate({
                    targetApp: app.id,
                    permissions: ["read_nutrition", "read_goals", "write_recommendations"],
                  });
                }}
                disabled={connectMutation.isPending && connectingApp === app.id}
                className="w-full text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-4 py-2.5 rounded-lg transition-all disabled:opacity-50"
              >
                {connectMutation.isPending && connectingApp === app.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Conectando...
                  </span>
                ) : (
                  "Conectar"
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Data Summaries */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Datos del Ecosistema</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BuddyCoach Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🏋️</span>
              <div>
                <h3 className="font-semibold text-gray-900">BuddyCoach</h3>
                <p className="text-xs text-gray-500">Resumen de entrenamiento</p>
              </div>
            </div>
            {coachSummary ? (
              <div className="space-y-2">
                {coachSummary.name && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Último entreno:</span> {coachSummary.name}
                  </p>
                )}
                {coachSummary.duration && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Duración:</span> {coachSummary.duration} min
                  </p>
                )}
                {coachSummary.calories && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Calorías quemadas:</span> {coachSummary.calories} kcal
                  </p>
                )}
                {coachSummary.type && (
                  <span className="inline-block text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {coachSummary.type}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                {apps.find((a) => a.id === "buddycoach")?.connected
                  ? "Sin datos disponibles aún"
                  : "Conecta BuddyCoach para ver tu resumen"}
              </p>
            )}
          </div>

          {/* BuddyCare Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💚</span>
              <div>
                <h3 className="font-semibold text-gray-900">BuddyCare</h3>
                <p className="text-xs text-gray-500">Bienestar y suplementación</p>
              </div>
            </div>
            {careSummary ? (
              <div className="space-y-2">
                {typeof careSummary === "object" && (
                  <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-24">
                    {JSON.stringify(careSummary, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                {apps.find((a) => a.id === "buddycare")?.connected
                  ? "Sin datos disponibles aún"
                  : "Conecta BuddyCare para ver tu bienestar"}
              </p>
            )}
          </div>
        </div>

        {/* BuddyShop Products */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛍️</span>
              <div>
                <h3 className="font-semibold text-gray-900">BuddyShop</h3>
                <p className="text-xs text-gray-500">Productos destacados para ti</p>
              </div>
            </div>
            <a
              href="https://buddyshop-niebit4z.manus.space"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Ver tienda →
            </a>
          </div>

          {shopProducts && shopProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shopProducts.map((product: any) => (
                <a
                  key={product.id}
                  href={`https://buddyshop-niebit4z.manus.space/producto/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden"
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
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{product.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm font-bold text-indigo-600">{product.price}€</span>
                      {product.comparePrice && (
                        <span className="text-[10px] text-gray-400 line-through">{product.comparePrice}€</span>
                      )}
                    </div>
                    {product.rating && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <span className="text-[10px] text-amber-500">★</span>
                        <span className="text-[10px] text-gray-500">{product.rating}</span>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Cargando productos destacados...
            </p>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-5">
        <h3 className="font-semibold text-indigo-900 mb-2">¿Qué es el Ecosistema BuddyOne?</h3>
        <p className="text-sm text-indigo-700 leading-relaxed">
          El ecosistema conecta todas las apps de Buddy para ofrecerte una experiencia integral de bienestar.
          Al conectar tus apps, tus datos de nutrición, entrenamiento, salud y compras se sincronizan
          automáticamente para darte recomendaciones más personalizadas y un seguimiento completo de tu progreso.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs bg-white/80 text-indigo-700 px-2 py-1 rounded-full border border-indigo-200">
            🔒 Datos encriptados
          </span>
          <span className="text-xs bg-white/80 text-indigo-700 px-2 py-1 rounded-full border border-indigo-200">
            ⚡ Sincronización automática
          </span>
          <span className="text-xs bg-white/80 text-indigo-700 px-2 py-1 rounded-full border border-indigo-200">
            🎯 Recomendaciones cruzadas
          </span>
        </div>
      </div>
    </div>
  );
}
