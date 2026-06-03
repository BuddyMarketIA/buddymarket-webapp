import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Check,
  Heart,
  Loader2,
  Pill,
  Plus,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Trash2,
  X,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";

type TimeOfDay = "morning" | "afternoon" | "night";

const TIME_CONFIG: Record<TimeOfDay, { label: string; icon: React.ReactNode; color: string }> = {
  morning: { label: "Mañana", icon: <Sun className="w-4 h-4" />, color: "text-amber-500" },
  afternoon: { label: "Mediodía", icon: <Sunset className="w-4 h-4" />, color: "text-blue-500" },
  night: { label: "Noche", icon: <Moon className="w-4 h-4" />, color: "text-violet-500" },
};

const CARE_CATEGORIES = [
  { id: "all", label: "Todo", emoji: "💊" },
  { id: "vitamina", label: "Vitaminas", emoji: "🌟" },
  { id: "mineral", label: "Minerales", emoji: "⚗️" },
  { id: "proteina", label: "Proteínas", emoji: "💪" },
  { id: "probiotico", label: "Probióticos", emoji: "🦠" },
  { id: "omega3", label: "Omega-3", emoji: "🐟" },
  { id: "colageno", label: "Colágeno", emoji: "✨" },
  { id: "infusion", label: "Infusiones", emoji: "🍵" },
  { id: "adaptogeno", label: "Adaptógenos", emoji: "🌿" },
  { id: "antiinflamatorio", label: "Antiinflamatorios", emoji: "🔥" },
];

type CareView = "tracker" | "shop";

export default function BuddyCare() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<CareView>("tracker");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newTime, setNewTime] = useState<TimeOfDay>("morning");

  const utils = trpc.useUtils();

  // Supplement tracker queries
  const supplementsQ = trpc.ecosystemEnhanced.getSupplements.useQuery(undefined, { enabled: !!user });
  const logsQ = trpc.ecosystemEnhanced.getTodaySupplementLogs.useQuery(undefined, { enabled: !!user });

  // BuddyCare product catalog
  const { data: careProducts, isLoading: loadingProducts } = trpc.contextualRecommendations.getCareCatalog.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    limit: 50,
  });

  const supplements = supplementsQ.data ?? [];
  const todayLogs = logsQ.data ?? [];

  const addMut = trpc.ecosystemEnhanced.addSupplement.useMutation({
    onSuccess: () => {
      utils.ecosystemEnhanced.getSupplements.invalidate();
      setShowAddForm(false);
      setNewName("");
      setNewDosage("");
      toast.success("Suplemento añadido a tu lista diaria");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = trpc.ecosystemEnhanced.deleteSupplement.useMutation({
    onSuccess: () => {
      utils.ecosystemEnhanced.getSupplements.invalidate();
      utils.ecosystemEnhanced.getTodaySupplementLogs.invalidate();
      toast.success("Suplemento eliminado");
    },
  });

  const logMut = trpc.ecosystemEnhanced.logSupplement.useMutation({
    onSuccess: () => {
      utils.ecosystemEnhanced.getTodaySupplementLogs.invalidate();
    },
  });

  const isTaken = (supplementId: number) => todayLogs.some((l) => l.supplementId === supplementId);
  const takenCount = supplements.filter((s) => isTaken(s.id)).length;
  const totalCount = supplements.length;
  const pct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  const groupedByTime = {
    morning: supplements.filter((s) => s.timeOfDay === "morning"),
    afternoon: supplements.filter((s) => s.timeOfDay === "afternoon"),
    night: supplements.filter((s) => s.timeOfDay === "night"),
  };

  const filteredProducts = (careProducts || []).filter(p =>
    search === "" ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd() {
    if (!newName.trim()) return;
    addMut.mutate({ name: newName.trim(), dosage: newDosage.trim() || undefined, timeOfDay: newTime });
  }

  function handleToggle(supplementId: number) {
    if (isTaken(supplementId)) return;
    logMut.mutate({ supplementId });
  }

  return (
    <div className="vively-page pb-32">
      {/* Header */}
      <div className="rounded-3xl p-6 mb-5 relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-teal-400/5 to-background border border-emerald-500/20">
        <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full bg-emerald-500/10" />
        <div className="flex items-center gap-3 mb-3 relative">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-emerald-500/15">
            💊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground tracking-tight">BuddyCare</h1>
              <Badge className="bg-emerald-500 text-white text-xs">Parafarmacia</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Suplementación y bienestar certificado</p>
          </div>
        </div>
        {/* Medical disclaimer */}
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-3 py-2.5 relative">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-700 text-amber-600">Aviso médico:</span> Los productos y suplementos son informativos. Consulta siempre con tu médico antes de tomar cualquier suplemento o producto de parafarmacia.
          </p>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-2 mb-5 bg-muted/50 rounded-2xl p-1">
        <button
          onClick={() => setActiveView("tracker")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-700 transition-all ${
            activeView === "tracker" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Pill className="w-4 h-4" />
          Mis suplementos
        </button>
        <button
          onClick={() => setActiveView("shop")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-700 transition-all ${
            activeView === "shop" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Tienda
        </button>
      </div>

      {/* ── TRACKER VIEW ── */}
      {activeView === "tracker" && (
        <div className="space-y-4">
          {/* Daily progress */}
          {totalCount > 0 && (
            <div className="bg-card rounded-3xl p-5 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-600 mb-1">Progreso de hoy</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tabular-nums text-foreground">{takenCount}</span>
                    <span className="text-lg text-muted-foreground">/ {totalCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">suplementos tomados</p>
                </div>
                <div className="w-16 h-16 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="#10B981" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${pct * 2.64} 264`}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-foreground">{pct}%</span>
                  </div>
                </div>
              </div>
              {pct === 100 && (
                <div className="flex items-center gap-2 bg-emerald-500/10 rounded-xl px-3 py-2 border border-emerald-500/20">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-emerald-600 font-600">¡Todos los suplementos del día tomados!</p>
                </div>
              )}
            </div>
          )}

          {/* Supplement list by time */}
          {(["morning", "afternoon", "night"] as TimeOfDay[]).map((time) => {
            const items = groupedByTime[time];
            const cfg = TIME_CONFIG[time];
            if (items.length === 0) return null;
            return (
              <div key={time}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className={cfg.color}>{cfg.icon}</span>
                  <h3 className="text-sm font-700 text-foreground">{cfg.label}</h3>
                  <Badge variant="outline" className="text-[9px] ml-auto">
                    {items.filter((s) => isTaken(s.id)).length}/{items.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {items.map((s) => {
                    const taken = isTaken(s.id);
                    return (
                      <div key={s.id} className={`bg-card rounded-2xl p-3 flex items-center gap-3 border transition-all ${taken ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50"}`}>
                        <button
                          onClick={() => handleToggle(s.id)}
                          disabled={taken || logMut.isPending}
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            taken ? "bg-emerald-500 text-white" : "border-2 border-border hover:border-emerald-500 text-muted-foreground hover:text-emerald-500"
                          }`}
                        >
                          {taken ? <Check className="w-4 h-4" /> : <Pill className="w-3.5 h-3.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-600 ${taken ? "text-emerald-600 line-through" : "text-foreground"}`}>{s.name}</p>
                          {s.dosage && <p className="text-xs text-muted-foreground">{s.dosage}</p>}
                        </div>
                        <button
                          onClick={() => { if (confirm(`¿Eliminar ${s.name}?`)) deleteMut.mutate({ supplementId: s.id }); }}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {supplements.length === 0 && !supplementsQ.isLoading && (
            <div className="bg-card rounded-3xl p-8 text-center border border-border/50">
              <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-700 text-foreground mb-1">No tienes suplementos configurados</p>
              <p className="text-xs text-muted-foreground mb-4">Añade tus suplementos diarios para hacer seguimiento</p>
              <Button onClick={() => setShowAddForm(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="w-4 h-4 mr-2" /> Añadir suplemento
              </Button>
            </div>
          )}

          {/* Add form */}
          {showAddForm && (
            <div className="bg-card rounded-3xl p-5 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-700 text-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-500" /> Nuevo suplemento
                </h3>
                <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
                  <Input placeholder="Ej: Vitamina D3, Omega 3..." value={newName} onChange={(e) => setNewName(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Dosis (opcional)</label>
                  <Input placeholder="Ej: 2000 UI, 1g, 2 cápsulas..." value={newDosage} onChange={(e) => setNewDosage(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Momento del día</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["morning", "afternoon", "night"] as TimeOfDay[]).map((t) => {
                      const cfg = TIME_CONFIG[t];
                      return (
                        <button key={t} onClick={() => setNewTime(t)}
                          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-600 transition-all border ${
                            newTime === t ? "bg-emerald-500 text-white border-emerald-500" : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          <span className={newTime === t ? "text-white" : cfg.color}>{cfg.icon}</span>
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button onClick={handleAdd} disabled={!newName.trim() || addMut.isPending} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                  {addMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Añadir suplemento
                </Button>
              </div>
            </div>
          )}

          {supplements.length > 0 && !showAddForm && (
            <Button onClick={() => setShowAddForm(true)} variant="outline" className="w-full rounded-2xl">
              <Plus className="w-4 h-4 mr-2" /> Añadir suplemento
            </Button>
          )}

          {/* Coming soon */}
          <div className="grid grid-cols-1 gap-3 mt-2">
            {[
              { emoji: "🧘", title: "Bienestar mental", desc: "Meditación, respiración y gestión del estrés integradas con tus datos de HRV y sueño." },
              { emoji: "📋", title: "Seguimiento de hábitos", desc: "Registra tus hábitos diarios, establece recordatorios y visualiza tu progreso." },
            ].map((item, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 flex items-start gap-3 border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <span className="text-lg">{item.emoji}</span>
                </div>
                <div>
                  <p className="text-sm font-700 text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  <Badge variant="outline" className="mt-2 text-[9px]">Próximamente</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SHOP VIEW ── */}
      {activeView === "shop" && (
        <div>
          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Buscar suplementos o infusiones..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="rounded-2xl bg-card border-border"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            {CARE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-700 whitespace-nowrap transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-card text-muted-foreground border border-border hover:border-emerald-500/50"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Products */}
          {loadingProducts ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="font-600">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(product => (
                <CareProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Disclaimer at bottom of shop */}
          <div className="mt-6 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Todos los productos de BuddyCare son de parafarmacia certificada. Consulta siempre con tu médico o farmacéutico antes de iniciar cualquier suplementación.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CareProductCard({ product }: { product: { id: number; name: string; description?: string | null; price?: number | null; imageUrl?: string | null; affiliateUrl?: string | null; healthBenefits?: string | null } }) {
  const handleBuy = () => {
    if (product.affiliateUrl) window.open(product.affiliateUrl, "_blank", "noopener,noreferrer");
  };

  let benefits: string[] = [];
  try { benefits = JSON.parse(product.healthBenefits || "[]"); } catch {}

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border/50 flex flex-col">
      <div className="relative h-28 bg-muted overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">💊</div>
        )}
        {product.price && (
          <div className="absolute bottom-2 right-2 bg-emerald-500 text-white text-xs font-900 px-2 py-1 rounded-xl shadow-sm">
            {product.price.toFixed(2)}€
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs font-800 text-foreground leading-tight mb-1 line-clamp-2">{product.name}</p>
        {benefits.length > 0 && (
          <div className="flex flex-col gap-0.5 mb-2 flex-1">
            {benefits.slice(0, 2).map((b, i) => (
              <div key={i} className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-tight">{b}</p>
              </div>
            ))}
          </div>
        )}
        <Button onClick={handleBuy} size="sm" className="w-full rounded-xl text-xs font-700 bg-emerald-500 hover:bg-emerald-600 text-white mt-auto">
          Ver producto →
        </Button>
      </div>
    </div>
  );
}
