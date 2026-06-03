import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Home,
  Users,
  Plus,
  Mail,
  MessageCircle,
  Crown,
  UserCheck,
  UserX,
  Settings,
  ChevronRight,
  Baby,
  User,
  Copy,
  X,
  Edit2,
  Check,
  AlertCircle,
  Utensils,
  ShoppingCart,
  Star,
} from "lucide-react";

type HouseholdView = "overview" | "members" | "invite" | "settings" | "member_detail";

const DIETARY_OPTIONS = [
  "Vegetariano", "Vegano", "Sin gluten", "Sin lactosa", "Sin frutos secos",
  "Sin mariscos", "Halal", "Kosher", "Bajo en sodio", "Diabético",
  "Sin huevo", "Sin soja", "Keto", "Paleo",
];

const GOAL_OPTIONS = [
  { value: "lose_weight", label: "Perder peso", emoji: "⚖️" },
  { value: "maintain", label: "Mantener peso", emoji: "🎯" },
  { value: "gain_muscle", label: "Ganar músculo", emoji: "💪" },
  { value: "eat_healthy", label: "Comer sano", emoji: "🥗" },
];

export default function Household() {
  const { user } = useAuth();
  const [view, setView] = useState<HouseholdView>("overview");
  const [inviteEmail, setInviteEmail] = useState("");
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  const utils = trpc.useUtils();

  const { data: household, isLoading } = trpc.household.get.useQuery(undefined, { enabled: !!user });

  const createMut = trpc.household.create.useMutation({
    onSuccess: () => {
      utils.household.get.invalidate();
      setShowCreateForm(false);
      setNewHouseholdName("");
      toast.success("¡Hogar creado! Ahora puedes invitar a tu familia.");
    },
    onError: (err) => toast.error(err.message),
  });

  const inviteMut = trpc.household.invite.useMutation({
    onSuccess: (data) => {
      utils.household.get.invalidate();
      setInviteEmail("");
      toast.success("Invitación enviada por email");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMemberMut = trpc.household.removeMember.useMutation({
    onSuccess: () => {
      utils.household.get.invalidate();
      toast.success("Miembro eliminado del hogar");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMut = trpc.household.update.useMutation({
    onSuccess: () => {
      utils.household.get.invalidate();
      setEditingName(false);
      toast.success("Nombre del hogar actualizado");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMut.mutate({ email: inviteEmail.trim(), origin: window.location.origin });
  };

  const handleWhatsAppInvite = () => {
    if (!household) return;
    const inviteText = `¡Hola! Te invito a unirte a nuestro hogar "${household.name}" en BuddyOne para compartir menús y listas de la compra. Regístrate en buddyone.io y te envío la invitación.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/familia`);
    toast.success("Enlace copiado al portapapeles");
  };

  const selectedMember = household?.members.find(m => m.id === selectedMemberId);

  if (isLoading) {
    return (
      <div className="vively-page pb-32 space-y-4">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
    );
  }

  // ── NO HOUSEHOLD ──
  if (!household) {
    return (
      <div className="vively-page pb-32">
        {/* Hero */}
        <div className="rounded-3xl p-6 mb-6 bg-gradient-to-br from-violet-500/10 via-purple-400/5 to-background border border-violet-500/20 relative overflow-hidden">
          <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full bg-violet-500/10" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/15 flex items-center justify-center text-3xl mb-4">🏠</div>
            <h1 className="text-2xl font-black text-foreground mb-2">Modo Hogar</h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Crea tu hogar familiar y comparte menús semanales, listas de la compra y planes nutricionales adaptados a cada miembro de tu familia.
            </p>
            <Badge className="bg-violet-500 text-white text-xs mb-4">Exclusivo Pro Max</Badge>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          {[
            { emoji: "👨‍👩‍👧‍👦", title: "Hasta 6 miembros", desc: "Añade a toda tu familia con perfiles individuales" },
            { emoji: "🍽️", title: "Menús personalizados", desc: "Un menú para todos o menús separados por persona (diabético, niños, vegano...)" },
            { emoji: "🛒", title: "Lista de la compra unificada", desc: "Se genera automáticamente sumando las necesidades de todos" },
            { emoji: "📩", title: "Invitaciones fáciles", desc: "Por email o WhatsApp — en segundos" },
          ].map((f, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 flex items-start gap-3 border border-border/50">
              <span className="text-2xl shrink-0">{f.emoji}</span>
              <div>
                <p className="text-sm font-700 text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Create form */}
        {showCreateForm ? (
          <div className="bg-card rounded-3xl p-5 border border-violet-500/30">
            <h3 className="text-sm font-700 text-foreground mb-3 flex items-center gap-2">
              <Home className="w-4 h-4 text-violet-500" /> Nombre de tu hogar
            </h3>
            <Input
              placeholder="Ej: Familia García, Casa de los López..."
              value={newHouseholdName}
              onChange={e => setNewHouseholdName(e.target.value)}
              className="rounded-xl mb-3"
              onKeyDown={e => e.key === "Enter" && createMut.mutate({ name: newHouseholdName })}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => createMut.mutate({ name: newHouseholdName })}
                disabled={!newHouseholdName.trim() || createMut.isPending}
                className="flex-1 bg-violet-500 hover:bg-violet-600 text-white rounded-xl"
              >
                {createMut.isPending ? "Creando..." : "Crear hogar"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)} className="rounded-xl">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-2xl py-4 text-base font-700"
          >
            <Plus className="w-5 h-5 mr-2" /> Crear mi hogar familiar
          </Button>
        )}
      </div>
    );
  }

  // ── MEMBER DETAIL ──
  if (view === "member_detail" && selectedMember) {
    return (
      <div className="vively-page pb-32">
        <button onClick={() => setView("members")} className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
          ← Volver a miembros
        </button>
        <div className="bg-card rounded-3xl p-5 border border-border/50 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/15 flex items-center justify-center text-3xl">
              {selectedMember.role === "owner" ? "👑" : "👤"}
            </div>
            <div>
              <h2 className="text-lg font-800 text-foreground">{selectedMember.displayName || selectedMember.userName || "Miembro"}</h2>
              <p className="text-xs text-muted-foreground">{selectedMember.userEmail}</p>
              <Badge variant="outline" className="text-[10px] mt-1">
                {selectedMember.role === "owner" ? "Propietario" : selectedMember.role === "admin" ? "Administrador" : "Miembro"}
              </Badge>
            </div>
          </div>

          {/* Dietary restrictions */}
          {selectedMember.dietaryRestrictions && selectedMember.dietaryRestrictions.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-700 text-muted-foreground mb-2">Restricciones dietéticas</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedMember.dietaryRestrictions.map((r: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Allergies */}
          {selectedMember.allergies && selectedMember.allergies.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-700 text-muted-foreground mb-2">Alergias</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedMember.allergies.map((a: string, i: number) => (
                  <Badge key={i} className="text-xs bg-red-500/10 text-red-600 border-red-500/20">{a}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Goal */}
          {selectedMember.preferences?.goal && (
            <div>
              <p className="text-xs font-700 text-muted-foreground mb-1">Objetivo nutricional</p>
              <p className="text-sm text-foreground">
                {GOAL_OPTIONS.find(g => g.value === selectedMember.preferences?.goal)?.emoji}{" "}
                {GOAL_OPTIONS.find(g => g.value === selectedMember.preferences?.goal)?.label}
              </p>
            </div>
          )}
        </div>

        {/* Remove member (only owner can) */}
        {household.myRole === "owner" && selectedMember.role !== "owner" && (
          <Button
            variant="outline"
            className="w-full rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5"
            onClick={() => {
              if (confirm(`¿Eliminar a ${selectedMember.displayName || selectedMember.userName} del hogar?`)) {
                removeMemberMut.mutate({ memberId: selectedMember.id });
                setView("members");
              }
            }}
          >
            <UserX className="w-4 h-4 mr-2" /> Eliminar del hogar
          </Button>
        )}
      </div>
    );
  }

  // ── INVITE VIEW ──
  if (view === "invite") {
    return (
      <div className="vively-page pb-32">
        <button onClick={() => setView("overview")} className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
          ← Volver al hogar
        </button>

        <div className="bg-card rounded-3xl p-5 border border-border/50 mb-4">
          <h2 className="text-base font-800 text-foreground mb-1 flex items-center gap-2">
            <Mail className="w-5 h-5 text-violet-500" /> Invitar por email
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Se enviará un email con el enlace de invitación</p>
          <div className="flex gap-2">
            <Input
              placeholder="email@ejemplo.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              type="email"
              className="rounded-xl flex-1"
              onKeyDown={e => e.key === "Enter" && handleInvite()}
            />
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviteMut.isPending}
              className="bg-violet-500 hover:bg-violet-600 text-white rounded-xl shrink-0"
            >
              {inviteMut.isPending ? "..." : "Enviar"}
            </Button>
          </div>
        </div>

        {/* WhatsApp invite */}
        <button
          onClick={handleWhatsAppInvite}
          className="w-full bg-[#25D366]/10 border border-[#25D366]/30 rounded-3xl p-5 flex items-center gap-4 mb-4 hover:bg-[#25D366]/15 transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-700 text-foreground">Invitar por WhatsApp</p>
            <p className="text-xs text-muted-foreground mt-0.5">Comparte el enlace directamente por WhatsApp</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
        </button>

        {/* Copy link */}
        <button
          onClick={handleCopyLink}
          className="w-full bg-card border border-border/50 rounded-3xl p-5 flex items-center gap-4 mb-6 hover:border-violet-500/30 transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
            <Copy className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-700 text-foreground">Copiar enlace de BuddyOne</p>
            <p className="text-xs text-muted-foreground mt-0.5">buddyone.io/familia</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
        </button>

        {/* Pending invitations */}
        {household.pendingInvitations && household.pendingInvitations.length > 0 && (
          <div>
            <h3 className="text-sm font-700 text-foreground mb-3">Invitaciones pendientes</h3>
            <div className="space-y-2">
              {household.pendingInvitations.map((inv) => (
                <div key={inv.id} className="bg-card rounded-2xl p-3 flex items-center gap-3 border border-border/50">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-600 text-foreground truncate">{inv.invitedEmail}</p>
                    <p className="text-xs text-muted-foreground">Pendiente de aceptar</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">Pendiente</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── MEMBERS VIEW ──
  if (view === "members") {
    return (
      <div className="vively-page pb-32">
        <button onClick={() => setView("overview")} className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
          ← Volver al hogar
        </button>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-800 text-foreground">Miembros del hogar</h2>
          <Badge variant="outline" className="text-xs">{household.members.length}/{household.maxMembers || 6}</Badge>
        </div>

        <div className="space-y-2 mb-4">
          {household.members.map((member) => (
            <button
              key={member.id}
              onClick={() => { setSelectedMemberId(member.id); setView("member_detail"); }}
              className="w-full bg-card rounded-2xl p-4 flex items-center gap-3 border border-border/50 hover:border-violet-500/30 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-xl shrink-0">
                {member.role === "owner" ? "👑" : "👤"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-700 text-foreground truncate">{member.displayName || member.userName || "Miembro"}</p>
                  {member.role === "owner" && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{member.userEmail}</p>
                {member.dietaryRestrictions && member.dietaryRestrictions.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {member.dietaryRestrictions.slice(0, 2).map((r: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">{r}</Badge>
                    ))}
                    {member.dietaryRestrictions.length > 2 && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">+{member.dietaryRestrictions.length - 2}</Badge>
                    )}
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>

        {household.myRole === "owner" && household.members.length < (household.maxMembers || 6) && (
          <Button
            onClick={() => setView("invite")}
            className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-2xl"
          >
            <Plus className="w-4 h-4 mr-2" /> Añadir miembro
          </Button>
        )}
      </div>
    );
  }

  // ── MAIN OVERVIEW ──
  return (
    <div className="vively-page pb-32">
      {/* Household header */}
      <div className="rounded-3xl p-5 mb-5 bg-gradient-to-br from-violet-500/10 via-purple-400/5 to-background border border-violet-500/20 relative overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full bg-violet-500/10" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center text-2xl">🏠</div>
              <div>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="h-7 text-sm rounded-lg py-0 px-2 w-36"
                      autoFocus
                    />
                    <button onClick={() => updateMut.mutate({ name: editName })} className="text-emerald-500">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingName(false)} className="text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-800 text-foreground">{household.name}</h1>
                    {household.myRole === "owner" && (
                      <button onClick={() => { setEditName(household.name); setEditingName(true); }} className="text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{household.members.length} miembro{household.members.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <Badge className="bg-violet-500 text-white text-xs">Pro Max</Badge>
          </div>

          {/* Member avatars */}
          <div className="flex items-center gap-1.5">
            {household.members.slice(0, 5).map((m, i) => (
              <div key={m.id} className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm border-2 border-background" style={{ marginLeft: i > 0 ? "-8px" : "0" }}>
                {m.role === "owner" ? "👑" : "👤"}
              </div>
            ))}
            {household.members.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-700 text-muted-foreground border-2 border-background" style={{ marginLeft: "-8px" }}>
                +{household.members.length - 5}
              </div>
            )}
            {household.members.length < (household.maxMembers || 6) && household.myRole === "owner" && (
              <button
                onClick={() => setView("invite")}
                className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center border-2 border-dashed border-violet-500/40 ml-1"
                style={{ marginLeft: "-4px" }}
              >
                <Plus className="w-3.5 h-3.5 text-violet-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => setView("members")}
          className="bg-card rounded-2xl p-4 flex flex-col items-start gap-2 border border-border/50 hover:border-violet-500/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-700 text-foreground">Miembros</p>
            <p className="text-xs text-muted-foreground">{household.members.length} personas</p>
          </div>
        </button>

        <button
          onClick={() => setView("invite")}
          className="bg-card rounded-2xl p-4 flex flex-col items-start gap-2 border border-border/50 hover:border-violet-500/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-700 text-foreground">Invitar</p>
            <p className="text-xs text-muted-foreground">Email o WhatsApp</p>
          </div>
        </button>

        <button
          onClick={() => toast.info("Menús familiares — Próximamente")}
          className="bg-card rounded-2xl p-4 flex flex-col items-start gap-2 border border-border/50 hover:border-orange-500/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Utensils className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-700 text-foreground">Menús familia</p>
            <Badge variant="outline" className="text-[9px] mt-0.5">Próximamente</Badge>
          </div>
        </button>

        <button
          onClick={() => toast.info("Lista de la compra familiar — Próximamente")}
          className="bg-card rounded-2xl p-4 flex flex-col items-start gap-2 border border-border/50 hover:border-blue-500/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-700 text-foreground">Lista familia</p>
            <Badge variant="outline" className="text-[9px] mt-0.5">Próximamente</Badge>
          </div>
        </button>
      </div>

      {/* Members preview */}
      <div className="bg-card rounded-3xl p-4 border border-border/50 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-700 text-foreground">Tu familia</h3>
          <button onClick={() => setView("members")} className="text-xs text-violet-500 font-600">Ver todos →</button>
        </div>
        <div className="space-y-2">
          {household.members.slice(0, 3).map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-base shrink-0">
                {member.role === "owner" ? "👑" : "👤"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-600 text-foreground truncate">{member.displayName || member.userName || "Miembro"}</p>
                {member.dietaryRestrictions && member.dietaryRestrictions.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">{member.dietaryRestrictions.join(", ")}</p>
                )}
              </div>
              {member.preferences?.goal && (
                <span className="text-base">{GOAL_OPTIONS.find(g => g.value === member.preferences?.goal)?.emoji}</span>
              )}
            </div>
          ))}
          {household.members.length > 3 && (
            <p className="text-xs text-muted-foreground text-center pt-1">+{household.members.length - 3} miembros más</p>
          )}
        </div>
      </div>

      {/* Coming soon features */}
      <div className="bg-gradient-to-br from-violet-500/5 to-background rounded-3xl p-5 border border-violet-500/15">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-700 text-foreground">Próximamente en Modo Hogar</h3>
        </div>
        <div className="space-y-2">
          {[
            "Menú semanal familiar con variantes por persona",
            "Menú adultos + Menú niños + Menú especial (diabético, celíaco...)",
            "Lista de la compra unificada de toda la familia",
            "Nutrición infantil por edad y etapa de desarrollo",
            "Recetas adaptadas para toda la familia a la vez",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
