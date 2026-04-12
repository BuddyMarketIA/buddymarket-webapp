import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "@/components/sonner-a11y-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, UserPlus, Home, Settings, Trash2, Mail, Crown, Shield,
  ChevronRight, LogOut, Loader2, Check, X, AlertTriangle
} from "lucide-react";

// ─── Dietary restriction labels ───────────────────────────────────────────────
const DIETARY_OPTIONS = [
  { id: "gluten", label: "Sin gluten" },
  { id: "lactosa", label: "Sin lactosa" },
  { id: "huevo", label: "Sin huevo" },
  { id: "frutos_secos", label: "Sin frutos secos" },
  { id: "mariscos", label: "Sin mariscos" },
  { id: "pescado", label: "Sin pescado" },
  { id: "soja", label: "Sin soja" },
  { id: "vegetariano", label: "Vegetariano" },
  { id: "vegano", label: "Vegano" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
];

const GOAL_OPTIONS = [
  { value: "lose_weight", label: "Perder peso" },
  { value: "maintain", label: "Mantener peso" },
  { value: "gain_muscle", label: "Ganar músculo" },
  { value: "eat_healthy", label: "Comer más sano" },
];

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  if (role === "owner") return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
      <Crown className="w-3 h-3" /> Propietario
    </Badge>
  );
  if (role === "admin") return (
    <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
      <Shield className="w-3 h-3" /> Admin
    </Badge>
  );
  return (
    <Badge variant="secondary" className="gap-1">
      <Users className="w-3 h-3" /> Miembro
    </Badge>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyHousehold({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-6">
        <Home className="w-10 h-10 text-orange-500" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">Crea tu hogar familiar</h2>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        Comparte el menú semanal y la lista de la compra con toda tu familia. Cada miembro puede tener sus propias preferencias y restricciones dietéticas.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-lg w-full">
        {[
          { icon: "🍽️", title: "Menú compartido", desc: "Planifica las comidas de toda la familia" },
          { icon: "🛒", title: "Lista unificada", desc: "Una sola lista de la compra para todos" },
          { icon: "🥗", title: "Preferencias propias", desc: "Cada miembro con sus restricciones" },
        ].map((f) => (
          <div key={f.title} className="bg-card border rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">{f.icon}</div>
            <p className="font-semibold text-sm text-foreground">{f.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
      <Button onClick={onCreate} size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
        <Home className="w-5 h-5" /> Crear mi hogar
      </Button>
    </div>
  );
}

// ─── Create household modal ───────────────────────────────────────────────────
function CreateHouseholdModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const utils = trpc.useUtils();
  const create = trpc.household.create.useMutation({
    onSuccess: () => {
      toast.success("¡Hogar creado! Ahora puedes invitar a tu familia.");
      utils.household.get.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-orange-500" /> Crear hogar familiar
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="household-name">Nombre del hogar</Label>
            <Input
              id="household-name"
              placeholder="Ej: Familia García, Casa de los López..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && name.trim() && create.mutate({ name })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => create.mutate({ name })}
            disabled={!name.trim() || create.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Crear hogar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────
function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const utils = trpc.useUtils();
  const invite = trpc.household.invite.useMutation({
    onSuccess: () => {
      setSent(true);
      utils.household.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleClose = () => {
    setEmail("");
    setSent(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-500" /> Invitar miembro
          </DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-semibold text-foreground">¡Invitación enviada!</p>
            <p className="text-sm text-muted-foreground">
              Hemos enviado un email a <strong>{email}</strong> con el enlace para unirse al hogar.
            </p>
            <Button onClick={handleClose} className="mt-2">Cerrar</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="invite-email">Email del familiar</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="familiar@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Recibirán un email con un enlace para unirse. El enlace expira en 7 días.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button
                onClick={() => invite.mutate({ email, origin: window.location.origin })}
                disabled={!email.trim() || invite.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {invite.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Enviar invitación
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── My preferences modal ─────────────────────────────────────────────────────
function MyPreferencesModal({
  open,
  onClose,
  currentPrefs,
}: {
  open: boolean;
  onClose: () => void;
  currentPrefs: {
    displayName?: string | null;
    dietaryRestrictions?: string[];
    allergies?: string[];
    preferences?: { goal?: string; calories?: number; mealsPerDay?: number };
  };
}) {
  const [displayName, setDisplayName] = useState(currentPrefs.displayName ?? "");
  const [restrictions, setRestrictions] = useState<string[]>(currentPrefs.dietaryRestrictions ?? []);
  const [goal, setGoal] = useState(currentPrefs.preferences?.goal ?? "");
  const [calories, setCalories] = useState(String(currentPrefs.preferences?.calories ?? ""));
  const utils = trpc.useUtils();

  const update = trpc.household.updateMyPreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferencias actualizadas");
      utils.household.get.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleRestriction = (id: string) => {
    setRestrictions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" /> Mis preferencias
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div>
            <Label htmlFor="display-name">Nombre en el hogar</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="¿Cómo quieres que te llamen?"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="mb-2 block">Restricciones dietéticas</Label>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_OPTIONS.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`diet-${opt.id}`}
                    checked={restrictions.includes(opt.id)}
                    onCheckedChange={() => toggleRestriction(opt.id)}
                  />
                  <label htmlFor={`diet-${opt.id}`} className="text-sm cursor-pointer">
                    {opt.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="goal-select">Objetivo nutricional</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger id="goal-select" className="mt-1">
                <SelectValue placeholder="Selecciona tu objetivo" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="calories-input">Calorías diarias objetivo (opcional)</Label>
            <Input
              id="calories-input"
              type="number"
              min={800}
              max={5000}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="Ej: 2000"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() =>
              update.mutate({
                displayName: displayName || undefined,
                dietaryRestrictions: restrictions,
                preferences: {
                  goal: goal as "lose_weight" | "maintain" | "gain_muscle" | "eat_healthy" | undefined || undefined,
                  calories: calories ? Number(calories) : undefined,
                },
              })
            }
            disabled={update.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Familia() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: household, isLoading } = trpc.household.get.useQuery(undefined, {
    enabled: !!user,
  });

  const utils = trpc.useUtils();

  const removeMember = trpc.household.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Miembro eliminado del hogar");
      utils.household.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelInvite = trpc.household.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitación cancelada");
      utils.household.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateName = trpc.household.update.useMutation({
    onSuccess: () => {
      toast.success("Nombre actualizado");
      utils.household.get.invalidate();
      setShowRename(false);
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  if (!household) {
    return (
      <>
        <EmptyHousehold onCreate={() => setShowCreate(true)} />
        <CreateHouseholdModal open={showCreate} onClose={() => setShowCreate(false)} />
      </>
    );
  }

  const myMember = household.members.find((m) => m.userId === user.id);
  const isOwnerOrAdmin = myMember?.role === "owner" || myMember?.role === "admin";

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-5 h-5 text-orange-500" />
            <h1 className="text-2xl font-bold text-foreground">{household.name}</h1>
            {isOwnerOrAdmin && (
              <button
                onClick={() => { setNewName(household.name); setShowRename(true); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Renombrar hogar"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {household.members.length} miembro{household.members.length !== 1 ? "s" : ""}
            {household.pendingInvitations.length > 0 && (
              <span className="ml-2 text-orange-500">
                · {household.pendingInvitations.length} invitación{household.pendingInvitations.length !== 1 ? "es" : ""} pendiente{household.pendingInvitations.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrefs(true)}
            className="gap-1"
          >
            <Settings className="w-4 h-4" /> Mis preferencias
          </Button>
          {isOwnerOrAdmin && (
            <Button
              size="sm"
              onClick={() => setShowInvite(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white gap-1"
            >
              <UserPlus className="w-4 h-4" /> Invitar
            </Button>
          )}
        </div>
      </div>

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" /> Miembros del hogar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {household.members.map((member) => {
            const isMe = member.userId === user.id;
            const restrictions: string[] = member.dietaryRestrictions ?? [];
            const prefs = member.preferences as { goal?: string; calories?: number } | null;

            return (
              <div
                key={member.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={member.userAvatar ?? undefined} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                    {(member.displayName ?? member.userName ?? "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground truncate">
                      {member.displayName ?? member.userName ?? "Sin nombre"}
                    </span>
                    {isMe && <Badge variant="outline" className="text-xs">Tú</Badge>}
                    <RoleBadge role={member.role} />
                  </div>
                  {member.userEmail && (
                    <p className="text-xs text-muted-foreground mt-0.5">{member.userEmail}</p>
                  )}
                  {restrictions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {restrictions.slice(0, 4).map((r) => (
                        <Badge key={r} variant="secondary" className="text-xs py-0">
                          {DIETARY_OPTIONS.find((o) => o.id === r)?.label ?? r}
                        </Badge>
                      ))}
                      {restrictions.length > 4 && (
                        <Badge variant="secondary" className="text-xs py-0">
                          +{restrictions.length - 4} más
                        </Badge>
                      )}
                    </div>
                  )}
                  {prefs?.goal && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Objetivo: {GOAL_OPTIONS.find((o) => o.value === prefs.goal)?.label ?? prefs.goal}
                      {prefs.calories ? ` · ${prefs.calories} kcal/día` : ""}
                    </p>
                  )}
                </div>
                {(isMe || (isOwnerOrAdmin && member.role !== "owner")) && (
                  <button
                    onClick={() => {
                      if (confirm(isMe ? "¿Salir del hogar?" : `¿Eliminar a ${member.displayName ?? member.userName}?`)) {
                        removeMember.mutate({ memberId: member.id });
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-1"
                    aria-label={isMe ? "Salir del hogar" : "Eliminar miembro"}
                  >
                    {isMe ? <LogOut className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {household.pendingInvitations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-orange-500" /> Invitaciones pendientes
            </CardTitle>
            <CardDescription>Esperando que acepten la invitación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {household.pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.invitedEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      Expira: {new Date(inv.expiresAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => cancelInvite.mutate({ invitationId: inv.id })}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Cancelar invitación"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Accesos rápidos del hogar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { href: "/menu", label: "Menú semanal compartido", icon: "🍽️" },
            { href: "/lista-compra", label: "Lista de la compra del hogar", icon: "🛒" },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium text-foreground">{link.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Modals */}
      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />
      {myMember && (
        <MyPreferencesModal
          open={showPrefs}
          onClose={() => setShowPrefs(false)}
          currentPrefs={{
            displayName: myMember.displayName,
            dietaryRestrictions: myMember.dietaryRestrictions,
            allergies: myMember.allergies,
            preferences: myMember.preferences as { goal?: string; calories?: number } | undefined,
          }}
        />
      )}

      {/* Rename modal */}
      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar hogar</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="rename-input">Nuevo nombre</Label>
            <Input
              id="rename-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRename(false)}>Cancelar</Button>
            <Button
              onClick={() => updateName.mutate({ name: newName })}
              disabled={!newName.trim() || updateName.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {updateName.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
