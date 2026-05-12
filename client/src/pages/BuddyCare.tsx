import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";

export default function BuddyCare() {
  const { data: careSummary } = trpc.ecosystemSync.getBuddyCareSummary.useQuery();

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F0" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">BuddyCare</h1>
            <p className="text-sm text-gray-500">Bienestar y suplementacion personalizada</p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "#D1FAE5" }}>
            💚
          </div>
        </div>

        {/* Hero Card */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #059669 0%, #10B981 100%)" }}>
          <h2 className="text-xl font-bold text-white mb-2">Tu bienestar integral</h2>
          <p className="text-sm text-emerald-100 leading-relaxed">
            BuddyCare te ayuda a gestionar tu suplementacion, bienestar mental y habitos saludables de forma personalizada.
          </p>
          <div className="flex gap-2 mt-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-medium text-white bg-white/20">Suplementos</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium text-white bg-white/20">Bienestar</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium text-white bg-white/20">Habitos</span>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">💊</div>
              <div>
                <h3 className="font-semibold text-gray-900">Suplementacion inteligente</h3>
                <p className="text-xs text-gray-500">Recomendaciones basadas en tus datos</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Analiza tus metricas de salud, nutricion y actividad para recomendarte los suplementos mas adecuados para tus objetivos.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">🧘</div>
              <div>
                <h3 className="font-semibold text-gray-900">Bienestar mental</h3>
                <p className="text-xs text-gray-500">Mindfulness y gestion del estres</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Herramientas de meditacion, respiracion y seguimiento del estres integradas con tus datos de HRV y sueno.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl">📋</div>
              <div>
                <h3 className="font-semibold text-gray-900">Seguimiento de habitos</h3>
                <p className="text-xs text-gray-500">Crea y mantiene habitos saludables</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Registra tus habitos diarios, establece recordatorios y visualiza tu progreso con estadisticas detalladas.
            </p>
          </div>
        </div>

        {/* Status */}
        {careSummary ? (
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
            <h3 className="font-semibold text-emerald-900 mb-2">Estado de BuddyCare</h3>
            <p className="text-sm text-emerald-700">Conectado y sincronizando datos de bienestar.</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 text-center">
            <p className="text-sm text-gray-500 mb-3">BuddyCare esta en desarrollo. Proximamente podras gestionar tu bienestar integral desde aqui.</p>
            <button
              onClick={() => toast.info("BuddyCare proximamente disponible")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#10B981" }}
            >
              Notificarme cuando este disponible
            </button>
          </div>
        )}

        <div className="pt-4 text-center">
          <p className="text-xs text-gray-400">Los datos mostrados son informativos y no constituyen consejo medico profesional.</p>
        </div>
      </div>
    </div>
  );
}
