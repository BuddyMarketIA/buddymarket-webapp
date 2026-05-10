import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function ScaleInput({ label, value, onChange, emoji }: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  emoji?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        {emoji && <span className="text-xl">{emoji}</span>}
        <span className="text-sm font-semibold text-foreground/80">{label}</span>
        {value !== undefined && (
          <span className="ml-auto text-sm font-bold text-orange-600">{value}/10</span>
        )}
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-8 rounded-md text-xs font-bold transition-all ${
              value === n
                ? "bg-orange-500 text-white shadow-md scale-110"
                : n <= (value ?? 0)
                ? "bg-orange-100 text-orange-700"
                : "bg-muted/50 text-muted-foreground/70 hover:bg-orange-50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WeeklyCheckin() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Calcular el lunes de la semana actual
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const weekStart = monday.toISOString().split("T")[0];

  const { data: pending, isLoading } = trpc.weeklyCheckins.getMyPendingCheckins.useQuery(
    undefined,
    { enabled: !!user }
  );

  const [selectedRelId, setSelectedRelId] = useState<number | null>(null);
  const [weight, setWeight] = useState<string>("");
  const [energyLevel, setEnergyLevel] = useState<number | undefined>();
  const [adherenceScore, setAdherenceScore] = useState<number | undefined>();
  const [hunger, setHunger] = useState<number | undefined>();
  const [mood, setMood] = useState<number | undefined>();
  const [sleepQuality, setSleepQuality] = useState<number | undefined>();
  const [difficulties, setDifficulties] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (pending && pending.length > 0 && !selectedRelId) {
      setSelectedRelId(pending[0].expertPatientId);
    }
  }, [pending, selectedRelId]);

  const submitMutation = trpc.weeklyCheckins.submitCheckin.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("¡Check-in semanal enviado correctamente!");
    },
    onError: () => toast.error("Error al enviar el check-in"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRelId) return;
    submitMutation.mutate({
      expertPatientId: selectedRelId,
      weekStart,
      weight: weight ? parseFloat(weight) : undefined,
      energyRating: energyLevel,
      adherenceRating: adherenceScore,
      hungerRating: hunger,
      difficultyNotes: difficulties || undefined,
      generalNotes: notes || undefined,
    });
  };

  if (!user) return null;

  if (submitted) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">¡Check-in enviado!</h1>
          <p className="text-muted-foreground mb-6">Tu nutricionista recibirá tu valoración semanal. ¡Sigue así!</p>
          <Button onClick={() => navigate("/app")} className="bg-orange-500 hover:bg-orange-600 text-white">
            Volver al inicio
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </AppLayout>
    );
  }

  if (!pending || pending.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Todo al día</h1>
          <p className="text-muted-foreground mb-6">Ya has completado el check-in de esta semana. ¡Buen trabajo!</p>
          <Button onClick={() => navigate("/app")} variant="outline">
            Volver al inicio
          </Button>
        </div>
      </AppLayout>
    );
  }

  const currentPending = pending.find(p => p.expertPatientId === selectedRelId) ?? pending[0];

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            {currentPending.expertImageUrl ? (
              <img src={currentPending.expertImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                {(currentPending.expertName ?? "N").charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">Check-in semanal</h1>
              <p className="text-sm text-muted-foreground">Para {currentPending.expertName}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Semana del {new Date(weekStart + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Selector de experto si hay varios */}
        {pending.length > 1 && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {pending.map(p => (
              <button
                key={p.expertPatientId}
                onClick={() => setSelectedRelId(p.expertPatientId)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedRelId === p.expertPatientId
                    ? "bg-orange-500 text-white"
                    : "bg-muted/50 text-muted-foreground hover:bg-orange-50"
                }`}
              >
                {p.expertName}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-1">
          {/* Peso */}
          <div className="mb-5">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/80 mb-2">
              <span className="text-xl">⚖️</span> Peso actual (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="Ej: 72.5"
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-orange-400 text-foreground text-lg font-semibold"
            />
          </div>

          {/* Escalas */}
          <ScaleInput label="Nivel de energía esta semana" value={energyLevel} onChange={setEnergyLevel} emoji="⚡" />
          <ScaleInput label="Adherencia al plan (¿cuánto has seguido el menú?)" value={adherenceScore} onChange={setAdherenceScore} emoji="📋" />
          <ScaleInput label="Nivel de hambre (1 = mucha hambre, 10 = saciado)" value={hunger} onChange={setHunger} emoji="🍽️" />
          <ScaleInput label="Estado de ánimo general" value={mood} onChange={setMood} emoji="😊" />
          <ScaleInput label="Calidad del sueño" value={sleepQuality} onChange={setSleepQuality} emoji="😴" />

          {/* Dificultades */}
          <div className="mb-5">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/80 mb-2">
              <span className="text-xl">🤔</span> ¿Has tenido alguna dificultad?
            </label>
            <textarea
              value={difficulties}
              onChange={e => setDifficulties(e.target.value)}
              placeholder="Ej: Me costó resistir los dulces el fin de semana..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-orange-400 text-foreground/80 resize-none"
            />
          </div>

          {/* Notas adicionales */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/80 mb-2">
              <span className="text-xl">💬</span> Notas adicionales para tu nutricionista
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Cualquier cosa que quieras compartir con tu nutricionista..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-orange-400 text-foreground/80 resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-base font-semibold rounded-xl"
          >
            {submitMutation.isPending ? "Enviando..." : "Enviar check-in semanal ✓"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
