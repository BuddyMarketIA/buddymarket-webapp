/**
 * B2B Equipos Nutricionales — Plan B2B para nutricionistas
 * El nutricionista crea equipos de hasta 10 personas con condiciones similares,
 * gestiona miembros y genera planes nutricionales grupales con IA.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Plus, Users, Building2, Target, Sparkles, ChevronRight,
  Trash2, UserPlus, FileText, Loader2, CheckCircle, X, Eye
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

const GOAL_OPTIONS = [
  { value: "weight_loss", label: "Pérdida de peso", emoji: "⚖️" },
  { value: "muscle_gain", label: "Ganancia muscular", emoji: "💪" },
  { value: "energy_performance", label: "Energía y rendimiento", emoji: "⚡" },
  { value: "stress_management", label: "Gestión del estrés", emoji: "🧘" },
  { value: "balanced_diet", label: "Dieta equilibrada", emoji: "🥗" },
  { value: "cardiovascular_health", label: "Salud cardiovascular", emoji: "❤️" },
  { value: "digestive_health", label: "Salud digestiva", emoji: "🌿" },
  { value: "diabetes_management", label: "Control de diabetes", emoji: "🩺" },
  { value: "other", label: "Otro", emoji: "🎯" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Hombre" },
  { value: "female", label: "Mujer" },
  { value: "other", label: "Otro" },
];

type View = "list" | "team-detail";

export default function B2BCorporate() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("list");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showPlanView, setShowPlanView] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<{ title: string; content: string; recommendations: string } | null>(null);

  const [teamForm, setTeamForm] = useState({
    name: "", companyName: "", goal: "", conditions: "", dietaryRestrictions: "", notes: ""
  });
  const [memberForm, setMemberForm] = useState({
    name: "", email: "", age: "", gender: "", weight: "", height: "", specificConditions: ""
  });

  const utils = trpc.useUtils();

  const { data: teams = [], isLoading: teamsLoading } = trpc.b2bTeams.listTeams.useQuery(undefined, { enabled: !!user });
  const { data: teamDetail, isLoading: detailLoading } = trpc.b2bTeams.getTeamDetail.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId && view === "team-detail" }
  );

  const createTeamMut = trpc.b2bTeams.createTeam.useMutation({
    onSuccess: () => {
      toast.success("Equipo creado correctamente");
      setShowCreateTeam(false);
      setTeamForm({ name: "", companyName: "", goal: "", conditions: "", dietaryRestrictions: "", notes: "" });
      utils.b2bTeams.listTeams.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const addMemberMut = trpc.b2bTeams.addMember.useMutation({
    onSuccess: () => {
      toast.success("Miembro añadido al equipo");
      setShowAddMember(false);
      setMemberForm({ name: "", email: "", age: "", gender: "", weight: "", height: "", specificConditions: "" });
      if (selectedTeamId) utils.b2bTeams.getTeamDetail.invalidate({ teamId: selectedTeamId });
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMemberMut = trpc.b2bTeams.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Miembro eliminado");
      if (selectedTeamId) utils.b2bTeams.getTeamDetail.invalidate({ teamId: selectedTeamId });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteTeamMut = trpc.b2bTeams.deleteTeam.useMutation({
    onSuccess: () => {
      toast.success("Equipo eliminado");
      setView("list");
      setSelectedTeamId(null);
      utils.b2bTeams.listTeams.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const generatePlanMut = trpc.b2bTeams.generateTeamPlan.useMutation({
    onSuccess: (plan) => {
      toast.success("Plan grupal generado con IA");
      if (selectedTeamId) utils.b2bTeams.getTeamDetail.invalidate({ teamId: selectedTeamId });
      setViewingPlan({ title: plan.title, content: plan.planContent ?? "", recommendations: plan.recommendations ?? "" });
      setShowPlanView(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const goalInfo = (goal: string) => GOAL_OPTIONS.find(g => g.value === goal) ?? { emoji: "🎯", label: goal };

  /* ─── VISTA: Lista de equipos ─────────────────────────────────────────────── */
  if (view === "list") {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/app/expert/dashboard">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-orange-500" />
                  Plan B2B Empresas
                </h1>
                <p className="text-sm text-muted-foreground">Equipos nutricionales de hasta 10 personas</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateTeam(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Plus className="w-4 h-4" /> Nuevo equipo
            </Button>
          </div>

          {/* Hero */}
          <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Nutrición grupal inteligente</h2>
                <p className="text-white/85 text-sm max-w-lg">
                  Crea equipos de empleados con condiciones similares y genera planes nutricionales
                  personalizados para todo el grupo con un solo clic. La IA adapta las recomendaciones
                  a las características comunes del equipo.
                </p>
              </div>
              <span className="text-4xl">🏢</span>
            </div>
            <div className="flex gap-6 mt-5">
              {[
                { icon: "👥", label: "Máx. 10 personas", desc: "por equipo" },
                { icon: "🤖", label: "Plan con IA", desc: "en segundos" },
                { icon: "🎯", label: "Objetivo común", desc: "personalizado" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2">
                  <span className="text-xl">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{f.label}</p>
                    <p className="text-xs text-white/70">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {teamsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border-2 border-dashed border-orange-200" style={{ background: "#FFF7F0" }}>
              <span className="text-5xl block mb-4">👥</span>
              <h3 className="text-lg font-semibold text-orange-800 mb-2">Crea tu primer equipo</h3>
              <p className="text-sm text-orange-600 mb-6 max-w-sm mx-auto">
                Agrupa a tus clientes de empresa con objetivos y condiciones similares para generar planes nutricionales grupales eficientes.
              </p>
              <Button onClick={() => setShowCreateTeam(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Plus className="w-4 h-4" /> Crear primer equipo
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {teams.map((team) => {
                const goal = goalInfo(team.goal);
                return (
                  <button
                    key={team.id}
                    onClick={() => { setSelectedTeamId(team.id); setView("team-detail"); }}
                    className="w-full text-left rounded-2xl p-5 border transition-all hover:shadow-md"
                    style={{ background: "white", borderColor: "#FFE4CC" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "#FFF3E8" }}>
                          {goal.emoji}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">{team.name}</h3>
                          {team.companyName && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {team.companyName}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">
                              {goal.emoji} {goal.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" /> {team.memberCount}/10 miembros
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {team.lastPlan && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" /> Plan activo
                          </Badge>
                        )}
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Crear equipo */}
        <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" /> Crear nuevo equipo
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Nombre del equipo *</Label>
                  <Input placeholder="Ej: Equipo Comercial Madrid" value={teamForm.name} onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Empresa cliente (opcional)</Label>
                  <Input placeholder="Ej: Empresa ABC S.L." value={teamForm.companyName} onChange={e => setTeamForm(f => ({ ...f, companyName: e.target.value }))} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Objetivo común del equipo *</Label>
                  <Select value={teamForm.goal} onValueChange={v => setTeamForm(f => ({ ...f, goal: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona un objetivo" /></SelectTrigger>
                    <SelectContent>
                      {GOAL_OPTIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.emoji} {g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Condiciones similares del grupo</Label>
                  <Textarea placeholder="Ej: Sedentarismo laboral, estrés crónico, horarios irregulares..." value={teamForm.conditions} onChange={e => setTeamForm(f => ({ ...f, conditions: e.target.value }))} className="mt-1 resize-none" rows={2} />
                </div>
                <div className="col-span-2">
                  <Label>Restricciones dietéticas comunes</Label>
                  <Input placeholder="Ej: Sin gluten, vegetarianos, intolerancia a la lactosa..." value={teamForm.dietaryRestrictions} onChange={e => setTeamForm(f => ({ ...f, dietaryRestrictions: e.target.value }))} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Notas adicionales</Label>
                  <Textarea placeholder="Cualquier información relevante para el plan..." value={teamForm.notes} onChange={e => setTeamForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 resize-none" rows={2} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateTeam(false)}>Cancelar</Button>
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" disabled={!teamForm.name.trim() || !teamForm.goal || createTeamMut.isPending}
                  onClick={() => createTeamMut.mutate({ name: teamForm.name, companyName: teamForm.companyName || undefined, goal: teamForm.goal, conditions: teamForm.conditions || undefined, dietaryRestrictions: teamForm.dietaryRestrictions || undefined, notes: teamForm.notes || undefined })}>
                  {createTeamMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear equipo"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /* ─── VISTA: Detalle del equipo ───────────────────────────────────────────── */
  if (view === "team-detail" && selectedTeamId) {
    const team = teamDetail?.team;
    const members = teamDetail?.members ?? [];
    const plans = teamDetail?.plans ?? [];
    const goal = team ? goalInfo(team.goal) : { emoji: "🎯", label: "" };

    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { setView("list"); setSelectedTeamId(null); }}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{team?.name ?? "Cargando..."}</h1>
                {team?.companyName && <p className="text-sm text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" /> {team.companyName}</p>}
              </div>
            </div>
            {team && (
              <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 gap-1"
                onClick={() => { if (confirm("¿Eliminar este equipo?")) deleteTeamMut.mutate({ teamId: selectedTeamId }); }}>
                <Trash2 className="w-4 h-4" /> Eliminar
              </Button>
            )}
          </div>

          {detailLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
          ) : (
            <>
              {/* Info del equipo */}
              <div className="rounded-2xl p-5 border" style={{ background: "#FFF7F0", borderColor: "#FFE4CC" }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{goal.emoji}</span>
                  <div>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">{goal.label}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">{members.length}/10 miembros</p>
                  </div>
                </div>
                {team?.conditions && <p className="text-sm text-orange-800 mb-1"><strong>Condiciones:</strong> {team.conditions}</p>}
                {team?.dietaryRestrictions && <p className="text-sm text-orange-800 mb-1"><strong>Restricciones:</strong> {team.dietaryRestrictions}</p>}
                {team?.notes && <p className="text-sm text-orange-800"><strong>Notas:</strong> {team.notes}</p>}
              </div>

              {/* Miembros */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" /> Miembros ({members.length}/10)
                  </h2>
                  {members.length < 10 && (
                    <Button size="sm" onClick={() => setShowAddMember(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-1">
                      <UserPlus className="w-4 h-4" /> Añadir
                    </Button>
                  )}
                </div>
                {members.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl border-2 border-dashed border-orange-200" style={{ background: "#FFF7F0" }}>
                    <Users className="w-10 h-10 text-orange-300 mx-auto mb-2" />
                    <p className="text-sm text-orange-600 mb-3">Añade miembros para generar un plan grupal</p>
                    <Button size="sm" onClick={() => setShowAddMember(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-1">
                      <UserPlus className="w-4 h-4" /> Añadir primer miembro
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between rounded-xl p-4 border" style={{ background: "white", borderColor: "#FFE4CC" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{m.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[m.age ? `${m.age} años` : null, m.gender === "male" ? "H" : m.gender === "female" ? "M" : null, m.weight ? `${m.weight}kg` : null, m.height ? `${m.height}cm` : null].filter(Boolean).join(" · ")}
                            </p>
                            {m.specificConditions && <p className="text-xs text-orange-600 mt-0.5">{m.specificConditions}</p>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeMemberMut.mutate({ memberId: m.id, teamId: selectedTeamId })}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Generar plan */}
              {members.length > 0 && (
                <div className="rounded-2xl p-5 border" style={{ background: "linear-gradient(135deg, #FFF3E8, #FFF7F0)", borderColor: "#FFE4CC" }}>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" /> Generar plan grupal con IA
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    La IA creará un plan nutricional semanal completo para los {members.length} miembros del equipo,
                    incluyendo menú, recomendaciones y adaptaciones individuales.
                  </p>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2" disabled={generatePlanMut.isPending}
                    onClick={() => generatePlanMut.mutate({ teamId: selectedTeamId })}>
                    {generatePlanMut.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando plan con IA...</>
                      : <><Sparkles className="w-4 h-4" /> Generar plan nutricional grupal</>}
                  </Button>
                </div>
              )}

              {/* Planes generados */}
              {plans.length > 0 && (
                <div>
                  <h2 className="font-semibold text-base flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-orange-500" /> Planes generados ({plans.length})
                  </h2>
                  <div className="grid gap-3">
                    {plans.map((plan) => (
                      <div key={plan.id} className="flex items-center justify-between rounded-xl p-4 border" style={{ background: "white", borderColor: "#FFE4CC" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            {plan.isAiGenerated ? <Sparkles className="w-5 h-5 text-orange-500" /> : <FileText className="w-5 h-5 text-orange-500" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{plan.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(plan.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                              {plan.isAiGenerated && <span className="ml-2 text-orange-500">· IA</span>}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                          onClick={() => { setViewingPlan({ title: plan.title, content: plan.planContent ?? "", recommendations: plan.recommendations ?? "" }); setShowPlanView(true); }}>
                          <Eye className="w-4 h-4" /> Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal: Añadir miembro */}
        <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-orange-500" /> Añadir miembro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Nombre completo *</Label>
                  <Input placeholder="Ej: Ana García" value={memberForm.name} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Email (opcional)</Label>
                  <Input type="email" placeholder="ana@empresa.com" value={memberForm.email} onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Edad</Label>
                  <Input type="number" placeholder="35" value={memberForm.age} onChange={e => setMemberForm(f => ({ ...f, age: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Género</Label>
                  <Select value={memberForm.gender} onValueChange={v => setMemberForm(f => ({ ...f, gender: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Peso (kg)</Label>
                  <Input type="number" placeholder="70" value={memberForm.weight} onChange={e => setMemberForm(f => ({ ...f, weight: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Altura (cm)</Label>
                  <Input type="number" placeholder="170" value={memberForm.height} onChange={e => setMemberForm(f => ({ ...f, height: e.target.value }))} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Condiciones específicas individuales</Label>
                  <Textarea placeholder="Variaciones respecto al grupo: alergias, patologías específicas..." value={memberForm.specificConditions} onChange={e => setMemberForm(f => ({ ...f, specificConditions: e.target.value }))} className="mt-1 resize-none" rows={2} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddMember(false)}>Cancelar</Button>
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" disabled={!memberForm.name.trim() || addMemberMut.isPending}
                  onClick={() => addMemberMut.mutate({ teamId: selectedTeamId!, name: memberForm.name, email: memberForm.email || undefined, age: memberForm.age ? parseInt(memberForm.age) : undefined, gender: (memberForm.gender as "male" | "female" | "other") || undefined, weight: memberForm.weight ? parseInt(memberForm.weight) : undefined, height: memberForm.height ? parseInt(memberForm.height) : undefined, specificConditions: memberForm.specificConditions || undefined })}>
                  {addMemberMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Añadir miembro"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Ver plan */}
        <Dialog open={showPlanView} onOpenChange={setShowPlanView}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-orange-500" /> {viewingPlan?.title}</DialogTitle>
            </DialogHeader>
            {viewingPlan && (
              <div className="space-y-4 pt-2">
                {viewingPlan.recommendations && (
                  <div className="rounded-xl p-4" style={{ background: "#FFF3E8", border: "1px solid #FFE4CC" }}>
                    <h4 className="font-semibold text-sm text-orange-800 mb-2 flex items-center gap-1"><Target className="w-4 h-4" /> Recomendaciones clave</h4>
                    <div className="text-sm text-orange-700 whitespace-pre-wrap">{viewingPlan.recommendations}</div>
                  </div>
                )}
                <div className="rounded-xl p-4 border" style={{ borderColor: "#FFE4CC" }}>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-1"><FileText className="w-4 h-4 text-orange-500" /> Plan completo</h4>
                  <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{viewingPlan.content}</div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
