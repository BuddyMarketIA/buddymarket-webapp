import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// ─── Types (mirrored from EventMenuPlanner) ──────────────────────────────────
interface Dish {
  name: string;
  description: string;
  prepTime: string;
  difficulty: string;
  ingredients: string[];
  steps: string[];
  tips?: string;
}
interface Course {
  name: string;
  dishes: Dish[];
}
interface ShoppingCategory {
  category: string;
  items: string[];
}
interface PrepTask {
  when: string;
  tasks: string[];
}
interface GeneratedMenu {
  eventTitle: string;
  intro: string;
  courses: Course[];
  shoppingList: ShoppingCategory[];
  hostingTips: string[];
  estimatedBudget: string;
  prepSchedule: PrepTask[];
}

// ─── Category label map ───────────────────────────────────────────────────────
const EVENT_LABELS: Record<string, string> = {
  cena_amigos: "Cena con amigos",
  barbacoa: "Barbacoa",
  brunch: "Brunch",
  aperitivo: "Aperitivo",
  cumpleanos: "Cumpleaños",
  navidad: "Navidad",
  fin_de_ano: "Fin de Año",
  reyes: "Reyes",
  semana_santa: "Semana Santa",
  cena_empresa: "Cena de empresa",
  cena_romantica: "Cena romántica",
  otro: "Evento personalizado",
};

const EVENT_EMOJIS: Record<string, string> = {
  cena_amigos: "🍽️",
  barbacoa: "🔥",
  brunch: "🥞",
  aperitivo: "🫒",
  cumpleanos: "🎂",
  navidad: "🎄",
  fin_de_ano: "🥂",
  reyes: "👑",
  semana_santa: "🐟",
  cena_empresa: "🤝",
  cena_romantica: "🕯️",
  otro: "🎉",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SavedEvents() {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "shopping" | "prep" | "tips">("menu");

  const { data: savedList, isLoading, refetch } = trpc.savedEvents.list.useQuery(undefined, {
    enabled: !!user,
  });

  const deleteMutation = trpc.savedEvents.delete.useMutation({
    onSuccess: () => {
      toast.success("Evento eliminado");
      setSelectedId(null);
      refetch();
    },
    onError: () => toast.error("Error al eliminar el evento"),
  });

  if (!user) {
    return (
      <AppLayout title="Mis Eventos Guardados">
        <div className="vively-page flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <span className="text-6xl">🎉</span>
          <h2 className="text-2xl font-bold">Inicia sesión para ver tus eventos guardados</h2>
          <a href={getLoginUrl()} className="vively-btn-primary px-6 py-3 rounded-2xl">Iniciar sesión</a>
        </div>
      </AppLayout>
    );
  }

  const selectedEvent = savedList?.find(e => e.id === selectedId);
  let parsedMenu: GeneratedMenu | null = null;
  if (selectedEvent) {
    try { parsedMenu = JSON.parse(selectedEvent.menuData) as GeneratedMenu; } catch { /* ignore */ }
  }

  return (
    <AppLayout title="Mis Eventos Guardados">
      <div className="vively-page max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">⭐ Mis Eventos Guardados</h1>
          <p className="text-gray-500 text-sm mt-1">Accede rápidamente a los menús que has generado</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !savedList || savedList.length === 0 ? (
          <div className="vively-card text-center py-16">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Aún no tienes eventos guardados</h3>
            <p className="text-gray-500 mb-6">Genera un menú en el asistente de eventos y guárdalo para acceder rápidamente</p>
            <a href="/app/event-menu" className="vively-btn-primary px-6 py-3 rounded-2xl inline-block">
              Ir al Asistente de Eventos →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: event list */}
            <div className="lg:col-span-1 space-y-3">
              {savedList.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => { setSelectedId(ev.id); setActiveTab("menu"); }}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedId === ev.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-100 bg-white hover:border-orange-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{EVENT_EMOJIS[ev.eventType] ?? "🎉"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 truncate">{ev.eventName}</div>
                      <div className="text-xs text-gray-400">{EVENT_LABELS[ev.eventType] ?? ev.eventType}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        👥 {ev.persons} personas · {new Date(ev.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Right: event detail */}
            <div className="lg:col-span-2">
              {!selectedId ? (
                <div className="vively-card flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-4xl mb-3">👈</div>
                  <p className="text-gray-500">Selecciona un evento para ver el menú</p>
                </div>
              ) : parsedMenu ? (
                <div className="space-y-4">
                  {/* Event header */}
                  <div className="vively-card">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{parsedMenu.eventTitle || selectedEvent?.eventName}</h2>
                        <p className="text-gray-500 text-sm mt-1">{parsedMenu.intro}</p>
                        {parsedMenu.estimatedBudget && (
                          <div className="mt-2 inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">
                            💰 {parsedMenu.estimatedBudget}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate({ id: selectedId })}
                        disabled={deleteMutation.isPending}
                        className="text-red-400 hover:text-red-600 transition-colors text-sm px-3 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 whitespace-nowrap"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                      { id: "menu", label: "🍽️ Menú" },
                      { id: "shopping", label: "🛒 Compra" },
                      { id: "prep", label: "📅 Planificación" },
                      { id: "tips", label: "💡 Consejos" },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                          activeTab === tab.id
                            ? "bg-orange-500 text-white shadow-sm"
                            : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  {activeTab === "menu" && (
                    <div className="space-y-4">
                      {parsedMenu.courses?.map((course, ci) => (
                        <div key={ci} className="vively-card">
                          <h3 className="font-bold text-gray-800 mb-3">{course.name}</h3>
                          <div className="space-y-4">
                            {course.dishes?.map((dish, di) => (
                              <div key={di} className="border border-gray-100 rounded-xl p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-800">{dish.name}</h4>
                                  <div className="flex gap-2 shrink-0">
                                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">⏱ {dish.prepTime}</span>
                                    <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">👨‍🍳 {dish.difficulty}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{dish.description}</p>
                                {dish.ingredients?.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Ingredientes</p>
                                    <div className="flex flex-wrap gap-1">
                                      {dish.ingredients.map((ing, ii) => (
                                        <span key={ii} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ing}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {dish.steps?.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Elaboración</p>
                                    <ol className="space-y-1">
                                      {dish.steps.map((step, si) => (
                                        <li key={si} className="text-sm text-gray-600 flex gap-2">
                                          <span className="text-orange-500 font-bold shrink-0">{si + 1}.</span>
                                          <span>{step}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                                {dish.tips && (
                                  <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-lg p-2 text-xs text-yellow-800">
                                    💡 {dish.tips}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "shopping" && (
                    <div className="vively-card space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-800">Lista de la compra</h3>
                        <button
                          onClick={() => {
                            const text = parsedMenu!.shoppingList
                              ?.map(cat => `${cat.category}:\n${cat.items.map(i => `  - ${i}`).join("\n")}`)
                              .join("\n\n") ?? "";
                            navigator.clipboard.writeText(text);
                            toast.success("Lista copiada al portapapeles");
                          }}
                          className="text-sm text-orange-500 hover:text-orange-700 font-medium"
                        >
                          📋 Copiar lista
                        </button>
                      </div>
                      {parsedMenu.shoppingList?.map((cat, ci) => (
                        cat.items?.length > 0 && (
                          <div key={ci}>
                            <h4 className="text-sm font-semibold text-gray-600 mb-2">{cat.category}</h4>
                            <ul className="space-y-1">
                              {cat.items.map((item, ii) => (
                                <li key={ii} className="flex items-center gap-2 text-sm text-gray-700">
                                  <span className="w-4 h-4 rounded border border-gray-300 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      ))}
                    </div>
                  )}

                  {activeTab === "prep" && (
                    <div className="space-y-3">
                      {parsedMenu.prepSchedule?.map((phase, pi) => (
                        <div key={pi} className="vively-card">
                          <h3 className="font-bold text-gray-800 mb-3">📅 {phase.when}</h3>
                          <ul className="space-y-2">
                            {phase.tasks?.map((task, ti) => (
                              <li key={ti} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-orange-500 mt-0.5">✓</span>
                                {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "tips" && (
                    <div className="vively-card">
                      <h3 className="font-bold text-gray-800 mb-4">💡 Consejos de anfitrión</h3>
                      <ul className="space-y-3">
                        {parsedMenu.hostingTips?.map((tip, ti) => (
                          <li key={ti} className="flex items-start gap-3 text-sm text-gray-700">
                            <span className="text-orange-500 font-bold shrink-0">{ti + 1}.</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="vively-card text-center py-10">
                  <p className="text-gray-500">No se pudo cargar el menú de este evento</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
