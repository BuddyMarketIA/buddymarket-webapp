import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ShoppingCart, FileText, ChevronDown, ChevronUp, Loader2, User, Star } from "lucide-react";
import { Link } from "wouter";
import AppLayout from "@/components/AppLayout";

const DAYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles",
  jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
};
const MEAL_LABELS: Record<string, string> = {
  desayuno: "🌅 Desayuno", media_manana: "☕ Media mañana",
  comida: "🍽️ Comida", merienda: "🍎 Merienda", cena: "🌙 Cena",
};
const SHOPPING_LABELS: Record<string, string> = {
  frutas_verduras: "🥦 Frutas y verduras", proteinas: "🥩 Proteínas",
  lacteos: "🧀 Lácteos", cereales_pasta: "🌾 Cereales y pasta",
  legumbres: "🫘 Legumbres", otros: "🛒 Otros",
};

interface PlanCardProps {
  plan: any;
}

function PlanCard({ plan }: PlanCardProps) {
  
  const utils = trpc.useUtils();
  const [expanded, setExpanded] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [allergies, setAllergies] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [dislikedFoods, setDislikedFoods] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [persons, setPersons] = useState("1");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"menu" | "shopping">("menu");

  const generateMenu = trpc.expertPlans.generateAiMenu.useMutation({
    onSuccess: () => {
      utils.expertPlans.myClientPlans.invalidate();
      setShowPrefs(false);
      toast.success("¡Menú generado!: Tu menú semanal y lista de la compra están listos.");
    },
    onError: (e) => toast.error("Error al generar menú: e.message"),
  });

  const menu = plan.aiGeneratedMenu ? JSON.parse(plan.aiGeneratedMenu) : null;
  const shoppingList = plan.aiGeneratedShoppingList ? JSON.parse(plan.aiGeneratedShoppingList) : null;

  return (
    <Card className="border border-border overflow-hidden">
      {/* Card header */}
      <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border-b border-orange-100 dark:border-orange-900/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {plan.expertAvatar ? (
              <img src={plan.expertAvatar} alt={plan.expertName} className="w-12 h-12 rounded-full object-cover border-2 border-orange-200" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
                <User className="h-6 w-6 text-orange-600" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-foreground text-base">{plan.title}</h3>
              <p className="text-sm text-orange-600 font-medium flex items-center gap-1">
                <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                {plan.expertName ?? "BuddyExpert"} · {plan.expertSpecialty ?? "Nutricionista"}
              </p>
              {plan.weekNumber && (
                <p className="text-xs text-muted-foreground mt-0.5">Semana {plan.weekNumber} · {plan.year}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {plan.pdfUrl && (
              <a href={plan.pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs border-orange-200 text-orange-600 hover:bg-orange-50">
                  <FileText className="h-3.5 w-3.5" /> Ver PDF
                </Button>
              </a>
            )}
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {plan.description && <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>}
      </div>

      {/* Generate button */}
      {!menu && (
        <div className="p-5">
          {!showPrefs ? (
            <div className="text-center py-4">
              <Brain className="h-10 w-10 text-orange-300 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4 text-sm">Tu experto ha preparado un plan personalizado. Genera tu menú semanal y lista de la compra con IA.</p>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                onClick={() => setShowPrefs(true)}
              >
                <Brain className="h-4 w-4" /> Generar menú con IA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Personaliza tu menú <span className="text-muted-foreground font-normal text-sm">(todos los campos son opcionales)</span></h4>
                <Button variant="ghost" size="sm" onClick={() => setShowPrefs(false)}>Cancelar</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Alergias o intolerancias</Label>
                  <Input placeholder="Ej: lactosa, gluten..." value={allergies} onChange={e => setAllergies(e.target.value)} className="mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Restricciones dietéticas</Label>
                  <Input placeholder="Ej: vegetariano, sin cerdo..." value={restrictions} onChange={e => setRestrictions(e.target.value)} className="mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Alimentos que no te gustan</Label>
                  <Input placeholder="Ej: berenjenas, hígado..." value={dislikedFoods} onChange={e => setDislikedFoods(e.target.value)} className="mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tiempo disponible para cocinar</Label>
                  <Input placeholder="Ej: menos de 30 min, tengo tiempo..." value={cookingTime} onChange={e => setCookingTime(e.target.value)} className="mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Número de personas</Label>
                  <Input type="number" min="1" max="10" value={persons} onChange={e => setPersons(e.target.value)} className="mt-1 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Notas adicionales</Label>
                <Textarea placeholder="Cualquier otra información relevante para tu nutricionista..." value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 text-sm" rows={2} />
              </div>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2"
                disabled={generateMenu.isPending}
                onClick={() => generateMenu.mutate({
                  planId: plan.id,
                  userPreferences: {
                    allergies: allergies || undefined,
                    restrictions: restrictions || undefined,
                    dislikedFoods: dislikedFoods || undefined,
                    cookingTime: cookingTime || undefined,
                    persons: parseInt(persons) || 1,
                    notes: notes || undefined,
                  },
                })}
              >
                {generateMenu.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generando tu menú personalizado...</>
                ) : (
                  <><Brain className="h-4 w-4" /> Generar menú semanal</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">La generación puede tardar entre 15 y 30 segundos.</p>
            </div>
          )}
        </div>
      )}

      {/* Menu & Shopping list */}
      {menu && expanded && (
        <div className="p-5">
          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setActiveTab("menu")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "menu" ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              🗓️ Menú semanal
            </button>
            <button
              onClick={() => setActiveTab("shopping")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "shopping" ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              <ShoppingCart className="h-4 w-4 inline mr-1" />Lista de la compra
            </button>
          </div>

          {activeTab === "menu" && (
            <div className="space-y-4">
              {DAYS.map((day) => {
                const dayMenu = menu[day];
                if (!dayMenu) return null;
                return (
                  <div key={day} className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-4 border border-orange-100 dark:border-orange-900/50">
                    <h4 className="font-bold text-orange-700 mb-3 text-sm uppercase tracking-wide">{DAY_LABELS[day]}</h4>
                    <div className="space-y-2">
                      {Object.entries(MEAL_LABELS).map(([key, label]) => {
                        const meal = dayMenu[key];
                        if (!meal) return null;
                        return (
                          <div key={key} className="flex gap-2">
                            <span className="text-sm font-semibold text-foreground w-32 shrink-0">{label}</span>
                            <span className="text-sm text-muted-foreground">{meal}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="mt-4 pt-4 border-t border-border flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs text-orange-600 border-orange-200"
                  disabled={generateMenu.isPending}
                  onClick={() => setShowPrefs(true)}
                >
                  <Brain className="h-3.5 w-3.5" /> Regenerar menú
                </Button>
              </div>
            </div>
          )}

          {activeTab === "shopping" && shoppingList && (
            <div className="space-y-4">
              {Object.entries(SHOPPING_LABELS).map(([key, label]) => {
                const items: string[] = shoppingList[key];
                if (!items || items.length === 0) return null;
                return (
                  <div key={key}>
                    <h4 className="font-semibold text-foreground mb-2 text-sm">{label}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-3 py-1.5 text-sm text-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Expand toggle when menu exists */}
      {menu && !expanded && (
        <div className="px-5 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-sm text-orange-600 border-orange-200 hover:bg-orange-50"
            onClick={() => setExpanded(true)}
          >
            <ChevronDown className="h-4 w-4" /> Ver menú semanal y lista de la compra
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function ClientPlanView() {
  const { data: plans = [], isLoading } = trpc.expertPlans.myClientPlans.useQuery();

  return (
    <AppLayout title="Mis Planes Nutricionales" showBack>
      <div className="max-w-3xl mx-auto py-4 px-4 pb-24">
        <div className="mb-6">
          <p className="text-muted-foreground text-sm">Planes personalizados asignados por tu BuddyExpert. Genera tu menú semanal y lista de la compra con un clic.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border-2 border-dashed border-orange-200 dark:border-orange-800">
            <Brain className="h-12 w-12 text-orange-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Aún no tienes planes asignados</h3>
            <p className="text-muted-foreground mb-6">Cuando tu BuddyExpert te asigne un plan personalizado, aparecerá aquí.</p>
            <Link href="/experts">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">Buscar un BuddyExpert</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
