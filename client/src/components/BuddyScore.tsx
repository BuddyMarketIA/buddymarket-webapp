import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Brain, ChevronRight, Info, Sparkles, TrendingUp, Zap } from "lucide-react";

const LEVEL_COLORS = [
  "from-gray-400 to-gray-500",
  "from-green-400 to-emerald-500",
  "from-blue-400 to-cyan-500",
  "from-orange-400 to-amber-500",
  "from-purple-500 to-violet-600",
];

const LEVEL_BG = [
  "bg-muted/30 border-border",
  "bg-green-50 border-green-200",
  "bg-blue-50 border-blue-200",
  "bg-orange-50 border-orange-200",
  "bg-purple-50 border-purple-200",
];

const CUISINE_LABELS: Record<string, string> = {
  mediterranea: "Mediterránea", asiatica: "Asiática", italiana: "Italiana",
  mexicana: "Mexicana", española: "Española", americana: "Americana",
  francesa: "Francesa", japonesa: "Japonesa", india: "India",
  griega: "Griega", latina: "Latina", árabe: "Árabe",
};

const METHOD_LABELS: Record<string, string> = {
  horno: "Horno", plancha: "Plancha", airfryer: "Air Fryer",
  olla: "Olla", vaporizador: "Al vapor", wok: "Wok",
  microondas: "Microondas", sin_coccion: "Sin cocción", frito: "Frito",
};

interface BuddyScoreProps {
  compact?: boolean;
}

export function BuddyScore({ compact = false }: BuddyScoreProps) {
  const [showDetail, setShowDetail] = useState(false);
  const { data, isLoading } = trpc.learning.getProfile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  if (isLoading) {
    return (
      <div className="h-20 rounded-xl bg-muted/50 animate-pulse" />
    );
  }

  if (!data) return null;

  const { buddyScore, totalInteractions, topCuisines, topCookingMethods } = data;
  const levelIdx = buddyScore.level - 1;
  const gradientClass = LEVEL_COLORS[levelIdx] ?? LEVEL_COLORS[0];
  const bgClass = LEVEL_BG[levelIdx] ?? LEVEL_BG[0];

  if (compact) {
    return (
      <button
        onClick={() => setShowDetail(true)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border ${bgClass} hover:opacity-90 transition-opacity text-left`}
      >
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-lg flex-shrink-0`}>
          {buddyScore.levelEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">BuddyIA aprende de ti</span>
            <Badge variant="outline" className="text-xs px-1.5 py-0">Nv. {buddyScore.level}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={buddyScore.progress} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{buddyScore.progress}%</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <BuddyScoreDetailDialog
          open={showDetail}
          onOpenChange={setShowDetail}
          data={data}
          buddyScore={buddyScore}
          gradientClass={gradientClass}
          bgClass={bgClass}
          totalInteractions={totalInteractions}
          topCuisines={topCuisines}
          topCookingMethods={topCookingMethods}
        />
      </button>
    );
  }

  return (
    <>
      <Card className={`border ${bgClass} overflow-hidden`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-5 h-5 text-primary" />
            BuddyIA aprende de ti
            <Badge variant="secondary" className="ml-auto text-xs">
              Nivel {buddyScore.level} — {buddyScore.levelName}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nivel visual */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-3xl shadow-sm flex-shrink-0`}>
              {buddyScore.levelEmoji}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">{buddyScore.description}</p>
              <div className="flex items-center gap-2">
                <Progress value={buddyScore.progress} className="h-2 flex-1" />
                <span className="text-xs font-medium text-muted-foreground">{buddyScore.progress}%</span>
              </div>
              {buddyScore.level < 5 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {buddyScore.nextMilestone - totalInteractions} interacciones más para el siguiente nivel
                </p>
              )}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-lg font-bold text-foreground">{totalInteractions}</p>
              <p className="text-xs text-muted-foreground">Señales</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-lg font-bold text-foreground">{topCuisines.length}</p>
              <p className="text-xs text-muted-foreground">Cocinas</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-lg font-bold text-foreground">{topCookingMethods.length}</p>
              <p className="text-xs text-muted-foreground">Métodos</p>
            </div>
          </div>

          {/* Gustos aprendidos */}
          {(topCuisines.length > 0 || topCookingMethods.length > 0) && (
            <div className="space-y-2">
              {topCuisines.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Cocinas favoritas detectadas</p>
                  <div className="flex flex-wrap gap-1">
                    {topCuisines.map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs">
                        {CUISINE_LABELS[c] ?? c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {topCookingMethods.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Métodos de cocción preferidos</p>
                  <div className="flex flex-wrap gap-1">
                    {topCookingMethods.map((m) => (
                      <Badge key={m} variant="outline" className="text-xs">
                        {METHOD_LABELS[m] ?? m}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cómo mejorar */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Cómo mejorar las recomendaciones
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>• Guarda recetas que te gusten en favoritos</li>
              <li>• Registra lo que comes en el diario nutricional</li>
              <li>• Usa el botón "Me gusta" en las recetas</li>
              <li>• Añade recetas a tus menús semanales</li>
            </ul>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowDetail(true)}
          >
            <Info className="w-4 h-4 mr-2" />
            Ver detalle completo
          </Button>
        </CardContent>
      </Card>

      <BuddyScoreDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        data={data}
        buddyScore={buddyScore}
        gradientClass={gradientClass}
        bgClass={bgClass}
        totalInteractions={totalInteractions}
        topCuisines={topCuisines}
        topCookingMethods={topCookingMethods}
      />
    </>
  );
}

function BuddyScoreDetailDialog({
  open, onOpenChange, data, buddyScore, gradientClass, bgClass, totalInteractions, topCuisines, topCookingMethods
}: any) {
  const levels = [
    { emoji: "🌱", name: "Recién llegado", range: "0-9 señales", desc: "BuddyIA está aprendiendo tus primeras preferencias." },
    { emoji: "🌿", name: "Conocido", range: "10-29 señales", desc: "Ya conoce algunos de tus gustos. Las recomendaciones mejoran." },
    { emoji: "🌳", name: "Amigo", range: "30-59 señales", desc: "Tiene un buen perfil tuyo. Las recetas sugeridas son cada vez más tuyas." },
    { emoji: "⭐", name: "Compañero", range: "60-99 señales", desc: "Conoce muy bien tus preferencias. Los menús IA son casi perfectos para ti." },
    { emoji: "🧠", name: "Experto", range: "100+ señales", desc: "Es tu nutricionista personal. Cada recomendación está hecha a tu medida." },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Cómo aprende BuddyIA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Estado actual */}
          <div className={`p-4 rounded-xl border ${bgClass}`}>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{buddyScore.levelEmoji}</span>
              <div>
                <p className="font-semibold text-foreground">Nivel {buddyScore.level}: {buddyScore.levelName}</p>
                <p className="text-sm text-muted-foreground">{totalInteractions} señales recopiladas</p>
              </div>
            </div>
            <Progress value={buddyScore.progress} className="mt-3 h-2" />
            {buddyScore.level < 5 && (
              <p className="text-xs text-muted-foreground mt-1">
                {buddyScore.nextMilestone - totalInteractions} señales más para el nivel {buddyScore.level + 1}
              </p>
            )}
          </div>

          {/* Cómo funciona */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              Qué señales recoge BuddyIA
            </h3>
            <div className="space-y-1.5">
              {[
                { action: "Registrar una comida en el diario", weight: "Señal máxima", color: "text-green-600" },
                { action: "Añadir una receta a un menú", weight: "Señal muy alta", color: "text-green-600" },
                { action: "Guardar en favoritos", weight: "Señal alta", color: "text-green-500" },
                { action: "Dar like a una receta", weight: "Señal alta", color: "text-green-500" },
                { action: "Ver una receta más de 30 segundos", weight: "Señal media", color: "text-blue-500" },
                { action: "Ver una receta brevemente", weight: "Señal baja", color: "text-muted-foreground/70" },
                { action: "Saltar una recomendación", weight: "Señal negativa", color: "text-orange-500" },
                { action: "Dar dislike a una receta", weight: "Señal negativa alta", color: "text-red-500" },
              ].map((item) => (
                <div key={item.action} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.action}</span>
                  <span className={`font-medium ${item.color}`}>{item.weight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Niveles */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              Niveles de aprendizaje
            </h3>
            <div className="space-y-2">
              {levels.map((level, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 p-2 rounded-lg text-xs ${i + 1 === buddyScore.level ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}
                >
                  <span className="text-base flex-shrink-0">{level.emoji}</span>
                  <div>
                    <p className="font-medium text-foreground">{level.name} <span className="text-muted-foreground font-normal">({level.range})</span></p>
                    <p className="text-muted-foreground">{level.desc}</p>
                  </div>
                  {i + 1 === buddyScore.level && (
                    <Badge className="ml-auto text-xs flex-shrink-0">Tú</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gustos detectados */}
          {(topCuisines.length > 0 || topCookingMethods.length > 0) && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Lo que BuddyIA ya sabe de ti</h3>
              {topCuisines.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1">Cocinas favoritas</p>
                  <div className="flex flex-wrap gap-1">
                    {topCuisines.map((c: string) => (
                      <Badge key={c} variant="secondary" className="text-xs">{CUISINE_LABELS[c] ?? c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {topCookingMethods.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Métodos de cocción preferidos</p>
                  <div className="flex flex-wrap gap-1">
                    {topCookingMethods.map((m: string) => (
                      <Badge key={m} variant="outline" className="text-xs">{METHOD_LABELS[m] ?? m}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            BuddyIA nunca comparte tus datos con terceros. Tu perfil de gustos es privado y solo se usa para mejorar tus recomendaciones.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
