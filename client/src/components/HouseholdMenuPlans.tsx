import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Sparkles, ChevronDown, ChevronUp, Trash2, Calendar, User, Baby } from "lucide-react";

const DAYS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const MEALS = [
  { key: "breakfast", label: "Desayuno", emoji: "☀️" },
  { key: "lunch", label: "Comida", emoji: "🍽️" },
  { key: "snack", label: "Merienda", emoji: "🍎" },
  { key: "dinner", label: "Cena", emoji: "🌙" },
];

const MENU_TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  adults: { label: "Adultos", emoji: "👤", color: "bg-blue-100 text-blue-700" },
  kids: { label: "Niños", emoji: "👶", color: "bg-pink-100 text-pink-700" },
  baby: { label: "Bebé", emoji: "🍼", color: "bg-purple-100 text-purple-700" },
  custom: { label: "Personalizado", emoji: "⚙️", color: "bg-gray-100 text-gray-700" },
  family: { label: "Familiar", emoji: "🏠", color: "bg-orange-100 text-orange-700" },
};

function getWeekMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface Member {
  id: number;
  displayName: string | null;
  userName: string | null;
  userId: number | null;
  memberType?: string | null;
}

interface GenerateMenuDialogProps {
  open: boolean;
  onClose: () => void;
  members: Member[];
}

function GenerateMenuDialog({ open, onClose, members }: GenerateMenuDialogProps) {
  const [memberId, setMemberId] = useState<string>("family");
  const [menuType, setMenuType] = useState<"adults" | "kids" | "baby" | "custom" | "family">("family");
  const [weekDate, setWeekDate] = useState(() => getWeekMonday().toISOString().split("T")[0]);
  const utils = trpc.useUtils();

  const generate = trpc.householdMenus.generateAIMenuPlan.useMutation({
    onSuccess: () => {
      toast.success("¡Menú generado con IA! 🎉");
      utils.householdMenus.listMenuPlans.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedMember = memberId !== "family"
    ? members.find(m => m.id === parseInt(memberId))
    : null;

  const handleGenerate = () => {
    generate.mutate({
      memberId: selectedMember ? selectedMember.id : null,
      memberName: selectedMember
        ? (selectedMember.displayName || selectedMember.userName || "Miembro")
        : undefined,
      menuType,
      weekStartDate: new Date(weekDate).toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Generar menú con IA
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium">¿Para quién?</Label>
            <Select value={memberId} onValueChange={(v) => {
              setMemberId(v);
              if (v === "family") setMenuType("family");
              else {
                const m = members.find(mem => mem.id === parseInt(v));
                if (m?.memberType === "baby") setMenuType("baby");
                else if (m?.memberType === "child") setMenuType("kids");
                else setMenuType("adults");
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar miembro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">🏠 Toda la familia</SelectItem>
                {members.map(m => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.memberType === "baby" ? "🍼" : m.memberType === "child" ? "👶" : "👤"}{" "}
                    {m.displayName || m.userName || `Miembro ${m.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">Tipo de menú</Label>
            <Select value={menuType} onValueChange={(v) => setMenuType(v as typeof menuType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">🏠 Familiar (compatible con todos)</SelectItem>
                <SelectItem value="adults">👤 Adultos</SelectItem>
                <SelectItem value="kids">👶 Niños</SelectItem>
                <SelectItem value="baby">🍼 Bebé</SelectItem>
                <SelectItem value="custom">⚙️ Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">Semana</Label>
            <Input
              type="date"
              value={weekDate}
              onChange={(e) => setWeekDate(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Selecciona el lunes de la semana</p>
          </div>
          <div className="rounded-xl p-3 bg-orange-50 border border-orange-100">
            <p className="text-xs text-orange-700">
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              La IA generará un menú equilibrado teniendo en cuenta las restricciones, alergias y necesidades nutricionales del perfil seleccionado.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {generate.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generando...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generar menú</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MenuPlanCardProps {
  plan: {
    id: number;
    name: string;
    menuType: string;
    weekStartDate: Date | string;
    meals: Record<string, Record<string, string>> | null;
    notes: string | null;
    generatedByAI: boolean;
    memberName?: string | null;
    memberType?: string | null;
  };
  onDelete: (id: number) => void;
}

function MenuPlanCard({ plan, onDelete }: MenuPlanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = MENU_TYPE_LABELS[plan.menuType] || MENU_TYPE_LABELS.adults;
  const weekDate = new Date(plan.weekStartDate);
  const weekLabel = weekDate.toLocaleDateString("es-ES", { day: "numeric", month: "long" });

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xl">{typeInfo.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground truncate">{plan.name}</span>
            {plan.generatedByAI && (
              <Badge className="text-xs bg-purple-100 text-purple-700 border-0">
                <Sparkles className="w-2.5 h-2.5 mr-1" />IA
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Semana del {weekLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && plan.meals && (
        <div className="border-t border-border px-4 py-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr>
                  <th className="text-left py-1.5 pr-3 font-semibold text-muted-foreground w-24">Día</th>
                  {MEALS.map(m => (
                    <th key={m.key} className="text-left py-1.5 px-2 font-semibold text-muted-foreground">
                      {m.emoji} {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => {
                  const dayMeals = plan.meals?.[day.key] || {};
                  return (
                    <tr key={day.key} className="border-t border-border/50">
                      <td className="py-2 pr-3 font-medium text-foreground">{day.label}</td>
                      {MEALS.map(m => (
                        <td key={m.key} className="py-2 px-2 text-muted-foreground">
                          {dayMeals[m.key] || <span className="text-border">—</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {plan.notes && (
            <p className="mt-3 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              📝 {plan.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface HouseholdMenuPlansProps {
  members: Member[];
}

export default function HouseholdMenuPlans({ members }: HouseholdMenuPlansProps) {
  const [showGenerate, setShowGenerate] = useState(false);
  const [activeMemberFilter, setActiveMemberFilter] = useState<string>("all");
  const utils = trpc.useUtils();

  const { data: plans = [], isLoading } = trpc.householdMenus.listMenuPlans.useQuery({});

  const deletePlan = trpc.householdMenus.deleteMenuPlan.useMutation({
    onSuccess: () => {
      toast.success("Menú eliminado");
      utils.householdMenus.listMenuPlans.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filteredPlans = activeMemberFilter === "all"
    ? plans
    : activeMemberFilter === "family"
      ? plans.filter(p => p.memberId === null)
      : plans.filter(p => p.memberId === parseInt(activeMemberFilter));

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
            <span className="text-lg">🍽️</span>
          </div>
          <div>
            <h2 className="font-bold text-foreground text-sm">Menús del Hogar</h2>
            <p className="text-xs text-muted-foreground">Planifica por persona o para toda la familia</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setShowGenerate(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generar con IA
        </Button>
      </div>

      {/* Member filter tabs */}
      <div className="px-4 py-2.5 border-b border-border flex gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveMemberFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeMemberFilter === "all"
              ? "bg-orange-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setActiveMemberFilter("family")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeMemberFilter === "family"
              ? "bg-orange-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🏠 Familiar
        </button>
        {members.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveMemberFilter(String(m.id))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeMemberFilter === String(m.id)
                ? "bg-orange-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {m.memberType === "baby" ? "🍼" : m.memberType === "child" ? "👶" : "👤"}
            {m.displayName || m.userName || `Miembro ${m.id}`}
          </button>
        ))}
      </div>

      {/* Plans list */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-3xl mb-3 block">🍽️</span>
            <p className="text-sm font-medium text-foreground mb-1">Sin menús todavía</p>
            <p className="text-xs text-muted-foreground mb-4">
              Genera un menú personalizado con IA para cada miembro del hogar
            </p>
            <Button
              size="sm"
              onClick={() => setShowGenerate(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generar primer menú
            </Button>
          </div>
        ) : (
          filteredPlans.map(plan => (
            <MenuPlanCard
              key={plan.id}
              plan={{
                ...plan,
                weekStartDate: plan.weekStartDate,
                meals: plan.meals as Record<string, Record<string, string>> | null,
              }}
              onDelete={(id) => deletePlan.mutate({ planId: id })}
            />
          ))
        )}
      </div>

      <GenerateMenuDialog
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        members={members}
      />
    </div>
  );
}
