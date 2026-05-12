import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

type TimeOfDay = "morning" | "afternoon" | "night";

const TIME_CONFIG: Record<TimeOfDay, { label: string; icon: React.ReactNode; color: string; gradient: string }> = {
  morning: { label: "Mañana", icon: <Sun className="w-4 h-4" />, color: "#F59E0B", gradient: "from-amber-500 to-orange-400" },
  afternoon: { label: "Mediodía", icon: <Sunset className="w-4 h-4" />, color: "#3B82F6", gradient: "from-blue-500 to-cyan-400" },
  night: { label: "Noche", icon: <Moon className="w-4 h-4" />, color: "#8B5CF6", gradient: "from-violet-500 to-indigo-500" },
};

export default function BuddyCare() {
  const { user } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newTime, setNewTime] = useState<TimeOfDay>("morning");

  const utils = trpc.useUtils();

  // ── Queries ──
  const supplementsQ = trpc.ecosystemEnhanced.getSupplements.useQuery(undefined, { enabled: !!user });
  const logsQ = trpc.ecosystemEnhanced.getTodaySupplementLogs.useQuery(undefined, { enabled: !!user });

  const supplements = supplementsQ.data ?? [];
  const todayLogs = logsQ.data ?? [];

  // ── Mutations ──
  const addMut = trpc.ecosystemEnhanced.addSupplement.useMutation({
    onSuccess: () => {
      utils.ecosystemEnhanced.getSupplements.invalidate();
      setShowAddForm(false);
      setNewName("");
      setNewDosage("");
      toast.success("Suplemento añadido: se ha añadido a tu lista diaria.");
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
      utils.ecosystemEnhanced.getEcosystemScore.invalidate();
    },
  });

  // ── Helpers ──
  const isTaken = (supplementId: number) => todayLogs.some((l) => l.supplementId === supplementId);
  const takenCount = supplements.filter((s) => isTaken(s.id)).length;
  const totalCount = supplements.length;
  const pct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  const groupedByTime = {
    morning: supplements.filter((s) => s.timeOfDay === "morning"),
    afternoon: supplements.filter((s) => s.timeOfDay === "afternoon"),
    night: supplements.filter((s) => s.timeOfDay === "night"),
  };

  function handleAdd() {
    if (!newName.trim()) return;
    addMut.mutate({ name: newName.trim(), dosage: newDosage.trim() || undefined, timeOfDay: newTime });
  }

  function handleToggle(supplementId: number) {
    if (isTaken(supplementId)) return; // Already taken today
    logMut.mutate({ supplementId });
  }

  // ── RENDER ──
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">BuddyCare</h1>
            <p className="text-sm text-zinc-400">Suplementación y bienestar</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Heart className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Daily Progress Card */}
        <Card className="border-0 bg-gradient-to-br from-emerald-600/30 via-teal-600/20 to-cyan-700/30 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
          <CardContent className="p-5 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-emerald-300 uppercase tracking-wider font-medium mb-1">Progreso de hoy</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tabular-nums">{takenCount}</span>
                  <span className="text-lg text-zinc-400">/ {totalCount}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">suplementos tomados</p>
              </div>
              <div className="w-16 h-16 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="url(#careGrad)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${pct * 2.64} 264`}
                    className="transition-all duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id="careGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{pct}%</span>
                </div>
              </div>
            </div>
            {pct === 100 && totalCount > 0 && (
              <div className="flex items-center gap-2 bg-emerald-500/20 rounded-lg px-3 py-2">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <p className="text-xs text-emerald-200 font-medium">¡Todos los suplementos del día tomados!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplement List by Time of Day */}
        {(["morning", "afternoon", "night"] as TimeOfDay[]).map((time) => {
          const items = groupedByTime[time];
          const cfg = TIME_CONFIG[time];
          if (items.length === 0) return null;
          return (
            <div key={time} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                  {cfg.icon}
                </div>
                <h3 className="text-sm font-semibold text-zinc-300">{cfg.label}</h3>
                <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500 ml-auto">
                  {items.filter((s) => isTaken(s.id)).length}/{items.length}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {items.map((s) => {
                  const taken = isTaken(s.id);
                  return (
                    <Card key={s.id} className={`border-zinc-800 transition-all ${taken ? "bg-emerald-500/10 border-emerald-500/20" : "bg-zinc-900/80"}`}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <button
                          onClick={() => handleToggle(s.id)}
                          disabled={taken || logMut.isPending}
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            taken
                              ? "bg-emerald-500 text-white"
                              : "border-2 border-zinc-600 hover:border-emerald-400 text-zinc-600 hover:text-emerald-400"
                          }`}
                        >
                          {taken ? <Check className="w-4 h-4" /> : <Pill className="w-3.5 h-3.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${taken ? "text-emerald-300 line-through" : "text-zinc-200"}`}>{s.name}</p>
                          {s.dosage && <p className="text-[10px] text-zinc-500">{s.dosage}</p>}
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar ${s.name}?`)) deleteMut.mutate({ supplementId: s.id });
                          }}
                          className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {supplements.length === 0 && !supplementsQ.isLoading && (
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardContent className="py-12 text-center">
              <Pill className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-sm text-zinc-400 font-medium">No tienes suplementos configurados</p>
              <p className="text-xs text-zinc-600 mt-1 mb-4">Añade tus suplementos diarios para hacer seguimiento</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> Añadir suplemento
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Supplement Form */}
        {showAddForm && (
          <Card className="border-emerald-500/30 bg-zinc-900/90">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" /> Nuevo suplemento
                </CardTitle>
                <button onClick={() => setShowAddForm(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Nombre</label>
                <Input
                  placeholder="Ej: Vitamina D3, Omega 3..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Dosis (opcional)</label>
                <Input
                  placeholder="Ej: 2000 UI, 1g, 2 cápsulas..."
                  value={newDosage}
                  onChange={(e) => setNewDosage(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Momento del día</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["morning", "afternoon", "night"] as TimeOfDay[]).map((t) => {
                    const cfg = TIME_CONFIG[t];
                    return (
                      <button
                        key={t}
                        onClick={() => setNewTime(t)}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                          newTime === t
                            ? `bg-gradient-to-br ${cfg.gradient} text-white`
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button
                onClick={handleAdd}
                disabled={!newName.trim() || addMut.isPending}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                {addMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Añadir suplemento
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add button (when supplements exist) */}
        {supplements.length > 0 && !showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="w-full border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30"
          >
            <Plus className="w-4 h-4 mr-2" /> Añadir suplemento
          </Button>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-3">
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🧘</span>
              </div>
              <div>
                <p className="text-sm font-semibold">Bienestar mental</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Herramientas de meditación, respiración y gestión del estrés integradas con tus datos de HRV y sueño.
                </p>
                <Badge variant="outline" className="mt-2 text-[9px] border-blue-500/30 text-blue-400">Próximamente</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📋</span>
              </div>
              <div>
                <p className="text-sm font-semibold">Seguimiento de hábitos</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Registra tus hábitos diarios, establece recordatorios y visualiza tu progreso con estadísticas detalladas.
                </p>
                <Badge variant="outline" className="mt-2 text-[9px] border-purple-500/30 text-purple-400">Próximamente</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-zinc-600 text-center px-4">
          Los datos mostrados son informativos y no constituyen consejo médico profesional. Consulta con tu médico antes de tomar suplementos.
        </p>
      </div>
    </div>
  );
}
